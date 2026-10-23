// Your style: the creator's swipe file (SOP step 9). Thumbnails they love (uploaded, or pulled from a YouTube
// link) are broken down by the SOP one by one, then distilled into a style profile. The profile and a few of the
// references go into every build (headline.js) and into the on-brand box of the checklist (check.js).
// Stored in data/thumbnails/style.json and data/thumbnails/style/<id>.jpg.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import os from "node:os";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { FFMPEG, ROOT, run } from "../lib/tools.js";
import { SOP_PROMPT, TYPE_IDS, STOPPER_IDS } from "./sop.js";

const DIR = path.join(ROOT, "data", "thumbnails");
const FILE = path.join(DIR, "style.json");
const FILES = path.join(DIR, "style");
const MODEL = "claude-opus-5";
const MAX_REFS = 200;

const now = () => new Date().toISOString();
const clean = (s, max = 400) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const newId = () => `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
const hasKey = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const HEXISH = /^#[0-9a-f]{6}$/i;

// ---------------------------------------------------------------------------
// style.json: { refs: [Ref], profile: Profile | null }

let store = null;
let syncedAt = 0;
let writes = Promise.resolve();

async function load() {
  const changed = await fs.stat(FILE).then((s) => s.mtimeMs > syncedAt).catch(() => false);
  if (!store || changed) {
    let data = {};
    try {
      data = JSON.parse(await fs.readFile(FILE, "utf8"));
      syncedAt = (await fs.stat(FILE)).mtimeMs;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    store = { refs: Array.isArray(data.refs) ? data.refs : [], profile: data.profile || null };
  }
  return store;
}

function save() {
  const snapshot = JSON.stringify(store, null, 2);
  writes = writes
    .then(async () => {
      await fs.mkdir(DIR, { recursive: true });
      const tmp = `${FILE}.${crypto.randomBytes(4).toString("hex")}.tmp`;
      await fs.writeFile(tmp, `${snapshot}\n`);
      await fs.rename(tmp, FILE);
      syncedAt = await fs.stat(FILE).then((s) => s.mtimeMs, () => Date.now());
    })
    .catch((err) => console.error("Saving thumbnail style failed:", err.message));
  return writes;
}

const refFile = (ref) => path.join(FILES, `${ref.id}.jpg`);

async function base64(file, width = 640) {
  const out = `${file}.${width}.tmp.jpg`;
  await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", file, "-vf", `scale=${width}:-2`, "-q:v", "4", "-y", out]);
  try {
    return await fs.readFile(out, { encoding: "base64" });
  } finally {
    await fs.rm(out, { force: true }).catch(() => {});
  }
}

/** Any picture → a 1280-wide JPEG in the style folder. HEIC and friends go through macOS sips. */
async function normalise(src, dest) {
  await fs.mkdir(FILES, { recursive: true });
  const args = ["-vf", "scale='min(1280,iw)':-2:flags=lanczos", "-frames:v", "1", "-q:v", "2", "-y", dest];
  try {
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", src, ...args]);
  } catch {
    const jpg = `${dest}.src.jpg`;
    await run("/usr/bin/sips", ["-s", "format", "jpeg", src, "--out", jpg]);
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-nostdin", "-i", jpg, ...args]);
    await fs.rm(jpg, { force: true });
  }
}

// ---------------------------------------------------------------------------
// Claude: one reference at a time, then the profile

const Breakdown = z.object({
  type: z.enum(TYPE_IDS),
  gap: z.string().describe("the question it leaves the viewer with"),
  stoppers: z.array(z.enum(STOPPER_IDS)),
  words: z.string().describe("the exact words on the thumbnail, or empty"),
  wordCount: z.number().int(),
  textStyle: z.string().describe("font feel, case, colours, outline or box, where it sits, how many lines"),
  textColor: z.string().describe("the main headline colour as #rrggbb, or empty when there's no text"),
  face: z.string().describe("expression, how big in frame, where, or 'no face'"),
  composition: z.string().describe("focal point, thirds or centred, background, depth"),
  colors: z.string().describe("palette and contrast in a few words"),
  extras: z.array(z.string()).describe("arrows, circles, split before/after, numbers, money, logos, props — only what's there"),
  why: z.string().describe("one sentence: why this one wins the click"),
});

const Profile = z.object({
  summary: z.string().describe("2–3 sentences: the creator's thumbnail taste, in plain words"),
  rules: z.array(z.string()).describe("6–10 specific, followable do's, most important first"),
  avoid: z.array(z.string()).describe("things this taste clearly steers away from"),
  favoriteTypes: z.array(z.enum(TYPE_IDS)).describe("the types they reach for most, most first"),
  textColor: z.string().describe("the headline colour they prefer as #rrggbb (white is #ffffff)"),
  uppercase: z.boolean().describe("whether their headlines are all caps"),
  maxWords: z.number().int().describe("the most words their thumbnails usually carry"),
});

async function ask(schema, system, content, effort = "medium") {
  const stream = new Anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort, format: betaZodOutputFormat(schema) },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content }],
  });
  const out = (await stream.finalMessage()).parsed_output;
  if (!out) throw new Error("Claude's answer came back incomplete.");
  return out;
}

const BREAKDOWN_SYSTEM = `You study YouTube thumbnails for a creator's swipe file, the way their thumbnail SOP teaches.\n\n${SOP_PROMPT}\n\nDescribe only what is actually in the picture. Be concrete: a designer should be able to rebuild the look from your notes.`;

