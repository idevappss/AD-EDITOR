# Memory

The **Memory** tab (`#/memory`) is HBA's company brain: who HBA is, everything Odell and Abby have said on camera, the shared playbooks and the brand kit, in one place for every channel to pull from. Owned by the **MEMORY** session: `memory/`, `data/memory/`, `shared/COMPANY.md` and `shared/CONTENT_IDEAS.md`.

| What | Where |
|---|---|
| Company profile (the brief every session reads) | `shared/COMPANY.md`, editable on the Company tab. Old versions are kept in `data/memory/history/` |
| Title, hook and caption bank from the transcripts | `shared/CONTENT_IDEAS.md` |
| Transcripts (YouTube, vlogs, Zoom, mastermind, podcasts, sales calls) | `data/memory/transcripts.json` (index) + `data/memory/transcripts/<id>.txt` |
| App project transcripts | read live from `projects/*/transcript.json`, never copied |
| Logos, fonts, colors, LUTs | stay in **Assets** (`/api/resources/brand`); Memory passes them along |

Drop `.txt/.srt/.vtt/.json` files on the Transcripts tab, or paste one. Premiere/Resolve exports (`00;00;01;59 - …` or `[01:00:00;00 - …]` plus speaker lines) are cleaned into paragraphs, and duplicates are skipped by content hash. Bulk import from the command line:

```bash
node memory/import.js ~/Downloads/om-*.txt --kind=vlog
```

## For other sessions

Read this before writing any title, caption, hook, ad, thumbnail or edit plan:

| Method & path | Returns |
|---|---|
| `GET /api/memory/context?q=<topic>` | `{ company, contentIdeas, voice, excerpts[], brand, transcripts }`. `excerpts` are the transcript passages that best match `q` |
| `GET /api/memory/context?q=<topic>&format=text` | The same as one Markdown block, ready to paste into a Claude prompt |
| `…/context?preset=picking` · `titles` · `design` | A trimmed version for sessions that already carry `ODELL_VOICE.md` / `titles/STYLE.md`. **picking** = COMPANY §1–6 + §10 + excerpts. **titles** = §1, 5, 6 + CONTENT_IDEAS + excerpts. **design** = §3 (incl. visual identity) + brand kit. Or hand-pick: `&sections=1,5,6&parts=company,ideas,excerpts,brand` |
| `GET /api/memory/company` | `shared/COMPANY.md` as Markdown (`?format=json` for `{ body, updatedAt }`) |
| `GET /api/memory/search?q=&limit=` | `{ hits[{ type, id, title, kind, date, score, snippets[] }] }` across transcripts, projects and `shared/*.md` |
| `GET /api/memory/transcripts` · `/transcripts/:id` (`?format=text`) | Stored transcripts |
| `POST /api/memory/transcripts` | Multipart `files[]` (+ optional `kind`, `tags`) or JSON `{ title, text, kind, date, tags, notes }` |
| `PATCH` / `DELETE /api/memory/transcripts/:id` | Edit metadata/text, or remove |
| `GET /api/memory/docs/:file` | Any `shared/*.md` |
| `PUT /api/memory/company` | `{ body }`, which replaces the company profile |

Server-side code can skip HTTP:

```js
import { companyContext, contextAsText } from "../memory/index.js";
const brief = contextAsText(await companyContext({ q: clip.topic, origin: "http://localhost:5173" }));
```

## Hooks for ENGINE (one-time)

**`server.js`**: mount the API next to the Assets one.

```js
import { router as memoryRouter } from "./memory/index.js";
app.use("/api/memory", memoryRouter);
```

**`public/index.html`**: add the nav link after Assets.

```html
<a href="#/memory" data-nav="memory"><svg viewBox="0 0 24 24"><path d="M9 4.5a3 3 0 0 0-3 3v.2A3 3 0 0 0 4.5 13a3 3 0 0 0 1.8 4.5A3 3 0 0 0 12 18.5V6a1.5 1.5 0 0 0-3-1.5z" /><path d="M15 4.5a3 3 0 0 1 3 3v.2a3 3 0 0 1 1.5 5.3 3 3 0 0 1-1.8 4.5A3 3 0 0 1 12 18.5" /></svg>Memory</a>
```

**`public/app.js`**, in `route()` just before `const projectMatch = …`:

```js
if (pathPart.startsWith("/memory")) {
  $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === "memory"));
  const { mountMemory } = await import("/api/memory/ui/memory.js");
  await mountMemory(app);
  window.scrollTo(0, 0);
  return;
}
```

**`public/shell.js`** (Design session): add `["Memory", "#/memory", "Company brain, transcripts, playbooks"]` to `PAGES`.

Dev server until then: `node memory/dev.js` → http://localhost:5197/#/memory (it patches the hooks in and proxies the rest to :5173).
