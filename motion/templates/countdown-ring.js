// Countdown ring: a thick brand-colour ring clock-wipes round while a big digit hard-cuts down from N to 1, with a
// label under it (motion/references/retention-transitions.md "hk-countdown-ring").

export default {
  id: "countdown-ring",
  name: "Countdown ring",
  job: "data",
  use: 'Urgency or a short time frame ("in 60 seconds", "7 days", "5 minutes a day", "only 3 spots left", "in under 5 minutes"). A ring clocks round while a digit counts down.',
  fields: 'text = the number to count down from, with its unit if any (e.g. "7 days", "5"); digits run 3–9, so bigger numbers still count from 9. sub = the label under the digit (default: the unit from text, else "SECONDS").',
  position: "top",
  anchor: null,
  minLen: 2.6,
  sfx: [["whoosh-short", 0, 0.25], ["tick", 0.3, 0.45], ["tick", 1.3, 0.45], ["tick", 2.3, 0.45], ["boom", -0.45, 0.28]],
  data: (c) => {
    const t = String(c.text || "");
    const m = t.match(/\d+/);
    const n = m ? Math.max(3, Math.min(9, Number(m[0]))) : 5;
    const unit = m ? t.slice(m.index + m[0].length).replace(/[^A-Za-z ]/g, " ").trim().split(/\s+/)[0] || "" : "";
    return { n, label: String(c.sub || unit || "SECONDS").trim().toUpperCase().slice(0, 18) };
  },
  css: ({ px }) => `
      .tp-cd { position: relative; width: ${px(410)}px; height: ${px(410)}px; }
      .tp-cd svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-cd-disc { fill: rgba(10,10,12,.62); }
      .tp-cd-trk { fill: none; stroke: color-mix(in srgb, var(--ac) 22%, transparent); stroke-width: 16; }
      .tp-cd-arc { fill: none; stroke: var(--ac); stroke-width: 16; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; filter: drop-shadow(0 0 ${px(8)}px var(--ac)) drop-shadow(0 0 ${px(24)}px color-mix(in srgb, var(--ac) 60%, transparent)); }
      .tp-cd-mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${px(2)}px; }
      .tp-cd-dig { display: grid; }
      .tp-cd-dig b { grid-area: 1 / 1; text-align: center; font-weight: 900; font-size: ${px(178)}px; line-height: 1; letter-spacing: -0.04em; color: #fff; font-variant-numeric: tabular-nums; opacity: 0;
        text-shadow: 0 0 ${px(30)}px color-mix(in srgb, var(--ac) 55%, transparent), 0 ${px(6)}px ${px(24)}px rgba(0,0,0,.45); }
      .tp-cd-mid em { max-width: 70%; font-style: normal; font-weight: 800; font-size: ${px(26)}px; letter-spacing: .22em; color: var(--ac); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: -.22em; }`,
  html: ({ id, esc, data }) => {
    const digits = [];
    for (let k = data.n; k >= 1; k--) digits.push(`<b id="${id}-d${k}">${k}</b>`);
    return `<div class="tp-cd" id="${id}-wrap"><svg viewBox="0 0 200 200"><circle class="tp-cd-disc" cx="100" cy="100" r="76"/><circle class="tp-cd-trk" cx="100" cy="100" r="88"/><circle class="tp-cd-arc" id="${id}-arc" cx="100" cy="100" r="88" pathLength="100" transform="rotate(-90 100 100)"/></svg><div class="tp-cd-mid"><span class="tp-cd-dig">${digits.join("")}</span><em>${esc(data.label)}</em></div></div>`;
  },
  script: `
    var n = c.data.n || 5, a = t0 + 0.3;
    // One digit per step across the time we have, capped at a real second each.
    var step = Math.max(0.3, Math.min(1, (out - a - 0.15) / n)), end = a + n * step;
    tl.fromTo(el + "-wrap", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)", immediateRender: false }, t0);
    tl.fromTo(el + "-arc", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: n * step, ease: "none", immediateRender: false }, a);
    for (var j = 0; j < n; j++) {
      var d = el + "-d" + (n - j), s = a + j * step;
      tl.fromTo(d, { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, s);
      tl.fromTo(d, { scale: 1.25 }, { scale: 1, duration: Math.min(0.3, step * 0.8), ease: "power3.out", immediateRender: false }, s);
      if (j < n - 1) tl.fromTo(d, { opacity: 1 }, { opacity: 0, duration: 0.01, immediateRender: false }, s + step);
    }
    // Ring closes: a punch and a flare.
    if (end < out) tl.fromTo(el + "-wrap", { scale: 1 }, { scale: 1.08, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, end);`,
};
