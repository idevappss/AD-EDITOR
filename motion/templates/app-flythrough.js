// App flythrough (the creator's reference reels, 2026-10-22: references/reels/3-laptop-dive-journal and
// 4-laptop-dive-habits, see references/reel-study.md). The "POV: I turned it into an app" format: the shot dives into
// a laptop screen and we're flying low over a dark app, the screen tilted away like a laptop seen from the side. The
// camera glides from panel to panel and each one fills in as we reach it: rings count up, a habit grid ticks across,
// table rows drop in with Win/Loss pills, bars grow, an area chart draws itself. Soft depth of field at the edges.
// Best entered with the "dive" transition.

const ACCENTS = { mint: "#2EE6B8", teal: "#2EE6B8", blue: "#2F7BFF", green: "#3DDC84", purple: "#8B5CF6", pink: "#FF5FA2", gold: "#F5C542" };
const KINDS = ["rings", "habits", "rows", "bars", "chart"];
const DEFAULT = ["rings: 77% Win rate; $164 Profit; 14% Loss rate", "habits: Wake up 5am; Meditation; Gym; Read 10 pages; Cold shower", "chart: 75% | 12 20 14 28 22 34 30 41"];

const parse = (c) => {
  const raw = (c.items || []).map((x) => String(x ?? "").trim()).filter((x) => KINDS.some((k) => x.toLowerCase().startsWith(`${k}:`)));
  return (raw.length ? raw : DEFAULT).slice(0, 4).map((x) => {
    const kind = x.slice(0, x.indexOf(":")).toLowerCase();
    const body = x.slice(x.indexOf(":") + 1).trim();
    const list = body.split(";").map((s) => s.trim()).filter(Boolean);
    if (kind === "rings") return { kind, rings: list.slice(0, 3).map((s) => { const m = s.match(/^(\S+)\s*(.*)$/); return { value: m ? m[1] : s, label: m ? m[2] : "" }; }) };
    if (kind === "habits") return { kind, habits: list.slice(0, 6) };
    if (kind === "rows") return { kind, rows: list.slice(0, 6).map((s) => s.split("|").map((p) => p.trim())) };
    if (kind === "bars") return { kind, bars: list.slice(0, 5).map((s) => { const m = s.match(/^(.*?)\s*(-?[\d.,]+)\s*$/); return { label: m ? m[1] : s, value: m ? Number(m[2].replace(/,/g, "")) : 1 }; }) };
    const [head, nums] = body.includes("|") ? body.split("|").map((s) => s.trim()) : ["", body];
    const values = (nums.match(/-?\d+(\.\d+)?/g) || []).map(Number).slice(0, 14);
    return { kind: "chart", head, values: values.length >= 2 ? values : [12, 20, 14, 28, 22, 34, 30, 41] };
  });
};

const r3 = (n) => Math.round(n * 1000) / 1000;
/** When the camera reaches each panel, in seconds from the graphic's start. */
const plan = (c) => {
  const panels = parse(c);
  const len = Math.max(2.4, Number(c.duration) || 5);
  const seg = (len - 0.3) / panels.length;
  return { n: panels.length, at: panels.map((_, k) => r3(0.1 + k * seg)), seg: r3(seg), kinds: panels.map((p) => p.kind), counts: panels.map((p) => (p.rings || p.habits || p.rows || p.bars || p.values || []).length) };
};

// Smooth line through points (Catmull-Rom → cubic Bézier).
const smooth = (pts) => pts.map((p, i) => {
  if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p;
  const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6], c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
  return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
}).join(" ");

