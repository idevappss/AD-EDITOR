// Plan → timeline. The ad becomes an ordinary editor document (editor/document.js) for the project's "ad" clip:
// the kept pieces as linked video + voice clips, captions, the motion graphics, big glowing words, sound effects
// and the music bed, each on its own track. The editor opens it as-is, and renders follow it (lib/pipeline.js
// renders edited documents exactly), so preview, timeline and saved video all match.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ASPECTS, groupCaptions, normalizeDesign } from "../lib/compose.js";
import { ROOT } from "../lib/tools.js";
import { clipMusic, subtractRanges } from "../lib/clipplan.js";
import { formatMoney } from "../lib/money.js";
import { tightenClip } from "../lib/tighten.js";
import { DATA_DIR as EDITOR_DIR } from "../editor/media.js";
import { CTA_CLICK, GRADES, LOOKS, SFX, listTimes, parseStat, statCount } from "./graphics.js";
import { TEMPLATES } from "./templates/index.js";

export const AD_CLIP = "ad";
const r3 = (n) => Math.round(n * 1000) / 1000;
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const clampIdx = (i, n) => Math.min(n - 1, Math.max(0, Math.round(Number(i) || 0)));

/** Where each sound effect peaks, in seconds into its file: sounds are placed so the peak lands on the moment. */
const PEAK = { "whoosh-cinematic": 2.9, riser: 3.0, "impact-bass-1": 0.1, "impact-bass-2": 1.85, "whoosh-short": 0.15, whoosh: 0.3, pop: 0.02, crash: 0.02, click: 0.02, cash: 0.1, counter: 0,
  slice: 0.3, bell: 0.01, boom: 1.3, bloop: 0.01, tick: 0.005, air: 0.5, chirp: 0.02, ticker: 0, ping: 0.01, bigswoosh: 0.35, revswell: 1.05, whistle: 0.07, swoosh: 0.22 };

/**
 * Sound palettes, so ads don't all sound the same: the same moments, different sounds. "classic" is the original
 * set; each palette maps a classic sound to its own (null = leave it out). Chosen per ad, never the same twice running.
 */
// Cut hits: how long each lasts on the timeline, and the sound that sells it (by peak time).
const HIT_LEN = { shake: 0.35, "zoom-blur": 0.3, whip: 0.28, flash: 0.35, bw: 1, rgb: 0.45 };
const HIT_SFX = {
  shake: [["impact-bass-1", 0, 0.4]],
  "zoom-blur": [["boom", 0.2, 0.42]],
  whip: [["swoosh", 0.12, 0.5]],
  flash: [["bigswoosh", 0.05, 0.4]],
  bw: [["slice", 0, 0.4]],
  rgb: [["glitch-1", 0, 0.3]],
};

export const PALETTES = {
  classic: {},
  crisp: { cash: "bell", pop: "tick", counter: "ticker", "impact-bass-1": "boom", "whoosh-short": "swoosh", whoosh: "swoosh", crash: "slice", "whoosh-cinematic": "revswell", riser: null, click: "tick" },
  airy: { cash: "ping", pop: "bloop", counter: "ticker", "impact-bass-1": "boom", "whoosh-short": "air", whoosh: "air", "whoosh-cinematic": "bigswoosh", riser: null, click: "click" },
};

/** Automatic sound design per graphic: [sound, offset from the graphic's start, volume]. */
const GRAPHIC_SFX = {
  headline: [["whoosh-short", -0.05, 0.45]],
  stat: [],
  list: [["whoosh", -0.05, 0.35]],
  compare: [["whoosh", -0.05, 0.35]],
  "lower-third": [["whoosh", 0, 0.35]],
  callout: [["pop", 0, 0.55]],
  proof: [["pop", 0.1, 0.5]],
  slide: [["whoosh", 0, 0.4]],
  check: [["whoosh-short", 0.05, 0.35], ["pop", 0.68, 0.6]],
  icon: [["pop", 0.05, 0.5]],
  cta: [["whoosh-short", 0.1, 0.4], ["click", CTA_CLICK, 0.9]],
};

/** A testimonial moment: the member's line and name from data/ads/testimonials.json. */
function proofGraphic(g, testimonials = []) {
  const t = testimonials.find((x) => x.id === g.proof) || null;
  return t ? { ...g, look: "proof", text: t.line, sub: t.name, position: "bottom" } : { ...g, look: "none" };
}

/** Caption clips from words on the cut timeline ({ text, s, e }), in the creator's spellings. */
export function captionClips(words, D, design) {
  // The creator's spellings for the names in their ads (the transcript hears "chat GBT").
  const spell = (t) => String(t).replace(/^chat[-\s]?g[bp]t/i, "ChatGPT");
  // Whisper often splits the name in two ("chat" + "GBT."): join them into one word first.
  const joined = [];
  for (const w of words.filter((x) => norm(x.text) && x.s < D)) {
    const prev = joined.at(-1);
    if (prev && /^chat$/i.test(String(prev.text).trim()) && /^g[bp]t\b/i.test(String(w.text).trim())) joined[joined.length - 1] = { ...prev, text: `chat${String(w.text).trim()}`, e: w.e };
    else joined.push(w);
  }
  const spoken = formatMoney(joined.map((w) => ({ ...w, text: spell(w.text) })));
  return groupCaptions(spoken, D, { maxWords: design.maxWords }).map((g, i) => ({
    id: `c${i + 1}`,
    type: "caption",
    start: g.in,
    duration: r3(g.out - g.in),
    words: g.words.map((w) => ({ text: w.text, s: r3(Math.max(0, w.s - g.in)), e: r3(Math.max(0, w.e - g.in)) })),
  }));
}

