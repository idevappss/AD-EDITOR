// Memory: the company brain. Everything HBA is and says, in one place every session can pull from:
//   - the company profile (shared/COMPANY.md), who HBA is, what it sells, who it's for, how it talks
//   - transcripts of YouTube videos, Zoom calls, vlogs and podcasts (data/memory/), plus every project's own transcript
//   - the playbooks already in shared/*.md (voice, creator models, editor style…)
//   - the brand kit (logos, fonts, colors) from the Assets tab, read through /api/resources/brand, never copied
// Owned by the MEMORY session. Other sessions read GET /api/memory/context, or import { companyContext } from here.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import { ROOT, PROJECTS_DIR } from "../lib/tools.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(ROOT, "data", "memory");
const INDEX = path.join(DATA_DIR, "transcripts.json");
const TEXT_DIR = path.join(DATA_DIR, "transcripts");
const HISTORY_DIR = path.join(DATA_DIR, "history");
const SHARED_DIR = path.join(ROOT, "shared");
export const COMPANY_FILE = path.join(SHARED_DIR, "COMPANY.md");
const IDEAS_FILE = path.join(SHARED_DIR, "CONTENT_IDEAS.md");

/** What a transcript is, for filtering and so other sessions know how Odell sounds in each. */
export const KINDS = [
  { id: "youtube", label: "YouTube video" },
  { id: "vlog", label: "Vlog" },
  { id: "zoom", label: "Zoom / coaching call" },
  { id: "mastermind", label: "Mastermind" },
  { id: "podcast", label: "Podcast" },
  { id: "sales", label: "Sales call" },
  { id: "ad", label: "Ad / VSL" },
  { id: "other", label: "Other" },
];
const KIND_IDS = new Set(KINDS.map((k) => k.id));

