// data/ads/db.json: one record per ad. Re-read when another process wrote it, written atomically.
//   ad { id, projectId, clipId, name, prompt, aspect, options, grade, status, message, error, summary, stats,
//        history[{ prompt, at }], createdAt, updatedAt }
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ROOT } from "../lib/tools.js";

export const DATA_DIR = path.join(ROOT, "data", "ads");
const DB_FILE = path.join(DATA_DIR, "db.json");

let db = null;
let syncedAt = 0;
let writes = Promise.resolve();

export async function load() {
  const changed = await fs.stat(DB_FILE).then((s) => s.mtimeMs > syncedAt, () => false);
  if (!db || changed) {
    let data = {};
    try {
      const raw = await fs.readFile(DB_FILE, "utf8");
      syncedAt = (await fs.stat(DB_FILE)).mtimeMs;
      data = JSON.parse(raw);
    } catch (err) {
      if (err.code !== "ENOENT") throw err; // a hand-edit broke the JSON: never overwrite it
    }
    db = { ads: Array.isArray(data.ads) ? data.ads : [] };
  }
  return db;
}

export function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writes = writes
    .then(async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.${crypto.randomBytes(4).toString("hex")}.tmp`;
      await fs.writeFile(tmp, `${snapshot}\n`);
      await fs.rename(tmp, DB_FILE);
      syncedAt = await fs.stat(DB_FILE).then((s) => s.mtimeMs, () => Date.now());
    })
    .catch((err) => console.error("Ads: saving failed:", err.message));
  return writes;
}

export const newId = () => `ad${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;

export async function findAd(id) {
  return (await load()).ads.find((a) => a.id === id) || null;
}

export async function adFor(projectId, clipId) {
  return (await load()).ads.find((a) => a.projectId === projectId && a.clipId === clipId) || null;
}

/**
 * Patch one ad. The patch lands on the ad as it is on disk now, not only on the caller's copy: a long job holds its
 * `ad` across minutes, and if another process wrote db.json meanwhile (load() re-reads it), writing the caller's
 * stale copy back would undo that process's changes. Only the patched fields are written.
 */
export async function update(ad, patch) {
  const stamped = { ...patch, updatedAt: new Date().toISOString() };
  Object.assign(ad, stamped);
  const current = (await load()).ads.find((a) => a.id === ad.id);
  if (current && current !== ad) Object.assign(current, stamped);
  await persist();
  return ad;
}

// data/ads/settings.json: the creator's two grade templates (Assets LUT ids) and which one new ads start on.
//   { gradeTemplates: [lutId | "none", lutId | "none"], defaultTemplate: 1 | 2 }
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export async function readSettings() {
  const data = await fs.readFile(SETTINGS_FILE, "utf8").then(JSON.parse, () => ({}));
  const t = Array.isArray(data.gradeTemplates) ? data.gradeTemplates : [];
  return { gradeTemplates: [t[0] || "none", t[1] || "none"], defaultTemplate: data.defaultTemplate === 2 ? 2 : 1 };
}

export async function writeSettings(settings) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${SETTINGS_FILE}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(settings, null, 2)}\n`);
  await fs.rename(tmp, SETTINGS_FILE);
  return settings;
}
