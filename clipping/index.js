// Clipping (#/clipping): put one video in, and the engine's winning moment comes back as five versions, one for
// each page you post to. Four are 9:16 with a different caption style each; the fifth is 4:5 with no captions or
// on-screen text. Every version sits on a different song from the sound library, so no two posts sound the same.
//
// The video is an ordinary project (imported through POST /api/projects or /api/projects/import), processed by
// the usual pipeline: transcribe, then Claude picks the moments. This module tags it (project.clipping), and once
// the moments are in, copies the winner into five sibling clips (variantOf = the moment's id) with their own
// designs and queues their renders. Because the versions are plain clips, previews, renders, Finished clips and
// the Scheduler all work on them without anything special.
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { STYLES, normalizeDesign } from "../lib/compose.js";
import { instrumentalTracks, getTrack } from "../lib/sounds.js";
import { loadProject, listProjects, saveProject } from "../lib/store.js";
import { cancelRender, finishedRender, isRendering, queueRender } from "../lib/pipeline.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The five versions of a winning moment. Order is the order they're shown and rendered in. */
export const VERSIONS = [
  { key: "podcast", label: "Podcast Frame", note: "Framed video, clean white captions", design: { style: "podcast", aspect: "9:16", font: "helvetica" } },
  { key: "bold", label: "Bold Pop", note: "Full screen, huge yellow karaoke captions", design: { style: "bold", aspect: "9:16", font: "anton" } },
  { key: "minimal", label: "Clean Minimal", note: "Calm captions with a sliding pill", design: { style: "minimal", aspect: "9:16", font: "interBold" } },
  { key: "talk", label: "Editorial Talk", note: "Bright look, italic serif emphasis words", design: { style: "talk", aspect: "9:16", font: "italic" } },
  { key: "clean", label: "No captions", note: "4:5, no captions or on-screen text", design: { style: "minimal", aspect: "4:5", captions: false, showTitle: false, pops: false } },
];

