// The voice's loudness every 10 ms, measured on the ORIGINAL recording (not the cleaned working copy). The cleaning
// chain levels speech with an adaptive loudnorm, which lifts a clip's opening room tone almost to speech level (an
// ad's first four seconds of the speaker standing there read -14 dB, the same as his voice), so "is he talking?"
// can't be answered from it. The raw recording keeps the real gap (room ~-40 dB, voice ~-24). Same format as
// lib/levels.js (dB per 10 ms), cached per project in data/ads/levels/.
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { FFMPEG } from "../lib/tools.js";
import { projectDir } from "../lib/store.js";
import { DATA_DIR } from "./store.js";

const RATE = 16000;
const WINDOW = RATE * 0.01;
const DIR = path.join(DATA_DIR, "levels");

export async function sourceLevels(project, { signal } = {}) {
  if (!project?.source?.file || project.source.hasAudio === false) return null;
  const file = path.join(DIR, `${project.id}.bin`);
  const cached = await fs.readFile(file).then((b) => new Int8Array(b.buffer, b.byteOffset, b.length), () => null);
  if (cached?.length) return cached;
  const src = path.join(projectDir(project.id), project.source.file);
  const levels = await new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, ["-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-"]);
    const out = [];
    let sum = 0;
    let count = 0;
    let carry = Buffer.alloc(0);
    const onAbort = () => child.kill("SIGKILL");
    signal?.addEventListener("abort", onAbort, { once: true });
    child.stdout.on("data", (chunk) => {
      const buf = carry.length ? Buffer.concat([carry, chunk]) : chunk;
      const whole = buf.length - (buf.length % 2);
      for (let i = 0; i < whole; i += 2) {
        const v = buf.readInt16LE(i) / 32768;
        sum += v * v;
        if (++count === WINDOW) {
          out.push(Math.max(-127, Math.round(10 * Math.log10(sum / WINDOW + 1e-13))));
          sum = 0;
          count = 0;
        }
      }
      carry = buf.subarray(whole);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      if (signal?.aborted) reject(new DOMException("Aborted", "AbortError"));
      else if (code === 0) resolve(Int8Array.from(out));
      else reject(new Error(`ffmpeg exited with ${code} measuring the recording's levels`));
    });
  });
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file, Buffer.from(levels.buffer));
  return levels;
}
