// Dev server for the IRE tab, the Intentional Reels Editor (port 5189). Serves Ads Editor's page from disk, mounts this router
// with the code on disk, and proxies everything else to the running Ads Editor server on 5173, which it
// never restarts. It serves the page and the takes API from disk, so use it to work on the page.
//   node ire/dev.js   → http://localhost:5189/#/ire
import path from "node:path";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import express from "express";
import { ROOT } from "../lib/tools.js";
import { router } from "./index.js";

dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });
const PORT = Number(process.env.IRE_PORT) || 5189;
const UPSTREAM = process.env.CLIP_STUDIO_URL || "http://localhost:5173";

const app = express();
app.use("/api/ire", router);
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
    res.status(502).type("text").send(`Ads Editor isn't reachable at ${UPSTREAM}: ${err.message}`);
  }
});

app.listen(PORT, () => console.log(`\n  IRE (dev) → http://localhost:${PORT}/#/ire  (proxying ${UPSTREAM})\n`));
