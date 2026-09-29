// Ads Editor (#/ads): upload an ad's raw footage, say what you want, and get it back cut, graded, with motion
// graphics and sound effects — previewed in the app, then saved as an MP4 or opened in the timeline editor.
// Owns ads/ and data/ads/. See ads/README.md.
//
// The footage is an ordinary project (uploaded through POST /api/projects with autoPick=false, so it's only
// transcribed). The ad is that project's "ad" clip, and its edit is an editor document (ads/build.js), so the
// timeline editor, previews and renders all work on it without anything special.
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import os from "node:os";
import crypto from "node:crypto";
import { FFMPEG, FFPROBE, run } from "../lib/tools.js";
import { ASPECTS } from "../lib/compose.js";
import { listLuts, lutFilter } from "../lib/luts.js";
import { findSilences, fitWordsToSpeech } from "../lib/silence.js";
import { measureLevels } from "../lib/levels.js";
import { transcribe } from "../lib/transcribe.js";
import { trackerBinary } from "../lib/subject.js";
import { loadProject, projectDir, saveProject } from "../lib/store.js";
import { workingFile } from "../lib/work.js";
import { clipFocus, finishedRender, isRendering, queueRender, cancelRender } from "../lib/pipeline.js";
import { projectWords } from "../editor/document.js";
import { ensureMattes } from "../editor/director/matte.js";
import { TEMPLATES } from "./templates/index.js";
import { DATA_DIR as EDITOR_DIR } from "../editor/media.js";
import { sourceLevels } from "./levels.js";
import { AD_CLIP, HISTORY_DIR, PALETTES, buildAdDocument, captionClips, readAdDocument, writeAdDocument } from "./build.js";
import { GRADES, LOOKS, SFX } from "./graphics.js";
import { LOGOS_DIR, sfxFile } from "./layers.js";
import { DATA_DIR, findAd, load, newId, persist, readSettings, update, writeSettings } from "./store.js";
import { DIRECTIONS, OFFERS, hasClaudeKey, offerCtaStyles, offerOf, planAd } from "./plan.js";
import { VOICE_FX_DIR, ensureVoiceFx } from "./voicefx.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUSY = new Set(["queued", "downloading", "probing", "preparing", "transcribing", "analyzing"]);
const clean = (s, max = 2000) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// How long each sound effect is, measured once.
const sfxLengths = new Map();
async function measureSfx() {
  for (const name of Object.keys(SFX)) {
    if (sfxLengths.has(name)) continue;
    const file = sfxFile(name);
    if (!existsSync(file)) continue;
    let out = "";
    await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { onLine: (l) => (out += l) }).catch(() => {});
    const sec = Number.parseFloat(out);
    if (Number.isFinite(sec)) sfxLengths.set(name, sec);
  }
  await measureSfxLoudness();
}

/** Each effect's loudest 400 ms (LUFS), for the loudness guard in build.js. Cached in data/ads/sfx-loudness.json. */
const sfxLoud = new Map();
const LOUD_FILE = path.join(DATA_DIR, "sfx-loudness.json");
async function measureSfxLoudness() {
  const saved = await fs.readFile(LOUD_FILE, "utf8").then(JSON.parse, () => ({}));
  let changed = false;
  for (const name of Object.keys(SFX)) {
    const file = sfxFile(name);
    if (!existsSync(file)) continue;
    const size = (await fs.stat(file)).size;
    if (saved[name]?.size !== size) {
      let max = -Infinity;
      // Padded with silence so sounds shorter than the 400 ms window still get a reading.
      await run(FFMPEG, ["-hide_banner", "-nostats", "-v", "verbose", "-i", file, "-af", "apad=pad_dur=0.5,ebur128=framelog=verbose", "-f", "null", "-"], {
        onLine: (l) => {
          const m = l.match(/M:\s*(-?[\d.]+)/);
          if (m) max = Math.max(max, Number(m[1]));
        },
      }).catch(() => {});
      if (Number.isFinite(max)) {
        saved[name] = { size, lufs: max };
        changed = true;
      }
    }
    if (saved[name]) sfxLoud.set(name, saved[name].lufs);
  }
  if (changed) await fs.writeFile(LOUD_FILE, JSON.stringify(saved, null, 1));
}

// ---------------------------------------------------------------------------
// The edit job: wait for the transcript, plan with Claude, build the timeline, save it for the editor.

const jobs = new Map(); // ad id → AbortController

async function waitForProject(ad, signal) {
  for (;;) {
    const project = await loadProject(ad.projectId);
    if (!project) throw new Error("The video for this ad is gone.");
    if (project.status === "ready") return project;
    if (project.status === "error") throw new Error(project.error || "The video couldn't be processed.");
    if (project.status === "stopped") throw new Error("Processing was stopped for this video.");
    await update(ad, { status: "waiting", message: project.message || "Getting the video ready…" });
    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, 1500);
      signal.addEventListener("abort", () => (clearTimeout(t), reject(signal.reason)), { once: true });
    });
  }
}

const LESSONS_FILE = path.join(DATA_DIR, "lessons.json");
/** A creative direction for an ad: any but the recent ones', chosen from the ad id so it's stable. */
function pickDirection(id, recent) {
  const all = Object.keys(DIRECTIONS);
  const choices = all.filter((d) => !recent.includes(d));
  const list = choices.length ? choices : all;
  return list[Math.abs([...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7)) % list.length];
}

/** A CTA design for an ad (plan.js CTA_STYLES): any but the last two ads', chosen from the ad id so it's stable. */
function pickCtaStyle(id, recent, offer) {
  const all = offerCtaStyles(offer);
  const choices = all.filter((d) => !recent.includes(d));
  const list = choices.length ? choices : all;
  return list[Math.abs([...id].reduce((h, ch) => (h * 37 + ch.charCodeAt(0)) | 0, 11)) % list.length];
}

/** The creator's corrections, newest last (data/ads/lessons.json). plan.js reads the recent ones into every edit. */
export async function readLessons() {
  return fs.readFile(LESSONS_FILE, "utf8").then((t) => JSON.parse(t).lessons || [], () => []);
}
async function addLesson({ ad, prompt }) {
  const lessons = await readLessons();
  lessons.push({ at: new Date().toISOString(), ad, prompt });
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LESSONS_FILE, JSON.stringify({ lessons: lessons.slice(-60) }, null, 2));
}

// How much disk an ad takes: its footage folder (source, working copy, renders), timeline, previews, backups, logos.
const sizeCache = new Map(); // ad id → { at, bytes }
async function du(p) {
  const st = await fs.stat(p).catch(() => null);
  if (!st) return 0;
  if (!st.isDirectory()) return st.size;
  let total = 0;
  for (const e of await fs.readdir(p).catch(() => [])) total += await du(path.join(p, e));
  return total;
}
export async function adSize(ad) {
  const hit = sizeCache.get(ad.id);
  if (hit && Date.now() - hit.at < 60_000) return hit.bytes;
  let bytes = (await du(projectDir(ad.projectId))) + (await du(path.join(EDITOR_DIR, ad.projectId))) + (await du(path.join(HISTORY_DIR, `${ad.projectId}-${ad.clipId}`))) + (await du(path.join(LOGOS_DIR, ad.id)));
  for (const f of await fs.readdir(path.join(DATA_DIR, "previews")).catch(() => [])) if (f.startsWith(`${ad.id}-`)) bytes += await du(path.join(DATA_DIR, "previews", f));
  sizeCache.set(ad.id, { at: Date.now(), bytes });
  return bytes;
}

export const SLIDES_DIR = path.join(DATA_DIR, "slides");
export async function readSlides() {
  return fs.readFile(path.join(SLIDES_DIR, "index.json"), "utf8").then((t) => JSON.parse(t), () => []);
}
async function writeSlides(slides) {
  await fs.mkdir(SLIDES_DIR, { recursive: true });
  await fs.writeFile(path.join(SLIDES_DIR, "index.json"), JSON.stringify(slides, null, 2));
}

