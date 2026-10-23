// Dot to word (motion-graphics-director, "open on almost nothing, then scale up hard"): a single accent dot sits alone in
// the dark and breathes once, then scales up hard until it floods the frame, and the giant claim slams in word by word
// with motion blur on the new colour field (it may run off the edges — only the idea has to read). A mono HUD label
// ("01 / 03") sits in the corner. The contrast between almost nothing and everything is the hook.
// Words, keeping a *serif accent* phrase together as one beat.
const words = (c) => (String(c.text || "").match(/\*[^*]+\*\S*|\S+/g) || []).slice(0, 5);
const r3 = (n) => Math.round(n * 1000) / 1000;

export default {
  id: "dot-open",
  name: "Dot to word",
  job: "hook",
  scene: "always",
  use: 'A bold claim or pain line that should hit like a hook, 1–4 words ("Stop doing it all.", "You\'re the bottleneck.", "Hire AI.", "Left behind."). Nearly nothing, then everything: one dot floods the frame, the words slam in. Always full-screen, 1.6–2.6 s, at most once per ad.',
  fields: 'text = the claim, 1–4 words, huge (one word may be written *like this* for an italic serif accent); sub = an optional small line under it (3–7 words); highlight = a mono HUD label (e.g. "01 / 03", "Atlas · 2026") or empty.',
  position: "center",
  anchor: null,
  minLen: 1.6,
  sfx: (g) => [["atlas-marker", 0, 0.35], ["atlas-riser", 0.12, 0.4], ["atlas-impact", 0.62, 0.6], ...words(g).slice(1).map((_, i) => ["atlas-pop", r3(0.72 + (i + 1) * 0.09), 0.25])],
  data: (c) => ({ n: words(c).length }),
  css: ({ px, W, H, tall }) => `
      .tp-do { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; }
      .tp-do-dot { position: absolute; left: 50%; top: 50%; width: ${px(44)}px; height: ${px(44)}px; margin: ${px(-22)}px 0 0 ${px(-22)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(40)}px color-mix(in srgb, var(--ac) 70%, transparent); }
      .tp-do-words { position: absolute; left: ${px(56)}px; right: ${px(-40)}px; top: 50%; transform: translateY(-50%); display: flex; flex-wrap: wrap; gap: 0 ${px(tall ? 48 : 40)}px; align-content: center; }
      .tp-do-words .mk-h { font-size: ${px(tall ? 230 : 190)}px; line-height: .86; letter-spacing: -0.055em; color: var(--on-ac); text-shadow: none; text-wrap: initial; }
      .tp-do-words .mk-h em.sf { letter-spacing: -0.02em; }
      .tp-do-sub { position: absolute; left: ${px(60)}px; right: ${px(60)}px; bottom: ${Math.round(H * (tall ? 0.24 : 0.14))}px; font-weight: 600; font-size: ${px(tall ? 48 : 40)}px; line-height: 1.2; color: color-mix(in srgb, var(--on-ac) 78%, transparent); }
      .tp-do-hud { position: absolute; top: ${Math.round(H * (tall ? 0.15 : 0.08))}px; right: ${px(60)}px; font-family: var(--f-mono); font-size: ${px(24)}px; letter-spacing: .18em; text-transform: uppercase; color: color-mix(in srgb, var(--on-ac) 70%, transparent); }`,
  html: ({ id, c, esc }) => `<div class="tp-do" id="${id}-wrap"><i class="tp-do-dot" id="${id}-dot"></i><div class="tp-do-words">${words(c).map((w, i) => `<h3 class="mk-h" id="${id}-w${i}">${esc(w)}</h3>`).join("")}</div>${c.sub ? `<div class="tp-do-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}${c.highlight ? `<div class="tp-do-hud" id="${id}-hud">${esc(c.highlight)}</div>` : ""}</div>`,
  script: `
    var wrap = document.querySelector(el + "-wrap"), W = wrap ? wrap.offsetWidth : 1080, H = wrap ? wrap.offsetHeight : 1920;
    var cover = Math.sqrt(W * W + H * H) / 44 * 1.1;
    tl.fromTo(el + "-dot", { scale: 0 }, { scale: 1, duration: 0.22, ease: "expo.out", immediateRender: false }, t0);
    tl.fromTo(el + "-dot", { scale: 1 }, { scale: 1.25, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, t0 + 0.24);
    tl.fromTo(el + "-dot", { scale: 1 }, { scale: cover, duration: 0.3, ease: "expo.in", immediateRender: false }, t0 + 0.34);
    for (var i = 0; i < c.data.n; i++) blurIn(el + "-w" + i, t0 + 0.64 + i * 0.09, { x: 90, y: 0, s: 1.08, b: 22, d: 0.5 });
    blurIn(el + "-sub", t0 + 0.8 + c.data.n * 0.09, { y: 14, b: 8 });
    blurIn(el + "-hud", t0 + 0.7, { y: 0, b: 4, d: 0.4 });`,
};
