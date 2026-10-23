// Content funnel (the master edit, motion/references/sound-study.md, 25.3–28 s: "…no intentional content strategy").
// On black: a grid of content thumbnails (a profile's posts) sits up top, then the posts peel off one by one and arc
// down into a glassy wireframe funnel, shrinking as they drop in. A second funnel in red sits under it, and at the
// bottom the result lands: a red person icon and "0 Clients". All that content in, nothing out. With a number other
// than 0 the result is white and counts up instead. Every card's flight is drawn from its own clock, so it seeks.
import { COUNT_UP } from "./_parts.js";

const r3 = (n) => Math.round(n * 1000) / 1000;
// Thumbnail looks: warm and cool photo-like gradients, so the grid reads as real posts without real images.
const SHOTS = [
  ["#3B2F2A", "#C9A27E"], ["#1E2A33", "#7FA6BF"], ["#2C2C2C", "#E7E2DA"], ["#14202B", "#3DA0E0"], ["#33261F", "#E0B48A"],
  ["#1D1D24", "#9A8CC9"], ["#2A2420", "#D9C2A0"], ["#1F2B23", "#7FC29A"], ["#2B1E22", "#E08A8A"],
];
const DEFAULT = ["Reel", "Podcast clip", "Carousel", "Story", "Reel", "Live", "Reel", "Post", "Short"];
const parse = (c) => {
  const items = (c.items || []).map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 9);
  return { cards: (items.length >= 3 ? items : DEFAULT).slice(0, 9), result: String(c.highlight || "0").trim() || "0", label: String(c.text || "Clients").trim() };
};
const plan = (c) => {
  const { cards } = parse(c);
  const len = Math.max(3, Number(c.duration) || 4);
  const fly = Math.min(1.9, len * 0.5);
  return { n: cards.length, gridIn: 0.05, fly: cards.map((_, i) => r3(0.55 + (i / Math.max(1, cards.length - 1)) * fly)), land: r3(Math.min(len - 0.9, 0.55 + fly + 0.55)) };
};

