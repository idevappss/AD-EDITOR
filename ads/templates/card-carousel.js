// Card carousel (atlas-motion-kit.md #9; Remotion V2 "3D carousel"): a two-tone headline, then glass cards set
// round a real 3D ring (each rotateY(i·step) translateZ(r)) that turns card to card with an ease-in-out, tipped back a
// little, while a caption under it changes with the card facing you. Card rows can be chat bubbles, calendar
// slots, a bar chart or notes.
import { ATLAS, brandMark } from "./_parts.js";

const cards = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 4)
  .map(([label, rows = "", caption = ""]) => ({ label, rows: rows.split(/\s*;\s*/).filter(Boolean).slice(0, 4), caption }));
const r3 = (n) => Math.round(n * 1000) / 1000;

/** One card row: "them: …" / "us: …" bubbles, "bars: 40,62,80" a chart, "note: …" muted, else a slot (✓ = lit). */
function row(r, last, esc) {
  const m = r.match(/^(them|us|bars|note)\s*:\s*(.*)$/i);
  const kind = m ? m[1].toLowerCase() : "";
  const body = m ? m[2] : r;
  if (kind === "them") return `<div class="cc-b them">${esc(body)}</div>`;
  if (kind === "us") return `<div class="cc-b us">${esc(body)}</div>`;
  if (kind === "note") return `<div class="cc-note">${esc(body)}</div>`;
  if (kind === "bars") {
    const v = body.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n >= 0).slice(0, 7);
    const max = Math.max(1, ...v);
    return `<div class="cc-bars">${v.map((n, i) => `<i class="${i === v.length - 1 ? "hot" : ""}" style="height:${Math.round((n / max) * 100)}%"></i>`).join("")}</div>`;
  }
  const lit = /✓/.test(body) || last;
  return `<div class="cc-row${lit ? " lit" : ""}">${esc(body)}</div>`;
}

