// Line chart: a growth line draws itself up and to the right, a glowing dot rides its tip, the number counts up.
export default {
  id: "line-chart",
  name: "Growth line",
  job: "data",
  use: "Growth, revenue up, results climbing, a percentage increase.",
  fields: 'text = the result starting with the number (e.g. "+312%", "$84K"); sub = what it measures, 2–4 words (e.g. "revenue this month").',
  position: "top",
  anchor: "number",
  minLen: 2,
  sfx: [["whoosh-short", 0, 0.35], ["cash", 1.25, 0.45]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-line { position: relative; width: ${tall ? 84 : 48}%; padding: ${px(30)}px ${px(34)}px ${px(22)}px; border-radius: ${px(34)}px; background: rgba(10,12,14,.74); backdrop-filter: blur(${px(16)}px); -webkit-backdrop-filter: blur(${px(16)}px); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 ${px(26)}px ${px(70)}px rgba(0,0,0,.45); }
      .tp-line-head { display: flex; align-items: baseline; justify-content: space-between; gap: ${px(16)}px; }
      .tp-line-head b { font-weight: 900; font-size: ${px(80)}px; letter-spacing: -0.04em; color: #2FE06A; text-shadow: 0 0 ${px(26)}px rgba(47,224,106,.45); font-variant-numeric: tabular-nums; }
      .tp-line-head span { font-weight: 700; font-size: ${px(28)}px; color: rgba(255,255,255,.72); text-align: right; }
      .tp-line svg { display: block; width: 100%; height: ${px(230)}px; overflow: visible; margin-top: ${px(10)}px; }
      .tp-line .grid line { stroke: rgba(255,255,255,.08); stroke-width: 1; }
      .tp-line .path { fill: none; stroke: #2FE06A; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; filter: drop-shadow(0 0 6px rgba(47,224,106,.7)); }
      .tp-line .area { fill: url(#tp-line-grad); opacity: 0; }
      .tp-line .dot { fill: #fff; filter: drop-shadow(0 0 8px #2FE06A); opacity: 0; }`,
  html: ({ id, c, esc }) => {
    // A climb with a couple of dips, the same every time for this graphic.
    const pts = [[0, 82], [16, 74], [30, 77], [46, 58], [60, 62], [76, 36], [100, 12]];
    const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x * 4} ${y * 2}`).join(" ");
    return `<div class="tp-line" id="${id}-card"><div class="tp-line-head"><b id="${id}-num">${esc(c.text)}</b>${c.sub ? `<span>${esc(c.sub)}</span>` : ""}</div><svg viewBox="0 0 400 200" preserveAspectRatio="none"><defs><linearGradient id="tp-line-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2FE06A" stop-opacity=".35"/><stop offset="1" stop-color="#2FE06A" stop-opacity="0"/></linearGradient></defs><g class="grid">${[50, 100, 150].map((y) => `<line x1="0" x2="400" y1="${y}" y2="${y}"/>`).join("")}</g><path class="area" id="${id}-area" d="${d} L400 200 L0 200 Z"/><path class="path" id="${id}-path" d="${d}" pathLength="100"/><circle class="dot" id="${id}-dot" cx="400" cy="24" r="9"/></svg></div>`;
  },
  script: `
    floatIn(el + "-card", t0, { y: 80 });
    tl.fromTo(el + "-path", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", immediateRender: false }, t0 + 0.3);
    tl.fromTo(el + "-area", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out", immediateRender: false }, t0 + 0.8);
    tl.fromTo(el + "-dot", { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, t0 + 1.35);
    var node = document.querySelector(el + "-num"), m = node && node.textContent.match(/^([^\\d-]*)(-?[\\d,]*\\.?\\d+)(.*)$/);
    if (m && !/\\d\\s*\\/\\s*\\d/.test(node.textContent)) {
      var o = { v: 0 }, target = Number(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length;
      tl.fromTo(o, { v: 0 }, { v: target, duration: 1.1, ease: "power2.inOut", immediateRender: false, onUpdate: function () { node.textContent = m[1] + o.v.toFixed(dec) + m[3]; } }, t0 + 0.3);
    }
    drift(el + "-card", t0 + 1.4, len - 1.6, 5);`,
};
