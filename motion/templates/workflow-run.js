// Workflow run (the creator's reference reels, 2026-10-22: references/reels/1-workflow-energy and 2-workflow-n8n, see
// references/reel-study.md). An automation canvas (the n8n look) lies tilted in 3D on a dark grid. A cursor clicks
// "Execute workflow", then a hot pulse with a spark trail runs down each wire. Every node it reaches lights up (an
// accent rim draws round it and glows) and the camera glides along with it. The AI node fans out to its tools: blue
// dashed lines run down and the tools light up blue in a haze of particles. The last node lands green with a check.
// Lit wires keep streaming small light dots. Everything that moves along a wire is drawn from the timeline's clock
// (one proxy tween), so any frame can be seeked to.
import { brandMark, CURSOR_SVG, CHECK_PATH } from "./_parts.js";

/** Line glyphs (24 grid) for the tools people wire up; picked by the node's name. */
const GLYPHS = [
  [/telegram/i, "#2AABEE", `<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="M21 3 10 13"/>`],
  [/gmail|e-?mail|inbox|mail/i, "#EA4335", `<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>`],
  [/sheet|excel|csv|spreadsheet/i, "#23A566", `<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15h6M9 18h4"/>`],
  [/whatsapp|sms|text|message|reply|chat|dm\b/i, "#25D366", `<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4.5 19.5l1.4-4.3A7.5 7.5 0 1 1 20 11.5z"/>`],
  [/slack/i, "#E01E5A", `<path d="M9 4 7.5 20M16.5 4 15 20M4.5 9h16M3.5 15h16"/>`],
  [/calendar|book|schedul|calendly|appointment/i, "#4285F4", `<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>`],
  [/gemini|google/i, "#8AB4F8", `<path d="M12 3c.6 4.6 2.9 6.9 7.5 7.5v1c-4.6.6-6.9 2.9-7.5 7.5h-1c-.6-4.6-2.9-6.9-7.5-7.5v-1C8.1 9.9 10.4 7.6 11 3z"/>`],
  [/agent|\bai\b|gpt|openai|claude|model|brain|memory|llm|assistant|atlas/i, "#F5EFE8", `<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4.5V8M9.5 16h5"/><circle cx="9.3" cy="12.6" r=".9"/><circle cx="14.7" cy="12.6" r=".9"/><circle cx="12" cy="3.8" r="1"/>`],
  [/classif|filter|route|router|switch|\bif\b|branch|qualif/i, "#B48CFF", `<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 8v8M8 6c5 0 4 6 8 6M8 18c5 0 4-6 8-6"/>`],
  [/crm|hubspot|highlevel|ghl|contact|lead/i, "#FF7A59", `<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16 14.4c2.3.1 4 1.6 4.5 4.6"/>`],
  [/stripe|pay|invoice|billing|checkout/i, "#7A73FF", `<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>`],
  [/phone|call|voice/i, "#3DDC84", `<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>`],
  [/database|\bdb\b|save|store|supabase|airtable|notion|record/i, "#F5B63F", `<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>`],
  [/webhook|trigger|form|start|new|when/i, "", `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>`],
];
const glyph = (name, esc) => {
  const hit = GLYPHS.find(([re]) => re.test(name));
  if (!hit) return `<span class="wf-badge">${esc(String(name).replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "•")}</span>`;
  return `<svg class="tp-wf-ic" viewBox="0 0 24 24" style="${hit[1] ? `color:${hit[1]}` : ""}">${hit[2]}</svg>`;
};

const AI = /\b(ai|agent|gpt|claude|gemini|brain|atlas|assistant|llm)\b/i;
const DEFAULT = ["New lead | Trigger", "AI Agent | Qualifies the lead", "Book the call | Calendar", "Reply to lead | Instantly"];
const parse = (c) => {
  const all = (c.items || []).map((x) => String(x ?? "").trim()).filter(Boolean);
  const tools = all.filter((x) => /^tool\s*:/i.test(x)).map((x) => x.replace(/^tool\s*:\s*/i, "")).slice(0, 4);
  const chain = all.filter((x) => !/^tool\s*:/i.test(x));
  const nodes = (chain.length >= 2 ? chain : DEFAULT).slice(0, 7).map((x) => {
    const [name, tag = ""] = x.split("|").map((s) => s.trim());
    return { name, tag };
  });
  const hl = String(c.highlight || "").trim().toLowerCase();
  let hub = hl ? nodes.findIndex((n) => n.name.toLowerCase().includes(hl)) : -1;
  if (hub < 0) hub = nodes.findIndex((n) => AI.test(n.name));
  if (hub < 0 && tools.length) hub = Math.min(nodes.length - 1, Math.floor(nodes.length / 2));
  return { nodes, tools: hub >= 0 ? tools : [], hub };
};

