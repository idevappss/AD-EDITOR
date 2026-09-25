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
import { GRADES, SFX } from "./graphics.js";
import { templateCatalog } from "./templates/index.js";

const MODEL = "claude-opus-5-5";
const STYLE_FILE = path.join(ROOT, "ads", "STYLE.md");
const PRODUCTS_FILE = path.join(ROOT, "ads", "PRODUCTS.md");
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Applied to every edit, first (the creator's standing instructions; the tab's idea chips). */
export const STANDING_BRIEF = [
  "Cut every retake and flub, keep only the best takes.",
  "Make it punchy: under 30 seconds.",
  "Pop up the key numbers big.",
  "End on a CTA: Book your free call.",
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
      strike: z.boolean().describe("logos: true = alternatives being dismissed, a fat X slams across them; number: false"),
      text: z.string().describe("cta: the button's action (\"Book a call\"); checklist: a short kicker like \"What you get\"; number: starts with the number as it should count up, e.g. \"7 days free\", \"$100k/mo\", \"3X\"; logos: usually empty"),
      sub: z.string().describe("number: a short line under it (2–5 words) or empty; logos: empty"),
      items: z.array(z.string()).describe("checklist: 2–4 short items (2–5 words each) that tick in one by one, with the one key word wrapped in *stars* (e.g. \"7 days *free*\", \"*Free* onboarding guide\"); otherwise empty"),
    }),
  ).describe("logo moments and number moments, never overlapping"),
  sfx: z.array(z.object({ at: z.number().int(), sound: z.enum(Object.keys(SFX)) })).describe("extra sound effects; usually just the hook impact"),
  camera: z.array(z.object({ ...Anchor, move: z.enum(["punch", "push", "pull", "shake", "zoom-blur", "whip", "flash", "bw", "rgb"]) })).describe("intentional camera moves and cut hits on the lines that matter"),
  voice_fx: z.array(z.object({ ...Anchor, effect: z.enum(["underwater", "muffle", "phone"]) })).describe("voice effects as punctuation; usually 0–1 per ad"),
  sound: z.object({
    level: z.enum(["quiet", "normal", "punchy"]).describe("how much sound design overall; quiet when the creator says it's too much"),
    avoid: z.array(z.enum(Object.keys(SFX))).describe("sounds the creator doesn't want anywhere in this ad"),
  }),
  auto_numbers: z.boolean().describe("false only when the creator asks to drop number cards; otherwise every money figure / 24/7 / trial length gets one automatically"),
  not_done: z.string().describe("anything the creator asked for that you couldn't do with these controls, in one plain sentence; empty if everything was done"),
  grade: z.enum(Object.keys(GRADES)),
  music: z.boolean().describe("a quiet instrumental bed under the talking"),
});

