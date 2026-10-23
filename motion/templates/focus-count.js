// Focus count (the creator's example reels, 2026-10-22: @sooweigoh "stop filling up your to-do list", 24.3–29.6 s; see
// references/sound-study.md). On black: a big number beside a dark glass "Today" list. Tasks pile in and the number
// rolls up with them (vertical motion blur, the old digit ghosting above), it holds on the big number, then tasks get
// struck through and drop out while it rolls back down. On the last few it turns gold: the number glows, the kept tasks
// light gold, a sheen sweeps across the card. "Do less" made visible. Seek-safe: the count is drawn from the clock.

const r3 = (n) => Math.round(n * 1000) / 1000;
const DEFAULT = ["Reply to Slack", "Clear the inbox", "Tidy the Notion board", "*Run sales calls*", "Rename Drive folders", "Tweak website fonts", "Watch a course module", "Update CRM tags", "Reshuffle the calendar", "Research new tools", "*Launch the new offer*", "Redo old thumbnails", "Check analytics", "Team status update", "Answer DMs", "*Film this week's content*"];
const parse = (c) => {
  const raw = (c.items || []).map((x) => String(x ?? "").trim()).filter(Boolean);
  const list = (raw.length >= 3 ? raw : DEFAULT).slice(0, 16).map((x) => ({ text: x.replace(/\*/g, "").trim(), keep: /^\*.*\*$/.test(x) }));
  if (!list.some((x) => x.keep)) list.slice(0, 3).forEach((x) => { x.keep = true; });
  return list;
};
/** The beats, in seconds from the start: tasks in, hold, cut down, gold. */
const plan = (c) => {
  const list = parse(c);
  const len = Math.max(4.2, Number(c.duration) || 5.5);
  const n = list.length, k = list.filter((x) => x.keep).length;
  const build = Math.min(1.6, Math.max(0.8, len * 0.24)), hold = Math.min(0.8, len * 0.12), cut = Math.min(1.7, Math.max(0.9, len * 0.28));
  const inAt = list.map((_, i) => r3(0.25 + (i / Math.max(1, n - 1)) * build));
  const goneOrder = list.map((x, i) => (x.keep ? -1 : i)).filter((i) => i >= 0);
  const outAt = {};
  goneOrder.forEach((i, j) => { outAt[i] = r3(0.25 + build + hold + (j / Math.max(1, goneOrder.length - 1)) * cut); });
  const gold = r3(0.25 + build + hold + cut + 0.25);
  return { n, k, inAt, outAt: list.map((_, i) => outAt[i] ?? null), keep: list.map((x) => x.keep), gold };
};