/** Source seconds → seconds on the cut timeline (a moment that was cut lands where the next piece starts). */
function mapper(parts) {
  return (sec) => {
    for (const p of parts) {
      if (sec < p.start) return p.t;
      if (sec <= p.end) return r3(p.t + (sec - p.start));
    }
    const last = parts.at(-1);
    return last ? r3(last.t + last.dur) : 0;
  };
}

/**
 * Words the transcript stretched over chatter it never wrote down ("everyone…hold on" as one word): the word ends at
 * the quietest instant after it could plausibly be finished, found in the voice's 10 ms levels when we have them.
 */
export function trimStretchedWords(words, levels) {
  return words.map((w) => {
    const len = String(w.text || "").replace(/[^\p{L}\p{N}]/gu, "").length;
    const plausible = Math.max(0.35, 0.075 * len + 0.18);
    if (w.end - w.start <= plausible + 0.25) return w;
    let end = w.start + plausible;
    if (levels) {
      const from = Math.round((w.start + plausible * 0.7) / 0.01);
      const to = Math.min(levels.length - 1, Math.round(w.end / 0.01));
      let best = from;
      for (let i = from; i <= to; i++) if (levels[i] < levels[best]) best = i;
      end = Math.min(w.end, best * 0.01 + 0.03);
    }
    return { ...w, end: r3(end), stretched: true };
  });
}

/** Runs of speech (voice above −32 dB for 60 ms+, gaps under 150 ms bridged) between two times, from the 10 ms levels. */
function speechBursts(levels, from, to) {
  const out = [];
  let run = null;
  for (let i = Math.max(0, Math.round(from / 0.01)); i <= Math.min(levels.length - 1, Math.round(to / 0.01)); i++) {
    const t = i * 0.01;
    if (levels[i] > -32) {
      if (run && t - run.end <= 0.15) run.end = t + 0.01;
      else out.push((run = { start: t, end: t + 0.01 }));
    }
  }
  return out.filter((b) => b.end - b.start >= 0.06);
}

/**
 * Word timings can be off by a second at the edge of a take, and whatever the transcript didn't write down ("hold
 * on", "okay") hides inside a stretched word. So a kept range ends where its last word's sound really ends: when the
 * stretch after the previous word holds two bursts of speech with a real pause (0.35 s+) between them, the word is
 * the first burst and the range stops at the pause. The same at the start, for chatter before the first word.
 */
function trimToSpeech(range, words, levels) {
  if (!levels) return range;
  const last = words[range.toIdx];
  const prevEnd = range.toIdx > range.fromIdx ? words[range.toIdx - 1].end : range.start;
  const tail = speechBursts(levels, prevEnd - 0.05, range.end);
  for (let i = 1; i < tail.length; i++) {
    if (tail[i].start - tail[i - 1].end >= 0.35 && tail[i - 1].end > prevEnd + 0.05 && tail[i - 1].end < last.end) {
      range.end = r3(Math.min(range.end, tail[i - 1].end + 0.12));
      // The word itself was mistimed onto the chatter: put it back on its sound so it stays in the cut.
      if (last.start >= tail[i - 1].end) words[range.toIdx] = { ...last, start: r3(Math.max(prevEnd, tail[i - 1].start)), end: r3(tail[i - 1].end) };
      break;
    }
  }
  const first = words[range.fromIdx];
  const nextStart = range.toIdx > range.fromIdx ? words[range.fromIdx + 1].start : range.end;
  const head = speechBursts(levels, range.start, nextStart + 0.05);
  for (let i = head.length - 1; i > 0; i--) {
    if (head[i].start - head[i - 1].end >= 0.35 && head[i].start < nextStart - 0.05 && head[i].start > first.start) {
      range.start = r3(Math.max(range.start, head[i].start - 0.1));
      if (first.end <= head[i].start) words[range.fromIdx] = { ...first, start: r3(head[i].start), end: r3(Math.min(nextStart, head[i].end)) };
      break;
    }
  }
  return range;
}

/**
 * Ranges cut down to their words: with exact word timings (each take re-transcribed), everything that isn't a word
 * comes out — dead air and chatter the transcript didn't hear — keeping a little air around each word and bridging
 * gaps under a quarter second, like a hand jump-cut. No loudness threshold, so soft lines are never lost.
 */
