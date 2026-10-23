// Percent circle: a glossy brand-colour sphere sweeps in clockwise like a pie wedge closing, the big number is written
// in with a soft mask and counts up, then lands with a punch (motion/references/retention-transitions.md
// "ba-percent-circle", in the brand's gold-orange instead of red).
import { COUNT_UP } from "./_parts.js";

export default {
  id: "percent-circle",
  name: "Percent circle",
  job: "data",
  use: 'One striking percentage or count said on its own ("293% more bookings", "9 out of 10 patients", "82 million people", "40% fewer no-shows"). Bigger and bolder than a stat line.',
  fields: 'text = the number with its unit, short (e.g. "293%", "82M", "9/10"); sub = what it means, 2–5 words (e.g. "more new patients").',
  position: "top",
  anchor: "number",
  minLen: 2,
  sfx: [["whoosh-short", 0, 0.35], ["ticker", 0.35, 0.3], ["bell", 1.35, 0.45]],
  data: (c) => {
    const n = String(c.text || "").trim().length;
    // Sized so the number stays on one line inside the circle; only long counts ("82 million") wrap.
    return { size: n <= 2 ? 170 : n <= 3 ? 150 : n <= 4 ? 122 : n <= 5 ? 102 : n <= 7 ? 82 : 68, wrap: n > 7 };
  },
  css: ({ px }) => `
      .tp-pc { position: relative; width: ${px(470)}px; height: ${px(470)}px; }
      .tp-pc-shadow { position: absolute; inset: 0; border-radius: 50%; opacity: 0; box-shadow: 0 ${px(30)}px ${px(70)}px rgba(0,0,0,.45), 0 0 ${px(90)}px color-mix(in srgb, var(--ac) 50%, transparent); }
      .tp-pc-ball { --a: 0; position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
        background: radial-gradient(circle at 32% 26%, color-mix(in srgb, var(--ac) 40%, #fff) 0%, var(--ac) 40%, color-mix(in srgb, var(--ac) 68%, #000) 100%);
        box-shadow: inset 0 ${px(-24)}px ${px(50)}px rgba(0,0,0,.2), inset 0 ${px(8)}px ${px(20)}px rgba(255,255,255,.25);
        -webkit-mask: conic-gradient(#000 calc(var(--a) * 360deg), transparent 0); mask: conic-gradient(#000 calc(var(--a) * 360deg), transparent 0); }
      .tp-pc-gloss { position: absolute; left: 15%; top: 7%; width: 52%; height: 30%; border-radius: 50%; transform: rotate(-24deg); background: linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,0)); filter: blur(${px(5)}px); }
      .tp-pc-txt { --m: 0; position: absolute; inset: 11%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: ${px(6)}px;
        -webkit-mask-image: linear-gradient(90deg, #000 calc(var(--m) * 140% - 40%), transparent calc(var(--m) * 140%)); mask-image: linear-gradient(90deg, #000 calc(var(--m) * 140% - 40%), transparent calc(var(--m) * 140%)); }
      .tp-pc-txt b { display: block; font-weight: 900; line-height: .95; letter-spacing: -0.045em; color: #fff; font-variant-numeric: tabular-nums; white-space: nowrap; text-shadow: 0 ${px(6)}px ${px(22)}px rgba(0,0,0,.22); }
      .tp-pc-txt b.tp-pc-wrap { white-space: normal; }
      .tp-pc-txt span { max-width: 88%; font-weight: 700; font-size: ${px(32)}px; line-height: 1.15; color: rgba(255,255,255,.95); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 ${px(2)}px ${px(10)}px rgba(0,0,0,.2); }`,
  html: ({ id, c, esc, px, data }) =>
    `<div class="tp-pc" id="${id}-wrap"><i class="tp-pc-shadow" id="${id}-sh"></i><div class="tp-pc-ball" id="${id}-ball"><i class="tp-pc-gloss"></i></div><div class="tp-pc-txt" id="${id}-txt"><b id="${id}-num"${data.wrap ? ' class="tp-pc-wrap"' : ""} style="font-size:${px(data.size)}px">${esc(c.text)}</b>${c.sub ? `<span>${esc(c.sub)}</span>` : ""}</div></div>`,
  script: `
    ${COUNT_UP}
    var land = t0 + 1.35;
    // The wedge sweeps clockwise from 12 o'clock into a full circle.
    tl.fromTo(el + "-ball", { "--a": 0, rotation: -40, scale: 0.9 }, { "--a": 1, rotation: 0, scale: 1, duration: 0.5, ease: "power2.inOut", immediateRender: false }, t0);
    tl.fromTo(el + "-sh", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, t0 + 0.35);
    // Number written in left to right, counting up; lands with a punch while the circle swells 5%.
    tl.fromTo(el + "-txt", { "--m": 0 }, { "--m": 1, duration: 0.4, ease: "power2.out", immediateRender: false }, t0 + 0.35);
    countUp(el + "-num", t0 + 0.35, 1.0, "power2.out");
    tl.fromTo(el + "-num", { scale: 1.15 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)", immediateRender: false }, land);
    tl.fromTo([el + "-ball", el + "-sh"], { scale: 1 }, { scale: 1.05, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, land);
    drift(el + "-wrap", land + 0.3, out - land - 0.5, 5);`,
};
