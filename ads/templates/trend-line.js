// Trend line: a neon brand-colour zig-zag draws itself up and to the right over the shot (no card), a bright tip
// riding it, under a small two-line caption (ads/references/retention-transitions.md "ba-trend-line").

// A climb with dips, the same every time. viewBox 600 × 260.
const PTS = [[4, 246], [62, 214], [104, 228], [168, 170], [214, 188], [282, 128], [326, 146], [398, 84], [442, 100], [528, 36], [596, 10]];
const D = PTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

export default {
  id: "trend-line",
  name: "Trend line",
  job: "data",
  use: 'Something rising with no exact number to show ("growing fast", "it doubled", "going up every month", "the demand is exploding"). A neon line draws up across the frame.',
  fields: 'text = a small lead-in, 1–4 words (e.g. "this market"); sub = the emphasis, 1–3 words (e.g. "growing fast").',
  position: "center",
  anchor: null,
  minLen: 2.6,
  sfx: [["whoosh-short", 0, 0.25], ["revswell", 2.02, 0.4], ["tick", 2.05, 0.5]],
  data: () => ({}),
  css: ({ px, tall }) => `
      .tp-tr { position: relative; width: ${tall ? 84 : 52}%; }
      .tp-tr-cap { display: flex; flex-direction: column; align-items: flex-start; gap: ${px(4)}px; text-shadow: 0 ${px(3)}px ${px(18)}px rgba(0,0,0,.6); }
      .tp-tr-rule { display: block; width: ${px(70)}px; height: ${px(5)}px; margin-bottom: ${px(8)}px; border-radius: ${px(3)}px; background: var(--ac); box-shadow: 0 0 ${px(14)}px var(--ac); transform-origin: 0 50%; transform: scaleX(0); }
      .tp-tr-cap span { font-weight: 700; font-size: ${px(34)}px; line-height: 1.1; color: #fff; opacity: 0; }
      .tp-tr-cap b { max-width: 100%; font-weight: 900; font-size: ${px(66)}px; line-height: 1.02; letter-spacing: -0.03em; color: var(--ac); opacity: 0; text-shadow: 0 0 ${px(26)}px color-mix(in srgb, var(--ac) 55%, transparent), 0 ${px(3)}px ${px(18)}px rgba(0,0,0,.5); }
      .tp-tr svg { display: block; width: 100%; height: auto; margin-top: ${px(14)}px; overflow: visible; }
      .tp-tr-glow { fill: none; stroke: var(--ac); stroke-width: 18; stroke-linecap: round; stroke-linejoin: round; opacity: .35; filter: blur(${px(10)}px); stroke-dasharray: 100; stroke-dashoffset: 100; }
      .tp-tr-path { fill: none; stroke: color-mix(in srgb, var(--ac) 70%, #fff); stroke-width: 6.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100;
        filter: drop-shadow(0 0 ${px(5)}px var(--ac)) drop-shadow(0 0 ${px(18)}px var(--ac)); }
      .tp-tr-dot { fill: #fff; opacity: 0; filter: drop-shadow(0 0 ${px(8)}px var(--ac)) drop-shadow(0 0 ${px(20)}px var(--ac)); }
      .tp-tr-ring { fill: none; stroke: var(--ac); stroke-width: 3; opacity: 0; }`,
  html: ({ id, c, esc }) =>
    `<div class="tp-tr" id="${id}-wrap"><div class="tp-tr-cap"><i class="tp-tr-rule" id="${id}-rule"></i>${c.text ? `<span id="${id}-a">${esc(c.text)}</span>` : ""}${c.sub ? `<b id="${id}-b">${esc(c.sub)}</b>` : ""}</div><svg viewBox="0 0 600 260"><path class="tp-tr-glow" id="${id}-glow" d="${D}" pathLength="100"/><path class="tp-tr-path" id="${id}-path" d="${D}" pathLength="100"/><circle class="tp-tr-ring" id="${id}-ring" cx="596" cy="10" r="10"/><circle class="tp-tr-dot" id="${id}-dot" cx="4" cy="246" r="8"/></svg></div>`,
  script: `
    var d0 = t0 + 0.22, dur = 1.8, end = d0 + dur;
    tl.fromTo(el + "-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, t0);
    tl.fromTo(el + "-a", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, t0 + 0.08);
    tl.fromTo(el + "-b", { opacity: 0, y: 20, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "expo.out", immediateRender: false }, t0 + 0.18);
    // The draw: steady, with the bright tip riding the line.
    tl.fromTo([el + "-path", el + "-glow"], { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: dur, ease: "sine.in", immediateRender: false }, d0);
    var path = document.querySelector(el + "-path"), dot = document.querySelector(el + "-dot");
    if (path && dot && path.getTotalLength) {
      var L = path.getTotalLength(), o = { p: 0 };
      tl.fromTo(o, { p: 0 }, { p: 1, duration: dur, ease: "sine.in", immediateRender: false, onUpdate: function () {
        var pt = path.getPointAtLength(o.p * L); dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1));
      } }, d0);
    }
    tl.fromTo(el + "-dot", { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, d0);
    // Lands at the top: the tip flares and a ring pings out.
    tl.fromTo(el + "-dot", { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.7, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, end);
    tl.fromTo(el + "-ring", { opacity: 0.9, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 0, scale: 3.2, duration: 0.6, ease: "power2.out", immediateRender: false }, end);`,
};
