// Thumbnails: every imported video gets YouTube-ready 1280×720 thumbnails made for it, automatically, while
// it's still transcribing — unless the creator switches that off, globally or for one video. Each one is built
// and checked by the creator's YouTube Thumbnails SOP (sop.js, SOP.md): three variations to A/B test, each on
// one of the five types, run through the four tests and the Banger checklist. The creator's own photos work too.
// Owned by the THUMBNAILS session: thumbnails/ and data/thumbnails/. It only ever reads projects/.
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import os from "node:os";
import express from "express";
import multer from "multer";
import { ROOT } from "../lib/tools.js";
import { listProjects, loadProject, projectDir } from "../lib/store.js";
import { candidates, photoCandidates } from "./frames.js";
import { headlineFor, hasClaudeKey, VARIATIONS } from "./headline.js";
import { checkSet } from "./check.js";
import { router as styleRouter, styleBlock, styleImages, renderHints } from "./style.js";
import { LAYOUTS, LAYOUT_IDS, autoLayout, brandStyle, thumbnailHtml } from "./compose.js";
import { shoot, fileUrl, closeBrowser } from "./shot.js";
import { TYPES, TONES, TONE_IDS, CHECKLIST, PRESETS, MAX_WORDS } from "./sop.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(ROOT, "data", "thumbnails");
const DB_FILE = path.join(DATA_DIR, "db.json");
const FILES_DIR = path.join(DATA_DIR, "files");

const THUMB = "thumb.jpg";
const POLL_MS = 15_000;
const CANDIDATE_COUNT = 16;
const MAX_PHOTOS = 12;
/** A video that's still transcribing has enough picture to work with; one still importing doesn't. */
const READY_STATES = new Set(["transcribing", "analyzing", "ready", "rendering", "done", "complete", "failed"]);

const now = () => new Date().toISOString();
const clean = (s, max = 200) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const newId = () => `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

// ---------------------------------------------------------------------------
// data/thumbnails/db.json
//   settings { auto, layout, sub, logo, accent, presets }   — auto:false stops every automatic thumbnail
//   projects { <projectId>: { auto, state, error, itemId, at } }  — auto:false skips just that video
//   items    [ Item ]   — the thumbnail each video (or photo set) leads with now
//   history  [ Item ]   — the other variations of a set (alt: true) and the ones they replaced, newest first
//
// An Item is one variation. Variations made together share `set` and are lettered A, B, C by `variant`.
// Their candidate stills live once, in files/<stills>/; each variation's picture in files/<id>/thumb.jpg.
// Items made before sets existed keep both in files/<id>/.

const DEFAULTS = { auto: true, layout: "auto", sub: true, logo: false, accent: null, presets: [] };

let db;
let writes = Promise.resolve();
let syncedAt = 0;

/**
 * The library, re-read whenever the file has changed since we last touched it — the app and a dev server can
 * both be up, and neither should overwrite what the other saved.
 */
async function load() {
  const changed = await fs.stat(DB_FILE).then((s) => s.mtimeMs > syncedAt).catch(() => false);
  if (!db || changed) {
    let data = {};
    try {
      const raw = await fs.readFile(DB_FILE, "utf8");
      syncedAt = (await fs.stat(DB_FILE)).mtimeMs;
      data = JSON.parse(raw);
    } catch (err) {
      if (err.code !== "ENOENT") throw err; // a hand-edit broke the JSON — never overwrite it
    }
    db = {
      settings: { ...DEFAULTS, ...(data.settings || {}) },
      projects: data.projects && typeof data.projects === "object" ? data.projects : {},
      items: Array.isArray(data.items) ? data.items : [],
      history: Array.isArray(data.history) ? data.history : [],
    };
  }
  return db;
}

function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writes = writes
    .then(async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.${crypto.randomBytes(4).toString("hex")}.tmp`;
      await fs.writeFile(tmp, `${snapshot}\n`);
      await fs.rename(tmp, DB_FILE);
      syncedAt = await fs.stat(DB_FILE).then((s) => s.mtimeMs, () => Date.now());
    })
    .catch((err) => console.error("Saving thumbnails failed:", err.message));
  return writes;
}

