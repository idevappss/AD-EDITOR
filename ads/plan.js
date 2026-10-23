// The ad planner: Claude reads the transcript (every word numbered) and a few frames, then decides which takes
// to keep, what to cut, where the motion graphics, big glowing words and sound effects land, and the grade.
// Everything it returns is anchored to word numbers, so ads/build.js can place it on the cut timeline exactly.
// Without a key a plain heuristic still gives a clean, tightened ad with a few graphics.
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FFMPEG, ROOT, run } from "../lib/tools.js";
import { BANNED_SFX, CAMERA_MOVES, GRADES, KIT_REFERENCE, SFX, TRANSITIONS, templateCatalog } from "../motion/index.js";
import { editStyleOf } from "./styles.js";

/** The sounds the planner may use (never the banned ones). */
const SOUNDS = Object.keys(SFX).filter((k) => !BANNED_SFX.has(k));

const MODEL = "claude-opus-5-5";
const STYLE_FILE = path.join(ROOT, "ads", "STYLE.md");
const PRODUCTS_FILE = path.join(ROOT, "ads", "PRODUCTS.md");
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/**
 * How the call to action looks (the creator, 2026-09-29: "switch up the CTAs… randomize the styles and designs"). Each
 * ad gets one, never the same as the last two ads'. The words stay the offer's; only the design rotates.
 */
export const CTA_STYLES = {
  button: { name: "Glowing button", brief: 'a CTA moment (kind "cta"): the glowing pill button blurs in and a cursor clicks it.' },
  "search-cta": { name: "Search", brief: 'the search-cta template on the CTA line: the query types ("atlas 7 day free trial"), the result card drops, the cursor clicks the button. Perfect when the speaker says "search".' },
  "trial-pass": { name: "7-day pass", brief: 'the trial-pass template on the CTA line: seven day cells light up, then "7 days. / On us." and the button. Trial offer only (a call offer uses the end card instead).' },
  "end-card": { name: "End card", brief: 'the end-card template as a full-screen close on the CTA line, on the accent or dark tone.' },
  "logo-sting": { name: "Logo sting", brief: 'the logo-sting template as the full-screen close on the CTA line: a dot circle-wipes into the accent field, the mark and wordmark resolve, the tagline and the CTA pill land and hold.' },
  "wordmark-type": { name: "Wordmark", brief: 'the wordmark-type template as the close: the wordmark types itself and the offer line lands under it.' },
};
export const offerCtaStyles = (offer) => Object.keys(CTA_STYLES).filter((k) => !(offer === "call" && k === "trial-pass"));

/**
 * Creative directions (the creator, 2026-09-28: "switch up the style… get creative, I'm giving you creative freedom").
 * Every new ad gets one, never the same as the last two ads', so no two ads in a row look alike. Each is built from
 * one of the creator's reference ads (motion/references/atlas-motion-kit.md).
 */