async function analyse(ref) {
  if (!hasKey()) return null;
  const out = await ask(Breakdown, BREAKDOWN_SYSTEM, [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: await base64(refFile(ref), 960) } },
    { type: "text", text: `${ref.title ? `The video's title: "${ref.title}"${ref.channel ? ` (${ref.channel})` : ""}.\n` : ""}${ref.note ? `What the creator likes about it: ${ref.note}\n` : ""}Break this thumbnail down by the SOP.` },
  ]);
  return { ...out, words: clean(out.words, 120), textColor: HEXISH.test(out.textColor) ? out.textColor : "", extras: out.extras.map((x) => clean(x, 80)).slice(0, 8) };
}

/** Distil every breakdown (and the creator's notes) into the profile the builder follows. */
export async function rebuildProfile() {
  await load();
  const refs = store.refs.filter((r) => r.analysis);
  if (!refs.length || !hasKey()) {
    store.profile = null;
    await save();
    return null;
  }
  const lines = refs.slice(0, 60).map((r, i) => {
    const a = r.analysis;
    return `${i + 1}. ${a.type}; words "${a.words}" (${a.wordCount}); text: ${a.textStyle}; face: ${a.face}; composition: ${a.composition}; colours: ${a.colors}; extras: ${a.extras.join(", ") || "none"}; why: ${a.why}${r.note ? `\n   The creator says: ${r.note}` : ""}${r.title ? `\n   Title: ${r.title}` : ""}`;
  });
  const images = [];
  for (const r of refs.slice(0, 8)) images.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: await base64(refFile(r)) } });
  const out = await ask(Profile, `You turn a creator's swipe file of YouTube thumbnails into a style guide their thumbnail designer can follow.\n\n${SOP_PROMPT}\n\nFind the patterns that repeat. The creator's own notes on what they like count most. Keep every rule specific and followable (sizes, colours, word counts, expressions, placement), never generic advice.`, [
    ...images,
    { type: "text", text: `The thumbnails they love, broken down (the first ${images.length} are shown above):\n${lines.join("\n")}\n\nWrite their style profile.` },
  ], "high");
  store.profile = {
    summary: clean(out.summary, 600),
    rules: out.rules.map((r) => clean(r, 200)).filter(Boolean).slice(0, 12),
    avoid: out.avoid.map((r) => clean(r, 200)).filter(Boolean).slice(0, 8),
    favoriteTypes: [...new Set(out.favoriteTypes)],
    textColor: HEXISH.test(out.textColor) ? out.textColor.toLowerCase() : "#ffffff",
    uppercase: out.uppercase !== false,
    maxWords: Math.min(Math.max(2, Math.round(out.maxWords) || 4), 6),
    from: refs.length,
    updatedAt: now(),
  };
  await save();
  return store.profile;
}

