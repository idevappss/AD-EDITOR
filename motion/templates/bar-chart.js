// Bar chart: bars grow in one after another, values count up, the hero bar in the brand colour. For growth and
// comparisons said in numbers.
const num = (v) => {
  const m = String(v).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
};
export default {
  id: "bar-chart",
  name: "Bar chart",
  job: "data",
  use: "Numbers compared or growing over time (before vs after, month by month, us vs them).",
  fields: 'text = chart title, 2–4 words; items = 2–5 "Label: value" pairs in order (e.g. "Jan: 12k"); highlight = the label of the hero bar.',
  position: "top",
  anchor: null,
  minLen: 2.2,
  sfx: [["whoosh-short", 0, 0.35], ["pop", 0.55, 0.35]],
  data: (c) => {
    const bars = (c.items || []).slice(0, 5).map((it) => {
      const [label, value = ""] = String(it).split(/:\s*/);
      return { label: label.trim(), value: value.trim(), n: num(value) };
    });
    const max = Math.max(1, ...bars.map((b) => b.n));
    const hero = bars.findIndex((b) => b.label.toLowerCase() === String(c.highlight || "").toLowerCase());
    return { bars: bars.map((b, i) => ({ ...b, h: Math.max(0.06, b.n / max), hot: hero >= 0 ? i === hero : i === bars.length - 1 })) };
  },
  css: ({ px, tall }) => `
      .tp-chart { position: relative; width: ${tall ? 82 : 46}%; padding: ${px(34)}px ${px(36)}px ${px(26)}px; border-radius: ${px(34)}px; background: rgba(12,12,16,.72); backdrop-filter: blur(${px(16)}px); -webkit-backdrop-filter: blur(${px(16)}px); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 ${px(26)}px ${px(70)}px rgba(0,0,0,.45); }
      .tp-chart h4 { margin: 0 0 ${px(22)}px; font-weight: 800; font-size: ${px(38)}px; letter-spacing: -0.01em; color: #fff; }
      .tp-bars { display: flex; align-items: flex-end; gap: ${px(22)}px; height: ${px(300)}px; }
      .tp-bar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: ${px(10)}px; }
      .tp-bar b { font-weight: 800; font-size: ${px(30)}px; color: #fff; font-variant-numeric: tabular-nums; }
      .tp-bar i { display: block; width: 100%; border-radius: ${px(14)}px ${px(14)}px ${px(6)}px ${px(6)}px; background: linear-gradient(180deg, rgba(255,255,255,.75), rgba(255,255,255,.35)); transform-origin: 50% 100%; }
      .tp-bar.hot i { background: linear-gradient(180deg, color-mix(in srgb, var(--ac) 70%, #fff), var(--ac)); box-shadow: 0 0 ${px(30)}px color-mix(in srgb, var(--ac) 55%, transparent); }
      .tp-bar span { font-weight: 600; font-size: ${px(24)}px; color: rgba(255,255,255,.7); white-space: nowrap; }`,
  html: ({ id, c, esc, data }) => {
    const { bars } = data;
    return `<div class="tp-chart" id="${id}-card">${c.text ? `<h4>${esc(c.text)}</h4>` : ""}<div class="tp-bars">${bars.map((b, i) => `<div class="tp-bar${b.hot ? " hot" : ""}"><b id="${id}-v${i}">${esc(b.value)}</b><i id="${id}-b${i}" style="height:${Math.round(b.h * 78)}%"></i><span>${esc(b.label)}</span></div>`).join("")}</div></div>`;
  },
  script: `
    floatIn(el + "-card", t0, { y: 80 });
    (c.data.bars || []).forEach(function (b, i) {
      var at = t0 + 0.35 + i * 0.14;
      tl.fromTo(el + "-b" + i, { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: "back.out(1.4)", immediateRender: false }, at);
      var node = document.querySelector(el + "-v" + i), m = String(b.value).match(/^([^\\d-]*)(-?[\\d,]*\\.?\\d+)(.*)$/);
      if (node && m) {
        var o = { v: 0 }, target = Number(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length;
        tl.fromTo(o, { v: 0 }, { v: target, duration: 0.7, ease: "power2.out", immediateRender: false, onUpdate: function () { node.textContent = m[1] + o.v.toFixed(dec) + m[3]; } }, at);
      }
    });
    drift(el + "-card", t0 + 0.9, len - 1.2, 5);`,
};