export const DIRECTIONS = {
  "ink-ember": {
    name: "Ink & Ember",
    brief: "The V1 Light Trail feel: dark ink scenes with rising embers, calm and premium. Lead with trail-prompt (the ask typed out), then task-card / task-board / schedule-clock as the work happens, logo-rings for the reveal, wordmark-type to close. Mostly dark tone, fade and slide transitions.",
  },
  "kinetic-type": {
    name: "Kinetic Type",
    brief: "The V2 Kinetic feel: big type that moves. Word-swap with a punchline strike (\"Every missed call… Handled.\"), strike-swap on the old way, stat-rows for the numbers, a statement for the one-liner, card-carousel for what it does, end-card on the accent tone. Snappy pacing, circle and slide transitions.",
  },
  "product-demo": {
    name: "Product Demo",
    brief: "The Atlas AI Demo feel: show the product working. chat-app (ask → team → approve → live), chat-thread (a lead answered at midnight), agent-log, approval-card, phone-report (it reports before you ask), mostly on the paper tone, with one accent beat. Wipe and slide transitions.",
  },
  "command-center": {
    name: "Command Center",
    brief: "The Jeremy AI demo feel: the operating system view. status-flood (Working → Approval needed → Ready for review → Complete), app-window with the scan line, tool-map of the integrations, skill-cards for the specialists, voice-ring for calls, schedule-clock rolling. Dark tone, glitch and slide transitions, fast beats.",
  },
  "team-orbit": {
    name: "Team & Orbit",
    brief: "The V3 Orbit feel: a whole team around one brain. orbit-network (always paper), agent-grid on the accent tone, chain-stack (You → Atlas → the team), org-chart, notif-stack for the before-picture, agent-log for one agent at work. Mix paper, dark and one accent beat; circle and wipe transitions.",
  },
  "quiet-luxury": {
    name: "Quiet Luxury",
    brief: "Minimal and confident: few graphics, all of them big. The speaker carries it with camera moves; 2 full-screen scenes at most (a statement and logo-rings or wordmark-type), plus the numbers. Lots of empty space, slow fades, no busy UI.",
  },
  "master-edit": {
    name: "Master Edit",
    brief: "The creator's master reference (motion/references/sound-study.md, 2026-10-23): a cinematic talking head that stays on the speaker most of the time with clean word-by-word captions. Introduce the speaker early with name-title. Every money figure is a number moment (it counts up white, with a small italic line under it). Mark the captions: reported speech as quote, the one or two phrases the ad turns on as caps, one twist as box. Cut away to at most two full-screen scenes on what the product changes: content-funnel for content that goes nowhere, mind-map for the plan or the steps, focus-count for doing less. Go into the biggest scene with the blur transition, or put one blur cut hit on the big turn. Punch in on the key lines; no flashes, glitches or shakes.",
  },
  "screen-dive": {
    name: "Screen Dive",
    brief: "The creator's reference reels (2026-10-22, motion/references/reel-study.md): show the system itself, shot like a screen. Dive (the dive transition) from the speaker into app-flythrough, the product as a dark app filling in with results, and into workflow-run, the automation firing node by node with a hot pulse along the wires. On the speaker, teach with frame-markup (a highlighter swipe, a title pill, a dashed eyeline) on the exact words. 2 full-screen scenes at most; everything else stays on the speaker with clean centred captions.",
  },
  "director-punch": {
    name: "Director Punch",
    brief: "The motion-graphics-director showreel feel (2026-09-30): nearly nothing, then everything. Open a hard claim with dot-open (one dot floods the frame, the words slam in), hammer the key word with word-wallpaper, prove it with numbers that move (grid-fill for a share or before → after, bar-proof for a climb with the last bar in the accent), gather everything it handles with ui-orbit, and close on logo-sting. Type is the hero: huge, tight, one *italic serif* accent word per headline at most. Cut between full-bleed fields on the beat: accent and dark tones, circle and wipe transitions. One idea per beat; never hold a beat after it has landed.",
  },
};

/**
 * How an ad ends (the creator picks per upload, 2026-09-28): the ATLAS 7-day free trial, or a booked call. Every CTA,
 * end card and closing lockup sells that one offer and never mentions the other.
 */
export const OFFERS = {
  trial: {
    label: "ATLAS · 7-day free trial",
    cta: "Start Your 7 Day Free Trial",
    brief: "End on a CTA: start your 7-day free trial of ATLAS (app.atlas-ai.club).",
    rule: "This ad sells the ATLAS 7-day free trial. The CTA button says \"Start Your 7 Day Free Trial\" (a sonar-cta says \"7 DAY FREE TRIAL\"); an end-card reads \"Try it free / for 7 days.\" with the button \"app.atlas-ai.club\"; a wordmark-type closes on \"7-day free trial · app.atlas-ai.club\". Never say \"book a call\" anywhere in the graphics.",
  },
  call: {
    label: "Book a call",
    cta: "Book a call",
    brief: "End on a CTA: book your free call.",
    rule: "This ad sells a free call with the team. The CTA button says \"Book a call\" (or \"Book your free call\"); an end-card reads \"Book your / free call.\" with the button \"Book a call\" and a kicker like \"Limited spots this week\"; a wordmark-type closes on \"Book your free call · link below\". Never mention a free trial or app.atlas-ai.club in the graphics.",
  },
};
export const offerOf = (options) => (OFFERS[options?.offer] ? options.offer : "trial");

