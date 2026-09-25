// Loading bar: a glass panel tips up in 3D, a glowing brand-colour bar fills fast then eases in with a synced %
// counter, a shine sweeps across, and a check pops at 100% (ads/references/retention-transitions.md "hk-loading-bar").
import { CHECK_PATH } from "./_parts.js";

export default {
  id: "loading-bar",
  name: "Loading bar",
  job: "product",
  use: 'Something getting set up, installed or finished quickly ("we set it all up for you", "live in minutes", "it\'s done", "your schedule fills up", "80% of the work is automated").',
  fields: 'text = what is loading, 2–5 words (e.g. "Setting up your clinic"); sub = the percent it fills to (e.g. "100%" or "80%"), default 100.',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: [["whoosh-short", 0, 0.25], ["ticker", 0.38, 0.28], ["ping", 1.65, 0.5]],
  data: (c) => {
    const m = String(c.sub || "").match(/\d+(\.\d+)?/);
    const pct = m ? Math.max(1, Math.min(100, Math.round(Number(m[0])))) : 100;
    return { pct };
  },
  css: ({ px, tall }) => `
      .tp-lb-wrap { width: ${tall ? 80 : 46}%; perspective: ${px(1000)}px; }
      .tp-lb { position: relative; padding: ${px(30)}px ${px(36)}px ${px(34)}px; border-radius: ${px(30)}px; border: 2px solid transparent; transform-origin: 50% 100%; will-change: transform, opacity;
        background: linear-gradient(rgba(22,22,28,.78), rgba(22,22,28,.78)) padding-box, linear-gradient(135deg, rgba(255,255,255,.75), rgba(255,255,255,.12) 30%, rgba(255,255,255,.04) 60%, rgba(255,255,255,.4)) border-box;
        backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 ${px(24)}px ${px(60)}px rgba(0,0,0,.45), 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 18%, transparent); }
      .tp-lb-head { display: flex; align-items: center; justify-content: space-between; gap: ${px(20)}px; }
      .tp-lb-head b { min-width: 0; font-weight: 800; font-size: ${px(38)}px; line-height: 1.15; letter-spacing: -0.01em; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-lb-pct { flex: none; display: flex; align-items: center; gap: ${px(12)}px; }
      .tp-lb-pct em { font-style: normal; font-weight: 800; font-size: ${px(38)}px; color: var(--ac); font-variant-numeric: tabular-nums; text-shadow: 0 0 ${px(16)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .tp-lb-ok { display: grid; place-items: center; width: ${px(46)}px; height: ${px(46)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(20)}px color-mix(in srgb, var(--ac) 70%, transparent); opacity: 0; }
      .tp-lb-ok svg { width: 70%; height: 70%; overflow: visible; }
      .tp-lb-ok path { fill: none; stroke: #000; stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .tp-lb-track { position: relative; height: ${px(24)}px; margin-top: ${px(22)}px; border-radius: 999px; background: rgba(255,255,255,.14); box-shadow: inset 0 1px ${px(3)}px rgba(0,0,0,.35); }
      .tp-lb-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: inherit; overflow: hidden; transform-origin: 0 50%; transform: scaleX(0);
        background: linear-gradient(90deg, color-mix(in srgb, var(--ac) 75%, #000), var(--ac) 60%, color-mix(in srgb, var(--ac) 65%, #fff)); box-shadow: 0 0 ${px(22)}px color-mix(in srgb, var(--ac) 75%, transparent); }
      .tp-lb-fill s { position: absolute; top: 0; bottom: 0; left: -40%; width: 30%; transform: skewX(-20deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent); }`,
  html: ({ id, c, esc, data }) =>
    `<div class="tp-lb-wrap"><div class="tp-lb" id="${id}-card"><div class="tp-lb-head"><b>${esc(c.text || "Loading")}</b><span class="tp-lb-pct"><em id="${id}-pct">0%</em>${data.pct >= 100 ? `<i class="tp-lb-ok" id="${id}-ok"><svg viewBox="0 0 24 24"><path id="${id}-okp" pathLength="100" d="${CHECK_PATH}"/></svg></i>` : ""}</span></div><div class="tp-lb-track"><i class="tp-lb-fill" id="${id}-fill" style="width:${data.pct}%"><s id="${id}-shine"></s></i></div></div></div>`,
  script: `
    var card = el + "-card", f0 = t0 + 0.38, dur = 1.25, pct = c.data.pct || 100;
    tl.fromTo(card, { autoAlpha: 0, rotationX: 40, y: 40, scale: 0.96 }, { autoAlpha: 1, rotationX: 0, y: 0, scale: 1, duration: 0.45, ease: "power3.out", immediateRender: false }, t0);
    tl.fromTo(el + "-fill", { scaleX: 0 }, { scaleX: 1, duration: dur, ease: "power3.out", immediateRender: false }, f0);
    var node = document.querySelector(el + "-pct"), o = { v: 0 };
    if (node) tl.fromTo(o, { v: 0 }, { v: pct, duration: dur, ease: "power3.out", immediateRender: false, onUpdate: function () { node.textContent = Math.round(o.v) + "%"; } }, f0);
    tl.fromTo(el + "-shine", { left: "-40%" }, { left: "130%", duration: 0.6, ease: "power1.inOut", immediateRender: false }, f0 + 0.75);
    // Done: the check pops and draws, the panel gives a small punch.
    var done = t0 + 1.65;
    tl.fromTo(el + "-ok", { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)", immediateRender: false }, done - 0.05);
    tl.fromTo(el + "-okp", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.25, ease: "power3.out", immediateRender: false }, done + 0.08);
    tl.fromTo(card, { scale: 1 }, { scale: 1.025, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, done);
    drift(el + "-card", done + 0.35, out - done - 0.5, 4);`,
};
