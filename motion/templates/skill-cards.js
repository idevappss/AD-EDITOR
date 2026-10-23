// Skill cards (the Jeremy AI demo, 15–17 s): glass cards fly in one at a time from off to the side, tipped in 3D,
// and settle into a 2-column grid; each has a line icon, a name and a small "Built in" tag. The last one lights up
// (lighter glass, an accent outline and a sheen sweeping across). A lower third names the set.
const ICON = {
  funnel: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 16l-5-5-8 8"/>',
  screen: '<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
  chart: '<path d="M4 19.5V14m5 5.5V8m5 11.5v-7m5 7V5"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="17" cy="9.5" r="2.5"/>',
  dollar: '<path d="M12 3v18"/><path d="M16.5 7.5c-.6-1.5-2.3-2.5-4.5-2.5-2.8 0-4.5 1.4-4.5 3.3 0 4.6 9.5 2.5 9.5 7.3 0 2-1.9 3.4-5 3.4-2.4 0-4.3-1.1-5-2.8"/>',
  doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>',
  star: '<path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
};
/** An icon from the words on the card (funnel for funnels, play for video/VSL…), else a star. */
const iconFor = (s) => {
  const t = String(s).toLowerCase();
  const pick = [[/funnel|bottleneck|pipeline/, "funnel"], [/creative|image|ad |ads\b|design/, "image"], [/webinar|website|landing|page/, "screen"], [/vsl|video|reel|youtube/, "play"], [/report|numbers|metric|finance|revenue|roas/, "chart"], [/email|inbox|newsletter/, "mail"], [/call|phone|setter|lead/, "phone"], [/calendar|schedule|booking/, "calendar"], [/hiring|team|people|staff/, "users"], [/price|pricing|money|payroll/, "dollar"], [/sop|doc|script|content|copy/, "doc"]].find(([re]) => re.test(t));
  return ICON[pick ? pick[1] : "star"];
};
const cards = (c) => (c.items || []).map((x) => String(x || "").split("|").map((s) => s.trim())).filter((r) => r[0]).slice(0, 6);
const r3 = (n) => Math.round(n * 1000) / 1000;
const gap = (duration, n) => Math.min(0.5, Math.max(0.2, ((Number(duration) || 3) - 1.3) / Math.max(1, n)));

export default {
  id: "skill-cards",
  name: "Skill cards",
  job: "product",
  scene: "optional",
  use: 'A set of built-in specialists, skills or playbooks ("four built-in diagnosis specialists", "it comes with templates for your funnel, your ads, your VSL"). Cards fly in and one lights up.',
  fields: 'items = 2–6 cards as "Name | tag" (e.g. "Bottleneck Diagnosis | Built in", "VSL Conversion Diagnosis | Built in"); the last lights up. sub = a lower-third line (e.g. "Four built-in diagnosis specialists."); highlight = its mono label (e.g. "Skills").',
  position: "top",
  anchor: null,
  minLen: 2,
  sfx: (g) => cards(g).map((_, i, all) => [i === all.length - 1 ? "atlas-ding" : "atlas-whoosh", r3(0.1 + i * gap(g.duration, all.length)), i === all.length - 1 ? 0.45 : 0.3]),
  data: (c) => ({ n: cards(c).length, gap: r3(gap(c.duration, cards(c).length)) }),
  css: ({ px, W, tall }) => `
      .tp-sk { width: ${Math.round(W * (tall ? 0.9 : 0.6))}px; }
      .tp-sk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: ${px(18)}px; perspective: ${px(1600)}px; }
      .tp-sk-card { position: relative; overflow: hidden; min-height: ${px(170)}px; padding: ${px(24)}px; border-radius: ${px(22)}px; background: linear-gradient(160deg, rgba(251,241,232,.08), rgba(251,241,232,.02)), rgba(23,18,15,.78); box-shadow: inset 0 0 0 1px rgba(251,241,232,.1), 0 ${px(20)}px ${px(50)}px rgba(0,0,0,.35); }
      .ag.tone-paper .tp-sk-card { background: #fff; box-shadow: inset 0 0 0 1px rgba(23,18,15,.08), 0 ${px(20)}px ${px(50)}px rgba(23,18,15,.12); }
      .tp-sk-card.hot { background: linear-gradient(160deg, rgba(251,241,232,.2), rgba(251,241,232,.06)), rgba(40,32,28,.9); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px color-mix(in srgb, var(--ac) 60%, transparent), 0 0 ${px(50)}px color-mix(in srgb, var(--ac) 25%, transparent); }
      .tp-sk-top { display: flex; justify-content: space-between; align-items: flex-start; }
      .tp-sk-top svg { width: ${px(40)}px; height: ${px(40)}px; padding: ${px(8)}px; border-radius: ${px(12)}px; background: var(--chip); color: var(--tx); fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .tp-sk-top small { font-weight: 500; font-size: ${px(17)}px; color: var(--tx2); }
      .tp-sk-card b { display: block; margin-top: ${px(26)}px; font-weight: 600; font-size: ${px(26)}px; line-height: 1.2; color: var(--tx); }
      .tp-sk-sheen { position: absolute; top: -40%; bottom: -40%; width: 30%; left: -40%; transform: skewX(-18deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent); }
      .tp-sk-low { margin-top: ${px(56)}px; }
      .tp-sk-low .mk-kick { display: flex; align-items: center; gap: ${px(12)}px; font-size: ${px(24)}px; }
      .tp-sk-low .mk-kick i { width: ${px(12)}px; height: ${px(12)}px; border-radius: 50%; background: var(--ac); box-shadow: 0 0 ${px(14)}px var(--ac); }
      .tp-sk-low .mk-h { margin-top: ${px(12)}px; font-size: ${px(tall ? 64 : 54)}px; text-shadow: none; }`,
  html: ({ id, c, esc }) => {
    const list = cards(c);
    return `<div class="tp-sk" id="${id}-wrap"><div class="tp-sk-grid">${list.map(([name, tag = "Built in"], i) => `<div class="tp-sk-card${i === list.length - 1 && list.length > 1 ? " hot" : ""}" id="${id}-c${i}"><div class="tp-sk-top"><svg viewBox="0 0 24 24">${iconFor(name)}</svg><small>${esc(tag)}</small></div><b>${esc(name)}</b>${i === list.length - 1 ? `<i class="tp-sk-sheen" id="${id}-sheen"></i>` : ""}</div>`).join("")}</div>${c.sub ? `<div class="tp-sk-low" id="${id}-low"><div class="mk-kick"><i></i>${esc(c.highlight || "Skills")}</div><h3 class="mk-h">${esc(c.sub)}</h3></div>` : ""}</div>`;
  },
  script: `
    var d = c.data;
    for (var i = 0; i < d.n; i++) {
      var at = t0 + 0.1 + i * d.gap, fromRight = i % 2 === 1;
      hide(el + "-c" + i);
      tl.fromTo(el + "-c" + i, { autoAlpha: 0, x: fromRight ? 420 : -420, y: 60, rotationY: fromRight ? -35 : 35, rotationX: 12 }, { autoAlpha: 1, x: 0, y: 0, rotationY: 0, rotationX: 0, duration: 0.7, ease: "expo.out", immediateRender: false }, at);
    }
    var last = t0 + 0.1 + (d.n - 1) * d.gap + 0.45;
    tl.fromTo(el + "-sheen", { left: "-40%" }, { left: "130%", duration: 0.9, ease: "power2.inOut", immediateRender: false }, last);
    blurIn(el + "-low", t0 + 0.3, { y: 20, b: 8 });`,
};