/** Applied to every edit, first (the creator's standing instructions; the tab's idea chips). */
export const STANDING_BRIEF = [
  "Cut every retake and flub, keep only the best takes.",
  "Make it punchy: under 30 seconds.",
  "Pop up the key numbers big.",
  "List the 3 main points as a checklist.",
  "Open with the strongest hook.",
];

export const hasClaudeKey = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const Anchor = { at: z.number().int().describe("word number where it starts"), until: z.number().int().describe("word number where it ends (inclusive)") };
const Schema = z.object({
  title: z.string().describe("3–6 word name for this ad"),
  summary: z.string().describe("2–3 plain sentences to the creator: what you cut and what you added; on a re-edit, exactly what you changed per their note"),
  keep: z.array(z.object({ from: z.number().int(), to: z.number().int(), why: z.string() })).describe("word ranges to keep, in the order they play"),
  graphics: z.array(
    z.object({
      ...Anchor,
      kind: z.enum(["logos", "number", "checklist", "cta", "proof", "check", "template", "slide"]),
      slide: z.string().describe("slide: the id of one of the creator's slides; otherwise empty"),
      template: z.string().describe("template: the id from the template library; otherwise empty"),
      proof: z.string().describe("proof: the testimonial id; otherwise empty"),
      logos: z.array(z.string()).describe("logos: 1–3 logo ids shown together; number: empty"),
      strike: z.boolean().describe("logos: true ONLY when the speaker's own words put these tools down (\"stop using ChatGPT\", \"Claude just gives you more work\", \"it wasn't built for you\", \"you're being left behind\"); a neutral mention (\"like ChatGPT and Claude\", \"if you've used ChatGPT\") is false, no X; number: false"),
      text: z.string().describe("cta: the button's action (\"Start Your 7 Day Free Trial\"); checklist: a short kicker like \"What you get\"; number: starts with the number as it should count up, e.g. \"7 days free\", \"$100k/mo\", \"3X\"; logos: usually empty"),
      sub: z.string().describe("number: a short line under it (2–5 words) or empty; logos: empty"),
      items: z.array(z.string()).describe("checklist: 2–4 short items (2–5 words each) that tick in one by one, with the one key word wrapped in *stars* (e.g. \"7 days *free*\", \"*Free* onboarding guide\"); template: as its catalog entry says; otherwise empty"),
      highlight: z.string().describe("template: as its catalog entry says (usually a two-tone headline as \"line 1 / line 2\", or a lower-third label); otherwise empty"),
      fullscreen: z.boolean().describe("template only: true = cut away from the speaker to a full-screen scene on the kit's ground while the voice carries on (templates marked 'can be full-screen'); false otherwise"),
      tone: z.enum(["dark", "accent", "paper"]).describe("full-screen scenes: dark (warm ink with embers, the default), accent (full-bleed coral, one contrast beat such as the hook or end card) or paper (light cream with white cards: chat, orbit, approval scenes); dark otherwise"),
      transition: z.enum(TRANSITIONS).describe("full-screen scenes: how it comes in (slide up, wipe up, fade, a circle reveal from the centre for a big moment, a quick glitch cut, blur: the master edit's soft blur crossfade into a big moment, or dive: through the screen with an RGB split, for app-flythrough and workflow-run, best right after the speaker shows a laptop or phone); vary them"),
    }),
  ).describe("logo moments and number moments, never overlapping"),
  sfx: z.array(z.object({ at: z.number().int(), sound: z.enum(SOUNDS) })).describe("extra sound effects; usually just the hook impact"),
  camera: z.array(z.object({ ...Anchor, move: z.enum(CAMERA_MOVES) })).describe("intentional camera moves and cut hits on the lines that matter"),
  caption_marks: z.array(z.object({ ...Anchor, kind: z.enum(["quote", "caps", "box"]) })).describe("caption emphasis: quote = reported speech in italics, caps = one key phrase big in capitals, box = a red box behind one phrase; few and exact"),
  voice_fx: z.array(z.object({ ...Anchor, effect: z.enum(["muffle", "phone"]) })).describe("always an empty list: the creator wants the voice clean, never muffled or filtered"),
  sound: z.object({
    level: z.enum(["quiet", "normal", "punchy"]).describe("how much sound design overall; quiet when the creator says it's too much"),
    avoid: z.array(z.enum(SOUNDS)).describe("sounds the creator doesn't want anywhere in this ad"),
  }),
  auto_numbers: z.boolean().describe("false only when the creator asks to drop number cards; otherwise every money figure / 24/7 / trial length gets one automatically"),
  not_done: z.string().describe("anything the creator asked for that you couldn't do with these controls, in one plain sentence; empty if everything was done"),
  grade: z.enum(Object.keys(GRADES)),
  music: z.boolean().describe("a quiet instrumental bed under the talking"),
});

