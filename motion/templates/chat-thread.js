// Chat thread (atlas-motion-kit.md #12; the Remotion "Setter" scene): a lead texting after hours and the AI setter
// answering. A mono header and an optional two-tone headline, the patient's light bubbles on the left, Atlas's ink
// bubbles on the right under an "ATLAS · SETTER" tag (each starts as "···"), then a coral booking toast with a date
// chip and a check that draws itself. Best on the paper ground.
import { ATLAS } from "./_parts.js";

/** "them: …" / "us: …" → { us, text }. With no speakers marked at all, they alternate patient, AI, patient… */
const msgs = (c) => {
  const raw = (c.items || []).map((x) => String(x || "").trim()).filter(Boolean).slice(0, 5);
  const tagged = raw.map((x) => x.match(/^(them|patient|lead|us|ai|atlas|bot)\s*:\s*(.+)$/i));
  const any = tagged.some(Boolean);
  return raw.map((x, i) => (tagged[i] ? { us: /^(us|ai|atlas|bot)$/i.test(tagged[i][1]), text: tagged[i][2].trim() } : { us: !any && i % 2 === 1, text: x })).filter((m) => m.text);
};
const r3 = (n) => Math.round(n * 1000) / 1000;
/** "New consult · 2:30 PM | Added to your calendar + CRM | THU 12" → toast parts. */
const toast = (c) => {
  const [title = "", sub = "", date = ""] = String(c.text || "").split("|").map((s) => s.trim());
  const [dow = "THU", day = "12"] = date.split(/\s+/);
  return title ? { title, sub: sub || "Added to your calendar + CRM", dow, day } : null;
};
const lines = (c) => String(c.highlight || "").split(/\s+\/\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 2);

/** When each bubble lands (the AI's replies show "···" first), and the toast. */
export function chatTimes(duration, list, head) {
  const len = Math.max(1.6, Number(duration) || 4);
  const weight = list.reduce((s, m) => s + (m.us ? 1.6 : 1), 0) + 0.9;
  const unit = Math.min(0.8, Math.max(0.3, (len - 0.8 - (head ? 0.3 : 0)) / weight));
  let at = head ? 0.55 : 0.3;
  const times = list.map((m) => {
    const dots = m.us ? at : null;
    if (m.us) at += unit * 0.6;
    const land = at;
    at += unit;
    return { dots: dots == null ? null : r3(dots), land: r3(land) };
  });
  return { times, toast: r3(Math.min(len - 0.7, at + 0.05)) };
}

