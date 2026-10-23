// Light trail → prompt (atlas-motion-kit.md #1): a glowing dot rises from below drawing a thin accent line that curves
// into the top-left corner of a glass prompt box; the box fades in as the trail fades, the heading blurs in above
// and the prompt types itself. The send button lights up when it's done.
import { chars, slots } from "./_parts.js";

const size = (W, tall) => Math.round(W * (tall ? 0.84 : 0.44));

export default {
  id: "trail-prompt",
  name: "Light-trail prompt",
  job: "product",
  scene: "optional",
  use: 'Telling the AI what to do, in the speaker\'s words ("you just tell it…", "ask it to follow up with every lead", "type what you need"). The signature Atlas opener.',
  fields: 'sub = the heading question, up to ~40 characters (e.g. "What should Atlas handle today?"); text = the prompt as typed, up to ~70 characters (e.g. "Follow up with every lead from this week\'s ads."); items = [a small hint line under the box, optional].',
  position: "top",
  anchor: null,
  minLen: 2.4,
  sfx: (g) => {
    const t = times(g.duration, String(g.text || "").length);
    return [["atlas-riser", 0, 0.5], ["atlas-whoosh", t.card, 0.5], ["atlas-typing", t.type, 0.4], ["atlas-click", t.sent, 0.8], ["atlas-pop", t.sent + 0.2, 0.5]];
  },
  data: (c) => ({ n: [...String(c.text || "")].length, ...times(c.duration, [...String(c.text || "")].length) }),
  css: ({ px, W, tall }) => `
      .tp-trp { position: relative; width: ${size(W, tall)}px; }
      .tp-trp-h { margin-bottom: ${px(40)}px; text-align: center; font-weight: 700; font-size: ${px(tall ? 70 : 60)}px; }
      .tp-trp-stage { position: relative; }
      .tp-trp-svg { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; }
      .tp-trp-path { fill: none; stroke: var(--ac); stroke-width: ${px(10)}; stroke-linecap: round; filter: blur(${px(6)}px); }
      .tp-trp-core { fill: none; stroke: #FBF1E8; stroke-width: ${px(3)}; stroke-linecap: round; }
      .tp-trp-halo { fill: var(--ac); opacity: .5; filter: blur(${px(6)}px); }
      .tp-trp-dot { fill: #fff; }
      .tp-trp-box { display: flex; flex-direction: column; justify-content: space-between; min-height: ${px(200)}px; padding: ${px(30)}px ${px(34)}px ${px(24)}px; }
      .tp-trp-text { font-weight: 500; font-size: ${px(44)}px; line-height: 1.3; letter-spacing: -0.01em; color: var(--tx); min-height: 2.6em; }
      .tp-trp-row { display: flex; align-items: center; justify-content: space-between; margin-top: ${px(14)}px; }
      .tp-trp-plus { font-weight: 400; font-size: ${px(44)}px; line-height: 1; color: color-mix(in srgb, var(--tx) 50%, transparent); }
      .tp-trp-send { position: relative; display: grid; place-items: center; width: ${px(66)}px; height: ${px(66)}px; border-radius: 50%; background: color-mix(in srgb, var(--tx) 10%, transparent); color: color-mix(in srgb, var(--tx) 50%, transparent); }
      .tp-trp-send i { position: absolute; inset: 0; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(26)}px color-mix(in srgb, var(--ac) 70%, transparent); opacity: 0; }
      .tp-trp-send svg { position: relative; width: 50%; height: 50%; }
      .tp-trp-hint { margin-top: ${px(18)}px; text-align: center; font-weight: 500; font-size: ${px(24)}px; color: color-mix(in srgb, var(--tx) 42%, transparent); }`,
  html: ({ id, c, esc, px, W, tall }) => {
    const bw = size(W, tall);
    const R = px(34);
    const drop = px(tall ? 1100 : 620);
    const run = Math.round(bw * 0.78);
    const d = `M 0 ${drop} V ${R} A ${R} ${R} 0 0 1 ${R} 0 H ${run}`;
    return `<div class="tp-trp" id="${id}-wrap">${c.sub ? `<h3 class="mk-h tp-trp-h" id="${id}-h">${esc(c.sub)}</h3>` : ""}<div class="tp-trp-stage"><div class="mk-card tp-trp-box" id="${id}-card"><div class="tp-trp-text">${chars(c.text, `${id}-c`, esc)}<i class="mk-caret" id="${id}-caret"></i></div><div class="tp-trp-row"><span class="tp-trp-plus">+</span><span class="tp-trp-send" id="${id}-send"><i id="${id}-lit"></i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span></div></div><svg class="tp-trp-svg" id="${id}-svg" width="${bw}" height="${drop}" viewBox="0 0 ${bw} ${drop}"><path class="tp-trp-path" id="${id}-glow" d="${d}"/><path class="tp-trp-core" id="${id}-path" d="${d}"/><circle class="tp-trp-halo" id="${id}-halo" r="${px(34)}" cx="0" cy="${drop}"/><circle class="tp-trp-dot" id="${id}-dot" r="${px(10)}" cx="0" cy="${drop}"/></svg></div>${slots(c, 1)[0] ? `<div class="tp-trp-hint" id="${id}-hint">${esc(slots(c, 1)[0])}</div>` : ""}</div>`;
  },
  script: `
    var d = c.data, path = document.querySelector(el + "-path"), glow = document.querySelector(el + "-glow"), dot = document.querySelector(el + "-dot"), halo = document.querySelector(el + "-halo");
    if (path) {
      var L = path.getTotalLength(), o = { v: 0 };
      path.style.strokeDasharray = L; path.style.strokeDashoffset = L; glow.style.strokeDasharray = L; glow.style.strokeDashoffset = L;
      tl.fromTo(o, { v: 0 }, { v: 1, duration: d.trail, ease: "power2.inOut", immediateRender: false, onUpdate: function () {
        var p = path.getPointAtLength(o.v * L);
        path.style.strokeDashoffset = L * (1 - o.v); glow.style.strokeDashoffset = L * (1 - o.v);
        dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); halo.setAttribute("cx", p.x); halo.setAttribute("cy", p.y);
      } }, t0);
      tl.fromTo([el + "-path", el + "-glow", el + "-dot", el + "-halo"], { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power1.in", immediateRender: false }, t0 + d.card + 0.15);
    }
    hide(el + "-card");
    tl.fromTo(el + "-card", { autoAlpha: 0, filter: "blur(8px)" }, { autoAlpha: 1, filter: "blur(0px)", duration: 0.6, ease: "power2.out", immediateRender: false }, t0 + d.card);
    blurIn(el + "-h", t0 + d.card - 0.15, { y: 18 });
    blurIn(el + "-hint", t0 + d.card + 0.3, { y: 10, b: 8 });
    typeOn(el + "-c", d.n, t0 + d.type, d.typeLen);
    blink(el + "-caret", t0 + d.card, out);
    tl.fromTo(el + "-lit", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out", immediateRender: false }, t0 + d.sent);
    tl.fromTo(el + "-send", { color: "color-mix(in srgb, var(--tx) 50%, transparent)" }, { color: "var(--on-ac)", duration: 0.25, immediateRender: false }, t0 + d.sent);
    tl.fromTo(el + "-send", { scale: 1 }, { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, t0 + d.sent);`,
};

/** Beats, seconds after the start: trail draws, the box appears, typing, send. Shared by the animation and sfx. */
function times(duration = 3, n = 0) {
  const len = Math.max(1.2, Number(duration) || 3);
  const trail = Math.min(0.95, len * 0.28);
  const card = trail * 0.85;
  const type = card + 0.35;
  const typeLen = Math.max(0.5, Math.min(n / 20, len - type - 0.9));
  return { trail: r3(trail), card: r3(card), type: r3(type), typeLen: r3(typeLen), sent: r3(Math.min(len - 0.5, type + typeLen + 0.2)) };
}
const r3 = (n) => Math.round(n * 1000) / 1000;
