// Bar proof (motion-graphics-director, "bar chart with the last bar highlighted"): 3–7 bars rise one after another in
// quiet glass, and the last one — the result — rises highest in the accent with its value counting up above it.
const bars = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0] && /\d/.test(r[1] || r[0])).slice(0, 7);
const val = (s) => Number((String(s || "").match(/\d+(?:\.\d+)?/) || [0])[0]);
const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "bar-proof",
  name: "Bar proof",
  job: "data",
  scene: "optional",
  use: 'Growth or a before/after told as a climb ("from 12 bookings a week to 40", "revenue month over month", "hours saved each week"). The last bar is the payoff, in the accent.',
  fields: 'items = 3–7 bars in order as "label | value" (e.g. "Jan | 12", "Feb | 18", "Mar | 26", "With Atlas | 40"); the last is the hero; text = headline (2–5 words, e.g. "Bookings, *every* week."); sub = a mono unit or caption (e.g. "consults booked / week"); highlight = a prefix/suffix for the hero value ("$", "k", "+", "%") or empty.',
  position: "center",
  anchor: "number",
  minLen: 2,
  sfx: (g) => [...bars(g).map((_, i) => ["atlas-click", r3(0.2 + i * 0.12), 0.2]), ["atlas-ding", r3(0.25 + bars(g).length * 0.12), 0.5]],
  data: (c) => {
    const b = bars(c);
    const max = Math.max(1, ...b.map((r) => val(r[1] ?? r[0])));
    return { n: b.length, hs: b.map((r) => Math.max(0.06, val(r[1] ?? r[0]) / max)), hero: val((b.at(-1) || [])[1] ?? (b.at(-1) || [])[0]) };
  },
  css: ({ px, W, tall }) => `
      .tp-bp { width: ${Math.round(W * (tall ? 0.86 : 0.56))}px; }
      .tp-bp .mk-h { font-size: ${px(tall ? 84 : 70)}px; margin-bottom: ${px(40)}px; }
      .tp-bp-chart { display: flex; align-items: flex-end; gap: ${px(18)}px; height: ${px(tall ? 560 : 420)}px; padding: ${px(30)}px ${px(30)}px 0; border-radius: ${px(34)}px ${px(34)}px 0 0; border-bottom: ${px(3)}px solid var(--line); }
      .tp-bp-col { position: relative; flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
      .tp-bp-bar { width: 100%; border-radius: ${px(18)}px ${px(18)}px ${px(6)}px ${px(6)}px; background: rgba(251,241,232,.14); box-shadow: inset 0 0 0 1px rgba(251,241,232,.1); transform-origin: 50% 100%; }
      .ag.tone-paper .tp-bp-bar { background: rgba(23,18,15,.1); }
      .tp-bp-col.hero .tp-bp-bar { background: var(--ac); box-shadow: 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .tp-bp-val { margin-bottom: ${px(14)}px; font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 64 : 54)}px; letter-spacing: -0.03em; color: var(--ac); font-variant-numeric: tabular-nums; white-space: nowrap; }
      .tp-bp-labels { display: flex; gap: ${px(18)}px; padding: ${px(16)}px ${px(30)}px 0; }
      .tp-bp-labels span { flex: 1; text-align: center; font-family: var(--f-mono); font-size: ${px(20)}px; letter-spacing: .08em; text-transform: uppercase; color: var(--tx2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-bp-labels span:last-child { color: var(--ac); }
      .tp-bp-sub { margin-top: ${px(22)}px; font-family: var(--f-mono); font-size: ${px(22)}px; letter-spacing: .14em; text-transform: uppercase; color: var(--tx2); }`,
  html: ({ id, c, esc, data }) => {
    const b = bars(c);
    const d = data || {};
    const pre = /^[$£€+]$/.test(c.highlight || "") ? c.highlight : "";
    const post = pre ? "" : esc(c.highlight || "");
    return `<div class="tp-bp" id="${id}-wrap">${c.text ? `<h3 class="mk-h" id="${id}-h">${esc(c.text)}</h3>` : ""}<div class="tp-bp-chart">${b.map((r, i) => `<div class="tp-bp-col${i === b.length - 1 ? " hero" : ""}">${i === b.length - 1 ? `<div class="tp-bp-val" id="${id}-v">${esc(pre)}<span id="${id}-vn">0</span>${post}</div>` : ""}<div class="tp-bp-bar" id="${id}-b${i}" style="height:${Math.round((d.hs?.[i] ?? 0.5) * (i === b.length - 1 ? 82 : 100))}%"></div></div>`).join("")}</div><div class="tp-bp-labels">${b.map((r) => `<span>${esc(r.length > 1 ? r[0] : "")}</span>`).join("")}</div>${c.sub ? `<div class="tp-bp-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}</div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-h", t0, { y: 20, b: 12 });
    for (var i = 0; i < d.n; i++) tl.fromTo(el + "-b" + i, { scaleY: 0 }, { scaleY: 1, duration: 0.55, ease: "expo.out", immediateRender: false }, t0 + 0.2 + i * 0.12);
    var at = t0 + 0.2 + (d.n - 1) * 0.12;
    blurIn(el + "-v", at + 0.1, { y: 16, b: 8, d: 0.5 });
    var node = document.querySelector(el + "-vn"), o = { v: 0 };
    if (node) tl.fromTo(o, { v: 0 }, { v: d.hero, duration: 0.8, ease: "expo.out", immediateRender: false, onUpdate: function () { node.textContent = d.hero % 1 ? o.v.toFixed(1) : Math.round(o.v); } }, at + 0.1);
    blurIn(el + "-sub", t0 + 0.4, { y: 10, b: 6 });`,
};
