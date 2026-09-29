// End card (atlas-motion-kit.md #16): the logo mark, a mono kicker, a two-tone "Try it free / for 7 days.", a glowing
// pill with the URL or action, a small line under it and a mono audience footer. Full screen, dark or accent ground.
import { MONO, brandMark, slots } from "./_parts.js";

export default {
  id: "end-card",
  name: "End card",
  job: "cta",
  scene: "always",
  use: 'The closing offer and where to go, over the final CTA line ("try it free for 7 days at app.atlas-ai.club", "start your free trial", "link below"). Rotate with the button CTA; it cuts away from the speaker.',
  fields: 'text = headline line 1 (e.g. "Try it free"); sub = line 2 in the accent (e.g. "for 7 days."); items = [the button: a URL or 2–4 word action (e.g. "app.atlas-ai.club"), a mono kicker (e.g. "Atlas beta · limited time"), a small line under the button (e.g. "+ a free onboarding growth call"), a mono footer (e.g. "Chiropractors · Physical therapists · Healthcare owners")]. Write "-" for a slot you leave empty.',
  position: "center",
  anchor: "cta",
  minLen: 2,
  sfx: [["atlas-impact", 0, 0.7], ["atlas-success", 0.75, 0.55]],
  data: () => ({}),
  css: ({ px, W, H, tall }) => `
      .tp-ec { position: relative; width: ${Math.round(W * (tall ? 0.86 : 0.6))}px; height: ${H}px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
      .tp-ec-mark { display: grid; place-items: center; width: ${px(190)}px; height: ${px(190)}px; margin-bottom: ${px(20)}px; color: var(--ac); }
      .ag.tone-accent .tp-ec-mark { color: var(--ink); }
      .tp-ec-mark img { width: 100%; height: 100%; object-fit: contain; }
      .tp-ec-mark span { display: grid; place-items: center; width: 80%; height: 80%; border-radius: 26%; background: var(--ac); color: var(--ink); font-weight: 800; font-size: ${px(56)}px; box-shadow: 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 55%, transparent); }
      .tp-ec .mk-kick { font-size: ${px(22)}px; margin-bottom: ${px(18)}px; }
      .tp-ec .mk-h { font-size: ${px(tall ? 150 : 124)}px; letter-spacing: -0.035em; line-height: .95; }
      .tp-ec-btn { margin-top: ${px(64)}px; padding: ${px(34)}px ${px(70)}px; border-radius: 999px; background: var(--ac); color: var(--ink); font-weight: 700; font-size: ${px(52)}px; letter-spacing: -0.01em; box-shadow: 0 0 ${px(60)}px color-mix(in srgb, var(--ac) 55%, transparent); }
      .ag.tone-accent .tp-ec-btn { background: var(--ink); color: #FFF4EC; box-shadow: 0 ${px(14)}px ${px(40)}px rgba(0,0,0,.25); }
      .ag.tone-accent .tp-ec-mark img { filter: brightness(0) opacity(.85); }
      .ag.tone-accent .tp-ec-mark span { background: var(--ink); color: var(--ac); box-shadow: none; }
      .tp-ec-note { margin-top: ${px(20)}px; font-weight: 600; font-size: ${px(28)}px; color: color-mix(in srgb, var(--tx) 70%, transparent); }
      .ag.tone-accent .tp-ec-note { color: color-mix(in srgb, var(--ink) 75%, transparent); }
      .tp-ec-foot { position: absolute; bottom: ${Math.round(H * 0.06)}px; left: 0; right: 0; font-family: ${MONO}; font-size: ${px(18)}px; letter-spacing: .2em; text-transform: uppercase; color: color-mix(in srgb, var(--tx) 40%, transparent); }
      .ag.tone-accent .tp-ec-foot { color: color-mix(in srgb, var(--ink) 55%, transparent); }`,
  html: ({ id, c, esc, logo }) => {
    const [btn, kick, note, foot] = slots(c, 4);
    return `<div class="tp-ec" id="${id}-wrap"><div class="tp-ec-mark" id="${id}-mark">${brandMark(logo, esc)}</div>${kick ? `<div class="mk-kick display" id="${id}-k">${esc(kick)}</div>` : ""}<h3 class="mk-h"><span id="${id}-l1">${esc(c.text)}</span>${c.sub ? `<span class="ac" id="${id}-l2">${esc(c.sub)}</span>` : ""}</h3>${btn ? `<div class="tp-ec-btn" id="${id}-btn">${esc(btn)}</div>` : ""}${note ? `<div class="tp-ec-note" id="${id}-note">${esc(note)}</div>` : ""}${foot ? `<div class="tp-ec-foot" id="${id}-foot">${esc(foot)}</div>` : ""}</div>`;
  },
  script: `
    blurIn(el + "-mark", t0, { y: 16, s: 0.9, b: 14, d: 0.7 });
    blurIn(el + "-k", t0 + 0.15, { y: 8, b: 6 });
    blurIn(el + "-l1", t0 + 0.2, { y: 22, b: 16 });
    blurIn(el + "-l2", t0 + 0.4, { y: 22, b: 16 });
    blurIn(el + "-btn", t0 + 0.7, { y: 18, s: 0.94, b: 10 });
    blurIn(el + "-note", t0 + 0.95, { y: 8, b: 6 });
    blurIn(el + "-foot", t0 + 1.0, { y: 0, b: 6 });
    if (len > 2.4) tl.fromTo(el + "-btn", { scale: 1 }, { scale: 1.025, duration: 0.9, yoyo: true, repeat: Math.max(1, Math.floor((len - 1.8) / 0.9)), ease: "sine.inOut", immediateRender: false }, t0 + 1.2);`,
};
