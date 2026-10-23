// Search CTA (new, 2026-09-29; for "click below and search your seven day free trial"): a glass search bar blurs in and
// the query types itself, the search fires, and a result card drops in under it — the mark, the product line, the
// accent button and the URL — then a cursor glides in and clicks the button (a soft ring bursts out).
import { CURSOR_SVG, brandMark, chars, slots } from "./_parts.js";

const r3 = (n) => Math.round(n * 1000) / 1000;
const beats = (c) => {
  const len = Math.max(2, Number(c.duration) || 3);
  const q = String(c.sub || "atlas 7 day free trial");
  const type = Math.min(1.1, Math.max(0.5, q.length * 0.04));
  const go = 0.35 + type + 0.15;
  const card = go + 0.2;
  const click = Math.min(len - 0.5, card + 0.85);
  return { type: r3(type), go: r3(go), card: r3(card), click: r3(click) };
};

export default {
  id: "search-cta",
  name: "Search CTA",
  job: "cta",
  scene: "optional",
  use: 'The close when the speaker says to search or look it up ("click below and search your seven day free trial", "search Atlas", "look it up"), or any CTA for a fresh look: the query types, the result pops, the button gets clicked. Rotate with the button CTA and the end card.',
  fields: 'sub = the search query, lower case, 2–6 words (e.g. "atlas 7 day free trial"); text = the button (the offer\'s CTA, e.g. "Start Your 7 Day Free Trial"); highlight = the URL or a mono line under the button (e.g. "app.atlas-ai.club"); items = [the result\'s title line (e.g. "Atlas · AI employees for healthcare")].',
  position: "center",
  anchor: "cta",
  minLen: 2.4,
  sfx: (g) => {
    const b = beats(g);
    return [["atlas-pop", 0, 0.45], ["atlas-typing", 0.35, 0.3], ["atlas-whoosh", b.go, 0.3], ["atlas-click", b.click, 0.9], ["atlas-success", r3(b.click + 0.1), 0.5]];
  },
  data: (c) => beats(c),
  css: ({ px, W, tall }) => `
      .tp-sc { position: relative; width: ${Math.round(W * (tall ? 0.86 : 0.56))}px; padding-bottom: ${px(40)}px; }
      .tp-sc-bar { display: flex; align-items: center; gap: ${px(20)}px; padding: ${px(26)}px ${px(30)}px; border-radius: 999px; background: rgba(28,22,19,.82); box-shadow: inset 0 0 0 1px rgba(251,241,232,.14), 0 ${px(20)}px ${px(50)}px rgba(0,0,0,.35); }
      .ag.tone-paper .tp-sc-bar { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08), 0 ${px(20)}px ${px(50)}px rgba(23,18,15,.12); }
      .tp-sc-bar svg { flex: none; width: ${px(40)}px; height: ${px(40)}px; color: var(--tx2); }
      .tp-sc-q { flex: 1; min-width: 0; font-weight: 500; font-size: ${px(tall ? 44 : 38)}px; color: var(--tx); white-space: nowrap; overflow: hidden; }
      .tp-sc-go { flex: none; display: grid; place-items: center; width: ${px(64)}px; height: ${px(64)}px; border-radius: 50%; background: var(--ac); color: var(--on-ac); }
      .tp-sc-go svg { width: ${px(30)}px; height: ${px(30)}px; color: inherit; }
      .tp-sc-card { margin-top: ${px(26)}px; padding: ${px(34)}px ${px(36)}px; border-radius: ${px(34)}px; background: linear-gradient(160deg, rgba(42,34,30,.92), rgba(28,23,20,.92)); box-shadow: inset 0 0 0 1px rgba(251,241,232,.12), 0 ${px(30)}px ${px(70)}px rgba(0,0,0,.4); }
      .ag.tone-accent .tp-sc-bar, .ag.tone-accent .tp-sc-card { --ac: var(--brand, #EE7440); --on-ac: #17120F; --tx: #FBF1E8; --tx2: rgba(251,241,232,.62); --line: rgba(251,241,232,.14); --chip: rgba(251,241,232,.08); }
      .ag.tone-paper .tp-sc-card { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08), 0 ${px(30)}px ${px(70)}px rgba(23,18,15,.14); }
      .tp-sc-top { display: flex; align-items: center; gap: ${px(22)}px; }
      .tp-sc-mark { flex: none; display: grid; place-items: center; width: ${px(86)}px; height: ${px(86)}px; padding: ${px(14)}px; box-sizing: border-box; border-radius: ${px(24)}px; background: var(--ink); color: var(--ac); }
      .tp-sc-mark img { width: 100%; height: 100%; object-fit: contain; }
      .tp-sc-title { font-weight: 700; font-size: ${px(36)}px; letter-spacing: -0.01em; color: var(--tx); line-height: 1.15; }
      .tp-sc-btn { position: relative; margin-top: ${px(30)}px; padding: ${px(28)}px ${px(30)}px; border-radius: 999px; text-align: center; background: var(--ac); color: var(--on-ac); font-weight: 700; font-size: ${px(tall ? 44 : 38)}px; letter-spacing: -0.01em; box-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .tp-sc-url { margin-top: ${px(18)}px; text-align: center; font-family: var(--f-mono); font-size: ${px(24)}px; letter-spacing: .12em; color: var(--tx2); }
      .tp-sc-ring { position: absolute; left: 50%; top: 50%; width: ${px(700)}px; height: ${px(700)}px; margin: ${px(-350)}px 0 0 ${px(-350)}px; border-radius: 50%; border: ${px(3)}px solid var(--ac); opacity: 0; pointer-events: none; }
      .tp-sc-cur { position: absolute; right: 22%; bottom: ${px(10)}px; width: ${px(58)}px; height: ${px(58)}px; filter: drop-shadow(0 ${px(6)}px ${px(10)}px rgba(0,0,0,.45)); }`,
  html: ({ id, c, esc, logo }) => {
    const [title] = slots(c, 1);
    const q = String(c.sub || "atlas 7 day free trial");
    return `<div class="tp-sc" id="${id}-wrap"><div class="tp-sc-bar" id="${id}-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><div class="tp-sc-q">${chars(q, `${id}-c`, esc)}<i class="mk-caret" id="${id}-caret"></i></div><span class="tp-sc-go" id="${id}-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div><div class="tp-sc-card" id="${id}-card"><div class="tp-sc-top"><span class="tp-sc-mark">${brandMark(logo, esc)}</span><div class="tp-sc-title">${esc(title || "Atlas · AI employees for healthcare")}</div></div><div class="tp-sc-btn" id="${id}-btn"><i class="tp-sc-ring" id="${id}-ring"></i>${esc(c.text || "Start Your 7 Day Free Trial")}</div>${c.highlight ? `<div class="tp-sc-url">${esc(c.highlight)}</div>` : ""}</div><span class="tp-sc-cur" id="${id}-cur">${CURSOR_SVG}</span></div>`;
  },
  script: `
    var d = c.data, n = document.querySelectorAll(el + "-wrap .mk-ch").length;
    blurIn(el + "-bar", t0, { y: 18, s: 0.96 });
    typeOn(el + "-c", n, t0 + 0.35, d.type);
    blink(el + "-caret", t0 + 0.35 + d.type, t0 + d.go + 0.1);
    tl.set(el + "-caret", { opacity: 0 }, t0 + d.go + 0.1);
    tl.fromTo(el + "-go", { scale: 1 }, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, t0 + d.go);
    blurIn(el + "-card", t0 + d.card, { y: 30, s: 0.96, b: 16, d: 0.75 });
    var k = t0 + d.click;
    hide(el + "-cur");
    tl.fromTo(el + "-cur", { autoAlpha: 0, x: 160, y: 140 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, k - 0.57);
    tl.fromTo(el + "-cur", { scale: 1 }, { scale: 0.84, duration: 0.07, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
    tl.fromTo(el + "-btn", { scale: 1 }, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
    tl.fromTo(el + "-ring", { scale: 0.3, opacity: 0.6 }, { scale: 1.4, opacity: 0, duration: 0.9, ease: "expo.out", immediateRender: false }, k + 0.04);
    tl.fromTo(el + "-cur", { autoAlpha: 1 }, { autoAlpha: 0, x: 50, y: 50, duration: 0.4, ease: "power2.in", immediateRender: false }, k + 0.5);`,
};