function speechOnly(ranges, words, levels = null, exclude = []) {
  // A word's edges pulled in to where the voice is audible at all (−40 dB): a timing stretched over silence doesn't
  // keep the silence. A word with no audible frame at all keeps its timing.
  // (Real bursts of voice, not noise blips: a take's first word is often timed onto the silence before it.)
  // A take's first word is often timed early, over the tail of the line before it ("…everyone. | Atlas"): it starts
  // at the last burst after a real pause (0.2 s+) in its timing. A take's last word ends at the first such burst.
  const groups = (bursts) => bursts.reduce((out, b) => {
    const last = out.at(-1);
    if (last && b.start - last.end < 0.2) last.end = b.end;
    else out.push({ ...b });
    return out;
  }, []);
  const audible = (w, edge = null) => {
    if (!levels) return w;
    let bursts = speechBursts(levels, w.start, w.end);
    if (edge) {
      // Look half a second past the word's timing too: its real sound may start (or end) just outside it.
      const g = groups(edge === "first" ? speechBursts(levels, w.start, w.end + 0.5) : speechBursts(levels, w.start - 0.5, w.end));
      const pick = edge === "first" ? g.filter((x) => x.start <= w.end + 0.15).at(-1) : g.find((x) => x.end >= w.start - 0.15);
      if (pick) return edge === "first" ? { start: Math.max(w.start, pick.start - 0.05), end: Math.max(pick.start + 0.15, Math.min(w.end, pick.end) + 0.06) } : { start: Math.min(pick.end - 0.15, Math.max(w.start, pick.start) - 0.05), end: Math.min(w.end, pick.end + 0.06) };
    }
    if (!bursts.length) {
      // No voice at all where the word is timed: it's timed onto the silence before it. It's the next burst.
      const next = speechBursts(levels, w.end, w.end + 1.6)[0];
      return next ? { start: next.start - 0.05, end: Math.min(next.end, next.start + Math.max(0.2, w.end - w.start)) + 0.06 } : w;
    }
    return { start: Math.max(w.start, bursts[0].start - 0.05), end: Math.min(w.end, bursts.at(-1).end + 0.06) };
  };
  const out = [];
  for (const r of ranges) {
    const inTake = words.filter((w) => w.end > r.start + 0.02 && w.start < r.end - 0.02);
    const spans = inTake
      .map((w, i) => audible(w, i === 0 ? "first" : i === inTake.length - 1 ? "last" : null))
      .map((w) => ({ start: Math.max(r.start, w.start - 0.06), end: Math.min(r.end, w.end + 0.12) }))
      .sort((a, b) => a.start - b.start);
    // A gap that holds real speech the transcript missed ("for health|care") is kept whole, never cut: only true
    // silence between words comes out. (Chatter at a take's edges is handled by trimToSpeech and the plan.)
    const spoken = (a, b) => levels && speechBursts(levels, a, b).some((x) => x.end - x.start >= 0.12);
    const merged = [];
    for (const sp of spans) {
      const last = merged.at(-1);
      if (last && (sp.start - last.end < 0.25 || (sp.start - last.end < 1.0 && spoken(last.end, sp.start)))) last.end = Math.max(last.end, sp.end);
      else merged.push({ ...sp });
    }
    // Stretches the listen-back found silent in the finished ad come out too.
    // Stretches the listen-back found silent come out too, and a leftover sliver that holds no word is noise.
    const timed = inTake.map((w, i) => audible(w, i === 0 ? "first" : i === inTake.length - 1 ? "last" : null));
    const pieces = subtractRanges(merged, exclude)
      .map((p) => ({ start: r3(p.start), end: r3(p.end) }))
      .filter((p) => p.end - p.start >= 0.15 && timed.some((w) => (w.start + w.end) / 2 > p.start && (w.start + w.end) / 2 < p.end));
    out.push(...(pieces.length ? pieces : [r]));
  }
  return out;
}

/**
 * Restarts inside a take ("that that you can", "Well, AI… Well, AI employees"): when a run of 1–4 words is said again
 * straight away, the first saying is dropped (the cut keeps only words, so its sound goes too).
 */
