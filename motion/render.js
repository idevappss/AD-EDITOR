// The motion graphics renderer (moved here from ads/graphics.js, 2026-10-01): motion graphics, sound effects and the
// colour grade, added to a composition that lib/compose.js built (and editor/director/layers.js may already have
// layered). Every editor draws with it: the Ads Editor, the clip editor and Dope clips, for live previews and renders,
// so what the creator previews is what gets saved.
//   graphic clips  { look, text, sub, highlight, items[], icon, position }   → HTML + GSAP on the clip timeline
//   sfx clips      { sfx, volume }                                           → <audio> on the composition
import { ASPECTS, normalizeDesign } from "../lib/compose.js";
import { REEL_SAFE } from "../lib/facezone.js";
import { FLOAT_IN, TEMPLATES, isScene, soften } from "./templates/index.js";
import { KIT_CSS } from "./templates/_parts.js";

export const LOOKS = {
  headline: "Kinetic headline",
  stat: "Big number",
  list: "Checklist",
  "lower-third": "Name bar",
  callout: "Badge",
  cta: "Call to action",
  compare: "Before / after",
  icon: "Icon card",
  logo: "Logo",
  proof: "Testimonial",
  check: "Big check",
  slide: "Slide",
};
// The template library's looks are looks too (motion/templates/).
for (const t of Object.values(TEMPLATES)) LOOKS[t.id] = t.name;
export const POSITIONS = ["top", "center", "bottom"];

// Stroke icons (24×24), drawn in the accent colour.
export const ICONS = {
  check: `<path d="M5 12.5 10 17 19 7"/>`,
  x: `<path d="M6 6l12 12M18 6 6 18"/>`,
  up: `<path d="M4 17 10 11l4 4 6-7"/><path d="M15 8h5v5"/>`,
  down: `<path d="M4 7l6 6 4-4 6 7"/><path d="M15 16h5v-5"/>`,
  dollar: `<path d="M12 3v18"/><path d="M16.5 7.5c-.6-1.5-2.3-2.5-4.5-2.5-2.8 0-4.5 1.4-4.5 3.3 0 4.6 9.5 2.5 9.5 7.3 0 2-1.9 3.4-5 3.4-2.4 0-4.3-1.1-5-2.8"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`,
  calendar: `<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>`,
  phone: `<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>`,
  users: `<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16 14.4c2.3.1 4 1.6 4.5 4.1"/>`,
  chart: `<path d="M4 19.5V14m5 5.5V8m5 11.5v-7m5 7V5"/>`,
  star: `<path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>`,
  heart: `<path d="M12 19s-6.5-4.2-6.5-8.4A3.6 3.6 0 0 1 12 8.2a3.6 3.6 0 0 1 6.5 2.4C18.5 14.8 12 19 12 19z"/>`,
  bolt: `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>`,
  target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>`,
  gift: `<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z"/>`,
  alert: `<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.2"/>`,
  arrow: `<path d="M5 12h13M13 6l6 6-6 6"/>`,
  play: `<circle cx="12" cy="12" r="8.5"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`,
  shield: `<path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>`,
  stethoscope: `<path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5v2a4.5 4.5 0 0 0 9 0v-2"/><circle cx="19" cy="10.5" r="2"/>`,
};

/** How a full-screen scene comes in (the Remotion transitions, the Jeremy demo's glitch, and the laptop-dive reels' dive). */
export const TRANSITIONS = ["fade", "slide", "wipe", "circle", "glitch", "dive", "blur"];
/** Deterministic 0–1 from a string (so embers sit in the same place on every render). */
const seeded = (key) => {
  let h = 2166136261;
  for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
};

// Colour grades, as HyperFrames media-treatment grading (the same system lib/hfstyles.js uses).
export const GRADES = {
  clean: { label: "Clean studio", grade: { preset: "clean-studio", intensity: 0.8, adjust: { exposure: 0.04, contrast: 0.12, saturation: 0.05 }, details: { vignette: 0.08, grain: 0 } } },
  punchy: { label: "Bright & punchy", grade: { preset: "bright-pop", intensity: 0.7, adjust: { contrast: 0.18, saturation: 0.16, temperature: 0.06, shadows: -0.06 }, details: { vignette: 0.22, grain: 0.06 } } },
  warm: { label: "Warm premium", grade: { preset: "clean-studio", intensity: 0.85, adjust: { exposure: 0.02, contrast: 0.14, highlights: -0.06, temperature: 0.22, saturation: 0.02 }, details: { vignette: 0.2, grain: 0.04 } } },
  cinematic: { label: "Cinematic", grade: { preset: "deep-contrast", intensity: 0.85, adjust: { exposure: -0.12, contrast: 0.16, highlights: -0.1, blacks: -0.12, temperature: 0.14, saturation: -0.08 }, details: { vignette: 0.4, grain: 0.12 } } },
  restore: { label: "Restore flat/log footage", grade: { preset: "clean-studio", intensity: 1, adjust: { exposure: 0.02, contrast: 0.42, highlights: -0.12, shadows: -0.08, blacks: -0.22, temperature: 0.12, saturation: 0.42 }, details: { vignette: 0.12, grain: 0.02 } } },
  none: { label: "No grade", grade: null },
};

const r3 = (n) => Math.round(n * 1000) / 1000;
/** How long a number counts up, from 0.1 s after it appears (ads/build.js lays the counter sound over it). */
export const statCount = (len) => r3(Math.min(1.2, Math.max(0.5, len * 0.45)));
/** When each checklist item pops in (one at a time, each replacing the last); build.js puts a pop on each. */
export const listTimes = (len, n) => {
  const gap = Math.max(0.9, (len - 0.6) / Math.max(1, n));
  return Array.from({ length: n }, (_, k) => r3(0.45 + k * gap));
};
/** When the cursor clicks the CTA button, seconds after it appears (ads/build.js puts the click sound here). */
export const CTA_CLICK = 1.05;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/**
 * Template text: escaped, with one *word* allowed as an italic serif accent inside the sans headline
 * (motion-graphics-director, 2026-09-30: "one italic serif accent word inside a sans headline is allowed").
 */
const escAccent = (s) => esc(s).replace(/\*([^*]{1,40})\*/g, '<em class="sf">$1</em>');
const kind = (doc, k) => doc.tracks.filter((t) => t.kind === k && !t.hidden && !t.muted).flatMap((t) => t.clips).sort((a, b) => a.start - b.start);
export const graphicClips = (doc) => kind(doc, "graphic");
export const sfxClips = (doc) => kind(doc, "sfx");

/** "$100K/mo" → { pre: "$", value: 100, decimals: 0, post: "K/mo" }; null when there's no number to count up. */
export function parseStat(text) {
  // "24/7" and the like aren't amounts: they pop in whole instead of counting up.
  if (/\d\s*\/\s*\d/.test(String(text || ""))) return null;
  const m = String(text || "").match(/^([^\d-]*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2].replace(/,/g, "");
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return { pre: m[1], value, decimals: raw.includes(".") ? raw.split(".")[1].length : 0, post: m[3], commas: m[2].includes(",") };
}

/** Words of a line, with the highlighted phrase marked. */
function words(text, highlight) {
  const list = String(text || "").trim().split(/\s+/).filter(Boolean).slice(0, 14);
  const hl = String(highlight || "").toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}$%]/gu, "")).filter(Boolean);
  return list.map((w) => ({ w, hot: hl.includes(w.toLowerCase().replace(/[^\p{L}\p{N}$%]/gu, "")) }));
}

/**
 * An item's words with the key ones marked: *stars* around a word mark it; otherwise "free" and numbers do.
 * → [[word, hot], …]
 */
function keyWords(text) {
  const raw = String(text || "").trim();
  if (/\*[^*]+\*/.test(raw)) {
    const out = [];
    raw.split(/(\*[^*]+\*)/).filter((x) => x.trim()).forEach((part) => {
      const hot = /^\*.*\*$/.test(part);
      part.replace(/\*/g, "").trim().split(/\s+/).forEach((w) => out.push([w, hot]));
    });
    return out;
  }
  const words = raw.split(/\s+/);
  const bare = (w) => w.replace(/[^\w$%.,+]/g, "");
  let hot = words.findIndex((w) => /^free$/i.test(bare(w)));
  if (hot < 0) hot = words.findIndex((w) => /^\$?\d[\d,.]*[kmx%+]?$/i.test(bare(w)));
  return words.map((w, i) => [w, i === hot]);
}

const icon = (name, size, stroke = 2.2) => `<svg class="ag-ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.check}</svg>`;

/**
 * Add the ad's graphics, sound effects and grade to composition HTML.
 * @param opts.sfxSrc  (name) → URL or composition-relative path of that sound effect
 * @param opts.logoSrc (logoId) → URL or composition-relative path of an uploaded logo, or null
 * @param opts.grade   a GRADES id, or null to leave the composition's own grade alone
 * @param opts.accent  the brand accent (defaults to the design's accent)
 */