const SYSTEM = `You edit short paid social ads for a healthcare-business creator whose audience is doctors, chiropractors and physical therapists growing their practice. The raw footage is the speaker talking to camera, often with several takes of the same line, flubs and chatter between takes.

Your job, in order:
1. THE CUT. Keep only what sells. Be ruthless: once the value lines are said, jump straight to the final clean call-to-action take; everything between them (early or repeated CTAs, "learn how… implement… learn how" restarts, re-explaining) goes. When a line is said more than once, keep only the best complete take, the one that makes the most sense — usually the last one — and never keep the same footage in two places. The call to action is said exactly once, and the ad ends when the CTA line is finished — the whole line, never cut short ("…click below and get your AI employees started in your business today.", "…seven day free trial", "…and learn more") — and nothing after it ("or decide to be left behind", "Atlas is going to change your life", "see you inside"). The ad opens on the first word of the hook, with no stray fragment of another take before it. Drop false starts, stumbles, repeated words, "let me do that again", "okay", "cut", counting in, chatter to the crew, dead air, and anything off-message. Never keep half a sentence. Keep the natural order unless a stronger hook later in the footage should open the ad; the first two seconds must stop the scroll. Tight: a paid ad is usually 20–60 seconds.
2. GRAPHICS. The look is the creator's "Atlas kit" (<house_style> and the catalog): minimal and calm. Dark warm glass with a thin accent hairline, small mono kickers, two-tone lines (cream, then the accent), soft blur-ins, slow 3D settles, and nothing that bounces or pops. Never stickers, emojis, badges or random glowing words. One idea on screen at a time.
 A) NUMBER moments (kind "number"): when the speaker says a number that sells (a price, a free trial length, money made, "24/7", a multiplier, a time saved), a big number card pops in on the word and counts up to it, then pops out. The creator loves these: EVERY money figure, "24/7" and free-trial length in the cut gets one. Never swap them for a checklist.
 C) CHECKLIST moments (kind "checklist"): when the speaker runs through what you get, the benefits or the steps, a glass task card lists them and ticks each one green as it's said (2–4 items, 2–5 words each, a short kicker as text). The creator loves these too. At most one or two per ad.
 D) CTA moment (kind "cta"): when the speaker tells viewers to click, tap, comment or book ("click below"), a glowing pill button blurs in and a mouse cursor clicks it with a click sound. (The kit's end-card template is the alternative close: the offer and URL full-screen; rotate between them.) text = the action ("Start Your 7 Day Free Trial"; "Book a call" only when the offer is a call); sub = empty. Once per ad, on the exact words.
 F) CHECK moments (kind "check"): one big glowing check in a circle on an affirming line: "all you have to do is say yes", "that's it", "done", "it just works". text = one short word under it ("YES", "DONE") or empty. Never a checklist for these.
 G) TEMPLATE moments (kind "template"): the template library below. The "Atlas kit" templates are the creator's favourites (studied from their own motion ads): the light-trail prompt, task card, approval click, task board, schedule clock, word swap, strike & replace, notification pile-up, 3D card carousel, stat rows, logo rings, chat thread, org chart, agent grid, two-tone statement and end card. Reach for those first. Use 3–5 template moments per ad where they genuinely fit what's said, never the same template twice in one ad, and prefer ones NOT used in the creator's recent ads (listed below) so no two ads look the same. Fill the fields exactly as the catalog says; write every word in the product's voice (<products>): short, declarative, full stops.
 SCENES (fullscreen = true): a kit template marked "can be full-screen" can cut away from the speaker to its own full-screen scene while the voice carries on, like a B-roll beat made of motion graphics. Use 1–3 per ad, 1.5–4 s each, on lines that describe what the product DOES (the prompt, the task card, the carousel, the chat, the org chart, the agent grid), never in the first 2 seconds and never two in a row. Everything else floats over the speaker. Tones, as in the creator's Remotion ads: "dark" (warm ink, embers) for most; "paper" (light cream, white cards) for the chat, chat app, orbit, agent log and approval scenes; "accent" (full-bleed coral) for one contrast beat at most (a hook strike, the agent grid, the end card). Vary the transition between scenes: slide, wipe, fade, circle (for the reveal) or glitch (a quick cut, no sound).
 H) SLIDE moments (kind "slide"): one of the creator's own slides (shown as images above, with ids) floats in as a framed card while the speaker says what it shows: pricing on the price, the org chart on "a team of agents", integrations on "plugs into your tools". 0–2 per ad, only when a slide truly matches the words; rotate which slides you use.
 E) PROOF moments (kind "proof"): a real member's win pops up as a notification card, to back up a claim with social proof. 1–2 per ad, on lines about results, time saved or how it feels to use (never over the hook's first 3 seconds, never over the CTA). proof = the testimonial id; pick the one that matches what's being said.
 B) LOGO moments (kind "logos"): when the speaker names a brand the creator uploaded a logo for, its logo pops up, transparent, in the headroom above their head, on the exact word:
   - Other tools (ChatGPT, Claude…) named together get one moment side by side (logos = both ids). The fat X (strike = true) is ONLY for when the speaker clearly knocks them: tells you not to use them, says they're not good enough, don't do the work, weren't built for you, leave you behind ("stop using ChatGPT", "Claude just gives you more work"). When they're only named or compared in passing ("large language models like ChatGPT and Claude", "if you've tried ChatGPT"), show them without the X, or skip the moment. The creator (2026-09-29): "only do it where it makes the most sense."
   - The product being sold ("It's called Atlas"): a single hero logo (strike = false) held while they talk about it, 2–5 seconds.
   - Name each logo moment from "at" (the brand's first word) to "until" (the end of that thought). Never two moments at once.
3. CAMERA. These are ads: attention is everything, above all in the first 5–10 seconds. Mark intentional moves on the lines that matter: "punch" (a hard jump in tight on a claim, a number, a reveal, the product name), "push" (a slow push-in while they build tension or tell the problem), "pull" (a jump back wide for a reset, a big gesture, the CTA). Put 2–4 moves in the first 8 seconds, then one every 3–6 seconds. Anchor each on its words. Never on a graphic moment (the shot opens up there automatically).
 CUT HITS are short effects on the footage itself, each with its own sound, that make a cut or a key word hit (like FastFX / CapCut retention edits). Use 2–4 per ad, spread out, never two in a row of the same kind, never on a graphic, and rotate away from the ones the creator's recent ads used (listed with the templates):
   - "whip": a fast whip-pan with motion blur, on a jump cut between two ideas (anchor on the first word after the cut).
   - "zoom-blur": a fast zoom punch with blur into a big claim or reveal ("…and that's when it hit me").
   - "flash": a bright flash on a section change or the product reveal.
   - "shake": a short impact shake on a hard word ("never", "every single day", a painful number).
   - "bw": a black-and-white beat for the pain or the "old way" line (hold it for that phrase, 0.6–1.5 s).
   - "rgb": a colour split on "AI", "automated", "system", or a twist (it carries a soft air sound; never a glitch sound).
   - "blur": the master edit's soft blur crossfade, the picture blurring and brightening for half a second as a riser peaks, into a big turn or reveal ("but here's the catch", "so let's get into it"). At most one per ad.
 Retention: in a short ad something should change every 1.5–3 seconds (a cut, a move, a hit or a graphic), and by 10 seconds at least 4 different visuals should have appeared.
8. CAPTION MARKS (caption_marks), as in the creator's master edit. The captions stay plain white words; a few phrases get marked, on their exact words:
   - "quote": words the speaker quotes or acts out, someone else's voice or thought ("oh, if ads are working so well…", "why would I do this?", "yeah, so good"). Up to 3 per ad, each the quoted words only.
   - "caps": the one or two phrases the whole ad turns on, 1–3 words each ("content strategy", "paid ads", "done for you"). Shown big in capitals. At most 2.
   - "box": a red box behind the twist, 1–3 words ("the catch", "the problem", "for free"). At most 1.
   Never mark more than one phrase in the same sentence, never in the CTA, and leave the list empty when nothing earns it.
7. VOICE FX (voice_fx): none, ever. The voice always plays clean: no muffle, phone or underwater effect (the creator: it makes the voice "go off" and takes the words away). Leave voice_fx empty.
4. SOUND. Logo moments get their own sounds automatically. Add one low impact (impact-bass-1) on the first big claim in the hook, and nothing on ordinary jump cuts.
5. GRADE (ignored when the creator has their own LUT, which is applied instead). Look at the frames: restore for flat, grey, low-contrast log footage (washed out, almost no colour); clean for already-good studio light; punchy for dull footage; warm for a premium or personal feel; cinematic for moody footage.
6. Music and captions follow the creator's switches.

When <house_style> is given, it is the creator's own reference edit: follow it for pacing, cuts and sound design — but its minimal-logos rule above always holds, and so does the creator's request.

The creator's own instructions win over every rule above. Anchors are word numbers from the transcript; "at" and "until" must be inside a kept range. A word marked ⚠long lasts far longer than it should, which usually hides chatter the transcript missed ("hold on", a restart); end the kept range on the word before it unless the thought needs it.`;

