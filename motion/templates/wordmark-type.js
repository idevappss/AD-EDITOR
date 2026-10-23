// Wordmark lockup (Remotion V1's closing lockup, the Jeremy demo's end card): a big warm glow, the mark in an accent
// tile beside the glowing wordmark, and the prompt question typing itself under it with a caret; the offer and a mono
// audience line fade in at the foot of the frame.
import { ATLAS_MARK, chars, slots } from "./_parts.js";

const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "wordmark-type",
  name: "Wordmark lockup",
  job: "cta",
  scene: "always",
  use: 'A calm closing lockup: the name, the question it answers typing in, and where to go ("so, what should Atlas handle for you today?", the last line before or instead of the offer). Always full-screen; rotate with the end card.',
  fields: 'text = the wordmark (e.g. "ATLAS"); sub = the line that types in (e.g. "What should Atlas handle today?"); items = [the offer line at the foot (e.g. "7-day free trial · app.atlas-ai.club"), a mono audience line (e.g. "AI employees for healthcare owners")]. Write "-" for a slot you leave empty.',
  position: "center",
  anchor: "cta",
  minLen: 2,
  sfx: [["atlas-impact", 0, 0.8], ["atlas-typing", 0.9, 0.35]],
  data: (c) => ({ n: [...String(c.sub || "")].length }),
  css: ({ px, H, tall }) => `
      .tp-wt { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; height: ${H}px; }
      .tp-wt-glow { position: absolute; left: 50%; top: 50%; width: ${px(1000)}px; height: ${px(1000)}px; margin: ${px(-560)}px 0 0 ${px(-500)}px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--ac) 25%, transparent), transparent 60%); }
      .tp-wt-lock { position: relative; display: flex; align-items: center; gap: ${px(28)}px; }
      .tp-wt-tile { display: grid; place-items: center; width: ${px(tall ? 150 : 124)}px; height: ${px(tall ? 150 : 124)}px; padding: ${px(20)}px; box-sizing: border-box; border-radius: ${px(40)}px; background: var(--ac); color: var(--on-ac); box-shadow: 0 0 ${px(70)}px color-mix(in srgb, var(--ac) 55%, transparent); }
      .tp-wt-word { font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 150 : 124)}px; letter-spacing: .09em; line-height: 1; color: var(--tx); text-shadow: 0 0 .25em rgba(251,241,232,.4), 0 0 .6em rgba(251,241,232,.2); }
      .tp-wt-line { position: relative; min-height: ${px(60)}px; margin-top: ${px(40)}px; font-weight: 500; font-size: ${px(46)}px; color: var(--tx2); }
      .tp-wt-foot { position: absolute; left: 0; right: 0; bottom: ${Math.round(H * 0.09)}px; text-align: center; }
      .tp-wt-foot b { display: block; font-weight: 700; font-size: ${px(44)}px; color: var(--tx); }
      .tp-wt-foot small { display: block; margin-top: ${px(16)}px; font-family: var(--f-mono); font-size: ${px(22)}px; letter-spacing: .14em; text-transform: uppercase; color: var(--tx2); }`,
  html: ({ id, c, esc, logo }) => {
    const [offer, aud] = slots(c, 2);
    return `<div class="tp-wt" id="${id}-wrap"><i class="tp-wt-glow" id="${id}-glow"></i><div class="tp-wt-lock" id="${id}-lock"><span class="tp-wt-tile">${logo ? `<img src="${esc(logo)}" alt="" style="width:100%;height:100%;object-fit:contain" />` : ATLAS_MARK()}</span><span class="tp-wt-word">${esc(c.text || "ATLAS")}</span></div>${c.sub ? `<div class="tp-wt-line">${chars(c.sub, `${id}-c`, esc)}<i class="mk-caret" id="${id}-caret"></i></div>` : ""}${offer || aud ? `<div class="tp-wt-foot" id="${id}-foot">${offer ? `<b>${esc(offer)}</b>` : ""}${aud ? `<small>${esc(aud)}</small>` : ""}</div>` : ""}</div>`;
  },
  script: `
    blurIn(el + "-glow", t0, { y: 0, s: 0.7, b: 0, d: 0.9, e: "power2.out" });
    blurIn(el + "-lock", t0, { y: 0, s: 0.9, b: 12, d: 0.8 });
    typeOn(el + "-c", c.data.n, t0 + 0.9, Math.max(0.6, Math.min(1.7, len - 1.6)));
    blink(el + "-caret", t0 + 0.8, out);
    blurIn(el + "-foot", t0 + Math.min(2, len * 0.6), { y: 14, b: 6 });`,
};
