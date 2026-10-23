// Voice effects: the speaker's voice briefly goes underwater, muffled or through a phone speaker on one line, as
// punctuation (motion/references/retention-transitions.md §2). Each effect is a filtered copy of the project's whole
// working audio, made once, so it shares the source timeline: over a voicefx clip, the voice <audio> pieces play
// from that copy instead (same media offsets), with hard cuts in and out on the edit.

import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { FFMPEG, run } from "../lib/tools.js";
import { workingFile } from "../lib/work.js";
import { DATA_DIR } from "./store.js";

export const VOICE_FX_DIR = path.join(DATA_DIR, "voicefx");

export const VOICE_FX = {
  // The classic underwater hit: lows up, everything above ~900 Hz gone, a short watery echo.
  underwater: { label: "Underwater", chain: "lowpass=f=900,lowpass=f=900,bass=g=6:f=120,aecho=0.8:0.6:60|110:0.3|0.2,chorus=0.6:0.9:40:0.3:0.25:2,volume=9dB,alimiter=limit=0.9" },
  // A softer "inside the head" muffle for a thought or an aside.
  muffle: { label: "Muffled", chain: "highshelf=f=1000:g=-10,lowpass=f=3200,volume=3dB,alimiter=limit=0.9" },
  // Through a phone speaker / walkie-talkie: a quoted customer, "they call and say…".
  phone: { label: "Phone call", chain: "highpass=f=380,lowpass=f=3200,acompressor=threshold=0.1:ratio=6:attack=5:release=60,volume=7dB,alimiter=limit=0.9" },
};

export const fxFile = (projectId, effect) => path.join(VOICE_FX_DIR, `${projectId}-${effect}.m4a`);

/** Make the filtered copies these effects need (once per project and effect). */
export async function ensureVoiceFx(project, effects, signal) {
  await fs.mkdir(VOICE_FX_DIR, { recursive: true });
  for (const effect of new Set(effects)) {
    const fx = VOICE_FX[effect];
    const out = fxFile(project.id, effect);
    if (!fx || existsSync(out)) continue;
    const tmp = `${out}.tmp.m4a`;
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", workingFile(project), "-vn", "-af", fx.chain, "-c:a", "aac", "-b:a", "192k", tmp], { signal });
    await fs.rename(tmp, out);
  }
}

/**
 * Swap the voice to its effect copy over each voicefx clip: every voice <audio id="paN"> piece that overlaps one is
 * split into dry and wet pieces with the same source offsets.
 * @param srcFor (effect) → URL/path of the effect copy, or null to leave that clip dry
 */
export function splitVoice(html, clips, srcFor) {
  const fx = clips.map((c) => ({ ...c, src: srcFor(c.effect) })).filter((c) => c.src).sort((a, b) => a.start - b.start);
  if (!fx.length) return html;
  const r3 = (n) => Math.round(n * 1000) / 1000;
  return html.replace(/<audio id="(pa\d+)" src="([^"]*)" data-start="([\d.]+)" data-duration="([\d.]+)" data-media-start="([\d.]+)"([^>]*)><\/audio>/g, (whole, id, src, s, d, m, rest) => {
    const start = Number(s);
    const end = start + Number(d);
    const media = Number(m);
    const hits = fx.filter((c) => c.start < end && c.start + c.duration > start);
    if (!hits.length) return whole;
    const pieces = [];
    let t = start;
    for (const c of hits) {
      const a = Math.max(start, c.start);
      const b = Math.min(end, c.start + c.duration);
      if (a - t > 0.01) pieces.push({ from: t, to: a, src });
      pieces.push({ from: a, to: b, src: c.src });
      t = b;
    }
    if (end - t > 0.01) pieces.push({ from: t, to: end, src });
    return pieces
      .map((p, k) => `<audio id="${id}v${k}" src="${p.src}" data-start="${r3(p.from)}" data-duration="${r3(p.to - p.from)}" data-media-start="${r3(media + p.from - start)}"${rest}></audio>`)
      .join("");
  });
}
