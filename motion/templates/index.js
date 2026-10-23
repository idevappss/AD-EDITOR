// The motion-graphic template library. Each template is a self-contained look the planner can pick by job and
// rotate across ads: its HTML, CSS (added once per composition), GSAP timeline code, sound design, and a note on when
// to use it. motion/render.js draws them (look = template id); ads/plan.js shows Claude the catalog.
//
// Template shape:
//   id, name, job ("data" | "proof" | "product" | "benefit" | "cta" | "transition"), use (when to use it, for Claude),
//   fields (what text/sub/items mean), position ("top" | "center" | "bottom"), anchor ("number" | "cta" | null),
//   sfx [[sound, seconds after start, volume]] or (clip) → that list, minLen seconds,
//   scene (kit templates: "optional" = can play as a full-screen cutaway, "always" = always does),
//   css(ctx) → string, html(ctx) → string, data(c) → JSON for the cue,
//   script: JS source run on the composition timeline with (c, el, t0, t1, len, out) in scope.
//   ctx = { id, c, px, W, H, tall, esc, data, logo } (logo = URL of the graphic's first logo, or null: fall back to
//   the initial letter). Shared bits (initial, logo mark, count-up, cursor/hand) live in ./_parts.js.
//
// Inspirations (ideas only, all rebuilt): the "AI motion graphics" Short (ads/REFERENCE-2.md), Hera's job-based
// packs, Topview's float-enter and glass stroke, FastFX's cut hits (motion/references/sites.md), the Apple/glass UI
// study (motion/references/glass-ui.md: glass-notif, app-card, service-stack, glow-pulse, profile-follow) and the
// retention study (motion/references/retention-transitions.md: percent-circle, trend-line, loading-bar,
// countdown-ring, comment-pill).

import barChart from "./bar-chart.js";
import lineChart from "./line-chart.js";
import notification from "./notification.js";
import typingPrompt from "./typing-prompt.js";
import glassCard from "./glass-card.js";
import network from "./network.js";
import sonarCta from "./sonar-cta.js";
import lightLeak from "./light-leak.js";
import glassNotif from "./glass-notif.js";
import appCard from "./app-card.js";
import serviceStack from "./service-stack.js";
import glowPulse from "./glow-pulse.js";
import profileFollow from "./profile-follow.js";
import percentCircle from "./percent-circle.js";
import trendLine from "./trend-line.js";
import loadingBar from "./loading-bar.js";
import countdownRing from "./countdown-ring.js";
import commentPill from "./comment-pill.js";
// The Atlas motion kit (motion/references/atlas-motion-kit.md), 2026-09-28: the creator's favourite minimal look.
import trailPrompt from "./trail-prompt.js";
import taskCard from "./task-card.js";
import approvalPill from "./approval-pill.js";
import taskBoard from "./task-board.js";
import scheduleClock from "./schedule-clock.js";
import wordSwap from "./word-swap.js";
import strikeSwap from "./strike-swap.js";
import notifStack from "./notif-stack.js";
import cardCarousel from "./card-carousel.js";
import statRows from "./stat-rows.js";
import logoRings from "./logo-rings.js";
import chatThread from "./chat-thread.js";
import orgChart from "./org-chart.js";
import agentGrid from "./agent-grid.js";
import statement from "./statement.js";
import endCard from "./end-card.js";
// From the creator's Remotion project (Atlas-Demo-Remotion-Project) and the Jeremy AI demo, 2026-09-28.
import orbitNetwork from "./orbit-network.js";
import agentLog from "./agent-log.js";
import approvalCard from "./approval-card.js";
import phoneReport from "./phone-report.js";
import chatApp from "./chat-app.js";
import chainStack from "./chain-stack.js";
import wordmarkType from "./wordmark-type.js";
import statusFlood from "./status-flood.js";
import appWindow from "./app-window.js";
import skillCards from "./skill-cards.js";
import toolMap from "./tool-map.js";
import voiceRing from "./voice-ring.js";
import searchCta from "./search-cta.js";
import trialPass from "./trial-pass.js";
import dotOpen from "./dot-open.js";
import gridFill from "./grid-fill.js";
import barProof from "./bar-proof.js";
import wordWallpaper from "./word-wallpaper.js";
import uiOrbit from "./ui-orbit.js";
import logoSting from "./logo-sting.js";
// The creator's reference reels, 2026-10-22 (motion/references/reel-study.md).
import workflowRun from "./workflow-run.js";
import appFlythrough from "./app-flythrough.js";
import frameMarkup from "./frame-markup.js";
// The creator's example reels for sound and edit style, 2026-10-22 (motion/references/sound-study.md).
import focusCount from "./focus-count.js";
// The master edit's visual pieces, 2026-10-23 (motion/references/sound-study.md).
import nameTitle from "./name-title.js";
import contentFunnel from "./content-funnel.js";
import mindMap from "./mind-map.js";
import { KIT_JS } from "./_parts.js";