/** How long a word can plausibly take to say; longer usually hides something the transcript missed. */
export const longWord = (w) => Math.max(0.6, 0.12 * String(w.text || "").length + 0.25);

/** The transcript as numbered words, a line per thought, with times so takes are easy to see. */
export function numberedTranscript(words) {
  const lines = [];
  let line = [];
  const flush = () => {
    if (!line.length) return;
    const first = line[0];
    lines.push(`[${first.w.start.toFixed(1)}s] ${line.map((x) => `${x.i}:${clean(x.w.text)}${x.w.end - x.w.start > longWord(x.w) ? "⚠long" : ""}`).join(" ")}`);
    line = [];
  };
  words.forEach((w, i) => {
    const gap = i > 0 ? w.start - words[i - 1].end : 0;
    if (line.length && (gap > 0.7 || line.length >= 18)) flush();
    line.push({ w, i });
    if (/[.?!]$/.test(String(w.text)) && line.length >= 4) flush();
  });
  flush();
  return lines.join("\n");
}

async function frame(src, at, out, signal) {
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-ss", String(at), "-i", src, "-frames:v", "1", "-vf", "scale=512:-2", "-q:v", "5", "-y", out], { signal });
  return fs.readFile(out, { encoding: "base64" });
}

const KIT_FILE = KIT_REFERENCE;
/** The house style, then the creator's favourite motion language (the Atlas kit) that every graphic follows. */
const styleNotes = async () => {
  const [style, kit] = await Promise.all([STYLE_FILE, KIT_FILE].map((f) => fs.readFile(f, "utf8").then((s) => s.trim(), () => "")));
  return [style, kit].filter(Boolean).join("\n\n");
};
const productNotes = () => fs.readFile(PRODUCTS_FILE, "utf8").then((s) => s.trim(), () => "");