export default {
  id: "chat-thread",
  name: "Chat thread",
  job: "proof",
  scene: "optional",
  use: 'Leads answered for you, even after hours ("a patient texts at midnight and it books them", "every lead answered, even now", "it replies in seconds"). Looks best full-screen on the paper tone.',
  fields: 'items = 2–5 messages in order, each "them: …" (the patient) or "us: …" (the AI), up to ~90 characters (e.g. "them: Hi, do you help with sciatica? Can\'t sleep.", "us: We do. I have Thursday at 9:00 or 2:30 open for a consult. Want one?"); sub = a mono header (e.g. "11:47 PM · Office closed"); highlight = an optional two-tone headline as "line 1 / line 2" (e.g. "Every lead answered. / Even now."); text = an optional booking toast as "title | line | DAY DATE" (e.g. "New consult · 2:30 PM | Added to your calendar + CRM | THU 12") or empty.',
  position: "top",
  anchor: null,
  minLen: 2.4,
  sfx: (g) => {
    const t = chatTimes(g.duration, msgs(g), lines(g).length);
    return [...t.times.map((x, i) => ["atlas-pop", x.land, msgs(g)[i].us ? 0.45 : 0.6]), ...(toast(g) ? [["atlas-success", t.toast, 0.55]] : [])];
  },
  data: (c) => {
    const list = msgs(c);
    return { n: list.length, ...chatTimes(c.duration, list, lines(c).length) };
  },
  css: ({ px, W, tall }) => `
      .tp-ch { width: ${Math.round(W * (tall ? 0.87 : 0.46))}px; display: flex; flex-direction: column; gap: ${px(22)}px; }
      .tp-ch-head { font-family: var(--f-mono); font-size: ${px(28)}px; letter-spacing: .14em; text-transform: uppercase; color: ${ATLAS.coralDeep}; }
      .ag:not(.tone-paper) .tp-ch-head { color: var(--ac); }
      .tp-ch .mk-h { font-size: ${px(tall ? 82 : 72)}px; margin: ${px(-6)}px 0 ${px(26)}px; }
      .tp-ch-row { display: flex; flex-direction: column; align-items: flex-start; }
      .tp-ch-row.us { align-items: flex-end; }
      .tp-ch-row small { margin: 0 ${px(6)}px ${px(8)}px; font-family: var(--f-mono); font-size: ${px(20)}px; letter-spacing: .1em; text-transform: uppercase; color: ${ATLAS.coralDeep}; }
      .ag:not(.tone-paper) .tp-ch-row small { color: var(--ac); }
      .tp-ch-b { max-width: ${px(760)}px; padding: ${px(24)}px ${px(32)}px; font-weight: 500; font-size: ${px(36)}px; line-height: 1.3; box-shadow: 0 ${px(16)}px ${px(40)}px rgba(23,18,15,.12); }
      .tp-ch-row.them .tp-ch-b { background: ${ATLAS.cream}; color: ${ATLAS.ink}; border-radius: ${px(36)}px ${px(36)}px ${px(36)}px ${px(10)}px; }
      .ag.tone-paper .tp-ch-row.them .tp-ch-b { background: #fff; }
      .tp-ch-row.us .tp-ch-b { position: relative; background: ${ATLAS.ink}; color: ${ATLAS.cream}; border-radius: ${px(36)}px ${px(36)}px ${px(10)}px ${px(36)}px; }
      .ag:not(.tone-paper) .tp-ch-row.us .tp-ch-b { box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 40%, transparent); }
      .tp-ch-dots { position: absolute; right: 0; bottom: 0; padding: ${px(18)}px ${px(30)}px; border-radius: ${px(36)}px ${px(36)}px ${px(10)}px ${px(36)}px; background: ${ATLAS.ink}; color: ${ATLAS.cream}; font-weight: 700; font-size: ${px(36)}px; letter-spacing: .12em; opacity: 0; }
      .tp-ch-toast { display: flex; align-items: center; gap: ${px(24)}px; margin-top: ${px(20)}px; padding: ${px(26)}px ${px(30)}px; border-radius: ${px(36)}px; background: var(--ac); color: var(--on-ac); box-shadow: 0 ${px(30)}px ${px(70)}px color-mix(in srgb, var(--ac) 40%, transparent); }
      .tp-ch-date { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; width: ${px(88)}px; height: ${px(88)}px; border-radius: ${px(22)}px; background: ${ATLAS.ink}; }
      .tp-ch-date i { font-style: normal; font-family: var(--f-mono); font-size: ${px(18)}px; color: var(--ac); }
      .tp-ch-date b { font-weight: 700; font-size: ${px(36)}px; line-height: 1; color: ${ATLAS.cream}; }
      .tp-ch-toast div { flex: 1; min-width: 0; }
      .tp-ch-toast strong { display: block; font-weight: 700; font-size: ${px(36)}px; }
      .tp-ch-toast span { display: block; font-weight: 500; font-size: ${px(26)}px; opacity: .75; }
      .tp-ch-toast svg { flex: none; width: ${px(60)}px; height: ${px(60)}px; }
      .tp-ch-toast path { fill: none; stroke: ${ATLAS.ink}; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; }`,
  html: ({ id, c, esc }) => {
    const list = msgs(c);
    const t = toast(c);
    const hl = lines(c);
    return `<div class="tp-ch" id="${id}-wrap">${c.sub ? `<div class="tp-ch-head" id="${id}-h">${esc(c.sub)}</div>` : ""}${hl.length ? `<h3 class="mk-h"><span id="${id}-h1">${esc(hl[0])}</span>${hl[1] ? `<span class="ac" id="${id}-h2">${esc(hl[1])}</span>` : ""}</h3>` : ""}${list.map((m, i) => `<div class="tp-ch-row ${m.us ? "us" : "them"}">${m.us ? `<small id="${id}-s${i}">Atlas · Setter</small>` : ""}<div style="position:relative"><div class="tp-ch-b" id="${id}-m${i}">${esc(m.text)}</div>${m.us ? `<span class="tp-ch-dots" id="${id}-d${i}">···</span>` : ""}</div></div>`).join("")}${t ? `<div class="tp-ch-toast" id="${id}-toast"><span class="tp-ch-date"><i>${esc(t.dow.toUpperCase())}</i><b>${esc(t.day)}</b></span><div><strong>${esc(t.title)}</strong><span>${esc(t.sub)}</span></div><svg viewBox="0 0 24 24"><path id="${id}-ck" d="M4 12.5l5 5L20 6.5"/></svg></div>` : ""}</div>`;
  },
  script: `
    var d = c.data;
    blurIn(el + "-h", t0, { y: 10, b: 6, d: 0.5 });
    blurIn(el + "-h1", t0 + 0.05, { y: 24, b: 12 });
    blurIn(el + "-h2", t0 + 0.2, { y: 24, b: 12 });
    for (var i = 0; i < d.n; i++) {
      var t = d.times[i];
      hide(el + "-m" + i); hide(el + "-s" + i);
      if (t.dots != null) {
        tl.fromTo(el + "-d" + i, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", immediateRender: false }, t0 + t.dots);
        tl.to(el + "-d" + i, { opacity: 0, duration: 0.1 }, t0 + t.land - 0.04);
        blurIn(el + "-s" + i, t0 + t.land, { y: 6, b: 4, d: 0.3 });
      }
      tl.fromTo(el + "-m" + i, { autoAlpha: 0, y: 30, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "expo.out", immediateRender: false }, t0 + t.land);
    }
    hide(el + "-toast");
    tl.fromTo(el + "-toast", { autoAlpha: 0, y: 120 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out", immediateRender: false }, t0 + d.toast);
    tl.fromTo(el + "-ck", { strokeDashoffset: 24 }, { strokeDashoffset: 0, duration: 0.45, ease: "expo.out", immediateRender: false }, t0 + d.toast + 0.3);`,
};
