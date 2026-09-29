// Notification pile-up (atlas-motion-kit.md #8; Remotion "Chaos"): the chaos of running a clinic. A mono time and a red
// unread badge counting up, an optional role headline ("You're the doctor. / The front desk. / The marketer.", first
// line cream, the rest in the accent), and notifications dropping in from above, each slightly off-square, with
// a ding each. Near the end the pile starts to shake.
import { MONO, RED, statusTone } from "./_parts.js";

const rows = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[1] || r[0]).slice(0, 6);
const heads = (c) => String(c.highlight || "").split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 4);
const r3 = (n) => Math.round(n * 1000) / 1000;
const gap = (duration, n) => Math.min(0.45, Math.max(0.2, ((Number(duration) || 3) - 1.4) / Math.max(1, n)));
const unread = (text) => Number(String(text || "").match(/\d+/)?.[0] || 0);
const ROT = [-1.5, 1.2, -0.8, 1.6, -1.2, 0.9];

export default {
  id: "notif-stack",
  name: "Notification pile-up",
  job: "proof",
  scene: "optional",
  use: 'The pain of doing everything yourself ("missed calls, leads waiting, the report not done, the front desk called out", "you\'re the doctor, the front desk, the marketer, the IT guy"). The problem before the fix; best full-screen.',
  fields: 'items = 3–6 notifications as "LABEL | Title | detail" (e.g. "Phone | Missed call | New patient inquiry · no voicemail", "Leads | Lead waiting 3 days | \\"Do you help with sciatica?\\""); text = the unread count it climbs to (e.g. "47 unread"); sub = a mono time (e.g. "Tue · 9:47 AM"); highlight = an optional role headline, lines split by " / " (spaces around the slash) (e.g. "You\'re the doctor. / The front desk. / The marketer. / The IT guy.").',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => rows(g).map((_, i) => ["atlas-ding", r3(0.45 + i * gap(g.duration, rows(g).length)), 0.32]),
  data: (c) => ({ n: rows(c).length, h: heads(c).length, gap: r3(gap(c.duration, rows(c).length)), unread: unread(c.text) }),
  css: ({ px, W, tall }) => `
      .tp-ns { width: ${Math.round(W * (tall ? 0.84 : 0.46))}px; }
      .tp-ns-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: ${px(34)}px; }
      .tp-ns-time { font-family: ${MONO}; font-size: ${px(28)}px; letter-spacing: .14em; text-transform: uppercase; color: var(--tx2); }
      .tp-ns-badge { padding: ${px(8)}px ${px(22)}px; border-radius: 999px; background: ${RED}; color: #fff; font-weight: 700; font-size: ${px(30)}px; font-variant-numeric: tabular-nums; }
      .tp-ns .mk-h { font-size: ${px(tall ? 88 : 76)}px; margin-bottom: ${px(44)}px; }
      .tp-ns-card { position: relative; display: flex; align-items: center; gap: ${px(22)}px; margin-top: ${px(-10)}px; padding: ${px(18)}px ${px(30)}px; border-radius: ${px(32)}px; background: #2A221D; box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(251,241,232,.12), 0 ${px(30)}px ${px(60)}px rgba(0,0,0,.35); }
      .ag.tone-paper .tp-ns-card { background: #fff; box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(23,18,15,.08), 0 ${px(24)}px ${px(50)}px rgba(23,18,15,.12); }
      .tp-ns-card:first-of-type { margin-top: 0; }
      .tp-ns-card > i { flex: none; width: ${px(20)}px; height: ${px(20)}px; border-radius: 50%; background: currentColor; box-shadow: 0 0 ${px(18)}px currentColor; }
      .tp-ns-card small { display: block; font-family: ${MONO}; font-size: ${px(22)}px; letter-spacing: .12em; text-transform: uppercase; color: var(--tx2); }
      .tp-ns-card b { display: block; font-weight: 700; font-size: ${px(38)}px; color: var(--tx); }
      .tp-ns-card p { margin: 0; font-weight: 500; font-size: ${px(28)}px; color: var(--tx2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tp-ns-card div { min-width: 0; }`,
  html: ({ id, c, esc }) => {
    const list = rows(c);
    const hl = heads(c);
    const n = unread(c.text);
    return `<div class="tp-ns" id="${id}-wrap"><div class="tp-ns-top" id="${id}-top"><span class="tp-ns-time">${esc(c.sub || "")}</span>${c.text ? `<span class="tp-ns-badge"><span id="${id}-u">${n || ""}</span>${esc(String(c.text).replace(/^\s*\d+\s*/, " "))}</span>` : ""}</div>${hl.length ? `<h3 class="mk-h">${hl.map((l, i) => `<span${i ? ` class="ac"` : ""} id="${id}-h${i}">${esc(l)}</span>`).join("")}</h3>` : ""}<div id="${id}-pile">${list.map(([label, title = "", detail = ""], i) => {
      const tone = statusTone(`${label} ${title}`);
      return `<div class="tp-ns-card" id="${id}-n${i}" style="z-index:${i + 1};transform:rotate(${ROT[i]}deg)"><i class="st-${tone === "ac" || tone === "ok" ? "warn" : tone}"></i><div><small>${esc(label)} · now</small><b>${esc(title || label)}</b>${detail ? `<p>${esc(detail)}</p>` : ""}</div></div>`;
    }).join("")}</div></div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-top", t0, { y: 10, b: 6, d: 0.45 });
    for (var h = 0; h < d.h; h++) blurIn(el + "-h" + h, t0 + 0.1 + h * 0.3, { x: -60, y: 0, s: 1, b: 8, d: 0.55 });
    var first = t0 + 0.45;
    for (var i = 0; i < d.n; i++) {
      hide(el + "-n" + i);
      tl.fromTo(el + "-n" + i, { autoAlpha: 0, y: -140, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out", immediateRender: false }, first + i * d.gap);
    }
    var u = document.querySelector(el + "-u");
    if (u && d.unread) {
      var o = { v: 0 }, from = Math.max(1, Math.round(d.unread * 0.07));
      tl.fromTo(o, { v: from }, { v: d.unread, duration: Math.max(0.6, d.n * d.gap + 0.4), ease: "expo.out", immediateRender: false, onUpdate: function () { u.textContent = Math.round(o.v); } }, first);
    }
    var shakeAt = Math.max(first + d.n * d.gap + 0.2, out - 0.8);
    if (shakeAt < out - 0.2) tl.fromTo(el + "-pile", { x: 0 }, { x: 5, duration: 0.05, yoyo: true, repeat: Math.floor((out - shakeAt) / 0.05), ease: "none", immediateRender: false }, shakeAt);`,
};