/** Make sure the project has the ad as a clip, so renders and the editor can find it. */
async function ensureClip(project, ad, { title, summary, design }) {
  project.clips ??= [];
  let clip = project.clips.find((c) => c.id === AD_CLIP);
  if (!clip) {
    clip = { id: AD_CLIP, rank: project.clips.length + 1, start: 0, end: project.source.duration, hashtags: [], emphasis: [], score: null, source: "ads" };
    project.clips.push(clip);
  }
  Object.assign(clip, { end: project.source.duration, title, highlight: "", postTitle: title, caption: summary, reason: `Ads Editor: ${clean(ad.prompt, 300) || "made into an ad"}`, payoff: summary, design });
  await saveProject(project);
  return clip;
}

/**
 * The ad's logos. An ad without any borrows every logo uploaded to earlier ads (newest per name), so brand logos
 * only ever need uploading once. The files are copied in, so removing one from this ad leaves the others alone.
 */
// The shared logo library (data/ads/logos/_library/): every uploaded logo is kept there too, so deleting ads never
// loses the brand's logos.
const LIBRARY = "_library";
async function libraryLogos() {
  return fs.readFile(path.join(LOGOS_DIR, LIBRARY, "index.json"), "utf8").then((t) => JSON.parse(t), () => []);
}
async function addToLibrary(adId, logos) {
  const lib = await libraryLogos();
  await fs.mkdir(path.join(LOGOS_DIR, LIBRARY), { recursive: true });
  for (const l of logos) {
    if (lib.some((x) => x.name.toLowerCase() === l.name.toLowerCase())) continue;
    await fs.copyFile(path.join(LOGOS_DIR, adId, l.file), path.join(LOGOS_DIR, LIBRARY, l.file)).catch(() => {});
    lib.push(l);
  }
  await fs.writeFile(path.join(LOGOS_DIR, LIBRARY, "index.json"), JSON.stringify(lib, null, 2));
}

async function ensureLogos(ad) {
  if (ad.logos?.length) return ad.logos;
  const seen = new Set();
  const found = [];
  const others = [...(await load()).ads.filter((a) => a.id !== ad.id && a.logos?.length).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), { id: LIBRARY, logos: await libraryLogos() }];
  for (const other of others) {
    for (const l of other.logos) {
      const key = l.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      await fs.mkdir(path.join(LOGOS_DIR, ad.id), { recursive: true });
      await fs.copyFile(path.join(LOGOS_DIR, other.id, l.file), path.join(LOGOS_DIR, ad.id, l.file)).then(() => found.push(l), () => {});
    }
  }
  if (found.length) await update(ad, { logos: found });
  return found;
}

/** The ad as it stands, in words Claude can revise: the script it plays, its graphics, camera moves and sounds. */
async function describePrevious(ad) {
  const doc = await readAdDocument(ad.projectId, ad.clipId);
  if (!doc) return null;
  const t = (x) => `${x.toFixed(1)}s`;
  const words = doc.tracks.filter((k) => k.kind === "caption").flatMap((k) => k.clips).flatMap((c) => c.words.map((w) => ({ text: w.text, s: c.start + w.s })));
  const video = doc.tracks.find((k) => k.kind === "video")?.clips || [];
  const script = video.map((c) => `- ${t(c.start)}–${t(c.start + c.duration)} (source ${t(c.sourceStart)}–${t(c.sourceEnd)}): "${words.filter((w) => w.s >= c.start - 0.02 && w.s < c.start + c.duration).map((w) => w.text).join(" ")}"`).join("\n");
  const list = (kind, fn) => (doc.tracks.find((k) => k.kind === kind)?.clips || []).map(fn).join("\n") || "(none)";
  return `Script, piece by piece (with where each piece comes from in the footage):
${script}
Graphics:
${list("graphic", (g) => `- ${t(g.start)}–${t(g.start + g.duration)} ${g.look}${g.strike ? " (struck out)" : ""}: ${g.text || ""}${g.sub ? ` / ${g.sub}` : ""}${g.items?.length ? ` [${g.items.join("; ")}]` : ""}${g.logos?.length ? ` logos ${g.logos.join(",")}` : ""}`)}
Camera moves and cut hits:
${list("camera", (c) => `- ${t(c.start)} ${c.move}`)}
Voice effects:
${list("voicefx", (c) => `- ${t(c.start)}–${t(c.start + c.duration)} ${c.effect}`)}
Sounds:
${list("sfx", (c) => `- ${t(c.start)} ${c.sfx}`)}`;
}

/** The working copy with the LUT baked in, for previews (cached per LUT, and per version of its .cube file). */
async function gradedPreview(project, ad, lutId, luts, signal) {
  const lut = luts.find((l) => l.id === lutId);
  if (!lut) return null;
  const dir = path.join(DATA_DIR, "previews");
  const version = Math.round((await fs.stat(lut.file)).mtimeMs).toString(36);
  const file = `${ad.id}-${lutId}-${version}.mp4`;
  const out = path.join(dir, file);
  if (existsSync(out)) return { file, lut: lutId };
  await update(ad, { message: "Applying your color grade to the preview…" });
  await fs.mkdir(dir, { recursive: true });
  const tmp = `${out}.part.mp4`;
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", workingFile(project), "-vf", lutFilter(lut.file), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tmp], { signal });
  await fs.rename(tmp, out);
  return { file, lut: lutId };
}

/**
 * Where the main face sits (0–1 of the source height, top to bottom) between two source times: Apple Vision sampled
 * every quarter second, median of the biggest face. null when no face is seen. Short windows need the fine
 * sampling; lib/facezone.js samples once a second and needs three hits.
 */
async function faceIn(project, from, to, signal, { highest = false } = {}) {
  const bin = await trackerBinary();
  if (!bin) return null;
  const out = await run(bin, [workingFile(project), String(from), String(Math.max(from + 0.3, to)), "0.25"], { signal }).catch(() => "");
  const tops = [];
  const bottoms = [];
  for (const line of String(out).split("\n")) {
    if (!line.startsWith("{")) continue;
    const faces = (JSON.parse(line).faces || []).filter((b) => b[4] >= 0.5);
    const big = faces.sort((a, b) => b[2] * b[3] - a[2] * a[3])[0];
    if (big) {
      tops.push(big[1]);
      bottoms.push(big[1] + big[3]);
    }
  }
  if (!tops.length) return null;
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  // "highest": where the face reaches at its highest and lowest in the window (10th/90th percentile), for framing.
  const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))];
  const top = highest ? pct(tops, 0.1) : median(tops);
  const bottom = highest ? pct(bottoms, 0.9) : median(bottoms);
  // Pad up for the hair or cap above the detected face box.
  return { top: Math.max(0, Math.round((top - 0.05) * 1000) / 1000), bottom: Math.round(bottom * 1000) / 1000 };
}

/**
 * Re-transcribe each kept take on its own (a short clip aligns far better than a long video) and swap its words in.
 * A take that fails to transcribe keeps its original words.
 */
