// Dev server for the Memory tab (port 5197). Serves HBA Content Backend's page from disk with the Memory nav link and route
// patched in (the same hooks ENGINE adds for real, see memory/README.md), mounts this router, and proxies
// everything else to the running HBA Content Backend server on 5173, which it never restarts.
//   node memory/dev.js   → http://localhost:5197/#/memory
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import express from "express";
import { ROOT } from "../lib/tools.js";
import { router } from "./index.js";

dotenv.config({ path: path.join(ROOT, ".env"), quiet: true });
const PORT = Number(process.env.MEMORY_PORT) || 5197;
const UPSTREAM = process.env.CLIP_STUDIO_URL || "http://localhost:5173";

export const NAV_LINK = `<a href="#/memory" data-nav="memory"><svg viewBox="0 0 24 24"><path d="M9 4.5a3 3 0 0 0-3 3v.2A3 3 0 0 0 4.5 13a3 3 0 0 0 1.8 4.5A3 3 0 0 0 12 18.5V6a1.5 1.5 0 0 0-3-1.5z" /><path d="M15 4.5a3 3 0 0 1 3 3v.2a3 3 0 0 1 1.5 5.3 3 3 0 0 1-1.8 4.5A3 3 0 0 1 12 18.5" /></svg>Memory</a>`;
export const ROUTE = `if (pathPart.startsWith("/memory")) {
    $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === "memory"));
    const { mountMemory } = await import("/api/memory/ui/memory.js");
    await mountMemory(app);
    window.scrollTo(0, 0);
    return;
  }
  `;

const app = express();
app.use("/api/memory", router);
const noCache = (res) => res.set("Cache-Control", "no-store");

app.get(["/", "/index.html"], async (_req, res) => {
  let html = await fs.readFile(path.join(ROOT, "public", "index.html"), "utf8");
  if (!html.includes('href="#/memory"')) html = html.replace(/(<a href="#\/assets"[^\n]*Assets<\/a>)/, (m) => `${m}\n        ${NAV_LINK}`);
  noCache(res).type("html").send(html);
});
app.get("/app.js", async (_req, res) => {
  let js = await fs.readFile(path.join(ROOT, "public", "app.js"), "utf8");
  if (!js.includes("/api/memory/ui/memory.js")) js = js.replace(/(\n  const projectMatch = pathPart\.match)/, (m) => `\n  ${ROUTE.trimEnd()}${m}`);
  noCache(res).type("js").send(js);
});
app.use(express.static(path.join(ROOT, "public"), { setHeaders: noCache }));

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

app.listen(PORT, () => console.log(`\n  Memory (dev) → http://localhost:${PORT}/#/memory  (proxying ${UPSTREAM})\n`));
