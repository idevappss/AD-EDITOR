// Filling grid (motion-graphics-director, "proof beat: numbers moving — a filling grid, a counter 31% to 94%"): a
// 10 × 10 dot matrix fills with the accent in a diagonal sweep while a big counter runs from the first number to the
// second. A mono kicker above, the thing measured under it.
const nums = (c) => (String(c.text || "").match(/\d+(?:\.\d+)?/g) || []).map(Number);
const target = (c) => { const n = nums(c); return n.length ? n[n.length - 1] : 0; };
const from = (c) => { const n = nums(c); return n.length > 1 ? n[0] : 0; };

export default {
  id: "grid-fill",
  name: "Filling grid",
  job: "data",
  scene: "optional",
  use: 'A share or percentage, ideally a before → after ("from 31% to 94% of leads answered", "9 out of 10 clinics", "80% of your week is admin"). The grid fills while the number counts. Proof beats: put it on the claim it proves.',
  fields: 'text = the number line: one percentage ("94%") or before → after ("31% → 94%"); "9 out of 10" works too; sub = what it measures (3–8 words, e.g. "of leads answered in 5 minutes"); highlight = a mono kicker (e.g. "With Atlas") or empty.',
  position: "center",
  anchor: "number",
  minLen: 2,
  sfx: [["atlas-pop", 0, 0.45], ["atlas-riser", 0.2, 0.3], ["atlas-ding", 1.25, 0.5]],
  data: (c) => {
    const n = nums(c);
    const outOf = /out of|of every|in every/i.test(String(c.text || "")) && n.length >= 2 ? n[1] : 100;
    const pct = n.length >= 2 && outOf !== 100 ? (n[0] / outOf) * 100 : target(c);
    return { to: n.length >= 2 && outOf !== 100 ? n[0] : target(c), from: n.length >= 2 && outOf === 100 ? from(c) : 0, fill: Math.max(0, Math.min(100, Math.round(pct))), suffix: outOf !== 100 ? ` / ${outOf}` : /%/.test(String(c.text)) || outOf === 100 ? "%" : "" };
  },
  css: ({ px, W, tall }) => `
      .tp-gf { width: ${Math.round(W * (tall ? 0.84 : 0.5))}px; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .tp-gf .mk-kick { margin-bottom: ${px(20)}px; }
      .tp-gf-num { font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 210 : 170)}px; line-height: .9; letter-spacing: -0.045em; color: var(--tx); font-variant-numeric: tabular-nums; }
      .tp-gf-num b { color: var(--ac); font-weight: 800; }
      .tp-gf-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: ${px(12)}px; width: ${px(tall ? 620 : 520)}px; margin-top: ${px(40)}px; padding: ${px(30)}px; border-radius: ${px(34)}px; background: rgba(28,22,19,.72); box-shadow: inset 0 0 0 1px rgba(251,241,232,.1); }
      .ag.tone-paper .tp-gf-grid { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08); }
      .tp-gf-grid i { aspect-ratio: 1; border-radius: 50%; background: var(--chip); box-shadow: inset 0 0 0 1px var(--line); }
      .tp-gf-grid i.on { background: var(--ac); box-shadow: 0 0 ${px(12)}px color-mix(in srgb, var(--ac) 55%, transparent); transform: scale(0); }
      .tp-gf-sub { margin-top: ${px(30)}px; font-weight: 600; font-size: ${px(tall ? 46 : 38)}px; line-height: 1.2; color: var(--tx2); }`,
  html: ({ id, c, esc, data }) => {
    const d = data || {};
    const cells = Array.from({ length: 100 }, (_, i) => {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const on = row * 10 + col < (d.fill ?? 0);
      return `<i${on ? ` class="on" data-k="${row + col}"` : ""}></i>`;
    }).join("");
    return `<div class="tp-gf" id="${id}-wrap">${c.highlight ? `<div class="mk-kick" id="${id}-k">${esc(c.highlight)}</div>` : ""}<div class="tp-gf-num" id="${id}-num"><span id="${id}-v">${d.from ?? 0}</span><b>${esc(d.suffix || "")}</b></div><div class="tp-gf-grid" id="${id}-grid">${cells}</div>${c.sub ? `<div class="tp-gf-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}</div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-k", t0, { y: 10, b: 6 });
    blurIn(el + "-num", t0 + 0.05, { y: 24, b: 14 });
    blurIn(el + "-grid", t0 + 0.12, { y: 30, s: 0.96, b: 12 });
    var cells = document.querySelectorAll(el + "-grid i.on");
    for (var i = 0; i < cells.length; i++) tl.fromTo(cells[i], { scale: 0 }, { scale: 1, duration: 0.28, ease: "expo.out", immediateRender: false }, t0 + 0.3 + Number(cells[i].getAttribute("data-k")) * 0.045);
    var node = document.querySelector(el + "-v"), o = { v: d.from };
    if (node) tl.fromTo(o, { v: d.from }, { v: d.to, duration: 1.0, ease: "expo.out", immediateRender: false, onUpdate: function () { node.textContent = Math.round(o.v); } }, t0 + 0.3);
    blurIn(el + "-sub", t0 + 0.5, { y: 14, b: 8 });`,
};
