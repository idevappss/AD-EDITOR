// Notification: an iPhone-style glass banner drops in from the top with a slight 3D tilt, like a message arriving.
export default {
  id: "notification",
  name: "Notification",
  job: "product",
  use: "Something arrives or alerts you: a new lead, a booking, a message, the product telling you something.",
  fields: 'sub = the app or sender, 1–2 words (e.g. "ATLAS"); text = the message, up to ~60 characters (e.g. "3 new bookings from Meta ads").',
  position: "top",
  anchor: null,
  minLen: 1.8,
  sfx: [["pop", 0.28, 0.5]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-note-wrap { perspective: ${px(1400)}px; width: ${tall ? 88 : 46}%; }
      .tp-note { display: flex; align-items: center; gap: ${px(22)}px; padding: ${px(24)}px ${px(28)}px; border-radius: ${px(40)}px; border: 2px solid transparent;
        background: linear-gradient(rgba(28,28,32,.82), rgba(28,28,32,.82)) padding-box, linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.3) 18%, rgba(186,214,255,.25) 40%, rgba(255,255,255,.05) 60%, rgba(210,228,255,.3) 82%, rgba(255,255,255,.65)) border-box;
        backdrop-filter: blur(${px(22)}px); -webkit-backdrop-filter: blur(${px(22)}px); box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 ${px(24)}px ${px(60)}px rgba(0,0,0,.4); transform-origin: 50% 0%; will-change: transform, opacity; }
      .tp-note-ic { flex: none; display: grid; place-items: center; width: ${px(86)}px; height: ${px(86)}px; border-radius: ${px(22)}px; background: linear-gradient(145deg, color-mix(in srgb, var(--ac) 80%, #fff), var(--ac)); color: #000; font-weight: 900; font-size: ${px(40)}px; }
      .tp-note-body { min-width: 0; flex: 1; }
      .tp-note-head { display: flex; justify-content: space-between; align-items: baseline; gap: ${px(12)}px; }
      .tp-note-head b { font-weight: 800; font-size: ${px(30)}px; color: #fff; letter-spacing: .01em; }
      .tp-note-head span { font-weight: 500; font-size: ${px(24)}px; color: rgba(255,255,255,.5); }
      .tp-note p { margin: ${px(4)}px 0 0; font-weight: 600; font-size: ${px(32)}px; line-height: 1.25; color: rgba(255,255,255,.92); }`,
  html: ({ id, c, esc }) => `<div class="tp-note-wrap"><div class="tp-note" id="${id}-card"><span class="tp-note-ic">${esc(String(c.sub || "A").trim().charAt(0).toUpperCase())}</span><div class="tp-note-body"><div class="tp-note-head"><b>${esc(c.sub || "ATLAS")}</b><span>now</span></div><p>${esc(c.text)}</p></div></div></div>`,
  script: `
    tl.fromTo(el + "-card", { autoAlpha: 0, y: -220, rotationX: 55, scale: 0.92 }, { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: 0.6, ease: "back.out(1.5)", immediateRender: false }, t0);
    tl.fromTo(el + "-card", { scale: 1 }, { scale: 1.03, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.out", immediateRender: false }, t0 + 0.6);
    tl.fromTo(el + "-card", { y: 0 }, { y: -160, rotationX: 40, autoAlpha: 0, duration: 0.35, ease: "power2.in", immediateRender: false }, out - 0.05);`,
};
