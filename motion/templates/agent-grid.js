// Agent grid (atlas-motion-kit.md #14): a two-column grid of dark cards landing one by one, each numbered in mono
// with a green "● online", a bold name and a muted line. Meet the team.
import { MONO } from "./_parts.js";

const cards = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 8);
const r3 = (n) => Math.round(n * 1000) / 1000;
const gap = (duration, n) => Math.min(0.32, Math.max(0.14, ((Number(duration) || 3) - 1) / Math.max(1, n)));

export default {
  id: "agent-grid",
  name: "Agent grid",
  job: "product",
  scene: "optional",
  use: 'The team of AI agents or roles you get ("an executive assistant, a marketing assistant, a setter, a video editor…", "meet your new team", "pre-trained employees").',
  fields: 'items = 2–8 cards as "Name | what it does" (e.g. "Executive Assistant | Calendar, email, reminders", "Setter | Follows up every lead"); text = a kicker (e.g. "Meet your new team"); highlight = an optional two-tone headline as "line 1 / line 2" (e.g. "AI employees. / Pre-trained."); sub = an optional line under the grid (e.g. "Name them. Group-chat them. Add more anytime.").',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => cards(g).map((_, i) => ["atlas-click", r3(0.45 + i * gap(g.duration, cards(g).length)), 0.35]),
  data: (c) => ({ n: cards(c).length, gap: r3(gap(c.duration, cards(c).length)) }),
  css: ({ px, W, tall }) => `
      .tp-ag { width: ${Math.round(W * (tall ? 0.88 : 0.5))}px; }
      .tp-ag .mk-kick { margin-bottom: ${px(18)}px; }
      .tp-ag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: ${px(14)}px; }
      .tp-ag-card { padding: ${px(18)}px ${px(20)}px ${px(20)}px; border-radius: ${px(20)}px; background: var(--surface); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tx) 8%, transparent), 0 ${px(14)}px ${px(30)}px rgba(0,0,0,.3); }
      .tp-ag-top { display: flex; justify-content: space-between; margin-bottom: ${px(10)}px; font-family: ${MONO}; font-size: ${px(16)}px; letter-spacing: .12em; }
      .tp-ag-top span:first-child { color: var(--ac); }
      .tp-ag-top span:last-child { color: var(--ok); }
      .tp-ag .mk-h { font-size: ${px(tall ? 110 : 92)}px; letter-spacing: -0.035em; line-height: .98; margin: ${px(10)}px 0 ${px(44)}px; }
      .ag.tone-accent .tp-ag-card { background: var(--ink); }
      .ag.tone-accent .tp-ag-card b { color: var(--tx); }
      .ag.tone-accent .tp-ag-sub { color: var(--ink); font-family: var(--f-display); font-weight: 700; }
      .tp-ag-card b { display: block; font-weight: 800; font-size: ${px(30)}px; letter-spacing: -0.015em; line-height: 1.1; color: var(--tx); }
      .tp-ag-card p { margin: ${px(6)}px 0 0; font-weight: 500; font-size: ${px(21)}px; line-height: 1.25; color: color-mix(in srgb, var(--tx) 55%, transparent); }
      .tp-ag-sub { margin-top: ${px(24)}px; text-align: center; font-weight: 600; font-size: ${px(30)}px; color: color-mix(in srgb, var(--tx) 80%, transparent); }`,
  html: ({ id, c, esc }) => `<div class="tp-ag" id="${id}-wrap">${c.text ? `<div class="mk-kick display" id="${id}-k">${esc(c.text)}</div>` : ""}${(() => { const hl = String(c.highlight || "").split(/\s+\/\s+/).map((x) => x.trim()).filter(Boolean); return hl.length ? `<h3 class="mk-h"><span id="${id}-h1">${esc(hl[0])}</span>${hl[1] ? `<span class="ac" id="${id}-h2">${esc(hl[1])}</span>` : ""}</h3>` : ""; })()}<div class="tp-ag-grid">${cards(c).map(([name, what = ""], i) => `<div class="tp-ag-card" id="${id}-c${i}"><div class="tp-ag-top"><span>${String(i + 1).padStart(2, "0")}</span><span>● online</span></div><b>${esc(name)}</b>${what ? `<p>${esc(what)}</p>` : ""}</div>`).join("")}</div>${c.sub ? `<div class="tp-ag-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}</div>`,
  script: `
    var d = c.data;
    blurIn(el + "-k", t0, { y: 8, b: 6 });
    blurIn(el + "-h1", t0 + 0.05, { y: 24, b: 12 });
    blurIn(el + "-h2", t0 + 0.2, { y: 24, b: 12 });
    for (var i = 0; i < d.n; i++) blurIn(el + "-c" + i, t0 + 0.45 + i * d.gap, { y: 80, s: 0.9, b: 8, d: 0.55 });
    blurIn(el + "-sub", t0 + 0.4 + d.n * d.gap, { y: 10 });`,
};
