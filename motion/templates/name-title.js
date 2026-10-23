// Name title (the master edit, motion/references/sound-study.md, 36.5–38 s: "S… SooWei / founder of Goh
// Consulting"). Over the speaker, low on the chest: the first letter of the name lands on its own, the rest of the name
// blurs in beside it letter by letter, then the role line comes up under it in small italics, word by word. Plain white,
// no card, no glow. It lands with the reveal's boom and a click on the role line.

const r3 = (n) => Math.round(n * 1000) / 1000;
const parse = (c) => {
  const name = String(c.text || "").trim().slice(0, 28) || "Your Name";
  const role = String(c.sub || "").trim().split(/\s+/).filter(Boolean).slice(0, 8);
  return { name, role };
};
/** When the rest of the name starts, when the role line starts (seconds from the graphic's start). */
const beats = (c) => {
  const { name } = parse(c);
  const rest = 0.35, letters = Math.max(0, [...name].length - 1) * 0.035;
  return { rest, role: r3(rest + letters + 0.2) };
};

export default {
  id: "name-title",
  name: "Name title",
  job: "proof",
  use: 'Introduces who\'s talking, as in the master edit: the speaker\'s name building in letter by letter with their role under it in small italics ("I\'m Dr. Odell Miller, I run…", "my name is…", the moment the speaker or a guest is introduced). Once per ad, early, over the speaker.',
  fields: 'text = the name as it should read (e.g. "Dr. Odell Miller"); sub = the role line, lowercase is fine (e.g. "founder of HBA Consulting").',
  position: "bottom",
  anchor: null,
  minLen: 2,
  // It takes the captions' place while it's up, as in the master edit.
  hideCaptions: true,
  sfx: (g) => [["impact-bass-1", 0.02, 0.5], ["atlas-click", beats(g).role, 0.35]],
  data: (c) => ({ n: [...parse(c).name].length, m: parse(c).role.length, ...beats(c) }),
  css: ({ px, tall }) => `
      .tp-nt { display: flex; flex-direction: column; align-items: center; text-align: center; }
      .tp-nt-name { font-family: "Inter", system-ui, sans-serif; font-weight: 600; font-size: ${px(tall ? 128 : 112)}px; line-height: 1; letter-spacing: -0.04em; color: #fff; white-space: nowrap;
        text-shadow: 0 ${px(4)}px ${px(30)}px rgba(0,0,0,.45); }
      .tp-nt-name span, .tp-nt-role span { display: inline-block; will-change: transform, opacity, filter; }
      .tp-nt-role { margin-top: ${px(10)}px; font-family: "Inter", system-ui, sans-serif; font-style: italic; font-weight: 500; font-size: ${px(tall ? 42 : 38)}px; letter-spacing: -0.01em; color: #fff; text-shadow: 0 ${px(2)}px ${px(16)}px rgba(0,0,0,.6); }`,
  html: ({ id, c, esc }) => {
    const { name, role } = parse(c);
    return `<div class="tp-nt" id="${id}-wrap"><div class="tp-nt-name">${[...name].map((ch, k) => `<span id="${id}-l${k}">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("")}</div>${role.length ? `<div class="tp-nt-role">${role.map((w, k) => `<span id="${id}-r${k}">${esc(w)}</span>`).join(" ")}</div>` : ""}</div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-l0", t0, { y: 10, s: 0.92, b: 12, d: 0.4 });
    for (var k = 1; k < d.n; k++) blurIn(el + "-l" + k, t0 + d.rest + (k - 1) * 0.035, { x: 22, y: 0, s: 1, b: 10, d: 0.4 });
    for (var r = 0; r < d.m; r++) blurIn(el + "-r" + r, t0 + d.role + r * 0.12, { y: 10, b: 8, d: 0.35 });
    blurOut(el + "-wrap", out, { y: -10, b: 10, d: 0.35 });`,
};