const SYSTEM = `You edit short paid social ads for a healthcare-business creator whose audience is doctors, chiropractors and physical therapists growing their practice. The raw footage is the speaker talking to camera, often with several takes of the same line, flubs and chatter between takes.

Your job, in order:
1. THE CUT. Keep only what sells. Be ruthless: once the value lines are said, jump straight to the final clean call-to-action take; everything between them (early or repeated CTAs, "learn how… implement… learn how" restarts, re-explaining) goes. When a line is said more than once, keep only the best complete take — usually the last one. Drop false starts, stumbles, repeated words, "let me do that again", "okay", "cut", counting in, chatter to the crew, dead air, and anything off-message. Never keep half a sentence. Keep the natural order unless a stronger hook later in the footage should open the ad; the first two seconds must stop the scroll. Tight: a paid ad is usually 20–60 seconds.
2. GRAPHICS — only four kinds, and the look stays minimal: never titles, headlines, text cards, badges or glowing words.
 A) NUMBER moments (kind "number"): when the speaker says a number that sells (a price, a free trial length, money made, "24/7", a multiplier, a time saved), a big number card pops in on the word and counts up to it, then pops out. The creator loves these: EVERY money figure, "24/7" and free-trial length in the cut gets one. Never swap them for a checklist.
 C) CHECKLIST moments (kind "checklist"): when the speaker runs through what you get, the benefits or the steps, a card ticks the items in one by one as they're said (2–4 items, 2–5 words each, a short kicker as text). The creator loves these too. At most one or two per ad.
 D) CTA moment (kind "cta"): when the speaker tells viewers to click, tap, comment or book ("click below"), a button pops up and a mouse cursor clicks it with a click sound. text = the action in 2–4 words ("Book a call", "Start free trial"); sub = empty. Once per ad, on the exact words.
 F) CHECK moments (kind "check"): one big glowing check in a circle on an affirming line: "all you have to do is say yes", "that's it", "done", "it just works". text = one short word under it ("YES", "DONE") or empty. Never a checklist for these.
 G) TEMPLATE moments (kind "template"): the template library below: charts, a notification, an AI prompt typing, a glass card, a network of connections, a sonar CTA, a light-leak transition. Use 2–4 per ad where they genuinely fit what's said, never the same template twice in one ad, and prefer ones NOT used in the creator's recent ads (listed below) so no two ads look the same. Fill its fields as the catalog says.
 H) SLIDE moments (kind "slide"): one of the creator's own slides (shown as images above, with ids) floats in as a framed card while the speaker says what it shows: pricing on the price, the org chart on "a team of agents", integrations on "plugs into your tools". 0–2 per ad, only when a slide truly matches the words; rotate which slides you use.
 E) PROOF moments (kind "proof"): a real member's win pops up as a notification card, to back up a claim with social proof. 1–2 per ad, on lines about results, time saved or how it feels to use (never over the hook's first 3 seconds, never over the CTA). proof = the testimonial id; pick the one that matches what's being said.
 B) LOGO moments (kind "logos"): when the speaker names a brand the creator uploaded a logo for, its logo pops up, transparent, in the headroom above their head, on the exact word:
   - Alternatives being dismissed ("ChatGPT and Claude just give you more work"): show them together in one moment (logos = both ids) with strike = true, so a fat X slams across them.
   - The product being sold ("It's called Atlas"): a single hero logo (strike = false) held while they talk about it, 2–5 seconds.
   - Name each logo moment from "at" (the brand's first word) to "until" (the end of that thought). Never two moments at once.
3. CAMERA. These are ads: attention is everything, above all in the first 5–10 seconds. Mark intentional moves on the lines that matter: "punch" (a hard jump in tight on a claim, a number, a reveal, the product name), "push" (a slow push-in while they build tension or tell the problem), "pull" (a jump back wide for a reset, a big gesture, the CTA). Put 2–4 moves in the first 8 seconds, then one every 3–6 seconds. Anchor each on its words. Never on a graphic moment (the shot opens up there automatically).
 CUT HITS are short effects on the footage itself, each with its own sound, that make a cut or a key word hit (like FastFX / CapCut retention edits). Use 2–4 per ad, spread out, never two in a row of the same kind, never on a graphic, and rotate away from the ones the creator's recent ads used (listed with the templates):
   - "whip": a fast whip-pan with motion blur, on a jump cut between two ideas (anchor on the first word after the cut).
   - "zoom-blur": a fast zoom punch with blur into a big claim or reveal ("…and that's when it hit me").
   - "flash": a bright flash on a section change or the product reveal.
   - "shake": a short impact shake on a hard word ("never", "every single day", a painful number).
   - "bw": a black-and-white beat for the pain or the "old way" line (hold it for that phrase, 0.6–1.5 s).
   - "rgb": a glitchy colour split on "AI", "automated", "system", or a twist.
 Retention: in a short ad something should change every 1.5–3 seconds (a cut, a move, a hit or a graphic), and by 10 seconds at least 4 different visuals should have appeared.
7. VOICE FX (voice_fx), used as punctuation and rotated between ads: "underwater" (the voice goes deep and muffled with a boom and a punch-in) on ONE reveal or pain line per ad at most, 1–2 seconds long, e.g. "…and it's all automated" or "you're drowning in admin"; "phone" when the speaker quotes a patient or customer on the phone ("they call and say…"); "muffle" for an inner thought or aside. Most ads get zero or one; never in the first 2 seconds or over the CTA.
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

const styleNotes = () => fs.readFile(STYLE_FILE, "utf8").then((s) => s.trim(), () => "");
const productNotes = () => fs.readFile(PRODUCTS_FILE, "utf8").then((s) => s.trim(), () => "");

/**
 * Plan the ad.
 * @param words     the transcript [{ text, start, end }]
 * @param prompt    what the creator asked for
 * @param videoFile a playable copy of the footage (for frames)
 */
export async function planAd({ slides = [], recentTemplates = [], previous = null, testimonials = [], lessons = [], words, prompt = "", duration, aspect, videoFile, tmpDir, signal, luts = [], logos = [], options = {} }) {
  if (!hasClaudeKey()) return fallback(words, "Claude isn't connected, so this is a clean tighten with logos where they're named.", logos);
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
${STANDING_BRIEF.map((l) => `- ${l}`).join("\n")}
</standing_brief>

<creator_request>
${clean(prompt) || "Make this into a scroll-stopping ad."}
</creator_request>
${style ? `\n<house_style>\n${style}\n</house_style>\n` : ""}${products ? `\n<products>\n${products}\n</products>\n` : ""}\n<template_library>\n${templateCatalog()}\nUsed in the creator's recent ads (avoid these this time if another fits): ${recentTemplates.join(", ") || "none yet"}\n</template_library>\n${testimonials.length ? `\n<testimonials>\n${testimonials.map((t) => `${t.id}: ${t.name} (${t.product}): "${t.line}"`).join("\n")}\n</testimonials>\n` : ""}${lessons.length ? `\n<creator_corrections>\nWhat the creator told you after earlier ads. These are lessons for every ad, not just the one they were about:\n${lessons.map((l) => `- (${l.ad}) ${clean(l.prompt)}`).join("\n")}\n</creator_corrections>\n` : ""}
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