export default {
  id: "card-carousel",
  name: "3D card carousel",
  job: "product",
  scene: "optional",
  use: 'Several things the product does, one after another ("it answers leads at midnight, books the consults, runs the ads"). Each job gets a card on a turning 3D ring. Needs 3+ seconds; best full-screen.',
  fields: 'text = headline line 1, 1–3 words (e.g. "One team."); sub = headline line 2 in the accent (e.g. "Never off the clock."); items = 2–4 cards as "LABEL | row; row; row | caption". Rows: "them: …" and "us: …" are chat bubbles, "bars: 40,62,55,80,96" is a bar chart, "note: …" is small muted text, anything else is a slot (the last or one with ✓ is lit). E.g. "Setter | note: 11:47 PM; them: Do you help with sciatica?; us: We do. Thursday 2:30 open? | Leads answered at midnight.", "Calendar | 9:00 New consult; 11:30 Follow-up; 2:30 New consult ✓ | Consults booked for you.", "Marketing | note: This week; bars: 40,62,55,80,96; Ads live · report sent | Ads run. Reports sent."',
  position: "top",
  anchor: null,
  minLen: 2.8,
  sfx: (g) => {
    const n = cards(g).length;
    const turn = Math.max(0.5, (Number(g.duration) || 4) - 1.2);
    return [["atlas-whoosh", 0.1, 0.45], ...Array.from({ length: Math.max(0, n - 1) }, (_, i) => ["atlas-whoosh", r3(0.6 + ((i + 0.5) / Math.max(1, n - 1)) * turn * 0.8), 0.35])];
  },
  data: (c) => ({ n: cards(c).length }),
  css: ({ px, W, tall }) => `
      .tp-cc { position: relative; width: ${Math.round(W * (tall ? 0.84 : 0.5))}px; }
      .tp-cc .mk-h { font-size: ${px(tall ? 92 : 80)}px; }
      .tp-cc-stage { position: relative; height: ${px(tall ? 760 : 560)}px; margin-top: ${px(20)}px; perspective: ${px(2200)}px; }
      .tp-cc-ring { position: absolute; inset: 0; transform-style: preserve-3d; }
      .tp-cc-card { position: absolute; left: 50%; top: ${px(40)}px; width: ${px(tall ? 660 : 520)}px; height: ${px(tall ? 660 : 480)}px; margin-left: ${px(tall ? -330 : -260)}px; display: flex; flex-direction: column; padding: ${px(38)}px; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      .tp-cc-card.mk-card { background: linear-gradient(160deg, rgba(251,241,232,.10), rgba(251,241,232,.03)), ${ATLAS.ink2}; backdrop-filter: none; -webkit-backdrop-filter: none; }
      .tp-cc-head { display: flex; align-items: center; gap: ${px(14)}px; margin-bottom: ${px(20)}px; }
      .tp-cc-mark { width: ${px(48)}px; height: ${px(48)}px; color: var(--ac); }
      .tp-cc-mark img { width: 100%; height: 100%; object-fit: contain; }
      .tp-cc-head .mk-kick { font-size: ${px(24)}px; }
      .cc-note { font-weight: 500; font-size: ${px(28)}px; color: var(--tx2); }
      .cc-b { max-width: 88%; margin-top: ${px(12)}px; padding: ${px(16)}px ${px(22)}px; border-radius: ${px(26)}px; font-weight: 500; font-size: ${px(30)}px; line-height: 1.25; }
      .cc-b.them { align-self: flex-start; background: #fff; color: ${ATLAS.ink}; }
      .cc-b.us { align-self: flex-end; background: var(--ac); color: var(--on-ac); font-weight: 600; }
      .cc-row { margin-top: ${px(12)}px; padding: ${px(16)}px ${px(22)}px; border-radius: ${px(20)}px; background: rgba(251,241,232,.08); font-weight: 600; font-size: ${px(30)}px; color: ${ATLAS.cream}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cc-row.lit { background: var(--ac); color: var(--on-ac); }
      .cc-bars { display: flex; align-items: flex-end; gap: ${px(14)}px; height: ${px(180)}px; margin: ${px(14)}px 0 ${px(6)}px; }
      .cc-bars i { flex: 1; border-radius: ${px(10)}px; background: color-mix(in srgb, var(--ac) 35%, transparent); transform-origin: 50% 100%; }
      .cc-bars i.hot { background: var(--ac); }
      .tp-cc-caps { display: grid; justify-items: center; margin-top: ${px(10)}px; }
      .tp-cc-caps span { grid-area: 1 / 1; font-weight: 600; font-size: ${px(38)}px; color: var(--tx2); opacity: 0; }`,
  html: ({ id, c, esc, logo }) => {
    const list = cards(c);
    const step = 360 / Math.max(3, list.length);
    return `<div class="tp-cc" id="${id}-wrap">${c.text || c.sub ? `<h3 class="mk-h">${c.text ? `<span id="${id}-h1">${esc(c.text)}</span>` : ""}${c.sub ? `<span class="ac" id="${id}-h2">${esc(c.sub)}</span>` : ""}</h3>` : ""}<div class="tp-cc-stage" id="${id}-stage"><div class="tp-cc-ring" id="${id}-ring" data-step="${step}">${list.map((k, i) => `<div class="mk-card tp-cc-card" style="transform: rotateY(${i * step}deg) translateZ(var(--r))"><div class="tp-cc-head"><span class="tp-cc-mark">${brandMark(logo, esc)}</span><span class="mk-kick">${esc(k.label)}</span></div>${k.rows.map((r, j) => row(r, j === k.rows.length - 1 && !k.rows.some((x) => /✓|^(them|us|bars|note)\s*:/i.test(x)), esc)).join("")}</div>`).join("")}</div></div><div class="tp-cc-caps">${list.map((k, i) => `<span id="${id}-c${i}">${esc(k.caption)}</span>`).join("")}</div></div>`;
  },
  script: `
    var d = c.data, ring = document.querySelector(el + "-ring");
    if (ring) ring.style.setProperty("--r", Math.round(ring.offsetWidth * 0.39) + "px");
    var step = ring ? Number(ring.getAttribute("data-step")) : 120;
    blurIn(el + "-h1", t0, { y: 20 });
    blurIn(el + "-h2", t0 + 0.15, { y: 20 });
    blurIn(el + "-stage", t0 + 0.1, { y: 60, s: 0.94, b: 12, d: 0.8 });
    // The ring: tipped back 6°, pushed away, turning card to card over the hold (the V2 ease-in-out).
    var turnAt = t0 + 0.6, turn = Math.max(0.5, len - 1.2), spin = { v: 0 }, caps = [];
    for (var i = 0; i < d.n; i++) caps.push(document.querySelector(el + "-c" + i));
    function paint() {
      if (ring) ring.style.transform = "translateZ(-260px) rotateX(-6deg) rotateY(" + (-spin.v).toFixed(2) + "deg)";
      var k = Math.min(d.n - 1, Math.max(0, Math.round(spin.v / step)));
      caps.forEach(function (cp, j) { if (cp) cp.style.opacity = j === k ? 1 : 0; });
    }
    tl.fromTo(spin, { v: 0 }, { v: (d.n - 1) * step, duration: turn * 0.8, ease: "power2.inOut", immediateRender: false, onUpdate: paint, onStart: paint }, turnAt);
    paint();
    tl.fromTo(el + " .cc-bars i", { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: "expo.out", stagger: 0.05, immediateRender: false }, t0 + 0.5);`,
};
