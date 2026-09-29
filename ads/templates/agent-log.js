// Agent log (Remotion V3's zoomed-in agent card and the ChatDemo task list): a card for one agent (an accent avatar
// with the mark, the agent's name, "● working now" in green), then its work rows: each starts dim beside an empty
// square box, and as it's done the box fills ink and an accent check strokes in. Rows can carry a mono agent label.
// An optional two-tone headline sits above.
import { ATLAS_MARK } from "./_parts.js";

const rows = (c) => (c.items || []).map((x) => {
  const [a, b] = String(x || "").split("|").map((s) => s.trim());
  return b ? { agent: a, job: b } : { agent: "", job: a };
}).filter((r) => r.job).slice(0, 5);
const r3 = (n) => Math.round(n * 1000) / 1000;
const times = (duration, n) => {
  const len = Math.max(1.6, Number(duration) || 3);
  const gap = Math.min(0.6, Math.max(0.25, (len - 1.4) / Math.max(1, n)));
  return Array.from({ length: n }, (_, k) => r3(0.8 + k * gap));
};

export default {
  id: "agent-log",
  name: "Agent work log",
  job: "proof",
  scene: "optional",
  use: 'One agent (or the team) doing the work, item by item ("the marketing assistant wrote 10 hooks, edited 3 videos, built the ad sets", "each one does the work"). Pairs with the orbit network; paper or dark.',
  fields: 'text = the agent\'s name (e.g. "Marketing Assistant"); sub = its status (default "working now"); items = 2–5 jobs, each "job" or "AGENT | job" (e.g. "Wrote 10 hooks for back pain", "Video Editor | 3 ads cut + captioned"); highlight = an optional headline as "line 1 / line 2" (e.g. "Each one / does the work.").',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => [["atlas-pop", 0.05, 0.45], ...times(g.duration, rows(g).length).map((t) => ["atlas-click", t, 0.45])],
  data: (c) => ({ n: rows(c).length, times: times(c.duration, rows(c).length) }),
  css: ({ px, W, tall }) => `
      .tp-al { width: ${Math.round(W * (tall ? 0.86 : 0.5))}px; }
      .tp-al .mk-h { margin-bottom: ${px(60)}px; font-size: ${px(tall ? 96 : 80)}px; letter-spacing: -0.03em; line-height: 1; }
      .tp-al-card { padding: ${px(44)}px; }
      .tp-al-top { display: flex; align-items: center; gap: ${px(18)}px; margin-bottom: ${px(12)}px; }
      .tp-al-av { flex: none; display: grid; place-items: center; width: ${px(90)}px; height: ${px(90)}px; padding: ${px(15)}px; box-sizing: border-box; border-radius: 50%; background: var(--ac); color: var(--on-ac); }
      .tp-al-top b { display: block; font-weight: 700; font-size: ${px(44)}px; color: var(--tx); }
      .tp-al-top span { font-weight: 600; font-size: ${px(28)}px; color: var(--ok); }
      .tp-al-row { display: flex; align-items: center; gap: ${px(18)}px; margin-top: ${px(26)}px; opacity: .3; }
      .tp-al-box { flex: none; position: relative; width: ${px(50)}px; height: ${px(50)}px; box-sizing: border-box; border-radius: ${px(14)}px; border: ${px(3)}px solid var(--tx); }
      .tp-al-box i { position: absolute; inset: ${px(-3)}px; border-radius: inherit; background: var(--tx); opacity: 0; }
      .tp-al-box svg { position: absolute; inset: ${px(6)}px; }
      .tp-al-box path { fill: none; stroke: var(--ac); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; }
      .tp-al-row small { display: block; font-family: var(--f-mono); font-size: ${px(22)}px; letter-spacing: .08em; text-transform: uppercase; color: var(--ac); }
      .tp-al-row b { display: block; font-weight: 600; font-size: ${px(36)}px; color: var(--tx); }`,
  html: ({ id, c, esc }) => {
    const hl = String(c.highlight || "").split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
    return `<div class="tp-al" id="${id}-wrap">${hl.length ? `<h3 class="mk-h"><span id="${id}-h1">${esc(hl[0])}</span>${hl[1] ? `<span class="ac" id="${id}-h2">${esc(hl[1])}</span>` : ""}</h3>` : ""}<div class="mk-card tp-al-card" id="${id}-card"><div class="tp-al-top"><span class="tp-al-av">${ATLAS_MARK()}</span><div><b>${esc(c.text || "Atlas")}</b><span>● ${esc(c.sub || "working now")}</span></div></div>${rows(c).map((r, i) => `<div class="tp-al-row" id="${id}-r${i}"><span class="tp-al-box"><i id="${id}-f${i}"></i><svg viewBox="0 0 24 24"><path id="${id}-k${i}" d="M4 12.5l5 5L20 6.5"/></svg></span><div>${r.agent ? `<small>${esc(r.agent)}</small>` : ""}<b>${esc(r.job)}</b></div></div>`).join("")}</div></div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-h1", t0, { y: 24, b: 10 });
    blurIn(el + "-h2", t0 + 0.15, { y: 24, b: 10 });
    blurIn(el + "-card", t0 + 0.1, { y: 60, b: 10, d: 0.7 });
    for (var i = 0; i < d.n; i++) {
      var at = t0 + d.times[i];
      tl.fromTo(el + "-r" + i, { opacity: 0.3 }, { opacity: 1, duration: 0.4, ease: "expo.out", immediateRender: false }, at);
      tl.fromTo(el + "-f" + i, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, at + 0.1);
      tl.fromTo(el + "-k" + i, { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.4, ease: "expo.out", immediateRender: false }, at + 0.1);
    }`,
};