/** The kit templates, first in the catalog: the planner reaches for these before the older looks. */
export const KIT = [trailPrompt, taskCard, approvalPill, taskBoard, scheduleClock, wordSwap, strikeSwap, notifStack, cardCarousel, statRows,
  logoRings, chatThread, orgChart, agentGrid, statement, endCard, orbitNetwork, agentLog, approvalCard, phoneReport, chatApp, chainStack,
  wordmarkType, statusFlood, appWindow, skillCards, toolMap, voiceRing, searchCta, trialPass, dotOpen, gridFill, barProof, wordWallpaper, uiOrbit, logoSting,
  workflowRun, appFlythrough, frameMarkup, focusCount, nameTitle, contentFunnel, mindMap];

export const TEMPLATES = Object.fromEntries([...KIT, barChart, lineChart, notification, typingPrompt, glassCard, network, sonarCta, lightLeak,
  glassNotif, appCard, serviceStack, glowPulse, profileFollow, percentCircle, trendLine, loadingBar, countdownRing, commentPill].map((t) => [t.id, t]));

/** A template's sound design for one clip: a fixed list, or computed from the clip (timed to its beats). */
export const templateSfx = (t, clip) => (typeof t?.sfx === "function" ? t.sfx(clip) : t?.sfx || []);

/** Whether a clip plays as a full-screen cutaway (the kit's dark or accent ground over the speaker). */
export const isScene = (t, clip) => Boolean(t) && (t.scene === "always" || (t.scene === "optional" && Boolean(clip?.fullscreen)));

/** The catalog as Claude sees it. */
export function templateCatalog() {
  const kit = new Set(KIT.map((t) => t.id));
  return Object.values(TEMPLATES)
    .map((t) => `- ${t.id} (${t.job}${kit.has(t.id) ? ", Atlas kit" : ""}${t.scene === "always" ? ", always full-screen" : t.scene === "optional" ? ", can be full-screen" : ""}): ${t.use} Fields: ${t.fields}`)
    .join("\n");
}

/**
 * Minimal motion (the creator, 2026-09-28: "more minimalistic and beautiful animations"): no bounce, no elastic,
 * no overshoot. Every template's and built-in look's timeline goes through this before it's written out.
 */
export const soften = (src) => String(src)
  .replace(/back\.(in|out|inOut)\([^)]*\)/g, (_, dir) => (dir === "in" ? "power2.in" : "power3.out"))
  .replace(/elastic\.(in|out|inOut)\([^)]*\)/g, "power3.out")
  .replace(/bounce\.(in|out|inOut)/g, "power3.out");

/**
 * Shared motion. floatIn is now a soft blur-rise (it used to fly in from 8% with an overshoot) and drift a slow,
 * small float; the kit helpers (blurIn, blurOut, settle3d, typeOn, blink, hide) come with them.
 */
export const FLOAT_IN = `function floatIn(target, at, from) {
  from = from || {};
  tl.fromTo(target, { autoAlpha: 0, x: (from.x || 0) * 0.35, y: (from.y || 60) * 0.4, scale: 0.96, rotation: (from.r || 0) * 0.3, filter: "blur(14px)" }, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, filter: "blur(0px)", duration: 0.75, ease: "power3.out", immediateRender: false }, at);
}
function drift(target, at, len, amp, period) {
  if (len < 0.6) return;
  tl.fromTo(target, { y: 0 }, { y: -(amp || 6) * 0.6, duration: Math.max(0.4, len), ease: "sine.inOut", immediateRender: false }, at);
}
${KIT_JS}`;

// ---------------------------------------------------------------------------
// The kit outside the Ads Editor (the creator, 2026-09-30: "implement all the motion graphics, effects & sounds inside
// of the clipping editor system & the dope clips system as well").