const now = () => new Date().toISOString();
const clean = (s, max = 200) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const newId = () => `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
const wordCount = (t) => (t.match(/\S+/g) || []).length;

// ---------------------------------------------------------------------------
// Turning whatever the creator drops in into plain paragraphs.

const TIMECODE = /^\[?\d{1,2}[:;]\d{2}[:;]\d{2}(?:[:;.,]\d{1,3})?\s*(?:-->|-)\s*\d{1,2}[:;]\d{2}[:;]\d{2}(?:[:;.,]\d{1,3})?\]?/;

/**
 * Plain text from a transcript file: Premiere/Resolve exports ("00;00;01;59 - …" + speaker line), SRT, VTT,
 * a HBA words JSON, or plain prose. Caption fragments are joined into sentences, then paragraphs of ~5 sentences.
 */
export function toPlainText(raw, name = "") {
  let text = String(raw ?? "").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (/\.json$/i.test(name) || /^\s*[[{]/.test(text)) {
    try {
      const data = JSON.parse(text);
      const words = Array.isArray(data) ? data : data.words || data.segments || [];
      const joined = words.map((w) => w.text ?? w.word ?? "").join(" ");
      if (joined.trim()) text = joined;
    } catch {}
  }
  const lines = text.split("\n");
  const timed = lines.filter((l) => TIMECODE.test(l.trim())).length;
  if (timed >= 3) {
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || TIMECODE.test(line) || /^\d+$/.test(line) || /^WEBVTT/.test(line)) continue;
      // Resolve puts a speaker name on the line after the timecode ("Unknown", "Speaker 1").
      if (TIMECODE.test(lines[i - 1]?.trim() || "") && lines[i + 1]?.trim() && /^(unknown|speaker ?\d*|[A-Z][\w.]*(?: [A-Z][\w.]*)?)$/i.test(line) && line.split(" ").length <= 3) continue;
      out.push(line.replace(/<[^>]+>/g, "").replace(/\((?:upbeat |soft |dramatic )?music\)|\((?:laughter|laughing|applause)\)/gi, " "));
    }
    text = out.join(" ");
  }
  text = text.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
  if (timed >= 3 || !/\n\s*\n/.test(text)) {
    const sentences = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]+["')\]]*|\S[^.!?]*$/g) || [text];
    const paras = [];
    for (let i = 0; i < sentences.length; i += 5) paras.push(sentences.slice(i, i + 5).join(" ").replace(/\s+/g, " ").trim());
    text = paras.join("\n\n");
  }
  return text;
}

/** "om-20260719-6 numbers keeping you from-transcript.txt" → { date: "2026-07-19", title: "6 numbers keeping you from" } */
export function parseName(name) {
  let base = path.basename(name).replace(/\.\w+$/, "").replace(/^copy of /i, "");
  let date = null;
  const m = base.match(/(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)/);
  if (m) {
    date = `${m[1]}-${m[2]}-${m[3]}`;
    base = base.replace(m[0], " ");
  }
  const title = base
    .replace(/^om[-_ ]+/i, "")
    .replace(/[-_ ]*(transcript|final sop edit)$/i, "")
    .replace(/[-_ ]+v\d+$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/^[-\s]+|[-\s]+$/g, "")
    .replace(/\s*-\s*/g, " – ")
    .replace(/\s+/g, " ");
  return { date, title: title ? title[0].toUpperCase() + title.slice(1) : "Untitled transcript" };
}

export function guessKind(name, text = "") {
  const s = `${name} ${text.slice(0, 1500)}`.toLowerCase();
  if (/mastermind/.test(s)) return "mastermind";
  if (/vlog|day in the life|week in a life/.test(s)) return "vlog";
  if (/zoom|coaching call|q ?& ?a|hot seat/.test(s)) return "zoom";
  if (/podcast|episode/.test(s)) return "podcast";
  if (/sales call|discovery call/.test(s)) return "sales";
  return "youtube";
}

// ---------------------------------------------------------------------------
// data/memory/transcripts.json → { items: Transcript[] }
//   Transcript { id, title, kind, date, source, words, tags[], notes, hash, learnedAt, createdAt, updatedAt }
// The text lives in data/memory/transcripts/<id>.txt.

let db;
let writes = Promise.resolve();

async function load() {
  if (!db) {
    let data = {};
    try {
      data = JSON.parse(await fs.readFile(INDEX, "utf8"));
    } catch (err) {
      if (err.code !== "ENOENT") throw err; // a hand-edit broke the JSON — never overwrite it
    }
    db = { items: Array.isArray(data.items) ? data.items : [] };
  }
  return db;
}

async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, content);
  await fs.rename(tmp, file);
}

function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writes = writes.then(() => atomicWrite(INDEX, snapshot)).catch((err) => console.error("Saving memory failed:", err));
  return writes;
}

const textPath = (id) => path.join(TEXT_DIR, `${id}.txt`);
const readText = (id) => fs.readFile(textPath(id), "utf8").catch(() => "");

/** Save one transcript. Same text twice (by hash) returns the existing one instead of a duplicate. */
export async function addTranscript({ text, title, kind, date, source, tags, notes }) {
  const body = String(text ?? "").trim();
  if (body.length < 20) throw new Error("That transcript is empty.");
  await load();
  const hash = crypto.createHash("sha1").update(body.replace(/\s+/g, " ")).digest("hex");
  const dupe = db.items.find((t) => t.hash === hash);
  if (dupe) return { item: dupe, duplicate: true };
  const item = {
    id: newId(),
    title: clean(title, 140) || "Untitled transcript",
    kind: KIND_IDS.has(kind) ? kind : guessKind(title || source || "", body),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : null,
    source: clean(source, 200) || null,
    words: wordCount(body),
    tags: parseTags(tags),
    notes: String(notes ?? "").slice(0, 4000),
    hash,
    learnedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  await atomicWrite(textPath(item.id), body + "\n");
  db.items.push(item);
  await persist();
  return { item, duplicate: false };
}

const parseTags = (input) =>
  [...new Set((Array.isArray(input) ? input : String(input ?? "").split(","))
    .map((t) => clean(t, 40).toLowerCase())
    .filter(Boolean))].slice(0, 20);

export async function listTranscripts() {
  await load();
  return [...db.items].sort((a, b) => (b.date || b.createdAt).localeCompare(a.date || a.createdAt));
}

/** Every video transcribed in Ads Editor itself, read straight from projects/ (never copied). */
async function projectTranscripts() {
  const out = [];
  for (const id of await fs.readdir(PROJECTS_DIR).catch(() => [])) {
    try {
      const [meta, words] = await Promise.all([
        fs.readFile(path.join(PROJECTS_DIR, id, "project.json"), "utf8").then(JSON.parse),
        fs.readFile(path.join(PROJECTS_DIR, id, "transcript.json"), "utf8").then(JSON.parse),
      ]);
      const text = toPlainText(JSON.stringify(words), "x.json");
      if (!text) continue;
      out.push({
        id: `project-${id}`,
        projectId: id,
        title: meta.name || id,
        kind: "project",
        date: meta.createdAt?.slice(0, 10) || null,
        words: wordCount(text),
        text,
      });
    } catch {}
  }
  return out;
}

// ---------------------------------------------------------------------------
// Docs: the company profile + shared playbooks.

async function readDoc(file) {
  try {
    const [body, stat] = await Promise.all([fs.readFile(file, "utf8"), fs.stat(file)]);
    return { body, updatedAt: stat.mtime.toISOString() };
  } catch {
    return { body: "", updatedAt: null };
  }
}

export async function listDocs() {
  const files = (await fs.readdir(SHARED_DIR).catch(() => [])).filter((f) => f.endsWith(".md"));
  return Promise.all(
    files.map(async (f) => {
      const { body, updatedAt } = await readDoc(path.join(SHARED_DIR, f));
      const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
      return { file: f, title: heading || f.replace(/\.md$/, ""), words: wordCount(body), updatedAt, company: f === "COMPANY.md" || f === "CONTENT_IDEAS.md" };
    }),
  );
}

export async function saveCompany(markdown) {
  const body = String(markdown ?? "").trim();
  if (body.length < 40) throw new Error("The company profile can't be empty.");
  const old = await readDoc(COMPANY_FILE);
  if (old.body) await atomicWrite(path.join(HISTORY_DIR, `COMPANY-${Date.now()}.md`), old.body);
  await atomicWrite(COMPANY_FILE, body + "\n");
  return readDoc(COMPANY_FILE);
}

// ---------------------------------------------------------------------------
// Search: keyword hits across stored transcripts, project transcripts and shared docs, with snippets.

const STOP = new Set("the a an and or of to in on for is are was be it this that with you your i we my our at as by from how what why".split(" "));
const terms = (q) => [...new Set(String(q || "").toLowerCase().match(/[a-z0-9$%']+/g) || [])].filter((t) => !STOP.has(t));

function scoreText(text, words) {
  const low = text.toLowerCase();
  let score = 0;
  for (const w of words) {
    let i = -1, n = 0;
    while ((i = low.indexOf(w, i + 1)) !== -1 && n < 50) n++;
    if (n) score += 1 + Math.log(n);
  }
  return score;
}

function snippets(text, words, count = 3, radius = 220) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return paras
    .map((p, i) => ({ i, p, s: scoreText(p, words) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .sort((a, b) => a.i - b.i)
    .map(({ p }) => {
      if (p.length <= radius * 2) return p;
      const at = Math.max(0, p.toLowerCase().indexOf(words.find((w) => p.toLowerCase().includes(w))) - radius);
      return `${at ? "…" : ""}${p.slice(at, at + radius * 2).trim()}…`;
    });
}

export async function search(q, { limit = 8, include = ["transcripts", "projects", "docs"] } = {}) {
  const words = terms(q);
  if (!words.length) return [];
  const pool = [];
  if (include.includes("transcripts"))
    for (const t of await listTranscripts()) pool.push({ type: "transcript", id: t.id, title: t.title, kind: t.kind, date: t.date, text: await readText(t.id) });
  if (include.includes("projects"))
    for (const t of await projectTranscripts()) pool.push({ type: "project", id: t.id, projectId: t.projectId, title: t.title, kind: "project", date: t.date, text: t.text });
  if (include.includes("docs"))
    for (const d of await listDocs()) pool.push({ type: "doc", id: d.file, title: d.title, text: (await readDoc(path.join(SHARED_DIR, d.file))).body });
  return pool
    .map((x) => ({ ...x, score: scoreText(x.title + " " + x.text, words) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ text, ...x }) => ({ ...x, score: +x.score.toFixed(2), snippets: snippets(text, words) }));
}

// ---------------------------------------------------------------------------
// Context: the one thing other sessions call before writing a title, caption, hook, edit or ad.

async function brandKit(origin) {
  if (!origin) return null;
  try {
    const res = await fetch(`${origin}/api/resources/brand`, { signal: AbortSignal.timeout(3000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Everything a prompt needs to sound like HBA. `q` pulls matching transcript excerpts (e.g. the clip's topic).
 * `origin` (e.g. "http://localhost:5173") lets it include the Assets brand kit.
 */
/** Keep only the numbered "## N." sections of COMPANY.md (the title/intro before section 1 always stays). */
export function companySections(markdown, keep) {
  if (!keep?.length) return markdown;
  const chunks = markdown.split(/(?=^## \d+\.)/m);
  return chunks.filter((c, i) => i === 0 || keep.includes(Number(c.match(/^## (\d+)\./)?.[1]))).join("").trim();
}

/** What each consumer needs when it already carries ODELL_VOICE.md and titles/STYLE.md: the business, not the voice. */
export const PRESETS = {
  picking: { sections: [1, 2, 3, 4, 5, 6, 10], parts: ["company", "excerpts"] },
  titles: { sections: [1, 5, 6], parts: ["company", "ideas", "excerpts"] },
  design: { sections: [3], parts: ["company", "brand"] },
};
const ALL_PARTS = ["company", "ideas", "excerpts", "brand"];

export async function companyContext({ q = "", excerpts = 6, origin = null, sections = null, parts = ALL_PARTS, preset = null } = {}) {
  if (preset && PRESETS[preset]) ({ sections, parts } = { sections, parts, ...PRESETS[preset] });
  const [company, ideas, voice, hits, brand, transcripts] = await Promise.all([
    readDoc(COMPANY_FILE),
    readDoc(IDEAS_FILE),
    readDoc(path.join(SHARED_DIR, "ODELL_VOICE.md")),
    q && parts.includes("excerpts") ? search(q, { limit: excerpts, include: ["transcripts", "projects"] }) : [],
    parts.includes("brand") ? brandKit(origin) : null,
    listTranscripts(),
  ]);
  return {
    company: parts.includes("company") ? companySections(company.body, sections) : "",
    contentIdeas: parts.includes("ideas") ? ideas.body : "",
    voice: voice.body,
    excerpts: hits,
    brand,
    transcripts: { count: transcripts.length, words: transcripts.reduce((n, t) => n + t.words, 0) },
    updatedAt: company.updatedAt,
  };
}

/** The same context as one block of text, ready to paste into a Claude prompt. */
export function contextAsText(ctx) {
  const parts = [ctx.company?.trim()];
  if (ctx.contentIdeas) parts.push(ctx.contentIdeas.trim());
  if (ctx.excerpts?.length)
    parts.push(
      "# In Odell's own words (matching transcript excerpts)\n\n" +
        ctx.excerpts.map((h) => `## ${h.title}${h.date ? ` (${h.date})` : ""}\n${h.snippets.map((s) => `> ${s}`).join("\n\n")}`).join("\n\n"),
    );
  if (ctx.brand) {
    const b = ctx.brand;
    const line = (label, list) => (list?.length ? `- ${label}: ${list.join(", ")}` : null);
    parts.push(["# Brand kit (from the Assets tab)",
      line("Colors", b.colors?.map((c) => `${c.name || "color"} ${c.hex}`)),
      line("Fonts", b.fonts?.map((f) => f.family)),
      line("Logos", b.logos?.map((l) => l.title)),
    ].filter(Boolean).join("\n"));
  }
  return parts.filter(Boolean).join("\n\n---\n\n");
}

