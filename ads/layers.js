// The hook the editor calls on every preview and render (editor/index.js preview, editor/director/render.js):
// motion graphics and sound effects from the document (drawn by motion/render.js), plus the ad's grade and the brand accent. Any document
// without graphic or sfx tracks, and any clip that isn't an ad, comes back untouched.
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { ROOT } from "../lib/tools.js";
import { listLuts } from "../lib/luts.js";
import { graphicClips, injectAdLayers, sfxClips, sfxFile } from "../motion/index.js";
import { DATA_DIR, adFor } from "./store.js";
import { fxFile, splitVoice } from "./voicefx.js";

export const LOGOS_DIR = path.join(DATA_DIR, "logos");
export const PREVIEWS_DIR = path.join(DATA_DIR, "previews");

/**
 * The LUT-graded preview copy of an ad's footage for one LUT: { file, lut }, or null when there's no such LUT.
 * Named per version of the .cube, so a replaced LUT gets a new copy and a new URL (no stale browser cache).
 */
export async function gradedPreviewName(adId, lutId) {
  const lut = (await listLuts()).find((l) => l.id === lutId);
  if (!lut) return null;
  const version = Math.round((await fs.stat(lut.file)).mtimeMs).toString(36);
  return { file: `${adId}-${lutId}-${version}.mp4`, lut };
}

const UPSTREAM = () => `http://localhost:${Number(process.env.PORT) || 5173}`;

let accentCache = { at: 0, hex: null };
/** The creator's accent: the Assets brand kit's, else the burned-in accent token from the theme. */
export async function brandAccent() {
  if (accentCache.hex && Date.now() - accentCache.at < 300_000) return accentCache.hex;
  let hex = null;
  try {
    const res = await fetch(`${UPSTREAM()}/api/resources/brand`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const brand = await res.json();
      hex = brand.colors?.find((c) => /accent|brand|primary|main/i.test(c.name || ""))?.hex || brand.colors?.[0]?.hex || null;
    }
  } catch {
    // no brand kit reachable
  }
  if (!/^#[0-9a-f]{3,8}$/i.test(hex || "")) {
    hex = await fs.readFile(path.join(ROOT, "public", "theme.css"), "utf8").then((css) => css.match(/--burn-accent:\s*(#[0-9a-f]{3,8})/i)?.[1], () => null);
  }
  accentCache = { at: Date.now(), hex: hex || "#F4930F" };
  return accentCache.hex;
}

/**
 * @param stage  renders only: (fromPath, relPath) → composition-relative path, copying the file in
 */
export async function applyAdLayers(html, doc, { projectId, preview = true, stage = null } = {}) {
  if (!doc) return html;
  const ad = await adFor(projectId, doc.clipId).catch(() => null);
  if (!ad && !graphicClips(doc).length && !sfxClips(doc).length) return html;
  const sfxSrc = (name) => {
    if (!/^[\w-]+$/.test(String(name || ""))) return null;
    return preview ? `/api/ads/sfx/${name}.mp3` : stage(sfxFile(name), `ads/sfx/${name}.mp3`);
  };
  const logos = new Map((ad?.logos || []).map((l) => [l.id, l]));
  const logoSrc = (logoId) => {
    const l = logos.get(logoId);
    if (!l) return null;
    return preview ? `/api/ads/${ad.id}/logos/${encodeURIComponent(l.file)}` : stage(path.join(LOGOS_DIR, ad.id, l.file), `ads/logos/${l.file}`);
  };
  // Preview only: play the LUT-graded copy of the footage for the timeline's LUT, so the preview matches the render's
  // colour. Its URL is unique to that LUT and .cube version, so switching grades never replays a cached copy.
  if (preview && ad && doc.design?.lut && doc.design.lut !== "none") {
    const graded = await gradedPreviewName(ad.id, doc.design.lut);
    if (graded && existsSync(path.join(PREVIEWS_DIR, graded.file))) {
      html = html.replace(new RegExp(`/files/${projectId}/[^"]+?\\.mp4`, "g"), `/api/ads/${ad.id}/graded/${graded.file}`);
    }
  }
  const slides = new Map((await fs.readFile(path.join(DATA_DIR, "slides", "index.json"), "utf8").then((t) => JSON.parse(t), () => [])).map((x) => [x.id, x]));
  const slideSrc = (slideId) => {
    const sl = slides.get(slideId);
    if (!sl) return null;
    return preview ? `/api/ads/slides/${encodeURIComponent(sl.file)}` : stage(path.join(DATA_DIR, "slides", sl.file), `ads/slides/${sl.file}`);
  };
  // Voice effects: over each voicefx clip the voice plays from its filtered copy (ads/voicefx.js).
  const fxClips = doc.tracks.filter((t) => t.kind === "voicefx" && !t.hidden && !t.muted).flatMap((t) => t.clips);
  if (fxClips.length) {
    html = splitVoice(html, fxClips, (effect) => {
      const file = fxFile(projectId, effect);
      if (!existsSync(file)) return null;
      return preview ? `/api/ads/voicefx/${path.basename(file)}` : stage(file, `ads/voicefx/${path.basename(file)}`);
    });
  }
  return injectAdLayers(html, doc, { sfxSrc, slideSrc, logoSrc, grade: ad?.grade || null, accent: ad?.options?.accent || (await brandAccent()) });
}
