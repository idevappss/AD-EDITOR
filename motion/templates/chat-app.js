// Chat app (Remotion "ChatDemo"): a two-tone headline ("You ask. / It does the work."), then the product's chat window:
// an ink header (the mark, "Atlas · COO", "● 6 agents online"), the prompt typing into the input, sent as an accent
// bubble, "···" and the reply ("On it. Handing this to your team:") with each agent's job ticking off in a square box,
// then an approval bubble ([Approve] → "Campaign live"), tapped by a cursor. Best on the paper tone, 5+ s.
import { ATLAS, ATLAS_MARK, GREEN, chars } from "./_parts.js";

const rows = (c) => (c.items || []).map((x) => {
  const [a, b] = String(x || "").split("|").map((s) => s.trim());
  return b ? { agent: a, job: b } : { agent: "", job: a };
}).filter((r) => r.job).slice(0, 4);
const r3 = (n) => Math.round(n * 1000) / 1000;
/** The beats, seconds after the start, stretched to the clip (the Remotion scene is 11 s; ads give it 4–8). */
function beats(duration, n) {
  const k = Math.min(1, Math.max(0.45, (Number(duration) || 6) / 10));
  const at = (s) => r3(s * k);
  return { type: at(0.45), typeLen: at(1.4), sent: at(2.1), dots: at(2.45), reply: at(3.25), rows: Array.from({ length: n }, (_, i) => at(4.3 + i * 0.8)), approve: at(4.3 + n * 0.8 + 0.3), tap: at(4.3 + n * 0.8 + 1.3) };
}

