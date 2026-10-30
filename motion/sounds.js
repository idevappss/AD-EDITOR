// Sound effects for motion graphics: one folder (motion/sfx), one list of names, and the timing and mix rules every
// editor uses (Ads Editor, clip editor + its AI director, Dope clips). Pixabay sounds are credited in sfx/CREDITS.md;
// the rest were made here (the sound study, references/sound-effects.md) or come from the Atlas Remotion project.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATES, templateSfx } from "./templates/index.js";
import { LIBRARY, syncLibrary } from "./library.js";

export const SFX_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "sfx");
/** A sound effect's file. */
export const sfxFile = (name) => path.join(SFX_DIR, `${name}.mp3`);

/** Every sound effect: id → label. */
export const SFX = {
  whoosh: "Whoosh",
  "whoosh-short": "Quick whoosh",
  "whoosh-cinematic": "Cinematic whoosh",
  pop: "Pop",
  riser: "Riser",
  "impact-bass-1": "Bass hit",
  "impact-bass-2": "Deep impact",
  "glitch-1": "Glitch",
  "glitch-2": "Glitch 2",
  crash: "Crash",
  click: "Mouse click",
  counter: "Money counter",
  cash: "Cha-ching",
  // Made from the sound study (references/sound-effects.md), our own synthesis.
  slice: "Blade slice",
  bell: "Bell ding",
  boom: "Whoosh-boom",
  bloop: "Bloop",
  tick: "UI tick",
  air: "Air whoosh",
  chirp: "Confirm chirp",
  ticker: "Count ticker",
  ping: "Glass ping",
  bigswoosh: "Big swoosh",
  revswell: "Reverse swell",
  whistle: "Whistle",
  swoosh: "Swoosh",
  // The Atlas kit's own sounds (original synthesized audio from the creator's Remotion project).
  "atlas-whoosh": "Atlas whoosh",
  "atlas-click": "Atlas click",
  "atlas-pop": "Atlas pop",
  "atlas-ding": "Atlas ding",
  "atlas-marker": "Atlas marker strike",
  "atlas-riser": "Atlas riser",
  "atlas-impact": "Atlas impact",
  "atlas-typing": "Atlas typing",
  "atlas-success": "Atlas success",
};

// The creator's pack (motion/library.js): converted into sfx/ on first load, listed only when the pack is here.
for (const id of syncLibrary()) SFX[id] = LIBRARY[id].label;

/** Where each sound peaks, in seconds into its file: sounds are placed so the peak lands on the moment. Kit sounds (atlas-*) peak at their start. */
export const PEAK = { "whoosh-cinematic": 2.9, riser: 3.0, "impact-bass-1": 0.1, "impact-bass-2": 1.85, "whoosh-short": 0.15, whoosh: 0.3, pop: 0.02, crash: 0.02, click: 0.02, cash: 0.1, counter: 0,
  slice: 0.3, bell: 0.01, boom: 1.3, bloop: 0.01, tick: 0.005, air: 0.5, chirp: 0.02, ticker: 0, ping: 0.01, bigswoosh: 0.35, revswell: 1.05, whistle: 0.07, swoosh: 0.22 };

for (const [id, l] of Object.entries(LIBRARY)) if (l.peak) PEAK[id] = l.peak;

/** The pack sounds' roles (cut, ui, riser, boom, land), from motion/library.js. */
export const SFX_ROLE = Object.fromEntries(Object.entries(LIBRARY).map(([id, l]) => [id, l.role]));
/**
 * How loud each role plays, in dB against the voice: its loudest 400 ms vs the voice's integrated loudness. Measured
 * from the reference edit (references/sound-study.md, 2026-10-23): whips on cuts poke just above the music bed, clicks
 * and counter ticks sit well under the voice, a riser's peak and the two booms reach the voice's own level. The cut
 * whip is set 3 dB over the reference's −11 because the first test render (2026-10-23) measured it that much light in
 * the finished mix. Then every role came down 6 dB (the creator, 2026-10-28: "turn down the volume on the sound
 * effects, it's way too loud").
 */
export const ROLE_LEVEL = { cut: -14, ui: -20, land: -21, riser: -8, boom: -7 };
/**
 * The music bed: the reference sits 14 dB under the voice; we used 15, the line the render review (lib/review.js)
 * flags music as loud at, then 4 dB lower again (the creator, 2026-10-28: turn the music down "so it's not
 * overpowering what the person is saying").
 */
export const BED_LEVEL = -19;

/** Ambience (whooshes, swooshes, air, risers): never louder than the music bed. */
export const AMBIENT_SFX = new Set(["whoosh", "whoosh-short", "whoosh-cinematic", "swoosh", "bigswoosh", "air", "revswell", "riser", "atlas-whoosh", "atlas-riser"]);
/** Build-ups: dropped when the sound design is turned down. */
export const BUILDUPS = new Set(["riser", "atlas-riser", "whoosh-cinematic", "revswell"]);
/** Never on an ad or a kit graphic (the creator, 2026-09-28: the glitch sounds clash). Dope transitions may still use them. */
export const BANNED_SFX = new Set(["glitch-1", "glitch-2"]);
/** Every effect is mixed at 0.7 (the creator, 2026-09-28: "turn down… the sound effects a bit more"). */
export const SFX_GAIN = 0.7;
/** A full-screen scene's entrance sound, by its transition (as in the Remotion cuts). */
export const SCENE_SOUND = { fade: "atlas-whoosh", slide: "atlas-whoosh", wipe: "atlas-whoosh", circle: "atlas-impact", glitch: "atlas-click", dive: "atlas-whoosh", blur: "atlas-riser" };

const r3 = (n) => Math.round(n * 1000) / 1000;

/** Start a sound so its peak lands on `at`; when there isn't room for the build-up, skip into the file instead. */
export function peakAlign(name, at) {
  const peak = PEAK[name] ?? 0;
  const skip = Math.max(0, peak - at);
  return { start: r3(Math.max(0, at - (peak - skip))), skip: r3(skip) };
}

/**
 * When a graphic's own sounds should hit, in timeline seconds: [[sound, at, volume]]. A template's offsets count from
 * the clip's start, or back from its end when negative (a countdown's last tick, a prompt's send).
 */
export const templateHits = (clip, t = TEMPLATES[clip.look]) =>
  templateSfx(t, clip).map(([name, off, vol]) => [name, r3(off < 0 ? clip.start + clip.duration + off : clip.start + off), vol ?? 0.5]);

/**
 * Hits → sfx clips, peak-aligned and mixed by the house rules. Used by every editor that adds a graphic's sounds.
 * @param length  the edit's length (sounds that would start in its last 0.1 s are dropped)
 * @param level   1 full, under 1 subtle (no build-ups), 0 off
 */
export function soundClips(hits, { length = Infinity, level = 1, gain = SFX_GAIN } = {}) {
  const out = [];
  if (level <= 0) return out;
  for (const [name, at, volume] of hits) {
    if (!name || !SFX[name] || BANNED_SFX.has(name) || (level < 1 && BUILDUPS.has(name))) continue;
    const { start, skip } = peakAlign(name, at);
    if (start >= length - 0.1 || out.some((s) => s.sfx === name && Math.abs(s.start - start) < 0.15)) continue;
    const vol = volume * gain * level * (AMBIENT_SFX.has(name) ? 0.8 : 1);
    out.push({ type: "sfx", start, duration: r3(Math.min(3.5, length - start)), sfx: name, volume: r3(vol), ...(skip > 0 ? { offset: skip } : {}) });
  }
  return out.sort((a, b) => a.start - b.start);
}
