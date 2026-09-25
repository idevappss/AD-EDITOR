// Glass card: frosted glass over huge drifting brand-colour glows, the words floating in one by one.
export default {
  id: "glass-card",
  name: "Glass card",
  job: "benefit",
  use: "One big benefit or promise worth a moment on its own (\"works while you sleep\", \"no more spreadsheets\"). Use sparingly, at most once per ad.",
  fields: "text = the benefit, 2–5 words; sub = a short second line or empty.",
  position: "top",
  anchor: null,
  minLen: 1.8,
  sfx: [["whoosh-short", 0, 0.35]],
  data: (c) => ({ words: String(c.text || "").trim().split(/\s+/).length }),
  css: ({ px, tall }) => `
      .tp-glass { position: relative; width: ${tall ? 84 : 48}%; padding: ${px(44)}px ${px(40)}px; text-align: center; }
      .tp-blob { position: absolute; border-radius: 50%; filter: blur(${px(70)}px); opacity: .85; }
      .tp-blob.a { width: 58%; aspect-ratio: 1; left: -8%; top: -18%; background: var(--ac); }
      .tp-blob.b { width: 50%; aspect-ratio: 1; right: -6%; top: 10%; background: #7B5CFF; }
      .tp-blob.c { width: 44%; aspect-ratio: 1; left: 28%; bottom: -30%; background: #1EC8FF; }
      .tp-glass-card { position: relative; padding: ${px(40)}px ${px(36)}px; border-radius: ${px(40)}px; border: 2px solid transparent;
        background: linear-gradient(rgba(255,255,255,.12), rgba(255,255,255,.06)) padding-box, linear-gradient(135deg, rgba(255,255,255,.9), rgba(255,255,255,.25) 20%, rgba(255,255,255,.05) 55%, rgba(255,255,255,.6)) border-box;
        backdrop-filter: blur(${px(26)}px) saturate(1.4); -webkit-backdrop-filter: blur(${px(26)}px) saturate(1.4); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 ${px(30)}px ${px(80)}px rgba(0,0,0,.35); }
      .tp-glass-card h3 { margin: 0; font-weight: 900; font-size: ${px(66)}px; line-height: 1.05; letter-spacing: -0.03em; color: #fff; text-shadow: 0 ${px(4)}px ${px(20)}px rgba(0,0,0,.25); }
      .tp-glass-card h3 span { display: inline-block; }
      .tp-glass-card p { margin: ${px(14)}px 0 0; font-weight: 600; font-size: ${px(30)}px; color: rgba(255,255,255,.85); }`,
  html: ({ id, c, esc }) => `<div class="tp-glass"><i class="tp-blob a" id="${id}-ba"></i><i class="tp-blob b" id="${id}-bb"></i><i class="tp-blob c" id="${id}-bc"></i><div class="tp-glass-card" id="${id}-card"><h3>${String(c.text || "").trim().split(/\s+/).map((w, i) => `<span id="${id}-w${i}">${esc(w)}</span>`).join(" ")}</h3>${c.sub ? `<p id="${id}-sub">${esc(c.sub)}</p>` : ""}</div></div>`,
  script: `
    tl.fromTo([el + "-ba", el + "-bb", el + "-bc"], { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 0.85, scale: 1, duration: 0.8, ease: "expo.out", stagger: 0.08, immediateRender: false }, t0);
    tl.fromTo(el + "-ba", { x: 0, y: 0 }, { x: 40, y: 30, duration: Math.max(0.5, len), ease: "sine.inOut", immediateRender: false }, t0);
    tl.fromTo(el + "-bb", { x: 0, y: 0 }, { x: -50, y: 20, duration: Math.max(0.5, len), ease: "sine.inOut", immediateRender: false }, t0);
    floatIn(el + "-card", t0 + 0.05, { y: 60 });
    for (var w = 0; w < (c.data.words || 0); w++) tl.fromTo(el + "-w" + w, { autoAlpha: 0, y: 30, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "expo.out", immediateRender: false }, t0 + 0.25 + w * 0.07);
    tl.fromTo(el + "-sub", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, t0 + 0.55);
    drift(el + "-card", t0 + 0.9, len - 1.2, 6);`,
};
