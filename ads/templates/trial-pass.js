// Trial pass (new, 2026-09-29): a 7-day access pass. A glass ticket with notched sides blurs in; seven day cells light
// up one after another in the accent (a soft tick each), the two-tone line lands, and the button slides up under it.
// Minimal: one card, one accent, no stamps or confetti.
import { brandMark, slots } from "./_parts.js";

const days = (c) => Math.max(3, Math.min(10, Math.round(Number(c.number) || 7)));
const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "trial-pass",
  name: "7-day pass",
  job: "cta",
  scene: "optional",
  use: 'The free-trial close ("seven days, completely free", "start your seven day free trial", "try it free for a week"). The days light up one by one, then the button. Only for the trial offer; rotate with the button CTA, the end card and the search CTA.',
  fields: 'text = line 1 (e.g. "7 days."); sub = line 2 in the accent (e.g. "On us."); highlight = the button (the offer\'s CTA, e.g. "Start Your 7 Day Free Trial"); items = [a mono kicker (e.g. "Atlas · access pass"), a mono line under the button (e.g. "app.atlas-ai.club")].',
  position: "center",
  anchor: "cta",
  minLen: 2.2,
  sfx: (g) => [["atlas-pop", 0, 0.45], ...Array.from({ length: days(g) }, (_, i) => ["atlas-click", r3(0.45 + i * 0.12), 0.18]), ["atlas-success", r3(0.55 + days(g) * 0.12), 0.5]],
  data: (c) => ({ n: days(c) }),
  css: ({ px, W, tall }) => `
      .tp-tp { position: relative; width: ${Math.round(W * (tall ? 0.84 : 0.52))}px; }
      .tp-tp-card { position: relative; padding: ${px(44)}px ${px(44)}px ${px(48)}px; border-radius: ${px(40)}px; background: linear-gradient(160deg, rgba(42,34,30,.93), rgba(26,21,18,.93)); box-shadow: inset 0 0 0 1px rgba(251,241,232,.12), 0 ${px(30)}px ${px(80)}px rgba(0,0,0,.42);
        -webkit-mask: radial-gradient(circle ${px(26)}px at 0 58%, transparent 98%, #000) , radial-gradient(circle ${px(26)}px at 100% 58%, transparent 98%, #000); -webkit-mask-composite: source-in; mask-composite: intersect; }
      /* The pass stays a dark card on the accent ground, so it keeps the brand accent inside it. */
      .ag.tone-accent .tp-tp-card { --ac: var(--brand, #EE7440); --on-ac: #17120F; --tx: #FBF1E8; --tx2: rgba(251,241,232,.62); --line: rgba(251,241,232,.14); --chip: rgba(251,241,232,.08); }
      .ag.tone-accent .tp-tp .mk-kick, .ag.tone-accent .tp-tp .mk-h .ac { color: var(--ac); }
      .ag.tone-accent .tp-tp .mk-h { color: var(--tx); }
      .ag.tone-paper .tp-tp-card { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08), 0 ${px(30)}px ${px(80)}px rgba(23,18,15,.14); }
      .tp-tp-top { display: flex; align-items: center; justify-content: space-between; }
      .tp-tp-top .mk-kick { font-size: ${px(22)}px; }
      .tp-tp-mark { display: grid; place-items: center; width: ${px(64)}px; height: ${px(64)}px; color: var(--ac); }
      .tp-tp-mark img { width: 100%; height: 100%; object-fit: contain; }
      .tp-tp-days { display: flex; gap: ${px(12)}px; margin-top: ${px(34)}px; }
      .tp-tp-day { flex: 1; aspect-ratio: 1 / 1.2; display: grid; place-items: center; border-radius: ${px(18)}px; background: var(--chip); box-shadow: inset 0 0 0 1px var(--line); font-family: var(--f-mono); font-size: ${px(26)}px; color: var(--tx2); }
      .tp-tp-day { position: relative; overflow: hidden; }
      .tp-tp-day i { position: absolute; inset: 0; display: grid; place-items: center; border-radius: inherit; background: var(--ac); color: var(--on-ac); font-style: normal; opacity: 0; box-shadow: 0 0 ${px(26)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .tp-tp-rule { height: 0; margin: ${px(40)}px ${px(-10)}px ${px(34)}px; border-top: ${px(3)}px dashed var(--line); }
      .tp-tp .mk-h { font-size: ${px(tall ? 104 : 88)}px; letter-spacing: -0.03em; line-height: .98; text-shadow: none; }
      .tp-tp-btn { margin-top: ${px(34)}px; padding: ${px(28)}px; border-radius: 999px; text-align: center; background: var(--ac); color: var(--on-ac); font-weight: 700; font-size: ${px(tall ? 42 : 36)}px; box-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .tp-tp-url { margin-top: ${px(16)}px; text-align: center; font-family: var(--f-mono); font-size: ${px(22)}px; letter-spacing: .14em; color: var(--tx2); }`,
  html: ({ id, c, esc, logo }) => {
    const [kick, url] = slots(c, 2);
    const n = days(c);
    return `<div class="tp-tp" id="${id}-wrap"><div class="tp-tp-card" id="${id}-card"><div class="tp-tp-top"><div class="mk-kick">${esc(kick || "Atlas · access pass")}</div><span class="tp-tp-mark">${brandMark(logo, esc)}</span></div><div class="tp-tp-days">${Array.from({ length: n }, (_, i) => `<span class="tp-tp-day">${i + 1}<i id="${id}-d${i}">${i + 1}</i></span>`).join("")}</div><div class="tp-tp-rule"></div><h3 class="mk-h"><span id="${id}-l1">${esc(c.text || `${n} days.`)}</span><span class="ac" id="${id}-l2">${esc(c.sub || "On us.")}</span></h3><div class="tp-tp-btn" id="${id}-btn">${esc(c.highlight || "Start Your 7 Day Free Trial")}</div>${url ? `<div class="tp-tp-url" id="${id}-url">${esc(url)}</div>` : ""}</div></div>`;
  },
  script: `
    var n = c.data.n;
    blurIn(el + "-card", t0, { y: 30, s: 0.95, b: 16, d: 0.75 });
    settle3d(el + "-card", t0, len, 8, -8);
    for (var i = 0; i < n; i++) tl.fromTo(el + "-d" + i, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: "expo.out", immediateRender: false }, t0 + 0.45 + i * 0.12);
    var after = t0 + 0.45 + n * 0.12;
    blurIn(el + "-l1", after - 0.2, { y: 18, b: 12 });
    blurIn(el + "-l2", after - 0.05, { y: 18, b: 12 });
    blurIn(el + "-btn", after + 0.15, { y: 26, s: 0.96 });
    blurIn(el + "-url", after + 0.3, { y: 10, b: 6 });`,
};