const r3 = (n) => Math.round(n * 1000) / 1000;
/** The run, in seconds from the graphic's start: when each node lights, each wire's pulse, each tool. */
const plan = (c) => {
  const { nodes, tools, hub } = parse(c);
  const len = Math.max(3, Number(c.duration) || 5);
  const btn = String(c.sub ?? "").trim() !== "-";
  const start = btn ? 0.85 : 0.35;
  const fan = tools.length ? 0.55 + tools.length * 0.12 : 0;
  const hops = nodes.length - 1;
  const hop = Math.min(1.1, Math.max(0.42, (len - start - fan - 0.8) / Math.max(1, hops)));
  const travel = r3(hop * 0.72);
  const lit = [start];
  const wires = [];
  for (let k = 1; k < nodes.length; k++) {
    const s = lit[k - 1] + 0.08 + (k - 1 === hub ? fan : 0);
    wires.push({ s: r3(s), d: travel });
    lit.push(r3(s + travel));
  }
  const toolRuns = tools.map((_, i) => ({ s: r3((lit[hub] ?? 0) + 0.15 + i * 0.12), d: 0.42 }));
  return { n: nodes.length, m: tools.length, hub, btn, click: r3(start - 0.3), lit, wires, tools: toolRuns };
};

export default {
  id: "workflow-run",
  name: "Workflow run",
  job: "product",
  scene: "always",
  use: 'Shows the automation actually running, step by step: a lead comes in, the AI handles it, it lands in the CRM, the reply goes out ("it answers every lead in seconds", "here\'s the system behind it", "it qualifies, books and replies on its own"). Always full-screen, 4–7 s; dark slate canvas, the brand accent is the pulse.',
  fields: 'items = the steps in order, 3–6, each "Name | small label" (e.g. "Telegram | Trigger", "AI Agent | Qualifies the lead", "Google Sheets | Saves the lead", "Reply | Instantly"), then up to 4 tools the AI node uses, written "tool: Gemini", "tool: Memory", "tool: Calendar"; highlight = the node the tools hang off (default: the AI/agent step); text = the workflow name in the top bar (e.g. "Lead agent"), optional; sub = the run button label (default "Execute workflow"; "-" for no button).',
  position: "center",
  anchor: null,
  minLen: 4,
  sfx: (g) => {
    const p = plan(g);
    return [
      ...(p.btn ? [["atlas-click", p.click, 0.5]] : []),
      ["atlas-whoosh", r3(p.lit[0] + 0.05), 0.35],
      ...p.lit.slice(1, -1).map((t) => ["atlas-marker", r3(t), 0.22]),
      ...p.tools.map((t) => ["atlas-pop", r3(t.s + t.d), 0.18]),
      ["atlas-success", r3(p.lit[p.lit.length - 1]), 0.45],
    ];
  },
  data: (c) => plan(c),
  css: ({ px, W, H }) => `
      .tp-wf { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; --hot: var(--ac); --cool: #3BA6FF; --good: #3DDC84;
        background: radial-gradient(ellipse 80% 60% at 50% 42%, #1E242B 0%, #12161A 55%, #0A0C0E 100%); font-family: "Inter", system-ui, sans-serif; }
      .tp-wf-stage { position: absolute; inset: 0; perspective: ${px(1500)}px; perspective-origin: 50% 40%; }
      .tp-wf-tilt { position: absolute; left: 50%; top: 47%; width: 0; height: 0; transform-style: preserve-3d; will-change: transform; }
      .tp-wf-cam { position: absolute; left: 0; top: 0; width: 0; height: 0; will-change: transform; }
      .tp-wf-grid { position: absolute; left: ${px(-2400)}px; top: ${px(-1800)}px; width: ${px(7200)}px; height: ${px(4200)}px;
        background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
        background-size: ${px(120)}px ${px(120)}px; -webkit-mask-image: radial-gradient(ellipse 45% 45% at 40% 45%, #000 40%, transparent 100%); mask-image: radial-gradient(ellipse 45% 45% at 40% 45%, #000 40%, transparent 100%); }
      .tp-wf-hud { position: absolute; font-family: var(--f-mono); font-size: ${px(15)}px; letter-spacing: .12em; color: rgba(220,232,245,.28); white-space: nowrap; }
      .tp-wf-hud i { display: block; height: ${px(5)}px; margin-top: ${px(8)}px; border-radius: ${px(3)}px; background: rgba(220,232,245,.14); }
      .tp-wf-hud i + i { width: 60%; }
      .tp-wf-hud b { color: var(--hot); font-weight: 500; }
      .tp-wf svg.tp-wf-wires { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; }
      .tp-wf-wire { fill: none; stroke: rgba(225,232,240,.34); stroke-width: ${px(3)}; }
      .tp-wf-tw { fill: none; stroke: var(--cool); stroke-width: ${px(3.5)}; stroke-dasharray: ${px(12)} ${px(10)}; }
      .tp-wf-port { fill: #262B31; stroke: rgba(225,232,240,.5); stroke-width: ${px(2.5)}; }
      .tp-wf-trail { fill: none; stroke: var(--hot); stroke-width: ${px(7)}; stroke-linecap: round; }
      .tp-wf-trail.cool { stroke: var(--cool); }
      .tp-wf-head { fill: #FFF6EC; }
      .tp-wf-sp { fill: #FFD9A8; }
      .tp-wf-sp.cool, .tp-wf-st.cool { fill: #BFE3FF; }
      .tp-wf-st { fill: #FFE7C2; }
      .tp-wf-node { position: absolute; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -${px(75)}px); }
      .tp-wf-tile { position: relative; display: grid; place-items: center; width: ${px(150)}px; height: ${px(150)}px; box-sizing: border-box; border-radius: ${px(32)}px;
        background: linear-gradient(160deg, #343A42, #22272D); box-shadow: inset 0 0 0 ${Math.max(1, px(2))}px rgba(255,255,255,.08), 0 ${px(24)}px ${px(50)}px rgba(0,0,0,.45);
        filter: saturate(.35) brightness(.8); will-change: filter; }
      .tp-wf-tile svg.tp-wf-ic { width: 46%; height: 46%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; color: #E9EEF3; overflow: visible; }
      .tp-wf-badge { font-weight: 800; font-size: ${px(42)}px; letter-spacing: -0.02em; color: #E9EEF3; }
      .tp-wf-node.hub .tp-wf-tile { flex-direction: row; gap: ${px(18)}px; width: ${px(370)}px; height: ${px(150)}px; padding: 0 ${px(30)}px; justify-content: flex-start; display: flex; align-items: center; }
      .tp-wf-node.hub .tp-wf-tile svg.tp-wf-ic { flex: none; width: ${px(64)}px; height: ${px(64)}px; }
      .tp-wf-node.hub .tp-wf-tile b { font-weight: 700; font-size: ${px(32)}px; line-height: 1.1; letter-spacing: -0.015em; color: #F2F5F8; }
      .tp-wf-rim { position: absolute; inset: ${px(-5)}px; width: calc(100% + ${px(10)}px); height: calc(100% + ${px(10)}px); overflow: visible; pointer-events: none; }
      .tp-wf-rim rect { fill: none; stroke: var(--hot); stroke-width: ${px(4)}; stroke-dasharray: 100; stroke-dashoffset: 100; filter: drop-shadow(0 0 ${px(6)}px var(--hot)); }
      .tp-wf-glow { position: absolute; inset: 0; border-radius: inherit; opacity: 0; box-shadow: 0 0 0 ${px(3)}px var(--hot), 0 0 ${px(30)}px var(--hot), 0 0 ${px(90)}px color-mix(in srgb, var(--hot) 55%, transparent), inset 0 0 ${px(30)}px color-mix(in srgb, var(--hot) 45%, transparent); }
      .tp-wf-ring { position: absolute; inset: 0; border-radius: inherit; border: ${px(3)}px solid var(--hot); opacity: 0; }
      .tp-wf-ok { position: absolute; inset: 0; display: grid; place-items: center; border-radius: inherit; opacity: 0; background: linear-gradient(160deg, #46E08D, #22B864); box-shadow: 0 0 ${px(40)}px rgba(61,220,132,.6), 0 0 ${px(110)}px rgba(61,220,132,.3); }
      .tp-wf-ok svg { width: 48%; height: 48%; fill: none; stroke: #06210F; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
      .tp-wf-lab { margin-top: ${px(18)}px; text-align: center; white-space: nowrap; }
      .tp-wf-lab b { display: block; font-weight: 700; font-size: ${px(30)}px; letter-spacing: -0.015em; color: #F2F5F8; text-shadow: 0 ${px(2)}px ${px(10)}px rgba(0,0,0,.6); }
      .tp-wf-lab span { display: block; margin-top: ${px(4)}px; font-family: var(--f-mono); font-size: ${px(17)}px; letter-spacing: .1em; text-transform: uppercase; color: rgba(220,232,245,.45); }
      .tp-wf-tool { position: absolute; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -${px(62)}px); --hot: var(--cool); }
      .tp-wf-tool .tp-wf-tile { width: ${px(124)}px; height: ${px(124)}px; border-radius: 50%; }
      .tp-wf-tool .tp-wf-lab b { font-size: ${px(25)}px; }
      .tp-wf-mote { position: absolute; width: ${px(5)}px; height: ${px(5)}px; margin: ${px(-2.5)}px; border-radius: 50%; background: #CFEAFF; box-shadow: 0 0 ${px(8)}px var(--cool); opacity: 0; }
      .tp-wf-top { position: absolute; left: ${px(56)}px; right: ${px(56)}px; top: ${Math.round(H * 0.075)}px; display: flex; align-items: center; gap: ${px(18)}px; z-index: 3; }
      .tp-wf-top u { display: grid; place-items: center; width: ${px(58)}px; height: ${px(58)}px; padding: ${px(12)}px; box-sizing: border-box; border-radius: ${px(16)}px; background: rgba(255,255,255,.06); color: var(--hot); text-decoration: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .tp-wf-top u img { width: 100%; height: 100%; object-fit: contain; }
      .tp-wf-top b { font-weight: 700; font-size: ${px(34)}px; letter-spacing: -0.02em; color: #F2F5F8; }
      .tp-wf-top span { margin-left: auto; display: flex; align-items: center; gap: ${px(10)}px; font-family: var(--f-mono); font-size: ${px(19)}px; letter-spacing: .14em; text-transform: uppercase; color: rgba(220,232,245,.5); }
      .tp-wf-top span i { width: ${px(10)}px; height: ${px(10)}px; border-radius: 50%; background: var(--good); box-shadow: 0 0 ${px(10)}px var(--good); }
      .tp-wf-run { position: absolute; right: ${px(64)}px; bottom: ${Math.round(H * 0.11)}px; z-index: 3; display: flex; align-items: center; gap: ${px(14)}px; padding: ${px(24)}px ${px(40)}px; border-radius: ${px(20)}px;
        background: var(--hot); color: var(--on-ac, #17120F); font-weight: 700; font-size: ${px(34)}px; letter-spacing: -0.01em; box-shadow: 0 0 ${px(50)}px color-mix(in srgb, var(--hot) 45%, transparent), 0 ${px(18)}px ${px(40)}px rgba(0,0,0,.45); }
      .tp-wf-run svg { width: ${px(34)}px; height: ${px(34)}px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
      .tp-wf-cur { position: absolute; left: 74%; top: 86.4%; z-index: 4; width: ${px(64)}px; height: ${px(64)}px; filter: drop-shadow(0 ${px(6)}px ${px(12)}px rgba(0,0,0,.5)); opacity: 0; }
      .tp-wf-cur svg { width: 100%; height: 100%; }
      .tp-wf-dof { position: absolute; inset: 0; z-index: 2; pointer-events: none; backdrop-filter: blur(${px(7)}px); -webkit-backdrop-filter: blur(${px(7)}px);
        -webkit-mask-image: radial-gradient(ellipse 62% 48% at 50% 46%, transparent 55%, #000 100%); mask-image: radial-gradient(ellipse 62% 48% at 50% 46%, transparent 55%, #000 100%); }
      .tp-wf-vig { position: absolute; inset: 0; z-index: 2; pointer-events: none; background: radial-gradient(ellipse 75% 65% at 50% 45%, transparent 50%, rgba(0,0,0,.55) 100%); }`,
  html: ({ id, c, esc, px, logo }) => {
    const { nodes, tools, hub } = parse(c);
    const SP = px(470);
    const pos = nodes.map((_, k) => ({ x: k * SP + (hub >= 0 && k > hub ? px(60) : 0), y: k % 2 && k !== hub ? px(-40) : 0 }));
    const half = (k) => (k === hub ? px(185) : px(75));
    const TY = px(400);
    const tpos = tools.map((_, i) => ({ x: pos[hub].x + (i - (tools.length - 1) / 2) * px(250), y: pos[hub].y + TY + (Math.abs(i - (tools.length - 1) / 2) < 0.6 ? px(40) : 0) }));
    const f = (n) => n.toFixed(1);
    const wire = (a, b, k) => {
      const x1 = pos[a].x + half(a), x2 = pos[b].x - half(b), y1 = pos[a].y, y2 = pos[b].y, mx = (x1 + x2) / 2;
      return `<path class="tp-wf-wire" id="${id}-w${k}" d="M${f(x1)} ${f(y1)} C${f(mx)} ${f(y1)} ${f(mx)} ${f(y2)} ${f(x2)} ${f(y2)}"/><circle class="tp-wf-port" cx="${f(x1)}" cy="${f(y1)}" r="${px(8)}"/><circle class="tp-wf-port" cx="${f(x2)}" cy="${f(y2)}" r="${px(8)}"/>`;
    };
    const comet = (k, cool) => `<path class="tp-wf-trail${cool ? " cool" : ""}" id="${id}-tr${k}" d="" opacity="0" filter="url(#${id}-glow)"/>${Array.from({ length: 8 }, (_, j) => `<circle class="tp-wf-sp${cool ? " cool" : ""}" id="${id}-sp${k}-${j}" r="${px(2.6)}" opacity="0"/>`).join("")}${Array.from({ length: 3 }, (_, j) => `<circle class="tp-wf-st${cool ? " cool" : ""}" id="${id}-st${k}-${j}" r="${px(4.5)}" opacity="0" filter="url(#${id}-glow)"/>`).join("")}<circle class="tp-wf-head" id="${id}-hd${k}" r="${px(9)}" opacity="0" filter="url(#${id}-glow)"/>`;
    const wires = nodes.slice(1).map((_, k) => wire(k, k + 1, k)).join("");
    const toolWires = tools.map((_, i) => {
      const x1 = pos[hub].x, y1 = pos[hub].y + px(75), x2 = tpos[i].x, y2 = tpos[i].y - px(66), my = (y1 + y2) / 2;
      const d = `M${f(x1)} ${f(y1)} C${f(x1)} ${f(my)} ${f(x2)} ${f(my)} ${f(x2)} ${f(y2)}`;
      return `<mask id="${id}-mk${i}" maskUnits="userSpaceOnUse" x="-99999" y="-99999" width="199998" height="199998"><path id="${id}-tm${i}" d="${d}" pathLength="100" fill="none" stroke="#fff" stroke-width="${px(12)}" stroke-dasharray="100" stroke-dashoffset="100"/></mask><path class="tp-wf-tw" id="${id}-tw${i}" d="${d}" mask="url(#${id}-mk${i})"/><path id="${id}-tp${i}" d="${d}" fill="none" stroke="none"/>`;
    }).join("");
    const glow = `<defs><filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${px(5)}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    // The rim that draws round a tile as it lights, sized to that tile (so the stroke stays even all the way round).
    const rim = (w, h, r) => { const p = px(5), sw = px(4); return `<svg class="tp-wf-rim" viewBox="0 0 ${w + 2 * p} ${h + 2 * p}"><rect x="${sw / 2}" y="${sw / 2}" width="${w + 2 * p - sw}" height="${h + 2 * p - sw}" rx="${r + p}" pathLength="100"/></svg>`; };
    const last = nodes.length - 1;
    const nodeHtml = nodes.map((n, k) => `<div class="tp-wf-node${k === hub ? " hub" : ""}" id="${id}-n${k}" style="left:${f(pos[k].x)}px;top:${f(pos[k].y)}px"><div class="tp-wf-tile" id="${id}-tl${k}">${glyph(n.name, esc)}${k === hub ? `<b>${esc(n.name)}</b>` : ""}<i class="tp-wf-glow" id="${id}-gl${k}"${k === last ? ` style="--hot: var(--good)"` : ""}></i><i class="tp-wf-ring" id="${id}-rg${k}"></i>${k === hub ? rim(px(370), px(150), px(32)) : rim(px(150), px(150), px(32))}${k === last ? `<i class="tp-wf-ok" id="${id}-ok"><svg viewBox="0 0 24 24"><path d="${CHECK_PATH}"/></svg></i>` : ""}</div><div class="tp-wf-lab">${k === hub ? "" : `<b>${esc(n.name)}</b>`}${n.tag ? `<span>${esc(n.tag)}</span>` : ""}</div></div>`).join("");
    const motes = (i) => Array.from({ length: 10 }, (_, j) => {
      const a = (j / 10) * Math.PI * 2 + i, r = px(80 + ((j * 37) % 40));
      return `<i class="tp-wf-mote" id="${id}-mo${i}-${j}" style="left:${f(tpos[i].x + Math.cos(a) * r)}px;top:${f(tpos[i].y + Math.sin(a) * r * 0.8)}px"></i>`;
    }).join("");
    const toolHtml = tools.map((t, i) => `${motes(i)}<div class="tp-wf-tool" id="${id}-t${i}" style="left:${f(tpos[i].x)}px;top:${f(tpos[i].y)}px"><div class="tp-wf-tile" id="${id}-tt${i}">${glyph(t, esc)}<i class="tp-wf-glow" id="${id}-tg${i}"></i><i class="tp-wf-ring" id="${id}-tx${i}"></i>${rim(px(124), px(124), px(62))}</div><div class="tp-wf-lab"><b>${esc(t)}</b></div></div>`).join("");
    // Faint HUD bits scattered on the canvas (the energy reel's tech dressing).
    const hud = [[-0.6, -1.3, "NODE_01 · 200 OK"], [1.4, 1.5, "RUN 0.4s · <b>LIVE</b>"], [2.6, -1.2, "WEBHOOK /lead"], [-0.8, 1.6, "EXEC #2041"], [3.6, 1.3, "QUEUE 0"]]
      .map(([gx, gy, t]) => `<div class="tp-wf-hud" style="left:${f(gx * SP)}px;top:${f(gy * px(420))}px">${t}<i></i><i></i></div>`).join("");
    // Where the camera looks for each node (a little ahead along the run), and for the tools under the hub.
    const look = pos.map((p) => [r3(p.x + SP * 0.28), r3(p.y + px(40))]);
    const hubLook = hub >= 0 && tools.length ? [r3(pos[hub].x + px(20)), r3(pos[hub].y + TY * 0.62)] : null;
    const top = c.text ? `<div class="tp-wf-top" id="${id}-top"><u>${brandMark(logo, esc)}</u><b>${esc(c.text)}</b><span><i></i>Active</span></div>` : "";
    const run = String(c.sub ?? "").trim() === "-" ? "" : `<div class="tp-wf-run" id="${id}-run"><svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></svg>${esc(c.sub || "Execute workflow")}</div><div class="tp-wf-cur" id="${id}-cur">${CURSOR_SVG}</div>`;
    return `<div class="tp-wf" id="${id}-wrap" data-look="${esc(JSON.stringify(look))}" data-hub="${hubLook ? esc(JSON.stringify(hubLook)) : ""}" data-u="${px(100) / 100}"><div class="tp-wf-stage" id="${id}-stage"><div class="tp-wf-tilt" id="${id}-tilt"><div class="tp-wf-cam" id="${id}-cam"><div class="tp-wf-grid"></div>${hud}<svg class="tp-wf-wires" viewBox="0 0 1 1">${glow}${wires}${toolWires}${nodes.slice(1).map((_, k) => comet(k, false)).join("")}${tools.map((_, i) => comet(`t${i}`, true)).join("")}</svg>${toolHtml}${nodeHtml}</div></div></div><i class="tp-wf-dof"></i><i class="tp-wf-vig"></i>${top}${run}</div>`;
  },
  script: `
    var P = c.data, wrap = document.querySelector(el + "-wrap");
    if (!wrap) return;
    var LOOK = JSON.parse(wrap.getAttribute("data-look") || "[]"), HUB = wrap.getAttribute("data-hub") ? JSON.parse(wrap.getAttribute("data-hub")) : null, U = Number(wrap.getAttribute("data-u")) || 1;
    function q(s) { return document.querySelector(el + s); }
    function fr(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
    function ease(p) { p = Math.max(0, Math.min(1, p)); return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
    // Every pulse: the wire it runs on, its head, trail, sparks and the light dots that stream once it has passed.
    var RUNS = [];
    function run(key, path, s, d, cool) {
      var L = path ? path.getTotalLength() : 0, sp = [], st = [];
      for (var j = 0; j < 8; j++) sp.push({ n: q("-sp" + key + "-" + j), b: 0.12 + 0.84 * fr(j * 7.3 + RUNS.length * 3.1), dx: fr(j * 3.7 + RUNS.length) - 0.5, dy: fr(j * 5.1 + RUNS.length * 2) - 0.5 });
      for (var k = 0; k < 3; k++) st.push(q("-st" + key + "-" + k));
      RUNS.push({ path: path, L: L, s: s, d: d, cool: cool, hd: q("-hd" + key), tr: q("-tr" + key), sp: sp, st: st, tm: null, tw: null });
      return RUNS[RUNS.length - 1];
    }
    for (var k = 0; k < P.wires.length; k++) run(k, q("-w" + k), P.wires[k].s, P.wires[k].d, false);
    for (var i = 0; i < P.tools.length; i++) { var R = run("t" + i, q("-tp" + i), P.tools[i].s, P.tools[i].d, true); R.tm = q("-tm" + i); R.tw = q("-tw" + i); }
    RUNS.forEach(function (R) { if (R.tr && R.path) R.tr.setAttribute("d", R.path.getAttribute("d")); });
    var clock = { t: 0 };
    function draw() {
      var t = clock.t;
      RUNS.forEach(function (R) {
        if (!R.L) return;
        var p = (t - R.s) / R.d, e = ease(p), d = e * R.L, at;
        if (p > 0 && p < 1) { at = R.path.getPointAtLength(d); R.hd.setAttribute("cx", at.x); R.hd.setAttribute("cy", at.y); R.hd.setAttribute("opacity", 1); }
        else R.hd.setAttribute("opacity", 0);
        var seg = Math.min(d, R.L * 0.42);
        R.tr.setAttribute("stroke-dasharray", seg + " " + R.L * 3);
        R.tr.setAttribute("stroke-dashoffset", -(d - seg));
        R.tr.setAttribute("opacity", p <= 0 ? 0 : p < 1 ? 1 : Math.max(0, 1 - ((p - 1) * R.d) / 0.3));
        R.sp.forEach(function (S, j) {
          if (!S.n) return;
          var age = t - (R.s + S.b * R.d), life = 0.4;
          if (age <= 0 || age >= life || p <= 0) { S.n.setAttribute("opacity", 0); return; }
          var base = R.path.getPointAtLength(ease(S.b) * R.L), k2 = age / life;
          S.n.setAttribute("cx", base.x + S.dx * 70 * U * k2);
          S.n.setAttribute("cy", base.y + S.dy * 70 * U * k2 + 30 * U * k2 * k2);
          S.n.setAttribute("opacity", (1 - k2) * 0.95);
        });
        if (R.tm) R.tm.setAttribute("stroke-dashoffset", 100 - 100 * e);
        if (R.tw) R.tw.setAttribute("stroke-dashoffset", -t * 46 * U);
        if (R.path && !R.cool) { R.path.style.stroke = p >= 1 ? "rgba(255,236,214,.62)" : ""; }
        var since = t - (R.s + R.d);
        R.st.forEach(function (n, j) {
          if (!n) return;
          if (since <= 0) { n.setAttribute("opacity", 0); return; }
          var f2 = (since * 0.7 + j / 3) % 1, pt = R.path.getPointAtLength(f2 * R.L);
          n.setAttribute("cx", pt.x); n.setAttribute("cy", pt.y);
          n.setAttribute("opacity", Math.min(1, since / 0.4) * Math.sin(Math.PI * f2) * 0.9);
        });
      });
    }
    draw();
    tl.fromTo(clock, { t: 0 }, { t: len, duration: len, ease: "none", immediateRender: false, onUpdate: draw }, t0);
    // The canvas arrives soft, then drifts slowly flatter and closer while the run plays.
    tl.fromTo(el + "-wrap", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, t0);
    blurIn(el + "-stage", t0, { y: 0, s: 0.94, b: 14, d: 0.8 });
    tl.fromTo(el + "-tilt", { rotationX: 34, rotationZ: -11, rotationY: -6, scale: 1.5 }, { rotationX: 27, rotationZ: -6, rotationY: -2, scale: 1.62, duration: len, ease: "sine.inOut", immediateRender: false }, t0);
    blurIn(el + "-top", t0 + 0.1, { y: 14, b: 8 });
    // Camera: start on the trigger, then glide to each node as its pulse runs (and down to the tools at the hub).
    var cam = q("-cam");
    function camTo(pt, at, dur, from) {
      tl.fromTo(cam, { x: -from[0], y: -from[1] }, { x: -pt[0], y: -pt[1], duration: dur, ease: "power2.inOut", immediateRender: false }, at);
    }
    if (LOOK.length) {
      tl.set(cam, { x: -LOOK[0][0], y: -LOOK[0][1] }, t0);
      var prev = LOOK[0];
      for (var w = 0; w < P.wires.length; w++) {
        if (w === P.hub && HUB) { camTo(HUB, t0 + P.lit[w] + 0.05, 0.6, prev); prev = HUB; }
        camTo(LOOK[w + 1], t0 + P.wires[w].s - 0.05, P.wires[w].d + 0.25, prev);
        prev = LOOK[w + 1];
      }
    }
    // The run button: a cursor glides onto it and clicks; the button presses and dims while the run plays.
    if (P.btn) {
      blurIn(el + "-run", t0 + 0.15, { y: 20, b: 10, d: 0.6 });
      hide(el + "-cur");
      tl.fromTo(el + "-cur", { autoAlpha: 0, x: 160 * U, y: 220 * U }, { autoAlpha: 1, x: 0, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, t0 + P.click - 0.5);
      tl.fromTo(el + "-cur", { scale: 1 }, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, t0 + P.click);
      tl.fromTo(el + "-run", { scale: 1, filter: "brightness(1)" }, { scale: 0.95, filter: "brightness(1.25)", duration: 0.09, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, t0 + P.click);
      tl.fromTo(el + "-cur", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, immediateRender: false }, t0 + P.click + 0.35);
    }
    // A node lights: its rim draws round, a glow flares then settles, a ring breathes out, the icon wakes up.
    function ignite(tile, rim, glow, ring, at) {
      tl.fromTo(tile, { filter: "saturate(0.35) brightness(0.8)" }, { filter: "saturate(1) brightness(1.08)", duration: 0.3, ease: "power2.out", immediateRender: false }, at);
      tl.fromTo(rim, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.38, ease: "power2.out", immediateRender: false }, at - 0.06);
      tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "power2.out", immediateRender: false }, at);
      tl.fromTo(glow, { opacity: 1 }, { opacity: 0.45, duration: 0.8, ease: "power2.out", immediateRender: false }, at + 0.14);
      tl.fromTo(ring, { opacity: 0.85, scale: 1 }, { opacity: 0, scale: 1.45, duration: 0.6, ease: "power2.out", immediateRender: false }, at);
    }
    for (var n = 0; n < P.n; n++) ignite(el + "-tl" + n, el + "-tl" + n + " .tp-wf-rim > *", el + "-gl" + n, el + "-rg" + n, t0 + P.lit[n]);
    for (var m = 0; m < P.m; m++) {
      var lit = t0 + P.tools[m].s + P.tools[m].d;
      ignite(el + "-tt" + m, el + "-tt" + m + " .tp-wf-rim > *", el + "-tg" + m, el + "-tx" + m, lit);
      for (var j = 0; j < 10; j++) tl.fromTo(el + "-mo" + m + "-" + j, { opacity: 0, y: 0 }, { opacity: 0.4 + fr(j + m) * 0.6, y: -26 * U * fr(j * 3 + m), duration: 0.5 + fr(j * 2 + m) * 0.6, ease: "sine.out", immediateRender: false }, lit + fr(j + m * 5) * 0.3);
    }
    // The last step lands green with a check.
    var end = t0 + P.lit[P.n - 1];
    tl.fromTo(el + "-ok", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, end + 0.12);
    tl.fromTo(el + "-ok path", { strokeDasharray: 30, strokeDashoffset: 30 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, end + 0.22);`,
};
