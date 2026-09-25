// The creator's colour grades. A .cube lookup table uploaded to Assets (type "lut") can be applied to a clip's
// footage while it's cut, so renders carry the same look as their hand-graded videos. Off unless a clip asks for it.
import fs from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./tools.js";

const LIBRARY = path.join(ROOT, "data", "resources", "library.json");
const FILES = path.join(ROOT, "data", "resources", "files");

/** Every LUT in the Assets library: [{ id, title, file }]. Empty when none have been uploaded. */
export async function listLuts() {
  try {
    const db = JSON.parse(await fs.readFile(LIBRARY, "utf8"));
    return (db.items || [])
      .filter((i) => i.type === "lut" && i.file?.stored)
      .map((i) => ({ id: i.id, title: i.title || i.file.name, file: path.join(FILES, i.id, i.file.stored) }));
  } catch {
    return [];
  }
}

/** The file path for a clip's chosen grade, or null when it's off or the asset is gone. */
export async function lutPath(id) {
  if (!id || id === "none") return null;
  const found = (await listLuts()).find((l) => l.id === id);
  if (!found) return null;
  try {
    await fs.access(found.file);
    return found.file;
  } catch {
    return null;
  }
}

/** ffmpeg needs the path inside a filter string, where : and \ and ' all mean something. */
export const lutFilter = (file) => `lut3d=file='${String(file).replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'")}'`;
