// Claude builds the thumbnail concepts by the creator's SOP (sop.js): for each of three variations it picks the
// type, the curiosity gap, the still, the scroll stoppers, the words and the tone.
// Without a key (or credits) the best-scoring stills and a headline pulled from the transcript still work.
import fs from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FFMPEG, run } from "../lib/tools.js";
import { LAYOUT_IDS } from "./compose.js";
import { SOP_PROMPT, TYPE_IDS, STOPPER_IDS, TONE_IDS, MAX_WORDS } from "./sop.js";

export const MODEL = "claude-opus-5";
export const VARIATIONS = 3;
const SHORTLIST = 10;
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

export const hasClaudeKey = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const Variant = z.object({
  type: z.enum(TYPE_IDS).describe("which of the five thumbnail types this is"),
  gap: z.string().describe("the exact question the viewer is left with, in their words"),
  pick: z.number().int().describe("index of the still to use, from the numbered list"),
  headline: z.string().describe("2–4 words ideally, never more than 6; fits on 2–3 short lines"),
  word: z.string().describe("the single word from the headline that carries the accent colour"),
  sub: z.string().describe("usually empty; at most 3 words when it widens the gap"),
  corner: z.string().describe("a corner hit — a big number, money or a marker like 'Day 90' — or empty"),
  stoppers: z.array(z.enum(STOPPER_IDS)).describe("the one or two scroll stoppers this variation leans on"),
  tone: z.enum(TONE_IDS).describe("serious = cool tones, bold = punchy contrast, bright = warm and light"),
  layout: z.enum(["left", "right", "bottom", "panel", "word"]),
  why: z.string().describe("one short sentence: why this stops the scroll"),
});
const Schema = z.object({
  variants: z.array(Variant).describe(`exactly ${VARIATIONS} variations, each a genuinely different take (different type, still or angle)`),
  lead: z.number().int().describe("index of the variation to lead with"),
});

const SYSTEM = `You design YouTube thumbnails for a healthcare-business creator whose audience is doctors, chiropractors and physical therapists growing their practice.

${SOP_PROMPT}

House rules:
- Plain spoken language a busy practice owner would say. No marketing gloss, no clickbait the video can't pay off, no emoji, no hashtags, no end punctuation.
- Never words already burned into the picture, and never the video's title.
- Keep the words off the face: choose the layout that puts them where the picture is empty (the face on the right → text left, and so on).
- Give ${VARIATIONS} variations so the creator can A/B test: vary the type, the still or the angle, not just a synonym.
- Every variation must pass every box of the checklist on its own. Never pad with a weaker still for variety: a dark or cluttered frame, a mid-word face, or two equal faces splitting the eye. Reuse the strongest still with a different type and different words instead.
- Label the type honestly: a Transformation needs the before and the after both visible or named; a Result shows the result.`;

/** Downscale a still for the model — the concept doesn't need 1920px. */
async function preview(file, out, signal) {
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", file, "-vf", "scale=640:-2", "-q:v", "4", "-y", out], { signal });
  return fs.readFile(out, { encoding: "base64" });
}

const words = (s) => clean(s).split(" ").filter(Boolean);
/** Hold a headline to the SOP's glance-test length. */
const trim = (s) => words(s).slice(0, MAX_WORDS).join(" ").replace(/[.!]+$/, "");

function fallback({ cands, name, text, preset }) {
  const sentence = clean(text).split(/(?<=[.!?])\s+/).map(clean).filter((s) => s.split(" ").length >= 4)[0] || clean(name);
  const headline = preset || trim(sentence.replace(/[.,!?;:]+$/, "").split(" ").slice(0, 4).join(" ")) || "Watch this";
  const variants = cands.slice(0, VARIATIONS).map((frame, i) => ({
    type: "story",
    gap: "",
    pick: i,
    headline,
    word: [...words(headline)].sort((a, b) => b.length - a.length)[0] || headline,
    sub: "",
    corner: "",
    stoppers: frame.face ? ["face"] : [],
    tone: "bold",
    layout: null,
    why: "Claude wasn't available, so these are the best-scoring stills with a line from the video.",
    frame,
  }));
  return { variants, lead: 0, demo: true };
}

const label = (c, i) => {
  const where = c.at == null ? `photo "${c.name || i}"` : `${Math.floor(c.at / 60)}:${String(Math.floor(c.at % 60)).padStart(2, "0")} in`;
  const face = c.face ? `, face ${c.face.x < 0.42 ? "on the left" : c.face.x > 0.58 ? "on the right" : "centred"}${c.faces > 1 ? `, ${c.faces} faces in shot` : ""}` : ", no face found";
  return `Still ${i} — ${where}${face}`;
};

