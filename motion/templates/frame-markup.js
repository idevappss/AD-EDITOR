// Frame markup (the creator's reference reel, 2026-10-22: references/reels/5-frame-markup, see
// references/reel-study.md). The talking-head teaching format: the speaker stays centred with one-word captions low
// in the middle, and shapes are drawn straight onto the shot to point at what they're saying: a yellow highlighter
// swipes across the eyes or the caption line, a yellow title pill grows at the top, a green box marks the safe zone,
// the frame tints red outside it, a dashed eyeline draws across. Translucent and flat (no glass, no glow), under the
// captions, one mark per beat.
import { REEL_SAFE, CAPTION_LINE } from "../../lib/facezone.js";

const SPOTS = { eyes: 40, eyeline: 40, face: 40, head: 32, caption: CAPTION_LINE, captions: CAPTION_LINE, title: 8, top: 8, mouth: 46, chest: 62 };
/** "highlight: eyes" / "line: 40%" → { kind, label, y (percent of frame height) }. */
const parse = (c) => {
  const raw = (c.items || []).map((x) => String(x ?? "").trim()).filter(Boolean);
  const list = raw.length ? raw : c.text ? [`title: ${c.text}`] : ["highlight: eyes"];
  return list.slice(0, 6).map((x) => {
    const m = x.match(/^(highlight|title|pill|safe|zone|danger|line)\s*:?\s*(.*)$/i);
    const kind = m ? m[1].toLowerCase().replace("pill", "title").replace("zone", "safe") : "title";
    const arg = (m ? m[2] : x).trim();
    const pct = arg.match(/(\d+(?:\.\d+)?)\s*%/);
    const y = pct ? Number(pct[1]) : SPOTS[arg.toLowerCase()] ?? (kind === "highlight" ? SPOTS.eyes : kind === "line" ? SPOTS.eyeline : SPOTS.title);
    return { kind, label: kind === "title" ? arg.replace(/@?\s*\d+(\.\d+)?\s*%/, "").trim() || "Title Hook" : "", y };
  });
};

const r3 = (n) => Math.round(n * 1000) / 1000;
/** Each mark gets its own beat: in at its start, out just before the next one. */
const beats = (c) => {
  const marks = parse(c);
  const len = Math.max(1, Number(c.duration) || 3);
  const slice = len / marks.length;
  return marks.map((m, k) => ({ kind: m.kind, in: r3(k * slice), out: r3(k === marks.length - 1 ? len - 0.3 : (k + 1) * slice - 0.22) }));
};

const SOUND = { highlight: "atlas-marker", title: "atlas-pop", safe: "atlas-whoosh", danger: "atlas-whoosh", line: "atlas-marker" };

