// Tool map (the Jeremy AI demo, 17–18.5 s): the product as a glowing tile in the middle, the tools it's wired into as
// small glass pills around it (a two-letter badge, the name, a green dot), thin lines from the tile to each, and
// light pulses running out along the lines. A lower third names it.
import { brandMark } from "./_parts.js";

const tools = (c) => (c.items || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 10);
const badge = (s) => {
  const w = String(s).split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : String(s).slice(0, 2)).toUpperCase();
};
const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "tool-map",
  name: "Tool map",
  job: "product",
  scene: "optional",
  use: 'The product plugs into the tools the clinic already uses ("it connects to your GoHighLevel, Meta ads, Stripe, Google Calendar", "wired into everything you use"). Best full-screen.',
  fields: 'items = 4–10 tool names (e.g. "Meta Ads", "GoHighLevel", "Slack", "Gmail", "Google Sheets", "Google Drive", "Google Calendar", "Stripe"); sub = a lower-third line (e.g. "Wired into the tools you already use."); highlight = its mono label (e.g. "Connections").',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => [["atlas-pop", 0.05, 0.5], ...tools(g).map((_, i) => ["atlas-click", r3(0.35 + i * 0.07), 0.2])],
  data: (c) => ({ n: tools(c).length }),
  css: ({ px, W, tall }) => `
      .tp-tm { position: relative; width: ${Math.round(W * (tall ? 0.96 : 0.66))}px; }
      .tp-tm-map { position: relative; height: ${px(tall ? 760 : 520)}px; }
      .tp-tm-map > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-tm-map > svg line { stroke: color-mix(in srgb, var(--ac) 55%, transparent); stroke-width: ${Math.max(1, px(1.6))}; }
      .tp-tm-map > svg circle { fill: #fff; filter: drop-shadow(0 0 ${px(6)}px var(--ac)) drop-shadow(0 0 ${px(14)}px var(--ac)); opacity: 0; }
      .tp-tm-hub { position: absolute; left: 50%; top: 50%; width: ${px(170)}px; height: ${px(170)}px; margin: ${px(-85)}px 0 0 ${px(-85)}px; display: grid; place-items: center; padding: ${px(26)}px; box-sizing: border-box; border-radius: ${px(40)}px; background: linear-gradient(160deg, #3A2E28, #1E1815); color: var(--ac); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(251,241,232,.14), 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 40%, transparent), 0 0 ${px(160)}px color-mix(in srgb, var(--ac) 18%, transparent); }
      .tp-tm-hub img { width: 100%; height: 100%; object-fit: contain; }
      .tp-tm-pill { position: absolute; display: flex; align-items: center; gap: ${px(12)}px; padding: ${px(12)}px ${px(18)}px ${px(12)}px ${px(12)}px; border-radius: ${px(14)}px; transform: translate(-50%, -50%); background: linear-gradient(160deg, #2A221E, #1C1714); box-shadow: inset 0 0 0 1px rgba(251,241,232,.1), 0 ${px(12)}px ${px(30)}px rgba(0,0,0,.35); white-space: nowrap; }
      .ag.tone-paper .tp-tm-pill { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08), 0 ${px(12)}px ${px(30)}px rgba(23,18,15,.12); }
      .tp-tm-pill u { display: grid; place-items: center; width: ${px(34)}px; height: ${px(34)}px; border-radius: ${px(9)}px; background: var(--chip); text-decoration: none; font-weight: 700; font-size: ${px(14)}px; color: var(--tx2); }
      .tp-tm-pill b { font-weight: 600; font-size: ${px(22)}px; color: var(--tx); }
      .tp-tm-pill i { width: ${px(8)}px; height: ${px(8)}px; margin-left: ${px(6)}px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 ${px(8)}px var(--ok); }
      .tp-tm-low { margin-top: ${px(20)}px; padding-left: ${px(30)}px; }
      .tp-tm-low .mk-kick { display: flex; align-items: center; gap: ${px(12)}px; font-size: ${px(24)}px; }
      .tp-tm-low .mk-kick i { width: ${px(12)}px; height: ${px(12)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(14)}px var(--ac); }
      .tp-tm-low .mk-h { margin-top: ${px(12)}px; font-size: ${px(tall ? 64 : 54)}px; text-shadow: none; }`,
  html: ({ id, c, esc, logo, px, W, tall }) => {
    const list = tools(c);
    const w = Math.round(W * (tall ? 0.96 : 0.66));
    const h = px(tall ? 760 : 520);
    const pos = list.map((_, i) => {
      const a = -Math.PI / 2 + (i / list.length) * Math.PI * 2 + 0.3;
      return { x: w / 2 + Math.cos(a) * w * 0.37, y: h / 2 + Math.sin(a) * h * 0.4 };
    });
    return `<div class="tp-tm" id="${id}-wrap"><div class="tp-tm-map" id="${id}-map"><svg viewBox="0 0 ${w} ${h}">${pos.map((p, i) => `<line id="${id}-l${i}" x1="${w / 2}" y1="${h / 2}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/><circle id="${id}-q${i}" r="${px(5)}" cx="${w / 2}" cy="${h / 2}"/>`).join("")}</svg><div class="tp-tm-hub" id="${id}-hub">${brandMark(logo, esc)}</div>${list.map((t, i) => `<div class="tp-tm-pill" id="${id}-p${i}" style="left:${pos[i].x.toFixed(1)}px;top:${pos[i].y.toFixed(1)}px"><u>${esc(badge(t))}</u><b>${esc(t)}</b><i></i></div>`).join("")}</div>${c.sub ? `<div class="tp-tm-low" id="${id}-low"><div class="mk-kick"><i></i>${esc(c.highlight || "Connections")}</div><h3 class="mk-h">${esc(c.sub)}</h3></div>` : ""}</div>`;
  },
  script: `
    var d = c.data, hub = document.querySelector(el + "-hub");
    blurIn(el + "-hub", t0, { y: 0, s: 0.7, b: 12, d: 0.7 });
    for (var i = 0; i < d.n; i++) {
      var ln = document.querySelector(el + "-l" + i);
      if (ln) {
        var x2 = Number(ln.getAttribute("x2")), y2 = Number(ln.getAttribute("y2")), x1 = Number(ln.getAttribute("x1")), y1 = Number(ln.getAttribute("y1"));
        tl.fromTo(ln, { attr: { x2: x1, y2: y1 } }, { attr: { x2: x2, y2: y2 }, duration: 0.5, ease: "expo.out", immediateRender: false }, t0 + 0.25 + i * 0.05);
        // A light pulse runs out along each line, again and again, offset per line.
        for (var p = t0 + 0.7 + (i % 3) * 0.35; p < out - 0.5; p += 1.1) {
          tl.fromTo(el + "-q" + i, { attr: { cx: x1, cy: y1 }, opacity: 0 }, { attr: { cx: x2, cy: y2 }, opacity: 1, duration: 0.7, ease: "power1.in", immediateRender: false }, p);
          tl.set(el + "-q" + i, { opacity: 0 }, p + 0.7);
        }
      }
      blurIn(el + "-p" + i, t0 + 0.35 + i * 0.07, { y: 10, s: 0.9, b: 8, d: 0.5 });
    }
    tl.fromTo(el + "-map", { scale: 1 }, { scale: 1.04, duration: len, ease: "none", immediateRender: false }, t0);
    blurIn(el + "-low", t0 + 0.5, { y: 20, b: 8 });`,
};
