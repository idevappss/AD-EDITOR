// Glass message: a wide, nearly clear liquid-glass pill lifts up in 3D like a DM arriving, with a green app badge,
// a faint mirrored reflection under it and one specular sweep (ads/references/glass-ui.md "glass-float-notif").
import { initial, mark } from "./_parts.js";

export default {
  id: "glass-notif",
  name: "Glass message",
  job: "proof",
  use: 'A real person\'s message, DM, lead or booking coming in ("I got a text from…", "patients DM me", "my phone blew up", "she messaged me after one visit"). Proof in their words.',
  fields: 'text = the sender, 1–3 words (e.g. "Sarah M."); sub = the message, up to ~60 characters (e.g. "Just booked my 3rd visit!").',
  position: "top",
  anchor: null,
  minLen: 1.8,
  sfx: [["air", 0.12, 0.3], ["ping", 0.42, 0.5]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-gn { position: relative; width: ${tall ? 84 : 46}%; perspective: ${px(1400)}px; padding-bottom: ${px(26)}px; }
      .tp-gn-pill { position: relative; display: flex; align-items: center; gap: ${px(26)}px; padding: ${px(20)}px ${px(44)}px ${px(20)}px ${px(20)}px; border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,.05) 46%, rgba(255,255,255,.02)), rgba(14,14,18,.26);
        backdrop-filter: blur(${px(9)}px) saturate(1.4) brightness(1.05); -webkit-backdrop-filter: blur(${px(9)}px) saturate(1.4) brightness(1.05);
        box-shadow: 0 ${px(30)}px ${px(60)}px rgba(0,0,0,.35), inset ${px(2)}px ${px(2)}px 0 rgba(255,255,255,.5), inset ${px(-1)}px ${px(-1)}px 0 rgba(255,255,255,.12);
        transform-origin: 50% 100%; will-change: transform, opacity; }
      .tp-gn-pill::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: ${px(2)}px; pointer-events: none;
        background: linear-gradient(125deg, rgba(255,255,255,.9), rgba(255,255,255,.1) 38%, rgba(255,255,255,.04) 60%, rgba(255,255,255,.45));
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
      .tp-gn-spec { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }
      .tp-gn-spec i { position: absolute; top: -30%; bottom: -30%; left: -40%; width: 26%; transform: skewX(-20deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.34), transparent); }
      .tp-gn-av { position: relative; flex: none; width: ${px(112)}px; height: ${px(112)}px; }
      .tp-gn-face { display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: linear-gradient(145deg, #3a3a40, #0e0e10); color: #fff; font-weight: 900; font-size: ${px(50)}px;
        box-shadow: 0 0 ${px(26)}px rgba(37,211,102,.5), 0 0 0 ${px(3)}px rgba(255,255,255,.28); }
      .tp-gn-face img { width: 100%; height: 100%; object-fit: contain; padding: 16%; box-sizing: border-box; background: #fff; }
      .tp-gn-badge { position: absolute; right: ${px(-4)}px; bottom: ${px(-4)}px; display: grid; place-items: center; width: ${px(44)}px; height: ${px(44)}px; border-radius: 50%; background: #25D366; box-shadow: 0 0 0 ${px(3)}px rgba(255,255,255,.92), 0 0 ${px(18)}px rgba(37,211,102,.7); }
      .tp-gn-badge svg { width: 58%; height: 58%; }
      .tp-gn-body { min-width: 0; flex: 1; text-shadow: 0 1px ${px(3)}px rgba(0,0,0,.35); }
      .tp-gn-body b { display: block; font-weight: 700; font-size: ${px(40)}px; line-height: 1.15; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-gn-body p { margin: ${px(4)}px 0 0; font-weight: 500; font-size: ${px(34)}px; line-height: 1.22; color: #F2F2F7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .tp-gn-mirror { position: absolute; left: 0; right: 0; top: calc(100% - ${px(22)}px); transform: scaleY(-0.6); transform-origin: 50% 0; filter: blur(${px(7)}px); opacity: 0; pointer-events: none;
        -webkit-mask-image: linear-gradient(to top, #000, transparent 70%); mask-image: linear-gradient(to top, #000, transparent 70%); }
      .tp-gn-mirror .tp-gn-pill { box-shadow: none; }
      .tp-gn-pool { position: absolute; left: 6%; right: 40%; top: calc(100% - ${px(46)}px); height: ${px(90)}px; border-radius: 50%; background: radial-gradient(closest-side, rgba(37,211,102,.4), transparent); mix-blend-mode: screen; opacity: 0; pointer-events: none; }`,
  html: ({ id, c, esc, logo }) => {
    const name = String(c.text || "New message").trim();
    const inner = `<span class="tp-gn-av"><span class="tp-gn-face">${mark(logo, initial(name), esc)}</span><i class="tp-gn-badge"><svg viewBox="0 0 24 24"><path fill="#fff" d="M12 3.5c-4.8 0-8.6 3.4-8.6 7.6 0 2.2 1 4.1 2.7 5.5L5.4 20l4-1.9c.8.2 1.7.3 2.6.3 4.8 0 8.6-3.4 8.6-7.6S16.8 3.5 12 3.5z"/></svg></i></span><div class="tp-gn-body"><b>${esc(name)}</b>${c.sub ? `<p>${esc(c.sub)}</p>` : ""}</div>`;
    return `<div class="tp-gn" id="${id}-wrap"><i class="tp-gn-pool" id="${id}-pool"></i><div class="tp-gn-pill" id="${id}-card">${inner}<span class="tp-gn-spec"><i id="${id}-spec"></i></span></div><div class="tp-gn-mirror" id="${id}-mir" aria-hidden="true"><div class="tp-gn-pill">${inner}</div></div></div>`;
  },
  script: `
    var card = el + "-card";
    // Lift: out of the lower edge, small and tipped back, flattening as it rises. Fast launch, soft landing, no bounce.
    tl.fromTo(card, { autoAlpha: 0, y: 220, scale: 0.35, rotationX: 25 }, { autoAlpha: 1, y: 0, scale: 1, rotationX: -6, duration: 0.5, ease: "expo.out", immediateRender: false }, t0);
    tl.fromTo(card, { rotationX: -6 }, { rotationX: 0, duration: 0.8, ease: "sine.inOut", immediateRender: false }, t0 + 0.5);
    tl.fromTo(el + "-mir", { opacity: 0 }, { opacity: 0.35, duration: 0.2, ease: "power1.out", immediateRender: false }, t0 + 0.34);
    tl.fromTo(el + "-pool", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out", immediateRender: false }, t0 + 0.34);
    tl.fromTo(el + "-spec", { left: "-40%" }, { left: "130%", duration: 0.9, ease: "power2.inOut", immediateRender: false }, t0 + 0.8);
    drift(el + "-wrap", t0 + 0.9, out - t0 - 1.2, 3);
    // Exit: reflection and glow go first, then the pill drops back toward where it came from.
    var x = Math.max(t0 + 1.0, out - 0.3);
    tl.fromTo(el + "-mir", { opacity: 0.35 }, { opacity: 0, duration: 0.1, immediateRender: false }, x);
    tl.fromTo(el + "-pool", { opacity: 1 }, { opacity: 0, duration: 0.1, immediateRender: false }, x);
    tl.fromTo(card, { y: 0, scale: 1 }, { y: 150, scale: 0.4, duration: 0.3, ease: "power3.in", immediateRender: false }, x);`,
};
