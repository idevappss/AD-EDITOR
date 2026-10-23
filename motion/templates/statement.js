// Statement (atlas-motion-kit.md #15): the two-tone headline as its own beat, always as a full-screen cutaway so it
// never sits on the speaker's face. Line 1 in cream, line 2 in the accent after a short hold.
import { slots } from "./_parts.js";

export default {
  id: "statement",
  name: "Two-tone statement",
  job: "benefit",
  scene: "always",
  use: 'The one line that sums the ad up, said as a pair ("You ask. It does the work.", "It won\'t replace you. It handles what buries you.", "Your clinic runs you. Now it runs itself."). At most once per ad; it cuts away from the speaker.',
  fields: 'text = line 1, 2–5 words (e.g. "You ask."); sub = line 2 in the accent, 2–6 words (e.g. "It does the work."); items = [an optional kicker above, 2–4 words (e.g. "Atlas beta · live now"), an optional note under it with a side bar, up to ~80 characters (e.g. "Trained on the HBA playbook behind clinics doing $100K+ a month.")]. Write "-" for an empty slot.',
  position: "center",
  anchor: null,
  minLen: 1.4,
  sfx: [["atlas-whoosh", 0.02, 0.4]],
  data: () => ({}),
  css: ({ px, W, tall }) => `
      .tp-st { width: ${Math.round(W * (tall ? 0.84 : 0.6))}px; text-align: left; }
      .tp-st .mk-kick { margin-bottom: ${px(22)}px; }
      .tp-st .mk-h { font-size: ${px(tall ? 124 : 108)}px; letter-spacing: -0.035em; line-height: .98; }
      .tp-st .mk-h > span + span { margin-top: ${px(28)}px; }
      .tp-st-note { margin-top: ${px(70)}px; padding-left: ${px(28)}px; border-left: ${px(8)}px solid var(--ac); font-weight: 600; font-size: ${px(38)}px; line-height: 1.35; color: var(--tx); }
      .ag.tone-accent .tp-st-note { border-color: var(--ink); color: var(--ink); }`,
  html: ({ id, c, esc }) => `<div class="tp-st" id="${id}-wrap">${slots(c, 1)[0] ? `<div class="mk-kick display" id="${id}-k">${esc(slots(c, 1)[0])}</div>` : ""}<h3 class="mk-h"><span id="${id}-l1">${esc(c.text)}</span>${c.sub ? `<span class="ac" id="${id}-l2">${esc(c.sub)}</span>` : ""}</h3>${slots(c, 2)[1] ? `<div class="tp-st-note" id="${id}-n">${esc(slots(c, 2)[1])}</div>` : ""}</div>`,
  script: `
    blurIn(el + "-k", t0, { y: 8, b: 6 });
    blurIn(el + "-l1", t0 + 0.05, { y: 26, b: 18, d: 0.75 });
    blurIn(el + "-l2", t0 + Math.min(0.75, len * 0.3), { y: 26, b: 18, d: 0.75 });
    blurIn(el + "-n", t0 + Math.min(1.3, len * 0.5), { y: 20, b: 10 });
    tl.fromTo(el + "-wrap", { scale: 1 }, { scale: 1.035, duration: len, ease: "none", immediateRender: false }, t0);`,
};