// ---------------------------------------------------------------------------
// For the builder and the checklist

/** The prompt block: the creator's taste, from the profile and their notes. Empty until they've added some. */
export async function styleBlock() {
  await load();
  const p = store.profile;
  const notes = store.refs.filter((r) => r.note).slice(0, 12).map((r) => `- ${r.note}`);
  if (!p && !notes.length) return "";
  return `<creator_thumbnail_style>
The creator trained this from thumbnails they love (their swipe file). Follow it: it decides the look, the words and the feel, inside the SOP.
${p ? `${p.summary}
Do:
${p.rules.map((r) => `- ${r}`).join("\n")}
${p.avoid.length ? `Avoid:\n${p.avoid.map((r) => `- ${r}`).join("\n")}\n` : ""}Types they reach for most: ${p.favoriteTypes.join(", ") || "any"}. Words: usually no more than ${p.maxWords}.` : ""}
${notes.length ? `In their words, what they like:\n${notes.join("\n")}` : ""}
</creator_thumbnail_style>`;
}

/** A few of the references, newest first, as images for the builder to look at. */
export async function styleImages(count = 4) {
  await load();
  const out = [];
  for (const r of store.refs.filter((x) => x.analysis).slice(0, count)) {
    try {
      out.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: await base64(refFile(r)) } });
    } catch {
      // a reference whose file went missing just isn't shown
    }
  }
  return out;
}

/** How the words are drawn, when the profile says: headline colour and caps. */
export async function renderHints() {
  await load();
  const p = store.profile;
  return p ? { textColor: p.textColor, uppercase: p.uppercase } : {};
}

// ---------------------------------------------------------------------------
// Adding references

/** Pull the video id out of any YouTube link. */
export function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return m?.[1] || (/^[\w-]{11}$/.test(String(url).trim()) ? String(url).trim() : null);
}

async function addRef({ src, note, source, url = "", title = "", channel = "" }) {
  const ref = { id: newId(), source, url, title: clean(title, 160), channel: clean(channel, 80), note: clean(note, 400), analysis: null, error: null, createdAt: now() };
  await normalise(src, refFile(ref));
  try {
    ref.analysis = await analyse(ref);
  } catch (err) {
    ref.error = err.message.split("\n")[0];
  }
  store.refs.unshift(ref);
  for (const dropped of store.refs.splice(MAX_REFS)) await fs.rm(refFile(dropped), { force: true }).catch(() => {});
  await save();
  return ref;
}

/** Uploaded pictures of thumbnails they love. files: [{ path, name }]. */
export async function addUploads(files, note = "") {
  await load();
  const added = [];
  for (const f of files) {
    try {
      added.push(await addRef({ src: f.path, note, source: "upload", title: "" }));
    } catch (err) {
      added.push({ error: `${f.name}: ${err.message.split("\n")[0]}` });
    }
  }
  if (added.some((r) => r.analysis)) await rebuildProfile().catch((err) => console.error("Style profile:", err.message));
  return added;
}