/**
 * Build the variations.
 * cands: scored candidates (frames.js). text: what's been transcribed. name: the project's name.
 * title: the YouTube title the thumbnail pairs with. about: what the creator said the video is about.
 * recent: the last thumbnails [{ headline, type, liked }] so this one stays on-brand.
 * preset: words the creator chose ("Day In A Life") — used as the headline on every variation.
 * → { variants: [{ type, gap, pick, frame, headline, word, sub, corner, stoppers, tone, layout, why }], lead, demo? }
 */
export async function headlineFor({ cands, text = "", name = "", notes = "", title = "", about = "", recent = [], preset = "", taste = "", style = "", styleImages = [], signal, tmpDir }) {
  const shortlist = cands.slice(0, SHORTLIST);
  preset = clean(preset);
  if (!hasClaudeKey() || !shortlist.length) return fallback({ cands: shortlist.length ? shortlist : cands, name, text, preset });

  const images = await Promise.all(
    shortlist.map(async (c, i) => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: await preview(c.file, `${tmpDir}/preview-${i}.jpg`, signal) },
    })),
  );
  const content = [];
  if (styleImages.length) {
    content.push({ type: "text", text: "Thumbnails the creator loves, from their swipe file. Build in this style (the look, the words, the feel), never copy their subjects or words:" });
    content.push(...styleImages);
    content.push({ type: "text", text: "Now the stills from this video to build from:" });
  }
  shortlist.forEach((c, i) => {
    content.push({ type: "text", text: label(c, i) });
    content.push(images[i]);
  });
  const lastTen = recent.slice(0, 10).map((r) => `- "${r.headline}"${r.type ? ` (${r.type})` : ""}${r.liked === true ? " ♥ loved" : r.liked === false ? " ✕ rejected" : ""}`);
  content.push({
    type: "text",
    text: `Video: ${clean(name) || "untitled"}
${title ? `YouTube title it will run with: "${clean(title)}" — the thumbnail must open a loop this title doesn't close, without repeating its words.` : "No title yet — the thumbnail carries the gap on its own."}
${about ? `The creator says it's about: ${clean(about)}\n` : ""}${notes ? `Creator notes: ${clean(notes)}\n` : ""}${lastTen.length ? `\nTheir last thumbnails (stay consistent with these; lean toward the loved ones):\n${lastTen.join("\n")}\n` : ""}${preset ? `\nThe creator picked the words: "${preset}". Use exactly that as the headline on every variation (keep their wording). Vary the still, type, layout, corner and tone instead.\n` : ""}
<transcript>
${clean(text).slice(0, 12000) || "(no transcript — go by the pictures)"}
</transcript>

Build ${VARIATIONS} thumbnail variations by the SOP.`,
  });

  try {
    const stream = new Anthropic().beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(Schema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [SYSTEM, style, taste].filter(Boolean).join("\n\n"),
      messages: [{ role: "user", content }],
    }, { signal });
    const response = await stream.finalMessage();
    const out = response.parsed_output;
    if (!out?.variants?.length) throw new Error("Claude's answer came back incomplete.");
    const variants = out.variants.slice(0, VARIATIONS).map((v) => {
      const pick = Math.min(Math.max(0, Math.round(v.pick) || 0), shortlist.length - 1);
      const headline = preset || trim(v.headline);
      return {
        type: v.type,
        gap: clean(v.gap),
        pick,
        headline,
        word: clean(v.word),
        sub: clean(v.sub),
        corner: clean(v.corner).slice(0, 18),
        stoppers: [...new Set(v.stoppers)].slice(0, 2),
        tone: TONE_IDS.includes(v.tone) ? v.tone : "bold",
        layout: LAYOUT_IDS.has(v.layout) ? v.layout : null,
        why: clean(v.why),
        frame: shortlist[pick],
      };
    });
    return { variants, lead: Math.min(Math.max(0, Math.round(out.lead) || 0), variants.length - 1) };
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    const guess = fallback({ cands: shortlist, name, text, preset });
    guess.variants.forEach((v) => (v.why = `Claude couldn't build this one (${err.message.split("\n")[0]}), so it's a best-scoring still with a line from the video.`));
    return guess;
  }
}
