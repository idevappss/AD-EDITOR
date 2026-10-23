// IRE — the Intentional Reels Editor (#/ire). Intentional reels (lib/intentional.js, #/reels) writes the questions
// to ask Dr Odell on camera; this is where the answers come back. Every question that's been asked or filmed gets a
// place on the page, and the takes filmed for it are dropped in next to it, so each answer is edited against the
// reel it was asked for (its hook, its angle, its headline).
//
// Takes are kept on disk under data/ire/<questionId>/, one file per take. Adding the first take to a question marks
// it "filmed" on the Intentional reels tab too.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import { ROOT } from "../lib/tools.js";
import { listQuestions, setStatus } from "../lib/intentional.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(ROOT, "data", "ire");
const VIDEO = /\.(mp4|mov|m4v|mkv|webm)$/i;

const safeId = (id) => {
  const s = String(id || "");
  if (!/^[\w-]+$/.test(s)) throw Object.assign(new Error("Bad id"), { status: 400 });
  return s;
};

/** The takes filmed for one question, oldest first. */
async function takesFor(questionId) {
  const dir = path.join(DIR, questionId);
  let names;
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const takes = [];
  for (const name of names.filter((n) => VIDEO.test(n))) {
    const stat = await fs.stat(path.join(dir, name));
    takes.push({
      file: name,
      name: name.replace(/^\d+-/, ""),
      size: stat.size,
      addedAt: stat.mtime.toISOString(),
      url: `/api/ire/media/${encodeURIComponent(questionId)}/${encodeURIComponent(name)}`,
    });
  }
  return takes.sort((a, b) => a.file.localeCompare(b.file));
}

/** What the page sees: every question that's been asked or filmed, with its takes; plus how many are still unasked. */
async function overview() {
  const { questions } = await listQuestions();
  const reels = [];
  for (const q of questions.filter((x) => x.status === "asked" || x.status === "filmed")) {
    const { id, title, hook, question, follow_up, angle, who, priority, status, statusAt } = q;
    reels.push({ id, title, hook, question, follow_up, angle, who, priority, status, statusAt, takes: await takesFor(id) });
  }
  // Takes first, then the ones he's been asked but hasn't filmed yet.
  reels.sort((a, b) => (b.takes.length ? 1 : 0) - (a.takes.length ? 1 : 0) || b.priority - a.priority);
  return { reels, unasked: questions.filter((x) => x.status === "new").length };
}

export function start() {}
export function stop() {}

export const router = express.Router();

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

const upload = multer({ dest: path.join(os.tmpdir(), "ire-takes"), limits: { fileSize: 20 * 1024 * 1024 * 1024, files: 20 } });

router.get("/", handle(() => overview()));

/** Drop one or more takes onto a question. The first one marks the question filmed. */
router.post("/reels/:id/takes", upload.array("takes", 20), handle(async (req) => {
  const id = safeId(req.params.id);
  const { questions } = await listQuestions();
  const q = questions.find((x) => x.id === id);
  const files = req.files || [];
  try {
    if (!q) throw Object.assign(new Error("Question not found"), { status: 404 });
    if (!files.length) throw new Error("Drop a video take.");
    const bad = files.find((f) => !VIDEO.test(f.originalname));
    if (bad) throw new Error(`${bad.originalname} isn't a video (.mp4, .mov, .m4v, .mkv, .webm).`);
    const dir = path.join(DIR, id);
    await fs.mkdir(dir, { recursive: true });
    for (const f of files) {
      const clean = path.basename(f.originalname).replace(/[^\w.\- ]+/g, "_");
      const dest = path.join(dir, `${Date.now()}-${clean}`);
      await fs.rename(f.path, dest).catch(async () => {
        await fs.copyFile(f.path, dest);
        await fs.rm(f.path, { force: true });
      });
    }
  } finally {
    await Promise.all(files.map((f) => fs.rm(f.path, { force: true })));
  }
  if (q.status !== "filmed") await setStatus(id, "filmed");
  return overview();
}));

router.delete("/reels/:id/takes/:file", handle(async (req) => {
  const id = safeId(req.params.id);
  const file = path.basename(String(req.params.file));
  await fs.rm(path.join(DIR, id, file), { force: true });
  return overview();
}));

router.get("/media/:id/:file", (req, res) => {
  try {
    const id = safeId(req.params.id);
    res.sendFile(path.join(DIR, id, path.basename(req.params.file)));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.use("/ui", express.static(path.join(HERE, "public"), { setHeaders: (res) => res.set("Cache-Control", "no-cache") }));

export default { router, start, stop };