export default {
  id: "focus-count",
  name: "Focus count",
  job: "data",
  scene: "always",
  use: 'Doing less, focus, cutting the noise: a to-do list piles up and the count climbs, then it gets cut back to the few that matter and those turn gold ("stop filling your to-do list", "20 tasks a day → 3", "we dropped everything except…"). Always full-screen on black, 4.5–6 s.',
  fields: 'items = 8–16 short tasks in order, with the 2–4 that survive wrapped in *stars* (e.g. "Reply to Slack", "*Run sales calls*", "Clear the inbox", "*Launch the new offer*"); text = the small label under the number (e.g. "tasks a day"); sub = the card header (default "Today").',
  position: "center",
  anchor: null,
  minLen: 4.2,
  // As in the reference edit: one ticker under each run of the count (not a click per task), a ding on the gold.
  sfx: (g) => {
    const p = plan(g), outs = p.outAt.filter((t) => t != null);
    return [["ticker", p.inAt[0], 0.3], ...(outs.length ? [["ticker", outs[0], 0.26]] : []), ["atlas-ding", p.gold, 0.4]];
  },
  data: (c) => plan(c),
  css: ({ px, W, H, tall }) => `
      .tp-fc { position: relative; width: ${W}px; height: ${H}px; display: flex; align-items: center; justify-content: center; gap: ${px(tall ? 56 : 120)}px; background: #050505; font-family: "Inter", system-ui, sans-serif; --gold: #F2C14E; }
      .tp-fc::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse 45% 35% at 50% 50%, rgba(255,255,255,.035), transparent 70%); }
      .tp-fc-num { position: relative; flex: none; width: ${px(tall ? 260 : 300)}px; text-align: center; }
      .tp-fc-num b, .tp-fc-num i { display: block; font-family: var(--f-display); font-weight: 800; font-style: normal; font-size: ${px(tall ? 230 : 260)}px; line-height: 1; letter-spacing: -0.05em; color: #F1EEE8; font-variant-numeric: tabular-nums; }
      .tp-fc-num i { position: absolute; left: 0; right: 0; top: 0; opacity: 0; }
      .tp-fc-num span { display: block; margin-top: ${px(6)}px; font-weight: 500; font-size: ${px(26)}px; color: rgba(241,238,232,.42); }
      .tp-fc-num b.gold { background: linear-gradient(180deg, #FFE39A, #F2C14E 55%, #D9962B); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 ${px(28)}px rgba(242,193,78,.55)); }
      .tp-fc-card { position: relative; width: ${px(tall ? 600 : 640)}px; box-sizing: border-box; padding: ${px(26)}px ${px(26)}px ${px(18)}px; border-radius: ${px(26)}px; overflow: hidden;
        background: linear-gradient(170deg, rgba(255,255,255,.07), rgba(255,255,255,.025)), #111; box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.08), 0 ${px(40)}px ${px(90)}px rgba(0,0,0,.6); }
      .tp-fc-card.gold { box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(242,193,78,.35), 0 0 ${px(80)}px rgba(242,193,78,.12), 0 ${px(40)}px ${px(90)}px rgba(0,0,0,.6); }
      .tp-fc-card h4 { margin: 0 0 ${px(12)}px; font-weight: 600; font-size: ${px(22)}px; letter-spacing: .12em; text-transform: uppercase; color: rgba(241,238,232,.45); }
      .tp-fc-row { position: relative; height: 0; overflow: hidden; opacity: 0; }
      .tp-fc-row > div { display: flex; align-items: center; gap: ${px(16)}px; height: ${px(52)}px; padding: 0 ${px(12)}px; border-radius: ${px(12)}px; border-top: ${Math.max(1, px(1.5))}px solid rgba(255,255,255,.05); }
      .tp-fc-row u { flex: none; width: ${px(22)}px; height: ${px(22)}px; border-radius: 50%; box-shadow: inset 0 0 0 ${px(2.5)}px rgba(241,238,232,.32); text-decoration: none; display: grid; place-items: center; }
      .tp-fc-row u::after { content: ""; width: 44%; height: 44%; border-radius: 50%; background: var(--gold); opacity: 0; transition: none; }
      .tp-fc-row span { position: relative; font-weight: 500; font-size: ${px(27)}px; color: rgba(241,238,232,.86); white-space: nowrap; }
      .tp-fc-row span::after { content: ""; position: absolute; left: 0; top: 52%; height: ${Math.max(1, px(2.5))}px; width: var(--strike, 0%); background: rgba(241,238,232,.75); }
      .tp-fc-row.gold > div { background: linear-gradient(90deg, rgba(242,193,78,.16), rgba(242,193,78,.04)); border-top-color: transparent; }
      .tp-fc-row.gold u { box-shadow: inset 0 0 0 ${px(2.5)}px var(--gold); }
      .tp-fc-row.gold u::after { opacity: 1; }
      .tp-fc-row.gold span { color: #FBF3E0; }
      .tp-fc-sheen { position: absolute; top: -20%; bottom: -20%; left: -60%; width: 40%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.16), transparent); transform: skewX(-18deg); opacity: 0; }`,
  html: ({ id, c, esc, px }) => {
    const list = parse(c);
    return `<div class="tp-fc" id="${id}-wrap" data-row="${px(52)}"><svg width="0" height="0" style="position:absolute"><filter id="${id}-vb" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur id="${id}-vbs" stdDeviation="0 0"/></filter></svg><div class="tp-fc-num"><i id="${id}-ghost">0</i><b id="${id}-num" style="filter:url(#${id}-vb)">0</b><span>${esc(c.text || "tasks a day")}</span></div><div class="tp-fc-card" id="${id}-card"><h4>${esc(c.sub || "Today")}</h4>${list.map((x, i) => `<div class="tp-fc-row" id="${id}-r${i}"><div><u></u><span id="${id}-s${i}">${esc(x.text)}</span></div></div>`).join("")}<i class="tp-fc-sheen" id="${id}-sheen"></i></div></div>`;
  },
  script: `
    var P = c.data, wrap = document.querySelector(el + "-wrap");
    if (!wrap) return;
    var RH = Number(wrap.getAttribute("data-row")) || 52;
    var num = document.querySelector(el + "-num"), ghost = document.querySelector(el + "-ghost"), blur = document.querySelector(el + "-vbs");
    tl.fromTo(el + "-wrap", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, t0);
    // Rows pile in (height opens, a soft drop), then the cut ones get struck through and fold away.
    for (var i = 0; i < P.n; i++) {
      var r = el + "-r" + i, a = t0 + P.inAt[i];
      tl.fromTo(r, { height: 0, opacity: 0, y: -10 }, { height: RH, opacity: 1, y: 0, duration: 0.28, ease: "power2.out", immediateRender: false }, a);
      if (P.outAt[i] != null) {
        var o = t0 + P.outAt[i];
        tl.fromTo(el + "-s" + i, { "--strike": "0%" }, { "--strike": "100%", duration: 0.18, ease: "power2.out", immediateRender: false }, o);
        tl.fromTo(r, { height: RH, opacity: 1 }, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, o + 0.2);
      }
    }
    // The count: how many rows are showing at time t, with a vertical blur and the last number ghosting above
    // while it's changing fast.
    var clock = { t: 0 };
    function count(t) {
      var v = 0;
      for (var j = 0; j < P.n; j++) if (t >= P.inAt[j] && !(P.outAt[j] != null && t >= P.outAt[j] + 0.2)) v++;
      return v;
    }
    var card = document.querySelector(el + "-card"), rows = [], wasGold = null;
    for (var q = 0; q < P.n; q++) rows.push(document.querySelector(el + "-r" + q));
    function draw() {
      var t = clock.t, v = count(t), before = count(t - 0.12);
      // Gold from the gold beat on: the number, the card's rim and the kept rows.
      var gold = t >= P.gold;
      if (gold !== wasGold) {
        num.classList.toggle("gold", gold); card.classList.toggle("gold", gold);
        rows.forEach(function (row, k) { row.classList.toggle("gold", gold && P.keep[k]); });
        wasGold = gold;
      }
      num.textContent = String(v);
      var moving = v !== before;
      ghost.textContent = String(before);
      ghost.style.opacity = moving ? 0.25 : 0;
      ghost.style.transform = "translateY(" + (v > before ? -0.22 : 0.22) + "em)";
      blur.setAttribute("stdDeviation", moving ? "0 5" : "0 0");
    }
    draw();
    tl.fromTo(clock, { t: 0 }, { t: len, duration: len, ease: "none", immediateRender: false, onUpdate: draw }, t0);
    // The gold beat: a small lift on the number and a sheen across the card.
    var g = t0 + P.gold;
    tl.fromTo(el + "-num", { scale: 1 }, { scale: 1.04, duration: 0.5, ease: "power2.out", immediateRender: false }, g);
    tl.fromTo(el + "-sheen", { left: "-60%", opacity: 1 }, { left: "130%", opacity: 1, duration: 0.9, ease: "power2.inOut", immediateRender: false }, g + 0.15);`,
};
