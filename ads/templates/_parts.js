// Small shared pieces for the template library (not a template itself, so index.js doesn't register it).

/** The first letter or digit of a string, upper-cased: the fallback "logo" when there's no image. */
export const initial = (s, d = "A") => (String(s || "").trim().match(/[A-Za-z0-9]/) || [d])[0].toUpperCase();

/** Inside of an avatar/icon slot: the ad's logo image when there is one, else the initial. */
export const mark = (logo, letter, esc) => (logo ? `<img src="${esc(logo)}" alt="" />` : `<span>${esc(letter)}</span>`);

/** Positional items (e.g. [button, kicker, note, footer]): the planner writes "-" for an empty slot. */
export const slots = (c, n) => Array.from({ length: n }, (_, i) => {
  const v = String((c.items || [])[i] ?? "").trim();
  return v === "-" ? "" : v;
});

/** Clip items as strings. */
export const items = (c) => (Array.isArray(c.items) ? c.items : []).map((x) => String(x ?? "").trim()).filter(Boolean);

/**
 * Timeline helper (script source): count the number inside an element up from 0 (keeps prefix, suffix, decimals and
 * thousands commas). Seek-safe: a proxy tween on the timeline. Skips fractions like "3/4".
 */
export const COUNT_UP = String.raw`function countUp(sel, at, dur, ease) {
      var node = document.querySelector(sel); if (!node) return;
      var txt = node.textContent, m = txt.match(/^([^\d-]*?)(-?[\d,]*\.?\d+)(.*)$/);
      if (!m || /\d\s*\/\s*\d/.test(txt)) return;
      var raw = m[2], o = { v: 0 }, target = Number(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length, commas = raw.indexOf(",") >= 0;
      if (!isFinite(target)) return;
      tl.fromTo(o, { v: 0 }, { v: target, duration: dur, ease: ease || "power2.out", immediateRender: false, onUpdate: function () {
        var s = o.v.toFixed(dec); if (commas) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        node.textContent = m[1] + s + m[3];
      } }, at);
    }`;

/** macOS-style arrow cursor and a tapping hand (white, black outline). */
export const CURSOR_SVG = `<svg viewBox="0 0 24 24"><path fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round" d="M5 2.5v16.2l4.1-3.9 2.6 6 2.9-1.3-2.6-5.9h5.7z"/></svg>`;
export const HAND_SVG = `<svg viewBox="0 0 24 24"><path fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round" d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.6-.1a1.5 1.5 0 0 1 2.9.5l1 .1a1.4 1.4 0 0 1 2.3 1V16c0 3-2.2 5.5-5.2 5.5h-1.2A5 5 0 0 1 8 19.3l-3-4.5a1.4 1.4 0 0 1 2.2-1.7L9 15z"/></svg>`;
export const CHECK_PATH = "M7 12.5l3.2 3.2L17 8.8";

/** The kit's faces: Plus Jakarta Sans for display, Inter for UI, JetBrains Mono for labels (all in assets/fonts). */
export const DISPLAY = `"Plus Jakarta Sans", "Inter", system-ui, sans-serif`;
export const MONO = `"JetBrains Mono", "SF Mono", Menlo, "Courier Prime", monospace`;
export const CREAM = "#FBF1E8";
export const GREEN = "#3DDC84";
export const AMBER = "#FFB020";
export const RED = "#FF5A4E";
/** The Atlas brand palette (the creator's Remotion theme, src/theme.tsx). Coral is the Atlas accent. */
export const ATLAS = { coral: "#EE7440", coralDeep: "#D95F2B", peach: "#F9CDB3", cream: "#FBF1E8", paper: "#F2EDE6", ink: "#17120F", ink2: "#231C18" };

/** The ATLAS mark: a rising burst over two horizon bars (from the brand theme), in currentColor. */
export const ATLAS_MARK = (grow = 1) => `<svg class="mk-mark" viewBox="0 0 100 100" fill="currentColor"><g transform="translate(50,58)">${[-90, -54, -126, -20, -160].map((deg, i) => `<rect x="0" y="-6" width="${((i === 0 ? 44 : i < 3 ? 40 : 31) * grow).toFixed(1)}" height="12" rx="6" transform="rotate(${deg})"/>`).join("")}</g><rect x="8" y="62" width="84" height="12" rx="3"/><rect x="20" y="80" width="60" height="10" rx="3" opacity=".9"/></svg>`;
/** The ad's logo image when it has one, else the ATLAS mark. */
export const brandMark = (logo, esc) => (logo ? `<img src="${esc(logo)}" alt="" />` : ATLAS_MARK());