const projectState = (id) => (db.projects[id] ??= { auto: null, state: "waiting", error: null, itemId: null, at: null });
/** Automatic thumbnails run when the switch is on and this video hasn't been switched off. */
const autoFor = (id) => db.settings.auto !== false && projectState(id).auto !== false;
const presets = () => [...PRESETS, ...(db.settings.presets || []).filter((p) => !PRESETS.some((x) => x.toLowerCase() === p.toLowerCase()))];

// ---------------------------------------------------------------------------
// Files

const itemFile = (item, name = THUMB) => path.join(FILES_DIR, item.id, name);
const stillsId = (item) => item.stills || item.id;
const stillFile = (item, name) => path.join(FILES_DIR, stillsId(item), name);
const everything = () => [...db.items, ...db.history];

/** Forget an item's picture, and its stills once no other variation still uses them. */
async function dropFiles(item) {
  await fs.rm(path.join(FILES_DIR, item.id), { recursive: true, force: true }).catch(() => {});
  const stills = stillsId(item);
  if (stills !== item.id && !everything().some((i) => i !== item && (stillsId(i) === stills || i.id === stills))) {
    await fs.rm(path.join(FILES_DIR, stills), { recursive: true, force: true }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Making them

/** The lightest copy of the video that exists: the working copy when the pipeline has made one. */
function videoFor(project) {
  const dir = projectDir(project.id);
  const work = path.join(dir, "work.mp4");
  if (existsSync(work)) return work;
  const source = project.source?.file && path.join(dir, project.source.file);
  return source && existsSync(source) ? source : null;
}

/** Whatever has been transcribed so far — a video mid-transcription still gives us something to read. */
async function transcriptText(project) {
  if (Array.isArray(project.segments) && project.segments.length) return project.segments.map((s) => s.text).join(" ");
  try {
    const raw = JSON.parse(await fs.readFile(path.join(projectDir(project.id), "transcript.json"), "utf8"));
    const segments = Array.isArray(raw) ? raw : raw.segments || [];
    return segments.map((s) => s.text).join(" ");
  } catch {
    return "";
  }
}

/** The YouTube title the thumbnail pairs with: the analysis's best one, when it has run. */
const titleFor = (project) =>
  [...(project?.analysis?.youtubeTitles || [])].sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.title || "";

/** The creator's title taste, so thumbnail words sound like them. Optional: titles/ is its own session. */
async function taste() {
  try {
    const { titleGuidance } = await import("../titles/index.js");
    return (await titleGuidance()) || "";
  } catch {
    return "";
  }
}

/** The last ten thumbnails that led, so the next one stays on-brand. */
const recent = () =>
  everything()
    .filter((i) => i.headline && !i.alt)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 10)
    .map((i) => ({ headline: i.headline, type: i.type, liked: i.liked }));

/** Replaced thumbnails stay browsable under "All thumbnails" until they fall off the end of the history. */
const HISTORY_MAX = 80;
async function archive(items, { set = null } = {}) {
  // A variation stepping aside for another from its own set stays a variation; anything else was replaced.
  for (const old of items) db.history.unshift(old.set && old.set === set ? { ...old, alt: true } : { ...old, alt: false, replacedAt: now() });
  for (const dropped of db.history.splice(HISTORY_MAX)) await dropFiles(dropped);
}

/** Render (or re-render) an item's picture from its stored still and words. */
async function paint(item) {
  const style = await brandStyle({ accent: item.accent, logo: item.logo });
  const hints = await renderHints();
  const layout = LAYOUT_IDS.has(item.layout) ? item.layout : autoLayout(item.frame?.face);
  const html = thumbnailHtml({
    imageUrl: fileUrl(stillFile(item, item.frame.file)),
    headline: item.layout === "word" ? item.word || item.headline : item.headline,
    sub: item.sub,
    layout,
    accent: style.accent,
    face: item.frame?.face,
    aspect: item.frame?.aspect,
    logoUrl: style.logoUrl,
    badge: item.badge,
    hit: item.word,
    tone: item.tone,
    ...hints,
  });
  await fs.mkdir(path.join(FILES_DIR, item.id), { recursive: true });
  const shot = await shoot(html, itemFile(item));
  Object.assign(item, { usedLayout: layout, usedAccent: style.accent, lines: shot.lines, width: shot.width, height: shot.height, size: shot.size, updatedAt: now() });
  return item;
}

const frameRecord = (c) => ({ file: path.basename(c.file), at: c.at, face: c.face, faces: c.faces, aspect: c.aspect, score: c.score, name: c.name });
const LETTERS = "ABCDEFGH";
const trimWords = (s) => clean(s, 120).split(" ").filter(Boolean).slice(0, MAX_WORDS).join(" ");

/** The four tests on a set; with `fix`, what fails and can be fixed gets fixed, repainted and tested again. */
async function runChecks(set, { title, fix = false, signal, onProgress } = {}) {
  const tmpDir = path.join(FILES_DIR, stillsId(set[0]));
  const asInput = () => set.map((it) => ({ file: itemFile(it), headline: it.headline, type: it.type, gap: it.gap, badge: it.badge, layout: it.usedLayout, lines: it.lines }));
  const style = await styleBlock();
  let report = await checkSet(asInput(), { title, recent: recent(), style, signal, tmpDir });
  if (!report) return null;
  if (fix) {
    let changed = false;
    for (const [i, r] of report.results.entries()) {
      if (!r.fix || r.checks.every((c) => c.pass)) continue;
      const it = set[i];
      const notes = [];
      if (r.fix.headline && !it.preset && trimWords(r.fix.headline) !== it.headline) {
        notes.push(`words “${it.headline}” → “${trimWords(r.fix.headline)}”`);
        it.headline = trimWords(r.fix.headline);
        it.word = r.fix.word || it.headline.split(" ").sort((a, b) => b.length - a.length)[0];
      }
      if (r.fix.layout && LAYOUT_IDS.has(r.fix.layout) && r.fix.layout !== it.usedLayout) {
        notes.push(`layout → ${r.fix.layout}`);
        it.layout = r.fix.layout;
      }
      if (r.fix.badge) {
        const badge = /^none$/i.test(r.fix.badge) ? "" : clean(r.fix.badge, 18);
        if (badge !== it.badge) notes.push(badge ? `corner → “${badge}”` : "corner removed");
        it.badge = badge;
      }
      if (!notes.length) continue;
      it.fixed = `Fixed after the checklist: ${notes.join(", ")}.`;
      await paint(it);
      changed = true;
    }
    if (changed) {
      onProgress?.("Re-checking the fixes");
      report = (await checkSet(asInput(), { title, recent: recent(), style, signal, tmpDir })) || report;
    }
  }
  set.forEach((it, i) => {
    it.checks = report.results[i]?.checks || [];
    it.checkNote = report.offline || "";
    it.checkedAt = now();
    it.checksStale = false;
  });
  return report;
}

/**
 * Build a set of variations from scored stills, paint them, run the tests, and make the lead one the
 * thumbnail for `projectId`. Returns the lead item.
 */
async function makeSet({ projectId, name, upload = false, cands, stills, text = "", title = "", about = "", notes = "", preset = "", signal, onProgress }) {
  onProgress?.(hasClaudeKey() ? "Claude is building the variations" : "Picking the stills");
  const tmpDir = path.join(FILES_DIR, stills);
  const picked = await headlineFor({
    cands, text, name, notes, title, about, recent: recent(), preset, taste: await taste(),
    style: await styleBlock(), styleImages: await styleImages(4), signal, tmpDir,
  });

  const set = newId();
  const items = [];
  for (const [i, v] of picked.variants.entries()) {
    const frame = v.frame || cands[0];
    const item = {
      id: newId(),
      projectId,
      name: clean(name) || "Untitled",
      set,
      variant: LETTERS[i],
      stills,
      upload,
      title,
      about: clean(about, 400),
      preset: clean(preset, 60) || null,
      type: v.type,
      gap: v.gap,
      stoppers: v.stoppers,
      tone: v.tone,
      headline: v.headline,
      word: v.word || v.headline.split(" ").pop(),
      sub: db.settings.sub ? v.sub : "",
      badge: v.corner || "",
      layout: db.settings.layout === "auto" ? v.layout : db.settings.layout,
      accent: db.settings.accent,
      logo: db.settings.logo === true,
      why: v.why,
      demo: picked.demo === true,
      partial: !upload && !text,
      liked: null,
      auto: !upload,
      frame: frameRecord(frame),
      candidates: cands.map(frameRecord),
      createdAt: now(),
      updatedAt: now(),
    };
    onProgress?.(`Painting variation ${item.variant}`);
    await paint(item);
    items.push(item);
  }

  let lead = picked.lead;
  try {
    onProgress?.("Running the four tests");
    const report = await runChecks(items, { title, fix: true, signal, onProgress });
    if (report && !report.offline) lead = report.lead;
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    items.forEach((it) => (it.checkNote = `The checklist couldn't run: ${err.message.split("\n")[0]}`));
  }

  const leader = items[lead] || items[0];
  await archive(db.items.filter((i) => i.projectId === projectId));
  db.items = db.items.filter((i) => i.projectId !== projectId);
  db.items.unshift(leader);
  for (const alt of items.filter((i) => i !== leader).reverse()) db.history.unshift({ ...alt, alt: true });
  Object.assign(projectState(projectId), { state: "ready", error: null, itemId: leader.id, at: now() });
  await persist();
  return leader;
}

const running = new Map();
/** One job per video (or photo set) at a time; a second ask gets the job already running. */
function job(key, fn) {
  if (running.has(key)) return running.get(key);
  const p = fn();
  running.set(key, p);
  p.catch(() => {}).finally(() => running.delete(key));
  return p;
}

async function failed(projectId, stills, err) {
  await fs.rm(path.join(FILES_DIR, stills), { recursive: true, force: true }).catch(() => {});
  if (err?.name !== "AbortError") {
    Object.assign(projectState(projectId), { state: "failed", error: err.message.split("\n")[0], at: now() });
    await persist();
  }
}

/**
 * Make the thumbnails for one project: stills → Claude builds three variations by the SOP → Chrome paints
 * them → the four tests. Replaces the project's earlier thumbnail. Returns the lead item.
 */
export function generate(projectId, { preset = "", signal, onProgress } = {}) {
  return job(projectId, async () => {
    await load();
    const project = await loadProject(projectId);
    if (!project) throw new Error("Project not found");
    const video = videoFor(project);
    if (!video) throw new Error("This project has no video yet.");
    Object.assign(projectState(projectId), { state: "working", error: null, at: now() });
    await persist();

    const stills = newId();
    try {
      onProgress?.("Reading frames");
      const cands = await candidates(video, { duration: project.source?.duration || 60, count: CANDIDATE_COUNT, outDir: path.join(FILES_DIR, stills), signal });
      return await makeSet({
        projectId, name: project.name, cands, stills, preset, signal, onProgress,
        text: await transcriptText(project), title: titleFor(project), notes: project.options?.notes,
      });
    } catch (err) {
      await failed(projectId, stills, err);
      throw err;
    }
  });
}

/**
 * Thumbnails from the creator's own photos. With `videoId` they become that video's thumbnails (and read its
 * transcript and title); without one they stand on their own. files: [{ path, name }].
 */
export function fromPhotos({ files, videoId = "", title = "", about = "", preset = "", signal, onProgress }) {
  const projectId = videoId || `photos-${newId()}`;
  return job(projectId, async () => {
    await load();
    const project = videoId ? await loadProject(videoId) : null;
    if (videoId && !project) throw new Error("That video isn't in Projects any more.");
    Object.assign(projectState(projectId), { state: "working", error: null, at: now() });
    const stills = newId();
    try {
      onProgress?.("Reading your photos");
      const cands = await photoCandidates(files, { outDir: path.join(FILES_DIR, stills), signal });
      return await makeSet({
        projectId, name: clean(title) || project?.name || "Photo thumbnail", upload: true, cands, stills, preset, about, signal, onProgress,
        text: project ? await transcriptText(project) : "", title: clean(title) || titleFor(project), notes: project?.options?.notes,
      });
    } catch (err) {
      await failed(projectId, stills, err);
      throw err;
    }
  });
}

/** Fresh variations for the same thumbnail. Video ones re-read the video; photo ones reuse the photos. */
function remake(item, { preset = "" } = {}) {
  if (!item.upload) return generate(item.projectId, { preset });
  return job(item.projectId, async () => {
    await load();
    const cands = (item.candidates || []).map((c) => ({ ...c, file: stillFile(item, c.file) })).sort((a, b) => b.score - a.score);
    if (!cands.length) throw new Error("This thumbnail's photos are gone. Upload them again.");
    Object.assign(projectState(item.projectId), { state: "working", error: null, at: now() });
    const project = item.projectId.startsWith("photos-") ? null : await loadProject(item.projectId);
    return makeSet({
      projectId: item.projectId, name: item.name, upload: true, cands, stills: stillsId(item), preset, about: item.about,
      text: project ? await transcriptText(project) : "", title: item.title || titleFor(project), notes: project?.options?.notes,
    });
  });
}

// ---------------------------------------------------------------------------
// The watcher: new videos get a thumbnail on their own, one at a time

let timer = null;
let ticking = false;

/** Projects that should get an automatic thumbnail right now. */
async function pending() {
  const projects = await listProjects();
  return projects.filter((p) => {
    if (!autoFor(p.id)) return false;
    if (db.items.some((i) => i.projectId === p.id)) return false;
    const state = projectState(p.id);
    if (state.state === "working" || state.state === "failed") return false;
    if (!p.source?.duration) return false;
    return READY_STATES.has(p.status) || Boolean(p.clips?.length);
  });
}

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    await load();
    if (db.settings.auto === false) return;
    for (const project of await pending()) {
      if (db.settings.auto === false) break; // switched off mid-run
      try {
        await generate(project.id);
        console.log(`Thumbnail ready for "${project.name || project.id}".`);
      } catch (err) {
        console.error(`Thumbnail for ${project.id} failed:`, err.message.split("\n")[0]);
      }
    }
  } catch (err) {
    console.error("Thumbnail watcher:", err.message);
  } finally {
    ticking = false;
  }
}

