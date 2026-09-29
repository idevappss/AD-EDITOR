// The motion-graphic template library. Each template is a self-contained look the planner can pick by job and
// rotate across ads: its HTML, CSS (added once per composition), GSAP timeline code, sound design, and a note on when
// to use it. ads/graphics.js draws them (look = template id); ads/plan.js shows Claude the catalog.
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
// packs, Topview's float-enter and glass stroke, FastFX's cut hits (ads/references/sites.md), the Apple/glass UI
// study (ads/references/glass-ui.md: glass-notif, app-card, service-stack, glow-pulse, profile-follow) and the
// retention study (ads/references/retention-transitions.md: percent-circle, trend-line, loading-bar,
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
// The Atlas motion kit (ads/references/atlas-motion-kit.md), 2026-09-28: the creator's favourite minimal look.
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
import { KIT_JS } from "./_parts.js";

/** The kit templates, first in the catalog: the planner reaches for these before the older looks. */
export const KIT = [trailPrompt, taskCard, approvalPill, taskBoard, scheduleClock, wordSwap, strikeSwap, notifStack, cardCarousel, statRows,
  logoRings, chatThread, orgChart, agentGrid, statement, endCard, orbitNetwork, agentLog, approvalCard, phoneReport, chatApp, chainStack,
  wordmarkType, statusFlood, appWindow, skillCards, toolMap, voiceRing, searchCta, trialPass];

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
