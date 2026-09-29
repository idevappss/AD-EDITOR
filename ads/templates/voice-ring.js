// Voice ring (the Jeremy AI demo, 18.5–20.5 s): a round portrait (the ad's logo, else the ATLAS mark on ink) inside a
// ring of radial audio bars that pulse like a live voice, a faint wide circle behind, a mono "VOICE" label and one
// big glowing line under it ("Or just call him.").
import { brandMark } from "./_parts.js";

const BARS = 72;

export default {
  id: "voice-ring",
  name: "Voice ring",
  job: "product",
  scene: "optional",
  use: 'Talking to the AI out loud, or it calling / answering calls ("or just call it", "it picks up the phone", "talk to it like a person", "it answers every call").',
  fields: 'text = one line under it, 2–6 words (e.g. "Or just call it."); sub = a mono label (default "Voice").',
  position: "top",
  anchor: null,
  minLen: 1.6,
  sfx: [["atlas-whoosh", 0.02, 0.4], ["atlas-ding", 0.35, 0.3]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-vr { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .tp-vr-halo { position: absolute; left: 50%; top: ${px(210)}px; width: ${px(tall ? 860 : 700)}px; height: ${px(tall ? 860 : 700)}px; margin: ${px(tall ? -430 : -350)}px 0 0 ${px(tall ? -430 : -350)}px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--ac) 25%, transparent); background: radial-gradient(circle, color-mix(in srgb, var(--ac) 12%, transparent), transparent 70%); }
      .tp-vr-ring { position: relative; width: ${px(420)}px; height: ${px(420)}px; }
      .tp-vr-ring i { position: absolute; left: 50%; top: 50%; width: ${px(4)}px; height: ${px(34)}px; margin: ${px(-17)}px 0 0 ${px(-2)}px; border-radius: ${px(2)}px; background: var(--ac); box-shadow: 0 0 ${px(8)}px var(--ac); transform-origin: 50% 50%; }
      .tp-vr-face { position: absolute; left: 50%; top: 50%; width: ${px(290)}px; height: ${px(290)}px; margin: ${px(-145)}px 0 0 ${px(-145)}px; display: grid; place-items: center; padding: ${px(60)}px; box-sizing: border-box; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #3A2E28, #17120F); color: var(--ac); box-shadow: inset 0 0 0 ${px(4)}px color-mix(in srgb, var(--ac) 70%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 35%, transparent); overflow: hidden; }
      .tp-vr-face img { width: 100%; height: 100%; object-fit: contain; }
      .tp-vr .mk-kick { margin-top: ${px(8)}px; font-size: ${px(20)}px; color: var(--tx2); }
      .tp-vr .mk-h { margin-top: ${px(14)}px; font-size: ${px(tall ? 80 : 68)}px; }`,
  html: ({ id, c, esc, logo, px }) => `<div class="tp-vr" id="${id}-wrap"><i class="tp-vr-halo" id="${id}-halo"></i><div class="tp-vr-ring" id="${id}-ring">${Array.from({ length: BARS }, (_, k) => `<i style="transform: rotate(${(k * 360) / BARS}deg) translateY(${px(-176)}px)"><u id="${id}-b${k}" style="display:block;width:100%;height:100%;background:inherit;border-radius:inherit;transform-origin:50% 100%"></u></i>`).join("")}<div class="tp-vr-face" id="${id}-face">${brandMark(logo, esc)}</div></div><div class="mk-kick" id="${id}-k">${esc(c.sub || "Voice")}</div><h3 class="mk-h" id="${id}-t">${esc(c.text)}</h3></div>`,
  script: `
    blurIn(el + "-halo", t0, { y: 0, s: 0.8, b: 0, d: 0.9, e: "power2.out" });
    blurIn(el + "-face", t0 + 0.05, { y: 0, s: 0.7, b: 12, d: 0.7 });
    blurIn(el + "-ring", t0 + 0.2, { y: 0, s: 0.85, b: 6, d: 0.6 });
    blurIn(el + "-k", t0 + 0.4, { y: 8, b: 4 });
    blurIn(el + "-t", t0 + 0.5, { y: 20, b: 12 });
    // Each bar pulses at its own pace, like a voice (deterministic pseudo-random per bar).
    for (var k = 0; k < ${BARS}; k++) {
      var sp = 0.18 + ((k * 37) % 17) / 60, lo = 0.25 + ((k * 13) % 7) / 20, hi = 0.8 + ((k * 23) % 9) / 12;
      tl.fromTo(el + "-b" + k, { scaleY: lo }, { scaleY: hi, duration: sp, yoyo: true, repeat: Math.max(1, Math.floor((len - 0.3) / sp)), ease: "sine.inOut", immediateRender: false }, t0 + 0.3 + (k % 9) * 0.02);
    }
    tl.fromTo(el + "-ring", { rotation: 0 }, { rotation: 20, duration: len, ease: "none", immediateRender: false }, t0);`,
};
