// Network: a centre node (the product) links out to 3–6 nodes (tools, agents, channels); lines draw, nodes pop.
export default {
  id: "network",
  name: "Network",
  job: "product",
  use: "The product connects many things or runs a team: integrations, agents, channels (\"plugs into GoHighLevel, Meta, Stripe…\").",
  fields: 'text = the centre label, 1 word (e.g. "ATLAS"); items = 3–6 node labels, 1–2 words each.',
  position: "top",
  anchor: null,
  minLen: 2.2,
  sfx: [["whoosh-short", 0, 0.3], ["pop", 0.5, 0.3], ["pop", 0.8, 0.3]],
  data: (c) => ({ n: Math.min(6, (c.items || []).length) }),
  css: ({ px, tall }) => `
      .tp-net { position: relative; width: ${tall ? 90 : 52}%; aspect-ratio: 1.35; }
      .tp-net svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-net line { stroke: color-mix(in srgb, var(--ac) 70%, #fff); stroke-width: 2.5; stroke-dasharray: 6 7; opacity: .85; }
      .tp-net-hub { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: ${px(22)}px ${px(34)}px; border-radius: 999px; background: var(--ac); color: #000; font-weight: 900; font-size: ${px(40)}px; letter-spacing: .04em; box-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 60%, transparent); white-space: nowrap; }
      .tp-net-node { position: absolute; transform: translate(-50%, -50%); padding: ${px(14)}px ${px(22)}px; border-radius: 999px; background: rgba(14,14,18,.8); backdrop-filter: blur(${px(10)}px); -webkit-backdrop-filter: blur(${px(10)}px); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.18), 0 ${px(12)}px ${px(30)}px rgba(0,0,0,.35); color: #fff; font-weight: 700; font-size: ${px(28)}px; white-space: nowrap; }`,
  html: ({ id, c, esc }) => {
    const items = (c.items || []).slice(0, 6);
    const pos = items.map((_, i) => {
      const a = -Math.PI / 2 + (i / items.length) * Math.PI * 2;
      return { x: 50 + Math.cos(a) * 38, y: 50 + Math.sin(a) * 36 };
    });
    return `<div class="tp-net" id="${id}-card"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${pos.map((p, i) => `<line id="${id}-l${i}" x1="50" y1="50" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" vector-effect="non-scaling-stroke"/>`).join("")}</svg>${items.map((it, i) => `<span class="tp-net-node" id="${id}-n${i}" style="left:${pos[i].x.toFixed(1)}%;top:${pos[i].y.toFixed(1)}%">${esc(it)}</span>`).join("")}<span class="tp-net-hub" id="${id}-hub">${esc(c.text || "ATLAS")}</span></div>`;
  },
  script: `
    tl.fromTo(el + "-hub", { autoAlpha: 0, scale: 0.2 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2.2)", immediateRender: false }, t0);
    for (var i = 0; i < (c.data.n || 0); i++) {
      tl.fromTo(el + "-l" + i, { opacity: 0 }, { opacity: 0.85, duration: 0.25, immediateRender: false }, t0 + 0.3 + i * 0.1);
      tl.fromTo(el + "-n" + i, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.4)", immediateRender: false }, t0 + 0.4 + i * 0.1);
      tl.fromTo(el + "-n" + i, { y: 0 }, { y: i % 2 ? 6 : -6, duration: Math.max(0.5, len - 1), ease: "sine.inOut", immediateRender: false }, t0 + 1);
    }
    tl.fromTo(el + "-hub", { boxShadow: "0 0 0px rgba(0,0,0,0)" }, { boxShadow: "0 0 60px rgba(244,147,15,.8)", duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, t0 + 1);`,
};
