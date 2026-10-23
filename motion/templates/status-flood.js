// Status flood (the Jeremy AI demo, 7.5–9.5 s): one status pill in the middle of the frame cycling through a task's
// states ("● Working" → "● Approval needed" → "● Ready for review" → "● Complete"). With each state the whole frame
// floods its colour (amber, cyan, violet, green) under diagonal light streaks, and a thin outline ring hugs the pill.
const STATES = [
  [/work|progress|running|busy/i, "#F5B63F"],
  [/approv|needs you|waiting|review needed/i, "#4FD1E8"],
  [/review|ready|draft/i, "#9B6BFF"],
  [/complete|done|live|sent|booked|finished/i, "#3DDC84"],
];
const colorOf = (s, i) => STATES.find(([re]) => re.test(s))?.[1] || ["#F5B63F", "#4FD1E8", "#9B6BFF", "#3DDC84"][i % 4];
const list = (c) => (c.items || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 5);
const r3 = (n) => Math.round(n * 1000) / 1000;
const gap = (duration, n) => Math.max(0.4, ((Number(duration) || 2.4) - 0.3) / Math.max(1, n));

export default {
  id: "status-flood",
  name: "Status flood",
  job: "product",
  scene: "always",
  use: 'A task moving through its stages to done ("it works on it, asks for your approval, gets it ready, done", "you always know where it stands"). Punchy full-screen colour beats, about 0.5 s per status.',
  fields: 'items = 2–5 statuses in order, 1–3 words each (e.g. "Working", "Approval needed", "Ready for review", "Complete"). Colours follow the words: working amber, approval cyan, review violet, complete green.',
  position: "center",
  anchor: null,
  minLen: 1.6,
  sfx: (g) => list(g).map((_, i, all) => [i === all.length - 1 ? "atlas-success" : "atlas-click", r3(0.05 + i * gap(g.duration, all.length)), i === all.length - 1 ? 0.55 : 0.5]),
  data: (c) => ({ n: list(c).length, gap: r3(gap(c.duration, list(c).length)), colors: list(c).map(colorOf) }),
  css: ({ px, tall }) => `
      .tp-sf { position: absolute; inset: 0; overflow: hidden; display: grid; place-items: center; }
      .tp-sf-flood { position: absolute; inset: 0; opacity: 0; }
      .tp-sf-streaks { position: absolute; inset: -30%; transform: rotate(-28deg); }
      .tp-sf-streaks i { position: absolute; height: ${px(3)}px; border-radius: ${px(2)}px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent); opacity: .35; }
      .tp-sf-stack { position: relative; display: grid; place-items: center; }
      .tp-sf-ring { position: absolute; inset: ${px(-44)}px ${px(-70)}px; border-radius: 999px; border: ${Math.max(1, px(2))}px solid; opacity: .5; }
      .tp-sf-pill { grid-area: 1 / 1; display: flex; align-items: center; gap: ${px(26)}px; padding: ${px(tall ? 34 : 28)}px ${px(tall ? 60 : 50)}px; border-radius: 999px; background: rgba(23,18,15,.88); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.08), 0 ${px(20)}px ${px(60)}px rgba(0,0,0,.4); opacity: 0; white-space: nowrap; }
      .tp-sf-pill i { width: ${px(tall ? 46 : 40)}px; height: ${px(tall ? 46 : 40)}px; border-radius: 50%; }
      .tp-sf-pill b { font-family: var(--f-ui, "Inter"), sans-serif; font-weight: 600; font-size: ${px(tall ? 80 : 68)}px; letter-spacing: -0.02em; color: #FBF1E8; text-shadow: 0 0 .3em rgba(255,255,255,.25); }`,
  html: ({ id, c, esc }) => {
    const states = list(c);
    const streaks = Array.from({ length: 16 }, (_, k) => {
      const top = (k * 37) % 100;
      const left = (k * 53) % 100;
      const w = 12 + ((k * 29) % 22);
      return `<i style="top:${top}%;left:${left}%;width:${w}%"></i>`;
    }).join("");
    return `<div class="tp-sf" id="${id}-wrap">${states.map((s, i) => `<div class="tp-sf-flood" id="${id}-f${i}" style="background: radial-gradient(ellipse at 50% 50%, ${colorOf(s, i)}, color-mix(in srgb, ${colorOf(s, i)} 55%, #000) 75%)"></div>`).join("")}<div class="tp-sf-streaks" id="${id}-st">${streaks}</div><div class="tp-sf-stack"><i class="tp-sf-ring" id="${id}-ring"></i>${states.map((s, i) => `<div class="tp-sf-pill" id="${id}-p${i}"><i style="background:${colorOf(s, i)};box-shadow:0 0 .6em ${colorOf(s, i)}"></i><b>${esc(s)}</b></div>`).join("")}</div></div>`;
  },
  script: `
    var d = c.data;
    tl.fromTo(el + "-st", { xPercent: -6 }, { xPercent: 6, duration: len, ease: "none", immediateRender: false }, t0);
    for (var i = 0; i < d.n; i++) {
      var at = t0 + 0.05 + i * d.gap;
      tl.set(el + "-f" + i, { opacity: 1 }, at);
      tl.set(el + "-ring", { borderColor: d.colors[i] }, at);
      tl.fromTo(el + "-p" + i, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.22, ease: "expo.out", immediateRender: false }, at);
      if (i < d.n - 1) { tl.set(el + "-p" + i, { opacity: 0 }, at + d.gap); tl.set(el + "-f" + i, { opacity: 0 }, at + d.gap); }
    }
    tl.fromTo(el + "-ring", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 0.5, duration: 0.4, ease: "expo.out", immediateRender: false }, t0 + 0.05);`,
};
