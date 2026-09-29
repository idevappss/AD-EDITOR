// Word swap (atlas-motion-kit.md #6; Remotion V2 "Every ___", V1 role beats, the Jeremy demo's "Every ___" with its
// progress counter): a small muted label over one big glowing word that snaps in (scale 1.25 → 1) and swaps as each
// is said, a segmented "02 / 05" counter under it. With a punchline (sub), the last word gets a thick marker strike and
// the punchline slams in big in the accent with a flash ("Every no-show. → Handled.").
const words = (c) => (c.items || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 8);
const r3 = (n) => Math.round(n * 1000) / 1000;
/** Seconds per word (and when the strike lands, when there's a punchline). */
function beats(duration, n, punch) {
  const len = Math.max(1.2, Number(duration) || 3);
  const room = len - 0.4 - (punch ? 1.1 : 0.3);
  const gap = Math.min(0.9, Math.max(0.36, room / Math.max(1, n)));
  return { gap: r3(gap), strike: r3(0.2 + n * gap), punch: r3(0.2 + n * gap + 0.4) };
}

export default {
  id: "word-swap",
  name: "Word swap",
  job: "benefit",
  scene: "optional",
  use: 'A run of roles, jobs or pains said back to back ("your setter, your marketer, your assistant", "every missed call, every unanswered DM, every no-show… handled", "every 1:1 call, every SOP, every DM"). One big word snaps in for each; add a punchline to strike the last and land the fix.',
  fields: 'text = the small label above, 1–4 words (e.g. "AI that works as", "Every"); items = 2–8 short words or phrases in the order said, 1–3 words each (e.g. "missed call.", "unanswered DM.", "no-show."); sub = an optional punchline that strikes the last word and lands big in the accent (e.g. "Handled.") or empty (then the last word lands in the accent).',
  position: "top",
  anchor: null,
  minLen: 1.6,
  sfx: (g) => {
    const list = words(g);
    const b = beats(g.duration, list.length, Boolean(String(g.sub || "").trim()));
    return [...list.map((_, i) => ["atlas-click", r3(0.2 + i * b.gap), 0.55]), ...(String(g.sub || "").trim() ? [["atlas-marker", b.strike, 0.8], ["atlas-impact", b.punch, 0.7]] : [])];
  },
  data: (c) => {
    const n = words(c).length;
    return { n, punch: Boolean(String(c.sub || "").trim()), ...beats(c.duration, n, Boolean(String(c.sub || "").trim())) };
  },
  css: ({ px, tall }) => `
      .tp-ws { display: flex; flex-direction: column; align-items: flex-start; min-width: ${tall ? 84 : 50}%; max-width: 90%; }
      .tp-ws-label { font-weight: 600; font-size: ${px(tall ? 50 : 44)}px; color: var(--tx2); }
      .tp-ws-stack { position: relative; display: grid; justify-items: start; margin-top: ${px(6)}px; }
      .tp-ws-stack .mk-h { grid-area: 1 / 1; font-size: ${px(tall ? 124 : 108)}px; white-space: nowrap; transform-origin: 0 50%; visibility: hidden; opacity: 0; }
      .tp-ws-bar { position: absolute; left: ${px(-10)}px; width: 0; top: 50%; height: ${px(24)}px; margin-top: ${px(-8)}px; border-radius: ${px(12)}px; background: var(--ac); transform-origin: 0 50%; transform: rotate(-1deg) scaleX(0); }
      .ag.tone-accent .tp-ws-bar { background: var(--ink); }
      .tp-ws-punch { margin-top: ${px(30)}px; font-size: ${px(tall ? 190 : 160)}px !important; transform-origin: 0 50%; }
      .tp-ws-prog { display: flex; align-items: center; gap: ${px(8)}px; margin-top: ${px(50)}px; font-family: var(--f-mono); font-size: ${px(20)}px; letter-spacing: .12em; color: var(--tx2); }
      .tp-ws-prog i { position: relative; width: ${px(26)}px; height: ${px(3)}px; border-radius: 2px; background: var(--line); }
      .tp-ws-prog i u { position: absolute; inset: 0; border-radius: inherit; background: var(--ac); opacity: 0; }
      .tp-ws-prog b { font-weight: 500; margin-left: ${px(10)}px; }`,
  html: ({ id, c, esc }) => {
    const list = words(c);
    const punch = String(c.sub || "").trim();
    const last = list.length - 1;
    return `<div class="tp-ws" id="${id}-wrap">${c.text ? `<div class="tp-ws-label" id="${id}-l">${esc(c.text)}</div>` : ""}<div class="tp-ws-stack">${list.map((w, i) => `<h3 class="mk-h${i === last && list.length > 1 && !punch ? " ac" : ""}" id="${id}-w${i}">${esc(w)}</h3>`).join("")}${punch ? `<i class="tp-ws-bar" id="${id}-strike"></i>` : ""}</div>${punch ? `<h3 class="mk-h ac tp-ws-punch" id="${id}-p">${esc(punch)}</h3>` : ""}${list.length > 2 && !punch ? `<div class="tp-ws-prog" id="${id}-prog">${list.map((_, i) => `<i><u id="${id}-g${i}"></u></i>`).join("")}<b id="${id}-num">01 / ${String(list.length).padStart(2, "0")}</b></div>` : ""}</div>`;
  },
  script: `
    var d = c.data, num = document.querySelector(el + "-num");
    blurIn(el + "-l", t0, { y: 10, b: 6, d: 0.45 });
    blurIn(el + "-prog", t0 + 0.1, { y: 0, b: 4, d: 0.4 });
    for (var i = 0; i < d.n; i++) {
      var at = t0 + 0.2 + i * d.gap;
      hide(el + "-w" + i);
      tl.fromTo(el + "-w" + i, { autoAlpha: 0, scale: 1.25 }, { autoAlpha: 1, scale: 1, duration: 0.17, ease: "expo.out", immediateRender: false }, at);
      if (i < d.n - 1) tl.set(el + "-w" + i, { autoAlpha: 0 }, at + d.gap);
      tl.set(el + "-g" + i, { opacity: 1 }, at);
      (function (k) { if (num) tl.call(function () { num.textContent = (k < 9 ? "0" : "") + (k + 1) + " / " + (d.n < 10 ? "0" : "") + d.n; }, null, at); })(i);
    }
    if (d.punch) {
      // The bar is as wide as the last word (measured), then drawn left to right like a marker.
      var lastW = document.querySelector(el + "-w" + (d.n - 1)), bar = document.querySelector(el + "-strike");
      if (lastW && bar) bar.style.width = (lastW.offsetWidth + 20) + "px";
      tl.fromTo(el + "-strike", { scaleX: 0, rotation: -1 }, { scaleX: 1, rotation: -1, duration: 0.4, ease: "power2.inOut", immediateRender: false }, t0 + d.strike);
      hide(el + "-p");
      tl.fromTo(el + "-p", { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)", immediateRender: false }, t0 + d.punch);
      tl.fromTo(el + "-bd", { filter: "brightness(1)" }, { filter: "brightness(1.7)", duration: 0.07, yoyo: true, repeat: 1, ease: "none", immediateRender: false }, t0 + d.punch);
    }`,
};
