// Approval pill (atlas-motion-kit.md #3): an outlined, glowing "● Approval needed" pill alone in the dark; a cursor
// glides in and clicks, and it fills solid accent: "● Approved".
import { CURSOR_SVG } from "./_parts.js";

const click = (duration = 2.4) => Math.round(Math.min(1.25, Math.max(0.7, (Number(duration) || 2.4) * 0.42)) * 1000) / 1000;

export default {
  id: "approval-pill",
  name: "Approval click",
  job: "product",
  scene: "optional",
  use: 'You stay in control with one click ("you just approve it", "one click and it\'s done", "nothing goes out without your OK", "you say yes").',
  fields: 'text = the ask, 1–3 words (default "Approval needed"); sub = after the click, 1–2 words (default "Approved").',
  position: "center",
  anchor: null,
  minLen: 1.8,
  sfx: (g) => [["atlas-ding", 0.05, 0.6], ["atlas-click", click(g.duration), 0.9], ["atlas-success", click(g.duration) + 0.1, 0.6]],
  data: (c) => ({ click: click(c.duration) }),
  css: ({ px }) => `
      .tp-ap { position: relative; padding: ${px(30)}px ${px(40)}px ${px(90)}px; }
      .tp-ap-pill { position: relative; display: grid; border-radius: 999px; }
      .tp-ap-face { grid-area: 1 / 1; display: flex; align-items: center; justify-content: center; gap: ${px(18)}px; padding: ${px(24)}px ${px(46)}px; border-radius: 999px; font-weight: 700; font-size: ${px(46)}px; letter-spacing: -0.015em; white-space: nowrap; }
      .tp-ap-off { color: var(--tx); background: rgba(28,22,19,.78); box-shadow: inset 0 0 0 ${px(3)}px color-mix(in srgb, var(--ac) 80%, transparent), 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 38%, transparent); }
      .tp-ap-off .mk-dot { color: var(--ac); }
      .tp-ap-on { color: var(--on-ac); background: var(--ac); box-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 60%, transparent); opacity: 0; }
      .tp-ap-burst { position: absolute; left: 50%; top: ${px(62)}px; width: ${px(900)}px; height: ${px(900)}px; margin: ${px(-450)}px 0 0 ${px(-450)}px; border-radius: 50%; border: ${px(3)}px solid var(--ac); opacity: 0; pointer-events: none; }
      .tp-ap-cur { position: absolute; left: 62%; top: 58%; width: ${px(58)}px; height: ${px(58)}px; filter: drop-shadow(0 ${px(6)}px ${px(10)}px rgba(0,0,0,.45)); }`,
  html: ({ id, c, esc }) => `<div class="tp-ap" id="${id}-wrap"><i class="tp-ap-burst" id="${id}-burst"></i><div class="tp-ap-pill" id="${id}-pill"><span class="tp-ap-face tp-ap-off"><i class="mk-dot" id="${id}-dot"></i>${esc(c.text || "Approval needed")}</span><span class="tp-ap-face tp-ap-on" id="${id}-on"><i class="mk-dot"></i>${esc(c.sub || "Approved")}</span></div><span class="tp-ap-cur" id="${id}-cur">${CURSOR_SVG}</span></div>`,
  script: `
    var k = t0 + c.data.click;
    blurIn(el + "-pill", t0, { y: 20, s: 0.95 });
    hide(el + "-cur");
    tl.fromTo(el + "-cur", { autoAlpha: 0, x: 180, y: 160 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: "power3.out", immediateRender: false }, k - 0.62);
    tl.fromTo(el + "-cur", { scale: 1 }, { scale: 0.84, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
    tl.fromTo(el + "-pill", { scale: 1 }, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
    if (k - t0 > 0.6) tl.fromTo(el + "-dot", { opacity: 1 }, { opacity: 0.45, duration: 0.2, yoyo: true, repeat: Math.max(1, Math.floor((k - t0 - 0.3) / 0.2)), ease: "sine.inOut", immediateRender: false }, t0 + 0.3);
    tl.fromTo(el + "-burst", { scale: 0.5, opacity: 0.6 }, { scale: 1.5, opacity: 0, duration: 0.9, ease: "expo.out", immediateRender: false }, k + 0.04);
    tl.fromTo(el + "-on", { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out", immediateRender: false }, k + 0.04);
    tl.fromTo(el + "-cur", { autoAlpha: 1 }, { autoAlpha: 0, x: 60, y: 60, duration: 0.4, ease: "power2.in", immediateRender: false }, k + 0.45);`,
};
