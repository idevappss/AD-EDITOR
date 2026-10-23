// The SOP's four tests and the Banger Thumbnail Checklist, run on the painted variations.
// Chrome lays each one out the way viewers meet it (phone feed and sidebar, dark and light mode) and Claude
// judges that sheet box by box. Anything it can fix with words, layout or the corner hit gets fixed.
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FFMPEG, run } from "../lib/tools.js";
import { shoot, fileUrl } from "./shot.js";
import { CHECKLIST, CHECK_IDS, MAX_WORDS, SOP_PROMPT } from "./sop.js";
import { MODEL, VARIATIONS, hasClaudeKey } from "./headline.js";

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const JUDGED = CHECK_IDS.filter((id) => id !== "variations");

const Schema = z.object({
  results: z.array(z.object({
    variant: z.string().describe("the letter on the sheet"),
    checks: z.array(z.object({
      id: z.enum(JUDGED),
      pass: z.boolean(),
      note: z.string().describe("a few words; say what's wrong when it fails"),
    })),
    fix: z.object({
      headline: z.string().describe("new words when the words fail a box, else empty"),
      word: z.string().describe("the accent word for the new headline, else empty"),
      layout: z.enum(["", "left", "right", "bottom", "panel", "word"]).describe("a new layout when the words sit badly, else empty"),
      badge: z.string().describe("a new corner hit, 'none' to remove it, or empty to keep it"),
    }),
  })),
  lead: z.string().describe("the letter of the variation most likely to win the click"),
});

/** The sheet: each variation at phone-feed size on dark and light, and at sidebar size on both. */
function sheetHtml(items) {
  const row = (item, i) => {
    const src = fileUrl(item.file);
    const feed = (mode) => `<div class="feed ${mode}"><img src="${src}" /><i></i><i class="s"></i></div>`;
    const side = (mode) => `<div class="side ${mode}"><img src="${src}" /><span><i></i><i class="s"></i></span></div>`;
    return `<div class="row"><b>${String.fromCharCode(65 + i)}</b>${feed("dark")}${feed("light")}<div class="col">${side("dark")}${side("light")}</div></div>`;
  };
  return `<!doctype html><meta charset="utf-8" /><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1280px; height: 720px; background: #777; font: 700 34px system-ui; padding: 12px 20px; display: flex; flex-direction: column; gap: 14px; }
  .row { display: flex; align-items: center; gap: 16px; height: 222px; }
  .row b { width: 36px; color: #fff; }
  .feed { width: 380px; padding: 8px; border-radius: 12px; }
  .feed img { width: 364px; height: 205px; border-radius: 10px; display: block; object-fit: cover; }
  .feed i { display: block; height: 0; }
  .side { display: flex; gap: 8px; width: 330px; padding: 8px; border-radius: 10px; }
  .side img { width: 168px; height: 94px; border-radius: 6px; object-fit: cover; }
  .side span { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
  .side i { height: 10px; border-radius: 4px; }
  .side i.s { width: 60%; }
  .col { display: flex; flex-direction: column; gap: 10px; }
  .dark { background: #0f0f0f; } .dark i { background: #3a3a3a; }
  .light { background: #fff; } .light i { background: #ddd; }
</style>${items.map(row).join("")}<script>document.documentElement.dataset.ready = "1";</script>`;
}

async function base64(file, out, signal, width = 640) {
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", file, "-vf", `scale=${width}:-2`, "-q:v", "4", "-y", out], { signal });
  return fs.readFile(out, { encoding: "base64" });
}

/** The boxes code can tick on its own: word count and wrapped lines, and whether there are enough variations. */
function measured(item, count) {
  const n = clean(item.headline).split(" ").filter(Boolean).length;
  const lines = item.lines || 0;
  return {
    text: n > MAX_WORDS || lines > 3 ? { pass: false, note: `${n} words on ${lines || "?"} lines — the SOP says 2–3 short lines` } : null,
    variations: count >= VARIATIONS ? { pass: true, note: `${count} variations to test` } : { pass: false, note: `only ${count} — make more with New words` },
  };
}

