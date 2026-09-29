// Orbit network (Remotion V3 "Orbit"): radar rings pulse out from the centre, an ink hub with the mark pops in, the
// agent nodes spin in from close to the hub and settle out onto their orbit while lines draw out to them, then the
// tools appear as ink pills on an outer ring with dashed lines streaming. With 4+ seconds the camera pushes into the
// first agent at the end (a handoff into an agent-log scene). Headline top-left; best on the paper tone.
import { ATLAS_MARK, brandMark } from "./_parts.js";

const split = (c) => {
  const items = (c.items || []).map((x) => String(x || "").trim()).filter(Boolean);
  const tools = items.filter((x) => /^tool\s*:/i.test(x)).map((x) => x.replace(/^tool\s*:\s*/i, "")).slice(0, 6);
  const agents = items.filter((x) => !/^tool\s*:/i.test(x)).slice(0, 8);
  return { agents, tools };
};
const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "orbit-network",
  name: "Orbit network",
  job: "product",
  scene: "always",
  use: 'One brain running a whole team, plugged into your tools ("one AI, a whole team of agents", "it runs your marketing, your setter, your editor… and it plugs into your calendar, your CRM"). Always full-screen; best on the paper tone, 3–5 s.',
  fields: 'text = headline line 1 (e.g. "One brain."); sub = line 2 in the accent (e.g. "A whole team."); highlight = a mono kicker (e.g. "Meet Atlas"); items = 4–8 agent names (short; a line break is fine as a space, e.g. "Executive Assistant", "Setter", "Video Editor") followed by up to 6 tools written "tool: Calendar", "tool: Meta Ads", "tool: CRM".',
  position: "top",
  anchor: null,
  minLen: 2.6,
  sfx: (g) => {
    const { agents, tools } = split(g);
    return [["atlas-impact", 0.1, 0.6], ...agents.map((_, i) => ["atlas-pop", r3(0.5 + i * 0.08), 0.25]), ...(tools.length ? [["atlas-whoosh", 1.4, 0.4]] : []), ...((Number(g.duration) || 0) >= 4 ? [["atlas-riser", r3(Number(g.duration) - 1.6), 0.45]] : [])];
  },
  data: (c) => ({ n: split(c).agents.length, m: split(c).tools.length }),
  css: ({ px, W, H, tall }) => `
      .tp-on { position: relative; width: ${W}px; height: ${H}px; }
      .tp-on-head { position: absolute; top: ${Math.round(H * 0.08)}px; left: ${px(90)}px; right: ${px(90)}px; z-index: 3; }
      .tp-on-head .mk-h { margin-top: ${px(14)}px; font-size: ${px(tall ? 96 : 80)}px; letter-spacing: -0.03em; line-height: 1; }
      .tp-on-cam { position: absolute; inset: 0; transform-origin: 50% ${tall ? 54 : 56}%; }
      .tp-on-radar { position: absolute; left: 50%; top: ${tall ? 54 : 56}%; width: ${px(1400)}px; height: ${px(1400)}px; margin: ${px(-700)}px 0 0 ${px(-700)}px; border-radius: 50%; border: ${px(2)}px solid var(--ac); opacity: 0; }
      .tp-on-cam > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-on-spoke { stroke: var(--ac); stroke-width: ${px(4)}; opacity: .7; }
      .tp-on-dash { stroke: var(--tx); stroke-width: ${px(2)}; stroke-dasharray: ${px(8)} ${px(10)}; opacity: .35; }
      .tp-on-hub { position: absolute; width: ${px(260)}px; height: ${px(260)}px; margin: ${px(-130)}px 0 0 ${px(-130)}px; display: grid; place-items: center; padding: ${px(45)}px; box-sizing: border-box; border-radius: 50%; background: var(--ink); color: var(--ac); box-shadow: 0 0 0 ${px(14)}px color-mix(in srgb, var(--ac) 25%, transparent), 0 ${px(30)}px ${px(80)}px rgba(23,18,15,.3); z-index: 2; }
      .tp-on-hub img { width: 100%; height: 100%; object-fit: contain; }
      .tp-on-node { position: absolute; width: ${px(164)}px; height: ${px(164)}px; margin: ${px(-82)}px 0 0 ${px(-82)}px; display: grid; place-items: center; padding: ${px(10)}px; box-sizing: border-box; border-radius: 50%; background: var(--surface); border: ${px(3)}px solid var(--ac); text-align: center; font-weight: 700; font-size: ${px(24)}px; line-height: 1.15; color: var(--tx); box-shadow: 0 ${px(20)}px ${px(50)}px color-mix(in srgb, var(--ac) 22%, transparent); z-index: 1; }
      .ag.tone-paper .tp-on-node { background: #fff; }
      .tp-on-node.hot { background: var(--ac) !important; color: var(--ink); }
      .tp-on-tool { position: absolute; width: ${px(190)}px; height: ${px(76)}px; margin: ${px(-38)}px 0 0 ${px(-95)}px; display: grid; place-items: center; border-radius: ${px(38)}px; background: var(--ink); color: #FBF1E8; font-weight: 700; font-size: ${px(28)}px; white-space: nowrap; }`,
  html: ({ id, c, esc, logo, W, H, tall }) => {
    const { agents, tools } = split(c);
    const cx = W / 2, cy = H * (tall ? 0.54 : 0.56);
    const R = Math.min(W, H) * 0.28, RT = Math.min(W, H) * 0.46;
    const lines = agents.map((_, i) => `<line class="tp-on-spoke" id="${id}-s${i}" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy}"/>`).join("");
    const dashes = tools.map((_, i) => {
      const a = ((-90 + i * (360 / Math.max(1, tools.length))) * Math.PI) / 180;
      return `<line class="tp-on-dash" id="${id}-d${i}" x1="${cx}" y1="${cy}" x2="${(cx + RT * Math.cos(a)).toFixed(1)}" y2="${(cy + RT * Math.sin(a)).toFixed(1)}"/>`;
    }).join("");
    const toolPills = tools.map((t, i) => {
      const a = ((-90 + i * (360 / Math.max(1, tools.length))) * Math.PI) / 180;
      return `<div class="tp-on-tool" id="${id}-t${i}" style="left:${(cx + RT * Math.cos(a)).toFixed(1)}px;top:${(cy + RT * Math.sin(a)).toFixed(1)}px">${esc(t)}</div>`;
    }).join("");
    const heading = c.text || c.sub || c.highlight ? `<div class="tp-on-head" id="${id}-head">${c.highlight ? `<div class="mk-kick">${esc(c.highlight)}</div>` : ""}${c.text || c.sub ? `<h3 class="mk-h">${c.text ? `<span>${esc(c.text)}</span>` : ""}${c.sub ? `<span class="ac">${esc(c.sub)}</span>` : ""}</h3>` : ""}</div>` : "";
    return `<div class="tp-on" id="${id}-wrap" data-cx="${cx}" data-cy="${cy}" data-r="${R}">${heading}<div class="tp-on-cam" id="${id}-cam">${[0, 1, 2, 3].map((k) => `<i class="tp-on-radar" id="${id}-rd${k}"></i>`).join("")}<svg viewBox="0 0 ${W} ${H}">${dashes}${lines}</svg>${toolPills}${agents.map((a, i) => `<div class="tp-on-node" id="${id}-n${i}">${esc(a)}</div>`).join("")}<div class="tp-on-hub" id="${id}-hub" style="left:${cx}px;top:${cy}px">${logo ? brandMark(logo, esc) : ATLAS_MARK()}</div></div></div>`;
  },
  script: `
    var d = c.data, wrap = document.querySelector(el + "-wrap");
    var cx = Number(wrap && wrap.getAttribute("data-cx")), cy = Number(wrap && wrap.getAttribute("data-cy")), R = Number(wrap && wrap.getAttribute("data-r"));
    blurIn(el + "-head", t0, { y: 24, b: 10 });
    // Radar: rings keep pulsing out from the hub.
    for (var k = 0; k < 4; k++) for (var at = t0 + 0.1 + k * 0.5; at < out - 0.4; at += 2) tl.fromTo(el + "-rd" + k, { scale: 0.05, opacity: 0.35 }, { scale: 1, opacity: 0, duration: 2, ease: "none", immediateRender: false }, at);
    hide(el + "-hub");
    tl.fromTo(el + "-hub", { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)", immediateRender: false }, t0 + 0.1);
    // Nodes: spin in from near the hub (rotation 220° → 0) and settle onto the orbit; spokes follow them.
    var o = { settle: 0, rot: 220 }, nodes = [], spokes = [];
    for (var i = 0; i < d.n; i++) { nodes.push(document.querySelector(el + "-n" + i)); spokes.push(document.querySelector(el + "-s" + i)); }
    function place() {
      for (var j = 0; j < d.n; j++) {
        var ang = (-90 + j * (360 / d.n) + o.rot) * Math.PI / 180, r = R * (0.3 + 0.7 * o.settle);
        var x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        if (nodes[j]) { nodes[j].style.left = x + "px"; nodes[j].style.top = y + "px"; }
        if (spokes[j]) { spokes[j].setAttribute("x2", cx + (x - cx) * o.settle); spokes[j].setAttribute("y2", cy + (y - cy) * o.settle); }
      }
    }
    place();
    tl.fromTo(o, { settle: 0, rot: 220 }, { settle: 1, rot: 0, duration: Math.min(2.2, len * 0.55), ease: "expo.out", immediateRender: false, onUpdate: place }, t0 + 0.4);
    for (var i2 = 0; i2 < d.n; i2++) blurIn(el + "-n" + i2, t0 + 0.4 + i2 * 0.08, { y: 0, s: 0.5, b: 6, d: 0.5 });
    for (var t = 0; t < d.m; t++) {
      blurIn(el + "-t" + t, t0 + 1.4 + t * 0.12, { y: 0, s: 0.6, b: 6, d: 0.5 });
      tl.fromTo(el + "-d" + t, { opacity: 0, strokeDashoffset: 0 }, { opacity: 0.35, strokeDashoffset: -200, duration: Math.max(0.5, len - 1.4), ease: "none", immediateRender: false }, t0 + 1.4);
    }
    // With room, the camera pushes into the first agent at the end (it turns accent), handing off to the next scene.
    if (len >= 4 && nodes[0]) {
      var push = t1 - 1.2;
      tl.call(function () { nodes[0].classList.add("hot"); }, null, push);
      tl.fromTo(el + "-cam", { scale: 1, x: 0, y: 0 }, { scale: 3.2, x: function () { return (cx - parseFloat(nodes[0].style.left)) * 3.2; }, y: function () { return (cy - parseFloat(nodes[0].style.top)) * 3.2; }, duration: 1.1, ease: "power3.inOut", immediateRender: false }, push);
      tl.fromTo(el + "-head", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, push);
    }`,
};
