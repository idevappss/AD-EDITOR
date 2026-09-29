// Approval card (Remotion V3 "approval tap", the ChatDemo approve bubble): an optional two-tone headline ("You stay in /
// control."), then a card with a mono "APPROVAL NEEDED" kicker, the question, a detail line, and [Approve] [Edit]. A
// soft tap circle glides in and presses Approve, which turns green and reads "Live ✓".
import { GREEN, slots } from "./_parts.js";

const r3 = (n) => Math.round(n * 1000) / 1000;
const tap = (duration) => r3(Math.min(1.8, Math.max(0.9, (Number(duration) || 2.6) * 0.55)));

export default {
  id: "approval-card",
  name: "Approval card",
  job: "product",
  scene: "optional",
  use: 'You approve the big things with one tap ("nothing goes live until you approve it", "you stay in control", "just hit approve"). A fuller version of the approval pill, with what is being approved.',
  fields: 'text = the question (e.g. "Publish the back pain campaign?"); sub = a detail line (e.g. "3 videos · 10 hooks · 2 ad sets · $40/day"); highlight = an optional headline as "line 1 / line 2" (e.g. "You stay in / control."); items = [the button (default "Approve"), after the tap (default "Live ✓"), the kicker (default "Approval needed")]. Write "-" for a slot you leave empty.',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => [["atlas-ding", 0.05, 0.55], ["atlas-click", tap(g.duration), 0.9], ["atlas-success", tap(g.duration) + 0.1, 0.6]],
  data: (c) => ({ tap: tap(c.duration) }),
  css: ({ px, W, tall }) => `
      .tp-ac2 { position: relative; width: ${Math.round(W * (tall ? 0.82 : 0.5))}px; text-align: left; }
      .tp-ac2 .mk-h { margin-bottom: ${px(70)}px; text-align: center; font-size: ${px(tall ? 92 : 78)}px; letter-spacing: -0.03em; line-height: 1; }
      .tp-ac2-card { padding: ${px(40)}px ${px(44)}px; }
      .tp-ac2-card .mk-kick { font-size: ${px(24)}px; }
      .tp-ac2-q { margin-top: ${px(12)}px; font-weight: 700; font-size: ${px(42)}px; line-height: 1.2; color: var(--tx); }
      .tp-ac2-meta { margin-top: ${px(8)}px; font-weight: 500; font-size: ${px(30)}px; color: var(--tx2); }
      .tp-ac2-btns { display: flex; align-items: center; gap: ${px(20)}px; margin-top: ${px(30)}px; }
      .tp-ac2-go { position: relative; display: grid; border-radius: ${px(26)}px; font-weight: 700; font-size: ${px(36)}px; color: var(--ink); }
      .tp-ac2-go span { grid-area: 1 / 1; padding: ${px(18)}px ${px(44)}px; border-radius: inherit; background: var(--ac); white-space: nowrap; }
      .tp-ac2-go span:first-child { color: var(--on-ac); }
      .tp-ac2-go span + span { background: ${GREEN}; opacity: 0; }
      .tp-ac2-edit { padding: ${px(18)}px ${px(20)}px; font-weight: 600; font-size: ${px(36)}px; color: var(--tx2); }
      .tp-ac2-tap { position: absolute; width: ${px(90)}px; height: ${px(90)}px; border-radius: 50%; background: color-mix(in srgb, var(--tx) 18%, transparent); box-shadow: inset 0 0 0 ${px(3)}px color-mix(in srgb, var(--tx) 40%, transparent); pointer-events: none; }`,
  html: ({ id, c, esc }) => {
    const hl = String(c.highlight || "").split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
    const [btn, after, kick] = slots(c, 3);
    return `<div class="tp-ac2" id="${id}-wrap">${hl.length ? `<h3 class="mk-h"><span id="${id}-h1">${esc(hl[0])}</span>${hl[1] ? `<span class="ac" id="${id}-h2">${esc(hl[1])}</span>` : ""}</h3>` : ""}<div class="mk-card tp-ac2-card" id="${id}-card"><div class="mk-kick">${esc(kick || "Approval needed")}</div><div class="tp-ac2-q">${esc(c.text)}</div>${c.sub ? `<div class="tp-ac2-meta">${esc(c.sub)}</div>` : ""}<div class="tp-ac2-btns"><span class="tp-ac2-go" id="${id}-go"><span>${esc(btn || "Approve")}</span><span id="${id}-live">${esc(after || "Live ✓")}</span></span><span class="tp-ac2-edit">Edit</span></div></div><i class="tp-ac2-tap" id="${id}-tap"></i></div>`;
  },
  script: `
    var k = t0 + c.data.tap, go = document.querySelector(el + "-go"), wrap = document.querySelector(el + "-wrap");
    blurIn(el + "-h1", t0, { y: 24, b: 10 });
    blurIn(el + "-h2", t0 + 0.15, { y: 24, b: 10 });
    blurIn(el + "-card", t0 + 0.1, { y: 50, b: 10, d: 0.7 });
    if (go && wrap) {
      var gx = go.offsetLeft + go.offsetWidth * 0.55, gy = go.offsetTop + go.offsetHeight * 0.5, p = go.offsetParent;
      while (p && p !== wrap) { gx += p.offsetLeft; gy += p.offsetTop; p = p.offsetParent; }
      var tapEl = document.querySelector(el + "-tap"), sz = tapEl ? tapEl.offsetWidth / 2 : 45;
      hide(el + "-tap");
      tl.fromTo(el + "-tap", { autoAlpha: 0, left: gx + 420, top: gy + 300 }, { autoAlpha: 1, left: gx - sz, top: gy - sz, duration: 0.9, ease: "expo.out", immediateRender: false }, k - 0.95);
      tl.fromTo(el + "-tap", { scale: 1 }, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
      tl.fromTo(el + "-tap", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, k + 0.4);
    }
    tl.fromTo(el + "-go", { scale: 1 }, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
    tl.fromTo(el + "-live", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, k + 0.1);`,
};