// ---------------------------------------------------------------------------
// HTTP API

export function createMemory() {
  const router = express.Router();
  const upload = multer({ dest: path.join(os.tmpdir(), "hba-memory-uploads"), limits: { fileSize: 20 * 1024 * 1024 } });
  const origin = (req) => `${req.protocol}://${req.get("host")}`;
  const handle = (fn) => async (req, res) => {
    try {
      const out = await fn(req, res);
      if (!res.headersSent) res.json(out);
    } catch (err) {
      for (const f of req.files || []) if (f?.path) fs.rm(f.path, { force: true }).catch(() => {});
      res.status(err.status || 400).json({ error: err.message });
    }
  };

  router.use(express.json({ limit: "10mb" }));
  router.use("/ui", express.static(path.join(HERE, "public"), { setHeaders: (res) => res.set("Cache-Control", "no-cache") }));

  /** Overview for the Memory page. */
  router.get("/", handle(async (req) => {
    const [company, transcripts, docs, projects, brand] = await Promise.all([
      readDoc(COMPANY_FILE),
      listTranscripts(),
      listDocs(),
      projectTranscripts(),
      brandKit(origin(req)),
    ]);
    return {
      kinds: KINDS,
      company,
      transcripts,
      projects: projects.map(({ text, ...p }) => p),
      docs,
      brand,
    };
  }));

  /** The company profile. Markdown by default; ?format=json for { body, updatedAt }. */
  router.get("/company", handle(async (req, res) => {
    const doc = await readDoc(COMPANY_FILE);
    if (req.query.format === "json") return doc;
    res.type("text/markdown").send(doc.body);
  }));
  router.put("/company", handle(async (req) => saveCompany(req.body?.body)));

  /** One call for other sessions: GET /context?q=<topic>[&format=text]. */
  router.get("/context", handle(async (req, res) => {
    const list = (v) => (v ? String(v).split(",").map((x) => x.trim()).filter(Boolean) : null);
    const ctx = await companyContext({
      q: req.query.q || "",
      excerpts: Math.min(20, Number(req.query.excerpts) || 6),
      origin: origin(req),
      preset: req.query.preset || null,
      sections: list(req.query.sections)?.map(Number) || null,
      parts: list(req.query.parts) || ALL_PARTS,
    });
    if (req.query.format === "text") return res.type("text/plain").send(contextAsText(ctx));
    return ctx;
  }));

  router.get("/search", handle(async (req) => ({ q: req.query.q || "", hits: await search(req.query.q, { limit: Math.min(30, Number(req.query.limit) || 10) }) })));

  router.get("/docs/:file", handle(async (req, res) => {
    const file = path.basename(req.params.file);
    if (!file.endsWith(".md")) throw new Error("Only shared .md docs.");
    const doc = await readDoc(path.join(SHARED_DIR, file));
    if (!doc.updatedAt) throw Object.assign(new Error("No such doc."), { status: 404 });
    if (req.query.format === "json") return { file, ...doc };
    res.type("text/markdown").send(doc.body);
  }));

  router.get("/transcripts", handle(async () => ({ kinds: KINDS, items: await listTranscripts() })));

  router.get("/transcripts/:id", handle(async (req, res) => {
    if (req.params.id.startsWith("project-")) {
      const p = (await projectTranscripts()).find((t) => t.id === req.params.id);
      if (!p) throw Object.assign(new Error("No such transcript."), { status: 404 });
      return p;
    }
    await load();
    const item = db.items.find((t) => t.id === req.params.id);
    if (!item) throw Object.assign(new Error("No such transcript."), { status: 404 });
    const text = await readText(item.id);
    if (req.query.format === "text") return res.type("text/plain").send(text);
    return { ...item, text };
  }));

  /** Upload transcript files (files[]), or paste one: JSON { title, text, kind, date, tags, notes }. */
  router.post("/transcripts", upload.array("files", 200), handle(async (req) => {
    const added = [];
    const skipped = [];
    for (const f of req.files || []) {
      try {
        const raw = await fs.readFile(f.path, "utf8");
        const { title, date } = parseName(f.originalname);
        const text = toPlainText(raw, f.originalname);
        const r = await addTranscript({ text, title, date, source: f.originalname, kind: req.body.kind, tags: req.body.tags });
        (r.duplicate ? skipped : added).push(r.item);
      } finally {
        fs.rm(f.path, { force: true }).catch(() => {});
      }
    }
    if (!req.files?.length) {
      const r = await addTranscript({ ...req.body, text: toPlainText(req.body.text) });
      (r.duplicate ? skipped : added).push(r.item);
    }
    return { added, skipped };
  }));

  router.patch("/transcripts/:id", handle(async (req) => {
    await load();
    const item = db.items.find((t) => t.id === req.params.id);
    if (!item) throw Object.assign(new Error("No such transcript."), { status: 404 });
    const b = req.body || {};
    if (b.title !== undefined) item.title = clean(b.title, 140) || item.title;
    if (b.kind !== undefined && KIND_IDS.has(b.kind)) item.kind = b.kind;
    if (b.date !== undefined) item.date = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : null;
    if (b.tags !== undefined) item.tags = parseTags(b.tags);
    if (b.notes !== undefined) item.notes = String(b.notes ?? "").slice(0, 4000);
    if (b.text !== undefined) {
      const text = String(b.text).trim();
      await atomicWrite(textPath(item.id), text + "\n");
      item.words = wordCount(text);
    }
    item.updatedAt = now();
    await persist();
    return item;
  }));

  router.delete("/transcripts/:id", handle(async (req) => {
    await load();
    const i = db.items.findIndex((t) => t.id === req.params.id);
    if (i === -1) throw Object.assign(new Error("No such transcript."), { status: 404 });
    const [item] = db.items.splice(i, 1);
    await fs.rm(textPath(item.id), { force: true });
    await persist();
    return { ok: true };
  }));

  return { router };
}

export const { router } = createMemory();
