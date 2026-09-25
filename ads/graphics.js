// Ads Editor layers: motion graphics, sound effects and the ad's colour grade, added to a composition that
// lib/compose.js built (and editor/director/layers.js may already have layered). Used for the editor's live
// preview and for renders, so what the creator previews is what gets saved.
//   graphic clips  { look, text, sub, highlight, items[], icon, position }   → HTML + GSAP on the clip timeline
//   sfx clips      { sfx, volume }                                           → <audio> on the composition
import { ASPECTS, normalizeDesign } from "../lib/compose.js";
import { FLOAT_IN, TEMPLATES } from "./templates/index.js";

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
// The template library's looks are looks too (ads/templates/).
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

// The sounds the Ads Editor uses: edits/sfx (Pixabay licence, see edits/sfx/CREDITS.md) plus ads/sfx (made here).
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
  // Made from the sound study (ads/references/sound-effects.md), our own synthesis.
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
  if (!graphics.length && !sounds.length) return out;

  const d = normalizeDesign({ ...doc.design, aspect: doc.aspect });
  const { width: W, height: H } = ASPECTS[d.aspect];
  const u = Math.min(W, H) / 1080; // 1 at 1080 wide
  const px = (n) => Math.round(n * u);
  const accent = /^#[0-9a-f]{3,8}$/i.test(brandAccent || "") ? brandAccent : d.accentColor && d.accentColor !== "#FFFFFF" ? d.accentColor : "#F4930F";
  const tall = H > W;

  const blocks = [];
  const usedTemplates = new Set();
  const cues = [];
  for (const c of graphics) {
    const id = `ag-${c.id}`;
    const t0 = r3(c.start);
    const t1 = r3(c.start + c.duration);
    const pos = POSITIONS.includes(c.position) ? c.position : c.look === "cta" || c.look === "lower-third" ? "bottom" : c.look === "list" || c.look === "compare" || c.look === "stat" ? "center" : "top";
    const where = `ag-at-${pos}`;
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
        inner = `<div class="ag-stat${money ? " money" : ""}${c.variant === "pill" ? " v-pill" : ""}"><div class="ag-num" id="${id}-num">${esc(c.text)}</div>${c.sub ? `<div class="ag-sub">${esc(c.sub)}</div>` : ""}</div>`;
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
          return `<div class="ag-li" id="${id}-i${i}" style="--lt:${size}px"><span class="ag-tick" id="${id}-c${i}"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="41" pathLength="100"/><path d="M31 52 45 65 70 37" pathLength="100"/></svg></span><span class="ag-lt-text" id="${id}-t${i}">${keyWords(it).map(([w, hot], j) => (hot ? `<span class="ag-hot" id="${id}-h${i}-${j}">${esc(w)}</span>` : esc(w))).join(" ")}</span></div>`;
        };
        inner = `<div class="ag-list">${kicker}<div class="ag-items">${list.map(row).join("")}</div></div>`;
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
        inner = `<div class="ag-cta">${c.sub ? `<div class="ag-cta-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}<div class="ag-btn" id="${id}-btn">${icon("calendar", px(46), 2.6)}<span>${esc(c.text || "Book a call")}</span><i class="ag-shine" id="${id}-shine"></i></div><i class="ag-ripple" id="${id}-rip"></i><svg class="ag-cursor" id="${id}-cur" viewBox="0 0 24 24"><path d="M5 3.2 19.2 12 12.6 13.5 16.3 20.3 13.6 21.7 9.9 14.9 5.2 19.4Z"/></svg></div>`;
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
          inner = tpl.html({ id, c, px, W, H, tall, esc, data: tplData, logo: (c.logos || []).map((l) => logoSrc(l)).find(Boolean) || null });
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
    blocks.push(`<div id="${id}" class="ag ag-look-${c.look || "headline"} ${where}">${inner}</div>`);
    cues.push({ id, look: c.look || "headline", t0, t1, items, stat, pos, strike: Boolean(c.strike), mark: markLetters, kw: kickerWords, face: c.face ? { top: r3(ANCHOR - (ANCHOR - c.face.top) * OPEN), bottom: r3(ANCHOR - (ANCHOR - c.face.bottom) * OPEN) } : null, count: statCount(t1 - t0), times: c.look === "list" ? listTimes(t1 - t0, items) : null, data: tplData, low: TEMPLATES[c.look]?.position === "bottom" });
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
      /* ---- Ads Editor graphics (ads/graphics.js) ---- */
      .ag { position: absolute; left: 0; right: 0; z-index: 90; display: flex; justify-content: center; pointer-events: none; visibility: hidden; opacity: 0; font-family: "Inter", system-ui, sans-serif; color: #fff; --ac: ${accent}; }
      .ag-at-top { top: ${tall ? 11 : 7}%; }
      .ag-at-center { top: 0; bottom: 0; align-items: center; }
      .ag-at-bottom { bottom: ${tall ? 23 : 12}%; }
      .ag-headline, .ag-iconcard { max-width: ${tall ? 88 : 70}%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: ${px(18)}px; }
      .ag-head { font-weight: 900; font-size: ${px(tall ? 92 : 84)}px; line-height: 1.02; letter-spacing: -0.035em; text-shadow: 0 ${px(6)}px ${px(30)}px rgba(0,0,0,.55); }
      .ag-head.sm { font-size: ${px(tall ? 74 : 66)}px; }
      .ag-w { display: inline-block; will-change: transform, opacity, filter; }
      .ag-w.hot { position: relative; color: #fff; z-index: 0; padding: 0 .08em; }
      .ag-w.hot::before { content: ""; position: absolute; z-index: -1; left: -.04em; right: -.04em; top: .1em; bottom: .02em; border-radius: .12em; background: var(--ac); transform: scaleX(var(--sw, 1)); transform-origin: 0 50%; box-shadow: 0 0 .5em color-mix(in srgb, var(--ac) 60%, transparent); }
      .ag-sub { font-weight: 700; font-size: ${px(40)}px; letter-spacing: -0.01em; color: rgba(255,255,255,.9); text-shadow: 0 ${px(3)}px ${px(18)}px rgba(0,0,0,.6); }
      .ag-card { position: relative; padding: ${px(44)}px ${px(56)}px; border-radius: ${px(40)}px; background: rgba(0,0,0,.74); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.1), 0 ${px(40)}px ${px(120)}px rgba(0,0,0,.55); }
      .ag-stat { text-align: center; }
      .ag-num { font-weight: 900; font-size: ${px(142)}px; line-height: 1; letter-spacing: -0.045em; color: #fff; font-variant-numeric: tabular-nums; text-shadow: 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 60%, transparent), 0 ${px(8)}px ${px(30)}px rgba(0,0,0,.5); will-change: transform; }
      .ag-stat.v-pill { padding: ${px(26)}px ${px(46)}px; border-radius: 999px; border: 2px solid transparent; background: linear-gradient(rgba(14,14,18,.72), rgba(14,14,18,.72)) padding-box, linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.2) 30%, rgba(255,255,255,.05) 60%, rgba(255,255,255,.6)) border-box; backdrop-filter: blur(${px(16)}px); -webkit-backdrop-filter: blur(${px(16)}px); }
      .ag-stat.v-pill .ag-num { font-size: ${px(112)}px; color: var(--ac); text-shadow: 0 0 ${px(26)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .ag-stat.v-pill.money .ag-num { color: #2FE06A; }
      .ag-stat.money .ag-num { color: #2FE06A; text-shadow: 0 0 ${px(26)}px rgba(47,224,106,.55), 0 0 ${px(70)}px rgba(47,224,106,.35), 0 ${px(8)}px ${px(30)}px rgba(0,0,0,.5); }
      .ag-stat .ag-sub { margin-top: ${px(8)}px; font-size: ${px(36)}px; font-weight: 800; color: #fff; text-shadow: 0 ${px(4)}px ${px(20)}px rgba(0,0,0,.7); }
      .ag-list { display: flex; flex-direction: column; align-items: center; gap: ${px(18)}px; max-width: 94%; filter: drop-shadow(0 ${px(6)}px ${px(22)}px rgba(0,0,0,.6)); }
      .ag-scrim { position: absolute; left: 0; right: 0; bottom: 0; height: ${tall ? 50 : 60}%; z-index: 89; pointer-events: none; visibility: hidden; opacity: 0; background: linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.3) 55%, rgba(0,0,0,0)); }
      .ag-hk { font-family: "Inter", system-ui, sans-serif; font-weight: 900; font-size: ${px(tall ? 50 : 44)}px; line-height: 1; letter-spacing: 0.02em; text-transform: uppercase; color: #fff; white-space: nowrap; }
      .ag-kw { display: inline-block; will-change: transform, opacity, filter; }
      .ag-kw.hot { color: var(--ac); text-shadow: 0 0 ${px(26)}px color-mix(in srgb, var(--ac) 45%, transparent); }
      .ag-items { display: grid; justify-items: center; }
      .ag-li { grid-area: 1 / 1; display: flex; align-items: center; gap: ${px(22)}px; visibility: hidden; opacity: 0; will-change: transform, opacity, filter; }
      .ag-li .ag-tick, .ag-li .ag-lt-text { visibility: hidden; opacity: 0; }
      .ag-tick { flex: none; width: calc(var(--lt) * 1.1); height: calc(var(--lt) * 1.1); filter: drop-shadow(0 0 ${px(10)}px var(--ac)) drop-shadow(0 0 ${px(26)}px color-mix(in srgb, var(--ac) 60%, transparent)); }
      .ag-tick svg { width: 100%; height: 100%; overflow: visible; }
      .ag-tick circle, .ag-tick path { fill: none; stroke: var(--ac); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .ag-lt-text { font-family: "Inter", system-ui, sans-serif; font-weight: 900; font-size: var(--lt); line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase; color: #fff; white-space: nowrap; }
      .ag-hot { display: inline-block; color: var(--ac); text-shadow: 0 0 ${px(24)}px color-mix(in srgb, var(--ac) 45%, transparent); }
      .ag-lt { position: relative; display: flex; align-items: stretch; margin-right: auto; margin-left: ${tall ? 6 : 5}%; }
      .ag-lt-bar { display: block; width: ${px(16)}px; border-radius: ${px(8)}px; background: var(--ac); transform-origin: 50% 100%; }
      .ag-lt-body { display: flex; flex-direction: column; gap: ${px(6)}px; margin-left: ${px(20)}px; padding: ${px(22)}px ${px(36)}px; border-radius: ${px(20)}px; background: rgba(0,0,0,.78); box-shadow: 0 ${px(20)}px ${px(60)}px rgba(0,0,0,.45); clip-path: inset(0 0 0 0 round ${px(20)}px); }
      .ag-lt-body b { font-weight: 900; font-size: ${px(54)}px; letter-spacing: -0.02em; }
      .ag-lt-body span { font-weight: 600; font-size: ${px(34)}px; color: rgba(255,255,255,.78); }
      .ag-badge { display: inline-flex; align-items: center; gap: ${px(16)}px; padding: ${px(20)}px ${px(40)}px; border-radius: 999px; background: var(--ac); color: #fff; font-weight: 900; font-size: ${px(50)}px; letter-spacing: .02em; text-transform: uppercase; box-shadow: 0 ${px(18)}px ${px(60)}px color-mix(in srgb, var(--ac) 45%, transparent), 0 0 0 ${px(6)}px rgba(255,255,255,.14); }
      .ag-cta { position: relative; display: flex; flex-direction: column; align-items: center; gap: ${px(20)}px; }
      .ag-cta-sub { font-weight: 800; font-size: ${px(40)}px; text-transform: uppercase; letter-spacing: 0.04em; color: #fff; text-shadow: 0 ${px(4)}px ${px(20)}px rgba(0,0,0,.6); }
      .ag-btn { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: ${px(14)}px; padding: ${px(22)}px ${px(44)}px; border-radius: 999px; background: var(--ac); color: #000; font-weight: 900; font-size: ${px(42)}px; letter-spacing: -0.01em; text-transform: uppercase; box-shadow: 0 ${px(20)}px ${px(60)}px rgba(0,0,0,.45), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 45%, transparent); }
      .ag-shine { position: absolute; top: -20%; bottom: -20%; width: 30%; left: -40%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.6), transparent); transform: skewX(-18deg); }
      .ag-ripple { position: absolute; left: 62%; bottom: ${px(24)}px; width: ${px(90)}px; height: ${px(90)}px; margin: ${px(-45)}px 0 0 ${px(-45)}px; border-radius: 50%; border: ${px(6)}px solid #fff; visibility: hidden; opacity: 0; }
      .ag-cursor { position: absolute; left: 62%; bottom: ${px(-40)}px; width: ${px(72)}px; height: ${px(72)}px; overflow: visible; visibility: hidden; opacity: 0; transform-origin: 20% 12%; filter: drop-shadow(0 ${px(8)}px ${px(14)}px rgba(0,0,0,.45)); }
      .ag-cursor path { fill: #fff; stroke: #000; stroke-width: 1.4; stroke-linejoin: round; }
      .ag-compare { display: flex; gap: ${px(24)}px; width: ${tall ? 90 : 70}%; }
      .ag-col { flex: 1; padding: ${px(34)}px ${px(36)}px; border-radius: ${px(32)}px; background: rgba(0,0,0,.78); box-shadow: 0 ${px(30)}px ${px(90)}px rgba(0,0,0,.5); }
      .ag-col-h { display: flex; align-items: center; gap: ${px(14)}px; font-weight: 900; font-size: ${px(40)}px; text-transform: uppercase; letter-spacing: .04em; }
      .ag-col.bad .ag-col-h { color: rgba(255,255,255,.55); }
      .ag-col.good { box-shadow: 0 0 0 ${px(4)}px var(--ac), 0 ${px(30)}px ${px(90)}px color-mix(in srgb, var(--ac) 35%, transparent); }
      .ag-col.good .ag-col-h { color: var(--ac); }
      .ag-col p { margin: ${px(16)}px 0 0; font-weight: 800; font-size: ${px(46)}px; line-height: 1.15; letter-spacing: -0.015em; }
      .ag-col.bad p { color: rgba(255,255,255,.62); text-decoration: line-through; text-decoration-color: rgba(255,255,255,.4); }
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
      .ag-mark { font-family: "Inter", system-ui, sans-serif; font-weight: 900; font-size: ${px(tall ? 84 : 72)}px; line-height: 1; letter-spacing: 0.14em; margin-right: -0.14em; text-transform: uppercase; color: #fff; text-shadow: 0 0 ${px(22)}px rgba(255,255,255,.45), 0 ${px(6)}px ${px(26)}px rgba(0,0,0,.45); will-change: letter-spacing, filter; }
      .ag-ml { display: inline-block; will-change: transform, opacity, filter; }
      .ag-slide { width: ${tall ? 86 : 52}%; padding: ${px(10)}px; border-radius: ${px(30)}px; border: 2px solid transparent; overflow: hidden;
        background: linear-gradient(rgba(20,20,24,.6), rgba(20,20,24,.6)) padding-box, linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.2) 25%, rgba(255,255,255,.05) 60%, rgba(255,255,255,.6)) border-box;
        box-shadow: 0 ${px(30)}px ${px(80)}px rgba(0,0,0,.45); will-change: transform, opacity, filter; }
      .ag-slide img { display: block; width: 100%; max-height: ${Math.round(H * (tall ? 0.34 : 0.62))}px; object-fit: contain; border-radius: ${px(22)}px; transform-origin: 50% 40%; }
      .ag-bigcheck { display: flex; flex-direction: column; align-items: center; gap: ${px(14)}px; }
      .ag-bc { width: ${px(tall ? 300 : 240)}px; height: ${px(tall ? 300 : 240)}px; overflow: visible; filter: drop-shadow(0 0 ${px(18)}px var(--ac)) drop-shadow(0 0 ${px(50)}px color-mix(in srgb, var(--ac) 55%, transparent)); will-change: transform; }
      .ag-bc-ring { fill: color-mix(in srgb, var(--ac) 16%, transparent); stroke: var(--ac); stroke-width: 8; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .ag-bc-tick { fill: none; stroke: #fff; stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .ag-bc-word { font-weight: 900; font-size: ${px(64)}px; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; text-shadow: 0 ${px(4)}px ${px(22)}px rgba(0,0,0,.55); }
      .ag-proof { display: flex; align-items: flex-start; gap: ${px(18)}px; width: ${tall ? 70 : 40}%; padding: ${px(20)}px ${px(24)}px; border-radius: ${px(30)}px; background: rgba(12,12,14,.78); backdrop-filter: blur(${px(14)}px); -webkit-backdrop-filter: blur(${px(14)}px); box-shadow: 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.08), 0 ${px(24)}px ${px(70)}px rgba(0,0,0,.45); will-change: transform, opacity, filter; }
      .ag-pf-av { flex: none; display: grid; place-items: center; width: ${px(64)}px; height: ${px(64)}px; border-radius: 50%; background: var(--ac); color: #000; font-weight: 900; font-size: ${px(30)}px; }
      .ag-pf-body { min-width: 0; }
      .ag-pf-head { display: flex; align-items: baseline; gap: ${px(14)}px; margin-bottom: ${px(6)}px; }
      .ag-pf-head b { font-weight: 800; font-size: ${px(30)}px; color: #fff; }
      .ag-pf-head span { font-weight: 600; font-size: ${px(22)}px; color: color-mix(in srgb, var(--ac) 85%, #fff); }
      .ag-proof p { margin: 0; font-weight: 600; font-size: ${px(30)}px; line-height: 1.3; color: rgba(255,255,255,.92); }
      .ag-orb { display: grid; place-items: center; width: ${px(190)}px; height: ${px(190)}px; border-radius: 50%; color: #fff; background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--ac) 80%, #fff), var(--ac)); box-shadow: 0 0 ${px(80)}px color-mix(in srgb, var(--ac) 60%, transparent), 0 0 0 ${px(12)}px color-mix(in srgb, var(--ac) 22%, transparent); }`;

  const script = `
        // ---- Ads Editor graphics (ads/graphics.js) ----
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
          CUES.forEach(place);
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { CUES.forEach(place); });
          function fmt(n, s) {
            var v = s.decimals ? n.toFixed(s.decimals) : String(Math.round(n));
            if (s.commas) v = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
            return s.pre + v + s.post;
          }
          // Template library timelines (ads/templates/), with the shared float-in and drift helpers.
          ${FLOAT_IN}
          var TPL = {${[...usedTemplates].map((tid) => `${JSON.stringify(tid)}: function (c, el, t0, t1, len, out) {${TEMPLATES[tid].script}\n          }`).join(",\n")}};
          CUES.forEach(function (c) {
            var el = "#" + c.id, t0 = c.t0, t1 = c.t1, len = Math.max(0.6, t1 - t0);
            var out = Math.max(t0 + 0.5, t1 - 0.32);
            tl.set(el, { autoAlpha: 1 }, t0);
            tl.set(el, { autoAlpha: 0 }, t1);
            if (hideCaps[c.look] || c.pos === "center") {
              tl.set(".cap", { autoAlpha: 0 }, t0);
              tl.set(".cap", { autoAlpha: 1 }, t1);
            }
            var box = el + " > *";
            if (TPL[c.look]) {
              TPL[c.look](c, el, t0, t1, len, out);
            } else if (c.look === "headline" || c.look === "icon") {
              var ws = []; for (var i = 0; i < c.items; i++) ws.push(el + "-w" + i);
              if (c.look === "icon") tl.fromTo(el + "-orb", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)", immediateRender: false }, t0);
              if (ws.length) tl.fromTo(ws.join(","), { autoAlpha: 0, y: 60, scale: 0.9, filter: "blur(14px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out", stagger: Math.min(0.08, 0.5 / ws.length), immediateRender: false }, t0 + (c.look === "icon" ? 0.2 : 0));
              tl.fromTo(el + " .ag-w.hot", { "--sw": 0 }, { "--sw": 1, duration: 0.4, ease: "power3.out", immediateRender: false }, t0 + 0.3);
              tl.fromTo(el + " .ag-sub", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t0 + 0.35);
              tl.fromTo(box, { scale: 1 }, { scale: 1.035, duration: len, ease: "sine.inOut", immediateRender: false }, t0);
            } else if (c.look === "stat") {
              // Pops in, counts up (counter sound), lands with a punch and a glow (cha-ching).
              tl.fromTo(box, { autoAlpha: 0, scale: 0.6, filter: "blur(12px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "back.out(1.8)", immediateRender: false }, t0);
              var land = t0 + 0.1 + c.count;
              if (c.stat) {
                var s = c.stat, obj = { v: 0 }, num = document.querySelector(el + "-num");
                tl.fromTo(obj, { v: 0 }, { v: s.value, duration: c.count, ease: "power1.inOut", immediateRender: false, onUpdate: function () { num.textContent = fmt(obj.v, s); } }, t0 + 0.1);
              }
              tl.fromTo(el + "-num", { scale: 1 }, { scale: 1.14, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, land);
              tl.fromTo(el + "-num", { filter: "brightness(1)" }, { filter: "brightness(1.35)", duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out", immediateRender: false }, land);
              tl.fromTo(box, { scale: 1 }, { scale: 1.04, duration: Math.max(0.3, out - land - 0.3), ease: "sine.inOut", immediateRender: false }, land + 0.3);
            } else if (c.look === "list") {
              // Kicker words rise in; then one item at a time: bubble pops, check draws, words slide in, it pops out.
              tl.fromTo(el + "-scrim", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out", immediateRender: false }, t0 - 0.1);
              tl.fromTo(el + "-scrim", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut", immediateRender: false }, out - 0.05);
              for (var j = 0; j < c.kw; j++) tl.fromTo(el + "-kw" + j, { autoAlpha: 0, y: 30, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out", immediateRender: false }, t0 + j * 0.07);
              for (var k = 0; k < c.items; k++) {
                var at = t0 + c.times[k];
                var li = el + "-i" + k;
                tl.fromTo(li, { autoAlpha: 0, scale: 1, filter: "blur(0px)" }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, at);
                tl.fromTo(el + "-c" + k, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2.4)", immediateRender: false }, at);
                tl.fromTo(el + "-c" + k + " circle", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, at);
                tl.fromTo(el + "-c" + k + " path", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.2, ease: "power2.out", immediateRender: false }, at + 0.28);
                tl.fromTo(el + "-t" + k, { autoAlpha: 0, x: -30, filter: "blur(6px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.45, ease: "expo.out", immediateRender: false }, at + 0.42);
                document.querySelectorAll(li + " .ag-hot").forEach(function (h) {
                  tl.fromTo(h, { scale: 0.7 }, { scale: 1, duration: 0.35, ease: "back.out(2.6)", immediateRender: false }, at + 0.55);
                });
                if (k < c.items - 1) tl.fromTo(li, { autoAlpha: 1, scale: 1, filter: "blur(0px)" }, { autoAlpha: 0, scale: 0.85, filter: "blur(8px)", duration: 0.28, ease: "power2.in", immediateRender: false }, t0 + c.times[k + 1] - 0.3);
              }
            } else if (c.look === "compare") {
              tl.fromTo(box, { autoAlpha: 0, y: 40, scale: 0.92, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.65, ease: "expo.out", immediateRender: false }, t0);
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
                  tl.fromTo(el + "-x" + q, { autoAlpha: 0, scale: 2.4, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.32, ease: "back.out(2.4)", immediateRender: false }, at);
                  tl.fromTo(el + "-l" + q, { scale: 1, opacity: 1 }, { scale: 0.9, opacity: 0.7, duration: 0.16, ease: "power2.out", immediateRender: false }, at + 0.08);
                });
              } else {
                // The hero: flies up from the speaker's chest with motion blur, lands with an overshoot, glows and floats.
                tl.fromTo(el + "-l0", { autoAlpha: 0, y: ${Math.round(H * 0.36)}, scaleX: 0.8, scaleY: 1.3, filter: "blur(22px)" }, { autoAlpha: 1, y: 0, scaleX: 1, scaleY: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out", immediateRender: false }, t0);
                tl.fromTo(el + "-g0", { filter: "drop-shadow(0px 0px 0px rgba(244,147,15,0))" }, { filter: "drop-shadow(0px 0px 46px rgba(244,147,15,0.75))", duration: 0.5, ease: "power2.out", immediateRender: false }, t0 + 0.3);
                tl.fromTo(el + "-g0", { y: 0, rotation: 0 }, { y: -14, rotation: 1.5, duration: Math.max(0.4, len - 0.8), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
                if (c.mark) {
                  // The name: letters zoom down into place one by one, flash with a glow, then the tracking slowly opens up.
                  for (var m = 0; m < c.mark; m++) tl.fromTo(el + "-m" + m, { autoAlpha: 0, y: 40, scale: 1.8, filter: "blur(14px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out", immediateRender: false }, t0 + 0.35 + m * 0.06);
                  var lit = t0 + 0.35 + c.mark * 0.06 + 0.3;
                  tl.fromTo(el + "-mark", { filter: "brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))" }, { filter: "brightness(1.3) drop-shadow(0 0 26px rgba(255,255,255,0.85))", duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, lit);
                  tl.fromTo(el + "-mark", { letterSpacing: "0.14em" }, { letterSpacing: "0.22em", duration: Math.max(0.5, out - lit), ease: "sine.out", immediateRender: false }, lit);
                }
              }
              tl.fromTo(el + " .ag-logo-wrap", { scale: 1 }, { scale: 0.88, duration: 0.35, ease: "power2.in", immediateRender: false }, out - 0.05);
            } else if (c.look === "slide") {
              tl.fromTo(el + "-card", { autoAlpha: 0, y: 140, rotation: -6, scale: 0.8, filter: "blur(12px)" }, { autoAlpha: 1, y: 0, rotation: 0, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "expo.out", immediateRender: false }, t0);
              tl.fromTo(el + "-img", { scale: 1 }, { scale: 1.08, duration: Math.max(0.5, len - 0.7), ease: "sine.inOut", immediateRender: false }, t0 + 0.4);
              tl.fromTo(el + "-card", { y: 0 }, { y: -8, duration: Math.max(0.5, len - 0.8), ease: "sine.inOut", immediateRender: false }, t0 + 0.7);
            } else if (c.look === "check") {
              // Circle pops and draws, the check strokes in, a punch on the landing, then it breathes.
              tl.fromTo(el + "-bc", { scale: 0.3, rotation: -90, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.55, ease: "back.out(2.2)", immediateRender: false }, t0);
              tl.fromTo(el + "-ring", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t0 + 0.05);
              tl.fromTo(el + "-tick", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.28, ease: "power3.out", immediateRender: false }, t0 + 0.4);
              tl.fromTo(el + "-bc", { scale: 1 }, { scale: 1.12, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, t0 + 0.66);
              tl.fromTo(el + "-word", { autoAlpha: 0, y: 24, filter: "blur(6px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "expo.out", immediateRender: false }, t0 + 0.55);
              tl.fromTo(el + "-bc", { y: 0 }, { y: -8, duration: Math.max(0.3, len - 1.1), ease: "sine.inOut", immediateRender: false }, t0 + 0.9);
            } else if (c.look === "proof") {
              tl.fromTo(el + "-card", { autoAlpha: 0, x: 120, scale: 0.94, filter: "blur(8px)" }, { autoAlpha: 1, x: 0, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out", immediateRender: false }, t0);
              tl.fromTo(el + "-card", { y: 0 }, { y: -8, duration: Math.max(0.4, len - 0.9), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
            } else if (c.look === "lower-third") {
              tl.fromTo(el + "-bar", { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, t0);
              tl.fromTo(el + "-body", { clipPath: "inset(0 100% 0 0 round ${px(20)}px)", x: -30 }, { clipPath: "inset(0 0% 0 0 round ${px(20)}px)", x: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, t0 + 0.15);
            } else if (c.look === "callout") {
              tl.fromTo(box, { autoAlpha: 0, scale: 0.3, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.2)", immediateRender: false }, t0);
              tl.fromTo(box, { y: 0 }, { y: -12, duration: Math.max(0.3, len - 0.8), ease: "sine.inOut", immediateRender: false }, t0 + 0.5);
            } else if (c.look === "cta") {
              // Button pops, the cursor glides onto it, clicks (press + ripple), then the button breathes.
              tl.fromTo(el + "-sub", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t0);
              tl.fromTo(el + "-btn", { autoAlpha: 0, scale: 0.6, y: 40, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "back.out(1.8)", immediateRender: false }, t0);
              var click = t0 + ${CTA_CLICK};
              tl.fromTo(el + "-cur", { autoAlpha: 0, x: ${px(260)}, y: ${px(240)} }, { autoAlpha: 1, x: 0, y: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, click - 0.6);
              tl.fromTo(el + "-cur", { scale: 1 }, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click);
              tl.fromTo(el + "-btn", { scale: 1 }, { scale: 0.93, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click);
              tl.fromTo(el + "-rip", { autoAlpha: 0.9, scale: 0.2 }, { autoAlpha: 0, scale: 2.6, duration: 0.5, ease: "power2.out", immediateRender: false }, click);
              tl.fromTo(el + "-shine", { left: "-40%" }, { left: "120%", duration: 0.6, ease: "power1.inOut", immediateRender: false }, click + 0.05);
              if (out - click > 1.2) tl.fromTo(el + "-btn", { scale: 1 }, { scale: 1.04, duration: 0.5, yoyo: true, repeat: Math.max(1, Math.floor((out - click - 0.6) / 0.5)), ease: "sine.inOut", immediateRender: false }, click + 0.4);
            }
            tl.fromTo(el, { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: c.pos === "bottom" ? 30 : -24, filter: "blur(8px)", duration: 0.4, ease: "power2.inOut", immediateRender: false }, out - 0.08);
          });
        })();
`;

  const tplCss = [...usedTemplates].map((tid) => TEMPLATES[tid].css({ px, W, H, tall })).join("\n");
  out = out.replace("</style>", `${css}\n${tplCss}\n    </style>`);
  const close = out.lastIndexOf("</div>\n    <script>");
  if (close < 0) throw new Error("Unexpected composition layout");
  out = `${out.slice(0, close)}${blocks.join("\n      ")}\n      ${audio.join("\n      ")}\n    ${out.slice(close)}`;
  if (cues.length) {
    const hook = out.lastIndexOf("window.__timelines = window.__timelines || {};");
    if (hook < 0) throw new Error("Unexpected composition script");
    out = `${out.slice(0, hook)}${script}\n        ${out.slice(hook)}`;
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
const cameraClips = (doc) => kind(doc, "camera").filter((c) => FRAME_MOVES.includes(c.move || "punch"));
const hitClips = (doc) => kind(doc, "camera").filter((c) => !FRAME_MOVES.includes(c.move || "punch"));

/** The most the shot can zoom at time t and keep the whole face in frame (zooming from ANCHOR). */
function faceCapper(video) {
  return (t) => {
    const c = video.find((v) => t >= v.start - 0.01 && t < v.start + v.duration) || video.at(-1);
    const f = c?.face;
    if (!f) return PUNCH;
    const top = ANCHOR - f.top > 0.01 ? (ANCHOR - 0.03) / (ANCHOR - f.top) : PUNCH;
    const bottom = f.bottom > ANCHOR + 0.01 ? (0.97 - ANCHOR) / (f.bottom - ANCHOR) : PUNCH;
    return Math.max(1, Math.min(PUNCH, top, bottom));
  };
}

export function framingProgram(doc, graphics = graphicClips(doc)) {
  const video = doc.tracks.filter((t) => t.kind === "video" && !t.hidden).flatMap((t) => t.clips).sort((a, b) => a.start - b.start);
  if (!video.length) return [];
  const D = Math.max(...video.map((c) => c.start + c.duration));
  const moves = cameraClips(doc);
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
  const sorted = [...beats].filter((t) => t < D - 0.8).sort((a, b) => a - b);
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
    else program.push({ t: r3(m.start), scale: m.move === "pull" ? 1.0 : PUNCH });
    resume(m.start + m.duration);
  }
  for (const g of graphics) {
    program.push({ t: r3(Math.max(0, g.start - 0.02)), scale: OPEN });
    resume(g.start + g.duration);
  }
  program.sort((a, b) => a.t - b.t);
  if (!program.length || program[0].t > 0.01) program.unshift({ t: 0, scale: WIDE });
  // Never zoom the face out of frame: zooming from ANCHOR moves a point at y to ANCHOR - (ANCHOR - y)·s, so each
  // scale is capped by where the face reaches in that piece (with a little margin above the head and below the chin).
  const capFor = faceCapper(video);
  for (const p of program) {
    const cap = capFor(p.t);
    p.scale = r3(Math.min(p.scale, cap));
    if (p.to) p.to = r3(Math.max(p.scale, Math.min(p.to, capFor(p.t + p.dur - 0.01))));
  }
  return program;
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
        // ---- Ads Editor framing (ads/graphics.js) ----
        (function () {
          var P = ${JSON.stringify(program)};
          gsap.set("#video-punch", { scale: P[0].scale, transformOrigin: "50% ${ANCHOR * 100}%" });
          P.forEach(function (p) {
            if (p.to) {
              tl.set("#video-punch", { scale: p.scale }, p.t);
              tl.fromTo("#video-punch", { scale: p.scale }, { scale: p.to, duration: p.dur, ease: "sine.inOut", immediateRender: false }, p.t);
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
