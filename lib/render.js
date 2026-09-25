import fs from "node:fs/promises";
import { HYPERFRAMES, ROOT, run } from "./tools.js";

/** Below this much free disk, frames stream to the encoder instead of piling up on disk (~250 MB per second of 1080p). */
const LOW_DISK_BYTES = 15 * 1024 ** 3;
async function lowOnDisk(dir) {
  try {
    const s = await fs.statfs(dir);
    return s.bavail * s.bsize < LOW_DISK_BYTES;
  } catch {
    return false;
  }
}

/** Render a HyperFrames composition directory to MP4, reporting 0–100 progress when the CLI prints it. */
export async function renderComposition(compositionDir, outFile, { quality = "high", onProgress, signal } = {}) {
  let last = -1;
  const args = ["render", compositionDir, "-o", outFile, "--quality", quality, "--fps", "30"];
  if (await lowOnDisk(compositionDir)) args.push("--low-memory-mode");
  await run(HYPERFRAMES, args, {
    cwd: ROOT,
    signal,
    onLine: (line) => {
      // Structured producer logs aren't meant for people; keep the last friendly message instead.
      if (/^\[(INFO|DEBUG|TRACE|WARN)\]|Render:trace|^[{[]/.test(line)) return;
      const pct = line.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
      const frames = line.match(/(\d+)\s*\/\s*(\d+)\s*frames?/i);
      const value = pct ? Number(pct[1]) : frames ? (100 * Number(frames[1])) / Number(frames[2]) : null;
      if (value !== null && value <= 100 && Math.floor(value) !== last) {
        last = Math.floor(value);
        onProgress?.(last, line);
      } else if (value === null) {
        onProgress?.(null, line);
      }
    },
  });
}