const hash = (text) => [...String(text)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const versionId = (momentId, key) => `${momentId}-${key}`;

/** The moments Claude picked, best first. Versions are clips too, so they're left out. */
const momentsOf = (project) => (project.clips || []).filter((c) => !c.variantOf && c.source !== "ads").sort((a, b) => (a.rank || 99) - (b.rank || 99));

/**
 * Five different beds for one moment: a run through the instrumental library that starts somewhere different for
 * every video and moment, so each page's post has its own song and the next video doesn't repeat this one's.
 */
async function rotateSounds(project, momentId, count, avoid = []) {
  const tracks = [...(await instrumentalTracks())].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (!tracks.length) return Array(count).fill("none");
  const start = hash(`${project.id}/${momentId}`) % tracks.length;
  const ordered = [...tracks.slice(start), ...tracks.slice(0, start)].map((t) => t.id);
  const fresh = ordered.filter((id) => !avoid.includes(id));
  const pool = fresh.length >= count ? fresh : ordered;
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

/** Copy a moment into its five versions (replacing any it had) and queue them to render. */
export async function makeVersions(project, momentId, { render = true } = {}) {
  const moment = momentsOf(project).find((c) => c.id === momentId);
  if (!moment) throw new Error("That moment isn't in this video.");
  const sounds = await rotateSounds(project, moment.id, VERSIONS.length);
  const { id: _id, render: _render, reviewHistory: _history, design: base = {}, ...rest } = moment;
  // Framing the creator set on the moment (crop, trim-related choices) carries into every version.
  const keep = { cropX: base.cropX, autoFrame: base.autoFrame, lut: base.lut };

  for (const [i, v] of VERSIONS.entries()) {
    const id = versionId(moment.id, v.key);
    const existing = project.clips.find((c) => c.id === id);
    if (existing && isRendering(project, id)) cancelRender(project, id);
    const clip = {
      ...rest,
      id,
      variantOf: moment.id,
      variant: v.key,
      design: normalizeDesign({ ...keep, ...v.design, musicBed: sounds[i] }),
      ...(existing?.render ? { render: existing.render } : {}),
    };
    if (existing) project.clips[project.clips.indexOf(existing)] = clip;
    else project.clips.push(clip);
  }
  project.clipping = { ...(project.clipping || {}), momentId: moment.id, madeAt: new Date().toISOString() };
  await saveProject(project);
  if (render) for (const v of VERSIONS) renderVersion(project, versionId(moment.id, v.key));
  return project;
}

function renderVersion(project, id) {
  const clip = project.clips.find((c) => c.id === id);
  if (!clip || isRendering(project, id)) return;
  try {
    queueRender(project, id, { design: clip.design });
  } catch (err) {
    console.error(`[clipping ${project.id}/${id}]`, err.message);
  }
}

// ---------- what the page sees ----------

async function trackName(id) {
  if (!id || id === "none" || id === "auto") return null;
  return (await getTrack(id))?.name || null;
}

async function versionView(project, clip) {
  const v = VERSIONS.find((x) => x.key === clip.variant) || { label: clip.variant, note: "" };
  const done = finishedRender(clip);
  return {
    id: clip.id,
    key: clip.variant,
    label: v.label,
    note: v.note,
    aspect: clip.design?.aspect,
    captions: clip.design?.captions !== false,
    sound: { id: clip.design?.musicBed || null, name: await trackName(clip.design?.musicBed) },
    render: clip.render ? { status: clip.render.status, progress: clip.render.progress ?? 0, message: clip.render.message || "", error: clip.render.error || null } : null,
    file: done ? `/files/${project.id}/${done.file}` : null,
    renderedAt: done?.renderedAt || null,
  };
}

async function jobView(project) {
  const moments = momentsOf(project);
  const momentId = project.clipping?.momentId || null;
  const versions = [];
  for (const v of VERSIONS) {
    const clip = momentId && project.clips?.find((c) => c.id === versionId(momentId, v.key));
    if (clip) versions.push(await versionView(project, clip));
  }
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    status: project.status,
    message: project.message,
    error: project.error || null,
    duration: project.source?.duration ?? null,
    poster: `/files/${project.id}/poster.jpg`,
    warning: project.analysis?.warning || null,
    auto: project.clipping?.auto !== false,
    momentId,
    moments: moments.map((c) => ({ id: c.id, rank: c.rank, score: c.score, title: c.title, start: c.start, end: c.end, reason: c.reason || "" })),
    versions,
  };
}

// ---------- the watcher: a finished video gets its five versions without anyone waiting on the page ----------

let timer = null;
let ticking = false;

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    for (const project of await listProjects()) {
      if (!project.clipping || project.clipping.momentId || project.clipping.none || project.clipping.auto === false) continue;
      if (project.status !== "ready") continue;
      const best = momentsOf(project)[0];
      if (!best) {
        if (!project.clipping.none) await saveProject(Object.assign(project, { clipping: { ...project.clipping, none: true } }));
        continue;
      }
      await makeVersions(project, best.id).catch((err) => console.error(`[clipping ${project.id}]`, err.message));
    }
  } catch (err) {
    console.error("[clipping]", err.message);
  } finally {
    ticking = false;
  }
}

/** Versions whose render was cut off by a restart (lib/pipeline.js marks them) go back in the queue on boot. */
async function resumeInterrupted() {
  for (const project of await listProjects()) {
    if (!project.clipping?.momentId) continue;
    for (const clip of project.clips || []) {
      if (clip.variantOf === project.clipping.momentId && clip.render?.status === "error" && /interrupted/i.test(clip.render.error || "")) {
        console.log(`[clipping ${project.id}/${clip.id}] resuming render interrupted by a restart`);
        renderVersion(project, clip.id);
      }
    }
  }
}