export function start() {
  if (timer) return;
  timer = setInterval(() => tick(), POLL_MS);
  timer.unref?.();
  tick();
}

export async function stop() {
  clearInterval(timer);
  timer = null;
  await closeBrowser();
}

// ---------------------------------------------------------------------------
// HTTP API, mounted at /api/thumbnails

/** An item as the tab sees it: its URLs, its stills, and the other variations of its set. */
function publicItem(item, base = "/api/thumbnails") {
  const siblings = item.set ? everything().filter((i) => i.set === item.set).sort((a, b) => (a.variant || "").localeCompare(b.variant || "")) : [item];
  return {
    ...item,
    url: `${base}/items/${item.id}/file`,
    downloadUrl: `${base}/items/${item.id}/file?download`,
    frames: (item.candidates || []).map((c) => ({ ...c, url: `${base}/items/${item.id}/frames/${encodeURIComponent(c.file)}` })),
    candidates: undefined,
    passed: item.checks?.length ? item.checks.filter((c) => c.pass).length : null,
    variants: siblings.map((i) => ({
      id: i.id,
      variant: i.variant || "A",
      headline: i.headline,
      type: i.type,
      passed: i.checks?.length ? i.checks.filter((c) => c.pass).length : null,
      total: i.checks?.length || 0,
      current: db.items.includes(i),
      url: `${base}/items/${i.id}/file`,
      downloadUrl: `${base}/items/${i.id}/file?download`,
      updatedAt: i.updatedAt,
    })),
  };
}

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message.split("\n")[0] });
  }
};

