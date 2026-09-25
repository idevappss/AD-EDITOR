// Reclaiming disk without losing work. A finished project keeps what matters — the rendered clips, the transcript,
// the picks — while the heavy originals and scratch files go. Sources stay full quality until the creator says the
// project is done, because a 9:16 clip cut from a 4K landscape frame is only sharp while those pixels exist.
import fs from "node:fs/promises";
import path from "node:path";
import { projectDir, loadProject, listProjects, saveProject } from "./store.js";
import { WORK_FILE } from "./work.js";

const sizeOf = async (file) => {
  try {
    const s = await fs.stat(file);
    if (!s.isDirectory()) return s.size;
    const entries = await fs.readdir(file, { withFileTypes: true });
    let total = 0;
    for (const e of entries) total += await sizeOf(path.join(file, e.name));
    return total;
  } catch {
    return 0;
  }
};

/** What each project is holding, and what could be freed. */
export async function diskReport() {
  const rows = [];
  // Ad projects live in the same folder and hold the same heavy files, so they're counted too.
  for (const summary of await listProjects({ ads: true })) {
    const dir = projectDir(summary.id);
    const project = await loadProject(summary.id);
    const files = await fs.readdir(dir).catch(() => []);
    const source = (await Promise.all(files.filter((f) => /^source\./.test(f)).map((f) => sizeOf(path.join(dir, f))))).reduce((a, b) => a + b, 0);
    const work = await sizeOf(path.join(dir, WORK_FILE));
    const scratch = await sizeOf(path.join(dir, "compositions"));
    const renders = await sizeOf(path.join(dir, "renders"));
    rows.push({
      id: summary.id,
      name: project?.name || summary.id,
      clips: (project?.clips || []).length,
      rendered: (project?.clips || []).filter((c) => c.render?.status === "done").length,
      tidied: Boolean(project?.tidiedAt),
      source,
      work,
      scratch,
      renders,
      // Scratch is always safe; source and the working copy go only when the creator tidies the project.
      freeable: scratch + (project?.clips?.some((c) => c.render?.status === "done") ? source + work : 0),
    });
  }
  return rows.sort((a, b) => b.freeable - a.freeable);
}

/**
 * Free a project's space. "scratch" clears only render leftovers (always safe, rebuilt on the next render).
 * "full" also drops the source video and working copy, keeping the finished clips, transcript, picks and poster —
 * after that the project can't be re-clipped or re-rendered without uploading the video again.
 */
export async function tidyProject(id, { level = "scratch" } = {}) {
  const project = await loadProject(id);
  if (!project) throw new Error("Project not found");
  const dir = projectDir(id);
  const before = await sizeOf(dir);
  await fs.rm(path.join(dir, "compositions"), { recursive: true, force: true });
  if (level === "full") {
    if (!(project.clips || []).some((c) => c.render?.status === "done")) throw new Error("Render this video's clips before clearing its source.");
    for (const f of await fs.readdir(dir).catch(() => [])) if (/^source\./.test(f)) await fs.rm(path.join(dir, f), { force: true });
    await fs.rm(path.join(dir, WORK_FILE), { force: true });
    await fs.rm(path.join(dir, "faces"), { recursive: true, force: true });
    await fs.rm(path.join(dir, "focus"), { recursive: true, force: true });
    await fs.rm(path.join(dir, "cuts"), { recursive: true, force: true });
    project.tidiedAt = new Date().toISOString();
    project.message = "Cleared to free space — clips and transcript kept";
    await saveProject(project);
  }
  const after = await sizeOf(dir);
  return { id, freed: Math.max(0, before - after), level };
}
