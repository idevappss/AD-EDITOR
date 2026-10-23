// Schedule clock (atlas-motion-kit.md #5): a mono accent kicker, a huge glowing clock with a small AM/PM, a row of
// weekday chips with one filled in the accent, and a two-tone line under it.
import { slots } from "./_parts.js";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** "Fri", "friday", "F" → 4 (Friday when unclear). */
function dayIndex(s) {
  const t = String(s || "").trim().toLowerCase();
  const i = NAMES.findIndex((n) => t.startsWith(n));
  if (i >= 0) return i;
  const j = { m: 0, w: 2, f: 4 }[t];
  return j ?? 4;
}
/** "Fri" → [4]; "Mon-Fri" / "weekdays" → [0..4]; "Mon, Wed, Fri" → [0, 2, 4]; "daily" → all seven. */
function dayList(s) {
  const t = String(s || "").trim().toLowerCase();
  if (/week ?days/.test(t)) return [0, 1, 2, 3, 4];
  if (/daily|every ?day/.test(t)) return [0, 1, 2, 3, 4, 5, 6];
  const range = t.match(/^(\w+)\s*[-–]\s*(\w+)$/);
  if (range) {
    const [a, b] = [dayIndex(range[1]), dayIndex(range[2])];
    return Array.from({ length: b - a + 1 }, (_, i) => a + i).filter((i) => i >= 0);
  }
  return [...new Set(t.split(/[,\s]+/).filter(Boolean).map(dayIndex))];
}

function clock(text) {
  const m = String(text || "").match(/(\d{1,2})[:.](\d{2})\s*([ap]\.?m\.?)?/i);
  if (!m) return { h: "9", m: "00", ap: "AM" };
  return { h: m[1], m: m[2], ap: m[3] ? m[3].replace(/\./g, "").toUpperCase() : "" };
}

export default {
  id: "schedule-clock",
  name: "Schedule clock",
  job: "benefit",
  scene: "optional",
  use: 'Something that runs on a schedule by itself ("every Friday at noon you get your report", "every Monday at 7am", "set it once, never ask twice").',
  fields: 'text = the time (e.g. "11:58 AM"); sub = a mono kicker, 3–6 words (e.g. "Every Friday · weekly ads report"); items = [the day or days (e.g. "Fri", "Mon-Fri", "weekdays"), an optional line (e.g. "Put it on a schedule."), an optional accent line (e.g. "Never ask twice.")]. Write "-" for a slot you leave empty.',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: [["atlas-whoosh", 0.02, 0.45], ["atlas-click", 0.25, 0.4], ["atlas-pop", 0.75, 0.6]],
  data: (c) => {
    const t = clock(c.text);
    return { min: Number(t.m), pad: t.m.length };
  },
  css: ({ px, W, tall }) => `
      .tp-sc { width: ${Math.round(W * (tall ? 0.84 : 0.44))}px; text-align: left; }
            .tp-sc-time { display: flex; align-items: baseline; gap: ${px(12)}px; margin: ${px(8)}px 0 ${px(14)}px; font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 290 : 220)}px; line-height: 1; letter-spacing: -0.04em; color: var(--tx); font-variant-numeric: tabular-nums; text-shadow: none; }
      .tp-sc-time > span, .tp-sc-time > small { filter: drop-shadow(0 0 .12em rgba(251,241,232,.45)) drop-shadow(0 0 .3em rgba(251,241,232,.2)); }
      .ag.tone-paper .tp-sc-time > span, .ag.tone-paper .tp-sc-time > small { filter: none; }
      .tp-sc-roll { display: inline-flex; align-items: flex-start; height: 1em; overflow: hidden; }
      .tp-sc-reel { display: flex; flex-direction: column; flex: none; height: 10em; }
      .tp-sc-reel b { display: block; height: 1em; font-weight: inherit; line-height: 1; }
      .tp-sc-time small { font-size: .27em; letter-spacing: -0.01em; }
      .tp-sc-days { display: flex; gap: ${px(12)}px; margin-bottom: ${px(34)}px; }
      .tp-sc-days span { position: relative; display: grid; place-items: center; width: ${px(96)}px; height: ${px(76)}px; border-radius: ${px(20)}px; background: color-mix(in srgb, var(--tx) 8%, transparent); font-weight: 700; font-size: ${px(34)}px; color: var(--tx2); }
      .tp-sc-days span.on b { color: var(--on-ac); opacity: 0; }
      .tp-sc-days span i { position: absolute; inset: 0; border-radius: inherit; background: var(--ac); box-shadow: 0 0 ${px(24)}px color-mix(in srgb, var(--ac) 60%, transparent); opacity: 0; }
      .tp-sc-days span b { position: relative; font-weight: 700; }
      .tp-sc .mk-h { font-size: ${px(tall ? 84 : 70)}px; margin-top: ${px(60)}px; }
      .tp-sc .mk-kick { font-size: ${px(30)}px; }`,
  html: ({ id, c, esc }) => {
    const t = clock(c.text);
    const [day, l1, l2] = slots(c, 3);
    const on = dayList(day || "Fri");
    return `<div class="tp-sc" id="${id}-wrap">${c.sub ? `<div class="mk-kick" id="${id}-k">${esc(c.sub)}</div>` : ""}<div class="tp-sc-time" id="${id}-t"><span>${esc(t.h)}:</span><span class="tp-sc-roll">${[...t.m].map((dg, k) => `<span class="tp-sc-reel" id="${id}-r${k}">${Array.from({ length: 10 }, (_, n) => `<b>${(Number(dg) + n + 1) % 10}</b>`).join("")}</span>`).join("")}</span>${t.ap ? `<small>${esc(t.ap)}</small>` : ""}</div><div class="tp-sc-days" id="${id}-days">${DAYS.map((d, i) => `<span${on.includes(i) ? ` class="on" id="${id}-on${i}"` : ""}>${on.includes(i) ? `<i></i>` : ""}<b>${d}</b></span>`).join("")}</div>${l1 || l2 ? `<h3 class="mk-h">${l1 ? `<span id="${id}-l1">${esc(l1)}</span>` : ""}${l2 ? `<span class="ac" id="${id}-l2">${esc(l2)}</span>` : ""}</h3>` : ""}</div>`;
  },
  script: `
    blurIn(el + "-k", t0, { y: 10, b: 8 });
    blurIn(el + "-t", t0 + 0.1, { y: 20, b: 18, d: 0.8 });
    // The minutes roll like a slot machine and land on the time (each reel spins a full turn, the last one longer).
    for (var r = 0; r < c.data.pad; r++) tl.fromTo(el + "-r" + r, { yPercent: 0 }, { yPercent: -90, duration: 0.7 + r * 0.25, ease: "expo.out", immediateRender: false }, t0 + 0.15);
    blurIn(el + "-days > span", t0 + 0.3, { y: 10, b: 6, d: 0.4, st: 0.04 });
    document.querySelectorAll(el + "-days > span.on").forEach(function (chip, k) {
      tl.fromTo(chip.querySelector("i"), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, t0 + 0.75 + k * 0.06);
      tl.fromTo(chip.querySelector("b"), { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + 0.75 + k * 0.06);
      tl.fromTo(chip, { scale: 1 }, { scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, t0 + 0.75 + k * 0.06);
    });
    blurIn(el + "-l1", t0 + 0.7, { y: 16 });
    blurIn(el + "-l2", t0 + 1.05, { y: 16 });`,
};
