// Sonar CTA: rings pulse out from a point, the call to action slides in from both sides, a hand taps.
export default {
  id: "sonar-cta",
  name: "Sonar CTA",
  job: "cta",
  use: "An alternative call to action for \"comment the word…\", \"link in the comments\", \"DM us\". Rotate with the button CTA.",
  fields: 'text = the action, 2–3 words (e.g. "Comment ATLAS"); sub = where, 2–3 words (e.g. "for early access").',
  position: "bottom",
  anchor: "cta",
  minLen: 2,
  sfx: [["whoosh-short", 0, 0.35], ["click", 0.9, 0.8]],
  data: () => ({}),
  css: ({ px }) => `
      .tp-sonar { position: relative; display: flex; flex-direction: column; align-items: center; gap: ${px(8)}px; padding: ${px(40)}px ${px(20)}px; }
      .tp-ring { position: absolute; left: 50%; top: 50%; width: ${px(220)}px; height: ${px(220)}px; margin: ${px(-110)}px 0 0 ${px(-110)}px; border-radius: 50%; border: ${px(5)}px solid var(--ac); opacity: 0; }
      .tp-sonar b { position: relative; font-weight: 900; font-size: ${px(64)}px; letter-spacing: -0.02em; color: #fff; text-shadow: 0 ${px(4)}px ${px(24)}px rgba(0,0,0,.55); }
      .tp-sonar span { position: relative; font-weight: 700; font-size: ${px(34)}px; color: var(--ac); text-shadow: 0 ${px(3)}px ${px(16)}px rgba(0,0,0,.5); }
      .tp-hand { position: absolute; right: 18%; bottom: 0; width: ${px(78)}px; height: ${px(78)}px; filter: drop-shadow(0 ${px(6)}px ${px(12)}px rgba(0,0,0,.45)); }`,
  html: ({ id, c, esc }) => `<div class="tp-sonar" id="${id}-card">${[0, 1, 2, 3].map((k) => `<i class="tp-ring" id="${id}-r${k}"></i>`).join("")}<b id="${id}-t">${esc(c.text || "Comment below")}</b>${c.sub ? `<span id="${id}-s">${esc(c.sub)}</span>` : ""}<svg class="tp-hand" id="${id}-hand" viewBox="0 0 24 24"><path fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round" d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.6-.1a1.5 1.5 0 0 1 2.9.5l1 .1a1.4 1.4 0 0 1 2.3 1V16c0 3-2.2 5.5-5.2 5.5h-1.2A5 5 0 0 1 8 19.3l-3-4.5a1.4 1.4 0 0 1 2.2-1.7L9 15z"/></svg></div>`,
  script: `
    for (var k = 0; k < 4; k++) for (var r = t0 + k * 0.5; r < out - 0.3; r += 2) tl.fromTo(el + "-r" + k, { scale: 0.2, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 1.6, ease: "power1.out", immediateRender: false }, r);
    tl.fromTo(el + "-t", { autoAlpha: 0, x: 120, filter: "blur(8px)" }, { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.45, ease: "expo.out", immediateRender: false }, t0 + 0.05);
    tl.fromTo(el + "-s", { autoAlpha: 0, x: -120 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: "expo.out", immediateRender: false }, t0 + 0.2);
    tl.fromTo(el + "-hand", { autoAlpha: 0, x: 60, y: 60 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, t0 + 0.4);
    for (var h = t0 + 0.9; h < out - 0.2; h += 0.8) tl.fromTo(el + "-hand", { scale: 1 }, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, h);`,
};