/** A status word → its colour class (the Atlas kit: green done, accent working, amber in progress, red needs you). */
export const statusTone = (s) => {
  const t = String(s || "").toLowerCase();
  if (/done|online|live|booked|sent|approved|paid|complete/.test(t)) return "ok";
  if (/approv|missed|late|overdue|urgent|called out|failed|no-show|double/.test(t)) return "bad";
  if (/progress|pending|waiting|review|report|due/.test(t)) return "warn";
  return "ac";
};

/** Film grain tile (fractal noise), as a data URI for CSS. */
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;

/**
 * The Atlas kit (ads/references/atlas-motion-kit.md; values from the creator's Remotion theme), added once to every
 * composition with graphics. Colours are variables so every template works on the three grounds: dark (ink), accent
 * (full-bleed coral) and paper (light, white cards).
 *   --tx / --tx2   text / muted text        --surface   solid card (notifications, agent cards, chips)
 *   --line / --chip   hairlines / quiet fills   --ink    the dark text on accent or coral buttons
 */
export const KIT_CSS = ({ px, tall }) => `
      .ag, .ag-bd { --on-ac: ${ATLAS.ink}; --tx: ${CREAM}; --tx2: rgba(251,241,232,.62); --ink: ${ATLAS.ink}; --ink2: ${ATLAS.ink2}; --line: rgba(251,241,232,.12); --chip: rgba(251,241,232,.08);
        --surface: linear-gradient(180deg, #2E2520, #251E1A); --ok: ${GREEN}; --peach: ${ATLAS.peach};
        --f-display: ${DISPLAY}; --f-mono: ${MONO}; }
      .ag.tone-paper, .ag-bd.tone-paper { --tx: ${ATLAS.ink}; --tx2: rgba(23,18,15,.6); --line: rgba(23,18,15,.1); --chip: rgba(23,18,15,.06); --surface: #fff; --ok: #1F9D55; }
      .mk-card { position: relative; box-sizing: border-box; border-radius: ${px(36)}px; color: var(--tx);
        background: linear-gradient(160deg, rgba(251,241,232,.10), rgba(251,241,232,.03)), rgba(23,18,15,.74);
        box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 45%, transparent), 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 18%, transparent), inset 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 6%, transparent), 0 ${px(30)}px ${px(80)}px rgba(0,0,0,.3);
        backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); will-change: transform, opacity, filter; }
      .ag.tone-paper .mk-card { background: #fff; box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(23,18,15,.08), 0 ${px(40)}px ${px(90)}px rgba(23,18,15,.14); backdrop-filter: none; -webkit-backdrop-filter: none; }
      .mk-3d { perspective: ${px(1800)}px; }
      .mk-kick { font-family: var(--f-mono); font-weight: 500; font-size: ${px(26)}px; line-height: 1.2; letter-spacing: .18em; text-transform: uppercase; color: var(--ac); white-space: nowrap; }
      .mk-kick.dim { color: var(--tx2); }
      .mk-kick.display { font-family: var(--f-display); font-weight: 700; letter-spacing: .22em; }
      /* Glow text: 0 0 .25em at 40%, 0 0 .6em at 20% (fx.tsx Glow). */
      .mk-h { margin: 0; font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 96 : 84)}px; line-height: 1.02; letter-spacing: -0.03em; color: var(--tx); text-shadow: 0 0 .25em rgba(251,241,232,.4), 0 0 .6em rgba(251,241,232,.2); text-wrap: balance; }
      .mk-h > span { display: block; will-change: transform, opacity, filter; }
      .ac, .mk-h .ac { color: var(--ac); text-shadow: 0 0 .25em color-mix(in srgb, var(--ac) 40%, transparent), 0 0 .6em color-mix(in srgb, var(--ac) 20%, transparent); }
      .mk-dim { color: var(--tx2); }
      .mk-dot { display: inline-block; flex: none; width: .5em; height: .5em; border-radius: 50%; background: currentColor; box-shadow: 0 0 .7em currentColor; vertical-align: .08em; }
      .st-ok { color: var(--ok); } .st-ac { color: var(--ac); } .st-warn { color: ${AMBER}; } .st-bad { color: ${RED}; }
      .mk-ch { display: none; }
      .mk-caret { display: inline-block; width: ${px(4)}px; height: 1.05em; margin-left: ${px(3)}px; vertical-align: -0.16em; background: var(--ac); }
      .ag svg.mk-mark { position: static !important; inset: auto !important; display: block; width: 100% !important; height: 100% !important; overflow: visible; fill: currentColor; stroke: none; filter: none; }
      .ag svg.mk-mark rect { stroke: none; }
      /* Full-screen scene ground (V1: a warm radial ink; accent: flat coral; paper: #F2EDE6), grain, vignette, embers. */
      .ag-bd { position: absolute; inset: 0; z-index: 88; overflow: hidden; pointer-events: none; visibility: hidden; opacity: 0;
        background: radial-gradient(ellipse at 50% 40%, #2A1B14 0%, ${ATLAS.ink} 60%, #0C0907 100%); }
      .ag-bd.tone-accent { background: var(--ac); }
      .ag-bd.tone-paper { background: ${ATLAS.paper}; }
      .ag-bd::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.28) 100%); }
      .ag-bd.tone-paper::after { background: radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(23,18,15,.08) 100%); }
      .ag-grain { position: absolute; inset: -40%; background-image: ${GRAIN}; background-size: ${px(240)}px ${px(240)}px; mix-blend-mode: overlay; opacity: .06; will-change: transform; }
      .ag-bd.tone-paper .ag-grain { opacity: .05; mix-blend-mode: multiply; }
      .ag-mote { position: absolute; border-radius: 50%; background: var(--ac); box-shadow: 0 0 var(--g) var(--ac); will-change: transform, opacity; }
      .ag.ag-full { top: 0 !important; bottom: 0 !important; height: auto !important; align-items: center !important; }
      /* On the accent ground (Hook, Roster, Honest, V2 CTA): cream lines, the "accent" line turns ink. */
      /* On the coral ground the accent is ink (ink boxes, lines and marks, as in the Remotion Hook/Roster/CTA), and
         text sitting on an accent fill (--on-ac) turns cream so it stays readable. */
      .ag.tone-accent { --ac: ${ATLAS.ink}; --on-ac: ${CREAM}; --tx2: rgba(23,18,15,.72); --line: rgba(23,18,15,.14); --chip: rgba(23,18,15,.1); }
      .ag.tone-accent .mk-h { text-shadow: none; }
      .ag.tone-accent .ac, .ag.tone-accent .mk-h.ac, .ag.tone-accent .mk-h .ac, .ag.tone-accent .mk-kick { color: var(--ink); text-shadow: none; }
      .ag.tone-paper .mk-h, .ag.tone-paper .ac, .ag.tone-paper .mk-h .ac { text-shadow: none; }`;