export function dropRestarts(words) {
  const key = (w) => String(w.text || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const out = [...words];
  for (let i = 0; i < out.length; i++) {
    for (let k = 4; k >= 1; k--) {
      if (i + 2 * k > out.length) continue;
      let same = true;
      for (let j = 0; j < k; j++) if (!key(out[i + j]) || key(out[i + j]) !== key(out[i + k + j])) same = false;
      // Only a real restart: the repeat follows within a couple of seconds.
      if (same && out[i + k].start - out[i + k - 1].end < 2.5) {
        out.splice(i, k);
        i = Math.max(-1, i - 2);
        break;
      }
    }
  }
  return out;
}

/** Kept word ranges → source time ranges, in play order, with neighbours in the source merged. */
function keepRanges(plan, words, levels = null) {
  const n = words.length;
  const ranges = [];
  for (const k of plan.keep || []) {
    let from = clampIdx(k.from, n);
    let to = clampIdx(k.to, n);
    if (to < from) [from, to] = [to, from];
    const prevEnd = from > 0 ? words[from - 1].end : 0;
    const nextStart = to < n - 1 ? words[to + 1].start : Infinity;
    const start = r3(Math.max(0, prevEnd + 0.02, words[from].start - 0.14));
    const end = r3(Math.min(nextStart - 0.02, words[to].end + 0.2));
    const last = ranges.at(-1);
    if (last && last.toIdx + 1 === from) Object.assign(last, { end, toIdx: to });
    else ranges.push({ start, end, fromIdx: from, toIdx: to });
  }
  return ranges.map((r) => trimToSpeech(r, words, levels)).filter((r) => r.end - r.start >= 0.2);
}

/**
 * Build the editor document for an ad.
 * @returns { doc, duration, stats }
 */
export async function buildAdDocument({ project, plan, words, aspect, options = {}, sfxDuration, levels = null, realign = null }) {
  words = [...words]; // keepRanges may re-time mistimed edge words onto their real sound
  const n = words.length;
  const ranges = keepRanges(plan, words, levels);
  // Long-video word timings drift by up to a second; each kept take re-transcribed on its own is exact. Its words
  // replace the take's words, for the captions and for where the cuts land.
  const planWords = words;
  if (realign) words = await realign(ranges, words);
  else words = trimStretchedWords(words, levels);
  // Widened takes must never overlap (that plays a word twice): takes that run on in the footage merge into one,
  // and a take that starts inside the one before it starts where that one ends.
  for (let i = 1; i < ranges.length; i++) {
    const a = ranges[i - 1];
    const b = ranges[i];
    if (b.start < a.end && b.end > a.start) {
      if (b.start >= a.start) {
        a.end = Math.max(a.end, b.end);
        ranges.splice(i--, 1);
      } else b.end = Math.min(b.end, a.start);
    }
  }
  // Only the words inside the kept takes matter from here; outside ones would sit between a restart and its repeat.
  words = dropRestarts(words.filter((w) => ranges.some((r) => w.end > r.start + 0.02 && w.start < r.end - 0.02)));
  // Slips the listen-back found in the finished ad: exactly those words (matched by text, nearest to where they were
  // heard) come out, and with them their sound. Timings there are approximate, so nothing else is touched.
  const key = (w) => String(w.text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const x of (options.exclude || []).filter((e) => e.words?.length)) {
    const near = words.map((w, i) => ({ w, i })).filter(({ w }) => w.end > x.start - 0.8 && w.start < x.end + 0.8);
    for (let j = 0; j + x.words.length <= near.length; j++) {
      if (x.words.every((k, n) => key(near[j + n].w) === k)) {
        const drop = new Set(near.slice(j, j + x.words.length).map((n) => n.i));
        words = words.filter((_, i) => !drop.has(i));
        break;
      }
    }
  }
  if (!ranges.length) throw new Error("There's nothing left to keep in this video.");
  // Dead air goes, whatever the transcript says: each range keeps only where the voice is actually going (gaps
  // under a quarter second bridged), like a hand jump-cut. Then the usual filler and pause tightening.
  const tight = tightenClip(words, speechOnly(ranges, words, levels, (options.exclude || []).filter((e) => e.silent)), { filler: true, pauseMax: 0.3, pauseKeep: 0.1, minPiece: 0.9, absorbMax: 0.2 });
  let clock = 0;
  const parts = tight.parts.map((p) => {
    const part = { start: p.start, end: p.end, t: r3(clock), dur: r3(p.end - p.start) };
    clock += part.dur;
    return part;
  });
  const D = r3(clock);
  const at = mapper(parts);
  const wordAt = (i) => at(planWords[clampIdx(i, n)].start);
  const wordEnd = (i) => at(planWords[clampIdx(i, n)].end);

  const tall = ASPECTS[aspect]?.height > ASPECTS[aspect]?.width;
  const grade = GRADES[plan.grade] ? plan.grade : "clean";
  const design = normalizeDesign({
    style: "talk",
    aspect,
    captions: options.captions === true,
    // Small and low, clear of the face (the creator's call).
    captionY: tall ? 80 : 86,
    captionScale: 0.45,
    // Plain captions: no italic serif emphasis (the creator's rule).
    highlight: "none",
    // The ad's own framing program (ads/graphics.js adFraming) replaces the composer's drift and punches.
    motion: "none",
    zoom: false,
    autoFrame: true,
    musicBed: options.music === true && plan.music !== false ? "auto" : "none",
    grade: grade === "none" ? "none" : "clean",
    lut: options.lut || "none",
    ...(options.accent ? { accentColor: options.accent } : {}),
  });

  // Captions on the cut timeline, grouped the way the composer groups them.
  const captions = captionClips(tight.words, D, design);

  // Motion graphics: never two at once, at least 1.2s each, held a beat past the line.
  const graphics = [];
  const planned = (plan.graphics || [])
    // The planner returns logo moments ({ logos[], strike }); anything else (older plans) needs its words.
    .map((g) => (g.kind === "number" ? { ...g, look: "stat", position: "center" } : g.kind === "checklist" ? { ...g, look: "list", position: "bottom" } : g.kind === "cta" ? { ...g, look: "cta", position: "bottom", text: g.text || "Book a call" } : g.kind === "proof" ? proofGraphic(g, options.testimonials) : g.kind === "check" ? { ...g, look: "check", position: "center" } : g.kind === "template" && TEMPLATES[g.template] ? { ...g, look: g.template, position: TEMPLATES[g.template].position } : g.kind === "slide" && (options.slides || []).some((x) => x.id === g.slide) ? { ...g, look: "slide", position: "top", text: g.text || " " } : g))
    .map((g) => (g.kind === "logos" && Array.isArray(g.logos) ? { ...g, look: "logo", logos: g.logos.filter((id) => (options.logos || []).some((l) => l.id === id)).slice(0, 3) } : g))
    .filter((g) => LOOKS[g.look] && (g.look === "logo" ? g.logos?.length : g.look === "list" ? (g.items || []).filter(Boolean).length >= 2 : String(g.text || "").trim()))
    .map((g) => ({ g, t0: Math.max(0, wordAt(g.at) - 0.1), t1: Math.min(D, wordEnd(Math.max(g.at, g.until)) + 0.35) }))
    .sort((a, b) => a.t0 - b.t0);
  for (const [i, { g, t0, t1: end }] of planned.entries()) {
    const next = planned[i + 1];
    let t1 = Math.max(end, t0 + (g.look === "list" ? 1.2 + (g.items?.length || 1) * 0.7 : g.look === "cta" ? 2.6 : g.look === "proof" || g.look === "slide" ? 3.2 : 1.8));
    t1 = Math.min(t1, t0 + (g.look === "cta" ? 9 : 7), D, next ? next.t0 - 0.12 : D);
    const prev = graphics.at(-1);
    if (prev && t0 < prev.start + prev.duration) {
      if (t0 - 0.1 - prev.start >= 1.0 || g.look === "cta") prev.duration = r3(Math.max(0.6, t0 - 0.1 - prev.start));
      else continue;
      if (prev.duration < 0.8) graphics.pop();
    }
    if (t1 - t0 < 1.2) continue;
    // Style rotation for the built-in looks (a different number card or CTA from the last ad).
    const variant = g.look === "stat" && options.variants?.stat === "pill" ? { variant: "pill" } : {};
    const look = g.look === "cta" && options.variants?.cta === "sonar" ? "sonar-cta" : g.look;
    graphics.push({
      ...variant,
      id: `g${graphics.length + 1}`,
      type: "graphic",
      start: r3(t0),
      duration: r3(t1 - t0),
      look,
      text: String(g.text || "").trim().slice(0, 120),
      ...(g.look === "logo" ? { logos: g.logos, ...(g.strike ? { strike: true } : {}) } : {}),
      ...(g.look === "slide" ? { slide: g.slide } : {}),
      ...(TEMPLATES[g.look] && g.logos?.length ? { logos: g.logos.slice(0, 3) } : {}),
      // The hero logo carries its name underneath (the brand as uploaded), unless the plan wrote one.
      ...(g.look === "logo" && !g.strike && !String(g.text || "").trim() ? { text: ((options.logos || []).find((l) => l.id === g.logos[0])?.name || "").toUpperCase() } : {}),
      sub: String(g.sub || "").trim().slice(0, 120),
      highlight: String(g.highlight || "").trim().slice(0, 60),
      items: (g.items || []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 5),
      icon: g.icon || "",
      position: g.look === "logo" ? "top" : g.position,
    });
  }
  // Number moments are never optional (the creator's call): any money figure, "24/7" or "N days free" said in the
  // cut that has no graphic on it gets its counter card, even when the plan left it out.
  const NUM_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, fourteen: 14, thirty: 30 };
  const said = tight.words.filter((w) => w.s < D);
  const moments = [];
  said.forEach((w, i) => {
    const t = String(w.text).replace(/[.,!?]+$/, "");
    const next = said.slice(i + 1, i + 3).map((x) => String(x.text).toLowerCase().replace(/[^a-z]/g, ""));
    if (/^\$\d/.test(t)) moments.push({ s: w.s, text: t.replace(/\/month$/i, "/mo"), money: true });
    else if (/^24[-/]7$/.test(t)) moments.push({ s: w.s, text: "24/7" });
    else if ((/^\d+$/.test(t) || NUM_WORDS[t.toLowerCase()]) && /^days?$/.test(next[0] || "") && next[1] === "free") moments.push({ s: w.s, text: `${/^\d+$/.test(t) ? t : NUM_WORDS[t.toLowerCase()]} days free` });
  });
  for (const m of plan.auto_numbers === false ? [] : moments.slice(0, 4)) {
    const t0 = r3(Math.max(0, m.s - 0.1));
    const t1 = r3(Math.min(D, t0 + 1.8));
    if (t1 - t0 < 1.2 || graphics.some((g) => t0 < g.start + g.duration + 0.2 && t1 > g.start - 0.2)) continue;
    graphics.push({ id: `g${graphics.length + 1}`, type: "graphic", start: t0, duration: r3(t1 - t0), look: "stat", text: m.text, sub: "", highlight: "", items: [], icon: "", position: "center" });
  }
  // The click button is never optional either: when the speaker says "click / tap / comment…" and there's no CTA,
  // the button goes on that word (it takes the spot over any card already there).
  if (!graphics.some((g) => g.look === "cta" || TEMPLATES[g.look]?.job === "cta")) {
    const ask = said.find((w, i) => /^(click|tap|comment|dm)$/i.test(String(w.text).replace(/[^a-z]/gi, "")) && i > said.length * 0.5);
    if (ask) {
      const t0 = r3(Math.max(0, ask.s - 0.1));
      const t1 = r3(Math.min(D - 0.02, t0 + 2.6));
      for (let i = graphics.length - 1; i >= 0; i--) {
        const g = graphics[i];
        if (g.start < t1 && g.start + g.duration > t0) {
          if (g.start < t0 - 1.1) g.duration = r3(t0 - 0.1 - g.start);
          else graphics.splice(i, 1);
        }
      }
      if (t1 - t0 >= 1.2) graphics.push({ id: "gcta", type: "graphic", start: t0, duration: r3(t1 - t0), look: options.variants?.cta === "sonar" ? "sonar-cta" : "cta", text: options.ctaText || "Try it free", sub: "", highlight: "", items: [], icon: "", position: "bottom" });
    }
  }
  graphics.sort((a, b) => a.start - b.start);
  graphics.forEach((g, i) => (g.id = `g${i + 1}`));
  const busy = (t0, t1) => graphics.some((g) => t0 < g.start + g.duration && t1 > g.start);

  // Intentional camera moves (punch in / slow push / pull out), never under a graphic: ads/graphics.js frames them.
  const camera = [];
  const clash = (t0, t1) => graphics.some((g) => t0 < g.start + g.duration && t1 > g.start - 0.1) || camera.some((c) => t0 < c.start + c.duration && t1 > c.start);
  // Cut hits (FastFX / CapCut-style): short effects on the footage, each with its sound. Transitions sit on the cut.
  const cuts = parts.slice(1).map((p) => p.t);
  const nearCut = (t) => cuts.reduce((best, c) => (Math.abs(c - t) < Math.abs(best - t) ? c : best), Infinity);
  for (const m of [...(plan.camera || [])].sort((a, b) => a.at - b.at)) {
    let t0 = r3(Math.max(0, wordAt(m.at) - 0.04));
    let t1;
    if (["punch", "push", "pull"].includes(m.move)) {
      t1 = r3(Math.min(D, Math.max(t0 + (m.move === "push" ? 1.2 : 0.8), wordEnd(Math.max(m.at, m.until ?? m.at)) + 0.1), t0 + (m.move === "push" ? 4 : 3)));
      if (t1 - t0 < 0.5) continue;
    } else if (HIT_LEN[m.move]) {
      const cut = nearCut(t0);
      if (["whip", "flash"].includes(m.move) && Math.abs(cut - t0) < 0.6) t0 = r3(Math.max(0, cut - (m.move === "whip" ? 0.12 : 0.05)));
      t1 = m.move === "bw" ? r3(Math.min(D, t0 + 1.5, Math.max(t0 + 0.6, wordEnd(Math.max(m.at, m.until ?? m.at)) + 0.1))) : r3(Math.min(D, t0 + HIT_LEN[m.move]));
    } else continue;
    if (clash(t0, t1) || camera.filter((c) => HIT_LEN[c.move]).length >= 5) continue;
    camera.push({ id: `k${camera.length + 1}`, type: "camera", start: t0, duration: r3(t1 - t0), move: m.move });
  }

  // Voice effects: the voice goes underwater / muffled / through a phone on one line (ads/voicefx.js). Underwater lands
  // with a boom and a punch-in, like the reference.
  const voicefx = [];
  for (const v of plan.voice_fx || []) {
    const t0 = r3(Math.max(0, wordAt(v.at) - 0.03));
    const t1 = r3(Math.min(D - 0.3, wordEnd(Math.max(v.at, v.until ?? v.at)) + 0.05, t0 + 2.5));
    const ctaAt = graphics.find((g) => g.look === "cta" || TEMPLATES[g.look]?.job === "cta")?.start ?? D;
    if (t0 < 2 || t1 - t0 < 0.4 || t1 > ctaAt || voicefx.length >= 2 || (v.effect === "underwater" && voicefx.some((x) => x.effect === "underwater"))) continue;
    voicefx.push({ id: `x${voicefx.length + 1}`, type: "voicefx", start: t0, duration: r3(t1 - t0), effect: v.effect });
    if (v.effect === "underwater" && !clash(t0, t1)) camera.push({ id: `k${camera.length + 1}`, type: "camera", start: t0, duration: r3(t1 - t0), move: "punch" });
  }
  camera.sort((a, b) => a.start - b.start);
  camera.forEach((c, i) => (c.id = `k${i + 1}`));

  // Big glowing words behind the speaker, where no graphic is up.
  const emphasis = [];
  for (const e of plan.emphasis || []) {
    const t0 = r3(Math.max(0, wordAt(e.at) - 0.05));
    const t1 = r3(Math.min(D, Math.max(t0 + 1.6, wordEnd(Math.max(e.at, e.until)) + 0.3), t0 + 3.5));
    const text = String(e.text || "").trim().split(/\s+/).slice(0, 5).join(" ");
    if (!text || t1 - t0 < 1.2 || busy(t0, t1) || emphasis.some((x) => t0 < x.start + x.duration + 1 && t1 > x.start - 1)) continue;
    emphasis.push({ id: `e${emphasis.length + 1}`, type: "emphasis", start: t0, duration: r3(t1 - t0), text });
  }

  // Sound design: every graphic and big caption gets its hit, list items pop in, a riser leads into the CTA.
  const sounds = [];
  // Every sound goes in by its peak: `t` is when the loudest moment should hit.
  // The creator's sound notes, via the plan: sounds to leave out, and how much sound design overall.
  const avoid = new Set(plan.sound?.avoid || []);
  const level = { quiet: 0.6, normal: 1, punchy: 1.2 }[plan.sound?.level] ?? 1;
  const swap = PALETTES[options.palette] || {};
  const addSfx = (name, t, volume, extra = {}) => {
    if (name in swap) name = swap[name];
    if (!name || !SFX[name] || options.sfx === false || avoid.has(name)) return;
    volume *= level;
    // Quiet: only the sounds that carry a moment (hits on logos/X, pops, clicks, cha-ching), no build-ups.
    if (level < 1 && ["riser", "whoosh-cinematic", "whoosh", "glitch-1", "glitch-2"].includes(name)) return;
    const peak = PEAK[name] ?? 0;
    const lead = extra.lead ?? peak; // how much build-up before the peak we have room for
    const skip = Math.max(0, peak - lead, peak - t); // start into the file when there isn't room for all of it
    extra = { ...extra, offset: r3((extra.offset || 0) + skip), duration: extra.duration ?? Math.max(0.3, (sfxDuration(name) ?? 1.5) - skip) };
    t -= peak - skip;
    const start = r3(Math.max(0, t));
    if (start >= D || sounds.some((s) => s.sfx === name && Math.abs(s.start - start) < 0.15)) return;
    const len = Math.max(0.2, Math.min(extra.duration, 3.5, D - start));
    sounds.push({ id: `s${sounds.length + 1}`, type: "sfx", start, duration: r3(len), sfx: name, volume: r3(volume * (options.sfxLevel ?? 1)), ...(extra.offset > 0 ? { offset: extra.offset } : {}) });
  };
  for (const g of graphics) {
    for (const [name, off, vol] of GRAPHIC_SFX[g.look] || TEMPLATES[g.look]?.sfx || []) addSfx(name, off < 0 ? g.start + g.duration + off : g.start + off, vol);
    if (g.look === "list") {
      // A pop as each item's bubble lands (timings shared with the animation in ads/graphics.js).
      for (const at of listTimes(g.duration, Math.min(4, g.items.length))) addSfx("pop", g.start + at, 0.45);
    }
    if (g.look === "stat" && parseStat(g.text)) {
      // A counter ticking while the number counts up, then the cha-ching as it lands.
      const count = statCount(g.duration);
      addSfx("counter", g.start + 0.1, 0.55, { duration: count });
      addSfx("cash", g.start + 0.1 + count, 0.7);
    } else if (g.look === "stat") {
      // "24/7" and the like pop in whole: a pop, no counter.
      addSfx("pop", g.start + 0.15, 0.55);
    }
    if (g.look === "compare") {
      const gap = Math.min(1.2, Math.max(0.35, (g.duration - 1.2) / 2));
      for (let k = 0; k < 2; k++) addSfx("pop", g.start + 0.35 + k * gap, 0.45);
    }
    if (g.look === "logo" && g.strike) {
      // Each logo whooshes in, then the X lands with a deep hit (timings match ads/graphics.js).
      g.logos.forEach((_, q) => addSfx("whoosh-short", g.start + q * 0.14, 0.35));
      const hit = Math.min(g.start + 0.55 + (g.logos.length - 1) * 0.14, Math.max(g.start + 0.35, g.start + g.duration - 0.87));
      // Every X lands with a crash; the first also gets a deep hit under it.
      g.logos.forEach((_, q) => addSfx("crash", hit + q * 0.14 + 0.02, 0.65));
      // The crash is the hit; no bass boom stacked under it.
    } else if (g.look === "logo") {
      // The reveal is a drop: the cinematic whoosh and the riser swell up to it and the hit lands with the logo.
      const drop = g.start + 0.12;
      const room = Math.max(0.4, drop - (graphics.filter((x) => x.start < g.start).map((x) => x.start + x.duration).pop() ?? 0));
      // No boom on the drop: after the hook's hits it overwhelms the ear (the creator's call). The swell carries it.
      addSfx("whoosh-cinematic", drop, 0.45, { lead: Math.min(2.9, room) });
      addSfx("riser", drop, 0.3, { lead: Math.min(1.8, room), duration: Math.min(1.8, room) + 0.15 });
    }
    // Anticipation into a checklist: a short riser peaking as it lands.
    if (g.look === "list") addSfx("riser", g.start + 0.1, 0.22, { lead: 1.2, duration: 1.3 });
  }
  for (const e of emphasis) addSfx("whoosh-cinematic", e.start - 0.15, 0.4);
  for (const c of camera) for (const [name, off, vol] of HIT_SFX[c.move] || []) addSfx(name, c.start + off, vol);
  for (const v of voicefx) if (v.effect === "underwater") addSfx("boom", v.start, 0.5);
  for (const s of plan.sfx || []) addSfx(s.sound, wordAt(s.at), 0.45);
  sounds.sort((a, b) => a.start - b.start);
  sounds.forEach((s, i) => (s.id = `s${i + 1}`));

  const video = parts.map((p, i) => ({ id: `v${i + 1}`, type: "video", start: p.t, duration: p.dur, sourceStart: r3(p.start), sourceEnd: r3(p.end), speed: 1, link: `l${i + 1}` }));
  const voice = parts.map((p, i) => ({ id: `a${i + 1}`, type: "audio", start: p.t, duration: p.dur, sourceStart: r3(p.start), sourceEnd: r3(p.end), speed: 1, volume: 1, link: `l${i + 1}` }));
  const track = await clipMusic({ id: AD_CLIP, rank: 1 }, design, { projectId: project.id });
  const music = track
    ? [{ id: "m1", type: "audio", start: 0, duration: D, sourceStart: 0, sourceEnd: r3(Math.min(track.duration || D, D)), speed: 1, volume: design.musicLevel, sound: track.id, name: track.name, loop: true }]
    : [];

  const doc = {
    version: 1,
    projectId: project.id,
    clipId: AD_CLIP,
    rev: 0,
    seededAt: new Date().toISOString(),
    aspect,
    fps: 30,
    design,
    tracks: [
      { id: "graphics", kind: "graphic", name: "Motion graphics", hidden: false, locked: false, clips: graphics },
      { id: "camera", kind: "camera", name: "Camera", hidden: false, locked: false, clips: camera },
      { id: "voicefx", kind: "voicefx", name: "Voice FX", hidden: false, locked: false, muted: false, clips: voicefx },
      { id: "emphasis", kind: "emphasis", name: "Big captions", hidden: false, locked: false, clips: emphasis },
      { id: "titles", kind: "text", name: "Titles", hidden: false, locked: false, clips: [] },
      { id: "captions", kind: "caption", name: "Captions", hidden: design.captions === false, locked: false, clips: captions },
      { id: "video", kind: "video", name: "Video", hidden: false, locked: false, clips: video },
      { id: "voice", kind: "audio", role: "voice", name: "Original audio", hidden: false, locked: false, muted: false, clips: voice },
      { id: "sfx", kind: "sfx", name: "Sound FX", hidden: false, locked: false, muted: options.sfx === false, clips: sounds },
      { id: "music", kind: "audio", role: "music", name: "Background music", hidden: false, locked: false, muted: false, clips: music },
    ],
  };
  const sourceSec = ranges.reduce((s, r) => s + (r.end - r.start), 0);
  return {
    doc,
    duration: D,
    grade,
    stats: {
      source: r3(project.source?.duration || 0),
      kept: r3(sourceSec),
      final: D,
      pieces: parts.length,
      filler: tight.removed?.filler || 0,
      pauses: tight.removed?.pauses || 0,
      graphics: graphics.length,
      camera: camera.length,
      emphasis: emphasis.length,
      sfx: sounds.length,
      music: track ? track.name : null,
    },
  };
}

const docFile = (projectId, clipId) => path.join(EDITOR_DIR, projectId, `${clipId}.json`);
/** Every version an edit replaced, so the creator's own timeline work can always be brought back. */
export const HISTORY_DIR = path.join(ROOT, "data", "ads", "history");

/** Save the document where the editor keeps it, marked edited so renders follow it. Keeps the revision moving forward. */
export async function writeAdDocument(doc) {
  const file = docFile(doc.projectId, doc.clipId);
  const current = await fs.readFile(file, "utf8").then(JSON.parse, () => null);
  // Never lose a version: whatever is there now (maybe the creator's own timeline edit) is kept before it's replaced.
  if (current) {
    const dir = path.join(HISTORY_DIR, `${doc.projectId}-${doc.clipId}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `rev-${current.rev || 0}-${Date.now()}.json`), JSON.stringify(current));
  }
  const saved = { ...doc, rev: (current?.rev || 0) + 1, savedAt: new Date().toISOString(), edited: true };
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(saved));
  await fs.rename(tmp, file);
  return saved;
}

export const readAdDocument = (projectId, clipId = AD_CLIP) => fs.readFile(docFile(projectId, clipId), "utf8").then(JSON.parse, () => null);
