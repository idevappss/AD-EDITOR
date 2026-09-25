// Service stack: dark glass rows stack in one at a time, each with a glowing brand-colour check dot and its title
// wiping in, like a checklist being filled (ads/references/glass-ui.md "service-stack", without the 3D objects).
import { items } from "./_parts.js";

// Row landing times (seconds after start), shared by the animation and the bloops below. When there are fewer than
// 4 rows, the next free slot is a "done" beat (every check pulses) so its bloop still lands on something.
const SLOTS = [0.35, 0.8, 1.25, 1.7];

export default {
  id: "service-stack",
  name: "Service stack",
  job: "benefit",
  use: 'A spoken list of services, benefits or steps ("we do X, Y and Z", "three things…", "here\'s what\'s included", "adjustments, rehab and nutrition"). Rows stack in like a checklist.',
  fields: 'items = 2–4 short rows in the order said, 1–4 words each (e.g. "Chiropractic care"); a row may add a small caption after "|" (e.g. "Rehab|in 6 weeks"); text = optional header, 2–4 words, or empty.',
  position: "bottom",
  anchor: null,
  minLen: 2.4,
  sfx: SLOTS.map((at) => ["bloop", at, 0.45]),
  data: (c) => ({ n: Math.max(1, Math.min(4, items(c).length)), slots: SLOTS }),
  css: ({ px, tall }) => `
      .tp-ss { display: flex; flex-direction: column; gap: ${px(14)}px; width: ${tall ? 80 : 46}%; }
      .tp-ss h4 { margin: 0 0 ${px(4)}px ${px(10)}px; font-weight: 800; font-size: ${px(42)}px; line-height: 1.1; letter-spacing: -0.02em; color: #fff; text-shadow: 0 ${px(3)}px ${px(18)}px rgba(0,0,0,.55); opacity: 0; }
      .tp-ss-row { position: relative; display: flex; align-items: center; gap: ${px(24)}px; min-height: ${px(96)}px; padding: ${px(16)}px ${px(34)}px ${px(16)}px ${px(18)}px; border-radius: ${px(48)}px; box-sizing: border-box; opacity: 0;
        background: linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,0) 55%), rgba(30,30,34,.66); border: 1px solid rgba(255,255,255,.14);
        backdrop-filter: blur(${px(20)}px); -webkit-backdrop-filter: blur(${px(20)}px); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 ${px(18)}px ${px(44)}px rgba(0,0,0,.35); }
      .tp-ss-row::after { content: ""; position: absolute; inset: -1px; border-radius: inherit; box-shadow: 0 0 0 ${px(2)}px var(--ac), 0 0 ${px(30)}px color-mix(in srgb, var(--ac) 50%, transparent); opacity: var(--hot, 0); pointer-events: none; }
      .tp-ss-dot { flex: none; display: grid; place-items: center; width: ${px(62)}px; height: ${px(62)}px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--ac) 70%, #fff), var(--ac));
        box-shadow: 0 0 ${px(18)}px color-mix(in srgb, var(--ac) 80%, transparent), 0 0 ${px(44)}px color-mix(in srgb, var(--ac) 45%, transparent), 0 0 0 ${px(5)}px color-mix(in srgb, var(--ac) 22%, transparent); }
      .tp-ss-dot svg { width: 64%; height: 64%; overflow: visible; }
      .tp-ss-dot path { fill: none; stroke: #000; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; }
      .tp-ss-txt { flex: 1; min-width: 0; display: flex; align-items: center; gap: ${px(14)}px; }
      .tp-ss-txt b { min-width: 0; font-weight: 700; font-size: ${px(40)}px; line-height: 1.12; color: #fff; text-shadow: 0 0 ${px(14)}px rgba(255,255,255,.22); overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; clip-path: inset(0 100% 0 0); }
      .tp-ss-txt span { flex: none; max-width: 40%; padding: ${px(6)}px ${px(16)}px; border-radius: 999px; background: rgba(255,255,255,.8); color: #1C1C1E; font-weight: 600; font-size: ${px(24)}px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; margin-left: auto; }`,
  html: ({ id, c, esc, data }) => {
    const rows = items(c).slice(0, data.n);
    return `<div class="tp-ss" id="${id}-wrap">${c.text ? `<h4 id="${id}-h">${esc(c.text)}</h4>` : ""}${rows
      .map((r, i) => {
        const [title, cap] = r.split("|").map((s) => s.trim());
        return `<div class="tp-ss-row" id="${id}-r${i}"><i class="tp-ss-dot" id="${id}-d${i}"><svg viewBox="0 0 24 24"><path id="${id}-k${i}" pathLength="100" d="M6.5 12.5l3.6 3.6L17.5 8.6"/></svg></i><div class="tp-ss-txt"><b id="${id}-t${i}">${esc(title)}</b>${cap ? `<span id="${id}-c${i}">${esc(cap)}</span>` : ""}</div></div>`;
      })
      .join("")}</div>`;
  },
  script: `
    var n = c.data.n || 0, S = c.data.slots || [0.35, 0.8, 1.25, 1.7];
    tl.fromTo(el + "-h", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t0);
    for (var i = 0; i < n; i++) {
      var at = t0 + S[i] - 0.3; // lands (back.out peak) on its bloop
      tl.fromTo(el + "-r" + i, { opacity: 0, y: 50, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.3)", immediateRender: false }, at);
      tl.fromTo(el + "-d" + i, { scale: 0, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(3)", immediateRender: false }, at + 0.1);
      tl.fromTo(el + "-k" + i, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, at + 0.3);
      tl.fromTo(el + "-t" + i, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "power2.out", immediateRender: false }, at + 0.18);
      tl.fromTo(el + "-c" + i, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, at + 0.45);
    }
    // Done beat on the next free slot: every row rim flashes the brand colour and every check pulses once.
    if (n > 0 && n < 4) {
      var d = t0 + S[n];
      for (var j = 0; j < n; j++) {
        tl.fromTo(el + "-r" + j, { "--hot": 0 }, { "--hot": 1, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, d + j * 0.04);
        tl.fromTo(el + "-d" + j, { scale: 1 }, { scale: 1.18, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, d + j * 0.04);
      }
    }
    drift(el + "-wrap", t0 + 2, out - t0 - 2.2, 4);`,
};