/** YouTube links: the video's thumbnail and its title (the title matters: thumbnail + title are one unit). */
export async function addLinks(urls, note = "") {
  await load();
  const added = [];
  for (const url of urls) {
    const id = youtubeId(url);
    if (!id) {
      added.push({ error: `Not a YouTube link: ${clean(url, 80)}` });
      continue;
    }
    const tmp = path.join(os.tmpdir(), `hba-style-${id}.jpg`);
    try {
      let res = await fetch(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) res = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error("YouTube didn't give a thumbnail for that video.");
      await fs.writeFile(tmp, Buffer.from(await res.arrayBuffer()));
      const meta = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { signal: AbortSignal.timeout(10000) })
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));
      added.push(await addRef({ src: tmp, note, source: "youtube", url: `https://www.youtube.com/watch?v=${id}`, title: meta.title, channel: meta.author_name }));
    } catch (err) {
      added.push({ error: `${clean(url, 80)}: ${err.message.split("\n")[0]}` });
    } finally {
      await fs.rm(tmp, { force: true }).catch(() => {});
    }
  }
  if (added.some((r) => r.analysis)) await rebuildProfile().catch((err) => console.error("Style profile:", err.message));
  return added;
}

// ---------------------------------------------------------------------------
// HTTP: mounted at /api/thumbnails/style

const publicRef = (r, base) => ({ ...r, image: `${base}/refs/${r.id}/file` });
const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message.split("\n")[0] });
  }
};
const upload = multer({
  dest: path.join(os.tmpdir(), "hba-thumbnail-style"),
  limits: { fileSize: 40 * 1024 * 1024, files: 30 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i.test(file.originalname)),
});

export const router = express.Router();
router.use(express.json({ limit: "1mb" }));

router.get("/", handle(async (req) => {
  await load();
  return { profile: store.profile, refs: store.refs.map((r) => publicRef(r, req.baseUrl)), claude: hasKey() };
}));

/** multipart `refs` (up to 30 pictures) and `note`: what they like about them. */
router.post("/refs", (req, res, next) => upload.array("refs", 30)(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())), handle(async (req) => {
  const files = (req.files || []).map((f) => ({ path: f.path, name: f.originalname }));
  try {
    if (!files.length) throw new Error("Add at least one thumbnail picture.");
    const added = await addUploads(files, req.body?.note);
    return { added: added.map((r) => (r.id ? publicRef(r, req.baseUrl) : r)), profile: store.profile };
  } finally {
    await Promise.all(files.map((f) => fs.rm(f.path, { force: true }).catch(() => {})));
  }
}));

/** `{ urls: [..] | "one per line", note }` — YouTube links. */
router.post("/links", handle(async (req) => {
  const raw = Array.isArray(req.body?.urls) ? req.body.urls : String(req.body?.urls || "").split(/[\s,]+/);
  const urls = raw.map((u) => clean(u, 300)).filter(Boolean).slice(0, 30);
  if (!urls.length) throw new Error("Paste at least one YouTube link.");
  const added = await addLinks(urls, req.body?.note);
  return { added: added.map((r) => (r.id ? publicRef(r, req.baseUrl) : r)), profile: store.profile };
}));

/** Change what they said they like about one; the profile is rebuilt with it. */
router.patch("/refs/:id", handle(async (req) => {
  await load();
  const ref = store.refs.find((r) => r.id === req.params.id);
  if (!ref) throw Object.assign(new Error("That reference is gone."), { status: 404 });
  if ("note" in (req.body || {})) ref.note = clean(req.body.note, 400);
  if (!ref.analysis) ref.analysis = await analyse(ref).catch(() => null);
  await save();
  await rebuildProfile();
  return { ref: publicRef(ref, req.baseUrl), profile: store.profile };
}));

router.delete("/refs/:id", handle(async (req) => {
  await load();
  const ref = store.refs.find((r) => r.id === req.params.id);
  if (!ref) return { ok: true, profile: store.profile };
  store.refs = store.refs.filter((r) => r !== ref);
  await save();
  await fs.rm(refFile(ref), { force: true }).catch(() => {});
  await rebuildProfile();
  return { ok: true, profile: store.profile };
}));

router.post("/profile", handle(async () => ({ profile: await rebuildProfile() })));

router.get("/refs/:id/file", async (req, res) => {
  await load();
  const ref = store.refs.find((r) => r.id === req.params.id);
  if (!ref) return res.status(404).type("text").send("No such reference.");
  res.sendFile(refFile(ref));
});
