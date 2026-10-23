// Word wallpaper (motion-graphics-director, "repeated-word wallpaper"): the same word fills the frame in outlined
// rows that drift in opposite directions; one row in the middle is solid accent and holds still, and a small line
// lands under it. For the one word the ad is really about ("Every. Single. Day.", "Handled.", "Done.").
const ROWS = 9;

export default {
  id: "word-wallpaper",
  name: "Word wallpaper",
  job: "hook",
  scene: "always",
  use: 'Relentless repetition as a feeling: the one word the line hammers ("every call, every lead, every day" → "Every.", "it\'s handled" → "Handled.", "done for you" → "Done."). Always full-screen, 1.6–2.8 s, at most once.',
  fields: 'text = the word or 2-word phrase repeated (e.g. "Handled.", "Every day."); sub = a short line under the solid row (3–7 words, e.g. "Calls, leads, follow-ups.") or empty; highlight = a mono kicker or empty.',
  position: "center",
  anchor: null,
  minLen: 1.6,
  sfx: [["atlas-whoosh", 0, 0.3], ["atlas-impact", 0.45, 0.55]],
  data: () => ({ rows: ROWS }),
  css: ({ px, W, H, tall }) => `
      .tp-ww { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; display: flex; flex-direction: column; justify-content: center; gap: ${px(tall ? 6 : 2)}px; }
      .tp-ww-row { white-space: nowrap; font-family: var(--f-display); font-weight: 800; font-size: ${px(tall ? 170 : 130)}px; line-height: 1; letter-spacing: -0.04em; color: transparent; -webkit-text-stroke: ${Math.max(1, px(2))}px color-mix(in srgb, var(--tx) 26%, transparent); }
      .tp-ww-row.hot { color: var(--ac); -webkit-text-stroke: 0; text-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 45%, transparent); }
      .ag.tone-accent .tp-ww-row { -webkit-text-stroke-color: color-mix(in srgb, var(--ink) 30%, transparent); }
      .tp-ww-row span { padding-right: .35em; }
      .tp-ww-row.hot span { padding-right: 0; }
      .tp-ww-hot { display: flex; flex-direction: column; align-items: center; text-align: center; padding: ${px(18)}px 0; }
      .tp-ww-sub { margin-top: ${px(10)}px; font-weight: 600; font-size: ${px(tall ? 46 : 38)}px; color: var(--tx); }
      .tp-ww-k { position: absolute; top: ${Math.round(H * (tall ? 0.15 : 0.08))}px; left: 0; right: 0; text-align: center; }`,
  html: ({ id, c, esc }) => {
    const word = esc(c.text || "Handled.");
    const mid = Math.floor(ROWS / 2);
    const row = (i) => `<div class="tp-ww-row" id="${id}-r${i}">${Array.from({ length: 8 }, () => `<span>${word}</span>`).join("")}</div>`;
    return `<div class="tp-ww" id="${id}-wrap">${c.highlight ? `<div class="mk-kick tp-ww-k" id="${id}-k">${esc(c.highlight)}</div>` : ""}${Array.from({ length: ROWS }, (_, i) => (i === mid ? `<div class="tp-ww-hot"><div class="tp-ww-row hot" id="${id}-hot"><span>${word}</span></div>${c.sub ? `<div class="tp-ww-sub" id="${id}-sub">${esc(c.sub)}</div>` : ""}</div>` : row(i))).join("")}</div>`;
  },
  script: `
    var mid = Math.floor(c.data.rows / 2);
    for (var i = 0; i < c.data.rows; i++) {
      if (i === mid) continue;
      var dir = i % 2 ? 1 : -1, sp = 90 + (i % 3) * 40;
      tl.fromTo(el + "-r" + i, { x: dir > 0 ? -600 : -200, opacity: 0 }, { x: (dir > 0 ? -600 : -200) + dir * sp * (len + 0.4), opacity: 1, duration: len + 0.4, ease: "none", immediateRender: false }, t0 - 0.1);
      tl.fromTo(el + "-r" + i, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out", immediateRender: false }, t0 + Math.abs(i - mid) * 0.04);
    }
    blurIn(el + "-hot", t0 + 0.4, { y: 0, s: 1.25, b: 24, d: 0.5 });
    blurIn(el + "-sub", t0 + 0.65, { y: 14, b: 8 });
    blurIn(el + "-k", t0 + 0.2, { y: 0, b: 4, d: 0.4 });`,
};
