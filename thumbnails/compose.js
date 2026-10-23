// The thumbnail itself: a 1280×720 page that Chrome screenshots. Built to the SOP's three C's: one subject
// pushed in and set on a third, a spotlight and a tone grade for contrast, the words off the face in at most
// three lines, and one corner hit. The accent colour comes from the Assets brand kit when the creator has one.
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "../lib/tools.js";

const FONTS = path.join(ROOT, "assets", "fonts");
const fontUrl = (name) => pathToFileURL(path.join(FONTS, name)).href;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const WIDTH = 1280;
export const HEIGHT = 720;

/** How the text sits against the picture. `auto` picks the side away from the speaker. */
export const LAYOUTS = [
  { id: "left", label: "Text left" },
  { id: "right", label: "Text right" },
  { id: "bottom", label: "Across the bottom" },
  { id: "panel", label: "Split panel" },
  { id: "word", label: "One big word" },
];
export const LAYOUT_IDS = new Set(LAYOUTS.map((l) => l.id));

const DEFAULT_ACCENT = "#ef3340";

let house = null;
/**
 * The colour for burned-in artwork, read from the Design session's `--burn-accent` token. It's deliberately not
 * `--accent`: app chrome follows whatever theme the app wears, while a thumbnail lands in someone else's feed
 * next to competitors, so it stays punchy and stable.
 */
