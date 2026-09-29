// App window (the Jeremy AI demo, 9–15 s): the product's own dashboard as a tilted 3D window (a sidebar, a breadcrumb,
// filter chips and a task table with coloured statuses) settling toward flat while a glowing accent scan line sweeps
// down the rows under a "Looking through your knowledge" chip. A lower third names the moment.
import { ATLAS_MARK, statusTone } from "./_parts.js";

const rows = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 7);
const head = (c) => {
  const [page = "Tasks", chip = ""] = String(c.text || "").split("|").map((s) => s.trim());
  return { page, chip };
};
const NAV = ["New task", "Search", "Tasks", "Recurring", "Files", "Skills"];

export default {
  id: "app-window",
  name: "App window scan",
  job: "product",
  scene: "optional",
  use: 'Showing the product itself working through real work ("it goes through all your files", "every task in one place", "it reads your whole knowledge base"). A tilted dashboard with a scan line; best full-screen.',
  fields: 'text = "Page | chip" (e.g. "Tasks | Looking through your knowledge", or just "Files"); items = 3–7 rows as "Row | Status | time" (e.g. "Diagnose the funnel bottleneck | Working | just now", "Send the May launch email | Approval needed | 12m ago"); sub = a lower-third line (e.g. "Never wonder where a task stands."); highlight = its mono label (e.g. "Tasks").',
  position: "top",
  anchor: null,
  minLen: 2.4,
  sfx: [["atlas-whoosh", 0.02, 0.45], ["atlas-riser", 0.6, 0.25]],
  data: (c) => ({ n: rows(c).length }),
  css: ({ px, W, tall }) => `
      .tp-aw { position: relative; width: ${Math.round(W * (tall ? 0.96 : 0.62))}px; }
      .tp-aw-3d { perspective: ${px(1800)}px; }
      .tp-aw-win { position: relative; display: flex; height: ${px(tall ? 760 : 560)}px; overflow: hidden; border-radius: ${px(28)}px; background: linear-gradient(180deg, #1E1916, #161210); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(251,241,232,.1), 0 ${px(40)}px ${px(100)}px rgba(0,0,0,.5); transform-origin: 50% 50%; }
      .ag.tone-paper .tp-aw-win { background: #fff; box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(23,18,15,.08), 0 ${px(40)}px ${px(90)}px rgba(23,18,15,.14); }
      .tp-aw-side { flex: none; width: 26%; padding: ${px(24)}px ${px(18)}px; border-right: 1px solid var(--line); }
      .tp-aw-brand { display: flex; align-items: center; gap: ${px(10)}px; margin-bottom: ${px(22)}px; font-weight: 700; font-size: ${px(22)}px; color: var(--tx); }
      .tp-aw-brand span { width: ${px(30)}px; height: ${px(30)}px; color: var(--ac); }
      .tp-aw-nav { padding: ${px(9)}px ${px(10)}px; border-radius: ${px(10)}px; font-weight: 500; font-size: ${px(19)}px; color: var(--tx2); }
      .tp-aw-nav.on { background: var(--chip); color: var(--tx); }
      .tp-aw-main { position: relative; flex: 1; min-width: 0; padding: ${px(24)}px ${px(26)}px; }
      .tp-aw-crumb { font-weight: 500; font-size: ${px(19)}px; color: var(--tx2); }
      .tp-aw-crumb b { font-weight: 600; color: var(--tx); }
      .tp-aw-chips { display: flex; gap: ${px(8)}px; margin: ${px(18)}px 0 ${px(14)}px; }
      .tp-aw-chips span { padding: ${px(6)}px ${px(14)}px; border-radius: 999px; background: var(--chip); font-weight: 500; font-size: ${px(16)}px; color: var(--tx2); }
      .tp-aw-chips span:first-child { color: var(--tx); box-shadow: inset 0 0 0 1px var(--line); }
      .tp-aw-row { display: flex; align-items: center; gap: ${px(12)}px; padding: ${px(15)}px ${px(4)}px; border-top: 1px solid var(--line); font-size: ${px(20)}px; }
      .tp-aw-row b { flex: 1; min-width: 0; font-weight: 600; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-aw-row i { flex: none; width: ${px(9)}px; height: ${px(9)}px; border-radius: 50%; background: currentColor; }
      .tp-aw-row em { flex: none; width: 24%; font-style: normal; font-weight: 600; font-size: ${px(17)}px; }
      .tp-aw-row small { flex: none; width: 14%; text-align: right; font-size: ${px(16)}px; color: var(--tx2); }
      .tp-aw-scan { position: absolute; left: 0; right: 0; top: 0; height: ${px(3)}px; background: var(--ac); box-shadow: 0 0 ${px(16)}px var(--ac), 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 60%, transparent); opacity: 0; }
      .tp-aw-scan::after { content: ""; position: absolute; left: 0; right: 0; bottom: 100%; height: ${px(90)}px; background: linear-gradient(0deg, color-mix(in srgb, var(--ac) 16%, transparent), transparent); }
      .tp-aw-chip { position: absolute; top: ${px(18)}px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: ${px(10)}px; padding: ${px(8)}px ${px(18)}px; border-radius: 999px; background: var(--ink2, #231C18); box-shadow: inset 0 0 0 1px rgba(251,241,232,.12); font-weight: 500; font-size: ${px(18)}px; color: #FBF1E8; white-space: nowrap; }
      .tp-aw-chip u { width: ${px(14)}px; height: ${px(14)}px; border-radius: 50%; border: ${px(2)}px solid var(--ac); border-right-color: transparent; }
      .tp-aw-low { margin-top: ${px(56)}px; padding-left: ${px(40)}px; }
      .tp-aw-low .mk-kick { display: flex; align-items: center; gap: ${px(12)}px; font-size: ${px(24)}px; }
      .tp-aw-low .mk-kick i { width: ${px(12)}px; height: ${px(12)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(14)}px var(--ac); }
      .tp-aw-low .mk-h { margin-top: ${px(12)}px; font-size: ${px(tall ? 64 : 54)}px; text-shadow: none; }`,
  html: ({ id, c, esc }) => {
    const h = head(c);
    const list = rows(c);
    return `<div class="tp-aw" id="${id}-wrap"><div class="tp-aw-3d"><div class="tp-aw-win" id="${id}-win"><div class="tp-aw-side"><div class="tp-aw-brand"><span>${ATLAS_MARK()}</span>Atlas</div>${NAV.map((n) => `<div class="tp-aw-nav${n.toLowerCase() === h.page.toLowerCase() ? " on" : ""}">${esc(n)}</div>`).join("")}</div><div class="tp-aw-main"><div class="tp-aw-crumb">Atlas / <b>${esc(h.page)}</b></div><div class="tp-aw-chips"><span>All</span><span>Needs you</span><span>Active</span><span>Completed</span></div><div id="${id}-rows" style="position:relative">${list.map(([name, st = "", when = ""], i) => `<div class="tp-aw-row" id="${id}-r${i}"><i class="st-${statusTone(st)}"></i><b>${esc(name)}</b><em class="st-${statusTone(st)}">${esc(st)}</em><small>${esc(when)}</small></div>`).join("")}<i class="tp-aw-scan" id="${id}-scan"></i></div>${h.chip ? `<div class="tp-aw-chip" id="${id}-chip"><u id="${id}-spin"></u>${esc(h.chip)}</div>` : ""}</div></div></div>${c.sub ? `<div class="tp-aw-low" id="${id}-low"><div class="mk-kick"><i></i>${esc(c.highlight || h.page)}</div><h3 class="mk-h">${esc(c.sub)}</h3></div>` : ""}</div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-win", t0, { y: 80, s: 0.94, b: 10, d: 0.9 });
    settle3d(el + "-win", t0, len, 18, -16);
    tl.fromTo(el + "-win", { rotationZ: 4 }, { rotationZ: 1, duration: len, ease: "sine.out", immediateRender: false }, t0);
    for (var i = 0; i < d.n; i++) blurIn(el + "-r" + i, t0 + 0.3 + i * 0.08, { y: 10, b: 4, d: 0.4, s: 1 });
    blurIn(el + "-chip", t0 + 0.55, { y: -10, b: 6, d: 0.4, s: 1 });
    tl.fromTo(el + "-spin", { rotation: 0 }, { rotation: 360 * Math.max(1, Math.round(len)), duration: len, ease: "none", immediateRender: false }, t0);
    tl.set(el + "-scan", { opacity: 1 }, t0 + 0.6);
    tl.fromTo(el + "-scan", { top: "0%" }, { top: "100%", duration: Math.max(0.8, len - 1.2), ease: "sine.inOut", immediateRender: false }, t0 + 0.6);
    blurIn(el + "-low", t0 + 0.5, { y: 20, b: 8 });`,
};