export default {
  id: "app-flythrough",
  name: "App flythrough",
  job: "product",
  scene: "always",
  use: 'The product as a slick dark app we fly over while it fills in with the customer\'s results ("I turned my whole business into one dashboard", "every number in one place", "POV: your clinic on autopilot"). Always full-screen, 3–6 s; enter it with the "dive" transition, ideally right after a shot of a laptop or phone being opened.',
  fields: 'items = 2–4 panels in the order the camera visits them, each "kind: content": "rings: 77% Win rate; $164 Profit; 14% Loss rate" (up to 3), "habits: Wake up 5am; Gym; Read 10 pages" (rows of a tick grid), "rows: Jane D. | Booked | Thu 2:30; Mark P. | Booked | Fri 9:00; Ana R. | No-show | Mon" (a table, 2nd column is the status pill), "bars: Jan 12; Feb 18; Mar 31" (bar chart), "chart: 94% | 31 40 38 55 62 70 94" (big number | values for an area chart); text = the app name in the top bar (e.g. "Trading Journal"); highlight = the screen colour: "mint", "blue", "green", "purple", "pink", "gold" or a hex (default: the brand accent).',
  position: "center",
  anchor: null,
  minLen: 3,
  sfx: (g) => {
    const p = plan(g);
    return [["atlas-whoosh", 0.02, 0.4], ...p.at.slice(1).map((t) => ["atlas-whoosh", r3(t), 0.22]), ...p.at.map((t, k) => (p.kinds[k] === "rows" || p.kinds[k] === "habits" ? ["atlas-typing", r3(t + 0.3), 0.18] : ["atlas-pop", r3(t + 0.3), 0.2]))];
  },
  data: (c) => plan(c),
  css: ({ px, W, H }) => `
      .tp-af { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #040506; font-family: "Inter", system-ui, sans-serif; --sc: var(--ac); --red: #FF4D5E; --gold: #F5C542; }
      .tp-af-stage { position: absolute; inset: 0; perspective: ${px(1300)}px; perspective-origin: 30% 45%; }
      .tp-af-tilt { position: absolute; left: 50%; top: 46%; width: 0; height: 0; transform-style: preserve-3d; will-change: transform; }
      .tp-af-cam { position: absolute; left: 0; top: 0; width: 0; height: 0; will-change: transform; }
      .tp-af-win { position: absolute; left: 0; top: 0; width: ${px(1400)}px; box-sizing: border-box; padding: ${px(40)}px ${px(48)}px ${px(80)}px; border-radius: ${px(36)}px;
        background: linear-gradient(170deg, #101317, #0A0C0F 60%); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.06), 0 0 ${px(160)}px color-mix(in srgb, var(--sc) 10%, transparent); }
      .tp-af-bar { display: flex; align-items: center; gap: ${px(22)}px; padding-bottom: ${px(30)}px; margin-bottom: ${px(14)}px; border-bottom: ${Math.max(1, px(2))}px solid rgba(255,255,255,.06); }
      .tp-af-bar b { font-family: var(--f-mono); font-weight: 500; font-size: ${px(34)}px; letter-spacing: .02em; color: #EDEFF2; }
      .tp-af-bar span { font-family: var(--f-mono); font-size: ${px(24)}px; color: rgba(237,239,242,.4); padding: ${px(8)}px ${px(18)}px; border-radius: ${px(12)}px; }
      .tp-af-bar span.on { color: #EDEFF2; background: rgba(255,255,255,.07); }
      .tp-af-bar i { margin-left: auto; padding: ${px(14)}px ${px(30)}px; border-radius: 999px; background: var(--sc); color: #06110E; font-style: normal; font-weight: 800; font-size: ${px(26)}px; box-shadow: 0 0 ${px(40)}px color-mix(in srgb, var(--sc) 50%, transparent); }
      .tp-af-pn { position: relative; padding: ${px(36)}px 0 ${px(30)}px; border-bottom: ${Math.max(1, px(2))}px solid rgba(255,255,255,.05); }
      .tp-af-h { display: flex; align-items: center; gap: ${px(14)}px; margin-bottom: ${px(30)}px; font-family: var(--f-mono); font-weight: 500; font-size: ${px(24)}px; letter-spacing: .04em; color: rgba(237,239,242,.75); }
      .tp-af-h::before { content: ""; width: ${px(18)}px; height: ${px(18)}px; border-radius: 50%; box-shadow: inset 0 0 0 ${px(3)}px rgba(237,239,242,.6); }
      .tp-af-h u { margin-left: auto; padding: ${px(6)}px ${px(16)}px; border-radius: ${px(10)}px; background: var(--sc); color: #06110E; text-decoration: none; font-size: ${px(20)}px; }
      .tp-af-rings { display: flex; justify-content: space-around; align-items: center; }
      .tp-af-ring { position: relative; display: grid; place-items: center; width: ${px(300)}px; height: ${px(300)}px; }
      .tp-af-ring + .tp-af-ring { width: ${px(230)}px; height: ${px(230)}px; }
      .tp-af-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
      .tp-af-ring .trk { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 7; }
      .tp-af-ring .val { fill: none; stroke: var(--rc); stroke-width: 7; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; filter: drop-shadow(0 0 ${px(8)}px var(--rc)); }
      .tp-af-ring b { position: relative; font-weight: 800; font-style: italic; font-size: ${px(66)}px; letter-spacing: -0.03em; color: #F4F5F7; font-variant-numeric: tabular-nums; }
      .tp-af-ring + .tp-af-ring b { font-size: ${px(46)}px; }
      .tp-af-ring span { position: absolute; bottom: ${px(-46)}px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-family: var(--f-mono); font-size: ${px(20)}px; letter-spacing: .08em; color: rgba(237,239,242,.5); }
      .tp-af-hab { display: grid; grid-template-columns: ${px(250)}px 1fr ${px(170)}px; align-items: center; row-gap: ${px(16)}px; }
      .tp-af-hab > span { display: flex; align-items: center; gap: ${px(14)}px; font-family: var(--f-mono); font-weight: 500; font-size: ${px(22)}px; letter-spacing: .04em; text-transform: uppercase; color: #E6E9EC; }
      .tp-af-hab > span i { width: ${px(12)}px; height: ${px(12)}px; border-radius: 50%; background: var(--dc); box-shadow: 0 0 ${px(10)}px var(--dc); }
      .tp-af-dots { display: flex; gap: ${px(12)}px; }
      .tp-af-d { position: relative; width: ${px(48)}px; height: ${px(48)}px; border-radius: 50%; box-shadow: inset 0 0 0 ${px(3)}px rgba(255,255,255,.1); }
      .tp-af-d i { position: absolute; inset: 0; border-radius: 50%; background: var(--sc); box-shadow: 0 0 ${px(16)}px color-mix(in srgb, var(--sc) 70%, transparent); opacity: 0; }
      .tp-af-d i::after { content: ""; position: absolute; left: 32%; top: 22%; width: 26%; height: 44%; border: solid #05201A; border-width: 0 ${px(4)}px ${px(4)}px 0; transform: rotate(40deg); }
      .tp-af-hab > b { justify-self: end; font-weight: 800; font-style: italic; font-size: ${px(30)}px; color: #F4F5F7; font-variant-numeric: tabular-nums; }
      .tp-af-hab > b u { margin-left: ${px(10)}px; color: var(--gold); text-decoration: none; font-style: normal; font-size: ${px(24)}px; }
      .tp-af-tbl { display: grid; grid-template-columns: 1.4fr 1fr 1fr; row-gap: ${px(6)}px; font-family: var(--f-mono); font-size: ${px(26)}px; }
      .tp-af-tbl > div { display: contents; }
      .tp-af-tbl > div > span { padding: ${px(18)}px ${px(10)}px; border-bottom: ${Math.max(1, px(2))}px solid rgba(255,255,255,.05); color: #E6E9EC; }
      .tp-af-tbl > div.th > span { color: rgba(237,239,242,.4); font-size: ${px(21)}px; letter-spacing: .08em; text-transform: uppercase; }
      .tp-af-pill { display: inline-block; padding: ${px(4)}px ${px(14)}px; border-radius: ${px(8)}px; font-weight: 700; font-size: ${px(22)}px; text-transform: uppercase; background: color-mix(in srgb, var(--pc) 22%, transparent); color: var(--pc); }
      .tp-af-bars { display: flex; align-items: flex-end; gap: ${px(70)}px; height: ${px(380)}px; padding: 0 ${px(60)}px; border-bottom: ${Math.max(1, px(2))}px solid rgba(255,255,255,.08); }
      .tp-af-bars > div { position: relative; flex: 1; height: 100%; display: flex; align-items: flex-end; justify-content: center; }
      .tp-af-bars > div > i { display: block; width: ${px(30)}px; height: var(--h); border-radius: ${px(15)}px; background: var(--bc); box-shadow: 0 0 ${px(20)}px color-mix(in srgb, var(--bc) 55%, transparent); transform-origin: 50% 100%; transform: scaleY(0); }
      .tp-af-bars > div > b { position: absolute; bottom: calc(var(--h) + ${px(14)}px); font-family: var(--f-mono); font-size: ${px(22)}px; color: rgba(237,239,242,.7); opacity: 0; }
      .tp-af-bars > div > span { position: absolute; bottom: ${px(-44)}px; white-space: nowrap; font-family: var(--f-mono); font-size: ${px(20)}px; color: rgba(237,239,242,.45); }
      .tp-af-ch { position: relative; height: ${px(400)}px; }
      .tp-af-ch > b { position: absolute; left: 0; top: ${px(-10)}px; font-weight: 800; font-style: italic; font-size: ${px(84)}px; letter-spacing: -0.03em; color: #F4F5F7; font-variant-numeric: tabular-nums; z-index: 1; }
      .tp-af-ch svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .tp-af-ch .ln { fill: none; stroke: var(--sc); stroke-width: ${px(6)}; stroke-linecap: round; stroke-dasharray: 100; stroke-dashoffset: 100; filter: drop-shadow(0 0 ${px(10)}px var(--sc)); }
      .tp-af-ch .ar { opacity: 0; }
      .tp-af-ch .gl { stroke: rgba(255,255,255,.05); stroke-width: ${Math.max(1, px(2))}; }
      .tp-af-glare { position: absolute; inset: -20%; z-index: 2; pointer-events: none; background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.05) 45%, transparent 55%); will-change: transform; }
      .tp-af-dof { position: absolute; inset: 0; z-index: 2; pointer-events: none; backdrop-filter: blur(${px(9)}px); -webkit-backdrop-filter: blur(${px(9)}px);
        -webkit-mask-image: radial-gradient(ellipse 58% 42% at 48% 46%, transparent 50%, #000 100%); mask-image: radial-gradient(ellipse 58% 42% at 48% 46%, transparent 50%, #000 100%); }
      .tp-af-vig { position: absolute; inset: 0; z-index: 2; pointer-events: none; background: radial-gradient(ellipse 70% 60% at 48% 46%, transparent 45%, rgba(0,0,0,.7) 100%); }`,
  html: ({ id, c, esc, px }) => {
    const panels = parse(c);
    const hl = String(c.highlight || "").trim().toLowerCase();
    const sc = ACCENTS[hl] || (/^#[0-9a-f]{3,8}$/i.test(hl) ? hl : "");
    const PW = px(1400 - 96);
    const body = panels.map((p, k) => {
      const pid = `${id}-p${k}`;
      if (p.kind === "rings") {
        const tone = (r, j) => (/loss|lost|churn|no-?show|miss|cancel|refund/i.test(r.label) ? "var(--red)" : j === 0 ? "#E8E9EB" : "var(--sc)");
        return `<div class="tp-af-pn" id="${pid}"><div class="tp-af-h">${esc(p.rings[0]?.label || "Overview")}<u>Now</u></div><div class="tp-af-rings">${p.rings.map((r, j) => {
          const pct = /%/.test(r.value) ? Math.min(100, Number(r.value.replace(/[^\d.]/g, "")) || 0) : 72;
          return `<div class="tp-af-ring" style="--rc:${tone(r, j)}"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="46"/><circle class="val" id="${pid}-r${j}" data-pct="${pct}" cx="50" cy="50" r="46" pathLength="100"/></svg><b id="${pid}-v${j}">${esc(r.value)}</b><span>${esc(r.label)}</span></div>`;
        }).join("")}</div></div>`;
      }
      if (p.kind === "habits") {
        const DOTS = ["#FF5FA2", "#4DA3FF", "#FF5A4E", "#B48CFF", "#F5C542", "#3DDC84"];
        const cols = 14;
        return `<div class="tp-af-pn" id="${pid}"><div class="tp-af-h">Habits · this month<u>Daily</u></div><div class="tp-af-hab">${p.habits.map((h, j) => {
          let done = 0;
          const dots = Array.from({ length: cols }, (_, d) => {
            const on = ((j * 7 + d * 3) % 9) !== 0 && d < cols - ((j * 5) % 4);
            if (on) done++;
            return `<span class="tp-af-d"><i id="${pid}-d${j}-${d}"${on ? "" : ' data-off="1"'}></i></span>`;
          }).join("");
          return `<span><i style="--dc:${DOTS[j % DOTS.length]}"></i>${esc(h)}</span><div class="tp-af-dots">${dots}</div><b><em id="${pid}-v${j}">${Math.round((done / cols) * 100)}%</em><u>★ ${done}</u></b>`;
        }).join("")}</div></div>`;
      }
      if (p.kind === "rows") {
        const tone = (s) => (/loss|lost|no-?show|miss|cancel|fail|late|refund/i.test(s) ? "var(--red)" : /pend|wait|progress|review/i.test(s) ? "var(--gold)" : "#3DDC84");
        return `<div class="tp-af-pn" id="${pid}"><div class="tp-af-h">List overview<u>All</u></div><div class="tp-af-tbl"><div class="th"><span>Name</span><span>Status</span><span>When</span></div>${p.rows.map((r, j) => `<div id="${pid}-w${j}"><span>${esc(r[0] || "")}</span><span>${r[1] ? `<i class="tp-af-pill" style="--pc:${tone(r[1])}">${esc(r[1])}</i>` : ""}</span><span>${esc(r[2] || "")}</span></div>`).join("")}</div></div>`;
      }
      if (p.kind === "bars") {
        const max = Math.max(...p.bars.map((b) => b.value), 1);
        const BC = ["var(--sc)", "var(--gold)", "#EDEDED", "#3DDC84", "#B48CFF"];
        return `<div class="tp-af-pn" id="${pid}"><div class="tp-af-h">By month<u>Now</u></div><div class="tp-af-bars">${p.bars.map((b, j) => `<div style="--h:${Math.max(6, (b.value / max) * 100).toFixed(1)}%;--bc:${BC[j % BC.length]}"><b id="${pid}-b${j}">${esc(String(b.value))}</b><i id="${pid}-i${j}"></i><span>${esc(b.label)}</span></div>`).join("")}</div></div>`;
      }
      const vals = p.values, lo = Math.min(...vals), hi = Math.max(...vals), cw = PW, ch = px(400);
      const pts = vals.map((v, j) => [(j / (vals.length - 1)) * cw, ch * 0.92 - ((v - lo) / Math.max(1e-6, hi - lo)) * ch * 0.62]);
      const line = smooth(pts);
      return `<div class="tp-af-pn" id="${pid}"><div class="tp-af-h">Overall performance<u>Month</u></div><div class="tp-af-ch">${p.head ? `<b id="${pid}-v0">${esc(p.head)}</b>` : ""}<svg viewBox="0 0 ${cw} ${ch}" preserveAspectRatio="none"><defs><linearGradient id="${pid}-gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sc)" stop-opacity=".45"/><stop offset="1" stop-color="var(--sc)" stop-opacity="0"/></linearGradient></defs>${[0.25, 0.5, 0.75].map((g) => `<line class="gl" x1="0" x2="${cw}" y1="${(ch * g).toFixed(1)}" y2="${(ch * g).toFixed(1)}"/>`).join("")}<path class="ar" id="${pid}-a" d="${line} L${cw} ${ch} L0 ${ch} Z" fill="url(#${pid}-gr)"/><path class="ln" id="${pid}-l" d="${line}" pathLength="100"/></svg></div></div>`;
    }).join("");
    return `<div class="tp-af" id="${id}-wrap"${sc ? ` style="--sc:${esc(sc)}"` : ""}><div class="tp-af-stage" id="${id}-stage"><div class="tp-af-tilt" id="${id}-tilt"><div class="tp-af-cam" id="${id}-cam"><div class="tp-af-win" id="${id}-win"><div class="tp-af-bar"><b>${esc(c.text || "Dashboard")}</b><span class="on">Week</span><span>Month</span><span>Stats</span><i>+ New</i></div>${body}</div></div></div></div><i class="tp-af-glare" id="${id}-glare"></i><i class="tp-af-dof"></i><i class="tp-af-vig"></i></div>`;
  },
  script: `
    var P = c.data, win = document.querySelector(el + "-win"), cam = document.querySelector(el + "-cam");
    if (!win) return;
    function q(s) { return document.querySelector(el + s); }
    // Number in an element counts up from 0 (keeps prefix/suffix), seek-safe.
    function count(sel, at, dur) {
      var node = q(sel); if (!node) return;
      var txt = node.textContent, m = txt.match(/^([^\\d-]*?)(-?[\\d,]*\\.?\\d+)(.*)$/);
      if (!m) return;
      var target = Number(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, o = { v: 0 };
      tl.fromTo(o, { v: 0 }, { v: target, duration: dur, ease: "power2.out", immediateRender: false, onUpdate: function () { node.textContent = m[1] + o.v.toFixed(dec) + m[3]; } }, at);
    }
    // Camera: a look point at each panel, left of centre so the far side of the screen trails off (rings sit
    // centred so all three show; the chart further left so its big number stays in shot).
    var looks = [], AIM = { rings: 0.5, chart: 0.36 };
    for (var k = 0; k < P.n; k++) { var pn = q("-p" + k); looks.push(pn ? [win.offsetWidth * (AIM[P.kinds[k]] || 0.42), pn.offsetTop + pn.offsetHeight * 0.5] : [0, 0]); }
    // The scene's transition (best: dive) does the entrance; the screen just comes up fast under it.
    tl.fromTo(el + "-wrap", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out", immediateRender: false }, t0);
    tl.fromTo(el + "-tilt", { rotationY: -30, rotationX: 16, rotationZ: -5, scale: 1.18 }, { rotationY: -24, rotationX: 12, rotationZ: -3, scale: 1.26, duration: len, ease: "sine.inOut", immediateRender: false }, t0);
    tl.fromTo(el + "-glare", { xPercent: -30 }, { xPercent: 30, duration: len, ease: "none", immediateRender: false }, t0);
    if (looks.length) tl.set(cam, { x: -looks[0][0], y: -looks[0][1] + 60 }, t0);
    for (var p = 0; p < P.n; p++) {
      var at = t0 + P.at[p], from = p ? looks[p - 1] : [looks[0][0], looks[0][1] - 60];
      tl.fromTo(cam, { x: -from[0], y: -from[1] }, { x: -looks[p][0], y: -looks[p][1], duration: p ? 0.7 : 0.9, ease: p ? "power2.inOut" : "power3.out", immediateRender: false }, p ? at - 0.25 : t0);
      var go = at + 0.2, kind = P.kinds[p], n = P.counts[p], pid = "-p" + p;
      if (kind === "rings") {
        for (var j = 0; j < n; j++) {
          var r = q(pid + "-r" + j), pct = r ? Number(r.getAttribute("data-pct")) : 0;
          tl.fromTo(r, { strokeDashoffset: 100 }, { strokeDashoffset: 100 - pct, duration: 1.1, ease: "power2.out", immediateRender: false }, go + j * 0.12);
          count(pid + "-v" + j, go + j * 0.12, 1.1);
        }
      } else if (kind === "habits") {
        for (var h = 0; h < n; h++) {
          for (var d = 0; d < 14; d++) {
            var dot = q(pid + "-d" + h + "-" + d);
            if (!dot || dot.getAttribute("data-off")) continue;
            tl.fromTo(dot, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out", immediateRender: false }, go + d * 0.055 + h * 0.03);
          }
          count(pid + "-v" + h, go, 0.9);
        }
      } else if (kind === "rows") {
        for (var w = 0; w < n; w++) blurIn(el + pid + "-w" + w + " > span", go + w * 0.14, { y: -14, b: 8, d: 0.45, s: 1 });
      } else if (kind === "bars") {
        for (var b = 0; b < n; b++) {
          tl.fromTo(el + pid + "-i" + b, { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: "expo.out", immediateRender: false }, go + b * 0.1);
          tl.fromTo(el + pid + "-b" + b, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, go + b * 0.1 + 0.4);
          count(pid + "-b" + b, go + b * 0.1, 0.8);
        }
      } else {
        tl.fromTo(el + pid + "-l", { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: Math.min(1.4, P.seg), ease: "power2.inOut", immediateRender: false }, go);
        tl.fromTo(el + pid + "-a", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.out", immediateRender: false }, go + 0.3);
        count(pid + "-v0", go, Math.min(1.4, P.seg));
      }
    }`,
};
