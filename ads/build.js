// Plan → timeline. The ad becomes an ordinary editor document (editor/document.js) for the project's "ad" clip:
// the kept pieces as linked video + voice clips, captions, the motion graphics, big glowing words, sound effects
// and the music bed, each on its own track. The editor opens it as-is, and renders follow it (lib/pipeline.js
// renders edited documents exactly), so preview, timeline and saved video all match.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ASPECTS, groupCaptions, normalizeDesign } from "../lib/compose.js";
import { ROOT } from "../lib/tools.js";
import { CAPTION_LINE } from "../lib/facezone.js";
import { clipMusic, subtractRanges } from "../lib/clipplan.js";
import { formatMoney } from "../lib/money.js";
import { tightenClip } from "../lib/tighten.js";
import { editStyleOf } from "./styles.js";
import { DATA_DIR as EDITOR_DIR } from "../editor/media.js";
import { BANNED_SFX, CTA_CLICK, GRADES, LOOKS, PEAK, SCENE_SOUND, SFX, SFX_ROLE, TEMPLATES, TRANSITIONS, libraryOf, listTimes, parseStat, statCount, templateHits } from "../motion/index.js";

export const AD_CLIP = "ad";
const r3 = (n) => Math.round(n * 1000) / 1000;
const norm = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const clampIdx = (i, n) => Math.min(n - 1, Math.max(0, Math.round(Number(i) || 0)));

/**
 * Sound palettes, so ads don't all sound the same: the same moments, different sounds. "classic" is the original
 * set; each palette maps a classic sound to its own (null = leave it out). Chosen per ad, never the same twice running.
 */
// Cut hits: how long each lasts on the timeline, and the sound that sells it (by peak time).
const HIT_LEN = { shake: 0.35, "zoom-blur": 0.3, whip: 0.28, flash: 0.35, bw: 1, rgb: 0.45, blur: 0.5 };
const HIT_SFX = {
  shake: [["impact-bass-1", 0, 0.4]],
  "zoom-blur": [["boom", 0.2, 0.42]],
  whip: [["swoosh", 0.12, 0.5]],
  flash: [["bigswoosh", 0.05, 0.4]],
  bw: [["slice", 0, 0.4]],
  rgb: [["air", 0, 0.3]],
  // The master edit's blur crossfade: a riser that peaks as the blur does.
  blur: [["riser", 0.2, 0.3]],
};

/**
 * Never in an ad (the creator): the glitch sounds clash (2026-09-28), and no voice effect at all: underwater "takes the
 * words away" (2026-09-28) and muffle made "the guy's voice go off" (2026-09-29), so the voice always plays clean.
 * They all still exist for the rest of the app (motion/sfx, ads/voicefx.js); the Ads Editor just never uses them.
 * The banned sounds (BANNED_SFX), the peaks, the ambience list and the 0.7 gain live in motion/sounds.js.
 */
export const BANNED_VOICEFX = new Set(["underwater", "muffle", "phone"]);

/**
 * Ad mix levels, as the timeline shows them (the creator, 2026-10-29): the music "at 11%, if that's too loud put it at
 * 10%", and every sound effect "around the same… 9–10%". Every palette, every ad: no per-sound loudness caps any more
 * (they let a boom through at 88% and a whip at 134%). Music tracks are loudness-matched on import (lib/media.js), so
 * 11% is the same loudness under every song. ads/review.js holds each ad to these before it's handed over.
 */
export const AD_MUSIC_LEVEL = 0.11;
export const AD_MUSIC_MIN = 0.1;
export const AD_SFX_LEVEL = 0.1;
export const AD_SFX_MIN = 0.09;

export const PALETTES = {
  classic: {},
  crisp: { cash: "bell", pop: "tick", counter: "ticker", "impact-bass-1": "boom", "whoosh-short": "swoosh", whoosh: "swoosh", crash: "slice", "whoosh-cinematic": "revswell", riser: null, click: "tick" },
  airy: { cash: "ping", pop: "bloop", counter: "ticker", "impact-bass-1": "boom", "whoosh-short": "air", whoosh: "air", "whoosh-cinematic": "bigswoosh", riser: null, click: "click" },
  // The reference edit (motion/references/sound-study.md): the creator's own pack, by role ("@cut" = one of the quick
  // whips, rotating). Whips on cuts, shutter clicks as things appear, risers that peak on the cut, deep booms.
  studio: {
    whoosh: "@cut", "whoosh-short": "@cut", swoosh: "@cut", air: "@ui", "atlas-whoosh": "@cut", bigswoosh: "@cut",
    pop: "@ui", tick: "@ui", click: "@ui", ping: "@ui", bloop: "@ui", chirp: "@ui", "atlas-pop": "@ui", "atlas-click": "@ui", "atlas-marker": "@ui", "atlas-typing": "@ui",
    riser: "@riser", "atlas-riser": "@riser", "whoosh-cinematic": "@riser", revswell: "@riser",
    "impact-bass-1": "@boom", "impact-bass-2": "@boom", boom: "@boom", "atlas-impact": "@boom",
    cash: "@land", bell: "@land", "atlas-ding": "@land", "atlas-success": "@land", counter: "ticker",
  },
};
/** The studio palette needs the creator's pack on this machine. */
export const studioReady = () => libraryOf("cut").length > 0;

/** Automatic sound design per graphic: [sound, offset from the graphic's start, volume]. */
const GRAPHIC_SFX = {
  // Soft UI sounds to match the minimal motion (motion/references/atlas-motion-kit.md): air, ticks and pings, no pops.
  headline: [["air", -0.05, 0.3]],
  stat: [],
  list: [["air", -0.05, 0.3]],
  compare: [["air", -0.05, 0.3]],
  "lower-third": [["air", 0, 0.3]],
  callout: [["ping", 0.1, 0.35]],
  proof: [["ping", 0.15, 0.35]],
  slide: [["air", 0, 0.3]],
  check: [["air", 0.05, 0.25], ["chirp", 0.68, 0.4]],
  icon: [["ping", 0.1, 0.35]],
  cta: [["air", 0.1, 0.3], ["click", CTA_CLICK, 0.8]],
};

/**
 * Fewer effects (the creator, 2026-10-28: "try not to use soooooo many sound effects, only when it makes the most
 * sense"). The sounds that carry the ad win: the opening boom and other big hits, the risers into scenes, a number's
 * landing, the whips on scene cuts; small clicks and ticks only stay where nothing else is near. No two moments within
 * 1.5 s (a riser and the whip on the cut it peaks into are one moment), booms at least 8 s apart, two risers at most,
 * and about one moment per 4.5 s at most.
 */
