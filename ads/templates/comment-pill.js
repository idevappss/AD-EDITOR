// Comment pill: a comment box pops in, the keyword types in letter by letter, the send button pulses and a hand taps
// it (ads/references/retention-transitions.md "hk-ui-pop").
import { initial, mark, HAND_SVG } from "./_parts.js";

export default {
  id: "comment-pill",
  name: "Comment pill",
  job: "cta",
  use: 'A "comment the word" call to action ("comment ATLAS below", "type GUIDE in the comments", "drop a 🔥 and I\'ll send it"). The word types itself into a comment box and gets sent.',
  fields: 'text = exactly what to type, 1–3 words (e.g. "ATLAS"); sub = the box placeholder, 1–2 words (default "Comment").',
  position: "bottom",
  anchor: "cta",
  minLen: 2.4,
  sfx: [["bloop", 0.05, 0.35], ["tick", 0.42, 0.4], ["tick", 0.6, 0.4], ["tick", 0.78, 0.4], ["click", 1.95, 0.8]],
  data: (c) => {
    const chars = [...String(c.text || "ATLAS").trim()].slice(0, 28);
    const n = chars.length;
    return { n, size: n <= 10 ? 48 : n <= 18 ? 38 : 32 };
  },
  css: ({ px, tall }) => `
      .tp-cp { position: relative; width: ${tall ? 84 : 46}%; }
      .tp-cp-pill { position: relative; display: flex; align-items: center; gap: ${px(22)}px; padding: ${px(14)}px; border-radius: 999px; border: ${px(3)}px solid rgba(255,255,255,.92);
        background: linear-gradient(135deg, #45454D, #17171B 70%); box-shadow: 0 ${px(22)}px ${px(56)}px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.2); will-change: transform; }
      .tp-cp-pill::after { content: ""; position: absolute; inset: ${px(-3)}px; border-radius: inherit; box-shadow: 0 0 0 ${px(3)}px var(--ac), 0 0 ${px(36)}px color-mix(in srgb, var(--ac) 55%, transparent); opacity: var(--hot, 0); pointer-events: none; }
      .tp-cp-av { flex: none; display: grid; place-items: center; width: ${px(92)}px; height: ${px(92)}px; border-radius: 50%; overflow: hidden; background: var(--ac); color: #000; font-weight: 900; font-size: ${px(44)}px; }
      .tp-cp-av.tp-cp-logo { background: #fff; }
      .tp-cp-av img { width: 76%; height: 76%; object-fit: contain; }
      .tp-cp-field { position: relative; flex: 1; min-width: 0; height: ${px(92)}px; display: flex; align-items: center; overflow: hidden; }
      .tp-cp-ph { position: absolute; left: 0; top: 50%; transform: translateY(-50%); font-weight: 600; font-size: ${px(40)}px; color: rgba(255,255,255,.55); white-space: nowrap; }
      .tp-cp-typed { display: flex; align-items: center; font-weight: 900; color: #fff; letter-spacing: .01em; white-space: nowrap; }
      .tp-cp-typed i { display: inline-block; font-style: normal; max-width: 0; overflow: hidden; }
      .tp-cp-caret { display: inline-block; width: ${px(4)}px; height: 1em; margin-left: ${px(4)}px; border-radius: ${px(2)}px; background: var(--ac); opacity: 0; }
      .tp-cp-send { flex: none; display: grid; place-items: center; width: ${px(92)}px; height: ${px(92)}px; border-radius: 50%; background: var(--ac); color: #1C1310; box-shadow: 0 0 ${px(24)}px color-mix(in srgb, var(--ac) 45%, transparent); }
      .tp-cp-send svg { width: 50%; height: 50%; }
      .tp-cp-rip { position: absolute; right: ${px(14)}px; top: 50%; width: ${px(92)}px; height: ${px(92)}px; margin-top: ${px(-46)}px; border-radius: 50%; border: ${px(4)}px solid var(--ac); box-sizing: border-box; opacity: 0; pointer-events: none; }
      .tp-cp-hand { position: absolute; z-index: 2; right: ${px(9)}px; top: calc(50% - ${px(4)}px); width: ${px(96)}px; height: ${px(96)}px; filter: drop-shadow(0 ${px(6)}px ${px(12)}px rgba(0,0,0,.45)); opacity: 0; }`,
  html: ({ id, c, esc, px, logo, data }) => {
    const text = [...String(c.text || "ATLAS").trim()].slice(0, 28);
    return `<div class="tp-cp" id="${id}-wrap"><div class="tp-cp-pill" id="${id}-card"><span class="tp-cp-av${logo ? " tp-cp-logo" : ""}">${mark(logo, initial(c.text), esc)}</span><div class="tp-cp-field"><span class="tp-cp-ph" id="${id}-ph">${esc(c.sub || "Comment")}</span><span class="tp-cp-typed" style="font-size:${px(data.size)}px">${text.map((ch, k) => `<i id="${id}-c${k}">${ch === " " ? "&nbsp;" : esc(ch)}</i>`).join("")}<u class="tp-cp-caret" id="${id}-caret"></u></span></div><span class="tp-cp-send" id="${id}-send"><svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M12 19V5M6 11l6-6 6 6"/></svg></span><i class="tp-cp-rip" id="${id}-rip"></i></div><span class="tp-cp-hand" id="${id}-hand">${HAND_SVG}</span></div>`;
  },
  script: `
    var card = el + "-card", n = c.data.n || 0, ts = t0 + 0.42, step = n > 10 ? Math.max(0.035, 0.9 / n) : 0.09, te = ts + n * step, tap = t0 + 1.95;
    // Pops in: 0.6 → 1.05 → 1.
    tl.fromTo(card, { autoAlpha: 0, scale: 0.6, y: 30 }, { autoAlpha: 1, scale: 1.05, y: 0, duration: 0.22, ease: "power3.out", immediateRender: false }, t0);
    tl.fromTo(card, { scale: 1.05 }, { scale: 1, duration: 0.14, ease: "sine.out", immediateRender: false }, t0 + 0.22);
    // Typing: placeholder clears, each letter hard-cuts in, the caret rides the end and blinks once done.
    tl.fromTo(el + "-ph", { opacity: 1 }, { opacity: 0, duration: 0.08, immediateRender: false }, ts - 0.05);
    tl.fromTo(el + "-caret", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, ts - 0.05);
    for (var k = 0; k < n; k++) tl.fromTo(el + "-c" + k, { maxWidth: "0em" }, { maxWidth: "1.6em", duration: 0.01, immediateRender: false }, ts + k * step);
    for (var b = te + 0.25, on = true; b < out - 0.1; b += 0.3, on = !on) tl.fromTo(el + "-caret", { opacity: on ? 1 : 0 }, { opacity: on ? 0 : 1, duration: 0.01, immediateRender: false }, b);
    // Send pulses, the hand glides in and taps it, the box rim lights up.
    tl.fromTo(el + "-send", { scale: 1 }, { scale: 1.16, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, Math.min(te + 0.05, tap - 0.5));
    tl.fromTo(el + "-hand", { opacity: 0, xPercent: 70, yPercent: 90 }, { opacity: 1, xPercent: 0, yPercent: 0, duration: 0.42, ease: "power3.out", immediateRender: false }, tap - 0.45);
    tl.fromTo(el + "-hand", { scale: 1 }, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, tap);
    tl.fromTo(el + "-send", { scale: 1 }, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, tap);
    tl.fromTo(el + "-rip", { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 2.2, duration: 0.5, ease: "power2.out", immediateRender: false }, tap);
    tl.fromTo(card, { "--hot": 0 }, { "--hot": 1, duration: 0.2, ease: "power2.out", immediateRender: false }, tap + 0.04);
    drift(card, tap + 0.3, out - tap - 0.5, 3);`,
};
