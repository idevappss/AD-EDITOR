// Dev server for the Ads Editor tab (port 5198). Serves HBA Content Backend's page from disk, mounts this router
// with the code on disk, and proxies everything else to the running HBA Content Backend server on 5173, which it
// never restarts. It doesn't resume queued edits (only the real server's start() does).
//   node ads/dev.js   → http://localhost:5198/#/ads
import path from "node:path";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import express from "express";
import { ROOT } from "../lib/tools.js";
import { router } from "./index.js";

dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });
const PORT = Number(process.env.ADS_PORT) || 5198;
const UPSTREAM = process.env.CLIP_STUDIO_URL || "http://localhost:5173";

const app = express();
app.use("/api/ads", router);
app.use(express.static(path.join(ROOT, "public"), { setHeaders: (res) => res.set("Cache-Control", "no-store") }));

app.use(async (req, res) => {
  try {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const upstream = await fetch(UPSTREAM + req.originalUrl, {
      method: req.method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
    });
    res.status(upstream.status);
    const decoded = upstream.headers.has("content-encoding");
    upstream.headers.forEach((value, key) => {
      if (["transfer-encoding", "connection"].includes(key) || (decoded && ["content-encoding", "content-length"].includes(key))) return;
      res.setHeader(key, value);
    });
    if (upstream.body) Readable.fromWeb(upstream.body).pipe(res);
    else res.end();
  } catch (err) {
    res.status(502).type("text").send(`HBA Content Backend isn't reachable at ${UPSTREAM}: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`\n  Ads Editor (dev) → http://localhost:${PORT}/#/ads  (proxying ${UPSTREAM})\n`));