/** First quoted example after `key =` in a template's field notes ('text = … (e.g. "Try it free")'). */
function example(fields, key) {
  const at = String(fields).search(new RegExp(`(^|[;.]\\s*|\\s)${key}\\s*=`));
  if (at < 0) return "";
  const seg = String(fields).slice(at).split(/;\s+(?=\w+\s*=)/)[0];
  return (seg.match(/"([^"]{1,90})"/) || [])[1] || "";
}

/** Hand-written starters where a template's notes describe a format rather than show one. */
const SAMPLES = {
  "task-board": { text: "Tasks · this week", sub: "Never wonder where anything stands.", highlight: "Tasks", items: ["Weekly ads report | Scheduled · Fri", "Follow up 23 leads | In progress", "Book Thursday consults | Done", "Launch March campaign | Needs approval"] },
  "schedule-clock": { text: "11:58 AM", sub: "Every Friday · weekly ads report", items: ["Fri", "Put it on a schedule.", "Never ask twice."] },
  "notif-stack": { text: "47 unread", sub: "Tue · 9:47 AM", highlight: "You're the doctor. / The front desk. / The marketer.", items: ["Phone | Missed call | New patient inquiry · no voicemail", "Leads | Lead waiting 3 days | Do you help with sciatica?", "Reviews | New 1-star review | Nobody called me back", "Email | 212 unread | Invoices, vendors, reminders"] },
  "chat-thread": { text: "New consult · 2:30 PM | Added to your calendar + CRM | THU 12", sub: "11:47 PM · Office closed", highlight: "Every lead answered. / Even now.", items: ["them: Hi, do you help with sciatica? Can't sleep.", "us: We do. I have Thursday at 9:00 or 2:30 open for a consult. Want one?", "them: 2:30 works!"] },
  "org-chart": { text: "CEO: You", sub: "COO: Atlas", highlight: "24/7. No call-offs. / No re-training.", items: ["Marketing", "Sales", "Client Success", "Finance"] },
  "agent-grid": { text: "Meet your new team", highlight: "AI employees. / Pre-trained.", sub: "Name them. Group-chat them. Add more anytime.", items: ["Executive Assistant | Calendar, email, reminders", "Setter | Follows up every lead", "Video Editor | Cuts and captions your ads", "Ads Specialist | Builds and tests campaigns"] },
  statement: { text: "You ask.", sub: "It does the work.", items: ["Atlas beta · live now", "-"] },
  "agent-log": { text: "Marketing Assistant", sub: "working now", highlight: "Each one / does the work.", items: ["Wrote 10 hooks for back pain", "Video Editor | 3 ads cut + captioned", "Ads Specialist | 2 ad sets built"] },
  "approval-card": { text: "Publish the back pain campaign?", sub: "3 videos · 10 hooks · 2 ad sets · $40/day", highlight: "You stay in / control.", items: ["Approve", "Live ✓", "Approval needed"] },
  "phone-report": { text: "ROAS 5.2x this week.", sub: "Landing page converting at 3%. I drafted 2 new headlines. Want me to test them?", highlight: "It reports. / Before you ask.", items: ["Atlas · Weekly ads report", "Test them", "Test running", "Friday, March 13", "11:58", "Every Friday · 11:58 AM · automatically"] },
  "chat-app": { text: "Launch a back pain campaign for March.", sub: "On it. Handing this to your team:", highlight: "You ask. / It does the work.", items: ["Marketing Assistant | 10 ad hooks written", "Video Editor | 3 ads cut + captioned", "Ads Specialist | Broad + lookalike ad sets built"] },
  "chain-stack": { text: "", items: ["You | CEO", "Atlas | COO", "Your AI team | 24/7"] },
  "app-window": { text: "Tasks | Looking through your knowledge", sub: "Never wonder where a task stands.", highlight: "Tasks", items: ["Diagnose the funnel bottleneck | Working | just now", "Send the May launch email | Approval needed | 12m ago", "Weekly ads report | Complete | 1h ago"] },
  "skill-cards": { text: "", sub: "Four built-in diagnosis specialists.", highlight: "Skills", items: ["Bottleneck Diagnosis | Built in", "VSL Conversion Diagnosis | Built in", "Ad Creative Review | Built in", "Offer Diagnosis | Built in"] },
  "tool-map": { text: "", sub: "Wired into the tools you already use.", highlight: "Connections", items: ["Meta Ads", "GoHighLevel", "Slack", "Gmail", "Google Calendar", "Stripe"] },
  "stat-rows": { text: "", items: ["24/7 | Always on", "0 | Call-offs", "1 | Click to approve"] },
  "bar-chart": { text: "Monthly revenue", highlight: "Mar", items: ["Jan: 12k", "Feb: 18k", "Mar: 31k"] },
  "search-cta": { text: "Start Your 7 Day Free Trial", sub: "atlas 7 day free trial", highlight: "app.atlas-ai.club", items: ["Atlas · AI employees for healthcare"] },
  "logo-sting": { text: "Your AI team, *working today*.", highlight: "Start Your 7 Day Free Trial", sub: "app.atlas-ai.club", items: ["ATLAS"] },
  "grid-fill": { text: "31% → 94%", sub: "of leads answered in 5 minutes", highlight: "With Atlas" },
  "dot-open": { text: "Stop doing *it all.*", sub: "", highlight: "01 / 03" },
  "word-wallpaper": { text: "Handled.", sub: "Calls, leads, follow-ups.", highlight: "Every day" },
  "ui-orbit": { text: "All of it.", sub: "*One* place.", items: ["Leads | 12 new", "Calendar | 3 booked", "Ads | live", "Follow-ups | sent", "Reviews | +4", "Payroll | done"] },
  "bar-proof": { text: "Bookings, *every* week.", sub: "consults booked / week", items: ["Jan | 12", "Feb | 18", "Mar | 26", "With Atlas | 40"] },
  "workflow-run": { text: "Lead agent", sub: "Execute workflow", highlight: "AI Agent", items: ["New lead | Trigger", "AI Agent | Qualifies the lead", "GoHighLevel | Saves the contact", "Reply | Instantly", "tool: Gemini", "tool: Memory", "tool: Calendar"] },
  "app-flythrough": { text: "Clinic dashboard", items: ["rings: 94% Leads answered; $48k Booked; 3% No-shows", "rows: Jane D. | Booked | Thu 2:30; Mark P. | Booked | Fri 9:00; Ana R. | No-show | Mon; Sam K. | Booked | Mon 11:00", "chart: 94% | 31 40 38 55 62 70 94"] },
  "frame-markup": { items: ["highlight: eyes", "title: Title Hook", "safe"] },
  "name-title": { text: "Dr. Odell Miller", sub: "founder of HBA Consulting" },
  "content-funnel": { text: "Clients", highlight: "0", sub: "@yourhandle", items: ["Reel", "Podcast clip", "Carousel", "Story", "Reel", "Live", "Reel", "Post", "Short"] },
  "mind-map": { text: "The plan", items: ["Dial in messaging", "Content formats", "Credibility hooks"] },
  "focus-count": { text: "tasks a day", items: ["Reply to Slack", "Clear the inbox", "*Run sales calls*", "Tidy the Notion board", "Rename Drive folders", "*Launch the new offer*", "Update CRM tags", "Answer DMs", "*Film this week's content*"] },
};

