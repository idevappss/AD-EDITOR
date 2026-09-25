// Renders: the director layers go into the composition folder lib/pipeline.js just built for an edited clip, with
// every slide, recording and cutout they use copied in next to it (renders can't reach the editor's API).
import fs from "node:fs/promises";
import path from "node:path";
import { layerResolver } from "../index.js";
import { emphasisClips, injectLayers, overlayClips } from "./layers.js";
import { applyAdLayers } from "../../ads/layers.js";

/** Add the saved document's overlays, big captions and Ads Editor layers to <compositionDir>/index.html. No-op without any. */
export async function applyEditorLayers(project, doc, compositionDir) {
  if (!doc) return;
  const copies = [];
  const stage = (from, rel) => {
    copies.push([from, path.join(compositionDir, "assets", rel)]);
    return `assets/${rel.split("/").map(encodeURIComponent).join("/")}`;
  };
  const file = path.join(compositionDir, "index.html");
  const before = await fs.readFile(file, "utf8");
  let html = before;
  if (overlayClips(doc).length || emphasisClips(doc).length) html = injectLayers(html, doc, await layerResolver(project, doc, { preview: false, stage }));
  // Ads Editor: motion graphics, sound effects and the ad's grade (ads/layers.js). No-op for other clips.
  html = await applyAdLayers(html, doc, { projectId: project.id, preview: false, stage });
  if (html === before) return;
  for (const [from, to] of copies) {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to).catch((err) => console.error("Editor layers: couldn't copy", from, err.message));
  }
  await fs.writeFile(file, html);
}
