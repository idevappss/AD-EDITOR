// Logo reveal (atlas-motion-kit.md #11; Remotion "Reveal"): three accent rings expand out and fade from the centre,
// a warm glow blooms, the mark bursts in (scale 0.4 → 1, turning from −30°, its rays growing), then the wordmark
// rises with wide tracking, a tagline and a display kicker. The ad's logo when uploaded, else the ATLAS mark.
import { ATLAS_MARK, slots } from "./_parts.js";

export default {
  id: "logo-rings",
  name: "Logo reveal",
  job: "product",
  scene: "optional",
  use: 'Introducing the product by name ("meet Atlas", "it\'s called Atlas", "that\'s why we built Atlas"). The big reveal; rotate with the hero logo. Best full-screen.',
  fields: 'text = the wordmark (e.g. "ATLAS"); sub = a tagline, up to ~50 characters (e.g. "AI employees for healthcare business owners."); items = [a kicker, 2–5 words (e.g. "The first of its kind")].',
  position: "top",
  anchor: null,
  minLen: 1.8,
  sfx: [["atlas-impact", 0, 0.9], ["atlas-whoosh", 0.7, 0.5]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-lr { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .tp-lr-glow { position: absolute; left: 50%; top: ${px(150)}px; width: ${px(900)}px; height: ${px(900)}px; margin: ${px(-450)}px 0 0 ${px(-450)}px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--ac) 33%, transparent) 0%, transparent 65%); pointer-events: none; }
      .tp-lr-ring { position: absolute; left: 50%; top: ${px(150)}px; width: ${px(300)}px; height: ${px(300)}px; margin: ${px(-150)}px 0 0 ${px(-150)}px; border-radius: 50%; border: ${px(3)}px solid var(--ac); pointer-events: none; opacity: 0; }
      .tp-lr-mark { position: relative; width: ${px(tall ? 300 : 240)}px; height: ${px(tall ? 300 : 240)}px; color: var(--ac); }
      .tp-lr-mark img { width: 100%; height: 100%; object-fit: contain; }
      .tp-lr-word { position: relative; margin-top: ${px(10)}px; font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 200 : 170)}px; line-height: 1; letter-spacing: .12em; margin-right: -.12em; color: var(--tx); white-space: nowrap; }
      .tp-lr-sub { position: relative; max-width: ${px(820)}px; margin-top: ${px(34)}px; font-family: var(--f-display); font-weight: 700; font-size: ${px(56)}px; line-height: 1.15; color: var(--tx); }
      .tp-lr .mk-kick { position: relative; margin-top: ${px(40)}px; font-size: ${px(28)}px; }
      .ag.tone-accent .tp-lr-mark { color: var(--ink); }
      .ag.tone-accent .tp-lr-mark img { filter: brightness(0) opacity(.85); }
      .ag.tone-accent .tp-lr-ring { border-color: var(--ink); }`,
  html: ({ id, c, esc, logo }) => `<div class="tp-lr" id="${id}-wrap"><i class="tp-lr-glow" id="${id}-glow"></i>${[0, 1, 2].map((k) => `<i class="tp-lr-ring" id="${id}-o${k}"></i>`).join("")}<div class="tp-lr-mark" id="${id}-mark">${logo ? `<img src="${esc(logo)}" alt="" />` : ATLAS_MARK()}</div>${c.text ? `<div class="tp-lr-word" id="${id}-word">${esc(String(c.text).trim())}</div>` : ""}${c.sub ? `<div class="tp-lr-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}${slots(c, 1)[0] ? `<div class="mk-kick display" id="${id}-k">${esc(slots(c, 1)[0])}</div>` : ""}</div>`,
  script: `
    for (var r = 0; r < 3; r++) tl.fromTo(el + "-o" + r, { scale: 1, opacity: 0.5 }, { scale: 5.7, opacity: 0, duration: 1.2, ease: "none", immediateRender: false }, t0 + 0.2 + r * 0.2);
    blurIn(el + "-glow", t0 + 0.2, { y: 0, s: 0.6, b: 0, d: 0.8, e: "power2.out" });
    hide(el + "-mark");
    tl.fromTo(el + "-mark", { autoAlpha: 0, scale: 0.4, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, t0 + 0.2);
    tl.fromTo(el + "-mark .mk-mark g rect", { scaleX: 0.6, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.8, ease: "expo.out", immediateRender: false }, t0 + 0.2);
    blurIn(el + "-word", t0 + 0.73, { y: 60, b: 10, d: 0.7, s: 1 });
    tl.fromTo(el + "-word", { letterSpacing: "0.2em" }, { letterSpacing: "0.12em", duration: 1.2, ease: "expo.out", immediateRender: false }, t0 + 0.73);
    blurIn(el + "-sub", t0 + 1.2, { y: 40, b: 8 });
    blurIn(el + "-k", t0 + 1.4, { y: 12, b: 6 });`,
};