/**
 * Shared timeline helpers (script source) for the minimal kit. Seek-safe: everything is a tween or a set.
 *   hide(t)             hidden from the graphic's start (so things due later don't show early)
 *   blurIn(t, at, o)    opacity 0→1, blur→0, a small rise; o = { y, x, s, b, d, e, st }
 *   blurOut(t, at, o)   the reverse, drifting up a little
 *   settle3d(t, at, len, rx, ry)   a card tipped in 3D easing slowly toward flat over the hold
 *   typeOn(prefix, n, at, dur)     reveal characters prefix0..prefix(n-1) one by one (CSS hides .mk-ch)
 *   blink(sel, from, to)           a caret blinking every 0.5 s
 */
export const KIT_JS = `var CUR_T0 = 0;
function hide(t) { tl.set(t, { autoAlpha: 0 }, CUR_T0); }
function blurIn(t, at, o) {
  o = o || {};
  if (at > CUR_T0 + 0.001) hide(t);
  tl.fromTo(t, { autoAlpha: 0, y: o.y == null ? 24 : o.y, x: o.x || 0, scale: o.s == null ? 0.97 : o.s, filter: "blur(" + (o.b == null ? 14 : o.b) + "px)" }, { autoAlpha: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)", duration: o.d || 0.7, ease: o.e || "expo.out", stagger: o.st || 0, immediateRender: false }, at);
}
function blurOut(t, at, o) {
  o = o || {};
  tl.fromTo(t, { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: o.y == null ? -14 : o.y, filter: "blur(" + (o.b || 10) + "px)", duration: o.d || 0.4, ease: "power2.in", immediateRender: false }, at);
}
function settle3d(t, at, len, rx, ry) {
  rx = rx == null ? 10 : rx; ry = ry == null ? -12 : ry;
  tl.fromTo(t, { rotationX: rx, rotationY: ry }, { rotationX: rx * 0.3, rotationY: ry * 0.3, duration: Math.max(0.6, len), ease: "sine.out", immediateRender: false }, at);
}
function typeOn(prefix, n, at, dur) {
  for (var k = 0; k < n; k++) tl.set(prefix + k, { display: "inline" }, at + (k / Math.max(1, n)) * dur);
}
function blink(sel, from, to) {
  for (var b = from; b < to; b += 0.5) tl.set(sel, { opacity: Math.round((b - from) / 0.5) % 2 ? 0 : 1 }, b);
}`;

/** Characters of a string as hidden spans for typeOn (spaces kept as spaces so lines still wrap). */
export const chars = (s, idp, esc) => [...String(s || "")].map((ch, i) => `<span class="mk-ch" id="${idp}${i}">${ch === " " ? " " : esc(ch)}</span>`).join("");
