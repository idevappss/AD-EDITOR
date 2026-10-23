// Task board (atlas-motion-kit.md #4): a tilted glass table, "TASKS · THIS WEEK", rows adding one at a time with a
// coloured status on the right (● Done / ● Scheduled / ● In progress / ● Needs approval). Optional line under it.
import { statusTone } from "./_parts.js";

const rows = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 6);
const r3 = (n) => Math.round(n * 1000) / 1000;
const gap = (duration, n) => Math.min(0.5, Math.max(0.18, ((Number(duration) || 3) - 1.4) / Math.max(1, n)));

export default {
  id: "task-board",
  name: "Task board",
  job: "product",
  scene: "optional",
  use: 'Seeing everything at a glance, many jobs handled at once ("you see every task, what\'s done and what\'s next", "never wonder where anything stands", a week of work handled).',
  fields: 'text = a mono kicker, 2–4 words (default "Tasks · this week"); items = 3–6 rows as "Task | Status" (status one of Done, Scheduled · Fri, In progress, Needs approval), e.g. "Weekly ads report | Scheduled · Fri"; sub = a short line under the board or empty (e.g. "Never wonder where anything stands."), shown as a lower third with a mono label (highlight, e.g. "Tasks").',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => [["atlas-whoosh", 0.02, 0.45], ...rows(g).map((_, i) => ["atlas-click", r3(0.5 + i * gap(g.duration, rows(g).length)), 0.2])],
  data: (c) => ({ n: rows(c).length, gap: r3(gap(c.duration, rows(c).length)) }),
  css: ({ px, W, tall }) => `
      .tp-tb { width: ${Math.round(W * (tall ? 0.84 : 0.44))}px; }
      .tp-tb-card { padding: ${px(26)}px ${px(32)}px ${px(20)}px; }
      .tp-tb-card .mk-kick { font-size: ${px(20)}px; margin-bottom: ${px(10)}px; }
      .tp-tb-row { display: flex; align-items: center; justify-content: space-between; gap: ${px(18)}px; padding: ${px(13)}px 0; border-top: 1px solid color-mix(in srgb, var(--tx) 7%, transparent); }
      .tp-tb-row b { font-weight: 600; font-size: ${px(30)}px; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-tb-row span { flex: none; display: inline-flex; align-items: center; gap: ${px(8)}px; font-weight: 600; font-size: ${px(22)}px; white-space: nowrap; }
      .tp-tb-row span .mk-dot { width: ${px(10)}px; height: ${px(10)}px; }
      .tp-tb-low { margin-top: ${px(60)}px; }
      .tp-tb-low .mk-kick { display: flex; align-items: center; gap: ${px(12)}px; font-size: ${px(24)}px; }
      .tp-tb-low .mk-kick i { width: ${px(12)}px; height: ${px(12)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(14)}px var(--ac); }
      .tp-tb-sub { margin-top: ${px(12)}px; font-size: ${px(tall ? 66 : 56)}px; letter-spacing: -0.03em; line-height: 1.05; text-shadow: none; }`,
  html: ({ id, c, esc }) => `<div class="tp-tb mk-3d"><div class="mk-card tp-tb-card" id="${id}-card"><div class="mk-kick dim">${esc(c.text || "Tasks · this week")}</div>${rows(c).map(([task, st = "Done"], i) => `<div class="tp-tb-row" id="${id}-r${i}"><b>${esc(task)}</b><span class="st-${statusTone(st)}"><i class="mk-dot"></i>${esc(st)}</span></div>`).join("")}</div>${c.sub ? `<div class="tp-tb-low" id="${id}-sub"><div class="mk-kick"><i></i>${esc(c.highlight || "Tasks")}</div><h3 class="mk-h tp-tb-sub">${esc(c.sub)}</h3></div>` : ""}</div>`,
  script: `
    var d = c.data;
    blurIn(el + "-card", t0, { y: 40, b: 16, d: 0.8 });
    settle3d(el + "-card", t0, len, 16, -18);
    for (var i = 0; i < d.n; i++) blurIn(el + "-r" + i, t0 + 0.45 + i * d.gap, { y: 12, b: 8, d: 0.45, s: 1 });
    blurIn(el + "-sub", t0 + 0.6, { y: 16 });`,
};
