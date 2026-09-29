// Stat rows (atlas-motion-kit.md #10; Remotion V2 "stat counters"): big glowing numbers stacked on the left, each
// with a muted label beside it ("24/7 Always on", "0 Call-offs", "1 Click to approve"). Each row slides in from the
// left and its number counts up (24 → "24/7" keeps its suffix); the second row is in the accent.
const rows = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 4);
const r3 = (n) => Math.round(n * 1000) / 1000;
const gap = (duration, n) => Math.min(0.6, Math.max(0.3, ((Number(duration) || 3) - 1) / Math.max(1, n)));

export default {
  id: "stat-rows",
  name: "Stat rows",
  job: "data",
  scene: "optional",
  use: 'Two to four short numbers said together ("24/7, zero call-offs, one click to approve", "3 agents, 10 minutes, $0 setup"). Not for one big number (that is the number card).',
  fields: 'items = 2–4 rows as "number | label" (e.g. "24/7 | Always on", "0 | Call-offs", "1 | Click to approve"); text = empty or a mono kicker (2–4 words).',
  position: "top",
  anchor: "number",
  minLen: 1.8,
  sfx: (g) => rows(g).map((_, i) => ["atlas-pop", r3(0.15 + i * gap(g.duration, rows(g).length)), 0.6]),
  data: (c) => ({ n: rows(c).length, gap: r3(gap(c.duration, rows(c).length)) }),
  css: ({ px, W, tall }) => `
      .tp-sr { width: ${Math.round(W * (tall ? 0.84 : 0.5))}px; display: flex; flex-direction: column; gap: ${px(tall ? 40 : 26)}px; }
      .tp-sr-row { display: flex; align-items: baseline; gap: ${px(30)}px; }
      .tp-sr-row .mk-h { min-width: ${px(tall ? 380 : 320)}px; font-size: ${px(tall ? 200 : 160)}px; letter-spacing: -0.035em; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .tp-sr-row span { font-weight: 600; font-size: ${px(tall ? 46 : 40)}px; color: var(--tx2); }`,
  html: ({ id, c, esc }) => `<div class="tp-sr" id="${id}-wrap">${c.text ? `<div class="mk-kick" id="${id}-k">${esc(c.text)}</div>` : ""}${rows(c).map(([n, label = ""], i) => `<div class="tp-sr-row" id="${id}-r${i}"><h3 class="mk-h${i === 1 ? " ac" : ""}" id="${id}-n${i}">${esc(n)}</h3><span>${esc(label)}</span></div>`).join("")}</div>`,
  script: `
    var d = c.data;
    blurIn(el + "-k", t0, { y: 10, b: 8 });
    for (var i = 0; i < d.n; i++) {
      var at = t0 + 0.1 + i * d.gap;
      blurIn(el + "-r" + i, at, { x: -80, y: 0, s: 1, b: 10, d: 0.6 });
      // Count the leading number up, keeping whatever follows it ("24/7" counts 0 → 24, then reads 24/7).
      (function (node) {
        if (!node) return;
        var m = node.textContent.match(/^(\\D*?)(\\d+)(.*)$/);
        if (!m || Number(m[2]) < 2) return;
        var o = { v: 0 }, target = Number(m[2]);
        tl.fromTo(o, { v: 0 }, { v: target, duration: 0.6, ease: "expo.out", immediateRender: false, onUpdate: function () { node.textContent = m[1] + Math.round(o.v) + m[3]; } }, at);
      })(document.querySelector(el + "-n" + i));
    }`,
};