export function injectAdLayers(html, doc, { sfxSrc, slideSrc = () => null, logoSrc = () => null, grade = null, accent: brandAccent = null } = {}) {
  let out = html;
  if (grade && GRADES[grade]) {
    const g = GRADES[grade].grade;
    out = out.replace(/ data-color-grading="[^"]*"/g, g ? ` data-color-grading="${esc(JSON.stringify(g))}"` : "");
  }
  const graphics = graphicClips(doc);
  const sounds = sfxClips(doc);
  out = adFraming(out, doc, graphics);
  if (!graphics.length && !sounds.length) return placeCaptionsOnly(out, doc);

  const d = normalizeDesign({ ...doc.design, aspect: doc.aspect });
  const { width: W, height: H } = ASPECTS[d.aspect];
  const u = Math.min(W, H) / 1080; // 1 at 1080 wide
  const px = (n) => Math.round(n * u);
  const accent = /^#[0-9a-f]{3,8}$/i.test(brandAccent || "") ? brandAccent : d.accentColor && d.accentColor !== "#FFFFFF" ? d.accentColor : "#F4930F";
  const tall = H > W;

  const fontBase = out.match(/url\("([^"]*?)fonts\/[\w-]+\.woff2"\)/)?.[1] ?? "assets/";
  const blocks = [];
  const usedTemplates = new Set();
  const cues = [];
  // Where the face sits while a graphic is up: the framing's step then (opened a little, OPEN), zoomed from its origin.
  const program = out.includes('id="video-punch"') ? framingProgram(doc, graphics) : [];
  const faceUnder = (f, t0, t1) => faceOnScreen(f, program, t0, t1, OPEN);
  const shots = doc.tracks.filter((t) => t.kind === "video" && !t.hidden).flatMap((t) => t.clips);
  for (const c of graphics) {
    const id = `ag-${c.id}`;
    const t0 = r3(c.start);
    const t1 = r3(c.start + c.duration);
    // Full-screen scene: the kit's dark (or accent) ground covers the speaker while the voice carries on.
    const full = isScene(TEMPLATES[c.look], c);
    const tone = ["accent", "paper"].includes(c.tone) ? c.tone : "dark";
    const transition = TRANSITIONS.includes(c.transition) ? c.transition : null;
    const pos = full || TEMPLATES[c.look]?.overlay ? "center" : POSITIONS.includes(c.position) ? c.position : c.look === "cta" || c.look === "lower-third" ? "bottom" : c.look === "list" || c.look === "compare" || c.look === "stat" ? "center" : "top";
    const where = `ag-at-${pos}${full ? ` ag-full tone-${tone}` : ""}`;
    let inner = "";
    let items = 0;
    let stat = null;
    let tplData = null;
    let kickerWords = 0;
    let markLetters = 0;
    switch (c.look) {
      case "stat": {
        stat = parseStat(c.text);
        // No card: a big number in the middle that counts up. Money is green.
        const money = /\$|€|£|\bk\b|revenue|profit|month|\/mo/i.test(`${c.text} ${c.sub}`);
        // Studio (the master edit): a white number that spins up blurred and lands sharp, its line in italics word by word.
        const studio = c.variant === "studio";
        const subHtml = studio ? String(c.sub || "").trim().split(/\s+/).filter(Boolean).map((w, k) => `<span class="ag-sw" id="${id}-sw${k}">${esc(w)}</span>`).join(" ") : esc(c.sub);
        items = studio ? String(c.sub || "").trim().split(/\s+/).filter(Boolean).length : 0;
        inner = `<div class="ag-stat${money && !studio ? " money" : ""}${c.variant === "pill" ? " v-pill" : ""}${studio ? " v-studio" : ""}"><div class="ag-num" id="${id}-num">${esc(c.text)}</div>${c.sub ? `<div class="ag-sub">${subHtml}</div>` : ""}</div>`;
        break;
      }
      case "list": {
        // No card: a bold kicker, then one item at a time (bubble → check → words), the key word in the accent.
        const list = (c.items || []).filter(Boolean).slice(0, 4);
        items = list.length;
        // Kicker: bold caps, its key word (*stars*, else the last word) in the accent.
        const kw = String(c.text || "").trim();
        const kwords = /\*[^*]+\*/.test(kw) ? keyWords(kw) : kw.split(/\s+/).filter(Boolean).map((w, i, all) => [w, all.length > 1 && i === all.length - 1]);
        const kicker = kw ? `<div class="ag-hk" id="${id}-k">${kwords.map(([w, hot], j) => `<span class="ag-kw${hot ? " hot" : ""}" id="${id}-kw${j}">${esc(w)}</span>`).join(" ")}</div>` : "";
        kickerWords = kwords.length;
        // Items share one spot and replace each other; each is sized so its whole line fits (Inter Black caps ≈ 0.64em).
        const row = (it, i) => {
          const chars = it.replace(/\*/g, "").length;
          const size = Math.round(Math.min(px(tall ? 76 : 66), (W * 0.8 - px(110)) / (Math.max(chars, 8) * 0.56)));
          return `<div class="ag-li" id="${id}-i${i}" style="--lt:${size}px"><span class="ag-tick" id="${id}-c${i}"><svg viewBox="0 0 100 100"><circle class="rim" cx="50" cy="50" r="41"/><circle cx="50" cy="50" r="41" pathLength="100" transform="rotate(-90 50 50)"/><path d="M33 52 45 64 68 38" pathLength="100"/></svg></span><span class="ag-lt-text" id="${id}-t${i}">${keyWords(it).map(([w, hot], j) => (hot ? `<span class="ag-hot" id="${id}-h${i}-${j}">${esc(w)}</span>` : esc(w))).join(" ")}</span></div>`;
        };
        inner = `<div class="ag-list" id="${id}-card">${kicker}<div class="ag-items">${list.map(row).join("")}</div></div>`;
        break;
      }
      case "lower-third":
        inner = `<div class="ag-lt"><i class="ag-lt-bar" id="${id}-bar"></i><div class="ag-lt-body" id="${id}-body"><b>${esc(c.text)}</b>${c.sub ? `<span>${esc(c.sub)}</span>` : ""}</div></div>`;
        break;
      case "callout":
        inner = `<div class="ag-badge">${icon(c.icon || "bolt", px(40), 2.6)}<span>${esc(c.text)}</span></div>`;
        break;
      case "cta":
        // A clean button, and a cursor that glides onto it and clicks (ripple, press, click sound).
        inner = `<div class="ag-cta">${c.sub ? `<div class="ag-cta-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}<div class="ag-btn" id="${id}-btn"><span>${esc(c.text || "Start Your 7 Day Free Trial")}</span></div><i class="ag-ripple" id="${id}-rip"></i><svg class="ag-cursor" id="${id}-cur" viewBox="0 0 24 24"><path d="M5 3.2 19.2 12 12.6 13.5 16.3 20.3 13.6 21.7 9.9 14.9 5.2 19.4Z"/></svg></div>`;
        break;
      case "compare": {
        const [bad = "", good = ""] = c.items || [];
        items = 2;
        inner = `<div class="ag-compare"><div class="ag-col bad" id="${id}-i0"><div class="ag-col-h">${icon("x", px(34), 3)}<span>${esc(c.text || "Before")}</span></div><p>${esc(bad)}</p></div><div class="ag-col good" id="${id}-i1"><div class="ag-col-h">${icon("check", px(34), 3)}<span>${esc(c.sub || "After")}</span></div><p>${esc(good)}</p></div></div>`;
        break;
      }
      case "logo": {
        // One or more transparent logos. strike: a fat X slams across them (the ones being dismissed).
        const srcs = (c.logos?.length ? c.logos : [c.logo]).map((l) => logoSrc(l)).filter(Boolean).slice(0, 3);
        if (!srcs.length) continue;
        items = srcs.length;
        inner = `<div class="ag-logos n${srcs.length}${c.strike ? " struck" : " hero"}">${srcs.map((src, k) => `<span class="ag-lg" id="${id}-g${k}"><img id="${id}-l${k}" src="${esc(src)}" alt="" />${c.strike ? `<svg class="ag-x" id="${id}-x${k}" viewBox="0 0 100 100"><path d="M26 26 74 74M74 26 26 74"/></svg>` : ""}</span>`).join("")}</div>${c.text && !c.strike ? `<div class="ag-mark" id="${id}-mark">${[...String(c.text).trim()].map((ch, k) => `<span class="ag-ml" id="${id}-m${k}">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div>` : ""}`;
        markLetters = c.text && !c.strike ? [...String(c.text).trim()].length : 0;
        break;
      }
      case "slide": {
        // One of the creator's own slides, framed in glass: floats in tilted, then a slow push-in while it's up.
        const src = slideSrc(c.slide);
        if (!src) continue;
        inner = `<div class="ag-slide" id="${id}-card"><img id="${id}-img" src="${esc(src)}" alt="" /></div>`;
        break;
      }
      case "check":
        // One big confirming check: a glowing circle draws itself, then a fat check strokes in. Optional word under it.
        inner = `<div class="ag-bigcheck"><svg class="ag-bc" id="${id}-bc" viewBox="0 0 120 120"><circle class="ag-bc-ring" id="${id}-ring" cx="60" cy="60" r="50" pathLength="100"/><path class="ag-bc-tick" id="${id}-tick" d="M37 62 53 78 84 43" pathLength="100"/></svg>${c.text ? `<div class="ag-bc-word" id="${id}-word">${esc(c.text)}</div>` : ""}</div>`;
        break;
      case "proof": {
        // A member's win, as a notification: initial avatar, name, the line. Slides in, soft pop, slides out.
        const name = String(c.sub || "Member");
        inner = `<div class="ag-proof" id="${id}-card"><span class="ag-pf-av">${esc(name.trim().charAt(0).toUpperCase())}</span><div class="ag-pf-body"><div class="ag-pf-head"><b>${esc(name)}</b><span>ATLAS member</span></div><p>${esc(c.text)}</p></div></div>`;
        break;
      }
      case "icon":
        inner = `<div class="ag-iconcard"><div class="ag-orb" id="${id}-orb">${icon(c.icon || "star", px(92), 2)}</div><div class="ag-head sm">${words(c.text, c.highlight).map((x, i) => `<span class="ag-w${x.hot ? " hot" : ""}" id="${id}-w${i}">${esc(x.w)}</span>`).join(" ")}</div>${c.sub ? `<div class="ag-sub">${esc(c.sub)}</div>` : ""}</div>`;
        items = words(c.text, c.highlight).length;
        break;
      default: {
        const tpl = TEMPLATES[c.look];
        if (tpl) {
          tplData = tpl.data(c);
          inner = tpl.html({ id, c, px, W, H, tall, esc: escAccent, data: tplData, logo: (c.logos || []).map((l) => logoSrc(l)).find(Boolean) || null });
          usedTemplates.add(tpl.id);
          break;
        }
        const list = words(c.text, c.highlight);
        items = list.length;
        inner = `<div class="ag-headline"><div class="ag-head">${list.map((x, i) => `<span class="ag-w${x.hot ? " hot" : ""}" id="${id}-w${i}">${esc(x.w)}</span>`).join(" ")}</div>${c.sub ? `<div class="ag-sub">${esc(c.sub)}</div>` : ""}</div>`;
      }
    }
    if (c.look === "logo") inner = `<div class="ag-logo-wrap">${inner}</div>`;
    if (c.look === "list") blocks.push(`<div id="${id}-scrim" class="ag-scrim"></div>`);
    // The scene ground: grain, and on the dark ground ember motes rising and twinkling (fx.tsx Dust).
    let motes = [];
    if (full) {
      if (tone === "dark") {
        const rnd = seeded(c.id);
        motes = Array.from({ length: 34 }, () => [rnd(), rnd(), 0.2 + rnd() * 0.9, 2 + rnd() * 4, rnd()]);
      }
      blocks.push(`<div id="${id}-bd" class="ag-bd tone-${tone}"><i class="ag-grain" id="${id}-gr"></i>${motes.map(([x, y, , sz], k) => `<i class="ag-mote" id="${id}-e${k}" style="left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%;width:${px(sz)}px;height:${px(sz)}px;--g:${px(sz * 3)}px"></i>`).join("")}</div>`);
    }
    blocks.push(`<div id="${id}" class="ag ag-look-${c.look || "headline"} ${where}">${inner}</div>`);
    cues.push({ id, look: c.look || "headline", t0, t1, items, stat, pos, strike: Boolean(c.strike), mark: markLetters, kw: kickerWords, full, tr: full ? transition || TRANSITIONS.slice(0, 4)[graphics.filter((g) => isScene(TEMPLATES[g.look], g)).indexOf(c) % 4] : null, motes: motes.map(([, , sp, , tw]) => [r3(sp * 30 * u), r3(tw)]), face: c.face && !full && !TEMPLATES[c.look]?.overlay ? faceUnder(headBand(c.face, shots, t0, t1), t0, t1) : null, count: statCount(t1 - t0), times: c.look === "list" ? listTimes(t1 - t0, items) : null, data: tplData, low: TEMPLATES[c.look]?.position === "bottom", hideCap: Boolean(TEMPLATES[c.look]?.hideCaptions || (c.look === "stat" && c.variant === "studio")) });
  }

  const audio = sounds
    .map((c, i) => {
      const src = sfxSrc?.(c.sfx);
      if (!src) return "";
      const vol = Math.max(0, Math.min(1.6, c.volume ?? 0.5)) * 0.8;
      return `<audio id="ag-sfx-${esc(c.id)}" src="${esc(src)}" data-start="${r3(c.start)}" data-duration="${r3(c.duration)}" data-media-start="${r3(c.offset || 0)}" data-track-index="${30 + (i % 16)}" data-volume="${r3(vol)}"></audio>`;
    })
    .filter(Boolean);

  const css = `
      /* ---- motion graphics (motion/render.js) ---- */
      @font-face { font-family: "Inter"; src: url("${fontBase}fonts/inter-latin-400-normal.woff2") format("woff2"); font-weight: 400; }
      @font-face { font-family: "Inter"; src: url("${fontBase}fonts/inter-latin-500-normal.woff2") format("woff2"); font-weight: 500; }
      @font-face { font-family: "Inter"; src: url("${fontBase}fonts/inter-latin-700-normal.woff2") format("woff2"); font-weight: 700; }
      ${[500, 600, 700, 800].map((w) => `@font-face { font-family: "Plus Jakarta Sans"; src: url("${fontBase}fonts/plus-jakarta-sans-latin-${w}-normal.woff2") format("woff2"); font-weight: ${w}; }`).join("\n      ")}
      @font-face { font-family: "EB Garamond"; src: url("${fontBase}fonts/eb-garamond-latin-400-normal.woff2") format("woff2"); font-weight: 400; }
      @font-face { font-family: "JetBrains Mono"; src: url("${fontBase}fonts/jetbrains-mono-latin-500-normal.woff2") format("woff2"); font-weight: 500; }
      .ag-bd { --ac: ${accent}; --brand: ${accent}; }
      .ag { position: absolute; left: 0; right: 0; z-index: 90; display: flex; justify-content: center; pointer-events: none; visibility: hidden; opacity: 0; font-family: "Inter", system-ui, sans-serif; color: #fff; --ac: ${accent}; --brand: ${accent}; }
      .ag-at-top { top: ${tall ? 11 : 7}%; }
      .ag-at-center { top: 0; bottom: 0; align-items: center; }
      .ag-at-bottom { bottom: ${tall ? 23 : 12}%; }
      .ag-headline, .ag-iconcard { max-width: ${tall ? 88 : 70}%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: ${px(18)}px; }
      .ag-head { font-weight: 800; font-size: ${px(tall ? 88 : 80)}px; line-height: 1.04; letter-spacing: -0.045em; color: #F5EFE8; text-shadow: 0 0 ${px(30)}px rgba(255,236,220,.3), 0 ${px(4)}px ${px(24)}px rgba(0,0,0,.5); }
      .ag-head.sm { font-size: ${px(tall ? 70 : 62)}px; }
      .ag-w { display: inline-block; will-change: transform, opacity, filter; }
      .ag-w.hot { position: relative; color: var(--ac); text-shadow: 0 0 ${px(28)}px color-mix(in srgb, var(--ac) 45%, transparent), 0 ${px(4)}px ${px(24)}px rgba(0,0,0,.5); }
      .ag-w.hot::before { content: none; }
      .ag-sub { font-weight: 600; font-size: ${px(36)}px; letter-spacing: -0.005em; color: rgba(245,239,232,.82); text-shadow: 0 ${px(3)}px ${px(18)}px rgba(0,0,0,.6); }
      .ag-card { position: relative; padding: ${px(44)}px ${px(56)}px; border-radius: ${px(40)}px; background: rgba(0,0,0,.74); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.1), 0 ${px(40)}px ${px(120)}px rgba(0,0,0,.55); }
      .ag-stat { text-align: center; }
      .ag-num { font-weight: 800; font-size: ${px(tall ? 190 : 160)}px; line-height: 1; letter-spacing: -0.055em; color: #F5EFE8; font-variant-numeric: tabular-nums; text-shadow: 0 0 ${px(30)}px rgba(255,236,220,.3), 0 ${px(4)}px ${px(24)}px rgba(0,0,0,.5); will-change: transform, filter; }
      .ag-stat.v-pill { padding: ${px(30)}px ${px(56)}px ${px(34)}px; border-radius: ${px(40)}px; background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); }
      .ag-stat.v-pill .ag-num { font-size: ${px(130)}px; color: var(--ac); text-shadow: 0 0 ${px(30)}px color-mix(in srgb, var(--ac) 45%, transparent); }
      .ag-stat.v-pill.money .ag-num { color: #3DDC84; text-shadow: 0 0 ${px(30)}px rgba(61,220,132,.45); }
      .ag-stat.v-studio .ag-num { font-weight: 700; font-size: ${px(tall ? 170 : 150)}px; letter-spacing: -0.035em; color: #fff; text-shadow: 0 ${px(4)}px ${px(30)}px rgba(0,0,0,.45); }
      .ag-stat.v-studio .ag-sub { margin-top: ${px(-6)}px; font-style: italic; font-weight: 500; font-size: ${px(tall ? 56 : 50)}px; letter-spacing: -0.01em; color: #fff; text-shadow: 0 ${px(2)}px ${px(16)}px rgba(0,0,0,.6); }
      .ag-stat.v-studio .ag-sw { display: inline-block; will-change: transform, opacity, filter; }
      .ag-stat.money .ag-num { color: #3DDC84; text-shadow: 0 0 ${px(34)}px rgba(61,220,132,.45), 0 ${px(6)}px ${px(26)}px rgba(0,0,0,.5); }
      .ag-stat .ag-sub { margin-top: ${px(12)}px; font-size: ${px(34)}px; font-weight: 600; color: rgba(245,239,232,.85); text-shadow: 0 ${px(3)}px ${px(18)}px rgba(0,0,0,.7); }
      .ag-list { display: block; box-sizing: border-box; width: ${Math.round(W * (tall ? 0.84 : 0.46))}px; padding: ${px(30)}px ${px(36)}px ${px(24)}px; border-radius: ${px(34)}px; color: #F5EFE8; background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); }
      .ag-scrim { position: absolute; left: 0; right: 0; bottom: 0; height: ${tall ? 46 : 56}%; z-index: 89; pointer-events: none; visibility: hidden; opacity: 0; background: linear-gradient(0deg, rgba(0,0,0,.42), rgba(0,0,0,.18) 55%, rgba(0,0,0,0)); }
      .ag-hk { margin-bottom: ${px(14)}px; font-family: "SF Mono", "SFMono-Regular", Menlo, "Courier Prime", monospace; font-weight: 500; font-size: ${px(24)}px; line-height: 1.2; letter-spacing: .2em; text-transform: uppercase; color: var(--ac); white-space: nowrap; }
      .ag-kw { display: inline-block; will-change: transform, opacity, filter; }
      .ag-kw.hot { color: var(--ac); }
      .ag-items { display: flex; flex-direction: column; }
      .ag-li { display: flex; align-items: center; gap: ${px(18)}px; padding: ${px(10)}px 0; will-change: opacity; }
      .ag-li .ag-tick, .ag-li .ag-lt-text { visibility: visible; }
      .ag-tick { flex: none; width: ${px(44)}px; height: ${px(44)}px; filter: drop-shadow(0 0 ${px(6)}px rgba(61,220,132,.35)); }
      .ag-tick svg { width: 100%; height: 100%; overflow: visible; }
      .ag-tick circle.rim { stroke: rgba(245,239,232,.22); stroke-width: 3.5; stroke-dasharray: none; stroke-dashoffset: 0; }
      .ag-tick circle, .ag-tick path { fill: none; stroke: #3DDC84; stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .ag-lt-text { font-family: "Inter", system-ui, sans-serif; font-weight: 600; font-size: ${px(38)}px; line-height: 1.2; letter-spacing: -0.01em; color: #F5EFE8; opacity: .42; white-space: nowrap; }
      .ag-hot { display: inline; color: var(--ac); }
      .ag-lt { position: relative; display: flex; align-items: stretch; margin-right: auto; margin-left: ${tall ? 6 : 5}%; }
      .ag-lt-bar { display: block; width: ${px(6)}px; border-radius: ${px(3)}px; background: var(--ac); box-shadow: 0 0 ${px(16)}px var(--ac); transform-origin: 50% 100%; }
      .ag-lt-body { display: flex; flex-direction: column; gap: ${px(6)}px; margin-left: ${px(16)}px; padding: ${px(22)}px ${px(34)}px; border-radius: ${px(22)}px; background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); clip-path: inset(0 0 0 0 round ${px(22)}px); }
      .ag-lt-body b { font-weight: 800; font-size: ${px(48)}px; letter-spacing: -0.03em; color: #F5EFE8; }
      .ag-lt-body span { font-family: "SF Mono", Menlo, monospace; font-weight: 500; font-size: ${px(22)}px; letter-spacing: .18em; text-transform: uppercase; color: var(--ac); }
      .ag-badge { display: inline-flex; align-items: center; gap: ${px(16)}px; padding: ${px(22)}px ${px(42)}px; border-radius: 999px; background: rgba(28,22,19,.8); color: #F5EFE8; font-weight: 700; font-size: ${px(44)}px; letter-spacing: -0.015em; box-shadow: inset 0 0 0 ${px(3)}px color-mix(in srgb, var(--ac) 80%, transparent), 0 0 ${px(44)}px color-mix(in srgb, var(--ac) 38%, transparent); backdrop-filter: blur(${px(14)}px); -webkit-backdrop-filter: blur(${px(14)}px); }
      .ag-cta { position: relative; display: flex; flex-direction: column; align-items: center; gap: ${px(20)}px; }
      .ag-cta-sub { font-family: "SF Mono", "SFMono-Regular", Menlo, monospace; font-weight: 500; font-size: ${px(26)}px; text-transform: uppercase; letter-spacing: 0.2em; color: #F5EFE8; text-shadow: 0 ${px(3)}px ${px(16)}px rgba(0,0,0,.7); }
      .ag-btn { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: ${px(14)}px; padding: ${px(28)}px ${px(58)}px; border-radius: 999px; background: var(--ac); color: #1C1310; font-weight: 800; font-size: ${px(46)}px; letter-spacing: -0.02em; box-shadow: 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 50%, transparent), 0 ${px(18)}px ${px(40)}px rgba(0,0,0,.3); }
      .ag-shine { position: absolute; top: -20%; bottom: -20%; width: 30%; left: -40%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.6), transparent); transform: skewX(-18deg); }
      .ag-ripple { position: absolute; left: 62%; bottom: ${px(24)}px; width: ${px(90)}px; height: ${px(90)}px; margin: ${px(-45)}px 0 0 ${px(-45)}px; border-radius: 50%; border: ${px(3)}px solid rgba(255,255,255,.9); visibility: hidden; opacity: 0; }
      .ag-cursor { position: absolute; left: 62%; bottom: ${px(-40)}px; width: ${px(72)}px; height: ${px(72)}px; overflow: visible; visibility: hidden; opacity: 0; transform-origin: 20% 12%; filter: drop-shadow(0 ${px(8)}px ${px(14)}px rgba(0,0,0,.45)); }
      .ag-cursor path { fill: #fff; stroke: #000; stroke-width: 1.4; stroke-linejoin: round; }
      .ag-compare { display: flex; gap: ${px(24)}px; width: ${tall ? 90 : 70}%; }
      .ag-col { flex: 1; padding: ${px(32)}px ${px(34)}px; border-radius: ${px(30)}px; background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); }
      .ag-col-h { display: flex; align-items: center; gap: ${px(12)}px; font-family: "SF Mono", Menlo, monospace; font-weight: 500; font-size: ${px(24)}px; text-transform: uppercase; letter-spacing: .18em; }
      .ag-col.bad .ag-col-h { color: rgba(245,239,232,.5); }
      .ag-col.good { box-shadow: inset 0 0 0 ${px(3)}px var(--ac), 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 30%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); }
      .ag-col.good .ag-col-h { color: var(--ac); }
      .ag-col p { margin: ${px(14)}px 0 0; font-weight: 700; font-size: ${px(42)}px; line-height: 1.15; letter-spacing: -0.02em; color: #F5EFE8; }
      .ag-col.bad p { color: rgba(245,239,232,.5); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--ac) 80%, transparent); text-decoration-thickness: ${px(4)}px; }
      .ag-logo-wrap { display: flex; flex-direction: column; align-items: center; gap: ${px(16)}px; }
      .ag-logos { position: relative; display: flex; align-items: center; justify-content: center; gap: ${px(tall ? 70 : 90)}px; padding: ${px(10)}px ${px(30)}px; }
      .ag-lg { display: block; will-change: transform, filter; }
      .ag-lg img { display: block; object-fit: contain; will-change: transform, filter, opacity; }
      .ag-logos.hero .ag-lg img { width: ${Math.round(W * (tall ? 0.3 : 0.17))}px; height: ${Math.round(H * (tall ? 0.13 : 0.2))}px; }
      .ag-logos.n1.struck .ag-lg img { width: ${Math.round(W * (tall ? 0.3 : 0.17))}px; height: ${Math.round(W * (tall ? 0.3 : 0.17))}px; }
      .ag-logos.n2 .ag-lg img { width: ${Math.round(W * (tall ? 0.27 : 0.15))}px; height: ${Math.round(W * (tall ? 0.27 : 0.15))}px; }
      .ag-logos.n3 .ag-lg img { width: ${Math.round(W * (tall ? 0.26 : 0.14))}px; height: ${Math.round(W * (tall ? 0.26 : 0.14))}px; }
      .ag-logos.n2, .ag-logos.n3 { gap: ${px(tall ? 60 : 80)}px; padding: 0; }
      .ag-lg img { filter: drop-shadow(0 ${px(10)}px ${px(26)}px rgba(0,0,0,.28)); }
      .ag-lg { position: relative; }
      .ag-x { position: absolute; inset: -4%; width: 108%; height: 108%; overflow: visible; pointer-events: none; filter: drop-shadow(0 ${px(10)}px ${px(22)}px rgba(0,0,0,.4)); visibility: hidden; opacity: 0; will-change: transform, opacity; }
      /* The X is always red: it means "no", whatever the brand colour is. */
      .ag-x path { fill: none; stroke: #E5261F; stroke-width: 12; stroke-linecap: round; }
      .ag-mark { font-family: "Inter", system-ui, sans-serif; font-weight: 800; font-size: ${px(tall ? 84 : 72)}px; line-height: 1; letter-spacing: 0.16em; margin-right: -0.16em; text-transform: uppercase; color: #F5EFE8; text-shadow: 0 0 ${px(30)}px rgba(255,236,220,.35), 0 ${px(6)}px ${px(26)}px rgba(0,0,0,.45); will-change: letter-spacing, filter; }
      .ag-ml { display: inline-block; will-change: transform, opacity, filter; }
      .ag-slide { width: ${tall ? 86 : 52}%; padding: ${px(10)}px; border-radius: ${px(30)}px; overflow: hidden; background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); will-change: transform, opacity, filter; }
      .ag-slide img { display: block; width: 100%; max-height: ${Math.round(H * (tall ? 0.34 : 0.62))}px; object-fit: contain; border-radius: ${px(22)}px; transform-origin: 50% 40%; }
      .ag-bigcheck { display: flex; flex-direction: column; align-items: center; gap: ${px(14)}px; }
      .ag-bc { width: ${px(tall ? 260 : 210)}px; height: ${px(tall ? 260 : 210)}px; overflow: visible; filter: drop-shadow(0 0 ${px(14)}px color-mix(in srgb, var(--ac) 55%, transparent)); will-change: transform; }
      .ag-bc-ring { fill: rgba(28,22,19,.55); stroke: var(--ac); stroke-width: 4; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .ag-bc-tick { fill: none; stroke: #F5EFE8; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .ag-bc-word { font-weight: 800; font-size: ${px(60)}px; letter-spacing: -0.03em; color: #F5EFE8; text-shadow: 0 0 ${px(30)}px rgba(255,236,220,.3), 0 ${px(4)}px ${px(24)}px rgba(0,0,0,.5); }
      .ag-proof { display: flex; align-items: flex-start; gap: ${px(18)}px; width: ${tall ? 76 : 42}%; box-sizing: border-box; padding: ${px(22)}px ${px(26)}px; border-radius: ${px(28)}px; background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); will-change: transform, opacity, filter; }
      .ag-pf-av { flex: none; display: grid; place-items: center; width: ${px(60)}px; height: ${px(60)}px; border-radius: 50%; background: var(--ac); color: #1C1310; font-weight: 800; font-size: ${px(28)}px; }
      .ag-pf-body { min-width: 0; }
      .ag-pf-head { display: flex; align-items: baseline; gap: ${px(14)}px; margin-bottom: ${px(6)}px; }
      .ag-pf-head b { font-weight: 700; font-size: ${px(30)}px; color: #F5EFE8; }
      .ag-pf-head span { font-family: "SF Mono", Menlo, monospace; font-weight: 500; font-size: ${px(18)}px; letter-spacing: .16em; text-transform: uppercase; color: var(--ac); }
      .ag-proof p { margin: 0; font-weight: 500; font-size: ${px(30)}px; line-height: 1.32; color: rgba(245,239,232,.9); }
      .ag-orb { display: grid; place-items: center; width: ${px(170)}px; height: ${px(170)}px; border-radius: 50%; color: var(--ac); background: linear-gradient(180deg, rgba(50,40,35,.8), rgba(28,22,19,.84)); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 36%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 14%, transparent), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.35); }`;

  const script = `
        // ---- motion graphics (motion/render.js) ----
        (function () {
          var CUES = ${JSON.stringify(cues).replace(/</g, "\\u003c")};
          var hideCaps = { list: 1, compare: 1, stat: 1, cta: 1, "lower-third": 1 };
          // Keep every graphic off the face: measure it, then put it in the free space above or below the face
          // (lists and the CTA prefer below), shrinking it to fit when there isn't room. Static, so seek-safe.
          var FH = ${H};
          function place(c) {
            var el = document.getElementById(c.id);
            var inner = el && el.firstElementChild;
            if (!inner || !c.face) return;
            inner.style.zoom = 1;
            var h = inner.offsetHeight;
            if (!h) return;
            var pad = 0.025 * FH;
            var above = { a: 0.035 * FH, b: c.face.top * FH - pad };
            var below = { a: c.face.bottom * FH + pad, b: 0.77 * FH };
            var low = c.look === "list" || c.look === "cta" || c.low;
            var order = low ? [below, above] : [above, below];
            var zone = order.filter(function (z) { return z.b - z.a >= h * 0.7; })[0] || (above.b - above.a >= below.b - below.a ? above : below);
            var room = Math.max(0, zone.b - zone.a);
            var k = Math.max(0.45, Math.min(1, room / h));
            inner.style.zoom = k;
            var y = zone === below && low ? zone.b - h * k : c.look === "logo" && zone === above ? zone.a : zone.a + Math.max(0, room - h * k) / 2;
            el.style.top = Math.round(y) + "px";
            el.style.bottom = "auto";
            el.style.height = "auto";
            el.style.alignItems = "flex-start";
          }
          ${captionPlacement(doc, graphics, tall)}
          CUES.forEach(place);
          placeCaptions();
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { CUES.forEach(place); placeCaptions(); });
          function fmt(n, s) {
            var v = s.decimals ? n.toFixed(s.decimals) : String(Math.round(n));
            if (s.commas) v = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
            return s.pre + v + s.post;
          }
          // Template library timelines (motion/templates/), with the shared float-in and drift helpers.
          ${FLOAT_IN}
          var TPL = {${[...usedTemplates].map((tid) => `${JSON.stringify(tid)}: function (c, el, t0, t1, len, out) {${soften(TEMPLATES[tid].script)}\n          }`).join(",\n")}};
          CUES.forEach(function (c) {
            var el = "#" + c.id, t0 = c.t0, t1 = c.t1, len = Math.max(0.6, t1 - t0);
            var out = Math.max(t0 + 0.5, t1 - 0.32);
            tl.set(el, { autoAlpha: 1 }, t0);
            tl.set(el, { autoAlpha: 0 }, t1);
            if (c.full) {
              // The scene: its ground and content come in together with the scene's transition (the Remotion
              // TransitionSeries: fade, slide from the bottom, wipe, a circle reveal; or the Jeremy demo's glitch).
              var bd = el + "-bd", both = [bd, el], s0 = Math.max(0, t0 - 0.12);
              tl.set(bd, { autoAlpha: 0 }, Math.max(0, t0 - 0.2));
              if (c.tr === "fade" || !c.tr) tl.fromTo(bd, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, s0);
              else {
                tl.set(bd, { autoAlpha: 1 }, s0);
                if (c.tr === "slide") tl.fromTo(both, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "expo.out", immediateRender: false }, s0);
                else if (c.tr === "wipe") tl.fromTo(both, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "expo.out", immediateRender: false }, s0);
                else if (c.tr === "circle") tl.fromTo(both, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(150% at 50% 50%)", duration: 0.7, ease: "expo.out", immediateRender: false }, s0);
                else if (c.tr === "glitch") {
                  var gx = [0, 42, -30, 18, -8, 0], gf = ["none", "hue-rotate(40deg) contrast(1.6)", "brightness(1.8) saturate(0)", "hue-rotate(-30deg) contrast(1.4)", "brightness(1.2)", "none"];
                  for (var gi = 0; gi < gx.length; gi++) tl.set(both, { x: gx[gi], filter: gf[gi] }, s0 + gi * 0.045);
                } else if (c.tr === "dive") {
                  // Through the screen (the laptop-dive reels, motion/references/reel-study.md): the footage smears and
                  // brightens for a beat, then the scene rushes back from too close with an RGB split and blur.
                  var rgbOn = "blur(16px) drop-shadow(18px 0px 0px rgba(255,0,70,0.7)) drop-shadow(-18px 0px 0px rgba(0,225,255,0.7))", rgbOff = "blur(0px) drop-shadow(0px 0px 0px rgba(255,0,70,0)) drop-shadow(0px 0px 0px rgba(0,225,255,0))";
                  if (document.getElementById("video-punch")) {
                    tl.fromTo("#video-punch", { filter: "blur(0px) brightness(1)" }, { filter: "blur(10px) brightness(1.35)", duration: 0.14, ease: "power2.in", immediateRender: false }, Math.max(0, s0 - 0.14));
                    tl.set("#video-punch", { filter: "none" }, s0 + 0.4);
                  }
                  tl.fromTo(bd, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "power1.out", immediateRender: false }, s0);
                  tl.fromTo(both, { scale: 1.45, filter: rgbOn }, { scale: 1, filter: rgbOff, duration: 0.6, ease: "expo.out", immediateRender: false }, s0);
                  tl.set(both, { filter: "none" }, s0 + 0.62);
                } else if (c.tr === "blur") {
                  // The master edit's soft crossfade into a big moment: the footage blurs and brightens, and the scene
                  // comes up out of the blur as it settles.
                  if (document.getElementById("video-punch")) {
                    tl.fromTo("#video-punch", { filter: "blur(0px) brightness(1)" }, { filter: "blur(14px) brightness(1.15)", duration: 0.3, ease: "power2.in", immediateRender: false }, Math.max(0, s0 - 0.3));
                    tl.set("#video-punch", { filter: "none" }, s0 + 0.55);
                  }
                  // The ground arrives with the scene (no dark beat between the speaker and a light scene).
                  tl.set(bd, { autoAlpha: 0 }, s0);
                  tl.fromTo(bd, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, t0 + 0.05);
                  tl.fromTo(both, { scale: 1.04, filter: "blur(20px) brightness(1.15)" }, { scale: 1, filter: "blur(0px) brightness(1)", duration: 0.55, ease: "power2.out", immediateRender: false }, s0);
                  tl.set(both, { filter: "none" }, s0 + 0.57);
                }
              }
              tl.fromTo(el + "-gr", { x: 0, y: 0 }, { x: 37, y: -53, duration: len + 0.3, ease: "steps(" + Math.max(4, Math.round((len + 0.3) * 12)) + ")", immediateRender: false }, s0);
              (c.motes || []).forEach(function (m, k) {
                var mote = el + "-e" + k;
                tl.fromTo(mote, { y: 0 }, { y: -m[0] * (len + 0.4), duration: len + 0.4, ease: "none", immediateRender: false }, s0);
                tl.fromTo(mote, { opacity: 0.2 }, { opacity: 0.55, duration: 0.6 + m[1] * 0.8, yoyo: true, repeat: Math.max(1, Math.floor(len / 0.8)), ease: "sine.inOut", immediateRender: false }, s0 + m[1] * 0.5);
              });
              tl.fromTo(bd, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, t1 - 0.3);
            }
            // A full-screen scene, and a graphic that speaks in the captions' place (the master edit's name title and
            // numbers), take the captions off while they're up.
            if (c.full || c.hideCap) {
              tl.set(".cap", { autoAlpha: 0 }, t0);
              tl.set(".cap", { autoAlpha: 1 }, t1);
            }
            var box = el + " > *";
            CUR_T0 = t0;
            if (TPL[c.look]) {
              TPL[c.look](c, el, t0, t1, len, out);
            } else if (c.look === "headline" || c.look === "icon") {
              // Words blur in one after another; the key word is simply in the accent. A slow push while it's up.
              var ws = []; for (var i = 0; i < c.items; i++) ws.push(el + "-w" + i);
              if (c.look === "icon") blurIn(el + "-orb", t0, { y: 16, s: 0.9, b: 14 });
              if (ws.length) blurIn(ws.join(","), t0 + (c.look === "icon" ? 0.2 : 0), { y: 22, b: 16, d: 0.6, st: Math.min(0.09, 0.6 / ws.length) });
              blurIn(el + " .ag-sub", t0 + 0.4, { y: 12, b: 8 });
              tl.fromTo(box, { scale: 1 }, { scale: 1.025, duration: len, ease: "none", immediateRender: false }, t0);
            } else if (c.look === "stat" && document.querySelector(el + " .v-studio")) {
              // Studio: the number spins up half-clear in a motion blur and lands sharp; then its line, word by word.
              var landS = t0 + 0.1 + c.count;
              tl.fromTo(el + "-num", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out", immediateRender: false }, t0);
              if (c.stat) {
                var ss = c.stat, objS = { v: 0 }, numS = document.querySelector(el + "-num");
                tl.fromTo(objS, { v: 0 }, { v: ss.value, duration: c.count, ease: "power2.out", immediateRender: false, onUpdate: function () { numS.textContent = fmt(objS.v, ss); } }, t0 + 0.1);
                tl.fromTo(el + "-num", { filter: "blur(7px)", opacity: 0.7 }, { filter: "blur(0px)", opacity: 1, duration: c.count, ease: "power3.in", immediateRender: false }, t0 + 0.1);
              }
              for (var sw = 0; sw < c.items; sw++) blurIn(el + "-sw" + sw, landS + 0.05 + sw * 0.16, { y: 10, b: 8, d: 0.35 });
              tl.fromTo(box, { scale: 1 }, { scale: 1.02, duration: Math.max(0.3, out - landS), ease: "none", immediateRender: false }, landS);
            } else if (c.look === "stat") {
              // Blurs in, counts up (counter sound), lands with a soft glow (cha-ching). No punch.
              blurIn(box, t0, { y: 24, s: 0.96, b: 18, d: 0.7 });
              var land = t0 + 0.1 + c.count;
              if (c.stat) {
                var s = c.stat, obj = { v: 0 }, num = document.querySelector(el + "-num");
                tl.fromTo(obj, { v: 0 }, { v: s.value, duration: c.count, ease: "power2.out", immediateRender: false, onUpdate: function () { num.textContent = fmt(obj.v, s); } }, t0 + 0.1);
              }
              tl.fromTo(el + "-num", { filter: "brightness(1)" }, { filter: "brightness(1.25)", duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, land);
              tl.fromTo(box, { scale: 1 }, { scale: 1.02, duration: Math.max(0.3, out - land), ease: "none", immediateRender: false }, land);
            } else if (c.look === "list") {
              // The task card: one glass card, a mono kicker, every item waiting dim with an empty circle; each ticks
              // green and brightens as it's said (one tick sound each, ads/build.js).
              tl.fromTo(el + "-scrim", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out", immediateRender: false }, t0 - 0.1);
              tl.fromTo(el + "-scrim", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut", immediateRender: false }, out - 0.05);
              blurIn(el + "-card", t0, { y: 40, b: 16, d: 0.75 });
              for (var k = 0; k < c.items; k++) {
                var at = t0 + c.times[k];
                tl.fromTo(el + "-c" + k + " circle:not(.rim)", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, at);
                tl.fromTo(el + "-c" + k + " path", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.22, ease: "power2.out", immediateRender: false }, at + 0.22);
                tl.fromTo(el + "-t" + k, { opacity: 0.42 }, { opacity: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, at + 0.1);
              }
            } else if (c.look === "compare") {
              blurIn(box, t0, { y: 30, b: 16, d: 0.75 });
              var gap = Math.min(1.2, Math.max(0.35, (len - 1.2) / Math.max(1, c.items)));
              for (var k = 0; k < c.items; k++) {
                tl.fromTo(el + "-i" + k, { autoAlpha: 0, x: -40, filter: "blur(6px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.55, ease: "expo.out", immediateRender: false }, t0 + 0.3 + k * gap);
                tl.fromTo(el + "-i" + k + " .ag-tick", { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.4)", immediateRender: false }, t0 + 0.4 + k * gap);
              }
            } else if (c.look === "logo") {
              var lg = []; for (var q = 0; q < c.items; q++) lg.push(q);
              if (c.strike) {
                // Logos glide in one after another, then two fat bars slash across them and the row takes the hit.
                lg.forEach(function (q) {
                  tl.fromTo(el + "-l" + q, { autoAlpha: 0, scale: 0.55, y: 40, rotation: q % 2 ? 12 : -12, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", immediateRender: false }, t0 + q * 0.14);
                  tl.fromTo(el + "-g" + q, { y: 0 }, { y: q % 2 ? 8 : -8, duration: Math.max(0.5, len - 0.6), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
                });
                var hit = Math.min(t0 + 0.55 + (c.items - 1) * 0.14, Math.max(t0 + 0.35, out - 0.6));
                lg.forEach(function (q) {
                  var at = hit + q * 0.14;
                  // The X slams down onto each logo: in from big with a twist, a bounce, and the logo gives under it.
                  tl.fromTo(el + "-x" + q, { autoAlpha: 0, scale: 1.35, rotation: -8, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, rotation: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out", immediateRender: false }, at);
                  tl.fromTo(el + "-l" + q, { scale: 1, opacity: 1 }, { scale: 0.9, opacity: 0.7, duration: 0.16, ease: "power2.out", immediateRender: false }, at + 0.08);
                });
              } else {
                // The hero: flies up from the speaker's chest with motion blur, lands with an overshoot, glows and floats.
                tl.fromTo(el + "-l0", { autoAlpha: 0, y: ${Math.round(H * 0.08)}, scale: 0.92, filter: "blur(24px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.85, ease: "power3.out", immediateRender: false }, t0);
                tl.fromTo(el + "-g0", { filter: "drop-shadow(0px 0px 0px rgba(244,147,15,0))" }, { filter: "drop-shadow(0px 0px 46px rgba(244,147,15,0.75))", duration: 0.5, ease: "power2.out", immediateRender: false }, t0 + 0.3);
                tl.fromTo(el + "-g0", { y: 0 }, { y: -8, duration: Math.max(0.4, len - 0.8), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
                if (c.mark) {
                  // The name: letters zoom down into place one by one, flash with a glow, then the tracking slowly opens up.
                  for (var m = 0; m < c.mark; m++) tl.fromTo(el + "-m" + m, { autoAlpha: 0, filter: "blur(14px)" }, { autoAlpha: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out", immediateRender: false }, t0 + 0.35 + m * 0.05);
                  tl.fromTo(el + "-mark", { letterSpacing: "0.3em" }, { letterSpacing: "0.16em", duration: 1.1, ease: "power3.out", immediateRender: false }, t0 + 0.35);
                }
              }
              tl.fromTo(el + " .ag-logo-wrap", { scale: 1 }, { scale: 0.88, duration: 0.35, ease: "power2.in", immediateRender: false }, out - 0.05);
            } else if (c.look === "slide") {
              blurIn(el + "-card", t0, { y: 40, s: 0.96, b: 16, d: 0.8 });
              tl.fromTo(el + "-img", { scale: 1 }, { scale: 1.08, duration: Math.max(0.5, len - 0.7), ease: "sine.inOut", immediateRender: false }, t0 + 0.4);
              tl.fromTo(el + "-card", { y: 0 }, { y: -8, duration: Math.max(0.5, len - 0.8), ease: "sine.inOut", immediateRender: false }, t0 + 0.7);
            } else if (c.look === "check") {
              // Circle pops and draws, the check strokes in, a punch on the landing, then it breathes.
              blurIn(el + "-bc", t0, { y: 0, s: 0.9, b: 12, d: 0.6 });
              tl.fromTo(el + "-ring", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t0 + 0.05);
              tl.fromTo(el + "-tick", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.28, ease: "power3.out", immediateRender: false }, t0 + 0.4);
              tl.fromTo(el + "-bc", { filter: "brightness(1)" }, { filter: "brightness(1.3)", duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, t0 + 0.66);
              blurIn(el + "-word", t0 + 0.55, { y: 14, b: 10 });
              tl.fromTo(el + "-bc", { y: 0 }, { y: -8, duration: Math.max(0.3, len - 1.1), ease: "sine.inOut", immediateRender: false }, t0 + 0.9);
            } else if (c.look === "proof") {
              blurIn(el + "-card", t0, { y: 24, x: 30, b: 14, d: 0.7 });
              tl.fromTo(el + "-card", { y: 0 }, { y: -8, duration: Math.max(0.4, len - 0.9), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
            } else if (c.look === "lower-third") {
              tl.fromTo(el + "-bar", { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, t0);
              tl.fromTo(el + "-body", { clipPath: "inset(0 100% 0 0 round ${px(20)}px)", x: -30 }, { clipPath: "inset(0 0% 0 0 round ${px(20)}px)", x: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, t0 + 0.15);
            } else if (c.look === "callout") {
              blurIn(box, t0, { y: 18, s: 0.95, b: 12 });
              tl.fromTo(box, { y: 0 }, { y: -6, duration: Math.max(0.3, len - 0.8), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
            } else if (c.look === "cta") {
              // Button pops, the cursor glides onto it, clicks (press + ripple), then the button breathes.
              blurIn(el + "-sub", t0, { y: 10, b: 8 });
              blurIn(el + "-btn", t0 + 0.05, { y: 26, s: 0.94, b: 14, d: 0.7 });
              var click = t0 + ${CTA_CLICK};
              tl.fromTo(el + "-cur", { autoAlpha: 0, x: ${px(260)}, y: ${px(240)} }, { autoAlpha: 1, x: 0, y: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, click - 0.6);
              tl.fromTo(el + "-cur", { scale: 1 }, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click);
              tl.fromTo(el + "-btn", { scale: 1 }, { scale: 0.93, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click);
              tl.fromTo(el + "-rip", { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 2.6, duration: 0.5, ease: "power2.out", immediateRender: false }, click);
              if (out - click > 1.2) tl.fromTo(el + "-btn", { scale: 1 }, { scale: 1.025, duration: 0.9, yoyo: true, repeat: Math.max(1, Math.floor((out - click - 0.6) / 0.9)), ease: "sine.inOut", immediateRender: false }, click + 0.4);
            }
            tl.fromTo(el, { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: c.pos === "bottom" ? 16 : -14, filter: "blur(10px)", duration: 0.42, ease: "power2.in", immediateRender: false }, out - 0.08);
          });
        })();
`;

  const tplCss = [...usedTemplates].map((tid) => TEMPLATES[tid].css({ px, W, H, tall })).join("\n");
  out = out.replace("</style>", `${css}\n${KIT_CSS({ px, tall })}\n${tplCss}\n    </style>`);
  const close = out.lastIndexOf("</div>\n    <script>");
  if (close < 0) throw new Error("Unexpected composition layout");
  out = `${out.slice(0, close)}${blocks.join("\n      ")}\n      ${audio.join("\n      ")}\n    ${out.slice(close)}`;
  if (cues.length) {
    const hook = out.lastIndexOf("window.__timelines = window.__timelines || {};");
    if (hook < 0) throw new Error("Unexpected composition script");
    out = `${out.slice(0, hook)}${soften(script)}\n        ${out.slice(hook)}`;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Framing, modeled on the creator's reference ad and their notes ("attention is everything, above all in the first
// 5–10 seconds"). The crop follows the face and snaps to it at every cut. The shot jumps wide and tight at cuts and
// sentence breaks (faster in the hook), zooming from a point low in the frame so the speaker sits high. Intentional
// camera moves from the plan (the Camera track) punch in, push in slowly or pull out on the lines that matter, and
// the shot opens up under graphics so they have room.

const WIDE = 1.2;
const TIGHT = 1.38;
const PUNCH = 1.55;
export const OPEN = 1.08; // under a graphic: a little wider, so it has the headroom
export const ANCHOR = 0.88; // zoom origin, as a share of the frame height
const HOOK = 6; // seconds that get the faster rhythm

const FRAME_MOVES = ["punch", "push", "pull"];
/** Camera moves (reframes) and cut hits, as the planners and the timeline's camera track use them. */
export const CAMERA_MOVES = [...FRAME_MOVES, "shake", "zoom-blur", "whip", "flash", "bw", "rgb", "blur"];
const cameraClips = (doc) => kind(doc, "camera").filter((c) => FRAME_MOVES.includes(c.move || "punch"));
const hitClips = (doc) => kind(doc, "camera").filter((c) => !FRAME_MOVES.includes(c.move || "punch"));

/** Where the top of the head (hair included) sits: the face band is the face box, eyebrows to chin, and the skull rises about half a face above it. */
export const headTop = (f) => f.top - 0.55 * (f.bottom - f.top);

/**
 * Where face band f sits on screen between t0 and t1 under a framing program: at the most zoomed-in step meanwhile, so
 * a punch-in halfway through a graphic or a caption can't grow the face into it. `rest` is the scale with no program.
 */
export function faceOnScreen(f, program, t0, t1 = t0, rest = 1) {
  let s = 0, o = ANCHOR;
  program.forEach((p, i) => {
    const next = program[i + 1]?.t ?? Infinity;
    if (p.t > t1 + 0.01 || next <= t0 + 0.01) return;
    const z = Math.max(p.scale, p.to ?? 0);
    if (z >= s) [s, o] = [z, p.oy ?? ANCHOR];
  });
  if (!s) s = rest;
  return { top: r3(o - (o - f.top) * s), bottom: r3(o - (o - f.bottom) * s) };
}

/**
 * What a graphic keeps clear of while it's up (the creator, 2026-10-29: never on the face): the whole head, hair to
 * chin, as far as it reaches in the graphic's own face band and in every shot under it. Keeping clear of the face band
 * alone put cards on the speaker's hair and forehead whenever they went above it.
 */
export function headBand(face, shots, t0, t1) {
  const bands = [face, ...shots.filter((v) => v.face && v.start < t1 && v.start + v.duration > t0).map((v) => v.face)].filter(Boolean);
  return { top: r3(Math.min(...bands.map(headTop))), bottom: Math.max(...bands.map((f) => f.bottom)) };
}

/** Where an ad's caption sits by default: the middle of the frame, a bit down (the creator, 2026-10-29). */
export const AD_CAPTION_LINE = 0.6;
/**
 * The band a caption stays inside (0–1 of the frame height). On 9:16 the top and bottom 14% sit under the app's own UI
 * (lib/facezone.js REEL_SAFE: the name, the post's caption), so a caption never goes past them.
 */
export const captionSafe = (tall) => (tall ? { top: REEL_SAFE.top / 100, bottom: REEL_SAFE.bottom / 100 } : { top: 0.05, bottom: 0.93 });

/**
 * Where a caption goes, as the px height of its centre (the creator, 2026-10-29): the middle of the frame a bit down
 * (o.line); when a graphic is up there, the bottom or the top instead, so the two never clash; and never over a face,
 * which comes before everything else. Plain ES5 that uses nothing outside itself: the composition script carries it
 * as written (captionPlacement) and the reviewer (ads/review.js) runs the very same rule.
 * @param o  { line (0–1), h (caption height, px), FH (frame height, px), safeT, safeB (0–1), faces, boxes: [{ a, b }] px }
 */
export function pickCaptionY(o) {
  var h = o.h, FH = o.FH;
  var clear = function (y, bands) { return !bands.some(function (b) { return y + h / 2 > b.a && y - h / 2 < b.b; }); };
  var inside = function (y) { return y - h / 2 >= o.safeT * FH - 0.5 && y + h / 2 <= o.safeB * FH + 0.5; };
  var line = o.line * FH, bottom = o.safeB * FH - h / 2, top = o.safeT * FH + h / 2;
  var tries = [line];
  // Something happening in the middle: straight to the bottom, or the top.
  if (!clear(line, o.boxes)) tries.push(bottom, top);
  // A face there: the nearest clear height, lower first.
  for (var dy = 0.02 * FH; dy < FH; dy += 0.02 * FH) tries.push(line + dy, line - dy);
  tries.push(bottom, top);
  var all = o.faces.concat(o.boxes);
  var pick = tries.filter(function (y) { return inside(y) && clear(y, all); })[0];
  // No room clear of both: the face wins over the graphic.
  if (pick == null) pick = tries.filter(function (y) { return inside(y) && clear(y, o.faces); })[0];
  return pick == null ? bottom : pick;
}

/**
 * The most a shot with face band f can zoom from origin oy (share of the frame height) and keep the whole head and
 * the chin in frame. Capping on the face box alone cut the creator's speakers off at the forehead (2026-10-28).
 */
function zoomCap(f, oy = ANCHOR) {
  if (!f) return PUNCH;
  const head = headTop(f);
  // A pivot on the top edge holds the top of the frame still, so nothing more leaves there.
  const top = oy > 0.001 && oy - head > 0.01 ? (oy - 0.03) / (oy - head) : PUNCH;
  const bottom = f.bottom > oy + 0.01 ? (0.97 - oy) / (f.bottom - oy) : PUNCH;
  return Math.max(1, Math.min(PUNCH, top, bottom));
}

/** The most the shot can zoom at time t and keep the whole head in frame (zooming from ANCHOR). */
function faceCapper(video) {
  return (t) => zoomCap((video.find((v) => t >= v.start - 0.01 && t < v.start + v.duration) || video.at(-1))?.face);
}

/**
 * The talking-head style's (framing "key") zoom origin for a shot: ANCHOR, as it always was, unless popping in to
 * TIGHT from there would cut the top of the head off. Then it rises just enough to keep the head 3% inside the frame,
 * which for a speaker framed high is just under the head, as in the cinematic framing. Zooming from ANCHOR, a speaker
 * whose forehead sits at 18% of the frame couldn't zoom at all (2026-10-28) and the pop-ins vanished.
 */
function keyOrigin(clip) {
  const f = clip?.face;
  if (!f) return ANCHOR;
  const head = headTop(f);
  if (head <= 0.03) return r3(Math.max(0, head - 0.02));
  return r3(Math.min(ANCHOR, (head * TIGHT - 0.03) / (TIGHT - 1)));
}

// Cinematic framing (design.framing "cinematic", the Premium style; the creator's reference reels of 2026-10-28,
// motion/references/reel-study.md 11 + 12): every shot opens wide and drifts slowly in, the Camera track's punch-ins
// ease in and back out, and nothing else moves. Zooms pivot just above the head, so the head stays where it is and
// the shot tightens toward the face instead of cropping the top of the head off.
const C_DRIFT = 1.05; // where a shot's slow push ends up
const C_PUNCH = 1.22; // a planned punch-in
const C_PUSH = 1.14; // a planned slow push
const C_IN = 0.5; // seconds to ease into a punch
const C_OUT = 0.7; // seconds to ease back out

/** The zoom origin for a shot (share of the frame height): just above the top of the head. */
function cinematicOrigin(clip) {
  const f = clip?.face;
  if (!f) return ANCHOR;
  return r3(Math.min(0.6, Math.max(0, headTop(f) - 0.02)));
}

/**
 * A move whose line starts in the last moments of a shot (Claude anchors it on the first word, often said right at a
 * cut) starts on the cut instead, in the next shot, rather than being lost between the two.
 */
const snapToCuts = (video, moves) =>
  moves.map((m) => {
    const next = video.find((v) => v.start > m.start && v.start - m.start < 0.3);
    return next ? { ...m, start: next.start, duration: Math.max(0.5, m.start + m.duration - next.start) } : m;
  });

function cinematicProgram(video, moves) {
  const program = [];
  moves = snapToCuts(video, moves);
  for (const c of video) {
    const oy = cinematicOrigin(c);
    const f = c.face;
    // Zooming from oy keeps the head; only the chin can leave the frame, at the bottom.
    const cap = (s) => r3(f ? Math.max(1, Math.min(s, (0.97 - oy) / Math.max(0.01, f.bottom - oy))) : s);
    const t0 = c.start;
    const t1 = c.start + c.duration;
    const driftTo = cap(C_DRIFT);
    const drift = (t) => r3(1 + (driftTo - 1) * Math.min(1, Math.max(0, (t - t0) / c.duration)));
    let t = t0;
    const glide = (until) => {
      if (until - t > 0.05) program.push({ t: r3(t), scale: drift(t), to: drift(until), dur: r3(until - t), oy, ease: "drift" });
      t = until;
    };
    for (const m of moves.filter((x) => x.start >= t0 - 0.01 && x.start < t1 - 0.3).sort((a, b) => a.start - b.start)) {
      if (m.start < t) continue; // overlaps the last one
      const end = Math.min(m.start + m.duration, t1 - 0.05);
      glide(m.start);
      const from = drift(t);
      if (m.move === "pull") {
        program.push({ t: r3(t), scale: from, to: 1, dur: r3(Math.max(0.3, end - t)), oy });
        t = end;
        continue;
      }
      const peak = m.move === "push" ? cap(C_PUSH) : cap(C_PUNCH);
      const into = m.move === "push" ? Math.max(0.3, end - t) : Math.min(C_IN, Math.max(0.2, end - t));
      program.push({ t: r3(t), scale: from, to: peak, dur: r3(into), oy, ease: m.move === "push" ? "glide" : "in" });
      const back = Math.min(C_OUT, t1 - end);
      if (back > 0.1) {
        program.push({ t: r3(end), scale: peak, to: drift(end + back), dur: r3(back), oy, ease: "out" });
        t = end + back;
      } else t = t1;
    }
    glide(t1);
    if (!program.length || program.at(-1).t < t0) program.push({ t: r3(t0), scale: 1, oy });
  }
  if (!program.length || program[0].t > 0.01) program.unshift({ t: 0, scale: 1, oy: cinematicOrigin(video[0]) });
  return program;
}

export function framingProgram(doc, graphics = graphicClips(doc)) {
  const video = doc.tracks.filter((t) => t.kind === "video" && !t.hidden).flatMap((t) => t.clips).sort((a, b) => a.start - b.start);
  if (!video.length) return [];
  const D = Math.max(...video.map((c) => c.start + c.duration));
  let moves = cameraClips(doc);
  if (doc.design?.framing === "cinematic") return withOpening(cinematicProgram(video, moves), video);
  const words = doc.tracks
    .filter((t) => t.kind === "caption")
    .flatMap((t) => t.clips)
    .flatMap((c) => c.words.map((w) => ({ text: w.text, s: c.start + w.s })))
    .sort((a, b) => a.s - b.s);
  // Where a new shot may start: every cut, and the first word after a sentence or clause ends (in the hook, any
  // word boundary a second or more along).
  const beats = new Set(video.map((c) => r3(c.start)));
  words.forEach((w, i) => {
    if (i === 0) return;
    if (/[.,?!;:]$/.test(String(words[i - 1].text)) || w.s < HOOK) beats.add(r3(Math.max(0, w.s - 0.04)));
  });
  // Talking head (design.framing "key"): no rhythm. The shot holds wide and pops in only where the Camera track
  // punches in, on the lines where something important is said, then pops back out.
  const key = doc.design?.framing === "key";
  if (key) moves = snapToCuts(video, moves); // so the pop-in eases in on the new shot instead of under the cut
  const sorted = key ? [] : [...beats].filter((t) => t < D - 0.8).sort((a, b) => a - b);
  const covered = (t) => graphics.find((g) => t >= g.start - 0.05 && t < g.start + g.duration) || moves.find((m) => t >= m.start - 0.05 && t < m.start + m.duration);
  const program = [];
  let last = -Infinity;
  let tight = false;
  for (const t of sorted) {
    if (covered(t)) continue;
    const gap = t < HOOK ? 1.0 : 1.8;
    const cut = video.some((c) => Math.abs(c.start - t) < 0.01);
    if (!cut && t - last < gap) continue;
    if (t - last < 0.8) continue;
    program.push({ t, scale: tight ? TIGHT : WIDE });
    tight = !tight;
    last = t;
  }
  // Camera moves and graphics take over their stretch, then the rhythm picks back up.
  const resume = (end) => end < D - 0.5 && !program.some((p) => Math.abs(p.t - end) < 0.3) && program.push({ t: r3(end), scale: WIDE });
  for (const m of moves) {
    if (m.move === "push") program.push({ t: r3(m.start), scale: WIDE, to: PUNCH - 0.08, dur: r3(m.duration) });
    else program.push({ t: r3(m.start), scale: m.move === "pull" ? 1.0 : key ? TIGHT : PUNCH });
    resume(m.start + m.duration);
  }
  for (const g of graphics) {
    program.push({ t: r3(Math.max(0, g.start - 0.02)), scale: OPEN });
    resume(g.start + g.duration);
  }
  program.sort((a, b) => a.t - b.t);
  if (!program.length || program[0].t > 0.01) program.unshift({ t: 0, scale: WIDE });
  // Never zoom the face out of frame: zooming from origin o moves a point at y to o - (o - y)·s, so each scale is
  // capped by where the face reaches in that piece (with a little margin above the head and below the chin).
  const clipAt = (t) => video.find((v) => t >= v.start - 0.01 && t < v.start + v.duration) || video.at(-1);
  if (key) {
    // Each shot zooms from its own origin (keyOrigin), set on its cut, where the picture changes anyway. A pop-in
    // that runs over the cut carries on into the next shot.
    const cuts = [];
    for (const c of video.slice(1)) {
      const t = r3(c.start);
      if (program.some((p) => Math.abs(p.t - t) < 0.01)) continue;
      const prev = program.findLast((p) => p.t < t);
      if (prev?.to && prev.t + prev.dur > t) continue; // mid-push: it finishes from where it started
      cuts.push({ t, scale: prev?.to ?? prev?.scale ?? WIDE, cut: true });
    }
    program.push(...cuts);
    program.sort((a, b) => a.t - b.t);
  }
  for (const p of program) {
    if (key) p.oy = keyOrigin(clipAt(p.t));
    const oy = p.oy ?? ANCHOR;
    p.scale = r3(Math.min(p.scale, zoomCap(clipAt(p.t)?.face, oy)));
    if (p.to) p.to = r3(Math.max(p.scale, Math.min(p.to, zoomCap(clipAt(p.t + p.dur - 0.01)?.face, oy))));
  }
  return withOpening(program, video);
}

// The opening zoom-out (the creator, 2026-10-28: "for both premium and basic, give me a zoomout at the beginning of
// all videos"): the first frame starts tight on the speaker and eases out to the shot's own framing. Every framing
// style gets it; whatever the style had planned for those first moments picks up from where it lands.
const OPEN_ZOOM = 1.3; // how much tighter the first frame is than the framing it eases out to
const OPEN_OUT = 0.85; // seconds to ease out

function withOpening(program, video) {
  if (!program.length || !video.length) return program;
  const D = Math.max(...video.map((c) => c.start + c.duration));
  const end = r3(Math.min(OPEN_OUT, D - 0.1));
  if (end < 0.3) return program;
  // The framing the program has at `end` (a step that's still moving is read along its way).
  let target = program[0].scale, oy = program[0].oy;
  for (const p of program) {
    if (p.t > end + 1e-6) break;
    if (p.oy != null) oy = p.oy;
    target = p.to && end < p.t + p.dur ? p.scale + (p.to - p.scale) * ((end - p.t) / p.dur) : p.to ?? p.scale;
  }
  // Zoomed from the style's own origin the head may leave the frame; then the opening zooms from just above the head
  // and glides the origin back to the style's on its way out, so it lands exactly on the style's framing.
  const base = oy ?? ANCHOR, above = cinematicOrigin(video[0]);
  const openOy = zoomCap(video[0].face, above) > zoomCap(video[0].face, base) + 0.02 ? above : base;
  const from = r3(Math.max(target, Math.min(target * OPEN_ZOOM, zoomCap(video[0].face, openOy))));
  if (from - target < 0.04) return program; // the face already fills the frame: nowhere to zoom out from
  const rest = [];
  for (const p of program) {
    if (p.t >= end - 1e-6) rest.push(p);
    else if (p.to && p.t + p.dur > end + 0.05) rest.push({ ...p, t: end, scale: r3(target), dur: r3(p.t + p.dur - end) });
  }
  const glide = openOy !== base ? { oy: openOy, oyTo: base } : oy != null ? { oy } : {};
  return [{ t: 0, scale: from, to: r3(target), dur: end, ...glide, ease: "open" }, ...rest];
}

/**
 * The caption-placement script (placeCaptions), for inside a composition script that defines CUES (the graphics'
 * cues) and FH (the frame height).
 * Captions (the creator, 2026-10-29): the middle of the frame a bit down (AD_CAPTION_LINE); to the bottom or the top
 * when a graphic is up there; never over a face, head included, which comes first (pickCaptionY). Never out of the
 * reel safe zone (captionSafe). Placed once per caption for its whole time on screen (static, so seek-safe). The face
 * band uses the most zoomed-in the shot gets meanwhile.
 */
function captionPlacement(doc, graphics, tall) {
  // Where the head sits on screen (hair to chin): each piece's face band and the framing's zoom steps.
  const capFaces = doc.tracks.filter((t) => t.kind === "video" && !t.hidden).flatMap((t) => t.clips).filter((v) => v.face).map((v) => [r3(v.start), r3(v.start + v.duration), r3(headTop(v.face)), v.face.bottom]);
  const capZoom = framingProgram(doc, graphics).map((p) => [p.t, p.scale, p.to ?? p.scale, p.dur ?? 0, p.oy ?? ANCHOR]);
  const safe = captionSafe(tall);
  return `var CAP_FACES = ${JSON.stringify(capFaces)}, CAP_ZOOM = ${JSON.stringify(capZoom)}, CAP_ANCHOR = ${ANCHOR}, CAP_LINE = ${AD_CAPTION_LINE};
          ${pickCaptionY.toString()}
          // The most zoomed-in the shot gets while a caption is up, and the origin it zooms from.
          function zoomIn(s, e) {
            var z = 1, o = CAP_ANCHOR;
            CAP_ZOOM.forEach(function (p, i) {
              var next = CAP_ZOOM[i + 1] ? CAP_ZOOM[i + 1][0] : Infinity;
              if (p[0] < e && next > s && Math.max(p[1], p[2]) >= z) { z = Math.max(p[1], p[2]); o = p[4]; }
            });
            return { z: z, o: o };
          }
          function placeCaptions() {
            var caps = document.querySelectorAll(".cap");
            if (!caps.length) return;
            var root = caps[0].parentElement, rr = root.getBoundingClientRect(), k = FH / (rr.height || FH), pad = 0.018 * FH;
            var boxes = CUES.filter(function (c) { return !c.full; }).map(function (c) {
              var el = document.getElementById(c.id), inner = el && el.firstElementChild;
              if (!inner) return null;
              var t1 = el.style.transform, t2 = inner.style.transform;
              el.style.transform = "none"; inner.style.transform = "none";
              // The whole graphic, including what it draws outside its box (sonar rings, glows, a cursor).
              var top = Infinity, bottom = -Infinity;
              [inner].concat([].slice.call(inner.children)).forEach(function (n) {
                var r = n.getBoundingClientRect();
                if (r.height && r.width) { top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom); }
              });
              el.style.transform = t1; inner.style.transform = t2;
              return bottom > top ? { t0: c.t0, t1: c.t1, a: (top - rr.top) * k, b: (bottom - rr.top) * k } : null;
            }).filter(Boolean);
            caps.forEach(function (cap) {
              var s = Number(cap.getAttribute("data-start")) || 0, e = s + (Number(cap.getAttribute("data-duration")) || 0);
              var inner = cap.firstElementChild, h = (inner && inner.offsetHeight) || 0.06 * FH;
              var faces = [], busy = [];
              var zo = zoomIn(s, e), z = zo.z, o = zo.o;
              CAP_FACES.forEach(function (f) {
                if (f[0] < e && f[1] > s) faces.push({ a: (o - (o - f[2]) * z) * FH - pad, b: (o - (o - f[3]) * z) * FH + pad });
              });
              boxes.forEach(function (g) {
                if (g.t0 < e && g.t1 > s) busy.push({ a: g.a - pad, b: g.b + pad });
              });
              cap.style.top = Math.round(pickCaptionY({ line: CAP_LINE, h: h, FH: FH, safeT: ${safe.top}, safeB: ${safe.bottom}, faces: faces, boxes: busy })) + "px";
            });
          }`;
}

/** Ads with no graphics or sounds still get their captions placed (on the chest line, off the face). */
function placeCaptionsOnly(html, doc) {
  const { width: W, height: H } = ASPECTS[normalizeDesign({ ...doc.design, aspect: doc.aspect }).aspect];
  const script = `
        // ---- captions (motion/render.js) ----
        (function () {
          var CUES = [], FH = ${H};
          ${captionPlacement(doc, [], H > W)}
          placeCaptions();
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCaptions);
        })();
`;
  const hook = html.lastIndexOf("window.__timelines = window.__timelines || {};");
  return hook < 0 ? html : `${html.slice(0, hook)}${script}\n        ${html.slice(hook)}`;
}

export function adFraming(html, doc, graphics) {
  if (!html.includes('id="video-punch"')) return html; // the framed (podcast) layout keeps its own moves
  html = snapCropAtCuts(html, doc);
  const program = framingProgram(doc, graphics);
  if (!program.length) return html;
  // Cut hits, drawn on the footage (#video-punch) between the framing's own scale steps.
  const video = doc.tracks.filter((t) => t.kind === "video" && !t.hidden).flatMap((t) => t.clips);
  const capFor = faceCapper(video);
  const scaleAt = (t) => [...program].reverse().find((p) => p.t <= t + 0.001)?.scale ?? WIDE;
  const hits = hitClips(doc).map((c) => {
    const s = scaleAt(c.start);
    return { move: c.move, t: r3(c.start), len: r3(c.duration), s, big: r3(Math.min(s * 1.22, Math.max(capFor(c.start) + 0.06, s + 0.05))) };
  });
  const script = `
        // ---- framing (motion/render.js) ----
        (function () {
          var P = ${JSON.stringify(program)}, KEY = ${doc.design?.framing === "key"};
          // Cinematic steps carry their own zoom origin (just above the head) and ease: a constant-speed drift, an eased
          // punch in, an eased release.
          var EASE = { drift: "none", glide: "sine.inOut", "in": "power3.out", out: "power2.inOut", open: "power3.out" };
          var origin = function (p) { return "50% " + ((p.oy != null ? p.oy : ${ANCHOR}) * 100) + "%"; };
          gsap.set("#video-punch", { scale: P[0].scale, transformOrigin: origin(P[0]) });
          P.forEach(function (p, i) {
            var from = i ? (P[i - 1].to || P[i - 1].scale) : p.scale;
            if (p.oy != null) tl.set("#video-punch", { transformOrigin: origin(p) }, p.t);
            if (p.to) {
              tl.set("#video-punch", { scale: p.scale }, p.t);
              tl.fromTo("#video-punch", { scale: p.scale }, { scale: p.to, duration: p.dur, ease: EASE[p.ease] || "sine.inOut", immediateRender: false }, p.t);
              // The opening zoom-out can glide its origin back to the style's as it eases out.
              if (p.oyTo != null) tl.fromTo("#video-punch", { transformOrigin: origin(p) }, { transformOrigin: origin({ oy: p.oyTo }), duration: p.dur, ease: EASE[p.ease] || "sine.inOut", immediateRender: false }, p.t);
            } else if (KEY && i && from !== p.scale && !p.cut) {
              // Talking head: an animated pop, eased in and out, instead of a hard jump.
              var zoomingIn = p.scale > from;
              tl.fromTo("#video-punch", { scale: from }, { scale: p.scale, duration: zoomingIn ? 0.45 : 0.6, ease: zoomingIn ? "power3.out" : "power2.inOut", immediateRender: false }, p.t);
            } else tl.set("#video-punch", { scale: p.scale }, p.t);
          });
          // Cut hits: whip pan, zoom-blur punch, flash, shake, black-and-white beat, RGB split. Every one resets
          // what it touched when it ends, so seeking anywhere lands on the right frame.
          var V = "#video-punch", H = ${JSON.stringify(hits)};
          gsap.set(V, { x: 0, y: 0, rotation: 0, filter: "none" });
          H.forEach(function (h) {
            var t = h.t, e = h.t + h.len;
            if (h.move === "whip") {
              tl.fromTo(V, { xPercent: 0, filter: "blur(0px)" }, { xPercent: -22, filter: "blur(30px)", duration: 0.12, ease: "power3.in", immediateRender: false }, t);
              tl.fromTo(V, { xPercent: 22, filter: "blur(30px)" }, { xPercent: 0, filter: "blur(0px)", duration: 0.16, ease: "power4.out", immediateRender: false }, t + 0.12);
              tl.set(V, { xPercent: 0, filter: "none" }, e);
            } else if (h.move === "zoom-blur") {
              tl.fromTo(V, { scale: h.s, filter: "blur(0px) brightness(1)" }, { scale: h.big, filter: "blur(10px) brightness(1.25)", duration: 0.18, ease: "power3.in", immediateRender: false }, t);
              tl.fromTo(V, { scale: h.big, filter: "blur(10px) brightness(1.25)" }, { scale: h.s, filter: "blur(0px) brightness(1)", duration: 0.12, ease: "power2.out", immediateRender: false }, t + 0.18);
              tl.set(V, { scale: h.s, filter: "none" }, e);
            } else if (h.move === "flash") {
              tl.fromTo(V, { filter: "brightness(1) saturate(1)" }, { filter: "brightness(3.2) saturate(0.4)", duration: 0.07, ease: "power2.in", immediateRender: false }, t);
              tl.fromTo(V, { filter: "brightness(3.2) saturate(0.4)" }, { filter: "brightness(1) saturate(1)", duration: h.len - 0.07, ease: "power2.out", immediateRender: false }, t + 0.07);
              tl.set(V, { filter: "none" }, e);
            } else if (h.move === "shake") {
              var K = [[16, -9, 0.7], [-14, 7, -0.6], [10, -5, 0.4], [-6, 3, -0.2], [0, 0, 0]], dt = h.len / K.length, prev = [0, 0, 0];
              K.forEach(function (k, i) {
                tl.fromTo(V, { x: prev[0], y: prev[1], rotation: prev[2] }, { x: k[0], y: k[1], rotation: k[2], duration: dt, ease: "sine.inOut", immediateRender: false }, t + i * dt);
                prev = k;
              });
              tl.set(V, { x: 0, y: 0, rotation: 0 }, e);
            } else if (h.move === "bw") {
              tl.set(V, { filter: "grayscale(1) contrast(1.25) brightness(1.05)" }, t);
              tl.set(V, { filter: "none" }, e);
            } else if (h.move === "blur") {
              // The master edit's blur crossfade, on the speaker: soft-focus and brighten into the moment, then clear.
              var mid = t + Math.min(0.22, h.len * 0.45);
              tl.fromTo(V, { scale: h.s, filter: "blur(0px) brightness(1)" }, { scale: h.s * 1.04, filter: "blur(14px) brightness(1.14)", duration: mid - t, ease: "power2.in", immediateRender: false }, t);
              tl.fromTo(V, { scale: h.s * 1.04, filter: "blur(14px) brightness(1.14)" }, { scale: h.s, filter: "blur(0px) brightness(1)", duration: Math.max(0.15, e - mid), ease: "power2.out", immediateRender: false }, mid);
              tl.set(V, { scale: h.s, filter: "none" }, e);
            } else if (h.move === "rgb") {
              var on = "drop-shadow(14px 0px 0px rgba(255,0,70,0.75)) drop-shadow(-14px 0px 0px rgba(0,225,255,0.75))", off = "drop-shadow(0px 0px 0px rgba(255,0,70,0)) drop-shadow(0px 0px 0px rgba(0,225,255,0))";
              tl.fromTo(V, { filter: on, x: -6 }, { filter: off, x: 0, duration: h.len, ease: "steps(5)", immediateRender: false }, t);
              tl.set(V, { filter: "none", x: 0 }, e);
            }
          });
        })();
`;
  const hook = html.lastIndexOf("window.__timelines = window.__timelines || {};");
  return hook < 0 ? html : `${html.slice(0, hook)}${script}\n        ${html.slice(hook)}`;
}

/**
 * The composer glides the crop between tracking samples, so after a jump cut the speaker drifts back into the middle
 * over a second. Ads snap: at every cut the crop jumps straight to where the face is in the new shot.
 */
function snapCropAtCuts(html, doc) {
  const m = html.match(/const DATA = (\{.*\});\n/);
  if (!m) return html;
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return html;
  }
  if (!Array.isArray(data.frames) || data.frames.length < 2) return html;
  const cuts = doc.tracks.filter((t) => t.kind === "video" && !t.hidden).flatMap((t) => t.clips).map((c) => r3(c.start)).filter((t) => t > 0.01);
  const frames = [...data.frames];
  for (const t of cuts) {
    // The first sample inside the new shot tells where the face is; hold it from the cut on.
    const next = frames.find((f) => f.t >= t - 0.01);
    if (!next) continue;
    frames.push({ t: r3(t), pos: next.pos, cut: true });
  }
  frames.sort((a, b) => a.t - b.t || (b.cut ? 1 : 0) - (a.cut ? 1 : 0));
  data.frames = frames.filter((f, i) => i === 0 || f.t - frames[i - 1].t > 0.005);
  return html.replace(m[0], `const DATA = ${JSON.stringify(data).replace(/</g, "\\u003c")};\n`);
}
