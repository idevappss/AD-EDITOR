// The motion-graphic template library. Each template is a self-contained look the planner can pick by job and
// rotate across ads: its HTML, CSS (added once per composition), GSAP timeline code, sound design, and a note on when
// to use it. ads/graphics.js draws them (look = template id); ads/plan.js shows Claude the catalog.
//
// Template shape:
//   id, name, job ("data" | "proof" | "product" | "benefit" | "cta" | "transition"), use (when to use it, for Claude),
//   fields (what text/sub/items mean), position ("top" | "center" | "bottom"), anchor ("number" | "cta" | null),
//   sfx [[sound, seconds after start, volume]], minLen seconds,
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

export const TEMPLATES = Object.fromEntries([barChart, lineChart, notification, typingPrompt, glassCard, network, sonarCta, lightLeak,
  glassNotif, appCard, serviceStack, glowPulse, profileFollow, percentCircle, trendLine, loadingBar, countdownRing, commentPill].map((t) => [t.id, t]));

/** The catalog as Claude sees it. */
export function templateCatalog() {
  return Object.values(TEMPLATES)
    .map((t) => `- ${t.id} (${t.job}): ${t.use} Fields: ${t.fields}`)
    .join("\n");
}

/** Shared motion: Topview-style float-enter (fly in from an offset, overshoot, settle) and idle drift. */
export const FLOAT_IN = `function floatIn(target, at, from) {
  from = from || {};
  tl.fromTo(target, { autoAlpha: 0, x: from.x || 0, y: from.y || 60, scale: 0.08, rotation: from.r || 0 }, { autoAlpha: 1, x: 0, y: 0, scale: 1.08, rotation: from.r ? from.r * 0.2 : 0, duration: 0.58, ease: "expo.out", immediateRender: false }, at);
  tl.to(target, { scale: 1, duration: 0.28, ease: "sine.out" }, at + 0.58);
}
function drift(target, at, len, amp, period) {
  if (len < 0.6) return;
  tl.fromTo(target, { y: 0, rotation: 0 }, { y: -(amp || 6), rotation: (amp || 6) * 0.25, duration: Math.max(0.4, len), ease: "sine.inOut", immediateRender: false }, at);
}`;