const find = async (id, { past = true } = {}) => {
  await load();
  const item = db.items.find((i) => i.id === id) || (past ? db.history.find((i) => i.id === id) : null);
  if (!item) throw Object.assign(new Error("That thumbnail is gone."), { status: 404 });
  return item;
};

/** Put an item up as its video's thumbnail; the one it displaces joins the history. */
async function makeCurrent(item) {
  if (db.items.includes(item)) return item;
  await archive(db.items.filter((i) => i.projectId === item.projectId), { set: item.set });
  db.items = db.items.filter((i) => i.projectId !== item.projectId);
  db.history = db.history.filter((i) => i !== item);
  delete item.replacedAt;
  item.alt = false;
  item.updatedAt = now();
  db.items.unshift(item);
  Object.assign(projectState(item.projectId), { state: "ready", itemId: item.id, error: null });
  await persist();
  return item;
}

const UPLOADS = path.join(os.tmpdir(), "hba-thumbnail-photos");
const photoUpload = multer({
  dest: UPLOADS,
  limits: { fileSize: 60 * 1024 * 1024, files: MAX_PHOTOS },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|tiff?|bmp)$/i.test(file.originalname)),
});

export const router = express.Router();
router.use(express.json({ limit: "1mb" }));
router.use("/style", styleRouter);
router.use("/ui", express.static(path.join(HERE, "public"), { setHeaders: (res) => res.set("Cache-Control", "no-cache") }));

