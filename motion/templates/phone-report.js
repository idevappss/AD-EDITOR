// Phone report (Remotion "Report"): a two-tone headline ("It reports. / Before you ask."), then a phone rises into
// frame: a coral-to-ink lock screen with the date and a big time. A notification drops in from the top (the mark, a
// mono "ATLAS · WEEKLY ADS REPORT" label, a bold headline, a message, [Test them] Later); the button is tapped and
// turns green ("Test running"), and a line fades in at the foot of the screen.
import { ATLAS, ATLAS_MARK, GREEN, slots } from "./_parts.js";

const r3 = (n) => Math.round(n * 1000) / 1000;
const tap = (duration) => r3(Math.min(3.2, Math.max(1.4, (Number(duration) || 3.5) * 0.64)));

export default {
  id: "phone-report",
  name: "Phone report",
  job: "proof",
  scene: "optional",
  use: 'The product reports to you on its own ("every Friday you get the report", "it texts you the numbers", "it tells you what to fix before you ask"). A lock-screen notification; best full-screen, 3+ s.',
  fields: 'text = the notification headline (e.g. "ROAS 5.2x this week."); sub = the message (e.g. "Landing page converting at 3%. I drafted 2 new headlines. Want me to test them?"); highlight = an optional headline as "line 1 / line 2" (e.g. "It reports. / Before you ask."); items = [the label (e.g. "Atlas · Weekly ads report"), the button (e.g. "Test them"), after the tap (e.g. "Test running"), the date (e.g. "Friday, March 13"), the time (e.g. "11:58"), a footer (e.g. "Every Friday · 11:58 AM · automatically")]. Write "-" for a slot you leave empty.',
  position: "top",
  anchor: null,
  minLen: 2.4,
  sfx: (g) => [["atlas-whoosh", 0.05, 0.35], ["atlas-ding", 0.9, 0.6], ["atlas-click", tap(g.duration), 0.8], ["atlas-success", tap(g.duration) + 0.25, 0.5]],
  data: (c) => ({ tap: tap(c.duration) }),
  css: ({ px, W, tall }) => `
      .tp-pr { display: flex; flex-direction: column; align-items: center; width: ${Math.round(W * (tall ? 0.84 : 0.5))}px; }
      .tp-pr .mk-h { align-self: stretch; margin-bottom: ${px(50)}px; font-size: ${px(tall ? 92 : 76)}px; letter-spacing: -0.03em; line-height: 1; }
      .tp-pr-phone { position: relative; width: ${px(640)}px; height: ${px(tall ? 1050 : 760)}px; overflow: hidden; box-sizing: border-box; border-radius: ${px(80)}px; border: ${px(14)}px solid #0B0908; background: linear-gradient(160deg, ${ATLAS.coralDeep}, ${ATLAS.ink2} 55%); box-shadow: 0 ${px(60)}px ${px(140)}px rgba(0,0,0,.6); }
      .tp-pr-clock { margin-top: ${px(90)}px; text-align: center; color: #FBF1E8; }
      .tp-pr-clock small { display: block; font-weight: 600; font-size: ${px(30)}px; opacity: .8; }
      .tp-pr-clock b { display: block; font-weight: 700; font-size: ${px(150)}px; letter-spacing: -0.04em; line-height: 1; }
      .tp-pr-note { position: absolute; left: ${px(24)}px; right: ${px(24)}px; top: ${px(tall ? 400 : 330)}px; padding: ${px(26)}px ${px(28)}px; border-radius: ${px(40)}px; background: rgba(251,241,232,.94); color: ${ATLAS.ink}; }
      .tp-pr-app { display: flex; align-items: center; gap: ${px(12)}px; }
      .tp-pr-app span { display: grid; place-items: center; width: ${px(48)}px; height: ${px(48)}px; padding: ${px(8)}px; box-sizing: border-box; border-radius: ${px(12)}px; background: ${ATLAS.ink}; color: var(--ac); }
      .tp-pr-app em { font-style: normal; font-family: var(--f-mono); font-size: ${px(20)}px; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }
      .tp-pr-note b { display: block; margin-top: ${px(14)}px; font-weight: 700; font-size: ${px(34)}px; }
      .tp-pr-note p { margin: ${px(6)}px 0 0; font-weight: 500; font-size: ${px(28)}px; line-height: 1.3; opacity: .8; }
      .tp-pr-btns { display: flex; align-items: center; gap: ${px(14)}px; margin-top: ${px(20)}px; }
      .tp-pr-go { display: grid; border-radius: ${px(20)}px; font-weight: 700; font-size: ${px(28)}px; }
      .tp-pr-go span { grid-area: 1 / 1; padding: ${px(12)}px ${px(26)}px; border-radius: inherit; background: var(--ac); white-space: nowrap; }
      .tp-pr-go span:first-child { color: var(--on-ac); }
      .tp-pr-go span + span { background: ${GREEN}; opacity: 0; }
      .tp-pr-later { padding: ${px(12)}px ${px(16)}px; font-weight: 600; font-size: ${px(28)}px; opacity: .55; }
      .tp-pr-foot { position: absolute; left: 0; right: 0; bottom: ${px(50)}px; text-align: center; font-weight: 600; font-size: ${px(26)}px; color: rgba(251,241,232,.85); }`,
  html: ({ id, c, esc }) => {
    const hl = String(c.highlight || "").split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
    const [label, btn, after, date, time, foot] = slots(c, 6);
    return `<div class="tp-pr" id="${id}-wrap">${hl.length ? `<h3 class="mk-h"><span id="${id}-h1">${esc(hl[0])}</span>${hl[1] ? `<span class="ac" id="${id}-h2">${esc(hl[1])}</span>` : ""}</h3>` : ""}<div class="tp-pr-phone" id="${id}-phone"><div class="tp-pr-clock"><small>${esc(date || "Friday, March 13")}</small><b>${esc(time || "11:58")}</b></div><div class="tp-pr-note" id="${id}-note"><div class="tp-pr-app"><span>${ATLAS_MARK()}</span><em>${esc(label || "Atlas · Weekly report")}</em></div><b>${esc(c.text)}</b>${c.sub ? `<p>${esc(c.sub)}</p>` : ""}<div class="tp-pr-btns"><span class="tp-pr-go" id="${id}-go"><span>${esc(btn || "Test them")}</span><span id="${id}-live">${esc(after || "Test running")}</span></span><span class="tp-pr-later">Later</span></div></div>${foot ? `<div class="tp-pr-foot" id="${id}-foot">${esc(foot)}</div>` : ""}</div></div>`;
  },
  script: `
    var k = t0 + c.data.tap;
    blurIn(el + "-h1", t0, { y: 24, b: 10 });
    blurIn(el + "-h2", t0 + 0.15, { y: 24, b: 10 });
    hide(el + "-phone");
    tl.fromTo(el + "-phone", { autoAlpha: 0, y: 300 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, t0 + 0.05);
    hide(el + "-note");
    tl.fromTo(el + "-note", { autoAlpha: 0, y: -120, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out", immediateRender: false }, t0 + 0.9);
    tl.fromTo(el + "-go", { scale: 1 }, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, k);
    tl.fromTo(el + "-live", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, k + 0.25);
    blurIn(el + "-foot", k + 0.3, { y: 10, b: 6 });`,
};