export default {
  id: "chat-app",
  name: "Chat app demo",
  job: "product",
  scene: "optional",
  use: 'The whole flow in one scene: you ask in plain words, it hands the work to the team, you approve, it\'s live ("you just tell it what you want… it hands it to the team… you hit approve… live in minutes"). Needs 5+ seconds; best full-screen on the paper tone.',
  fields: 'text = the prompt typed in (e.g. "Launch a back pain campaign for March."); sub = the reply line (default "On it. Handing this to your team:"); items = 2–4 jobs as "AGENT | job" (e.g. "Marketing Assistant | 10 ad hooks written", "Video Editor | 3 ads cut + captioned", "Ads Specialist | Broad + lookalike ad sets built"); highlight = an optional headline as "line 1 / line 2" (e.g. "You ask. / It does the work.").',
  position: "top",
  anchor: null,
  minLen: 4,
  sfx: (g) => {
    const b = beats(g.duration, rows(g).length);
    return [["atlas-typing", b.type, 0.4], ["atlas-whoosh", b.sent, 0.35], ["atlas-pop", b.reply, 0.55], ...b.rows.map((t) => ["atlas-click", t, 0.5]), ["atlas-pop", b.approve, 0.45], ["atlas-click", b.tap, 0.9], ["atlas-success", b.tap + 0.3, 0.6]];
  },
  data: (c) => ({ n: rows(c).length, chars: [...String(c.text || "")].length, ...beats(c.duration, rows(c).length) }),
  css: ({ px, W, H, tall }) => `
      .tp-ca { position: relative; width: ${Math.round(W * (tall ? 0.89 : 0.52))}px; }
      .tp-ca .mk-h { margin-bottom: ${px(44)}px; font-size: ${px(tall ? 92 : 76)}px; letter-spacing: -0.03em; line-height: 1; }
      .tp-ca-win { position: relative; height: ${Math.round(H * (tall ? 0.6 : 0.62))}px; overflow: hidden; border-radius: ${px(48)}px; background: #fff; box-shadow: 0 ${px(50)}px ${px(120)}px rgba(23,18,15,.22); }
      .ag:not(.tone-paper) .tp-ca-win { background: #1E1916; box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(251,241,232,.1), 0 ${px(50)}px ${px(120)}px rgba(0,0,0,.5); }
      .tp-ca-head { display: flex; align-items: center; gap: ${px(20)}px; height: ${px(110)}px; padding: 0 ${px(36)}px; background: ${ATLAS.ink}; }
      .tp-ca-head > span { width: ${px(56)}px; height: ${px(56)}px; color: var(--ac); }
      .tp-ca-head b { display: block; font-weight: 700; font-size: ${px(34)}px; color: #FBF1E8; }
      .tp-ca-head small { font-weight: 500; font-size: ${px(24)}px; color: ${GREEN}; }
      .tp-ca-body { display: flex; flex-direction: column; gap: ${px(24)}px; padding: ${px(34)}px; }
      .tp-ca-me { align-self: flex-end; max-width: 82%; padding: ${px(24)}px ${px(30)}px; border-radius: ${px(36)}px ${px(36)}px ${px(10)}px ${px(36)}px; background: var(--ac); color: #fff; font-weight: 600; font-size: ${px(34)}px; line-height: 1.25; transform-origin: 100% 100%; }
      .tp-ca-it { position: relative; align-self: flex-start; max-width: 92%; padding: ${px(24)}px ${px(30)}px; border-radius: ${px(36)}px ${px(36)}px ${px(36)}px ${px(10)}px; background: #F4EFE9; color: ${ATLAS.ink}; }
      .ag:not(.tone-paper) .tp-ca-it { background: #2A221D; color: #FBF1E8; }
      .tp-ca-dots { position: absolute; left: ${px(30)}px; top: ${px(26)}px; display: flex; gap: ${px(10)}px; }
      .tp-ca-dots i { width: ${px(14)}px; height: ${px(14)}px; border-radius: 50%; background: currentColor; opacity: .4; }
      .tp-ca-reply p { margin: 0; font-weight: 600; font-size: ${px(32)}px; line-height: 1.3; }
      .tp-ca-row { display: flex; align-items: center; gap: ${px(16)}px; margin-top: ${px(16)}px; }
      .tp-ca-box { flex: none; position: relative; width: ${px(44)}px; height: ${px(44)}px; box-sizing: border-box; border-radius: ${px(12)}px; border: ${px(3)}px solid currentColor; }
      .tp-ca-box i { position: absolute; inset: ${px(-3)}px; border-radius: inherit; background: currentColor; opacity: 0; }
      .tp-ca-box svg { position: absolute; inset: ${px(5)}px; }
      .tp-ca-box path { fill: none; stroke: var(--ac); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; }
      .tp-ca-row small { display: block; font-family: var(--f-mono); font-size: ${px(19)}px; letter-spacing: .06em; text-transform: uppercase; color: ${ATLAS.coralDeep}; }
      .tp-ca-row b { display: block; font-weight: 600; font-size: ${px(29)}px; opacity: .45; }
      .tp-ca-ok { align-self: flex-start; width: 92%; box-sizing: border-box; padding: ${px(26)}px ${px(30)}px; border-radius: ${px(32)}px; background: ${ATLAS.ink}; }
      .tp-ca-ok p { margin: 0; font-weight: 600; font-size: ${px(32)}px; color: #FBF1E8; }
      .tp-ca-btns { display: flex; gap: ${px(16)}px; margin-top: ${px(20)}px; }
      .tp-ca-go { display: grid; border-radius: ${px(22)}px; font-weight: 700; font-size: ${px(30)}px; color: ${ATLAS.ink}; }
      .tp-ca-go span { grid-area: 1 / 1; padding: ${px(14)}px ${px(34)}px; border-radius: inherit; background: var(--ac); white-space: nowrap; }
      .tp-ca-go span:first-child { color: var(--on-ac); }
      .tp-ca-go span + span { background: ${GREEN}; opacity: 0; }
      .tp-ca-edit { padding: ${px(14)}px ${px(34)}px; border-radius: ${px(22)}px; box-shadow: inset 0 0 0 ${px(2)}px rgba(251,241,232,.12); font-weight: 600; font-size: ${px(30)}px; color: rgba(251,241,232,.62); }
      .tp-ca-input { position: absolute; left: ${px(26)}px; right: ${px(26)}px; bottom: ${px(26)}px; display: flex; align-items: center; height: ${px(96)}px; padding: 0 ${px(34)}px; border-radius: ${px(48)}px; background: #F4EFE9; font-size: ${px(32)}px; color: ${ATLAS.ink}; white-space: nowrap; overflow: hidden; }
      .ag:not(.tone-paper) .tp-ca-input { background: #2A221D; color: #FBF1E8; }
      .tp-ca-input em { position: absolute; left: ${px(34)}px; font-style: normal; opacity: .35; }
      .tp-ca-cur { position: absolute; width: ${px(56)}px; height: ${px(56)}px; pointer-events: none; }
      .tp-ca-cur path { fill: ${ATLAS.ink}; stroke: #fff; stroke-width: 1.4; }`,
  html: ({ id, c, esc }) => {
    const hl = String(c.highlight || "").split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
    const list = rows(c);
    return `<div class="tp-ca" id="${id}-wrap">${hl.length ? `<h3 class="mk-h"><span id="${id}-h1">${esc(hl[0])}</span>${hl[1] ? `<span class="ac" id="${id}-h2">${esc(hl[1])}</span>` : ""}</h3>` : ""}<div class="tp-ca-win" id="${id}-win"><div class="tp-ca-head"><span>${ATLAS_MARK()}</span><div><b>Atlas · COO</b><small>● 6 agents online</small></div></div><div class="tp-ca-body"><div class="tp-ca-me" id="${id}-me">${esc(c.text)}</div><div class="tp-ca-it" id="${id}-it"><span class="tp-ca-dots" id="${id}-dots"><i></i><i></i><i></i></span><div class="tp-ca-reply" id="${id}-reply"><p>${esc(c.sub || "On it. Handing this to your team:")}</p>${list.map((r, i) => `<div class="tp-ca-row" id="${id}-r${i}"><span class="tp-ca-box"><i id="${id}-f${i}"></i><svg viewBox="0 0 24 24"><path id="${id}-k${i}" d="M4 12.5l5 5L20 6.5"/></svg></span><div>${r.agent ? `<small>${esc(r.agent)}</small>` : ""}<b id="${id}-j${i}">${esc(r.job)}</b></div></div>`).join("")}</div></div><div class="tp-ca-ok" id="${id}-ok"><p>Ready to publish. Approve?</p><div class="tp-ca-btns"><span class="tp-ca-go" id="${id}-go"><span>Approve</span><span id="${id}-live">Campaign live</span></span><span class="tp-ca-edit">Edit</span></div></div></div><div class="tp-ca-input"><span id="${id}-typed">${chars(c.text, `${id}-c`, esc)}<i class="mk-caret" id="${id}-caret"></i></span><em id="${id}-ph">Message Atlas…</em></div><svg class="tp-ca-cur" id="${id}-cur" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z"/></svg></div></div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-h1", t0, { y: 24, b: 10 });
    blurIn(el + "-h2", t0 + 0.15, { y: 24, b: 10 });
    blurIn(el + "-win", t0 + 0.05, { y: 200, b: 8, d: 0.8, s: 1 });
    hide(el + "-ph");
    typeOn(el + "-c", d.chars, t0 + d.type, d.typeLen);
    blink(el + "-caret", t0 + d.type, t0 + d.sent);
    tl.set(el + "-typed", { autoAlpha: 0 }, t0 + d.sent);
    tl.set(el + "-ph", { autoAlpha: 1 }, t0 + d.sent);
    hide(el + "-me");
    tl.fromTo(el + "-me", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, t0 + d.sent);
    hide(el + "-it"); hide(el + "-reply");
    tl.set(el + "-it", { autoAlpha: 1 }, t0 + d.dots);
    tl.fromTo(el + "-dots i", { opacity: 0.25 }, { opacity: 0.85, duration: 0.17, yoyo: true, repeat: Math.max(1, Math.floor((d.reply - d.dots) / 0.17)), stagger: 0.08, ease: "sine.inOut", immediateRender: false }, t0 + d.dots);
    tl.set(el + "-dots", { autoAlpha: 0 }, t0 + d.reply);
    tl.fromTo(el + "-reply", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "expo.out", immediateRender: false }, t0 + d.reply);
    for (var i = 0; i < d.n; i++) {
      blurIn(el + "-r" + i, t0 + d.reply + 0.2 + i * 0.12, { x: 30, y: 0, s: 1, b: 4, d: 0.35 });
      tl.fromTo(el + "-f" + i, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, t0 + d.rows[i]);
      tl.fromTo(el + "-k" + i, { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.4, ease: "expo.out", immediateRender: false }, t0 + d.rows[i]);
      tl.fromTo(el + "-j" + i, { opacity: 0.45 }, { opacity: 1, duration: 0.3, immediateRender: false }, t0 + d.rows[i]);
    }
    blurIn(el + "-ok", t0 + d.approve, { y: 50, b: 6, d: 0.5, s: 1 });
    var go = document.querySelector(el + "-go"), wrap = document.querySelector(el + "-wrap");
    if (go && wrap) {
      var gx = 0, gy = 0, p = go; while (p && p !== wrap) { gx += p.offsetLeft; gy += p.offsetTop; p = p.offsetParent; }
      gx += go.offsetWidth * 0.55; gy += go.offsetHeight * 0.5;
      hide(el + "-cur");
      tl.fromTo(el + "-cur", { autoAlpha: 0, left: gx + 340, top: gy + 320 }, { autoAlpha: 1, left: gx, top: gy, duration: 0.7, ease: "expo.out", immediateRender: false }, t0 + d.tap - 0.75);
      tl.fromTo(el + "-cur", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, t0 + d.tap + 0.5);
    }
    tl.fromTo(el + "-go", { scale: 1 }, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, t0 + d.tap);
    tl.fromTo(el + "-live", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, t0 + d.tap + 0.1);`,
};