/** Everything the tab shows: the switch, every video, the photo sets, and the thumbnails made for them. */
router.get("/", handle(async (req) => {
  await load();
  const projects = await listProjects();
  const byProject = new Map(db.items.map((i) => [i.projectId, i]));
  const names = new Map(projects.map((p) => [p.id, p.name]));
  return {
    settings: db.settings,
    layouts: LAYOUTS,
    presets: presets(),
    sop: { types: TYPES, tones: TONES, checklist: CHECKLIST, variations: VARIATIONS },
    claude: hasClaudeKey(),
    working: [...running.keys()],
    history: db.history.map((i) => ({ ...publicItem(i, req.baseUrl), past: true, videoName: names.get(i.projectId) || i.name })),
    photos: db.items.filter((i) => i.upload && !names.has(i.projectId)).map((i) => ({ ...publicItem(i, req.baseUrl), videoName: i.name })),
    videos: projects.map((p) => {
      const state = projectState(p.id);
      const item = byProject.get(p.id);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        duration: p.source?.duration,
        createdAt: p.createdAt,
        auto: state.auto !== false,
        state: running.has(p.id) ? "working" : item ? "ready" : state.state,
        error: state.error,
        thumbnail: item ? publicItem(item, req.baseUrl) : null,
      };
    }),
  };
}));