/**
 * Plan the ad.
 * @param words     the transcript [{ text, start, end }]
 * @param prompt    what the creator asked for
 * @param videoFile a playable copy of the footage (for frames)
 */
export async function planAd({ ctaStyle = null, direction = null, slides = [], recentTemplates = [], previous = null, testimonials = [], lessons = [], words, prompt = "", duration, aspect, videoFile, tmpDir, signal, luts = [], logos = [], options = {} }) {
  if (!hasClaudeKey()) return fallback(words, "Claude isn't connected, so this is a clean tighten with logos where they're named.", logos);
  // The simple talking-head style (ads/styles.js) only uses the cut and the camera punches: Claude isn't shown the
  // graphics it would plan (slides, templates, testimonials, the CTA design) or asked for numbers and checklists.
  const simple = Boolean(editStyleOf(options)?.simple);
  if (simple) [slides, testimonials, ctaStyle, direction] = [[], [], null, null];
  const standing = simple ? STANDING_BRIEF.filter((l) => /retake|hook/i.test(l)) : STANDING_BRIEF;
  const content = [];
  try {
    await fs.mkdir(tmpDir, { recursive: true });
    for (const [i, f] of [0.12, 0.5, 0.85].entries()) {
      const data = await frame(videoFile, (duration * f).toFixed(2), path.join(tmpDir, `f${i}.jpg`), signal);
      content.push({ type: "text", text: `Frame at ${Math.round(duration * f)}s` }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }
  // The creator's slides, small, so a slide can be matched to what's said.
  for (const sl of slides.slice(0, 24)) {
    try {
      const out = path.join(tmpDir, `slide-${sl.id}.jpg`);
      await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", sl.path, "-vf", "scale=320:-2", "-q:v", "6", "-y", out], { signal });
      content.push({ type: "text", text: `Slide ${sl.id}: ${sl.name}` }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: await fs.readFile(out, { encoding: "base64" }) } });
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }
  const style = await styleNotes();
  const products = await productNotes();
  content.push({
    type: "text",
    text: `Footage: ${Math.round(duration)}s, finished ad is ${aspect}.
${logos.length ? `Logos the creator uploaded: ${logos.map((l) => `${l.id} = ${l.name}`).join("; ")}\n` : "No logos uploaded for this ad, so skip logo moments; numbers, checklists and the CTA still apply.\n"}Captions are ${options.captions ? "on" : "off"}; music bed is ${options.music ? "on" : "off"} (the creator's switches — don't fight them).
${luts.length ? `The creator also has their own LUTs in Assets (${luts.map((l) => l.title).join(", ")}); pick the closest built-in grade anyway.\n` : ""}
${previous ? `<previous_edit>\nThis is a RE-EDIT. The creator watched this version and wrote the request below as a correction. Start from it: apply exactly what they ask, keep everything they didn't mention (same takes, same graphics, same moves), and don't reinvent the ad.\n${previous}\n</previous_edit>\n\n` : ""}<standing_brief>
The creator wants every ad edited with these, always (their request below adds to them and wins where it differs):
${[...standing, OFFERS[offerOf(options)].brief].map((l) => `- ${l}`).join("\n")}
</standing_brief>

<creator_request>
${clean(prompt) || "Make this into a scroll-stopping ad."}
</creator_request>
${style ? `\n<house_style>\n${style}\n</house_style>\n` : ""}${products ? `\n<products>\n${products}\n</products>\n` : ""}\n<offer>\n${OFFERS[offerOf(options)].rule}\n</offer>\n\n${CTA_STYLES[ctaStyle] ? `<cta_style>\nThis ad's call to action is designed as "${CTA_STYLES[ctaStyle].name}": ${CTA_STYLES[ctaStyle].brief} Put it on the final CTA words (the offer's wording above), once, and no other CTA graphic in the ad. The creator wants every ad's CTA to look different from the last ones, so use this design, and write its lines fresh.\n</cta_style>\n\n` : ""}${DIRECTIONS[direction] ? `<creative_direction>\nThis ad's creative direction is "${DIRECTIONS[direction].name}": ${DIRECTIONS[direction].brief}\nBuild the ad around it: 3–5 template moments, most of them from this family, 2–4 of them full-screen scenes where the words describe what the product does (the numbers, checklist and CTA rules above still apply). You have creative freedom inside the kit: write fresh two-tone headlines and kickers in the product's voice, pair scenes (an orbit-network pushing into an agent-log, a notif-stack before a status-flood), vary tones and transitions. Make it look different from the creator's recent ads.\n</creative_direction>\n\n` : ""}${editStyleOf(options) ? `<editing_style>\nThe creator picked the "${editStyleOf(options).name}" editing style for this ad: ${editStyleOf(options).brief} This overrides any general guidance above about how busy or how calm the edit should be.\n</editing_style>\n\n` : ""}${simple ? "" : `<template_library>\n${templateCatalog()}\nUsed in the creator's recent ads (avoid these this time if another fits): ${recentTemplates.join(", ") || "none yet"}\n</template_library>\n`}${testimonials.length ? `\n<testimonials>\n${testimonials.map((t) => `${t.id}: ${t.name} (${t.product}): "${t.line}"`).join("\n")}\n</testimonials>\n` : ""}${lessons.length ? `\n<creator_corrections>\nWhat the creator told you after earlier ads, and what they fixed by hand in the timeline (words they put back or cut, graphics they added, removed or changed, sounds). These are lessons for every ad, not just the one they were about: learn the pattern behind each fix and apply it to this footage:\n${lessons.map((l) => `- (${l.ad}) ${clean(l.prompt)}`).join("\n")}\n</creator_corrections>\n` : ""}
<transcript>
${numberedTranscript(words)}
</transcript>

Plan the ad.`,
  });

  try {
    const stream = new Anthropic().beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 32000,
        thinking: { type: "adaptive" },
        output_config: { effort: "high", format: betaZodOutputFormat(Schema) },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: SYSTEM,
        messages: [{ role: "user", content }],
      },
      { signal },
    );
    const out = (await stream.finalMessage()).parsed_output;
    if (!out?.keep?.length) throw new Error("Claude's plan came back without any footage to keep.");
    return { ...out, by: "claude" };
  } catch (err) {
    if (err?.name === "AbortError" || signal?.aborted) throw err;
    return fallback(words, `Claude couldn't plan this one (${String(err.message).split("\n")[0]}), so this is a clean tighten with logos where they're named.`, logos);
  }
}

// ---------------------------------------------------------------------------
// No key: keep everything (the tightener still drops "um"s and dead air) and put logos up where they're named.

function fallback(words, notice, logos = []) {
  const n = words.length;
  const sentences = [];
  let from = 0;
  words.forEach((w, i) => {
    if (/[.?!]$/.test(String(w.text)) || i === n - 1 || (words[i + 1] && words[i + 1].start - w.end > 0.8)) {
      sentences.push({ from, to: i, text: words.slice(from, i + 1).map((x) => x.text).join(" ") });
      from = i + 1;
    }
  });
  // Logos where their names are said: every brand said before the last one is dismissed, the last is the hero.
  const graphics = [];
  const said = logos.map((l) => ({ l, i: words.findIndex((w) => String(w.text).toLowerCase().replace(/[^a-z0-9]/g, "") === l.name.toLowerCase().replace(/[^a-z0-9]/g, "")) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
  if (said.length) {
    const hero = said.at(-1);
    const rivals = said.slice(0, -1);
    if (rivals.length) graphics.push({ kind: "logos", at: rivals[0].i, until: Math.min(rivals[0].i + 8, hero.i - 1), logos: rivals.map((x) => x.l.id), strike: true, text: "" });
    graphics.push({ kind: "logos", at: hero.i, until: Math.min(hero.i + 10, n - 1), logos: [hero.l.id], strike: false, text: "" });
  }
  const first = sentences[0];
  return {
    title: first ? first.text.split(/\s+/).slice(0, 5).join(" ") : "New ad",
    summary: notice,
    keep: n ? [{ from: 0, to: n - 1, why: "everything" }] : [],
    graphics,
    sfx: [],
    camera: [],
    voice_fx: [],
    sound: { level: "normal", avoid: [] },
    auto_numbers: true,
    not_done: "",
    grade: "restore",
    music: true,
    by: "fallback",
    notice,
  };
}