export async function realignTakes(project, ranges, words, signal, levels = null) {
  const dir = path.join(DATA_DIR, "tmp", `align-${project.id}-${Date.now().toString(36)}`);
  const lang = project.options?.language || "en";
  let out = [...words];
  // Transcribe [from, to] on its own; words come back on the source timeline.
  const listen = async (from, to, name) => {
    const wav = path.join(dir, `${name}.wav`);
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-ss", String(from), "-to", String(to), "-i", workingFile(project), "-vn", "-ac", "1", "-ar", "16000", wav], { signal });
    const sub = path.join(dir, name);
    await fs.mkdir(sub, { recursive: true });
    return (await transcribe(wav, sub, { language: lang, signal })).map((w) => ({ text: w.text, start: Math.round((from + w.start) * 1000) / 1000, end: Math.round((from + w.end) * 1000) / 1000 })).filter((w) => w.end > w.start);
  };
  // Where to split a long take: the quietest moment in the last second before each ~4 s mark.
  const quietest = (a, b) => {
    if (!levels) return b;
    let best = Math.round(b / 0.01);
    for (let i = Math.round(a / 0.01); i <= Math.round(b / 0.01) && i < levels.length; i++) if (levels[i] < levels[best]) best = i;
    return best * 0.01;
  };
  await fs.mkdir(dir, { recursive: true });
  for (const [i, r] of ranges.entries()) {
    try {
      const cuts = [r.start];
      // Split only at a real pause (the quietest instant between 2.5 and 5.5 s in), never inside a word.
      while (r.end - cuts.at(-1) > 6.5) cuts.push(quietest(cuts.at(-1) + 2.5, cuts.at(-1) + 5.5));
      cuts.push(r.end);
      let fresh = [];
      for (let k = 0; k < cuts.length - 1; k++) {
        const a = cuts[k];
        const b = cuts[k + 1];
        // Each chunk hears a little either side, but only keeps the words centred inside it.
        const heard = await listen(Math.max(0, a - 0.6), b + 0.6, `take-${i}-${k}`);
        const first = k === 0;
        const last = k === cuts.length - 2;
        const kept = heard.filter((w) => {
          const mid = (w.start + w.end) / 2;
          // The take's last word can start right on its edge ("…a day"): let it in, then the take widens to it.
          return (first ? w.end > a - 0.12 : mid >= a) && (last ? w.start < b + 0.15 : mid < b);
        });
        fresh.push(...kept);
      }
      if (!fresh.length) continue;
      // Pin the take to the words the plan chose: nothing before its first word or after its last word gets in
      // ("hold on", "it's a new…"), and those words are kept whole ("Chat|GPT" widens the take to all of it).
      const key = (w) => String(w?.text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const firstKey = key(words[r.fromIdx]);
      const lastKey = key(words[r.toIdx]);
      const joined = (list, i, n) => list.slice(i, i + n).map(key).join("");
      // Fuzzy: the transcriber may hear "Atlas" as "At last" or "ChatGPT" as "Chat GPT" — one or two words whose
      // letters start the same way count as a match.
      const like = (j, k) => Boolean(j && k) && (j === k || j.startsWith(k) || k.startsWith(j) || (j.length >= 3 && k.length >= 3 && j.slice(0, 4) === k.slice(0, 4)));
      const startAt = [0, 1, 2, 3].find((i) => i < fresh.length && [1, 2].some((n) => like(joined(fresh, i, n), firstKey)));
      if (startAt > 0) fresh = fresh.slice(startAt);
      // Planned first word not recognised: no widening, only words centred inside the take.
      else if (startAt === undefined) fresh = fresh.filter((w) => (w.start + w.end) / 2 >= r.start);
      const tailFrom = Math.max(0, fresh.length - 4);
      let endAt = -1;
      for (let j = fresh.length - 1; j >= tailFrom; j--) if ([1, 2].some((n) => j - n + 1 >= 0 && like(joined(fresh, j - n + 1, n), lastKey))) { endAt = j; break; }
      if (endAt >= 0) fresh = fresh.slice(0, endAt + 1);
      else {
        fresh = fresh.filter((w) => (w.start + w.end) / 2 < r.end);
        // The transcriber dropped the take's last words ("…free trial and | learn more."): they come back from the
        // long transcript, after the last word both heard, each right after the one before.
        const plan = words.slice(r.fromIdx, r.toIdx + 1);
        const tail = fresh.slice(-3).map(key);
        let at = -1;
        for (let j = plan.length - 1; j >= Math.max(0, plan.length - 8) && at < 0; j--) if (tail.some((k) => like(key(plan[j]), k))) at = j;
        const lastFresh = fresh.at(-1);
        if (at >= 0 && at < plan.length - 1 && lastFresh && like(key(plan[at]), key(lastFresh))) {
          const round = (n) => Math.round(n * 1000) / 1000;
          let prev = lastFresh.end;
          for (const w of plan.slice(at + 1)) {
            const start = Math.max(prev, w.start);
            fresh.push({ text: w.text, start: round(start), end: round(start + Math.max(0.1, w.end - w.start)) });
            prev = start + Math.max(0.1, w.end - w.start);
          }
        }
      }
      if (!fresh.length) continue;
      // The long transcript's words for this take are replaced whole, even where the take narrows to its fresh words
      // (they'd otherwise sit next to their fresh copies: "trial or… trial or").
      const was = { start: r.start, end: r.end };
      if (startAt >= 0) r.start = Math.round(Math.max(0, fresh[0].start - 0.06) * 1000) / 1000;
      if (endAt >= 0) r.end = Math.round((fresh.at(-1).end + 0.1) * 1000) / 1000;
      const from = Math.min(r.start, was.start);
      const to = Math.max(r.end, was.end);
      out = [...out.filter((w) => w.end <= from + 0.05 || w.start >= to - 0.05), ...fresh].sort((a, b) => a.start - b.start);
    } catch (err) {
      if (signal.aborted) throw err;
      console.error(`Ads: realign take ${i}`, err.message);
    }
  }
  await fs.rm(dir, { recursive: true, force: true });
  return out;
}

/**
 * Repeats in what the finished ad says: a run of 1–4 words said again straight away ("everyone everyone"), or with
 * one slipped word between ("so you, that you can" → the "you" before the correction). Returns the stretch to cut
 * (the first saying) on the ad's timeline.
 */
export function findSlips(heard) {
  const key = (w) => String(w?.text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const out = [];
  for (let i = 0; i < heard.length; i++) {
    for (let k = 4; k >= 1; k--) {
      if (i + 2 * k > heard.length) continue;
      let same = true;
      for (let j = 0; j < k; j++) if (!key(heard[i + j]) || key(heard[i + j]) !== key(heard[i + k + j])) same = false;
      if (same && heard[i + k].start - heard[i + k - 1].end < 1.5) {
        out.push({ start: heard[i].start - 0.02, end: heard[i + k].start - 0.02, words: heard.slice(i, i + k).map(key) });
        i += k - 1;
        break;
      }
    }
    // "so you, that you can": X Y X with the middle a slip (short words only, said within a second).
    const a = key(heard[i]);
    if (a && a.length <= 4 && heard[i + 2] && key(heard[i + 2]) === a && key(heard[i + 1]) !== a && heard[i + 2].start - heard[i].end < 1 && key(heard[i + 3]) !== key(heard[i + 1])) {
      out.push({ start: heard[i].start - 0.02, end: heard[i + 1].start - 0.02, words: [a] });
    }
  }
  return out;
}

/**
 * Move each graphic onto its word in the finished ad's captions: numbers onto the number, logos onto the brand name,
 * the CTA onto "click"/"tap"/"comment". Its sound effects move with it; nothing overlaps the next graphic.
 */
export function snapGraphics(doc, logos = []) {
  const key = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const NUM = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10" };
  const words = doc.tracks.filter((t) => t.kind === "caption").flatMap((t) => t.clips).flatMap((c) => c.words.map((w) => ({ k: key(w.text), s: c.start + w.s })));
  const graphics = (doc.tracks.find((t) => t.kind === "graphic")?.clips || []).sort((a, b) => a.start - b.start);
  const sfx = doc.tracks.find((t) => t.kind === "sfx")?.clips || [];
  const logoName = (id) => key(logos.find((l) => l.id === id)?.name);
  graphics.forEach((g, i) => {
    let targets = [];
    if (g.look === "stat" || TEMPLATES[g.look]?.anchor === "number") {
      const d = (String(g.text).match(/\d+/) || [""])[0];
      targets = d ? [d, ...Object.keys(NUM).filter((n) => NUM[n] === d)] : [];
    } else if (g.look === "cta" || TEMPLATES[g.look]?.anchor === "cta") targets = ["click", "tap", "comment", "dm", "book"];
    else if (g.look === "logo") targets = (g.logos || []).map(logoName).filter(Boolean).map((n) => n.slice(0, 4));
    if (!targets.length) return;
    const hit = words.filter((w) => targets.some((t) => w.k.startsWith(t)) && Math.abs(w.s - g.start) < 2.5).sort((a, b) => Math.abs(a.s - g.start) - Math.abs(b.s - g.start))[0];
    if (!hit) return;
    const prevEnd = i > 0 ? graphics[i - 1].start + graphics[i - 1].duration + 0.1 : 0;
    const start = Math.round(Math.max(prevEnd, hit.s - 0.1) * 1000) / 1000;
    const delta = start - g.start;
    if (Math.abs(delta) < 0.05) return;
    for (const c of sfx) if (c.start >= g.start - 3 && c.start < g.start + g.duration - 0.01) c.start = Math.round(Math.max(0, c.start + delta) * 1000) / 1000;
    g.start = start;
  });
  // Then untangle: graphics not tied to a word (testimonials, checklists) move later to make room; a word-tied one
  // that still overlaps gets shorter (a number keeps at least 1.3 s to count up); nothing runs past the end.
  const D = Math.max(0, ...(doc.tracks.find((t) => t.kind === "video")?.clips || []).map((c) => c.start + c.duration));
  const free = new Set(["proof", "list"]);
  for (let i = 0; i < graphics.length; i++) {
    const g = graphics[i];
    const prev = graphics[i - 1];
    if (prev && g.start < prev.start + prev.duration + 0.1) {
      const room = prev.start + prev.duration + 0.1;
      if (free.has(g.look)) {
        g.duration = Math.round((g.duration - (room - g.start)) * 1000) / 1000;
        g.start = Math.round(room * 1000) / 1000;
      } else prev.duration = Math.round(Math.max(prev.look === "stat" ? 1.3 : 0.8, g.start - 0.1 - prev.start) * 1000) / 1000;
    }
    g.duration = Math.round(Math.min(g.duration, D - g.start - 0.02) * 1000) / 1000;
  }
  const kept = graphics.filter((g) => g.duration >= (g.look === "stat" ? 1.2 : 1.0));
  const track = doc.tracks.find((t) => t.kind === "graphic");
  if (track) track.clips = kept;
  sfx.sort((a, b) => a.start - b.start);
}

/** Silent stretches (under −40 dB for 0.45 s or more) inside the finished ad's pieces, as footage times. */
export function deadAir(doc, levels) {
  if (!levels) return [];
  const out = [];
  for (const c of doc.tracks.find((t) => t.kind === "video")?.clips || []) {
    let run = null;
    for (let i = Math.round(c.sourceStart / 0.01); i <= Math.min(levels.length - 1, Math.round(c.sourceEnd / 0.01)); i++) {
      const t = i * 0.01;
      if (levels[i] < -40) run ??= t;
      else {
        if (run !== null && t - run >= 0.45) out.push({ start: Math.round((run + 0.08) * 1000) / 1000, end: Math.round((t - 0.06) * 1000) / 1000, silent: true });
        run = null;
      }
    }
    if (run !== null && c.sourceEnd - run >= 0.45) out.push({ start: Math.round((run + 0.08) * 1000) / 1000, end: c.sourceEnd, silent: true });
  }
  return out;
}

/** An ad-timeline stretch back to the footage it plays (within one piece), or null. */
function toSource(doc, x) {
  const c = (doc.tracks.find((t) => t.kind === "video")?.clips || []).find((v) => x.start >= v.start - 0.05 && x.start < v.start + v.duration);
  if (!c) return null;
  const s = c.sourceStart + Math.max(0, x.start - c.start);
  return { start: Math.round(s * 1000) / 1000, end: Math.round(Math.min(c.sourceEnd, s + (x.end - x.start)) * 1000) / 1000, words: x.words };
}

/** Transcribe the cut's own voice and rebuild the caption track from it (on the ad's timeline). */
export async function finalCaptions(project, doc, signal) {
  const video = doc.tracks.find((t) => t.kind === "video")?.clips || [];
  if (!video.length) return;
  const dir = path.join(DATA_DIR, "tmp", `final-${project.id}-${Date.now().toString(36)}`);
  await fs.mkdir(dir, { recursive: true });
  try {
    const wav = path.join(dir, "cut.wav");
    const parts = video.map((c, i) => `[0:a]atrim=start=${c.sourceStart}:end=${c.sourceEnd},asetpts=PTS-STARTPTS[a${i}]`).join(";");
    const concat = `${video.map((_, i) => `[a${i}]`).join("")}concat=n=${video.length}:v=0:a=1[out]`;
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", workingFile(project), "-filter_complex", `${parts};${concat}`, "-map", "[out]", "-ac", "1", "-ar", "16000", wav], { signal });
    const heard = await transcribe(wav, dir, { language: project.options?.language || "en", signal });
    if (heard.length < 3) return;
    const D = Math.max(...video.map((c) => c.start + c.duration));
    const track = doc.tracks.find((t) => t.kind === "caption");
    if (track) track.clips = captionClips(heard.map((w) => ({ text: w.text, s: w.start, e: w.end })), D, doc.design);
    return heard;
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

/** Each graphic gets the face's band (0–1 of the source height) over the source it plays on top of. */
async function placeFaces(project, doc, signal) {
  const video = doc.tracks.find((t) => t.kind === "video")?.clips || [];
  // Every piece of the cut gets where the face reaches in it, so the zooms keep the whole face in frame.
  for (const c of video) {
    const band = await faceIn(project, c.sourceStart, c.sourceEnd, signal, { highest: true });
    if (band) c.face = band;
  }
  for (const g of doc.tracks.find((t) => t.kind === "graphic")?.clips || []) {
    const c = video.find((v) => g.start < v.start + v.duration && g.start + 0.05 >= v.start) || video.find((v) => g.start < v.start + v.duration);
    if (!c) continue;
    const from = c.sourceStart + Math.max(0, g.start - c.start);
    const to = Math.min(c.sourceEnd, from + Math.max(1.5, g.duration));
    const band = await faceIn(project, Math.max(0, from - 0.1), to + 0.1, signal);
    if (band) g.face = band;
  }
}

// Edits run one at a time (each uses Claude, whisper, face tracking and the listen-back): a batch of uploads waits
// its turn, and every waiting ad shows its place in line.
const editQueue = [];
let editing = null;
function enqueueEdit(ad) {
  if (editing === ad.id) jobs.get(ad.id)?.abort();
  if (!editQueue.includes(ad.id)) editQueue.push(ad.id);
  refreshQueue();
  pumpEdits();
}
async function refreshQueue() {
  for (const [i, id] of editQueue.entries()) {
    const ad = await findAd(id);
    if (ad) await update(ad, { status: "queued", message: i === 0 && !editing ? "Starting…" : `Queued: ${i + (editing ? 1 : 0)} ahead` });
  }
}
async function pumpEdits() {
  if (editing || !editQueue.length) return;
  const id = editQueue.shift();
  const ad = await findAd(id);
  if (!ad) return pumpEdits();
  editing = id;
  refreshQueue();
  try {
    await runEdit(ad);
  } finally {
    editing = null;
    pumpEdits();
  }
}

async function runEdit(ad) {
  jobs.get(ad.id)?.abort();
  const controller = new AbortController();
  const { signal } = controller;
  jobs.set(ad.id, controller);
  try {
    const project = await waitForProject(ad, signal);
    const words = fitWordsToSpeech(await projectWords(project), await findSilences(project, { signal }).catch(() => []));
    if (words.length < 5) throw new Error("There's barely any talking in this video, so there's nothing to cut into an ad.");
    await update(ad, { status: "planning", message: hasClaudeKey() ? "Claude is watching the footage and planning the cuts and graphics…" : "Planning the cut…", error: null });
    const luts = await listLuts();
    const logos = await ensureLogos(ad);
    const lessons = (await readLessons()).slice(-20);
    const testimonials = await fs.readFile(path.join(DATA_DIR, "testimonials.json"), "utf8").then((t) => JSON.parse(t).testimonials || [], () => []);
    // A re-edit starts from the version the creator just watched: what it kept, showed and played, and when.
    const previous = ad.redo ? await describePrevious(ad) : null;
    // Ads edited most recently, newest first: their templates and styles are what this one rotates away from.
    const others = (await load()).ads.filter((a) => a.id !== ad.id && (a.style || a.plan)).sort((a, b) => String(b.editedAt || "").localeCompare(String(a.editedAt || "")));
    const recentTemplates = [...new Set(others.slice(0, 4).flatMap((a) => [...(a.plan?.graphics || []).filter((g) => g.kind === "template").map((g) => g.template), ...(a.plan?.camera || []).filter((m) => !["punch", "push", "pull"].includes(m.move)).map((m) => `cut hit ${m.move}`), ...(a.plan?.voice_fx || []).map((v) => `voice ${v.effect}`)]))];
    const slides = await readSlides();
    // Creative direction: a different motion-graphics family from the last two ads (plan.js DIRECTIONS). A re-edit
    // without one (ads made before directions existed) gets a fresh one too.
    const recentDirections = others.slice(0, 2).map((a) => a.style?.direction).filter(Boolean);
    const direction = ad.style?.direction && ad.redo && !/switch|style|creative|different/i.test(ad.prompt || "") ? ad.style.direction : pickDirection(ad.id, recentDirections);
    const recentCtas = others.slice(0, 2).map((a) => a.style?.ctaStyle).filter(Boolean);
    const ctaStyle = ad.style?.ctaStyle && ad.redo && !/cta|switch|style|creative|different/i.test(ad.prompt || "") ? ad.style.ctaStyle : pickCtaStyle(ad.id, recentCtas, offerOf(ad.options));
    const plan = await planAd({
      ctaStyle,
      direction,
      slides: slides.map((x) => ({ ...x, path: path.join(SLIDES_DIR, x.file) })),
      recentTemplates,
      previous,
      testimonials,
      lessons,
      logos,
      options: ad.options,
      words,
      prompt: ad.prompt,
      duration: project.source.duration,
      aspect: ad.aspect,
      videoFile: workingFile(project),
      tmpDir: path.join(DATA_DIR, "tmp", ad.id),
      signal,
      luts,
    });
    signal.throwIfAborted();
    await update(ad, { message: "Building the timeline: cuts, captions, graphics and sound effects…" });
    await measureSfx();
    // Grade: a LUT the creator picked, else their grade template (Template 1 unless they changed it), else Claude's pick.
    const lutId = resolveLut(ad.options, luts, await readSettings());
    // Rotation: a different sound palette and different number-card / CTA styles from the most recent ads.
    const lastStyle = others.find((a) => a.style)?.style || {};
    const pick = (list, last) => {
      const choices = list.filter((x) => x !== last);
      return choices[Math.abs([...ad.id].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7)) % choices.length];
    };
    const style = ad.style && !ad.redo ? { ...ad.style } : { palette: pick(Object.keys(PALETTES), lastStyle.palette), stat: pick(["glow", "pill"], lastStyle.stat), cta: pick(["button", "sonar"], lastStyle.cta) };
    if (ad.redo && ad.style) Object.assign(style, ad.style);
    style.direction = direction;
    style.ctaStyle = ctaStyle;
    const options = { ...ad.options, sfxLoudness: (n) => sfxLoud.get(n), slides: await readSlides(), logos, testimonials, lut: lutId || "none", ctaText: OFFERS[offerOf(ad.options)].cta, palette: style.palette, variants: { stat: style.stat, cta: style.cta } };
    const levels = await measureLevels(project, { signal }).catch(() => null);
    // Where the voice really is comes from the original recording: the cleaned copy lifts silence to speech level.
    const voice = (await sourceLevels(project, { signal }).catch(() => null)) || levels;
    await update(ad, { message: "Checking every cut against a fresh transcript…" });
    const built = await buildAdDocument({ project, plan, words, aspect: ad.aspect, options, levels: voice, sfxDuration: (n) => sfxLengths.get(n), realign: (ranges, all) => realignTakes(project, ranges, all, signal, levels) });
    // Captions from the finished ad itself: its voice, cut together, transcribed start to finish. They can't
    // disagree with what plays, and it's how leftover repeats get caught.
    await update(ad, { message: "Listening to the finished cut for the captions…" });
    let heard = await finalCaptions(project, built.doc, signal).catch((err) => (signal.aborted ? Promise.reject(err) : (console.error(`Ads [${ad.id}] final captions`, err.message), null)));
    // Listen-back: any repeat or restart still in the finished ad ("everyone everyone", "so you, that you") is cut
    // and the ad rebuilt without it — the creator's rule: every pause, repeat or mess-up goes.
    // …and any stretch of the finished ad where nothing is said (checked on the sound itself, not the transcript).
    // Up to three passes, until the finished ad has neither.
    const exclude = [];
    for (let pass = 0; pass < 3 && heard; pass++) {
      const slips = findSlips(heard).map((x) => toSource(built.doc, x)).filter(Boolean);
      const silences = deadAir(built.doc, levels);
      if (!slips.length && !silences.length) break;
      await update(ad, { message: `Cutting ${slips.length + silences.length} leftover pause${slips.length + silences.length === 1 ? "" : "s"} and repeats…` });
      exclude.push(...slips, ...silences);
      const again = await buildAdDocument({ project, plan, words, aspect: ad.aspect, options: { ...options, exclude }, levels: voice, sfxDuration: (n) => sfxLengths.get(n), realign: (ranges, all) => realignTakes(project, ranges, all, signal, levels) });
      Object.assign(built, again);
      heard = await finalCaptions(project, built.doc, signal).catch(() => null);
    }
    // Every graphic lands on the moment its word is said in the finished ad (the number, the brand, "click").
    snapGraphics(built.doc, options.logos || []);
    // Where the face is during each graphic, so it's placed in the free space and never over the face.
    await update(ad, { message: "Finding your face so the graphics stay clear of it…" });
    await placeFaces(project, built.doc, signal);
    // A grade the creator chose wins over Claude's pick; their own LUT replaces the built-in grade.
    const grade = options.lut !== "none" ? "none" : GRADES[ad.options?.grade] ? ad.options.grade : built.grade;
    if (grade === "none") built.doc.design.grade = "none";
    const doc = await writeAdDocument(built.doc);
    // Voice effects (underwater, muffled, phone) play from filtered copies of the audio, made once per project.
    const effects = doc.tracks.filter((t) => t.kind === "voicefx").flatMap((t) => t.clips.map((c) => c.effect));
    if (effects.length) {
      await update(ad, { message: "Making the voice effects…" });
      await ensureVoiceFx(project, effects, signal).catch((err) => (signal.aborted ? Promise.reject(err) : console.error(`Ads [${ad.id}] voice fx`, err.message)));
    }
    const title = clean(plan.title, 80) || ad.name;
    const clip = await ensureClip(project, ad, { title, summary: clean(plan.summary, 600), design: doc.design });
    // Follow the face across the vertical crop (tracked once, then cached for previews and renders).
    await update(ad, { message: "Tracking your face so you stay centered…" });
    await clipFocus(project, clip, { signal }).catch((err) => (signal.aborted ? Promise.reject(err) : console.error(`Ads [${ad.id}] tracking`, err.message)));
    // The big glowing words sit behind the speaker once their cutouts are made (a few seconds each).
    if (built.stats.emphasis) ensureMattes(project, doc);
    // Renders bake the LUT in; the in-app preview gets a graded copy so it doesn't look flat.
    const preview = options.lut !== "none" ? await gradedPreview(project, ad, options.lut, luts, signal).catch((err) => (signal.aborted ? Promise.reject(err) : (console.error(`Ads [${ad.id}] graded preview`, err.message), null))) : null;
    await fs.rm(path.join(DATA_DIR, "tmp", ad.id), { recursive: true, force: true });
    await update(ad, {
      status: "ready",
      message: "",
      name: ad.renamed ? ad.name : title,
      grade,
      summary: clean(plan.summary, 800),
      notice: plan.notice || (plan.not_done ? `Couldn't do: ${clean(plan.not_done, 300)}` : null),
      by: plan.by,
      stats: built.stats,
      plan,
      style,
      preview,
      rev: doc.rev,
      editedAt: new Date().toISOString(),
    });
    // Batch uploads can ask for the video to be saved as soon as it's edited.
    if (ad.autoSave) {
      const fresh = await loadProject(ad.projectId);
      if (fresh?.clips?.some((c) => c.id === ad.clipId)) {
        queueRender(fresh, ad.clipId, { design: doc.design });
        await update(ad, { renderedRev: doc.rev });
      }
    }
  } catch (err) {
    if (signal.aborted) return;
    console.error(`Ads [${ad.id}]`, err);
    await update(ad, { status: "error", message: "", error: err.message });
  } finally {
    if (jobs.get(ad.id) === controller) jobs.delete(ad.id);
  }
}

// ---------------------------------------------------------------------------

async function view(ad) {
  const project = await loadProject(ad.projectId);
  // The creator has changed the ad in the timeline since the last AI edit.
  const doc = ad.status === "ready" ? await readAdDocument(ad.projectId, ad.clipId) : null;
  const handEdited = Boolean(doc && ad.rev && doc.rev > ad.rev);
  const clip = project?.clips?.find((c) => c.id === ad.clipId) || null;
  const render = clip?.render || null;
  const done = clip ? finishedRender(clip) : null;
  return {
    ...ad,
    project: project
      ? { id: project.id, status: project.status, message: project.message, error: project.error, duration: project.source?.duration || null, width: project.source?.width, height: project.source?.height, poster: `/files/${project.id}/poster.jpg` }
      : null,
    busy: jobs.has(ad.id),
    handEdited,
    // The LUT the edited ad is graded with ("none" for a built-in grade), so the grade menu shows what's really on it.
    lutInUse: doc ? doc.design?.lut || "none" : null,
    sizeBytes: await adSize(ad),
    previewUrl: ad.status === "ready" ? `/api/editor/projects/${ad.projectId}/clips/${ad.clipId}/preview` : null,
    editorUrl: ad.status === "ready" ? `#/edit/${ad.projectId}/${ad.clipId}` : null,
    render: render ? { status: render.status, progress: render.progress ?? null, message: render.message || "", error: render.error || null } : null,
    rendering: project && clip ? isRendering(project, clip.id) : false,
    transcript: ad.status === "ready" ? { txt: `/api/ads/${ad.id}/transcript`, srt: `/api/ads/${ad.id}/transcript?format=srt` } : null,
    video: done?.file ? { url: `/files/${project.id}/${done.file}`, download: `/api/ads/${ad.id}/download`, at: done.renderedAt, duration: done.duration, stale: Boolean(doc && (!ad.renderedRev || doc.rev > ad.renderedRev)) } : null,
  };
}

/**
 * The Assets LUT an ad is graded with, or null for a built-in grade: a LUT picked by name, else the grade template
 * it's on (1 or 2), else — on "auto" — the default template. Old ads with no templates saved fall back to Ads Boost.
 */
function resolveLut(options = {}, luts, settings) {
  const has = (id) => luts.some((l) => l.id === id);
  if (has(options.lut)) return options.lut;
  const template = options.template === 1 || options.template === 2 ? options.template : !options.grade || options.grade === "auto" ? settings.defaultTemplate : null;
  if (!template) return null;
  const id = settings.gradeTemplates[template - 1];
  if (has(id)) return id;
  return luts.length ? (luts.find((l) => /ads boost/i.test(l.title)) || luts[0]).id : null;
}

/** The grade templates with their LUT names, for the Ads page. */
async function gradeTemplates(luts) {
  const settings = await readSettings();
  return {
    templates: settings.gradeTemplates.map((id, i) => ({ n: i + 1, lut: id, title: luts.find((l) => l.id === id)?.title || null })),
    defaultTemplate: settings.defaultTemplate,
  };
}

/**
 * Switch a finished ad's colour grade without re-editing it: the timeline keeps every cut and graphic, only the
 * grade changes (the replaced timeline is kept in history). A LUT also gets its graded preview copy.
 */
async function applyGrade(ad, options, signal) {
  const project = await loadProject(ad.projectId);
  const doc = await readAdDocument(ad.projectId, ad.clipId);
  if (!project || !doc) throw new Error("Edit the ad first.");
  const luts = await listLuts();
  const lut = resolveLut(options, luts, await readSettings());
  const grade = lut ? "none" : GRADES[options.grade] ? options.grade : ad.grade && ad.grade !== "none" ? ad.grade : "clean";
  if (doc.design.lut !== (lut || "none") || doc.design.grade !== (grade === "none" ? "none" : "clean")) {
    doc.design.lut = lut || "none";
    doc.design.grade = grade === "none" ? "none" : "clean";
    const saved = await writeAdDocument(doc);
    // The switch isn't a hand edit in the timeline, so it mustn't trigger the "you've edited this" warning.
    if (ad.rev && ad.rev === saved.rev - 1) await update(ad, { rev: saved.rev });
  }
  const preview = lut ? await gradedPreview(project, ad, lut, luts, signal) : null;
  await update(ad, { options, grade, preview, message: "" });
  return ad;
}

const OPTION_KEYS = { music: "bool", sfx: "bool", captions: "bool", grade: "grade", lut: "id", template: "template", accent: "hex", offer: "offer" };
function optionsFrom(input = {}, prev = {}) {
  // Defaults: no captions, a music bed for anticipation, sound effects on (the creator's calls, ads/STYLE.md).
  // Defaults are the creator's standing choices: sound effects, music bed and captions all on.
  // The offer an ad ends on defaults to the ATLAS 7-day free trial (the creator's current ads).
  const out = { music: true, sfx: true, captions: true, grade: "auto", lut: "none", template: null, accent: null, offer: "trial", ...prev };
  for (const [key, type] of Object.entries(OPTION_KEYS)) {
    const v = input[key];
    if (v === undefined) continue;
    if (type === "bool") out[key] = v !== false && v !== "false";
    if (type === "grade") out[key] = GRADES[v] ? v : "auto";
    if (type === "id") out[key] = /^[\w-]{1,40}$/.test(String(v)) ? String(v) : "none";
    if (type === "hex") out[key] = /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : null;
    if (type === "offer") out[key] = OFFERS[v] ? v : "trial";
    if (type === "template") out[key] = Number(v) === 1 || Number(v) === 2 ? Number(v) : null;
  }
  return out;
}

export function createAds() {
  const router = express.Router();
  router.use(express.json({ limit: "1mb" }));
  router.use("/ui", express.static(path.join(HERE, "public"), { setHeaders: (res) => res.set("Cache-Control", "no-cache") }));
  router.get("/sfx/:name.mp3", (req, res) => {
    if (!SFX[req.params.name]) return res.status(404).end();
    res.sendFile(sfxFile(req.params.name));
  });

  const handle = (fn) => async (req, res) => {
    try {
      const out = await fn(req, res);
      if (out !== undefined && !res.headersSent) res.json(out);
    } catch (err) {
      if (!res.headersSent) res.status(err.status || 400).json({ error: err.message });
    }
  };
  const need = async (id) => {
    const ad = await findAd(id);
    if (!ad) throw Object.assign(new Error("Ad not found"), { status: 404 });
    return ad;
  };

  router.get("/", handle(async () => {
    const { ads } = await load();
    const list = await Promise.all([...ads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(view));
    const luts = await listLuts();
    return {
      ads: list,
      claude: hasClaudeKey(),
      aspects: Object.fromEntries(Object.entries(ASPECTS).map(([k, a]) => [k, a.hint])),
      grades: Object.fromEntries(Object.entries(GRADES).map(([k, g]) => [k, g.label])),
      luts: luts.map((l) => ({ id: l.id, title: l.title })),
      ...(await gradeTemplates(luts)),
      looks: LOOKS,
      sfx: SFX,
      offers: Object.fromEntries(Object.entries(OFFERS).map(([k, o]) => [k, { label: o.label, cta: o.cta, brief: o.brief }])),
    };
  }));

  // A new ad for an uploaded video (the upload itself goes through POST /api/projects with autoPick=false).
  router.post("/", handle(async (req, res) => {
    const project = await loadProject(String(req.body?.projectId || ""));
    if (!project) throw new Error("Upload the video first.");
    const db = await load();
    const existing = db.ads.find((a) => a.projectId === project.id);
    if (existing) return view(existing);
    // An ad's footage is an ad, not a clip project: the engine keeps it out of Projects, clips and auto-post.
    if (project.kind !== "ad") await saveProject(Object.assign(project, { kind: "ad" }));
    const now = new Date().toISOString();
    const ad = {
      id: newId(),
      projectId: project.id,
      clipId: AD_CLIP,
      name: clean(req.body?.name, 120).replace(/\.[a-z0-9]{2,4}$/i, "") || "New ad",
      prompt: "",
      aspect: ASPECTS[req.body?.aspect] ? req.body.aspect : "9:16",
      options: optionsFrom(req.body?.options),
      status: "new",
      message: "",
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    (await load()).ads.push(ad); // re-read: another process may have written the list since
    await persist();
    await ensureLogos(ad);
    res.status(201);
    return view(ad);
  }));

  // Slides & images library (shared by every ad): the creator's decks and brand images, which the planner can
  // bring into an ad as a slide moment (look "slide").
  const slideUpload = multer({ dest: path.join(os.tmpdir(), "ads-slides"), limits: { fileSize: 40 * 1024 * 1024, files: 60 } });
  // Grade templates: which Assets LUT is Template 1 and 2, and which one new ads start on.
  router.put("/settings", handle(async (req) => {
    const luts = await listLuts();
    const current = await readSettings();
    const body = req.body || {};
    const pick = (v, prev) => (v === "none" || luts.some((l) => l.id === v) ? v : prev);
    const slots = Array.isArray(body.gradeTemplates) ? [pick(body.gradeTemplates[0], current.gradeTemplates[0]), pick(body.gradeTemplates[1], current.gradeTemplates[1])] : current.gradeTemplates;
    const defaultTemplate = body.defaultTemplate === 1 || body.defaultTemplate === 2 ? body.defaultTemplate : current.defaultTemplate;
    await writeSettings({ gradeTemplates: slots, defaultTemplate });
    return gradeTemplates(luts);
  }));

  router.get("/slides", handle(async () => ({ slides: (await readSlides()).map((x) => ({ ...x, url: `${"/api/ads"}/slides/${encodeURIComponent(x.file)}` })) })));
  router.post("/slides", slideUpload.array("slides", 60), handle(async (req) => {
    const slides = await readSlides();
    await fs.mkdir(SLIDES_DIR, { recursive: true });
    for (const f of req.files || []) {
      const ext = path.extname(f.originalname).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
        await fs.rm(f.path, { force: true });
        continue;
      }
      const id = `s${crypto.randomBytes(3).toString("hex")}`;
      await fs.copyFile(f.path, path.join(SLIDES_DIR, `${id}${ext}`));
      await fs.rm(f.path, { force: true });
      slides.push({ id, name: clean(path.basename(f.originalname, ext).replace(/[-_]+/g, " "), 80) || "Slide", file: `${id}${ext}` });
    }
    await writeSlides(slides);
    return { slides };
  }));
  router.patch("/slides/:slideId", handle(async (req) => {
    const slides = await readSlides();
    const s = slides.find((x) => x.id === req.params.slideId);
    if (s && clean(req.body?.name)) s.name = clean(req.body.name, 120);
    await writeSlides(slides);
    return { slides };
  }));
  router.delete("/slides/:slideId", handle(async (req) => {
    const slides = await readSlides();
    const s = slides.find((x) => x.id === req.params.slideId);
    if (s) await fs.rm(path.join(SLIDES_DIR, s.file), { force: true });
    await writeSlides(slides.filter((x) => x !== s));
    return { ok: true };
  }));
  router.get("/slides/:file", async (req, res) => {
    const s = (await readSlides()).find((x) => x.file === req.params.file);
    if (!s) return res.status(404).end();
    res.sendFile(path.join(SLIDES_DIR, s.file));
  });

  // Several saved ads in one download: a zip (stored, not recompressed: they're already MP4s), streamed as it's made.
  router.get("/download.zip", async (req, res) => {
    const ids = String(req.query.ids || "").split(",").filter((x) => /^[\w-]{1,40}$/.test(x)).slice(0, 100);
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ads-zip-"));
    try {
      const used = new Set();
      for (const id of ids) {
        const ad = await findAd(id);
        const project = ad ? await loadProject(ad.projectId) : null;
        const file = project && finishedRender(project.clips?.find((c) => c.id === ad.clipId) || {})?.file;
        if (!file) continue;
        const base = String(ad.name || "ad").replace(/[^\w .-]+/g, "").trim() || "ad";
        let name = `${base}.mp4`;
        for (let k = 2; used.has(name.toLowerCase()); k++) name = `${base} (${k}).mp4`;
        used.add(name.toLowerCase());
        await fs.symlink(path.join(projectDir(project.id), file), path.join(dir, name));
      }
      if (!used.size) return res.status(404).type("text").send("None of those ads have been saved yet.");
      res.set({ "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="ads-${new Date().toISOString().slice(0, 10)}.zip"` });
      const { spawn } = await import("node:child_process");
      const zip = spawn("zip", ["-0", "-q", "-r", "-", "."], { cwd: dir });
      zip.stdout.pipe(res);
      req.on("close", () => zip.kill());
      await new Promise((resolve) => zip.on("close", resolve));
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
  router.get("/voicefx/:file", (req, res) => {
    if (!/^[\w-]+\.m4a$/.test(req.params.file)) return res.status(404).end();
    res.sendFile(path.join(VOICE_FX_DIR, req.params.file), (err) => err && !res.headersSent && res.status(404).end());
  });
  router.get("/:id", handle(async (req) => view(await need(req.params.id))));

  // Describe what you want: (re)edits the whole ad. The timeline is rebuilt, so hand edits made since are replaced.
  router.post("/:id/edit", handle(async (req) => {
    const ad = await need(req.params.id);
    const prompt = clean(req.body?.prompt, 2000);
    // A re-edit's brief is the creator correcting the last result: it's kept as a lesson for every future ad.
    const redo = ad.status === "ready" && Boolean(await readAdDocument(ad.projectId, ad.clipId));
    if (prompt && redo && prompt !== ad.prompt) await addLesson({ ad: ad.name, prompt });
    await update(ad, {
      prompt,
      aspect: ASPECTS[req.body?.aspect] ? req.body.aspect : ad.aspect,
      options: optionsFrom(req.body?.options, ad.options),
      status: "waiting",
      message: "Starting…",
      error: null,
      history: [...(ad.history || []), { prompt, at: new Date().toISOString() }].slice(-20),
      redo,
      autoSave: req.body?.autoSave === true,
    });
    enqueueEdit(ad);
    return view(ad);
  }));

  // Brand logos for this ad: when the speaker names the brand, its logo flies in (look "logo").
  const logoUpload = multer({ dest: path.join(os.tmpdir(), "ads-logos"), limits: { fileSize: 20 * 1024 * 1024, files: 12 } });
  router.post("/:id/logos", logoUpload.array("logos", 12), handle(async (req) => {
    const ad = await need(req.params.id);
    const added = [];
    for (const f of req.files || []) {
      const ext = path.extname(f.originalname).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"].includes(ext)) {
        await fs.rm(f.path, { force: true });
        continue;
      }
      const id = `l${crypto.randomBytes(3).toString("hex")}`;
      const file = `${id}${ext}`;
      await fs.mkdir(path.join(LOGOS_DIR, ad.id), { recursive: true });
      await fs.copyFile(f.path, path.join(LOGOS_DIR, ad.id, file));
      await fs.rm(f.path, { force: true });
      added.push({ id, name: clean(path.basename(f.originalname, ext).replace(/[-_]+/g, " "), 60) || "Logo", file });
    }
    if (!added.length) throw new Error("Upload PNG, JPG, SVG or WebP logos.");
    await addToLibrary(ad.id, added);
    await update(ad, { logos: [...(ad.logos || []), ...added].slice(0, 20) });
    return view(ad);
  }));
  router.patch("/:id/logos/:logoId", handle(async (req) => {
    const ad = await need(req.params.id);
    const logo = (ad.logos || []).find((l) => l.id === req.params.logoId);
    if (logo && clean(req.body?.name)) await update(ad, { logos: ad.logos.map((l) => (l === logo ? { ...l, name: clean(req.body.name, 60) } : l)) });
    return view(ad);
  }));
  router.delete("/:id/logos/:logoId", handle(async (req) => {
    const ad = await need(req.params.id);
    const logo = (ad.logos || []).find((l) => l.id === req.params.logoId);
    if (logo) {
      await fs.rm(path.join(LOGOS_DIR, ad.id, logo.file), { force: true });
      await update(ad, { logos: ad.logos.filter((l) => l !== logo) });
    }
    return view(ad);
  }));
  router.get("/:id/logos/:file", async (req, res) => {
    const ad = await findAd(req.params.id);
    const logo = ad?.logos?.find((l) => l.file === req.params.file);
    if (!logo) return res.status(404).end();
    res.sendFile(path.join(LOGOS_DIR, ad.id, logo.file));
  });

  router.post("/:id/stop", handle(async (req) => {
    const ad = await need(req.params.id);
    jobs.get(ad.id)?.abort();
    jobs.delete(ad.id);
    const q = editQueue.indexOf(ad.id);
    if (q >= 0) editQueue.splice(q, 1);
    const doc = await readAdDocument(ad.projectId, ad.clipId);
    await update(ad, { status: doc ? "ready" : "new", message: "" });
    return view(ad);
  }));

  router.patch("/:id", handle(async (req) => {
    const ad = await need(req.params.id);
    if (typeof req.body?.name === "string" && clean(req.body.name)) await update(ad, { name: clean(req.body.name, 120), renamed: true });
    return view(ad);
  }));

  // Change a finished ad's colour grade on the spot (no re-edit). Saving the video afterwards bakes it in.
  router.post("/:id/grade", handle(async (req) => {
    const ad = await need(req.params.id);
    if (ad.status !== "ready" || jobs.has(ad.id)) throw new Error("Wait for the edit to finish first.");
    const controller = new AbortController();
    await applyGrade(ad, optionsFrom(req.body?.options, ad.options), controller.signal);
    return view(ad);
  }));

  // Save: render the ad (as it stands in the timeline) to an MP4.
  router.post("/:id/save", handle(async (req) => {
    const ad = await need(req.params.id);
    const project = await loadProject(ad.projectId);
    const doc = await readAdDocument(ad.projectId, ad.clipId);
    if (!project || !doc) throw new Error("Edit the ad first.");
    const clip = project.clips?.find((c) => c.id === ad.clipId);
    if (!clip) throw new Error("Edit the ad first.");
    queueRender(project, clip.id, { design: doc.design });
    await update(ad, { renderedRev: doc.rev });
    return view(ad);
  }));

  router.post("/:id/cancel", handle(async (req) => {
    const ad = await need(req.params.id);
    const project = await loadProject(ad.projectId);
    if (project) cancelRender(project, ad.clipId);
    return view(ad);
  }));

  router.get("/:id/graded.mp4", async (req, res) => {
    const ad = await findAd(req.params.id);
    if (!ad?.preview?.file) return res.status(404).end();
    res.sendFile(path.join(DATA_DIR, "previews", ad.preview.file));
  });

  // The finished ad's transcript, from the timeline as it stands: ?format=txt (default) or srt.
  router.get("/:id/transcript", async (req, res) => {
    const ad = await findAd(req.params.id);
    const doc = ad ? await readAdDocument(ad.projectId, ad.clipId) : null;
    if (!doc) return res.status(404).type("text").send("Edit the ad first.");
    const words = doc.tracks
      .filter((t) => t.kind === "caption")
      .flatMap((t) => t.clips)
      .sort((a, b) => a.start - b.start)
      .flatMap((c) => c.words.map((w) => ({ text: w.text, s: c.start + w.s, e: c.start + w.e })));
    const base = String(ad.name || "ad").replace(/[^\w .-]+/g, "").trim() || "ad";
    if (req.query.format === "srt") {
      const stamp = (t) => {
        const ms = Math.max(0, Math.round(t * 1000));
        const p = (n, w = 2) => String(n).padStart(w, "0");
        return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
      };
      const cues = [];
      for (let i = 0; i < words.length; ) {
        const line = [words[i++]];
        while (i < words.length && line.length < 7 && words[i].s - line.at(-1).e < 0.6 && !/[.?!]$/.test(line.at(-1).text)) line.push(words[i++]);
        cues.push(`${cues.length + 1}\n${stamp(line[0].s)} --> ${stamp(line.at(-1).e)}\n${line.map((w) => w.text).join(" ")}\n`);
      }
      return res.attachment(`${base}.srt`).type("text/plain").send(cues.join("\n"));
    }
    // Plain text: one paragraph per sentence.
    const text = words.map((w) => w.text).join(" ").replace(/\s+([,.?!])/g, "$1").replace(/([.?!])\s+/g, "$1\n\n").trim();
    res.attachment(`${base} transcript.txt`).type("text/plain").send(`${text}\n`);
  });

  router.get("/:id/download", async (req, res) => {
    const ad = await findAd(req.params.id);
    const project = ad ? await loadProject(ad.projectId) : null;
    const done = project?.clips?.find((c) => c.id === ad.clipId);
    const file = done && finishedRender(done)?.file;
    if (!file) return res.status(404).type("text").send("This ad hasn't been saved yet.");
    const name = `${String(ad.name || "ad").replace(/[^\w .-]+/g, "").trim() || "ad"}.mp4`;
    res.download(path.join(projectDir(project.id), file), name);
  });

  // Forget the ad. The uploaded video stays in Projects.
  // Delete an ad and everything it takes up: its video (the project, with renders and working copies), the
  // timeline, previews, backups and logos. ?keepVideo=1 forgets only the ad.
  router.delete("/:id", handle(async (req) => {
    const ad = await need(req.params.id);
    if (jobs.has(ad.id) || editQueue.includes(ad.id)) {
      jobs.get(ad.id)?.abort();
      jobs.delete(ad.id);
      const q = editQueue.indexOf(ad.id);
      if (q >= 0) editQueue.splice(q, 1);
    }
    const freed = await adSize(ad);
    if (req.query.keepVideo !== "1") {
      const project = await loadProject(ad.projectId);
      if (project) {
        // The engine's own delete: stops renders, removes the folder and any scheduled posts for it.
        const res = await fetch(`http://localhost:${Number(process.env.PORT) || 5173}/api/projects/${ad.projectId}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't delete the video.");
      }
      await fs.rm(path.join(EDITOR_DIR, ad.projectId), { recursive: true, force: true });
      await fs.rm(path.join(HISTORY_DIR, `${ad.projectId}-${ad.clipId}`), { recursive: true, force: true });
    }
    await fs.rm(path.join(LOGOS_DIR, ad.id), { recursive: true, force: true });
    for (const f of await fs.readdir(path.join(DATA_DIR, "previews")).catch(() => [])) if (f.startsWith(`${ad.id}-`)) await fs.rm(path.join(DATA_DIR, "previews", f), { force: true });
    for (const f of await fs.readdir(VOICE_FX_DIR).catch(() => [])) if (f.startsWith(`${ad.projectId}-`)) await fs.rm(path.join(VOICE_FX_DIR, f), { force: true });
    const fresh = await load(); // re-read: the steps above take a while, and another process may have written the list
    fresh.ads = fresh.ads.filter((a) => a.id !== ad.id);
    await persist();
    sizeCache.delete(ad.id);
    return { ok: true, freed };
  }));

  return { router };
}

export const { router } = createAds();

/** A restart loses running edit jobs: say so on the ads that were mid-edit. */
/** A restart loses running and queued edits: put them back in line, oldest first, so a batch carries on by itself. */
export async function start() {
  const db = await load();
  const pending = db.ads.filter((a) => ["waiting", "planning", "queued"].includes(a.status)).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  for (const ad of pending) enqueueEdit(ad);
}

export default { router, start };
