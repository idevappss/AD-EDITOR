// Chain stack (Remotion V3 "You → Atlas → Team"): wide rounded rows stacked in the middle and joined by short accent
// bars that grow between them: the first outlined, the second solid accent (the product), the last ink. Each row
// pops in with its name in display type and a mono tag on the right.
const rows = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 4);
const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "chain-stack",
  name: "Chain of command",
  job: "product",
  scene: "optional",
  use: 'Who reports to whom, top down ("you\'re the CEO, Atlas is your COO, your AI team does the work 24/7", "you lead, it manages, they execute"). A simpler, bolder org chart.',
  fields: 'items = 2–4 rows top to bottom as "name | tag" (e.g. "You | CEO", "Atlas | COO", "Your AI team | 24/7"); the second row is the product (solid accent).',
  position: "center",
  anchor: null,
  minLen: 1.6,
  sfx: (g) => rows(g).map((_, i) => ["atlas-pop", r3(0.1 + i * 0.3), 0.55]),
  data: (c) => ({ n: rows(c).length }),
  css: ({ px, W, tall }) => `
      .tp-cs { display: flex; flex-direction: column; align-items: center; }
      .tp-cs-row { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; width: ${px(tall ? 760 : 640)}px; padding: ${px(34)}px ${px(40)}px; border-radius: ${px(40)}px; }
      .tp-cs-row b { font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 70 : 58)}px; letter-spacing: -0.02em; }
      .tp-cs-row small { font-family: var(--f-mono); font-size: ${px(28)}px; letter-spacing: .14em; text-transform: uppercase; opacity: .8; }
      .tp-cs-row.r0 { background: transparent; box-shadow: inset 0 0 0 ${px(3)}px var(--tx); color: var(--tx); }
      .ag.tone-paper .tp-cs-row.r0 { background: #fff; }
      .tp-cs-row.r1 { background: var(--ac); color: var(--on-ac); box-shadow: 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 40%, transparent); }
      .tp-cs-row.r2, .tp-cs-row.r3 { background: var(--ink); color: #FBF1E8; box-shadow: inset 0 0 0 1px rgba(251,241,232,.12); }
      .tp-cs-row.r2 small, .tp-cs-row.r3 small { color: var(--ac); }
      .ag.tone-accent .tp-cs-row.r2 small, .ag.tone-accent .tp-cs-row.r3 small { color: #EE7440; }
      .tp-cs-bar { width: ${px(6)}px; height: ${px(90)}px; background: var(--ac); transform-origin: 50% 0; }`,
  html: ({ id, c, esc }) => `<div class="tp-cs" id="${id}-wrap">${rows(c).map(([name, tag = ""], i) => `${i ? `<i class="tp-cs-bar" id="${id}-b${i}"></i>` : ""}<div class="tp-cs-row r${i}" id="${id}-r${i}"><b>${esc(name)}</b><small>${esc(tag)}</small></div>`).join("")}</div>`,
  script: `
    for (var i = 0; i < c.data.n; i++) {
      var at = t0 + 0.1 + i * 0.3;
      if (i) tl.fromTo(el + "-b" + i, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "expo.out", immediateRender: false }, at - 0.12);
      hide(el + "-r" + i);
      tl.fromTo(el + "-r" + i, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "back.out(1.6)", immediateRender: false }, at);
    }`,
};
