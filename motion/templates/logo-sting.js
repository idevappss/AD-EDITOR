// Logo sting (motion-graphics-director: "match cut: a dot becomes the logo"; "close: logo lockup + one-line tagline +
// URL/CTA, held at least 1.5 s"): a dot appears in the middle, circle-wipes out into the accent field and resolves
// into the mark; the wordmark types in beside it, the tagline lands and the CTA pill rises under it — then it holds.
import { ATLAS_MARK, brandMark } from "./_parts.js";

export default {
  id: "logo-sting",
  name: "Logo sting",
  job: "cta",
  scene: "always",
  use: 'The close as a brand lockup: the mark, the name, one tagline and the CTA, on the final CTA line ("click below and start your seven day free trial"). Always full-screen, at least 2 s. Rotate with the other CTA designs.',
  fields: 'text = the tagline, one line (e.g. "Your AI team, *working today*."); highlight = the CTA pill (the offer\'s CTA, e.g. "Start Your 7 Day Free Trial"); sub = a small mono line under the pill (e.g. "app.atlas-ai.club") or empty; items = [the wordmark, default "ATLAS"].',
  position: "center",
  anchor: "cta",
  minLen: 2,
  sfx: [["atlas-marker", 0, 0.3], ["atlas-whoosh", 0.25, 0.3], ["atlas-impact", 0.55, 0.55], ["atlas-typing", 0.75, 0.25], ["atlas-success", 1.3, 0.45]],
  data: (c) => ({ n: String((c.items || [])[0] || "ATLAS").length }),
  css: ({ px, W, H, tall }) => `
      .tp-ls { position: relative; width: ${W}px; height: ${H}px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
      .tp-ls-field { position: absolute; inset: 0; background: var(--ac); clip-path: circle(0% at 50% 50%); }
      .tp-ls-dot { position: absolute; left: 50%; top: 50%; width: ${px(30)}px; height: ${px(30)}px; margin: ${px(-15)}px 0 0 ${px(-15)}px; border-radius: 50%; background: var(--ac); }
      .tp-ls-lock { position: relative; display: flex; align-items: center; gap: ${px(28)}px; }
      .tp-ls-mark { display: grid; place-items: center; width: ${px(tall ? 170 : 140)}px; height: ${px(tall ? 170 : 140)}px; color: var(--on-ac); }
      .tp-ls-mark img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0) opacity(.9); }
      .tp-ls-word { font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 150 : 124)}px; letter-spacing: .06em; color: var(--on-ac); }
      .tp-ls-tag { position: relative; margin-top: ${px(44)}px; max-width: ${Math.round(W * 0.84)}px; font-family: var(--f-display); font-weight: 700; font-size: ${px(tall ? 64 : 54)}px; line-height: 1.1; letter-spacing: -0.02em; color: var(--on-ac); }
      .tp-ls-pill { position: relative; margin-top: ${px(54)}px; padding: ${px(30)}px ${px(60)}px; border-radius: 999px; background: var(--on-ac); color: var(--ac); font-weight: 700; font-size: ${px(tall ? 46 : 40)}px; box-shadow: 0 ${px(18)}px ${px(40)}px rgba(0,0,0,.22); }
      .tp-ls-sub { position: relative; margin-top: ${px(20)}px; font-family: var(--f-mono); font-size: ${px(24)}px; letter-spacing: .14em; color: color-mix(in srgb, var(--on-ac) 70%, transparent); }`,
  html: ({ id, c, esc, logo }) => {
    const word = String((c.items || [])[0] || "ATLAS");
    return `<div class="tp-ls" id="${id}-wrap"><i class="tp-ls-field" id="${id}-field"></i><i class="tp-ls-dot" id="${id}-dot"></i><div class="tp-ls-lock"><span class="tp-ls-mark" id="${id}-mark">${logo ? brandMark(logo, esc) : ATLAS_MARK()}</span><span class="tp-ls-word">${[...word].map((ch, i) => `<span class="mk-ch" id="${id}-c${i}">${esc(ch)}</span>`).join("")}</span></div>${c.text ? `<div class="tp-ls-tag" id="${id}-tag">${esc(c.text)}</div>` : ""}${c.highlight ? `<div class="tp-ls-pill" id="${id}-pill">${esc(c.highlight)}</div>` : ""}${c.sub ? `<div class="tp-ls-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}</div>`;
  },
  script: `
    tl.fromTo(el + "-dot", { scale: 0 }, { scale: 1, duration: 0.2, ease: "expo.out", immediateRender: false }, t0);
    tl.fromTo(el + "-field", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.55, ease: "expo.inOut", immediateRender: false }, t0 + 0.25);
    tl.set(el + "-dot", { autoAlpha: 0 }, t0 + 0.5);
    blurIn(el + "-mark", t0 + 0.5, { y: 0, s: 0.2, b: 10, d: 0.55 });
    typeOn(el + "-c", c.data.n, t0 + 0.75, Math.min(0.45, c.data.n * 0.07));
    blurIn(el + "-tag", t0 + 1.0, { y: 18, b: 10 });
    blurIn(el + "-pill", t0 + 1.25, { y: 26, s: 0.95, b: 10 });
    blurIn(el + "-sub", t0 + 1.4, { y: 10, b: 6 });`,
};
