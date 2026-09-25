// App card: a white app icon with the brand logo flies in, then a dark glass card unfolds out of it with a loose 3D
// wobble while the icon flips to the left edge; title, subtitle, five stars and a pill button cascade in
// (ads/references/glass-ui.md "app-icon-expand").
import { initial, mark, items } from "./_parts.js";

const STAR = `<svg viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`;

export default {
  id: "app-card",
  name: "App card",
  job: "product",
  use: 'Naming the brand, app or practice for the first time, or a rating or review claim ("we built an app called…", "the #1 rated clinic in…", "5 stars on Google", "download ATLAS"). A logo reveal that becomes an app-store card.',
  fields: 'text = the brand or app name, 1–3 words; sub = a short tagline, 2–5 words (e.g. "Your clinic on autopilot"); items[0] = button label, 1–2 words (default "Try it"); items[1] = optional rating note (e.g. "4.9 · 1.3k reviews").',
  position: "top",
  anchor: null,
  minLen: 2.6,
  sfx: [["whoosh-short", 0, 0.35], ["bigswoosh", 0.95, 0.28], ["tick", 1.37, 0.35], ["tick", 1.61, 0.35], ["tick", 1.85, 0.35], ["bloop", 1.97, 0.45]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-ac { width: ${tall ? 84 : 48}%; perspective: ${px(1200)}px; }
      .tp-ac-card { --p: 1; position: relative; height: ${px(200)}px; transform-style: preserve-3d; will-change: transform; }
      .tp-ac-bg { position: absolute; top: 0; bottom: 0; left: calc(var(--p) * (50% - ${px(100)}px)); right: calc(var(--p) * (50% - ${px(100)}px)); border-radius: ${px(56)}px; opacity: 0;
        background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0) 50%), rgba(34,34,38,.8); border: 1px solid rgba(255,255,255,.14);
        backdrop-filter: blur(${px(20)}px); -webkit-backdrop-filter: blur(${px(20)}px); box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 ${px(26)}px ${px(70)}px rgba(0,0,0,.45); }
      .tp-ac-icon { position: absolute; z-index: 2; top: ${px(25)}px; left: calc(var(--p) * (50% - ${px(75)}px) + (1 - var(--p)) * ${px(25)}px); display: grid; place-items: center; width: ${px(150)}px; height: ${px(150)}px; border-radius: 23%;
        background: #fff; color: #1C1C1E; font-weight: 900; font-size: ${px(84)}px; letter-spacing: -0.04em; box-shadow: 0 0 ${px(60)}px rgba(255,255,255,.45), 0 ${px(10)}px ${px(30)}px rgba(0,0,0,.3); opacity: 0; }
      .tp-ac-icon img { width: 74%; height: 74%; object-fit: contain; }
      .tp-ac-body { position: absolute; z-index: 1; left: ${px(200)}px; right: ${px(26)}px; top: 0; bottom: 0; display: flex; align-items: center; gap: ${px(18)}px; }
      .tp-ac-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: ${px(4)}px; }
      .tp-ac-txt h4 { margin: 0; font-weight: 800; font-size: ${px(44)}px; line-height: 1.1; letter-spacing: -0.02em; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; }
      .tp-ac-txt p { margin: 0; font-weight: 400; font-size: ${px(30)}px; line-height: 1.2; color: rgba(235,235,245,.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; clip-path: inset(0 100% 0 0); }
      .tp-ac-rate { display: flex; align-items: center; gap: ${px(4)}px; margin-top: ${px(4)}px; min-width: 0; }
      .tp-ac-rate svg { flex: none; width: ${px(30)}px; height: ${px(30)}px; fill: var(--ac); filter: drop-shadow(0 0 ${px(6)}px color-mix(in srgb, var(--ac) 60%, transparent)); opacity: 0; }
      .tp-ac-rate span { margin-left: ${px(8)}px; font-weight: 500; font-size: ${px(24)}px; color: rgba(235,235,245,.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; }
      .tp-ac-btn { flex: none; max-width: ${px(230)}px; padding: ${px(14)}px ${px(30)}px; border-radius: 999px; background: color-mix(in srgb, var(--ac) 24%, transparent); color: var(--ac); font-weight: 800; font-size: ${px(30)}px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 ${px(14)}px color-mix(in srgb, var(--ac) 70%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ac) 40%, transparent); opacity: 0; }`,
  html: ({ id, c, esc, logo }) => {
    const [btn = "Try it", note = ""] = items(c);
    const name = String(c.text || "").trim();
    return `<div class="tp-ac"><div class="tp-ac-card" id="${id}-card"><i class="tp-ac-bg" id="${id}-bg"></i><div class="tp-ac-icon" id="${id}-icon">${mark(logo, initial(name), esc)}</div><div class="tp-ac-body"><div class="tp-ac-txt"><h4 id="${id}-t">${esc(name)}</h4>${c.sub ? `<p id="${id}-s">${esc(c.sub)}</p>` : ""}<div class="tp-ac-rate">${[0, 1, 2, 3, 4].map((k) => STAR.replace("<svg", `<svg id="${id}-st${k}"`)).join("")}${note ? `<span id="${id}-note">${esc(note)}</span>` : ""}</div></div><span class="tp-ac-btn" id="${id}-btn">${esc(btn)}</span></div></div></div>`;
  },
  script: `
    var card = el + "-card", icon = el + "-icon", u = t0 + 0.6;
    // The icon flies in from the top-left along a curve and settles in the centre.
    tl.fromTo(icon, { autoAlpha: 0, x: -380, y: -200, scale: 0.2, rotation: -30 }, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, duration: 0.5, ease: "expo.out", immediateRender: false }, t0);
    // The card unfolds out of it (--p 1 → 0 widens the glass and walks the icon to the left) with a loose 3D wobble.
    tl.fromTo(el + "-bg", { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power1.out", immediateRender: false }, u);
    tl.fromTo(card, { "--p": 1 }, { "--p": 0, duration: 0.9, ease: "power3.inOut", immediateRender: false }, u);
    tl.fromTo(icon, { rotationY: 0 }, { rotationY: 360, duration: 0.9, ease: "power3.inOut", immediateRender: false }, u);
    tl.fromTo(card, { rotation: 0, rotationY: 0 }, { rotation: -7, rotationY: 18, duration: 0.3, ease: "sine.out", immediateRender: false }, u);
    tl.fromTo(card, { rotation: -7, rotationY: 18 }, { rotation: 5, rotationY: -12, duration: 0.35, ease: "sine.inOut", immediateRender: false }, u + 0.3);
    tl.fromTo(card, { rotation: 5, rotationY: -12 }, { rotation: 0, rotationY: 0, duration: 0.5, ease: "back.out(1.6)", immediateRender: false }, u + 0.65);
    // Contents cascade: title, subtitle wipes in, stars pop one by one, the button fills last.
    tl.fromTo(el + "-t", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, u + 0.55);
    tl.fromTo(el + "-s", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power2.out", immediateRender: false }, u + 0.63);
    for (var k = 0; k < 5; k++) tl.fromTo(el + "-st" + k, { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3.5)", immediateRender: false }, u + 0.77 + k * 0.12);
    tl.fromTo(el + "-note", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, u + 1.3);
    tl.fromTo(el + "-btn", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.4)", immediateRender: false }, u + 1.37);
    drift(card, u + 1.6, out - u - 1.8, 4);`,
};