export function start() {
  if (timer) return;
  timer = setInterval(tick, 5000);
  setTimeout(tick, 1500);
  // After server.js's startup pass has flagged the cut-off renders.
  setTimeout(() => resumeInterrupted().catch((err) => console.error("[clipping]", err.message)), 8000);
}

export function stop() {
  clearInterval(timer);
  timer = null;
}

// ---------- API ----------

export const router = express.Router();
router.use(express.json());

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
};

async function projectOr404(id) {
  const project = await loadProject(id);
  if (!project) throw Object.assign(new Error("Video not found"), { status: 404 });
  return project;
}

router.get("/", handle(async () => {
  const jobs = [];
  for (const project of await listProjects()) if (project.clipping) jobs.push(await jobView(project));
  return {
    versions: VERSIONS.map(({ key, label, note, design }) => ({ key, label, note, aspect: design.aspect, style: STYLES[design.style]?.label })),
    tracks: (await instrumentalTracks()).length,
    jobs,
  };
}));

/** Hand a freshly imported project to Clipping; its best moment becomes five versions once it's picked. */
router.post("/jobs", handle(async (req) => {
  const project = await projectOr404(String(req.body?.projectId || ""));
  project.clipping = { auto: req.body?.auto !== false, addedAt: new Date().toISOString(), ...(project.clipping || {}) };
  await saveProject(project);
  if (project.status === "ready") tick();
  return jobView(project);
}));

router.get("/jobs/:id", handle(async (req) => jobView(await projectOr404(req.params.id))));

/** Stop showing a video on Clipping. The project and any renders stay in Projects. */
router.delete("/jobs/:id", handle(async (req) => {
  const project = await projectOr404(req.params.id);
  delete project.clipping;
  await saveProject(project);
  return { ok: true };
}));

/** Make (or remake) the five versions of a moment — the winner by default, or one picked on the page. */
router.post("/jobs/:id/versions", handle(async (req) => {
  const project = await projectOr404(req.params.id);
  if (project.status !== "ready") throw new Error("Wait for the video to finish processing.");
  const momentId = String(req.body?.momentId || momentsOf(project)[0]?.id || "");
  if (!momentId) throw new Error("No moments were found in this video.");
  project.clipping ??= { auto: true, addedAt: new Date().toISOString() };
  return jobView(await makeVersions(project, momentId));
}));

/** A different song under one version (none of its siblings' songs), then render it again. */
router.post("/jobs/:id/versions/:versionId/sound", handle(async (req) => {
  const project = await projectOr404(req.params.id);
  const clip = project.clips?.find((c) => c.id === req.params.versionId && c.variantOf);
  if (!clip) throw new Error("Version not found");
  const siblings = project.clips.filter((c) => c.variantOf === clip.variantOf).map((c) => c.design?.musicBed);
  const tracks = [...(await instrumentalTracks())].map((t) => t.id);
  const free = tracks.filter((id) => !siblings.includes(id));
  if (!free.length) throw new Error("Add more instrumental songs in Sounds to shuffle.");
  const pick = free[Math.floor(Math.random() * free.length)];
  if (isRendering(project, clip.id)) cancelRender(project, clip.id);
  clip.design = normalizeDesign({ ...clip.design, musicBed: pick });
  await saveProject(project);
  renderVersion(project, clip.id);
  return jobView(project);
}));

/** Render one version again (after a failure, or to pick up edits made in the clip editor). */
router.post("/jobs/:id/versions/:versionId/render", handle(async (req) => {
  const project = await projectOr404(req.params.id);
  const clip = project.clips?.find((c) => c.id === req.params.versionId && c.variantOf);
  if (!clip) throw new Error("Version not found");
  if (isRendering(project, clip.id)) throw new Error("This version is already rendering.");
  renderVersion(project, clip.id);
  return jobView(project);
}));

router.use("/ui", express.static(path.join(HERE, "public"), { setHeaders: (res) => res.set("Cache-Control", "no-cache") }));

export default { router, start, stop };