/** The switches, and the creator's own headline presets. `{ auto: false }` stops every automatic thumbnail. */
router.patch("/settings", handle(async (req) => {
  await load();
  const body = req.body || {};
  if ("auto" in body) db.settings.auto = body.auto !== false;
  if ("sub" in body) db.settings.sub = body.sub !== false;
  if ("logo" in body) db.settings.logo = body.logo === true;
  if ("layout" in body) db.settings.layout = LAYOUT_IDS.has(body.layout) ? body.layout : "auto";
  if ("accent" in body) db.settings.accent = HEX.test(body.accent || "") ? body.accent : null;
  if (Array.isArray(body.presets)) db.settings.presets = [...new Set(body.presets.map((p) => clean(p, 60)).filter(Boolean))].slice(0, 40);
  await persist();
  if (db.settings.auto !== false) tick();
  return { ...db.settings, all: presets() };
}));

/** The per-video switch: `{ auto: false }` means don't make one for this video. */
router.post("/videos/:id/auto", handle(async (req) => {
  await load();
  const state = projectState(req.params.id);
  state.auto = req.body?.auto !== false;
  await persist();
  if (state.auto && db.settings.auto !== false) tick();
  return { id: req.params.id, auto: state.auto };
}));

/** Make them now — by hand, whatever the switches say. `{ preset }` puts those words on every variation. */
router.post("/videos/:id/generate", handle(async (req) => {
  await load();
  projectState(req.params.id).state = "waiting";
  const item = await generate(req.params.id, { preset: req.body?.preset });
  return publicItem(item, req.baseUrl);
}));

