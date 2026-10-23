// Mind map (the master edit, motion/references/sound-study.md, 42.7–49.7 s: "dial in messaging → content formats →
// credibility hooks"). A light grey canvas with a heavy dark vignette and one thin spine line. The points arrive one at
// a time down the spine, each a dark label on one side and a small document card on the other, joined to the spine by
// a short tick. The camera glides to each new point and the ones before it fade back. Ends on the last point, held.

const r3 = (n) => Math.round(n * 1000) / 1000;
const DEFAULT = ["Dial in messaging", "Content formats", "Credibility hooks"];
const parse = (c) => {
  const items = (c.items || []).map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 5);
  return items.length >= 2 ? items : DEFAULT;
};
const plan = (c) => {
  const n = parse(c).length;
  const len = Math.max(2.5, Number(c.duration) || 5);
  const step = (len - 0.6) / n;
  return { n, at: Array.from({ length: n }, (_, k) => r3(0.15 + k * step)), step: r3(step) };
};

export default {
  id: "mind-map",
  name: "Mind map",
  job: "product",
  scene: "always",
  use: 'Laying out the plan, the steps or the parts of the system as a calm map ("first we dial in your messaging, then the content formats, then the credibility hooks", "here\'s what we\'ll cover", "the three things that fix it"). Always full-screen on a light canvas, 3–7 s, 2–5 points.',
  fields: 'items = 2–5 short points in order, sentence case (e.g. "Dial in messaging", "Content formats", "Credibility hooks"); text = an optional small heading above the first point (e.g. "The plan").',
  position: "center",
  anchor: null,
  minLen: 2.5,
  sfx: (g) => plan(g).at.map((t) => ["atlas-click", r3(t + 0.05), 0.4]),
  data: (c) => plan(c),
  css: ({ px, W, H, tall }) => `
      .tp-mm { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #E8E7E3; font-family: "Inter", system-ui, sans-serif; }
      .tp-mm::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 62% 52% at 50% 50%, transparent 40%, rgba(40,38,34,.55) 100%); }
      .tp-mm-cam { position: absolute; left: 0; right: 0; top: 0; will-change: transform; }
      .tp-mm-spine { position: absolute; left: 50%; top: ${px(-2000)}px; width: ${Math.max(1, px(2))}px; height: ${px(8000)}px; margin-left: ${-Math.max(1, px(2)) / 2}px; background: rgba(60,58,54,.28); }
      .tp-mm-head { position: absolute; left: 50%; transform: translateX(-50%); font-weight: 600; font-size: ${px(26)}px; letter-spacing: .14em; text-transform: uppercase; color: rgba(40,38,34,.5); white-space: nowrap; }
      .tp-mm-pt { position: absolute; left: 0; right: 0; height: 0; }
      .tp-mm-pt i { position: absolute; left: 50%; top: 0; width: ${px(12)}px; height: ${px(12)}px; margin: ${px(-6)}px 0 0 ${px(-6)}px; border-radius: 50%; background: #3C3A36; }
      .tp-mm-pt u { position: absolute; top: 0; height: ${Math.max(1, px(2))}px; width: ${px(40)}px; background: rgba(60,58,54,.4); text-decoration: none; }
      .tp-mm-pt b { position: absolute; top: 0; transform: translateY(-50%); font-weight: 600; font-size: ${px(tall ? 44 : 38)}px; letter-spacing: -0.02em; color: #2B2926; white-space: nowrap; }
      .tp-mm-card { position: absolute; top: 0; transform: translateY(-50%); width: ${px(tall ? 360 : 300)}px; height: ${px(tall ? 220 : 180)}px; box-sizing: border-box; padding: ${px(20)}px; border-radius: ${px(12)}px; box-shadow: 0 ${px(18)}px ${px(40)}px rgba(40,38,34,.28); overflow: hidden; }
      .tp-mm-card.dark { background: linear-gradient(170deg, #26282C, #17181B); }
      .tp-mm-card.light { background: #FBFAF7; }
      .tp-mm-card s { display: block; height: ${px(7)}px; margin-bottom: ${px(11)}px; border-radius: ${px(4)}px; text-decoration: none; }
      .tp-mm-card.dark s { background: rgba(255,255,255,.22); }
      .tp-mm-card.light s { background: rgba(40,38,34,.18); }
      .tp-mm-card s:first-child { width: 55%; height: ${px(9)}px; }
      .tp-mm-card.dark s:first-child { background: rgba(255,255,255,.5); }
      .tp-mm-card.light s:first-child { background: rgba(40,38,34,.45); }
      .tp-mm-card em { position: absolute; bottom: ${px(14)}px; width: ${px(54)}px; height: ${px(54)}px; border-radius: ${px(8)}px; background: linear-gradient(160deg, #8C7A6B, #3E342C); }
      .tp-mm-card em:first-of-type { left: ${px(14)}px; } .tp-mm-card em:last-of-type { right: ${px(14)}px; background: linear-gradient(160deg, #6E7F8C, #2E363C); }`,
  html: ({ id, c, esc, px, W, H, tall }) => {
    const pts = parse(c);
    const gap = px(tall ? 420 : 300);
    const lines = (k) => Array.from({ length: 5 }, (_, j) => `<s style="width:${[55, 88, 76, 92, 64][(j + k) % 5]}%"></s>`).join("");
    const head = c.text ? `<div class="tp-mm-head" id="${id}-head" style="top:${H / 2 - gap * 0.55}px">${esc(c.text)}</div>` : "";
    return `<div class="tp-mm" id="${id}-wrap" data-gap="${gap}"><div class="tp-mm-cam" id="${id}-cam">${head}<i class="tp-mm-spine"></i>${pts.map((t, k) => {
      const left = k % 2 === 0, y = H / 2 + k * gap, half = W / 2;
      return `<div class="tp-mm-pt" id="${id}-p${k}" style="top:${y}px"><i></i><u style="${left ? `right:${half}px` : `left:${half}px`}"></u><b id="${id}-t${k}" style="${left ? `right:${half + px(56)}px` : `left:${half + px(56)}px`}">${esc(t)}</b><div class="tp-mm-card ${k % 2 ? "light" : "dark"}" id="${id}-c${k}" style="${left ? `left:${half + px(34)}px` : `right:${half + px(34)}px`}">${lines(k)}<em></em><em></em></div></div>`;
    }).join("")}</div></div>`;
  },
  script: `
    var P = c.data, wrap = document.querySelector(el + "-wrap");
    if (!wrap) return;
    var gap = Number(wrap.getAttribute("data-gap")) || 300;
    tl.fromTo(el + "-wrap", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, t0);
    blurIn(el + "-head", t0 + 0.05, { y: 10, b: 8 });
    // Each point: the camera glides to it, its label blurs in, its card slides in from the spine; the last one fades back.
    for (var k = 0; k < P.n; k++) {
      var at = t0 + P.at[k];
      if (k > 0) tl.fromTo(el + "-cam", { y: -(k - 1) * gap }, { y: -k * gap, duration: 0.7, ease: "power2.inOut", immediateRender: false }, at - 0.25);
      hide(el + "-p" + k);
      tl.set(el + "-p" + k, { autoAlpha: 1 }, at);
      blurIn(el + "-t" + k, at, { x: k % 2 ? -18 : 18, y: 0, b: 10, d: 0.5 });
      blurIn(el + "-c" + k, at + 0.12, { x: k % 2 ? 30 : -30, y: 0, s: 0.96, b: 10, d: 0.55 });
      if (k > 0) tl.fromTo(el + "-p" + (k - 1), { opacity: 1 }, { opacity: 0.4, duration: 0.5, ease: "power1.out", immediateRender: false }, at);
    }
    tl.fromTo(el + "-cam", { scale: 1 }, { scale: 1.03, duration: len, ease: "none", immediateRender: false }, t0);
    blurOut(el + "-wrap", out, { y: 0, b: 12, d: 0.35 });`,
};