const SOUND_RANK = { boom: 5, riser: 4, land: 3, cut: 2, ui: 1 };
const HOUSE_RANK = {
  "impact-bass-1": 5, "impact-bass-2": 5, boom: 5, "atlas-impact": 5, crash: 5,
  riser: 4, "atlas-riser": 4, "whoosh-cinematic": 4, revswell: 4,
  cash: 3, bell: 3, "atlas-ding": 3, "atlas-success": 3, chirp: 3,
  whoosh: 2, "whoosh-short": 2, swoosh: 2, bigswoosh: 2, "atlas-whoosh": 2, slice: 2, click: 2,
};
export function thinSounds(sounds, D) {
  const rank = (s) => SOUND_RANK[SFX_ROLE[s.sfx]] ?? HOUSE_RANK[s.sfx] ?? 1;
  const at = (s) => s.start + (PEAK[s.sfx] ?? 0) - (s.offset || 0);
  const pair = (a, b) => Math.abs(at(a) - at(b)) < 0.35 && [a, b].some((x) => rank(x) === 4) && [a, b].some((x) => rank(x) === 2);
  // About one moment every 7 s (every 4.5 s until 2026-10-29, when the creator still heard "way too much sound effects").
  const max = Math.max(3, Math.round(D / 7));
  const kept = [];
  let moments = 0;
  for (const s of [...sounds].sort((a, b) => rank(b) - rank(a) || at(a) - at(b))) {
    const partner = kept.some((k) => pair(k, s));
    if (!partner && moments >= max) continue;
    // At least 3 s between moments (1.5 s until 2026-10-29: four whips in four seconds still read as too much).
    if (kept.some((k) => Math.abs(at(k) - at(s)) < 3 && !pair(k, s))) continue;
    // Big hits stay rare: at least 8 s between booms, and two risers in an ad at most.
    if (rank(s) === 5 && kept.some((k) => rank(k) === 5 && Math.abs(at(k) - at(s)) < 8)) continue;
    if (rank(s) === 4 && kept.filter((k) => rank(k) === 4).length >= 2) continue;
    kept.push(s);
    if (!partner) moments++;
  }
  sounds.splice(0, sounds.length, ...kept);
}

/**
 * An ad's sound brought to the house mix as it stands now: effects thinned (thinSounds) and each one at the effects'
 * level, the music bed at the music's (AD_SFX_LEVEL, AD_MUSIC_LEVEL). Nothing is added or moved, so the creator's own
 * sound choices in a hand-edited ad stay theirs, just at the house levels and fewer (2026-10-29: "you used way too
 * much sound effects… I'm not sure if you had the volume down on the sound effects & on the music").
 */
export function remixSounds(doc) {
  const D = Math.max(0, ...doc.tracks.filter((t) => t.kind === "video").flatMap((t) => t.clips).map((c) => c.start + c.duration));
  const sfx = doc.tracks.find((t) => t.kind === "sfx");
  const before = sfx?.clips.length || 0;
  if (sfx) {
    thinSounds(sfx.clips, D);
    for (const c of sfx.clips) c.volume = AD_SFX_LEVEL;
    sfx.clips.sort((a, b) => a.start - b.start);
  }
  const bed = AD_MUSIC_LEVEL;
  for (const t of doc.tracks.filter((t) => t.kind === "audio" && t.id === "music")) for (const c of t.clips) c.volume = bed;
  if (doc.design) doc.design.musicLevel = bed;
  return { before, after: sfx?.clips.length || 0, music: bed };
}

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
    words: g.words.map((w) => ({ text: w.text, s: r3(Math.max(0, w.s - g.in)), e: r3(Math.max(0, w.e - g.in)), ...(w.mark ? { mark: w.mark } : {}) })),
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

/**
 * A word's end pushed out to where its sound really stops. Transcripts often end a word early, and a cut placed on that
 * timing clips its tail (the creator, 2026-09-28: "he said humans, it cut the word so fast"). While the voice stays
 * above the room's noise floor (+8 dB, at least −42 dB) right after the word, its end follows, up to 0.35 s and never
 * into the next word.
 */
export function extendWordTails(words, levels) {
  if (!levels?.length) return words;
  const sorted = Array.from(levels).filter((v) => v > -90).sort((a, b) => a - b);
  const floor = sorted.length ? sorted[Math.floor(sorted.length * 0.15)] : -60;
  const threshold = Math.max(-42, floor + 8);
  return words.map((w, i) => {
    const next = words[i + 1];
    const limit = Math.min(w.end + 0.35, next ? next.start - 0.03 : w.end + 0.35);
    let end = w.end;
    let quiet = 0;
    for (let j = Math.round(w.end / 0.01); j * 0.01 <= limit && j < levels.length; j++) {
      if (levels[j] > threshold) {
        end = j * 0.01 + 0.01;
        quiet = 0;
      } else if (++quiet >= 4) break;
    }
    return end > w.end + 0.015 ? { ...w, end: r3(end), tail: true } : w;
  });
}

/**
 * The level that counts as voice for this recording: 10 dB over its room tone (the 15th-percentile level), kept
 * between −44 and −28 dB. −32 on a typical recording; a quiet room or a soft speaker moves it with them.
 */
let VOICE_DB = -32;
export function voiceThreshold(levels) {
  if (!levels?.length) return -32;
  const sorted = Array.from(levels).filter((v) => v > -90).sort((a, b) => a - b);
  const floor = sorted.length ? sorted[Math.floor(sorted.length * 0.15)] : -42;
  return Math.max(-44, Math.min(-28, floor + 10));
}

