// Glow pulse: a dark card floats in, then floods the brand colour in one hard flash that throws a room-wide glow and
// tilts the card, a light blob sweeps across it, and it settles back to dark (ads/references/glass-ui.md
// "glow-tint-pulse"). One flash, never a strobe.

export default {
  id: "glow-pulse",
  name: "Glow pulse",
  job: "benefit",
  use: 'One hard emphasis beat: a price, a result or "the biggest one" ("only $99", "zero missed calls", "the biggest one is…", "back to golf in 3 weeks"). At most once per ad.',
  fields: 'text = the emphasis, 1–4 words (e.g. "Only $99"); sub = a short second line, 2–5 words, or empty.',
  position: "center",
  anchor: null,
  minLen: 1.8,
  sfx: [["whoosh-short", 0, 0.3], ["boom", 0.62, 0.5]],
  data: (c) => {
    const n = String(c.text || "").trim().length;
    return { size: n <= 10 ? 104 : n <= 18 ? 86 : n <= 28 ? 70 : 58 };
  },
  css: ({ px, tall }) => `
      .tp-gp { position: relative; display: flex; justify-content: center; max-width: ${tall ? 84 : 60}%; perspective: ${px(1200)}px; }
      .tp-gp-room { position: absolute; left: 50%; top: 50%; width: ${px(1900)}px; height: ${px(1900)}px; margin: ${px(-950)}px 0 0 ${px(-950)}px; border-radius: 50%; pointer-events: none; opacity: 0;
        background: radial-gradient(closest-side, color-mix(in srgb, var(--ac) 75%, transparent), color-mix(in srgb, var(--ac) 28%, transparent) 42%, transparent); mix-blend-mode: screen; }
      .tp-gp-card { position: relative; overflow: hidden; padding: ${px(44)}px ${px(58)}px; border-radius: ${px(44)}px; text-align: center; will-change: transform;
        background: rgba(14,14,16,.84); border: 1.5px solid rgba(255,255,255,.14); backdrop-filter: blur(${px(18)}px); -webkit-backdrop-filter: blur(${px(18)}px);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 ${px(30)}px ${px(80)}px rgba(0,0,0,.5); }
      .tp-gp-flood { position: absolute; inset: 0; background: linear-gradient(160deg, color-mix(in srgb, var(--ac) 80%, #fff), var(--ac) 55%, color-mix(in srgb, var(--ac) 80%, #000)); opacity: 0; }
      .tp-gp-blob { position: absolute; left: 0; top: -40%; width: 60%; height: 180%; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.75), transparent); filter: blur(${px(30)}px); opacity: 0; }
      .tp-gp-card h3 { position: relative; margin: 0; font-weight: 900; line-height: 1.02; letter-spacing: -0.035em; color: #fff; overflow-wrap: anywhere; text-shadow: 0 ${px(4)}px ${px(22)}px rgba(0,0,0,.3); }
      .tp-gp-card p { position: relative; margin: ${px(14)}px 0 0; font-weight: 600; font-size: ${px(32)}px; line-height: 1.2; color: rgba(255,255,255,.86); }`,
  html: ({ id, c, esc, px, data }) =>
    `<div class="tp-gp" id="${id}-wrap"><i class="tp-gp-room" id="${id}-room"></i><div class="tp-gp-card" id="${id}-card"><i class="tp-gp-flood" id="${id}-flood"></i><i class="tp-gp-blob" id="${id}-blob"></i><h3 style="font-size:${px(data.size)}px">${esc(c.text)}</h3>${c.sub ? `<p>${esc(c.sub)}</p>` : ""}</div></div>`,
  script: `
    var card = el + "-card", f = t0 + 0.62;
    floatIn(el + "-wrap", t0, { y: 60 });
    // The flash: the card floods the brand colour, tilts and swells; the room glow lags it by two frames.
    tl.fromTo(el + "-flood", { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "power2.out", immediateRender: false }, f);
    tl.fromTo(el + "-flood", { opacity: 1 }, { opacity: 0.1, duration: 0.55, ease: "power2.out", immediateRender: false }, f + 0.25);
    tl.fromTo(el + "-room", { opacity: 0 }, { opacity: 0.9, duration: 0.18, ease: "power2.out", immediateRender: false }, f + 0.07);
    tl.fromTo(el + "-room", { opacity: 0.9 }, { opacity: 0.16, duration: 0.8, ease: "power2.out", immediateRender: false }, f + 0.3);
    tl.fromTo(card, { rotation: 0, rotationX: 0, scale: 1 }, { rotation: -5, rotationX: 10, scale: 1.06, duration: 0.22, ease: "power2.out", immediateRender: false }, f);
    tl.fromTo(card, { rotation: -5, rotationX: 10, scale: 1.06 }, { rotation: 0, rotationX: 0, scale: 1, duration: 0.55, ease: "back.out(2)", immediateRender: false }, f + 0.25);
    tl.fromTo(el + "-blob", { xPercent: -110 }, { xPercent: 190, duration: 0.7, ease: "power1.inOut", immediateRender: false }, f);
    tl.fromTo(el + "-blob", { opacity: 0 }, { opacity: 0.85, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, f + 0.05);
    drift(card, f + 0.85, out - f - 1, 4);`,
};
