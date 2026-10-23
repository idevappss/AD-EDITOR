// Many things, one place (motion-graphics-director, "floating UI fragments orbiting a headline = many things, one
// place"): the headline sits in the middle; small UI fragments (a dot, a label, a mono status) blur in around it
// tilted in 3D and drift slowly round it on an ellipse, 40 ms apart.
const frags = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 8);

export default {
  id: "ui-orbit",
  name: "Many things, one place",
  job: "product",
  scene: "optional",
  use: 'Everything the product handles, gathered in one place ("your leads, your calendar, your ads, your follow-ups — all in one place", "it runs your whole front desk"). Best full-screen, 2–4 s.',
  fields: 'text = headline line 1 (e.g. "All of it."); sub = line 2 in the accent (e.g. "*One* place."); items = 4–8 fragments as "label | status" (e.g. "Leads | 12 new", "Calendar | 3 booked", "Ads | live", "Follow-ups | sent", "Reviews | +4", "Payroll | done"); highlight = a mono kicker or empty.',
  position: "center",
  anchor: null,
  minLen: 2,
  sfx: (g) => [["atlas-whoosh", 0, 0.3], ...frags(g).map((_, i) => ["atlas-click", Math.round((0.35 + i * 0.05) * 1000) / 1000, 0.15])],
  data: (c) => ({ n: frags(c).length }),
  css: ({ px, W, H, tall }) => `
      .tp-uo { position: relative; width: ${W}px; height: ${Math.round(H * (tall ? 0.62 : 0.8))}px; perspective: ${px(1400)}px; }
      .tp-uo-head { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; width: ${Math.round(W * 0.8)}px; z-index: 2; }
      .tp-uo-head .mk-h { font-size: ${px(tall ? 120 : 100)}px; letter-spacing: -0.04em; line-height: .95; }
      .tp-uo-head .mk-kick { margin-bottom: ${px(16)}px; }
      .tp-uo-f { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: ${px(14)}px; padding: ${px(18)}px ${px(24)}px; border-radius: ${px(20)}px; background: linear-gradient(160deg, rgba(46,37,32,.92), rgba(30,24,21,.92)); box-shadow: inset 0 0 0 1px rgba(251,241,232,.12), 0 ${px(20)}px ${px(40)}px rgba(0,0,0,.35); white-space: nowrap; }
      .ag.tone-paper .tp-uo-f { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08), 0 ${px(20)}px ${px(40)}px rgba(23,18,15,.12); }
      .ag.tone-accent .tp-uo-f { --tx: #FBF1E8; --tx2: rgba(251,241,232,.6); --ac: var(--brand, #EE7440); }
      .tp-uo-f i { width: ${px(14)}px; height: ${px(14)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(10)}px var(--ac); }
      .tp-uo-f b { font-weight: 700; font-size: ${px(30)}px; color: var(--tx); }
      .tp-uo-f small { font-family: var(--f-mono); font-size: ${px(19)}px; letter-spacing: .1em; text-transform: uppercase; color: var(--tx2); }`,
  html: ({ id, c, esc, W, H, tall }) => {
    const list = frags(c);
    return `<div class="tp-uo" id="${id}-wrap" data-w="${W}" data-h="${Math.round(H * (tall ? 0.62 : 0.8))}"><div class="tp-uo-head" id="${id}-head">${c.highlight ? `<div class="mk-kick">${esc(c.highlight)}</div>` : ""}<h3 class="mk-h">${c.text ? `<span>${esc(c.text)}</span>` : ""}${c.sub ? `<span class="ac">${esc(c.sub)}</span>` : ""}</h3></div>${list.map(([label, status = ""], i) => `<div class="tp-uo-f" id="${id}-f${i}"><i></i><b>${esc(label)}</b>${status ? `<small>${esc(status)}</small>` : ""}</div>`).join("")}</div>`;
  },
  script: `
    var wrap = document.querySelector(el + "-wrap"), n = c.data.n;
    var Wd = wrap ? Number(wrap.getAttribute("data-w")) : 1080, Hd = wrap ? Number(wrap.getAttribute("data-h")) : 1200;
    var rx = Wd * 0.34, ry = Hd * 0.36, o = { a: 0 }, fr = [];
    for (var i = 0; i < n; i++) fr.push(document.querySelector(el + "-f" + i));
    function place() {
      for (var j = 0; j < n; j++) {
        var f = fr[j];
        if (!f) continue;
        var ang = -Math.PI / 2 + (j / n) * Math.PI * 2 + o.a;
        var x = Wd / 2 + Math.cos(ang) * rx - f.offsetWidth / 2, y = Hd / 2 + Math.sin(ang) * ry - f.offsetHeight / 2;
        f.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotateY(" + (Math.cos(ang) * -18).toFixed(1) + "deg) rotateX(" + (Math.sin(ang) * 10).toFixed(1) + "deg)";
      }
    }
    place();
    tl.fromTo(o, { a: 0 }, { a: 0.55, duration: len + 0.3, ease: "none", immediateRender: false, onUpdate: place }, t0);
    blurIn(el + "-head", t0, { y: 24, b: 14 });
    for (var k = 0; k < n; k++) tl.fromTo(el + "-f" + k, { autoAlpha: 0, filter: "blur(12px)" }, { autoAlpha: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out", immediateRender: false }, t0 + 0.3 + k * 0.04);
    for (var h = 0; h < n; h++) hide(el + "-f" + h);`,
};