/**
 * The creator's photos → three variations. multipart: photos (up to 12), videoId (optional: whose thumbnail
 * it is), title, about, preset.
 */
router.post("/photos", (req, res, next) => photoUpload.array("photos", MAX_PHOTOS)(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())), handle(async (req) => {
  const files = (req.files || []).map((f) => ({ path: f.path, name: f.originalname }));
  try {
    if (!files.length) throw new Error("Add at least one photo (JPEG, PNG, HEIC or WebP).");
    const item = await fromPhotos({
      files,
      videoId: clean(req.body?.videoId, 80),
      title: clean(req.body?.title, 120),
      about: clean(req.body?.about, 400),
      preset: clean(req.body?.preset, 60),
    });
    return publicItem(item, req.baseUrl);
  } finally {
    await Promise.all(files.map((f) => fs.rm(f.path, { force: true }).catch(() => {})));
  }
}));

/** Change the words, the layout, the colour, the tone or the still, then repaint. */
router.patch("/items/:id", handle(async (req) => {
  const item = await find(req.params.id);
  const body = req.body || {};
  if ("headline" in body) item.headline = clean(body.headline, 120);
  if ("word" in body) item.word = clean(body.word, 40);
  if ("sub" in body) item.sub = clean(body.sub, 80);
  if ("badge" in body) item.badge = clean(body.badge, 24);
  if ("layout" in body) item.layout = LAYOUT_IDS.has(body.layout) ? body.layout : null;
  if ("accent" in body) item.accent = HEX.test(body.accent || "") ? body.accent : null;
  if ("logo" in body) item.logo = body.logo === true;
  if ("tone" in body) item.tone = TONE_IDS.includes(body.tone) ? body.tone : "bold";
  if ("frame" in body) {
    const frame = (item.candidates || []).find((c) => c.file === body.frame);
    if (!frame) throw new Error("That still isn't one of this thumbnail's frames.");
    item.frame = { ...frame };
  }
  await paint(item);
  if (item.checks?.length) item.checksStale = true;
  await persist();
  return publicItem(item, req.baseUrl);
}));

/**
 * Add the creator's own photos to a thumbnail's stills (multipart `photos`), and paint it with the best of them.
 * Every variation of the set can use them from then on.
 */
router.post("/items/:id/photos", (req, res, next) => photoUpload.array("photos", MAX_PHOTOS)(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())), handle(async (req) => {
  const files = (req.files || []).map((f) => ({ path: f.path, name: f.originalname }));
  try {
    if (!files.length) throw new Error("Add at least one photo (JPEG, PNG, HEIC or WebP).");
    const item = await find(req.params.id);
    const added = await photoCandidates(files, { outDir: path.join(FILES_DIR, stillsId(item)), prefix: `mine-${newId()}` });
    const records = added.map(frameRecord);
    for (const i of everything().filter((x) => stillsId(x) === stillsId(item))) i.candidates = [...records, ...(i.candidates || [])];
    item.frame = { ...records[0] };
    item.upload = true;
    await paint(item);
    if (item.checks?.length) item.checksStale = true;
    await persist();
    return publicItem(item, req.baseUrl);
  } finally {
    await Promise.all(files.map((f) => fs.rm(f.path, { force: true }).catch(() => {})));
  }
}));

