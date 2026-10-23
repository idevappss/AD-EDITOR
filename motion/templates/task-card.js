// Task card (atlas-motion-kit.md #2): a tilted glass card of what an agent is doing. The items sit dim with empty
// circles and tick green one by one; when the last one lands, "● Working" flips to "● Done".
const r3 = (n) => Math.round(n * 1000) / 1000;
/** When each item ticks, seconds after the start (shared by the animation and the tick sounds). */
export const taskTimes = (duration = 3, n = 3) => {
  const len = Math.max(1.4, Number(duration) || 3);
  const gap = Math.min(0.85, Math.max(0.3, (len - 1.5) / Math.max(1, n)));
  return Array.from({ length: n }, (_, k) => r3(0.75 + k * gap));
};
const list = (c) => (c.items || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 5);

export default {
  id: "task-card",
  name: "Task card",
  job: "proof",
  scene: "optional",
  use: 'The product doing a job step by step, as it\'s described ("it pulls your leads, texts every one, books the consults"). Results ticking off. Prefer this over a checklist when the steps are work being done FOR the viewer.',
  fields: 'text = who and what, 2–5 words (e.g. "Setter · following up"); items = 2–5 short done-steps, 2–5 words each (e.g. "Pulled 23 new leads", "4 consults booked"); sub = the working status, 1 word (default "Working").',
  position: "bottom",
  anchor: null,
  minLen: 2,
  sfx: (g) => [["atlas-pop", 0.05, 0.5], ...taskTimes(g.duration, list(g).length).map((t) => ["atlas-click", t, 0.45]), ["atlas-success", taskTimes(g.duration, list(g).length).at(-1) + 0.45, 0.4]],
  data: (c) => ({ n: list(c).length, times: taskTimes(c.duration, list(c).length) }),
  css: ({ px, W, tall }) => `
      .tp-tk { width: ${Math.round(W * (tall ? 0.84 : 0.44))}px; }
      .tp-tk-card { padding: ${px(30)}px ${px(34)}px ${px(26)}px; transform-origin: 50% 50%; }
      .tp-tk-head { display: flex; align-items: baseline; justify-content: space-between; gap: ${px(20)}px; margin-bottom: ${px(18)}px; }
      .tp-tk-head b { font-weight: 800; font-size: ${px(34)}px; letter-spacing: -0.01em; color: var(--tx); }
      .tp-tk-st { display: grid; font-weight: 600; font-size: ${px(24)}px; white-space: nowrap; }
      .tp-tk-st span { grid-area: 1 / 1; justify-self: end; }
      .tp-tk-row { display: flex; align-items: center; gap: ${px(16)}px; padding: ${px(9)}px 0; font-weight: 500; font-size: ${px(32)}px; color: var(--tx); }
      .tp-tk-row em { font-style: normal; opacity: .42; }
      .tp-tk-row svg { flex: none; width: ${px(38)}px; height: ${px(38)}px; overflow: visible; }
      .tp-tk-row .rim { fill: none; stroke: color-mix(in srgb, var(--tx) 22%, transparent); stroke-width: 1.6; }
      .tp-tk-row .ring, .tp-tk-row .tick { fill: none; stroke: var(--ok); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .tp-tk-row svg { filter: drop-shadow(0 0 ${px(6)}px rgba(61,220,132,.35)); }`,
  html: ({ id, c, esc }) => `<div class="tp-tk mk-3d"><div class="mk-card tp-tk-card" id="${id}-card"><div class="tp-tk-head"><b>${esc(c.text)}</b><span class="tp-tk-st"><span class="st-ac" id="${id}-s1"><i class="mk-dot"></i> ${esc(c.sub || "Working")}</span><span class="st-ok" id="${id}-s2" style="opacity:0"><i class="mk-dot"></i> Done</span></span></div>${list(c).map((it, i) => `<div class="tp-tk-row"><svg viewBox="0 0 24 24"><circle class="rim" cx="12" cy="12" r="10"/><circle class="ring" id="${id}-r${i}" cx="12" cy="12" r="10" pathLength="100" transform="rotate(-90 12 12)"/><path class="tick" id="${id}-k${i}" d="M7.5 12.4l3 3 6-6.4" pathLength="100"/></svg><em id="${id}-t${i}">${esc(it)}</em></div>`).join("")}</div></div>`,
  script: `
    var d = c.data;
    blurIn(el + "-card", t0, { y: 50, b: 16, d: 0.8 });
    settle3d(el + "-card", t0, len, 12, -14);
    for (var i = 0; i < d.n; i++) {
      var at = t0 + d.times[i];
      tl.fromTo(el + "-r" + i, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, at);
      tl.fromTo(el + "-k" + i, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.22, ease: "power2.out", immediateRender: false }, at + 0.22);
      tl.fromTo(el + "-t" + i, { opacity: 0.42 }, { opacity: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, at + 0.1);
    }
    var done = t0 + (d.times[d.n - 1] || 0.8) + 0.45;
    if (done < out - 0.2) {
      tl.fromTo(el + "-s1", { opacity: 1 }, { opacity: 0, duration: 0.2, immediateRender: false }, done);
      tl.fromTo(el + "-s2", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out", immediateRender: false }, done + 0.1);
    }`,
};
