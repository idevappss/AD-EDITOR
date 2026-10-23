// Candidate stills for a thumbnail: frames spread across the video, scored on faces, sharpness and light.
// Owned by the THUMBNAILS session. Nothing here writes into projects/ — stills land in data/thumbnails/.
import fs from "node:fs/promises";
import path from "node:path";
import { FFMPEG, run } from "../lib/tools.js";
import { trackerBinary } from "../lib/subject.js";

const r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Times to sample: spread across the body of the video, skipping the cold open and the outro. */
export function sampleTimes(duration, count) {
  const from = Math.min(duration * 0.06, 20);
  const to = duration - Math.min(duration * 0.06, 20);
  const span = Math.max(to - from, 0.1);
  return Array.from({ length: count }, (_, i) => r3(from + (span * (i + 0.5)) / count));
}

/** One still at `at` seconds, 1920 wide (headroom for the thumbnail's push-in), as a JPEG in outDir. */
async function grab(videoPath, at, file, { signal, width = 1920 } = {}) {
  await run(
    FFMPEG,
    ["-hide_banner", "-loglevel", "error", "-nostdin", "-ss", String(at), "-i", videoPath, "-frames:v", "1",
     "-vf", `scale=${width}:-2:flags=lanczos`, "-q:v", "2", "-y", file],
    { signal },
  );
  return file;
}

/** Faces in one still, via the Apple Vision tracker the crop uses. [] when it isn't available. */
async function facesAt(videoPath, at, signal) {
  const bin = await trackerBinary();
  if (!bin) return [];
  try {
    const out = await run(bin, [videoPath, String(r3(at)), String(r3(at + 0.04)), "1"], { signal });
    const sample = out.split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l)).find((s) => !s.error);
    return sample?.faces || [];
  } catch {
    return []; // a frame the tracker can't read shouldn't sink the whole batch
  }
}

/** Sharpness (0–1), mid-tone brightness and contrast, from sharp's stats when it's installed. */
async function look(file) {
  try {
    const { default: sharp } = await import("sharp");
    const [stats, meta] = await Promise.all([sharp(file).stats(), sharp(file).metadata()]);
    const lum = stats.channels.slice(0, 3);
    const mean = lum.reduce((s, c) => s + c.mean, 0) / (lum.length * 255);
    const spread = lum.reduce((s, c) => s + c.stdev, 0) / (lum.length * 255);
    const aspect = meta.width && meta.height ? r3(meta.width / meta.height) : 16 / 9;
    return { sharpness: clamp((stats.sharpness ?? 0) / 12, 0, 1), brightness: r3(mean), contrast: r3(clamp(spread * 2.4, 0, 1)), aspect };
  } catch {
    return { sharpness: 0.5, brightness: 0.5, contrast: 0.5, aspect: 16 / 9 };
  }
}

const area = (b) => b[2] * b[3];

/**
 * Score a still the way the SOP wants it: one clear face big in frame (one focal point, not a crowd), sharp,
 * well lit and punchy. 0–1, and the face position the composition uses to place the subject and the words.
 */
function score({ faces, sharpness, brightness, contrast }) {
  const sure = faces.filter((b) => b[4] >= 0.5).sort((a, b) => area(b) - area(a));
  const face = sure[0] || null;
  // Faces nearly as big as the main one compete for attention; small ones in the background don't.
  const rivals = face ? sure.slice(1).filter((b) => area(b) >= area(face) * 0.45).length : 0;
  const faceScore = face ? clamp(0.55 + area(face) * 6, 0, 1) * (rivals ? 0.82 : 1) : 0;
  const lightScore = 1 - Math.abs(brightness - 0.52) * 2.2;
  const value = 0.42 * faceScore + 0.24 * sharpness + 0.2 * contrast + 0.14 * clamp(lightScore, 0, 1);
  return {
    score: r3(clamp(value, 0, 1)),
    face: face ? { x: r3(face[0] + face[2] / 2), y: r3(face[1] + face[3] / 2), size: r3(Math.sqrt(area(face))) } : null,
    faces: sure.length,
  };
}

/**
 * Candidate stills for one video, best first.
 * → [{ at, file, url, score, face, faces, aspect, sharpness, brightness, contrast }]
 */
export async function candidates(videoPath, { duration, count = 16, outDir, signal, onProgress } = {}) {
  await fs.mkdir(outDir, { recursive: true });
  const times = sampleTimes(duration, count);
  const out = [];
  for (const [i, at] of times.entries()) {
    const file = path.join(outDir, `frame-${String(i).padStart(2, "0")}.jpg`);
    try {
      await grab(videoPath, at, file, { signal });
    } catch {
      continue; // a seek past a damaged part of the file: take what the rest gives us
    }
    const [faces, shape] = await Promise.all([facesAt(videoPath, at, signal), look(file)]);
    out.push({ at, file, index: i, ...shape, ...score({ faces, ...shape }) });
    onProgress?.(Math.round((100 * (i + 1)) / times.length));
  }
  if (!out.length) throw new Error("Couldn't read a single frame out of this video.");
  return out.sort((a, b) => b.score - a.score);
}

/**
 * The creator's own photos (the SOP's thumbnail shoot) as candidates: each is normalised to a JPEG up to 1920
 * wide and scored the same way as a video still. HEIC and other formats ffmpeg can't read go through macOS sips.
 * → the same shape as candidates(), best first, with `name` (the original filename) and `at: null`.
 */
export async function photoCandidates(files, { outDir, signal, prefix = "photo" } = {}) {
  await fs.mkdir(outDir, { recursive: true });
  const out = [];
  for (const [i, src] of files.entries()) {
    const file = path.join(outDir, `${prefix}-${String(i).padStart(2, "0")}.jpg`);
    const scale = ["-vf", "scale='min(1920,iw)':-2:flags=lanczos", "-frames:v", "1", "-q:v", "2", "-y", file];
    try {
      await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", src.path, ...scale], { signal });
    } catch {
      try {
        const jpg = `${file}.src.jpg`;
        await run("/usr/bin/sips", ["-s", "format", "jpeg", src.path, "--out", jpg], { signal });
        await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", jpg, ...scale], { signal });
        await fs.rm(jpg, { force: true });
      } catch {
        continue; // not a picture we can read: skip it, keep the rest
      }
    }
    // The face tracker reads video, so hand it the photo as a half-second clip.
    const clip = `${file}.mp4`;
    let faces = [];
    try {
      await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-loop", "1", "-i", file, "-t", "0.5", "-r", "10",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-pix_fmt", "yuv420p", "-y", clip], { signal });
      faces = await facesAt(clip, 0.1, signal);
    } catch {
      // no faces found is a fine answer
    } finally {
      await fs.rm(clip, { force: true }).catch(() => {});
    }
    const shape = await look(file);
    out.push({ at: null, file, index: i, name: src.name || path.basename(src.path), ...shape, ...score({ faces, ...shape }) });
  }
  if (!out.length) throw new Error("None of those files could be read as a picture.");
  return out.sort((a, b) => b.score - a.score);
}