export default {
  id: "frame-markup",
  name: "Frame markup",
  job: "benefit",
  overlay: true,
  use: 'Teaching beats on a talking head: draws on the shot itself to point at what the speaker is saying ("look at my eyes", "this is where your caption goes", "keep everything inside this box", "never put text out here"). Translucent marks over the speaker, under the captions; one or two per video, on the exact words.',
  fields: 'items = 1–4 marks played one after another, each "kind: where": "highlight: eyes" (a yellow highlighter swipe; eyes, mouth, caption or a height like 40%), "title: Title Hook" (a yellow pill growing at the top with that text), "safe" (a green box over the safe zone), "danger" (red outside the safe zone), "line: eyes" (a dashed eyeline drawn across). text = a title pill when there are no items.',
  position: "center",
  anchor: null,
  minLen: 1,
  sfx: (g) => beats(g).map((b) => [SOUND[b.kind] || "atlas-pop", r3(b.in + 0.02), b.kind === "safe" || b.kind === "danger" ? 0.3 : 0.25]),
  data: (c) => ({ beats: beats(c) }),
  css: ({ px, W, H }) => `
      .ag.ag-look-frame-markup { z-index: 5; }
      .tp-fm { position: relative; width: ${W}px; height: ${H}px; }
      .tp-fm > * { position: absolute; visibility: hidden; opacity: 0; }
      .tp-fm-hl { left: 20%; width: 60%; height: ${px(150)}px; margin-top: ${px(-75)}px; border-radius: 999px; background: rgba(240,200,40,.55); transform-origin: 0 50%; mix-blend-mode: hard-light; }
      .tp-fm-tt { left: 0; right: 0; display: flex; justify-content: center; height: ${px(140)}px; margin-top: ${px(-70)}px; }
      .tp-fm-tt b { display: flex; align-items: center; justify-content: center; height: 100%; padding: 0 ${px(60)}px; border-radius: 999px; box-sizing: border-box; background: rgba(238,196,52,.92); white-space: nowrap; overflow: hidden; }
      .tp-fm-tt span { font-family: var(--f-display); font-weight: 800; font-size: ${px(80)}px; letter-spacing: -0.02em; color: #fff; text-shadow: 0 ${px(2)}px ${px(10)}px rgba(120,80,0,.35); }
      .tp-fm-safe { left: ${REEL_SAFE.side}%; right: ${REEL_SAFE.side}%; top: ${REEL_SAFE.top}%; bottom: ${100 - REEL_SAFE.bottom}%; border-radius: ${px(30)}px; background: rgba(40,190,60,.62); mix-blend-mode: hard-light; }
      .tp-fm-danger { inset: 0; }
      .tp-fm-danger svg { width: 100%; height: 100%; }
      .tp-fm-danger path { fill: rgba(220,40,80,.5); fill-rule: evenodd; }
      .tp-fm-line { left: 6%; right: 6%; height: ${px(5)}px; margin-top: ${px(-2.5)}px; background: repeating-linear-gradient(90deg, #fff 0 ${px(16)}px, transparent ${px(16)}px ${px(28)}px); filter: drop-shadow(0 0 ${px(5)}px rgba(0,0,0,.4)); }`,
  html: ({ id, c, esc, W, H, px }) => {
    const marks = parse(c);
    const s = REEL_SAFE, r = px(30);
    const x1 = (W * s.side) / 100, x2 = W - x1, y1 = (H * s.top) / 100, y2 = (H * s.bottom) / 100;
    const hole = `M0 0H${W}V${H}H0Z M${x1 + r} ${y1}H${x2 - r}A${r} ${r} 0 0 1 ${x2} ${y1 + r}V${y2 - r}A${r} ${r} 0 0 1 ${x2 - r} ${y2}H${x1 + r}A${r} ${r} 0 0 1 ${x1} ${y2 - r}V${y1 + r}A${r} ${r} 0 0 1 ${x1 + r} ${y1}Z`;
    return `<div class="tp-fm" id="${id}-wrap">${marks.map((m, k) => {
      const mid = `${id}-m${k}`;
      if (m.kind === "highlight") return `<i class="tp-fm-hl" id="${mid}" style="top:${m.y}%"></i>`;
      if (m.kind === "title") return `<div class="tp-fm-tt" id="${mid}" style="top:${m.y}%"><b id="${mid}-p"><span id="${mid}-t">${esc(m.label)}</span></b></div>`;
      if (m.kind === "safe") return `<i class="tp-fm-safe" id="${mid}"></i>`;
      if (m.kind === "danger") return `<div class="tp-fm-danger" id="${mid}"><svg viewBox="0 0 ${W} ${H}"><path d="${hole}"/></svg></div>`;
      return `<i class="tp-fm-line" id="${mid}" style="top:${m.y}%"></i>`;
    }).join("")}</div>`;
  },
  script: `
    var B = c.data.beats;
    for (var k = 0; k < B.length; k++) {
      var m = el + "-m" + k, a = t0 + B[k].in, z = t0 + B[k].out;
      hide(m);
      if (B[k].kind === "highlight") {
        // A marker swipe: the pill draws from the left, holds, then wipes off to the right.
        tl.fromTo(m, { autoAlpha: 1, scaleX: 0, transformOrigin: "0% 50%" }, { autoAlpha: 1, scaleX: 1, duration: 0.32, ease: "power2.out", immediateRender: false }, a);
        tl.fromTo(m, { scaleX: 1, transformOrigin: "100% 50%" }, { scaleX: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, z);
      } else if (B[k].kind === "title") {
        // The pill grows from a dot to full width, then the words fade up inside it.
        var pill = document.querySelector(m + "-p"), w = pill ? pill.offsetWidth : 400;
        tl.set(m, { autoAlpha: 1 }, a);
        tl.fromTo(m + "-p", { width: w * 0.14, scale: 0.6 }, { width: w, scale: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, a);
        tl.fromTo(m + "-t", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, a + 0.18);
        tl.fromTo(m, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.9, duration: 0.22, ease: "power2.in", immediateRender: false }, z);
      } else if (B[k].kind === "safe") {
        // The box opens out from the middle of the frame.
        tl.fromTo(m, { autoAlpha: 0, scale: 0.35 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out", immediateRender: false }, a);
        tl.fromTo(m, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, z);
      } else if (B[k].kind === "danger") {
        tl.fromTo(m, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, a);
        tl.fromTo(m, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, z);
      } else {
        tl.set(m, { autoAlpha: 1 }, a);
        tl.fromTo(m, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.out", immediateRender: false }, a);
        tl.fromTo(m, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, z);
      }
    }`,
};