async function houseAccent() {
  house ??= fs
    .readFile(path.join(ROOT, "public", "theme.css"), "utf8")
    .then((css) => css.match(/--burn-accent:\s*(#[0-9a-f]{3,8})/i)?.[1] || DEFAULT_ACCENT)
    .catch(() => DEFAULT_ACCENT);
  return house;
}
const UPSTREAM = () => (process.env.CLIP_STUDIO_URL || "http://localhost:5173").replace(/\/$/, "");

let brandCache = { at: 0, brand: null };

/**
 * The creator's brand kit (Assets session, read-only). Cached for a few minutes; a studio that isn't
 * running just means the house accent colour.
 */
export async function brandKit({ fresh = false } = {}) {
  if (!fresh && brandCache.brand && Date.now() - brandCache.at < 300_000) return brandCache.brand;
  let brand = { colors: [], fonts: [], logos: [] };
  try {
    const res = await fetch(`${UPSTREAM()}/api/resources/brand`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) brand = await res.json();
  } catch {
    // Assets tab not reachable — house colours are fine.
  }
  brandCache = { at: Date.now(), brand };
  return brand;
}

const absolute = (url) => (!url ? null : /^https?:/.test(url) ? url : `${UPSTREAM()}${url}`);

/** Accent + logo the composition should use, from the brand kit. */
export async function brandStyle({ accent, logo = false } = {}) {
  const brand = await brandKit();
  const picked = accent || brand.colors?.find((c) => /accent|brand|primary|main/i.test(c.name || ""))?.hex || brand.colors?.[0]?.hex || (await houseAccent());
  const mark = logo ? brand.logos?.find((l) => /png|jpe?g|svg|webp/i.test(l.mime || l.url || "")) : null;
  return { accent: /^#[0-9a-f]{3,8}$/i.test(picked) ? picked : await houseAccent(), logoUrl: absolute(mark?.url) || null };
}

/** The layout that leaves the speaker visible: text opposite the face, bottom bar when they're centred. */
export function autoLayout(face) {
  if (!face) return "bottom";
  if (face.x >= 0.58) return "left";
  if (face.x <= 0.42) return "right";
  return "bottom";
}

/** Where the subject's face should land, by layout: on the third away from the words (SOP: rule of thirds). */
const TARGET = {
  left: { x: 0.66, y: 0.4, size: 0.27 },
  right: { x: 0.34, y: 0.4, size: 0.27 },
  bottom: { x: 0.5, y: 0.34, size: 0.22 },
  panel: { x: 0.5, y: 0.4, size: 0.3 },
  word: { x: 0.5, y: 0.42, size: 0.24 },
};
const MAX_ZOOM = 1.45;

/**
 * Size and place the still so the face sits on its third and fills more of the frame (a push-in, capped so a
 * 1920-wide still stays sharp). Returns pixels inside the picture box, plus where the face ends up.
 */
export function placement({ face, aspect = 16 / 9, layout = "bottom" }) {
  const box = layout === "panel" ? { x: Math.round(WIDTH * 0.44), w: Math.round(WIDTH * 0.56), h: HEIGHT } : { x: 0, w: WIDTH, h: HEIGHT };
  const a = aspect > 0.2 && aspect < 5 ? aspect : 16 / 9;
  // Cover the box at 1×.
  let bw = box.w, bh = box.w / a;
  if (bh < box.h) (bh = box.h), (bw = box.h * a);
  const t = TARGET[layout] || TARGET.bottom;
  const zoom = face?.size ? Math.min(MAX_ZOOM, Math.max(1, t.size / face.size)) : 1;
  const w = bw * zoom, h = bh * zoom;
  const fx = (face ? face.x : 0.5) * w, fy = (face ? face.y : 0.45) * h;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const left = clamp(t.x * box.w - fx, box.w - w, 0);
  const top = clamp(t.y * box.h - fy, box.h - h, 0);
  const r = (n) => Math.round(n);
  return { box, left: r(left), top: r(top), width: r(w), height: r(h), zoom: Math.round(zoom * 100) / 100, faceX: r(box.x + left + fx), faceY: r(top + fy) };
}

/** Match the vibe (SOP 5): cool for serious, punchy for bold, warm and light for bright. */
const GRADES = {
  serious: { filter: "contrast(1.1) saturate(0.9) brightness(1.02)", tint: "rgba(40, 90, 170, .16)" },
  bold: { filter: "contrast(1.14) saturate(1.2) brightness(1.03)", tint: "transparent" },
  bright: { filter: "contrast(1.06) saturate(1.28) brightness(1.1)", tint: "rgba(255, 170, 60, .12)" },
};

/**
 * The page Chrome screenshots.
 * imageUrl: a file:// or http URL for the still. headline/sub: the words. accent: hex. face/aspect: from frames.js.
 * tone: serious | bold | bright. badge: the corner hit ("$1M", "Day 90").
 */
export function thumbnailHtml({ imageUrl, headline, sub = "", layout = "bottom", accent = DEFAULT_ACCENT, face = null, aspect = 16 / 9, logoUrl = null, badge = "", hit = "", tone = "bold", textColor = "#ffffff", uppercase = true }) {
  const words = String(headline || "").trim().split(/\s+/).filter(Boolean);
  const bare = (w) => String(w || "").toLowerCase().replace(/[^\w$%]+/g, "");
  const place = placement({ face, aspect, layout });
  const grade = GRADES[tone] || GRADES.bold;
  const ink = /^#[0-9a-f]{6}$/i.test(textColor) ? textColor : "#ffffff";
  const textCase = uppercase === false ? "none" : "uppercase";
  // The corner hit sits in the top corner on the text's side, where the picture is emptiest.
  const cornerSide = layout === "right" ? "right" : "left";
  const body = layout === "word"
    ? `<div class="word">${esc(words[0] || "")}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}`
    : `<h1>${words.map((w) => `<span${bare(w) && bare(w) === bare(hit) ? ' data-hit="1"' : ""}>${esc(w)}</span>`).join(" ")}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}`;

return `<!doctype html>
<meta charset="utf-8" />
<style>
  @font-face { font-family: "Anton"; src: url("${fontUrl("anton-latin-400-normal.woff2")}") format("woff2"); font-weight: 400; font-display: block; }
  @font-face { font-family: "Inter"; src: url("${fontUrl("inter-latin-900-normal.woff2")}") format("woff2"); font-weight: 900; font-display: block; }
  @font-face { font-family: "Inter"; src: url("${fontUrl("inter-latin-600-normal.woff2")}") format("woff2"); font-weight: 600; font-display: block; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #000; }
  .frame { position: relative; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; --accent: ${esc(accent)}; }
  .pic { position: absolute; top: 0; bottom: 0; left: ${place.box.x}px; width: ${place.box.w}px; overflow: hidden; }
  .shot { position: absolute; left: ${place.left}px; top: ${place.top}px; width: ${place.width}px; height: ${place.height}px; max-width: none; filter: ${grade.filter}; }
  .tint { position: absolute; inset: 0; background: ${grade.tint}; mix-blend-mode: soft-light; }
  /* Luminosity contrast: light on the subject, the rest of the frame falls away. */
  .grade { position: absolute; inset: 0; background: radial-gradient(circle at ${place.faceX}px ${place.faceY}px, rgba(255,255,255,.06) 0, transparent 24%, rgba(0,0,0,.12) 50%, rgba(0,0,0,.38) 100%); }
  .scrim { position: absolute; inset: 0; }
  .text { position: absolute; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
  h1 { color: ${ink}; font: 400 104px/1.04 "Anton", "Inter", sans-serif; text-transform: ${textCase}; letter-spacing: -0.01em; text-wrap: balance; text-shadow: 0 4px 0 rgba(0,0,0,.28), 0 6px 30px rgba(0,0,0,.6); }
  h1 span { box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  h1 span.hit { background: var(--accent); color: #fff; padding: 0 12px; margin: 0 -4px; border-radius: 8px; text-shadow: none; }
  .sub { color: rgba(255,255,255,.88); font: 600 30px/1.2 "Inter", sans-serif; letter-spacing: -0.01em; text-shadow: 0 3px 16px rgba(0,0,0,.6); }
  .bar { width: 96px; height: 10px; border-radius: 99px; background: var(--accent); }

  .left .text  { left: 64px;  top: 0; bottom: 0; width: 560px; }
  .left .scrim { background: linear-gradient(100deg, rgba(0,0,0,.82) 10%, rgba(0,0,0,.5) 42%, transparent 64%); }
  .right .text  { right: 64px; top: 0; bottom: 0; width: 560px; text-align: right; align-items: flex-end; }
  .right .scrim { background: linear-gradient(260deg, rgba(0,0,0,.82) 10%, rgba(0,0,0,.5) 42%, transparent 64%); }
  .bottom .text  { left: 64px; right: 64px; bottom: 56px; height: 300px; justify-content: flex-end; }
  .bottom .scrim { background: linear-gradient(transparent 34%, rgba(0,0,0,.72) 72%, rgba(0,0,0,.92)); }
  .bottom h1 { font-size: 92px; }
  .panel .scrim { background: linear-gradient(90deg, #0b0b0d 0 44%, rgba(11,11,13,.85) 44%, transparent 58%); }
  .panel .text { left: 60px; top: 0; bottom: 0; width: 470px; }
  .panel h1 { font-size: 88px; }
  .word { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font: 400 240px/1 "Anton", sans-serif; text-transform: uppercase; text-shadow: 0 10px 50px rgba(0,0,0,.6); -webkit-text-stroke: 3px rgba(0,0,0,.25); }
  .word ~ .sub { position: absolute; left: 0; right: 0; bottom: 66px; text-align: center; font-size: 34px; }
  .word-l .scrim { background: radial-gradient(70% 70% at 50% 50%, rgba(0,0,0,.6), rgba(0,0,0,.35)); }
  .edge { position: absolute; inset: 0; box-shadow: inset 0 0 0 10px var(--accent); }
  .logo { position: absolute; right: 44px; bottom: 40px; max-width: 190px; max-height: 74px; filter: drop-shadow(0 4px 16px rgba(0,0,0,.6)); }
  .badge { position: absolute; top: 40px; padding: 10px 22px 12px; border-radius: 12px; background: var(--accent); color: #fff; font: 400 64px/1 "Anton", sans-serif; letter-spacing: .005em; text-transform: uppercase; box-shadow: 0 10px 34px rgba(0,0,0,.45); }
  .badge.left { left: 48px; transform: rotate(-3deg); }
  .badge.right { right: 48px; transform: rotate(3deg); }
  .has-badge.left .text, .has-badge.right .text, .has-badge.panel .text { top: 130px; }
</style>
<div class="frame ${layout === "word" ? "word-l" : layout}${badge ? " has-badge" : ""}">
  <div class="pic"><img class="shot" src="${esc(imageUrl)}" /><div class="tint"></div></div>
  <div class="grade"></div>
  <div class="scrim"></div>
  ${badge ? `<div class="badge ${cornerSide}">${esc(badge)}</div>` : ""}
  ${layout === "word" ? body : `<div class="text"><div class="bar"></div>${body}</div>`}
  ${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" />` : ""}
</div>
<script>
  // One word carries the accent, and the headline shrinks until it fits its box — never a clipped line.
  (() => {
    const h1 = document.querySelector("h1");
    if (h1) {
      const spans = [...h1.querySelectorAll("span")];
      // The word Claude called the strongest carries the accent; failing that, the longest one.
      const hit = h1.querySelector("span[data-hit]") || spans.slice().sort((a, b) => b.textContent.length - a.textContent.length)[0];
      if (spans.length > 1 && hit && hit.textContent.replace(/[^A-Za-z0-9$%]/g, "").length >= 3) hit.classList.add("hit");
      // The SOP's glance test: no more than three lines, never clipped.
      const box = h1.parentElement;
      const lines = () => Math.round(h1.scrollHeight / (parseFloat(getComputedStyle(h1).fontSize) * 1.04));
      for (let size = parseFloat(getComputedStyle(h1).fontSize); size > 34; size -= 2) {
        h1.style.fontSize = size + "px";
        if (h1.scrollHeight <= box.clientHeight - 60 && h1.scrollWidth <= box.clientWidth && lines() <= 3) break;
      }
      document.documentElement.dataset.lines = String(lines());
      document.documentElement.dataset.size = String(parseFloat(h1.style.fontSize));
    }
    const word = document.querySelector(".word");
    if (word) for (let size = 240; size > 60 && word.scrollWidth > ${WIDTH} - 120; size -= 6) word.style.fontSize = size + "px";
    document.documentElement.dataset.ready = "1";
  })();
</script>`;
}
