// A read-only window onto finished clips, for Instagram only. Instagram won't take the video bytes from this app,
// so it fetches them from a link instead — and the link has to be reachable from the internet. Rather than exposing
// the whole app through the tunnel, this serves one thing: rendered .mp4 files under projects/<id>/renders/.
import path from "node:path";
import fs from "node:fs";
import express from "express";
import { PROJECTS_DIR } from "../lib/tools.js";

const PORT = Number(process.env.MEDIA_PORT || 5180);
const app = express();
const ID = /^[a-z0-9]+-[a-f0-9]{6}$/;

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/files/:projectId/renders/:file", (req, res) => {
  const { projectId, file } = req.params;
  // Only a real project's rendered mp4s, and nothing that tries to climb out of that folder.
  if (!ID.test(projectId) || !/^[\w.-]+\.mp4$/.test(file)) return res.status(404).end();
  const full = path.join(PROJECTS_DIR, projectId, "renders", file);
  if (!full.startsWith(path.join(PROJECTS_DIR, projectId)) || !fs.existsSync(full)) return res.status(404).end();
  res.sendFile(full);
});

app.use((_req, res) => res.status(404).end());

app.listen(PORT, () => console.log(`  Clip media (Instagram fetches from here) → http://localhost:${PORT}`));