export default {
  id: "content-funnel",
  name: "Content funnel",
  job: "data",
  scene: "always",
  use: 'Posting lots of content that goes nowhere ("you post every day and get zero clients", "no intentional content strategy", "all that content and nothing to show for it"): the posts pour into a funnel and nothing comes out. Or, with a real number, what a working funnel turns out. Always full-screen on black, 3–5 s.',
  fields: 'items = 6–9 short post types or titles for the thumbnails (e.g. "Reel", "Podcast clip", "Carousel", "Story"); highlight = the result number (default "0", shown in red; any other number counts up in white); text = what it counts (default "Clients"); sub = an optional handle over the grid (e.g. "@drodellmiller").',
  position: "center",
  anchor: null,
  minLen: 3,
  sfx: (g) => {
    const p = plan(g);
    return [["atlas-pop", p.gridIn, 0.3], ["air", p.fly[0], 0.3], ["air", p.fly[Math.floor(p.n / 2)], 0.25], [parse(g).result === "0" ? "atlas-marker" : "atlas-ding", p.land, 0.4]];
  },
  data: (c) => ({ ...plan(c), zero: parse(c).result === "0" }),
  css: ({ px, W, H, tall }) => `
      .tp-cf { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: radial-gradient(ellipse 70% 55% at 50% 45%, #17181B 0%, #0B0B0D 70%, #050506 100%); font-family: "Inter", system-ui, sans-serif; }
      .tp-cf-cam { position: absolute; inset: 0; will-change: transform; }
      .tp-cf-handle { position: absolute; left: 50%; top: ${Math.round(H * (tall ? 0.085 : 0.05))}px; transform: translateX(-50%); font-weight: 600; font-size: ${px(30)}px; color: rgba(255,255,255,.55); white-space: nowrap; }
      .tp-cf-card { position: absolute; left: 0; top: 0; width: ${px(tall ? 168 : 132)}px; height: ${px(tall ? 210 : 165)}px; margin: ${px(tall ? -105 : -82)}px 0 0 ${px(tall ? -84 : -66)}px; border-radius: ${px(8)}px; overflow: hidden;
        background: linear-gradient(160deg, var(--a), var(--b)); box-shadow: 0 ${px(10)}px ${px(30)}px rgba(0,0,0,.5); will-change: transform, opacity; }
      .tp-cf-card::before { content: ""; position: absolute; left: 50%; bottom: 0; width: 46%; height: 62%; transform: translateX(-50%); border-radius: 48% 48% 0 0; background: rgba(0,0,0,.28); }
      .tp-cf-card::after { content: ""; position: absolute; left: 50%; bottom: 52%; width: 22%; height: 18%; transform: translateX(-50%); border-radius: 50%; background: rgba(0,0,0,.28); }
      .tp-cf-card b { position: absolute; left: ${px(10)}px; bottom: ${px(8)}px; z-index: 1; font-weight: 600; font-size: ${px(17)}px; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,.6); }
      .tp-cf-card i { position: absolute; right: ${px(8)}px; top: ${px(8)}px; z-index: 1; font-style: normal; font-weight: 600; font-size: ${px(14)}px; color: rgba(255,255,255,.85); }
      .tp-cf > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-cf-res { position: absolute; left: 50%; top: ${Math.round(H * (tall ? 0.91 : 0.93))}px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: ${px(10)}px; color: #E3262F; }
      .tp-cf-res.ok { color: #fff; }
      .tp-cf-res svg { width: ${px(64)}px; height: ${px(64)}px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; overflow: visible; }
      .tp-cf-res b { font-weight: 700; font-size: ${px(40)}px; letter-spacing: -0.02em; }
      .tp-cf-res b span { font-weight: 500; font-size: ${px(30)}px; margin-left: ${px(8)}px; }`,
  html: ({ id, c, esc, px, W, H, tall }) => {
    const { cards, result, label } = parse(c);
    const cw = px(tall ? 168 : 132), ch = px(tall ? 210 : 165), gap = px(8);
    const gx = W / 2 - cw * 1.5 - gap, gy = H * (tall ? 0.13 : 0.12);
    const grid = cards.map((_, i) => [r3(gx + (i % 3) * (cw + gap)), r3(gy + Math.floor(i / 3) * (ch + gap))]);
    const f1 = { x: W / 2, y: H * (tall ? 0.6 : 0.6) }, f2 = { x: W / 2, y: H * (tall ? 0.77 : 0.8) };
    const funnel = (f, stroke, k) => {
      const rx = px(tall ? 170 : 150), ry = px(tall ? 32 : 28), h = px(tall ? 180 : 150), sx = px(24), sh = px(46);
      const cone = `M${f.x - rx} ${f.y} L${f.x - sx} ${f.y + h} L${f.x - sx} ${f.y + h + sh} L${f.x + sx} ${f.y + h + sh} L${f.x + sx} ${f.y + h} L${f.x + rx} ${f.y} Z`;
      return `<g id="${id}-f${k}"><path d="${cone}" fill="url(#${id}-g${k})" stroke="${stroke}" stroke-width="${px(2.5)}" stroke-linejoin="round"/><ellipse cx="${f.x}" cy="${f.y}" rx="${rx}" ry="${ry}" fill="#0E0E10" stroke="${stroke}" stroke-width="${px(2.5)}"/></g>`;
    };
    const defs = `<defs><linearGradient id="${id}-g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity=".04"/></linearGradient><linearGradient id="${id}-g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E3262F" stop-opacity=".2"/><stop offset="1" stop-color="#E3262F" stop-opacity=".03"/></linearGradient></defs>`;
    const person = `<svg viewBox="0 0 24 24"><circle cx="11" cy="8" r="4"/><path d="M3.5 20c.8-4 3.8-6.2 7.5-6.2 1.6 0 3 .4 4.2 1.1"/>${result === "0" ? `<circle cx="18.5" cy="17.5" r="3.6" fill="currentColor" stroke="none"/><path d="M17 16l3 3M20 16l-3 3" stroke="#0B0B0D" stroke-width="1.6"/>` : ""}</svg>`;
    return `<div class="tp-cf" id="${id}-wrap" data-grid="${esc(JSON.stringify(grid))}" data-mouth="${esc(JSON.stringify([f1.x, f1.y, px(tall ? 170 : 150)]))}"><div class="tp-cf-cam" id="${id}-cam">${c.sub ? `<div class="tp-cf-handle" id="${id}-hd">${esc(c.sub)}</div>` : ""}<svg viewBox="0 0 ${W} ${H}">${defs}${funnel(f2, "#E3262F", 2)}${funnel(f1, "rgba(255,255,255,.85)", 1)}</svg>${cards.map((t, i) => `<div class="tp-cf-card" id="${id}-c${i}" style="--a:${SHOTS[i % 9][0]};--b:${SHOTS[i % 9][1]};transform:translate(${grid[i][0] + cw / 2}px,${grid[i][1] + ch / 2}px)"><i>▶ ${(3 + ((i * 37) % 90) / 10).toFixed(1)}k</i><b>${esc(t)}</b></div>`).join("")}<div class="tp-cf-res${result === "0" ? "" : " ok"}" id="${id}-res">${person}<b><em id="${id}-num" style="font-style:normal">${esc(result)}</em><span>${esc(label)}</span></b></div></div></div>`;
  },
  script: `
    ${COUNT_UP}
    var P = c.data, wrap = document.querySelector(el + "-wrap");
    if (!wrap) return;
    var G = JSON.parse(wrap.getAttribute("data-grid")), M = JSON.parse(wrap.getAttribute("data-mouth"));
    var card0 = document.querySelector(el + "-c0"), cw = card0 ? card0.offsetWidth : 150, ch = card0 ? card0.offsetHeight : 186;
    tl.fromTo(el + "-wrap", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out", immediateRender: false }, t0);
    blurIn(el + "-hd", t0 + 0.05, { y: 10, b: 8 });
    // The grid settles in, then each post peels off and arcs down into the funnel's mouth, shrinking as it drops.
    for (var i = 0; i < P.n; i++) {
      (function (i) {
        var node = document.querySelector(el + "-c" + i);
        if (!node) return;
        var sx = G[i][0] + cw / 2, sy = G[i][1] + ch / 2, ex = M[0] + ((i % 3) - 1) * M[2] * 0.25, ey = M[1] + 6;
        var side = (i % 3) - 1 || (i % 2 ? 1 : -1), cx = (sx + ex) / 2 + side * M[2] * 0.7, cy = (sy + ey) / 2 - M[2] * 0.15;
        var o = { p: 0 };
        function put() {
          var p = o.p, q = 1 - p, x = q * q * sx + 2 * q * p * cx + p * p * ex, y = q * q * sy + 2 * q * p * cy + p * p * ey;
          var s = 1 - 0.82 * p, fade = p > 0.85 ? (1 - p) / 0.15 : 1;
          node.style.transform = "translate(" + x + "px," + y + "px) rotate(" + ((i % 2 ? 1 : -1) * 14 * p) + "deg) scale(" + s + ")";
          node.style.opacity = String(Math.max(0, fade));
        }
        put();
        tl.fromTo(node, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out", immediateRender: false }, t0 + P.gridIn + i * 0.03);
        tl.fromTo(o, { p: 0 }, { p: 1, duration: 0.75, ease: "power2.in", immediateRender: false, onUpdate: put }, t0 + P.fly[i]);
      })(i);
    }
    blurIn(el + "-f1", t0 + 0.2, { y: 20, b: 10, d: 0.6 });
    blurIn(el + "-f2", t0 + 0.35, { y: 20, b: 10, d: 0.6 });
    // The camera drifts down with the posts, toward the result.
    tl.fromTo(el + "-cam", { y: 0 }, { y: -0.12 * wrap.offsetHeight, duration: Math.max(1, len - 0.3), ease: "sine.inOut", immediateRender: false }, t0 + 0.4);
    blurIn(el + "-res", t0 + P.land, { y: 16, b: 10, d: 0.5 });
    if (!P.zero) countUp(el + "-num", t0 + P.land, 0.8);
    blurOut(el + "-wrap", out, { y: 0, b: 12, d: 0.35 });`,
};