/** Run the four tests and the checklist again on this item's set — after hand edits. Reports; changes nothing. */
router.post("/items/:id/check", handle(async (req) => {
  const item = await find(req.params.id);
  const set = item.set ? everything().filter((i) => i.set === item.set).sort((a, b) => (a.variant || "").localeCompare(b.variant || "")) : [item];
  await runChecks(set, { title: item.title });
  await persist();
  return publicItem(item, req.baseUrl);
}));

/** Fresh variations for the same video or photos. `{ preset }` puts those words on every one. */
router.post("/items/:id/again", handle(async (req) => {
  const item = await find(req.params.id);
  return publicItem(await remake(item, { preset: req.body?.preset }), req.baseUrl);
}));

/** ♥ / ✕ on a thumbnail's words, which also teaches the title taste when that session is installed. */
router.post("/items/:id/rate", handle(async (req) => {
  const item = await find(req.params.id);
  const liked = req.body?.liked === true ? true : req.body?.liked === false ? false : null;
  item.liked = liked;
  await persist();
  try {
    const titles = await import("../titles/index.js");
    if (liked === true) await titles.like({ title: item.headline, kind: "idea", note: "thumbnail headline", source: "thumbnails" });
    if (liked === false) await titles.avoid({ title: item.headline, kind: "idea", note: "thumbnail headline", source: "thumbnails" });
  } catch {
    // titles/ isn't installed, or it's mid-write — the rating still sticks here
  }
  return publicItem(item, req.baseUrl);
}));

/** Lead with this one: another variation of the set, or a replaced thumbnail put back. */
router.post("/items/:id/restore", handle(async (req) => publicItem(await makeCurrent(await find(req.params.id)), req.baseUrl)));

router.delete("/items/:id", handle(async (req) => {
  const item = await find(req.params.id);
  db.history = db.history.filter((i) => i !== item);
  db.items = db.items.filter((i) => i !== item);
  const state = db.projects[item.projectId];
  // Deleting the lead of a set hands the lead to the next variation, when there is one.
  const next = item.set && db.history.find((i) => i.set === item.set && i.alt);
  if (next && state?.itemId === item.id) await makeCurrent(next);
  else if (state && state.itemId === item.id) Object.assign(state, { state: "waiting", itemId: null, error: null });
  await persist();
  await dropFiles(item);
  return { ok: true };
}));

/** The finished 1280×720 JPEG. `?download` saves it under the video's name. */
router.get("/items/:id/file", async (req, res) => {
  try {
    const item = await find(req.params.id);
    const base = (item.name || "thumbnail").replace(/[^\w -]+/g, "").trim() || "thumbnail";
    if (req.query.download !== undefined) res.attachment(`${base}${item.variant ? ` ${item.variant}` : ""}.jpg`);
    res.sendFile(itemFile(item));
  } catch (err) {
    res.status(err.status || 500).type("text").send(err.message);
  }
});

/** One of the candidate stills. */
router.get("/items/:id/frames/:file", async (req, res) => {
  try {
    const item = await find(req.params.id);
    const frame = (item.candidates || []).find((c) => c.file === req.params.file);
    if (!frame) return res.status(404).type("text").send("No such still.");
    res.sendFile(stillFile(item, frame.file));
  } catch (err) {
    res.status(err.status || 500).type("text").send(err.message);
  }
});

/** For other sessions: the thumbnail a video leads with, or null. */
router.get("/for", handle(async (req) => {
  await load();
  const item = db.items.find((i) => i.projectId === req.query.projectId);
  return { thumbnail: item ? publicItem(item, req.baseUrl) : null };
}));

export default { router, start, stop, generate, fromPhotos };