/** Starter content for a template added by hand (lifted from its own field notes), so it shows something right away. */
export function templateSample(t) {
  if (SAMPLES[t?.id]) return { text: "", sub: "", highlight: "", items: [], ...SAMPLES[t.id] };
  const f = t?.fields || "";
  const itemsSeg = (String(f).match(/items\s*=[^;]*/) || [""])[0];
  // Format notes ("number | label", "name | tag") aren't content.
  const generic = /^(number|label|value|name|tag|status|role|title|time|text|state|day|tool|agent|app|channel)$/i;
  const items = [...itemsSeg.matchAll(/"([^"]{1,90})"/g)].map((m) => m[1]).filter((x) => !x.split("|").every((p) => generic.test(p.trim()))).slice(0, 6);
  const said = (String(t?.use || "").match(/"([^"]{2,60})"/) || [])[1] || "";
  return { text: example(f, "text") || said.replace(/^./, (c) => c.toUpperCase()) || t?.name || "", sub: example(f, "sub"), highlight: example(f, "highlight"), items };
}

/** The whole kit as the clip editor's pickers need it: templates with their notes, samples and default sounds. */
export function kitCatalog() {
  return Object.values(TEMPLATES).map((t) => {
    const sample = templateSample(t);
    const duration = Math.max(2.5, t.minLen || 2);
    return {
      id: t.id, name: t.name, job: t.job, scene: t.scene || "none", use: t.use, fields: t.fields, position: t.position, minLen: t.minLen || 1.8,
      kit: KIT.includes(t), sample, duration, sfx: templateSfx(t, { ...sample, duration }),
    };
  });
}