/**
 * Run the tests on a set of painted variations.
 * items: [{ file, headline, type, gap, badge, layout, lines }] in variant order. title: the YouTube title.
 * → { results: [{ checks: [{ id, label, pass, note }], fix }], lead, sheet } — or null without Claude.
 */
export async function checkSet(items, { title = "", recent = [], style = "", signal, tmpDir }) {
  if (!items.length) return null;
  const sheet = path.join(tmpDir, "checks.png");
  await shoot(sheetHtml(items), sheet);

  const offline = (why) => ({
    results: items.map((item) => {
      const m = measured(item, items.length);
      return {
        checks: CHECKLIST.filter((c) => m[c.id] || c.id === "text").map((c) => ({ id: c.id, label: c.label, ...(m[c.id] || { pass: true, note: "2–3 short lines" }) })),
        fix: null,
      };
    }),
    lead: 0,
    offline: why,
  });
  if (!hasClaudeKey()) return offline("No Claude key, so only the word count and the variation count were checked.");

  const content = [
    { type: "text", text: "The test sheet: each variation (A, B, C…) at phone-feed size in YouTube dark mode, then light mode, then at sidebar size in dark and light." },
    { type: "image", source: { type: "base64", media_type: "image/png", data: await fs.readFile(sheet, { encoding: "base64" }) } },
  ];
  for (const [i, item] of items.entries()) {
    const letter = String.fromCharCode(65 + i);
    content.push({ type: "text", text: `Variation ${letter} full size — type: ${item.type || "?"}; the gap it means to open: ${item.gap || "?"}; headline "${item.headline}"${item.badge ? `; corner "${item.badge}"` : ""}; layout ${item.layout || "auto"}.` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: await base64(item.file, path.join(tmpDir, `check-${i}.jpg`), signal) } });
  }
  const lastTen = recent.slice(0, 10).map((r) => `- "${r.headline}"${r.type ? ` (${r.type})` : ""}`).join("\n");
  content.push({
    type: "text",
    text: `${title ? `The YouTube title these run with: "${clean(title)}".` : "There's no title yet."}
${lastTen ? `Their last thumbnails, for the on-brand box:\n${lastTen}\n` : ""}
Run the Banger Thumbnail Checklist on every variation. Be strict — a box is a yes only when it's clearly a yes:
${CHECKLIST.filter((c) => c.id !== "variations").map((c) => `- ${c.id}: ${c.label}`).join("\n")}

For any box that fails and can be fixed with the words, the layout or the corner hit, give the fix. Leave the fix fields empty when nothing needs changing. Then name the variation to lead with.`,
  });

  try {
    const stream = new Anthropic().beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(Schema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `You are the last pair of eyes before a YouTube thumbnail goes live. You judge thumbnails against the creator's SOP.\n\n${SOP_PROMPT}${style ? `\n\nThe on-brand box means matching the creator's trained style as well as their last ten:\n${style}` : ""}`,
      messages: [{ role: "user", content }],
    }, { signal });
    const out = (await stream.finalMessage()).parsed_output;
    if (!out?.results?.length) throw new Error("Claude's checklist came back incomplete.");
    const byLetter = new Map(out.results.map((r) => [clean(r.variant).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1), r]));
    const results = items.map((item, i) => {
      const r = byLetter.get(String.fromCharCode(65 + i)) || out.results[i] || { checks: [], fix: null };
      const m = measured(item, items.length);
      const given = new Map((r.checks || []).map((c) => [c.id, c]));
      const checks = CHECKLIST.map((c) => {
        const verdict = m[c.id] || given.get(c.id);
        return verdict ? { id: c.id, label: c.label, pass: verdict.pass === true, note: clean(verdict.note) } : null;
      }).filter(Boolean);
      const f = r.fix || {};
      const fix = f.headline || f.layout || f.badge ? { headline: clean(f.headline), word: clean(f.word), layout: f.layout || "", badge: clean(f.badge) } : null;
      return { checks, fix };
    });
    const leadAt = clean(out.lead).toUpperCase().charCodeAt(0) - 65;
    return { results, lead: leadAt >= 0 && leadAt < items.length ? leadAt : 0 };
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    return offline(`Claude couldn't run the checklist (${err.message.split("\n")[0]}), so only the word count and the variation count were checked.`);
  }
}
