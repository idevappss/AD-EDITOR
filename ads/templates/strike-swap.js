// Strike swap (atlas-motion-kit.md #7): a phrase gets a hand-drawn accent line struck across it and dims, then the
// replacement blurs in under it, bigger and in the accent ("no-show." → "Handled.", "runs you." → "runs itself.").
import { slots } from "./_parts.js";

const r3 = (n) => Math.round(n * 1000) / 1000;
const strikeAt = (duration) => r3(Math.min(1.0, Math.max(0.45, (Number(duration) || 2.4) * 0.34)));

export default {
  id: "strike-swap",
  name: "Strike & replace",
  job: "benefit",
  scene: "optional",
  use: 'The old way crossed out and replaced ("your clinic runs you… now it runs itself", "no more no-shows, handled", "not another tool, a team"). The pain phrase, then its fix.',
  fields: 'text = the phrase that gets struck, 1–4 words (e.g. "runs you."); sub = the replacement, 1–3 words (e.g. "runs itself."); items = [an optional lead-in line above both, 1–3 words (e.g. "Your clinic")].',
  position: "top",
  anchor: null,
  minLen: 1.6,
  sfx: (g) => [["atlas-marker", strikeAt(g.duration), 0.9], ["atlas-pop", strikeAt(g.duration) + 0.3, 0.7]],
  data: (c) => ({ strike: strikeAt(c.duration) }),
  css: ({ px, tall }) => `
      .tp-ss2 { display: flex; flex-direction: column; align-items: flex-start; max-width: ${tall ? 86 : 60}%; }
      .tp-ss2 .mk-h { font-size: ${px(tall ? 150 : 120)}px; line-height: .98; letter-spacing: -0.035em; white-space: nowrap; }
      .ag.tone-accent .tp-ss2 .mk-h:not(.ac) { color: var(--peach); }
      .tp-ss2 .tp-ss2-old { position: relative; display: inline-block; }
      .tp-ss2-bar { position: absolute; left: -3%; right: -3%; top: 52%; height: ${px(24)}px; margin-top: ${px(-12)}px; border-radius: ${px(12)}px; background: var(--ac); transform-origin: 0 50%; transform: rotate(-1.2deg) scaleX(0); box-shadow: 0 0 ${px(14)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .ag.tone-accent .tp-ss2-bar { background: var(--ink); box-shadow: none; }
      .tp-ss2-new { font-size: ${px(tall ? 150 : 120)}px !important; margin-top: ${px(10)}px; transform-origin: 0 50%; }`,
  html: ({ id, c, esc }) => `<div class="tp-ss2" id="${id}-wrap">${slots(c, 1)[0] ? `<h3 class="mk-h" id="${id}-lead">${esc(slots(c, 1)[0])}</h3>` : ""}<h3 class="mk-h"><span class="tp-ss2-old" id="${id}-old">${esc(c.text)}<i class="tp-ss2-bar" id="${id}-line"></i></span></h3>${c.sub ? `<h3 class="mk-h ac tp-ss2-new" id="${id}-new">${esc(c.sub)}</h3>` : ""}</div>`,
  script: `
    var s = t0 + c.data.strike;
    blurIn(el + "-lead", t0, { y: 16 });
    blurIn(el + "-old", t0 + 0.1, { y: 16 });
    tl.fromTo(el + "-line", { scaleX: 0, rotation: -1.2 }, { scaleX: 1, rotation: -1.2, duration: 0.4, ease: "power2.inOut", immediateRender: false }, s);
    tl.fromTo(el + "-old", { opacity: 1 }, { opacity: 0.45, duration: 0.3, ease: "power1.out", immediateRender: false }, s + 0.2);
    blurIn(el + "-new", s + 0.3, { y: 24, b: 18, d: 0.6 });`,
};
