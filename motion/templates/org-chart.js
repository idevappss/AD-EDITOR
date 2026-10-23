// Org chart (atlas-motion-kit.md #13): an outlined "CEO · You" box draws a line down to a solid accent "COO · Atlas"
// box, then soft curves fan out to a row of department chips that land one by one.
import { ATLAS_MARK } from "./_parts.js";
const chips = (c) => (c.items || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 6);
/** "CEO: You" → { role: "CEO", name: "You" }. */
const role = (s, d) => {
  const m = String(s || "").match(/^\s*([^:]{1,12}):\s*(.+)$/);
  return m ? { role: m[1].trim(), name: m[2].trim() } : { role: d, name: String(s || "").trim() };
};

export default {
  id: "org-chart",
  name: "Org chart",
  job: "product",
  scene: "optional",
  use: 'The owner leads and the product runs the team under them ("you\'re the CEO, Atlas is your COO", "it runs marketing, sales, client success and finance for you", "a whole team reporting to you").',
  fields: 'text = the top box as "ROLE: name" (e.g. "CEO: You"); sub = the middle box (e.g. "COO: Atlas"); items = 3–6 departments, 1–2 words each (e.g. "Marketing", "Sales", "Client Success", "Finance", "Tech"); highlight = an optional two-line footer as "line 1 / line 2" (e.g. "24/7. No call-offs. / No re-training. No reminding.").',
  position: "top",
  anchor: null,
  minLen: 2.2,
  sfx: (g) => [["atlas-pop", 0.05, 0.5], ["atlas-whoosh", 0.55, 0.45], ...chips(g).map((_, i) => ["atlas-click", Math.round((1.05 + i * 0.1) * 1000) / 1000, 0.3])],
  data: (c) => ({ n: chips(c).length }),
  css: ({ px, W, tall }) => `
      .tp-oc { position: relative; width: ${Math.round(W * (tall ? 0.9 : 0.5))}px; height: ${px(640)}px; }
      .tp-oc > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-oc > svg path { fill: none; stroke: var(--ac); stroke-width: ${Math.max(1.5, px(3))}; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; filter: drop-shadow(0 0 ${px(6)}px color-mix(in srgb, var(--ac) 60%, transparent)); }
      .tp-oc-box { position: absolute; left: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateX(-50%); border-radius: ${px(22)}px; }
      .tp-oc-box small { font-family: var(--f-mono); font-size: ${px(16)}px; letter-spacing: .2em; text-transform: uppercase; opacity: .6; }
      .tp-oc-box b { font-weight: 800; font-size: ${px(40)}px; letter-spacing: -0.02em; }
      .tp-oc-top { top: 0; width: ${px(250)}px; height: ${px(100)}px; color: var(--tx); background: transparent; box-shadow: inset 0 0 0 ${px(3)}px var(--tx); }
      .tp-oc-mid { top: ${px(180)}px; width: ${px(340)}px; height: ${px(110)}px; flex-direction: row !important; gap: ${px(14)}px; color: var(--on-ac); background: var(--ac); box-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 55%, transparent); }
      .tp-oc-mk { display: block; flex: none; width: ${px(64)}px; height: ${px(64)}px; color: var(--on-ac); }
      .tp-oc-mt { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.05; }
      .tp-oc-foot { position: absolute; left: 0; right: 0; top: ${px(520)}px; text-align: center; font-family: var(--f-display); font-weight: 700; font-size: ${px(44)}px; line-height: 1.2; color: var(--tx); }
      .tp-oc-chip { position: absolute; top: ${px(390)}px; display: grid; place-items: center; transform: translateX(-50%); min-width: ${px(120)}px; height: ${px(78)}px; padding: 0 ${px(14)}px; box-sizing: border-box; border-radius: ${px(16)}px; background: var(--surface); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tx) 10%, transparent); color: var(--tx); font-weight: 700; font-size: ${px(22)}px; line-height: 1.1; text-align: center; }`,
  html: ({ id, c, esc, px, W, tall }) => {
    const w = Math.round(W * (tall ? 0.9 : 0.5));
    const list = chips(c);
    const top = role(c.text || "You", "CEO");
    const mid = role(c.sub || "Atlas", "COO");
    const cx = w / 2;
    const xs = list.map((_, i) => Math.round(w * ((i + 0.5) / list.length)));
    const midBottom = px(290);
    const chipTop = px(390);
    const bend = px(55);
    const foot = String(c.highlight || "").split(/\s+\/\s+/).map((x) => x.trim()).filter(Boolean).slice(0, 2);
    const trunk = `<path id="${id}-p0" pathLength="100" d="M ${cx} ${px(100)} V ${px(180)}"/>`;
    const branches = xs.map((x, i) => `<path id="${id}-b${i}" pathLength="100" d="M ${cx} ${midBottom} C ${cx} ${midBottom + bend}, ${x} ${chipTop - bend}, ${x} ${chipTop}"/>`).join("");
    return `<div class="tp-oc" id="${id}-wrap"><svg viewBox="0 0 ${w} ${px(470)}">${trunk}${branches}</svg><div class="tp-oc-box tp-oc-top" id="${id}-top"><small>${esc(top.role)}</small><b>${esc(top.name)}</b></div><div class="tp-oc-box tp-oc-mid" id="${id}-mid"><span class="tp-oc-mk">${ATLAS_MARK()}</span><span class="tp-oc-mt"><small>${esc(mid.role)}</small><b>${esc(mid.name)}</b></span></div>${list.map((ch, i) => `<div class="tp-oc-chip" id="${id}-c${i}" style="left:${xs[i]}px">${esc(ch)}</div>`).join("")}${foot.length ? `<div class="tp-oc-foot" id="${id}-f">${foot.map((l, i) => `<div${i ? ` class="ac"` : ""}>${esc(l)}</div>`).join("")}</div>` : ""}</div>`;
  },
  script: `
    blurIn(el + "-top", t0, { y: 12 });
    tl.fromTo(el + "-p0", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.inOut", immediateRender: false }, t0 + 0.3);
    blurIn(el + "-mid", t0 + 0.55, { y: 14, s: 0.94 });
    for (var i = 0; i < c.data.n; i++) {
      tl.fromTo(el + "-b" + i, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.inOut", immediateRender: false }, t0 + 0.85 + i * 0.05);
      blurIn(el + "-c" + i, t0 + 1.05 + i * 0.1, { y: 40, b: 8, d: 0.5 });
    }
    blurIn(el + "-f", t0 + 1.6, { y: 20, b: 8 });`,
};
