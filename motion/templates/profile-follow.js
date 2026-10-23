// Profile follow: a white profile card slides in with motion blur, its stats count up, a cursor glides onto Follow,
// clicks, and the button flips to "Following" (motion/references/glass-ui.md "profile-card-follow").
import { initial, mark, items, COUNT_UP, CURSOR_SVG } from "./_parts.js";

const stat = (s) => {
  const [v, ...rest] = s.includes("|") ? s.split("|") : s.split(/\s+/);
  return { value: String(v || "").trim(), label: rest.join(" ").trim() };
};

export default {
  id: "profile-follow",
  name: "Profile follow",
  job: "cta",
  use: 'A follow or social-proof call to action ("follow me for more", "check out our page", "@handle", "join 2,000 members", "200K followers"). A profile card whose Follow button gets clicked.',
  fields: 'text = the name or @handle, 1–3 words; sub = a short bio, up to ~45 characters; items = up to 3 stats as "value|label" (e.g. "1.2K|members", "4.9|rating", "312|reviews"), or empty.',
  position: "bottom",
  anchor: "cta",
  minLen: 2.2,
  sfx: [["swoosh", 0.1, 0.35], ["click", 1.15, 0.8], ["pop", 1.23, 0.4]],
  data: (c) => ({ stats: items(c).slice(0, 3).map(stat) }),
  css: ({ px, tall }) => `
      .tp-pf { position: relative; width: ${tall ? 84 : 46}%; box-sizing: border-box; padding: ${px(34)}px ${px(36)}px ${px(32)}px; border-radius: ${px(36)}px; background: #fff; color: #000; box-shadow: 0 ${px(22)}px ${px(56)}px rgba(0,0,0,.45); will-change: transform, filter; }
      .tp-pf-top { display: flex; align-items: center; gap: ${px(26)}px; }
      .tp-pf-av { flex: none; display: grid; place-items: center; width: ${px(128)}px; height: ${px(128)}px; border-radius: 50%; overflow: hidden; background: var(--ac); color: #000; font-weight: 900; font-size: ${px(60)}px; box-shadow: 0 0 0 ${px(4)}px #fff, 0 0 0 ${px(7)}px color-mix(in srgb, var(--ac) 55%, #fff); }
      .tp-pf-av.tp-pf-logo { background: #fff; box-shadow: 0 0 0 ${px(2)}px #E5E5EA; }
      .tp-pf-av img { width: 78%; height: 78%; object-fit: contain; }
      .tp-pf-id { min-width: 0; flex: 1; }
      .tp-pf-id b { display: block; font-weight: 800; font-size: ${px(40)}px; line-height: 1.15; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-pf-id p { margin: ${px(6)}px 0 0; font-weight: 500; font-size: ${px(28)}px; line-height: 1.25; color: #3A3A3C; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .tp-pf-stats { display: flex; margin-top: ${px(26)}px; }
      .tp-pf-stats div { flex: 1; min-width: 0; text-align: center; }
      .tp-pf-stats b { display: block; font-weight: 800; font-size: ${px(38)}px; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .tp-pf-stats span { display: block; font-weight: 500; font-size: ${px(24)}px; color: #6B6B70; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-pf-btns { position: relative; display: flex; gap: ${px(16)}px; margin-top: ${px(26)}px; }
      .tp-pf-follow, .tp-pf-msg { position: relative; overflow: hidden; display: grid; place-items: center; height: ${px(82)}px; border-radius: ${px(20)}px; font-weight: 800; font-size: ${px(32)}px; }
      .tp-pf-follow { flex: 1.4; background: var(--ac); color: #000; }
      .tp-pf-follow em { grid-area: 1 / 1; position: relative; z-index: 1; font-style: normal; }
      .tp-pf-follow em + em { opacity: 0; }
      .tp-pf-on { position: absolute; inset: 0; border-radius: inherit; background: #fff; box-shadow: inset 0 0 0 ${px(3)}px #000; opacity: 0; }
      .tp-pf-rip { position: absolute; left: 50%; top: 50%; width: ${px(120)}px; height: ${px(120)}px; margin: ${px(-60)}px 0 0 ${px(-60)}px; border-radius: 50%; background: rgba(0,0,0,.18); opacity: 0; }
      .tp-pf-msg { flex: 1; box-shadow: inset 0 0 0 ${px(3)}px #000; }
      .tp-pf-cur { position: absolute; z-index: 3; left: 30%; top: 46%; width: ${px(64)}px; height: ${px(64)}px; filter: drop-shadow(0 ${px(4)}px ${px(8)}px rgba(0,0,0,.4)); opacity: 0; }`,
  html: ({ id, c, esc, logo, data }) => {
    const name = String(c.text || "").trim();
    const stats = data.stats.length ? `<div class="tp-pf-stats">${data.stats.map((s, i) => `<div><b id="${id}-s${i}">${esc(s.value)}</b>${s.label ? `<span>${esc(s.label)}</span>` : ""}</div>`).join("")}</div>` : "";
    return `<div class="tp-pf" id="${id}-card"><div class="tp-pf-top"><span class="tp-pf-av${logo ? " tp-pf-logo" : ""}">${mark(logo, initial(name), esc)}</span><div class="tp-pf-id"><b>${esc(name)}</b>${c.sub ? `<p>${esc(c.sub)}</p>` : ""}</div></div>${stats}<div class="tp-pf-btns"><span class="tp-pf-follow" id="${id}-btn"><i class="tp-pf-on" id="${id}-on"></i><i class="tp-pf-rip" id="${id}-rip"></i><em id="${id}-f1">Follow</em><em id="${id}-f2">Following ✓</em></span><span class="tp-pf-msg">Message</span><span class="tp-pf-cur" id="${id}-cur">${CURSOR_SVG}</span></div></div>`;
  },
  script: `
    ${COUNT_UP}
    var card = el + "-card", click = t0 + 1.15;
    // Slides in from the right with a blur that stands in for horizontal motion blur.
    tl.fromTo(card, { autoAlpha: 0, xPercent: 110, filter: "blur(16px)" }, { autoAlpha: 1, xPercent: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out", immediateRender: false }, t0);
    for (var i = 0; i < (c.data.stats || []).length; i++) countUp(el + "-s" + i, t0 + 0.3, 0.9, "power2.out");
    // Cursor glides in from the bottom-right, presses, and Follow becomes Following.
    tl.fromTo(el + "-cur", { opacity: 0, xPercent: 420, yPercent: 260 }, { opacity: 1, xPercent: 0, yPercent: 0, duration: 0.5, ease: "power2.inOut", immediateRender: false }, click - 0.55);
    tl.fromTo(el + "-cur", { scale: 1 }, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click);
    tl.fromTo(el + "-btn", { scale: 1 }, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click);
    tl.fromTo(el + "-rip", { opacity: 0.9, scale: 0.2 }, { opacity: 0, scale: 4, duration: 0.5, ease: "power2.out", immediateRender: false }, click);
    tl.fromTo(el + "-on", { opacity: 0 }, { opacity: 1, duration: 0.02, immediateRender: false }, click + 0.08);
    tl.fromTo(el + "-f1", { opacity: 1 }, { opacity: 0, duration: 0.02, immediateRender: false }, click + 0.08);
    tl.fromTo(el + "-f2", { opacity: 0 }, { opacity: 1, duration: 0.02, immediateRender: false }, click + 0.08);
    tl.fromTo(el + "-btn", { scale: 1 }, { scale: 1.04, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, click + 0.16);
    tl.fromTo(el + "-cur", { x: 0, y: 0 }, { x: 40, y: 30, duration: 0.6, ease: "sine.out", immediateRender: false }, click + 0.25);
    drift(card, click + 0.5, out - click - 0.7, 4);`,
};
