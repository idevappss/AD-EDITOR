// The creator's licensed sound pack (~/Desktop/SFX & Transitions: Ocular Sounds, the MP3 48000HZ set, Cinegrams), and
// the sounds picked from it to match the reference edit (motion/references/sound-study.md): the SooWei Goh × Dr. Odell
// Miller intro the creator called "perfect… even the amount of volume on the sound effects" (2026-10-23).
//
// The pack's licences allow use in our videos but not redistribution, so the files never go in git: on first use each
// pick is converted from the pack into motion/sfx/lib-*.mp3 (gitignored). Without the pack those sounds just aren't
// available and the editors fall back to the house sounds.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Where the pack lives (override with SFX_LIBRARY). */
export const PACK_DIR = process.env.SFX_LIBRARY || path.join(os.homedir(), "Desktop", "SFX & Transitions");
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "sfx");

const OS = (folder, name, collection) => `Ocular Sounds/${folder}/${name}_Ocular Sounds_${folder.replace(/\./g, "")}_The ${collection}.wav`;
/**
 * Each pick: its file in the pack, its role in the mix and where it peaks (seconds into the file, from the index of the
 * pack: data/sfx-library/index.json). Roles, as the reference uses them:
 *   cut    a short whip right on a cut into or out of B-roll / a full-screen scene (peaks on the cut)
 *   ui     a crisp click as an element, title or node appears
 *   riser  a 1–2 s swell whose peak lands exactly on the cut into a big moment, then nothing
 *   boom   a deep hit: the cold open's first frame and a name / logo reveal, twice a video at most
 *   land   a bright beep as a counting number lands
 */
export const LIBRARY = {
  "lib-whip-1": { role: "cut", peak: 0.04, file: OS("Quick Whips", "DSGNWhsh_Short Whip, Short Whoosh 24", "Complete Whooshes Collection"), label: "Quick whip 1" },
  "lib-whip-2": { role: "cut", peak: 0.04, file: OS("Quick Whips", "DSGNWhsh_Short Whip, Short Whoosh 31", "Complete Whooshes Collection"), label: "Quick whip 2" },
  "lib-whip-3": { role: "cut", peak: 0.04, file: OS("Quick Whips", "DSGNWhsh_Short Whip, Short Whoosh 4", "Complete Whooshes Collection"), label: "Quick whip 3" },
  "lib-whip-4": { role: "cut", peak: 0.08, file: OS("Quick Whips", "DSGNWhsh_Short Whip, Short Whoosh 15", "Complete Whooshes Collection"), label: "Quick whip 4" },
  "lib-click-1": { role: "ui", peak: 0.04, file: OS("Camera Shutters", "COMCam_Very Short Shutter 6", "Cinematic Elements Collection"), label: "Shutter click 1" },
  "lib-click-2": { role: "ui", peak: 0, file: OS("Camera Shutters", "COMCam_High End White Noise Shutter, Very Short", "Cinematic Elements Collection"), label: "Shutter click 2" },
  "lib-click-3": { role: "ui", peak: 0.04, file: OS("Camera Shutters", "COMCam_Very Short Shutter 3", "Cinematic Elements Collection"), label: "Shutter click 3" },
  "lib-riser-1": { role: "riser", peak: 1.18, file: OS("Wind Risers", "DSGNRise_High Pitched SciFi, High Whoosh, Medium Rise", "Complete Risers Collection"), label: "Sci-fi riser" },
  "lib-riser-2": { role: "riser", peak: 0.7, file: OS("Wind Risers", "DSGNRise_Low Drone, Air Pump, Medium Rise", "Complete Risers Collection"), label: "Air-pump riser" },
  "lib-riser-3": { role: "riser", peak: 3.1, file: OS("Distorted Risers", "DSGNRise_Fast Airy Passing, Short Reverb", "Complete Risers Collection"), label: "Airy riser" },
  "lib-boom-1": { role: "boom", peak: 0.2, file: OS("Deep Impacts", "DSGNImpt_Small Hit, Drum, Deep, Short", "Complete Impacts Collection"), label: "Deep drum hit" },
  "lib-boom-2": { role: "boom", peak: 0.08, file: OS("Epic Hits Vol. 1", "DSGNImpt_Soft Metal Hit, Big Low Boom", "Complete Impacts Collection"), label: "Low boom" },
  "lib-land": { role: "land", peak: 0.2, file: OS("Camera Shutters", "COMCam_Flash Shutter Beep", "Cinematic Elements Collection"), label: "Flash beep" },
};

/** The picks of one role that are on this machine. */
export const libraryOf = (role) => Object.keys(LIBRARY).filter((id) => LIBRARY[id].role === role && fs.existsSync(path.join(OUT_DIR, `${id}.mp3`)));

/** Convert any pick that isn't in motion/sfx yet from the pack (once; a few seconds). Returns the ids now available. */
export function syncLibrary() {
  const ready = [];
  for (const [id, s] of Object.entries(LIBRARY)) {
    const out = path.join(OUT_DIR, `${id}.mp3`);
    if (!fs.existsSync(out)) {
      const src = path.join(PACK_DIR, s.file);
      if (!fs.existsSync(src)) continue;
      try {
        execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-ac", "2", "-ar", "48000", "-b:a", "192k", out], { stdio: "ignore" });
      } catch {
        continue;
      }
    }
    ready.push(id);
  }
  return ready;
}