/** Runs of speech (voice above the recording's threshold for 60 ms+, gaps under 150 ms bridged) between two times. */
function speechBursts(levels, from, to) {
  const out = [];
  let run = null;
  for (let i = Math.max(0, Math.round(from / 0.01)); i <= Math.min(levels.length - 1, Math.round(to / 0.01)); i++) {
    const t = i * 0.01;
    if (levels[i] > VOICE_DB) {
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
  // Only sustained voice counts (runs of 0.15 s+ once pauses under 0.2 s are bridged): a click, a breath or a shuffle
  // in the silence before a take is noise, and must never anchor a word onto that silence (the creator, 2026-09-28:
  // an ad opened on four seconds of the speaker standing there because the first words were timed onto two blips).
  const sustained = (from, to) => groups(speechBursts(levels, from - 0.3, to + 0.3))
    .filter((g) => g.end - g.start >= 0.15)
    .map((g) => ({ start: Math.max(g.start, from), end: Math.min(g.end, to) }))
    .filter((g) => g.end > g.start);
  let voicedTake = false;
  const audible = (w, edge = null) => {
    if (!levels) return w;
    let bursts = sustained(w.start, w.end);
    if (edge) {
      // Look half a second past the word's timing too: its real sound may start (or end) just outside it. The last
      // word may also run past its timing (its tail), up to 0.35 s.
      const g = edge === "first" ? sustained(w.start, w.end + 0.5) : sustained(w.start - 0.5, w.end + 0.35);
      const pick = edge === "first" ? g.filter((x) => x.start <= w.end + 0.15).at(-1) : g.find((x) => x.end >= w.start - 0.15);
      if (pick) return edge === "first" ? { start: Math.max(w.start, pick.start - 0.05), end: Math.max(pick.start + 0.15, Math.min(w.end, pick.end) + 0.06) } : { start: Math.min(pick.end - 0.15, Math.max(w.start, pick.start) - 0.05), end: Math.min(w.end + 0.35, pick.end + 0.06) };
    }
    if (!bursts.length) {
      // No voice at all where the word is timed: it's timed onto the silence before it. It's the next burst.
      const next = sustained(w.end, w.end + 1.6)[0];
      if (next) return { start: next.start - 0.05, end: Math.min(next.end, next.start + Math.max(0.2, w.end - w.start)) + 0.06 };
      // Still nothing: in a take that has real voice elsewhere, this word's timing is silence, so it keeps nothing
      // (its sound is inside a neighbour's). With no voice anywhere (levels unreliable), it keeps its timing.
      return voicedTake ? null : w;
    }
    return { start: Math.max(w.start, bursts[0].start - 0.05), end: Math.min(w.end, bursts.at(-1).end + 0.06) };
  };
  const out = [];
  for (const r of ranges) {
    const inTake = words.filter((w) => w.end > r.start + 0.02 && w.start < r.end - 0.02);
    voicedTake = Boolean(levels) && sustained(r.start, r.end).length > 0;
    const spans = inTake
      .map((w, i) => audible(w, i === 0 ? "first" : i === inTake.length - 1 ? "last" : null))
      .filter(Boolean)
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
    const timed = inTake.map((w, i) => audible(w, i === 0 ? "first" : i === inTake.length - 1 ? "last" : null)).filter(Boolean);
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

const bare = (w) => String(w?.text || "").toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * Never half a sentence (the creator, 2026-10-28: the plan kept "…does everything for me so that" and dropped "I only
 * have to worry about creating the content, helping the people inside my offers."). A kept range that stops mid-clause
 * runs on to the end of its sentence, unless it's spliced onto a restart (the next kept range starts on or just after
 * the word it stops on said again: "This has | …tangent… this has | taken everything off my plate"), the rest is played
 * elsewhere in the plan, sounds like a retake (it repeats three words in a row that the ad already says), or isn't one
 * short continuous stretch of speech (a long pause or more than 7 s).
 */
export function finishSentences(keep, words) {
  const n = words.length;
  const kept = new Set();
  for (const k of keep || []) for (let i = Math.max(0, Math.min(k.from, k.to)); i <= Math.min(n - 1, Math.max(k.from, k.to)); i++) kept.add(i);
  const trigrams = new Set([...kept].sort((a, b) => a - b).map((i) => [i, i + 1, i + 2].map((j) => bare(words[j])).join(" ")));
  return (keep || []).map((k, j, all) => {
    const to = Math.max(k.from, k.to);
    if (to >= n - 1 || /[.?!,;:—-]$/.test(String(words[to].text))) return k;
    const next = all[j + 1] ? Math.min(all[j + 1].from, all[j + 1].to) : -1;
    if (next > to && words.slice(Math.max(0, next - 3), next + 3).some((w) => bare(w) === bare(words[to]))) return k;
    let end = to + 1;
    while (end < n - 1 && !/[.?!]$/.test(String(words[end].text))) end++;
    const rest = words.slice(to + 1, end + 1);
    if (!/[.?!]$/.test(String(words[end].text)) || rest.length > 25 || words[end].end - words[to].end > 7) return k;
    if (rest.some((w, i) => w.start - (i ? rest[i - 1] : words[to]).end > 1.2)) return k;
    for (let i = to + 1; i <= end; i++) if (kept.has(i)) return k;
    for (let i = to + 1; i + 2 <= end; i++) if (trigrams.has([i, i + 1, i + 2].map((j) => bare(words[j])).join(" "))) return k;
    return { ...k, to: end };
  });
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
 * No stray slivers (the creator, 2026-09-29: an ad ended on a 0.23 s flash of a later take). A piece under 0.35 s that
 * holds no whole word is noise from the cut, not part of the ad, wherever it sits.
 */
export function dropSlivers(pieces, words) {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const p = pieces[i];
    if (pieces.length > 1 && p.end - p.start < 0.35 && !words.some((w) => w.start >= p.start - 0.02 && w.end <= p.end + 0.02)) pieces.splice(i, 1);
  }
  return pieces;
}

/**
 * No cut edge lands inside a word that was left out (the creator, 2026-09-29: half a "You're" was heard before a jump
 * because the kept word's padding ran on into it). A piece that ends inside a dropped word ends just before it; one
 * that starts inside a dropped word starts just after it. Kept words are never cut into.
 */
export function clearDroppedWords(pieces, all, kept) {
  const keep = new Set(kept);
  const keptKey = new Set(kept.map((w) => `${w.text}@${Math.round(w.start * 20)}`));
  const dropped = all.filter((w) => !keep.has(w) && !keptKey.has(`${w.text}@${Math.round(w.start * 20)}`) && w.end - w.start >= 0.05);
  for (const p of pieces) {
    const inP = kept.filter((w) => w.end > p.start + 0.02 && w.start < p.end - 0.02);
    for (const d of dropped) {
      if (d.start > p.start + 0.05 && p.end > d.start + 0.01 && p.end < d.end + 0.1) {
        const lastKept = inP.filter((w) => w.start < d.start).at(-1);
        p.end = r3(Math.max(d.start - 0.02, lastKept ? lastKept.start + 0.1 : p.start + 0.15));
      }
      if (d.end < p.end - 0.05 && p.start < d.end - 0.01 && p.start > d.start - 0.1) {
        const firstKept = inP.find((w) => w.end > d.end);
        p.start = r3(Math.min(d.end + 0.02, firstKept ? firstKept.end - 0.1 : p.end - 0.15));
      }
    }
  }
  return pieces;
}

/**
 * A stray fragment before the real start (the creator, 2026-09-29: an ad opened on the tail of an earlier take, then
 * jumped): a first piece under 1 s, holding at most two words, followed by a jump forward in the footage.
 */
export function dropLeadIsland(pieces, words) {
  while (pieces.length > 1) {
    const [a, b] = pieces;
    const held = words.filter((w) => w.start >= a.start - 0.02 && w.start < a.end).length;
    if (a.end - a.start < 1.0 && held <= 2 && b.start - a.end > 0.5) pieces.shift();
    else break;
  }
  return pieces;
}

/** Normalised word for matching takes. */
const wordKey = (w) => String(w?.text || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/**
 * Lines the plan kept twice (the creator, 2026-09-29: "he did a retake but it added both of them… always take the best
 * one"): in play order, when four words in a row come back later (or a call to action like "click below" is said
 * again), the earlier saying is a retake. It goes from where the repeat starts to the end of its clause (the next
 * pause, comma or full stop), at most 14 words. The last take is the keeper.
 * → [{ start, end, words[] }] source spans to cut
 */
export function retakeSpans(ranges, words) {
  const seen = new Set();
  const take = [];
  const order = ranges.flatMap((r, ri) => words.filter((w) => w.end > r.start + 0.02 && w.start < r.end - 0.02 && !seen.has(w) && seen.add(w)).sort((a, b) => a.start - b.start).map((w) => (take.push(ri), w)));
  const keys = order.map(wordKey);
  const cut = new Set();
  const CTA_PHRASES = [["click", "below"], ["link", "below"], ["comment", "below"], ["learn", "more"], ["free", "trial"], ["book", "a", "call"]];
  // The clause a word sits in (to the nearest full stop, comma or real pause, at most 12 words each way).
  const clause = (i) => {
    let a = i;
    while (a > 0 && i - a < 12 && !/[.?!,;]$/.test(String(order[a - 1].text)) && order[a].start - order[a - 1].end < 0.45) a--;
    let b = i;
    while (b < order.length - 1 && b - i < 12 && !/[.?!,;]$/.test(String(order[b].text)) && order[b + 1].start - order[b].end < 0.45) b++;
    return keys.slice(a, b + 1).filter(Boolean);
  };
  const sameLine = (i, m) => {
    const x = clause(i);
    const y = new Set(clause(m));
    return x.filter((k) => y.has(k)).length / Math.max(x.length, y.size, 1) >= 0.6;
  };
  const repeatAt = (i) => {
    for (const p of CTA_PHRASES) {
      if (p.every((k, j) => keys[i + j] === k)) {
        for (let m = i + p.length; m + p.length <= keys.length; m++) if (p.every((k, j) => keys[m + j] === k)) return p.length;
      }
    }
    if (i + 4 > keys.length || keys.slice(i, i + 4).some((k) => !k)) return 0;
    // Four words said again in another take is a retake only when the whole line around them is the same line said
    // again. Inside one take it's rhetoric ("You don't need to learn how to code. You don't need to learn any
    // technicalities."), and a refrain inside different lines stays too (ad #16: "…and it goes to do the work for you"
    // / "…having AI employees do the work for you today" — the creator put the first back).
    const four = keys.slice(i, i + 4).join(" ");
    for (let m = i + 4; m + 4 <= keys.length; m++) if (take[m] !== take[i] && keys.slice(m, m + 4).join(" ") === four && sameLine(i, m)) return 4;
    return 0;
  };
  for (let i = 0; i < order.length; i++) {
    const n = repeatAt(i);
    if (!n) continue;
    // The earlier saying runs to the end of its clause.
    let j = i;
    while (j < order.length - 1 && j - i < 9 && take[j + 1] === take[i] && !/[.?!,;]$/.test(String(order[j].text)) && order[j + 1].start - order[j].end < 0.45) j++;
    for (let k = i; k <= j; k++) cut.add(order[k]);
    i = j;
  }
  // Contiguous runs of cut words (in source time) become spans.
  const spans = [];
  for (const w of [...cut].sort((a, b) => a.start - b.start)) {
    const last = spans.at(-1);
    if (last && w.start - last.end < 0.3) {
      last.end = w.end;
      last.words.push(w);
    } else spans.push({ start: w.start, end: w.end, words: [w] });
  }
  return spans.map((x) => ({ ...x, start: r3(x.start - 0.04), end: r3(x.end + 0.06) }));
}

/** Sign-offs after a call to action that the ad doesn't need ("see you inside", "your choice", "let's go"). */
const SIGNOFF_RE = /^(see you|your choice|let'?s go|talk soon|thank you|thanks|it'?s going to change|so i encourage|i'?ll see you)/i;

/** The word a call to action ends on ("…free trial", "…click below", "…learn more", "…book a call"). */
const CTA_END = /^(trial|trail|below|more|call|link|comment|bio|started|access|free|today|now)[.,!?]*$/i;

/** What may follow the last CTA word and still be cut: sign-offs, alternatives, a new clause about something else. */
const TAIL_CUT_RE = /^[,.\s]*(or\b|see you|your choice|let'?s go|talk soon|thank|thanks|i'?ll see|so i encourage|don'?t miss|atlas (is|will)|it'?s going to|it will|this (is going to|will)|that'?s it|peace|bye)/i;

/** Words a graphic puts on screen (its headline, lines and items), for how long it needs to be read. */
const readWords = (g) => [g.text, g.sub, g.highlight, ...(g.items || [])].filter((x) => x && x !== "-").join(" ").replace(/[|;:*]/g, " ").split(/\s+/).filter(Boolean).length;

/** A call-to-action sentence: what the ad ends on (the free trial, the call, "click below"…). */
export const CTA_RE = /\b(free trial|trial|below|link|comment|book(?:ed|ing)?|sign up|get started|dm|learn more|find out|try it|check it out|see how|get access|join)\b/i;

/**
 * The ad ends on its call to action (the creator, 2026-09-29: "it should've stopped right after he says start free
 * trial… don't leave extra stuff"). The last CTA sentence in the final stretch of the cut is found, and everything
 * after it ("See you inside.", "Your choice.", a stray sliver of a later take) comes out; its last word keeps 0.4 s of
 * air (never into the next word). Pieces are source ranges in play order; words carry source times.
 */
export function endOnCta(pieces, words, levels = null, planWords = null) {
  if (!pieces.length) return pieces;
  const kept = [];
  pieces.forEach((p, pi) => words.forEach((w) => { if (w.start >= p.start - 0.05 && w.start < p.end - 0.02) kept.push({ w, pi }); }));
  const total = pieces.reduce((t, p) => t + p.end - p.start, 0);
  let played = 0;
  const startOf = pieces.map((p) => { const at = played; played += p.end - p.start; return at; });
  const outAt = (k) => startOf[kept[k].pi] + (kept[k].w.end - pieces[kept[k].pi].start);
  // Sentences over the kept words; the last one with a CTA in the final 45% of the ad, with at most 5 s after it.
  let from = 0;
  let pick = -1;
  kept.forEach(({ w }, k) => {
    if (!/[.?!]$/.test(String(w.text)) && k < kept.length - 1) return;
    const text = kept.slice(from, k + 1).map((x) => x.w.text).join(" ");
    if (CTA_RE.test(text) && outAt(k) > total * 0.55) pick = k;
    from = k + 1;
  });
  if (pick < 0 || total - outAt(pick) > 5) return pieces;
  // A sign-off run on inside the same sentence ("click below see you inside") ends the ad before it starts.
  for (let i = pick; i > 0 && !/[.?!]$/.test(String(kept[i - 1].w.text)); i--) {
    const rest = kept.slice(i, pick + 1).map((x) => x.w.text).join(" ");
    if (SIGNOFF_RE.test(rest) && CTA_RE.test(kept.slice(0, i).slice(-8).map((x) => x.w.text).join(" "))) pick = i - 1;
  }
  // Within that sentence it ends on the last call-to-action word ("…seven day free trial" | "or decide to be left
  // behind", "…free trial," | "Atlas is going to change your life"), unless what follows is itself a call to action
  // ("…and learn more") — checked against both transcripts, since a re-transcribed take can miss words.
  let s0 = pick;
  while (s0 > 0 && !/[.?!]$/.test(String(kept[s0 - 1].w.text))) s0--;
  const ctaEnd = [];
  for (let i = s0; i <= pick; i++) if (CTA_END.test(String(kept[i].w.text)) && CTA_RE.test(kept.slice(Math.max(s0, i - 3), i + 1).map((x) => x.w.text).join(" "))) ctaEnd.push(i);
  const last = ctaEnd.at(-1);
  if (last !== undefined && last < pick) {
    const tailFrom = kept[last].w.end - 0.05;
    const heardAfter = [...kept.slice(last + 1, pick + 1).map((x) => x.w), ...(planWords || []).filter((p) => p.start > tailFrom && p.start < pieces[kept[pick].pi].end)];
    // Only a tail that isn't part of the CTA comes off: a sign-off, an "or…" alternative, or a new clause about
    // something else. A continuation of the instruction stays whole (the creator, 2026-09-29: "Click below | and get
    // your AI employees started in your business today" was cut off after "below").
    const tail = kept.slice(last + 1, pick + 1).map((x) => x.w.text).join(" ");
    if (TAIL_CUT_RE.test(tail) && !CTA_RE.test(heardAfter.map((x) => x.text).join(" "))) pick = last;
  }
  const { w, pi } = kept[pick];
  // Never into the next word said: the next kept word, or the next word in the long transcript (a re-transcribed
  // take can stretch "below." over an untranscribed "see you").
  // The long transcript's timing drifts and it spells words its own way ("seven-day" / "seven day", "7" / "seven"), so
  // its next word is found from where it has this same last word (nearest within a second), never by skipping words
  // that don't match (that once took "free" for the next word and cut the ad off before "free trial").
  const lk = wordKey(w);
  const match = (planWords || []).map((p, i) => ({ p, i })).filter(({ p }) => { const k = wordKey(p); return k && (k === lk || k.endsWith(lk) || lk.endsWith(k)) && Math.abs(p.start - w.start) < 1.0; }).sort((a, b) => Math.abs(a.p.start - w.start) - Math.abs(b.p.start - w.start))[0];
  const planNext = match ? planWords[match.i + 1] : null;
  const nextKept = kept[pick + 1]?.pi === pi ? kept[pick + 1].w.start - 0.02 : Infinity;
  const nextPlan = planNext && planNext.start > w.start + 0.15 ? planNext.start - 0.02 : Infinity;
  let end = Math.min(pieces[pi].end, w.end + 0.4, nextKept, nextPlan);
  // The last word keeps its whole sound: while the voice carries on straight after it (gaps under 0.15 s), up to
  // 0.35 s, but never into the next word the long transcript heard.
  if (levels) {
    const run = speechBursts(levels, w.start, w.end + 0.6).filter((b) => b.start <= end + 0.05).at(-1);
    if (run) end = Math.max(end, Math.min(run.end + 0.06, w.end + 0.35, nextPlan, pieces[pi].end));
  }
  // Safety net: the end never lands inside a word of the CTA itself as the long transcript heard it ("…free | trial").
  for (const p of planWords || []) {
    if (p.start < end - 0.02 && p.end > end + 0.02 && p.start > w.start - 1.2 && CTA_END.test(String(p.text).replace(/-/g, " ").split(" ").pop()) && p.end - end < 0.8) end = Math.min(pieces[pi].end + 0.8, p.end + 0.08);
  }
  pieces[pi].end = r3(Math.max(w.start + 0.15, end));
  pieces.length = pi + 1;
  // Words left after the end come out of the word list too (no caption flash of "Just" at the last frame).
  for (let i = words.length - 1; i >= 0; i--) {
    const x = words[i];
    const playsElsewhere = pieces.some((p, k) => k !== pi && x.start >= p.start - 0.02 && x.start < p.end);
    if (x.start >= pieces[pi].end - 0.05 && x.start < pieces[pi].end + 1 && x.start > w.start && !playsElsewhere) words.splice(i, 1);
  }
  return pieces;
}

/**
 * The ad ends when the voice does (the creator, 2026-09-29: two ads ran a second or two past "…learn more." with the
 * speaker just standing there). Word timings can run half a second late, so the last piece is cut 0.3 s after the last
 * moment the raw recording has voice in it (above this recording's voice threshold), whatever the transcript says.
 */
export function endOnVoice(pieces, levels) {
  const last = pieces.at(-1);
  if (!last || !levels?.length) return pieces;
  let voiced = -1;
  for (let i = Math.min(levels.length - 1, Math.round(last.end / 0.01)); i >= Math.round(last.start / 0.01); i--) {
    if (levels[i] > VOICE_DB) {
      voiced = i * 0.01 + 0.01;
      break;
    }
  }
  if (voiced > last.start && last.end - voiced > 0.3) last.end = r3(voiced + 0.3);
  return pieces;
}

/**
 * The planner's graphic moments, as looks the renderer draws (anything it can't draw, or with nothing to show, is
 * dropped). The planner returns logo moments ({ logos[], strike }); anything else (older plans) needs its words.
 */
export function plannedLooks(list, options) {
  return list
    .map((g) => (g.kind === "number" ? { ...g, look: "stat", position: "center" } : g.kind === "checklist" ? { ...g, look: "list", position: "bottom" } : g.kind === "cta" ? { ...g, look: "cta", position: "bottom", text: g.text || options.ctaText || "Start free trial" } : g.kind === "proof" ? proofGraphic(g, options.testimonials) : g.kind === "check" ? { ...g, look: "check", position: "center" } : g.kind === "template" && TEMPLATES[g.template] ? { ...g, look: g.template, position: TEMPLATES[g.template].position } : g.kind === "slide" && (options.slides || []).some((x) => x.id === g.slide) ? { ...g, look: "slide", position: "top", text: g.text || " " } : g))
    .map((g) => (g.kind === "logos" && Array.isArray(g.logos) ? { ...g, look: "logo", logos: g.logos.filter((id) => (options.logos || []).some((l) => l.id === id)).slice(0, 3) } : g))
    .filter((g) => LOOKS[g.look] && (g.look === "logo" ? g.logos?.length : g.look === "list" ? (g.items || []).filter(Boolean).length >= 2 : TEMPLATES[g.look] ? String(g.text || "").trim() || (g.items || []).some((x) => String(x || "").trim()) : String(g.text || "").trim()));
}

/**
 * Timeline graphic clips from planned looks with their times ({ g, t0, t1 }, sorted): never two at once, at least
 * 1.2 s each, long enough to read, held a beat past the line.
 */
export function placeGraphics(planned, D, options) {
  const graphics = [];
  for (const [i, { g, t0, t1: end }] of planned.entries()) {
    const next = planned[i + 1];
    let t1 = Math.max(end, t0 + (g.look === "list" ? 1.2 + (g.items?.length || 1) * 0.7 : g.look === "cta" ? 2.6 : g.look === "proof" || g.look === "slide" ? 3.2 : TEMPLATES[g.look]?.minLen || 1.8));
    // Long enough to read (motion-graphics-director: ~3 words a second on screen, plus the entrance), up to 5 s.
    t1 = Math.max(t1, t0 + Math.min(5, 0.6 + readWords(g) / 3));
    t1 = Math.min(t1, t0 + (g.look === "cta" ? 9 : 7), D, next ? next.t0 - 0.12 : D);
    const prev = graphics.at(-1);
    if (prev && t0 < prev.start + prev.duration) {
      if (t0 - 0.1 - prev.start >= 1.0 || g.look === "cta") prev.duration = r3(Math.max(0.6, t0 - 0.1 - prev.start));
      else continue;
      if (prev.duration < 0.8) graphics.pop();
    }
    if (t1 - t0 < 1.2) continue;
    // Style rotation for the built-in looks (a different number card or CTA from the last ad).
    const variant = g.look !== "stat" ? {} : options.palette === "studio" ? { variant: "studio" } : options.variants?.stat === "pill" ? { variant: "pill" } : {};
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
      highlight: String(g.highlight || "").trim().slice(0, 140),
      items: (g.items || []).map((x) => String(x).trim().slice(0, 140)).filter(Boolean).slice(0, 8),
      icon: g.icon || "",
      // Kit templates can cut away to a full-screen scene (the dark or accent ground) while the voice carries on.
      ...(TEMPLATES[look]?.scene && (g.fullscreen || TEMPLATES[look].scene === "always") ? { fullscreen: true, tone: ["accent", "paper"].includes(g.tone) ? g.tone : "dark", ...(TRANSITIONS.includes(g.transition) ? { transition: g.transition } : {}) } : {}),
      position: g.look === "logo" ? "top" : g.position,
    });
  }
  return graphics;
}

/**
 * Build the editor document for an ad.
 * @returns { doc, duration, stats }
 */
export async function buildAdDocument({ project, plan, words, aspect, options = {}, sfxDuration, levels = null, realign = null }) {
  words = [...words]; // keepRanges may re-time mistimed edge words onto their real sound
  VOICE_DB = voiceThreshold(levels);
  // Talking head (Basic, ads/styles.js `simple`): the cut, captions and a pop-in on the lines that matter. No graphics,
  // automatic number cards or CTA button, sound effects, voice effects or cut hits, whatever the plan asked for.
  const simple = Boolean(editStyleOf(options)?.simple);
  if (simple) plan = { ...plan, graphics: [], sfx: [], voice_fx: [], emphasis: [], auto_numbers: false, camera: (plan.camera || []).filter((m) => m.move === "punch") };
  const n = words.length;
  plan = { ...plan, keep: finishSentences(plan.keep, words) };
  const ranges = keepRanges(plan, words, levels);
  // Long-video word timings drift by up to a second; each kept take re-transcribed on its own is exact. Its words
  // replace the take's words, for the captions and for where the cuts land.
  const planWords = words;
  if (realign) words = await realign(ranges, words);
  else words = trimStretchedWords(words, levels);
  // Word ends follow their sound (never clipped early), and each take's cut end covers its last word's tail.
  words = extendWordTails(words, levels);
  const timedWords = words;
  for (const [i, r] of ranges.entries()) {
    const inside = words.filter((w) => w.start < r.end - 0.02 && w.end > r.start);
    const tail = Math.max(...inside.map((w) => w.end), -Infinity);
    const nextStart = ranges[i + 1]?.start ?? Infinity;
    // …but never into the next word said after the take (ad #3 ran on into "It's going to" after "free trial.").
    const lastIn = inside.at(-1);
    const after = lastIn ? words.find((w) => w.start > lastIn.start + 0.01 && !inside.includes(w)) : null;
    const wall = after ? after.start - 0.03 : Infinity;
    if (tail + 0.12 > r.end) r.end = r3(Math.max(r.end > wall ? wall : r.end, Math.min(tail + 0.12, r.end + 0.4, wall, nextStart > r.start ? Math.max(r.end, nextStart - 0.02) : Infinity)));
  }
  // …and never past the words heard either side of the take (realignTakes): those belong to other lines.
  for (const r of ranges) {
    if (r.wall > r.start + 0.2) r.end = r3(Math.min(r.end, r.wall));
    if (r.floor < r.end - 0.2) r.start = r3(Math.max(r.start, r.floor));
  }
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
  // The plan can reuse footage out of order (ad #2 kept "click below…" inside the body and again as the ending): the
  // later take keeps it, and the earlier one stops before it.
  for (let j = 1; j < ranges.length; j++) {
    for (let i = 0; i < j - 1; i++) {
      const a = ranges[i];
      const b = ranges[j];
      if (b.start < a.end - 0.05 && b.end > a.start + 0.05) {
        if (b.start > a.start + 0.3) a.end = r3(b.start - 0.02);
        else if (b.end < a.end - 0.3) a.start = r3(b.end + 0.02);
      }
    }
  }
  for (let i = ranges.length - 1; i >= 0; i--) if (ranges[i].end - ranges[i].start < 0.2) ranges.splice(i, 1);
  // Only the words inside the kept takes matter from here; outside ones would sit between a restart and its repeat.
  words = dropRestarts(words.filter((w) => ranges.some((r) => w.end > r.start + 0.02 && w.start < r.end - 0.02)));
  // Retakes the plan kept twice (the same line said again, e.g. two "click below" CTAs): only the last one plays.
  const retakes = retakeSpans(ranges, words);
  if (retakes.length) {
    const drop = new Set(retakes.flatMap((x) => x.words));
    words = words.filter((w) => !drop.has(w));
    options = { ...options, exclude: [...(options.exclude || []), ...retakes.map((x) => ({ start: x.start, end: x.end, silent: true }))] };
  }
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
  const tight = tightenClip(words, speechOnly(ranges, words, levels, (options.exclude || []).filter((e) => e.silent)), { filler: true, pauseMax: 0.3, pauseKeep: 0.1, ...editStyleOf(options)?.pace, minPiece: 0.9, absorbMax: 0.2 });
  dropSlivers(tight.parts, words);
  dropLeadIsland(tight.parts, words);
  endOnCta(tight.parts, words, levels, planWords);
  endOnVoice(tight.parts, levels);
  clearDroppedWords(tight.parts, timedWords, words);
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
  // No grade (the creator, 2026-10-21): the footage comes in already coloured, so it plays as shot, like the LUTs
  // (ads/index.js resolveLut). Claude's grade pick is ignored.
  const grade = "none";
  const design = normalizeDesign({
    style: "talk",
    aspect,
    captions: options.captions === true,
    // The reference reel's captions (lib/facezone.js, the creator 2026-10-22): a word or two, lowercase, bold tight
    // Helvetica about 94 px tall on 1080, centered on the chest line. motion/render.js moves one off the face.
    captionY: tall ? CAPTION_LINE : 86,
    captionScale: editStyleOf(options)?.captionScale ?? 0.8,
    maxWords: 2,
    lowercase: true,
    tracking: -3,
    // Plain captions: no italic serif emphasis (the creator's rule). With the studio sound, the master edit's captions:
    // each word rises in as it's said, with the planner's marks (quotes in italics, a phrase in caps, a red box).
    highlight: options.palette === "studio" ? "studio" : "none",
    // The ad's own framing program (motion/render.js adFraming) replaces the composer's drift and punches.
    motion: "none",
    zoom: false,
    autoFrame: true,
    framing: editStyleOf(options)?.framing ?? (simple ? "key" : "rhythm"),
    musicBed: options.music === true && plan.music !== false ? "auto" : "none",
    musicLevel: AD_MUSIC_LEVEL,
    grade: grade === "none" ? "none" : "clean",
    lut: options.lut || "none",
    ...(options.accent ? { accentColor: options.accent } : {}),
  });

  // Caption marks (the master edit, motion/references/sound-study.md): reported speech in italics, at most two key
  // phrases in big capitals and one red box, each on the words the planner anchored it to.
  const LIMIT = { quote: 3, caps: 2, box: 1 }, SPAN = { quote: 10, caps: 3, box: 3 };
  const used = {};
  for (const m of design.highlight === "studio" ? plan.caption_marks || [] : []) {
    if (!LIMIT[m.kind] || (used[m.kind] = (used[m.kind] || 0) + 1) > LIMIT[m.kind]) continue;
    const t0 = wordAt(m.at) - 0.02, t1 = wordEnd(Math.max(m.at, m.until ?? m.at)) - 0.02;
    const hit = tight.words.filter((w) => w.s >= t0 && w.s <= t1 && !w.mark);
    if (hit.length && hit.length <= SPAN[m.kind]) hit.forEach((w) => (w.mark = m.kind));
  }

  // Captions on the cut timeline, grouped the way the composer groups them.
  const captions = captionClips(tight.words, D, design);

  // Motion graphics: never two at once, at least 1.2s each, held a beat past the line.
  const planned = plannedLooks(plan.graphics || [], options)
    .map((g) => ({ g, t0: Math.max(0, wordAt(g.at) - 0.1), t1: Math.min(D, wordEnd(Math.max(g.at, g.until)) + 0.35) }))
    .sort((a, b) => a.t0 - b.t0);
  const graphics = placeGraphics(planned, D, options);
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
    graphics.push({ id: `g${graphics.length + 1}`, type: "graphic", start: t0, duration: r3(t1 - t0), look: "stat", ...(options.palette === "studio" ? { variant: "studio" } : {}), text: m.text, sub: "", highlight: "", items: [], icon: "", position: "center" });
  }
  // The click button is never optional either: when the speaker says "click / tap / comment…" and there's no CTA,
  // the button goes on that word (it takes the spot over any card already there).
  if (!simple && !graphics.some((g) => g.look === "cta" || TEMPLATES[g.look]?.job === "cta")) {
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
  // The close holds at least 1.5 s (motion-graphics-director): a CTA landing in the ad's last moments starts earlier,
  // as long as it stays inside the CTA line's own stretch (never over the value lines before it).
  const cta = graphics.findLast((g) => g.look === "cta" || g.look === "sonar-cta" || TEMPLATES[g.look]?.job === "cta");
  if (cta && D - cta.start < 1.6) {
    const before = graphics.filter((g) => g !== cta && g.start < cta.start).at(-1);
    const floor = Math.max(before ? before.start + before.duration + 0.1 : 0, cta.start - 1.2);
    const start = r3(Math.max(floor, D - 1.6));
    if (start < cta.start) {
      cta.duration = r3(cta.start + cta.duration - start);
      cta.start = start;
    }
  }
  graphics.forEach((g, i) => (g.id = `g${i + 1}`));
  // Scenes the plan didn't give a transition rotate through them, so two cutaways never come in the same way.
  graphics.filter((g) => g.fullscreen).forEach((g, i) => (g.transition ||= ["slide", "wipe", "fade", "circle"][i % 4]));
  const busy = (t0, t1) => graphics.some((g) => t0 < g.start + g.duration && t1 > g.start);

  // Intentional camera moves (punch in / slow push / pull out), never under a graphic: motion/render.js frames them.
  // Premium's cinematic framing (ads/styles.js) only keeps clear of full-screen scenes: in the creator's reference reels
  // the shot punches in with a count-up or a big word up beside the speaker (2026-10-28), and a busy Premium ad has a
  // graphic up most of the time, which used to drop every planned punch-in.
  const cinematic = editStyleOf(options)?.framing === "cinematic";
  const camera = [];
  const clash = (t0, t1) => graphics.some((g) => (!cinematic || g.fullscreen) && t0 < g.start + g.duration && t1 > g.start - 0.1) || camera.some((c) => t0 < c.start + c.duration && t1 > c.start);
  // Cut hits (FastFX / CapCut-style): short effects on the footage, each with its sound. Transitions sit on the cut.
  const cuts = parts.slice(1).map((p) => p.t);
  // Where the sentence being said at t gives way to the next one: just before the first word after its full stop (or
  // after a clear pause), else the end of the ad.
  const sentenceChange = (t) => {
    const i = said.findIndex((w, k) => w.e >= t - 0.05 && (/[.?!]$/.test(String(w.text)) || (said[k + 1] && said[k + 1].s - w.e > 0.6)));
    return i >= 0 && said[i + 1] ? r3(said[i + 1].s - 0.05) : D;
  };
  const nearCut = (t) => cuts.reduce((best, c) => (Math.abs(c - t) < Math.abs(best - t) ? c : best), Infinity);
  for (const m of [...(plan.camera || [])].sort((a, b) => a.at - b.at)) {
    let t0 = r3(Math.max(0, wordAt(m.at) - 0.04));
    let t1;
    if (["punch", "push", "pull"].includes(m.move)) {
      t1 = r3(Math.min(D, Math.max(t0 + (m.move === "push" ? 1.2 : 0.8), wordEnd(Math.max(m.at, m.until ?? m.at)) + 0.1), t0 + (m.move === "push" ? 4 : 3)));
      // Talking head (the creator, 2026-10-21): a pop-in holds until the sentence changes, not just for the line.
      if (simple) t1 = r3(Math.min(D, t0 + 8, Math.max(t1, sentenceChange(wordEnd(Math.max(m.at, m.until ?? m.at))))));
      if (t1 - t0 < 0.5) continue;
    } else if (HIT_LEN[m.move]) {
      // Premium: no shakes, flashes, glitches or black-and-white beats on the speaker, only the soft blur.
      if (cinematic && m.move !== "blur") continue;
      const cut = nearCut(t0);
      if (["whip", "flash"].includes(m.move) && Math.abs(cut - t0) < 0.6) t0 = r3(Math.max(0, cut - (m.move === "whip" ? 0.12 : 0.05)));
      t1 = m.move === "bw" ? r3(Math.min(D, t0 + 1.5, Math.max(t0 + 0.6, wordEnd(Math.max(m.at, m.until ?? m.at)) + 0.1))) : r3(Math.min(D, t0 + HIT_LEN[m.move]));
    } else continue;
    // …and the next important line, said while it's in or right after, keeps it in rather than popping out and back.
    const last = camera.at(-1);
    if (simple && last && t0 <= last.start + last.duration + 0.8) {
      last.duration = r3(Math.min(12, Math.max(last.duration, t1 - last.start)));
      continue;
    }
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
    if (BANNED_VOICEFX.has(v.effect)) continue;
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
  const turns = {};
  const addSfx = (name, t, volume, extra = {}) => {
    if (name in swap) name = swap[name];
    // A role from the studio palette: the next of that role's pack sounds, so repeats rotate. Booms twice at most.
    if (String(name).startsWith("@")) {
      const role = name.slice(1), list = libraryOf(role);
      if (role === "boom" && sounds.filter((s) => SFX_ROLE[s.sfx] === "boom").length >= 2) return;
      if (role === "riser" && level < 1) return;
      // One sound per moment, as in the reference: nothing of the same role within 0.35 s of another.
      if (sounds.some((s) => SFX_ROLE[s.sfx] === role && Math.abs(s.start + (PEAK[s.sfx] ?? 0) - (s.offset || 0) - t) < 0.35)) return;
      name = list.length ? list[(turns[role] = (turns[role] ?? -1) + 1) % list.length] : null;
      // A riser stops dead on the cut it peaks into, as in the reference.
      if (role === "riser" && name) extra = { ...extra, duration: Math.min(extra.lead ?? PEAK[name] ?? 1, PEAK[name] ?? 1) + 0.08 };
    }
    if (!name || !SFX[name] || options.sfx === false || avoid.has(name) || BANNED_SFX.has(name)) return;
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
    sounds.push({ id: `s${sounds.length + 1}`, type: "sfx", start, duration: r3(len), sfx: name, volume: AD_SFX_LEVEL, ...(extra.offset > 0 ? { offset: extra.offset } : {}) });
  };
  // The reference's cold open: a deep boom on the very first frame, before any music.
  if (options.palette === "studio") addSfx("@boom", 0.05, 0.45);
  let lastRiser = -Infinity;
  for (const g of graphics) {
    const hits = GRAPHIC_SFX[g.look] ? GRAPHIC_SFX[g.look].map(([name, off, vol]) => [name, off < 0 ? g.start + g.duration + off : g.start + off, vol]) : templateHits(g, TEMPLATES[g.look]);
    for (const [name, at, vol] of hits) addSfx(name, at, vol);
    // A full-screen scene's transition gets its own sound, as in the Remotion cuts.
    if (g.fullscreen) addSfx(SCENE_SOUND[g.transition] || "atlas-whoosh", Math.max(0, g.start - 0.1), g.transition === "circle" ? 0.6 : 0.4);
    // The reference edit: a whip on the cut back out of a scene too, and the first scene is a big moment, so a riser
    // swells into it and peaks right on the cut. Premium (ads/styles.js buildUps) builds into every scene that way,
    // at least 6 s apart so it never drones.
    if (g.fullscreen && options.palette === "studio") {
      addSfx("@cut", g.start + g.duration, 0.45);
      const first = g === graphics.find((x) => x.fullscreen);
      if (g.start >= 1.8 && (first || (editStyleOf(options)?.buildUps && g.start - lastRiser >= 6))) {
        addSfx("@riser", g.start, 0.45, { lead: Math.min(1.8, g.start - 0.3) });
        lastRiser = g.start;
      }
    }
    if (g.look === "list") {
      // A soft tick as each item's check draws (timings shared with the animation in motion/render.js).
      for (const at of listTimes(g.duration, Math.min(4, g.items.length))) addSfx("tick", g.start + at + 0.1, 0.4);
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
      // Each logo whooshes in, then the X lands with a deep hit (timings match motion/render.js).
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
  thinSounds(sounds, D);
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
