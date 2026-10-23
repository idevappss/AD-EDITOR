# Thumbnails

The **Thumbnails** tab (`#/thumbnails`) gives every video three YouTube-ready **1280×720** thumbnail variations,
made on their own while the video is still transcribing, and built and checked by the creator's **YouTube
Thumbnails SOP**. [SOP.md](SOP.md) maps each part of the SOP to the code. Owned by the **THUMBNAILS** session:
`thumbnails/` and `data/thumbnails/`. It only ever *reads* `projects/`.

How a set gets made:

1. **Stills.** Sixteen frames spread across the video (from `work.mp4` when the pipeline has made one), 1920 wide.
   Each is scored on face size and confidence (Apple Vision, the same tracker the crop uses), whether other
   faces compete with the main one, sharpness, contrast and exposure. From your photos: up to 12 of the
   creator's own photos, scored the same way.
2. **The concept.** Claude looks at the best ten and builds three variations by the SOP. For each one it picks
   the type (Moment, Story, Result, Transformation, Novelty), writes the curiosity gap, and picks the still, the
   one or two scroll stoppers, 2–4 words (never more than 6), the accent word, an optional corner hit ("$1M",
   "Day 90") and the tone. It's given the video's best YouTube title so the thumbnail opens a loop the title
   doesn't close, plus the last ten thumbnails so it stays on-brand, and it writes in the creator's title taste.
   With a text preset ("Day In A Life") every variation carries those exact words.
3. **The picture.** Headless Chrome paints each one: the still pushed in so the face sits on the third away from
   the words, a tone grade (serious = cool, bold = punchy, bright = warm), a spotlight on the subject, Anton in at
   most three lines with the accent word boxed, and the corner hit in a top corner. The accent colour is the
   creator's own, from the Assets brand kit (`GET /api/resources/brand`) when there is one, otherwise the
   `--burn-accent` token in `public/theme.css`.
4. **The four tests.** `check.js` lays the three out at phone-feed and sidebar size in YouTube dark and light
   mode, and Claude runs the 12-box Banger checklist on that sheet. Fixable failures (words, layout, corner hit)
   are fixed, repainted and checked again once. The variation most likely to win the click leads. The others are
   kept as variations B and C.

Photos go in three ways: the **Upload photos** button at the top, dropping them anywhere on the page (both
open **From your photos** with them ready), or **Add your photo** in a thumbnail's editor (or dropping photos
on the editor), which puts your photo straight onto that thumbnail.

**Your style** trains it on thumbnails the creator loves (the SOP's swipe file). Upload pictures or paste YouTube
links, with a note on what they like. `style.js` has Claude break each one down by the SOP (type, gap,
stoppers, words, text style, face, composition, colours, extras) and distils them all into a style profile:
a summary, do's, don'ts, favourite types, word count, headline colour and caps. The profile, the creator's notes
and four of the references go into every build; the profile also sets the headline colour and case, and the
checklist's on-brand box checks against it. Editing a note or removing a reference relearns the profile.

The tab has four views. **Videos** is one card per project with its lead thumbnail, its type, its checklist
score and its switches. **From your photos** takes photos (drag in or choose, HEIC included), an optional
video to attach them to, the title, what the video is about, and the words (Claude's, a preset, or your own).
**All thumbnails** is every thumbnail there has ever been: the leads, their variations, and the ones they
replaced (the last 80 are kept).

Everything is editable afterwards. Click a thumbnail to switch which variation leads, see the checklist box by
box, change the words (or pick a text preset), the accent word, the corner hit, the layout, the tone, the accent
colour, or pick a different still. Each change repaints in a couple of seconds, and **Run it again** re-checks.
**New variations** starts over; with a text preset picked, all three use it. **Save words as preset** adds the
headline to the preset list. ♥ / ✕ on the words feeds the title taste library.

## Turning it off

| Where | What it does |
|---|---|
| **Make them automatically** (tab header) | Off means nothing is made on its own, for any video. Existing thumbnails stay, and **Make them** still works per video. |
| **Auto** switch on a video's card | Off means *this* video never gets one — the rest still do. |

Both are stored in `data/thumbnails/db.json` (`settings.auto` and `projects.<id>.auto`), so they survive restarts.
A video that already has a thumbnail is never redone on its own.

| File | What it is |
|---|---|
| `index.js` | The library (sets of variations), the watcher that makes them automatically, photo uploads, and the `/api/thumbnails` router |
| `sop.js` / `SOP.md` | The creator's thumbnail SOP: the five types, scroll stoppers, tones, the checklist, text presets, and the prompt block |
| `frames.js` | Candidate stills from the video or the creator's photos: extraction and scoring (faces, rival faces, sharpness, contrast, exposure) |
| `headline.js` | Claude builds three variations by the SOP; falls back to the best-scoring stills without a key |
| `style.js` | Your style: the swipe file (`data/thumbnails/style.json`, pictures in `data/thumbnails/style/`), the per-thumbnail breakdowns, the style profile, and the `/api/thumbnails/style` router |
| `check.js` | The four tests and the Banger checklist on the painted set, with one round of fixes |
| `compose.js` | The 1280×720 page: rule-of-thirds push-in, tone grades, spotlight, layouts, corner hit, brand accent and logo |
| `shot.js` | Headless Chrome screenshot (one warm browser, closed after a minute idle) |
| `public/thumbnails.js` | The tab. `mountThumbnails(el)` renders into `#app` and returns a cleanup function |
| `public/thumbnails.css` | Styles. Theme tokens only |
| `dev.js` | Dev server on port 5196. Patches the nav link and route in, and proxies the rest to :5173 |
| `data/thumbnails/db.json` | Settings (with saved text presets), per-video switches, the lead thumbnails, and the variations and replaced ones. Re-read whenever another process writes it, so the app and `dev.js` can both be up |
| `data/thumbnails/files/<id>/` | One variation's finished `thumb.jpg` (older items keep their stills here too) |
| `data/thumbnails/files/<stills>/` | A set's candidate stills or uploaded photos, shared by its variations, plus the test sheet `checks.png` |

## Wiring (already applied, 2026-09-22)

These four edits are in the repo. They're written out here so ENGINE knows what's there and doesn't lose them.

**`server.js`**: mount the API and start the watcher.

```js
import thumbnails from "./thumbnails/index.js";
app.use("/api/thumbnails", thumbnails.router);
thumbnails.start();  // makes them automatically; thumbnails.stop() on shutdown
```

**`public/index.html`**: add the nav link after Titles.

```html
<a href="#/thumbnails" data-nav="thumbnails"><svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 4.5-4.5L12 16l3-3 5 5" /></svg>Thumbnails</a>
```

**`public/app.js`**, in `route()` just before `const projectMatch = …`:

```js
if (pathPart.startsWith("/thumbnails")) {
  $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === "thumbnails"));
  const { mountThumbnails } = await import("/api/thumbnails/ui/thumbnails.js");
  await mountThumbnails(app);
  window.scrollTo(0, 0);
  return;
}
```

**`public/shell.js`** (Design session): `["Thumbnails", "#/thumbnails", "Video thumbnails"]` in `PAGES`, so ⌘K finds it.

Nothing else is needed: the watcher finds new videos by itself, so the import pipeline stays untouched.

## HTTP API: `/api/thumbnails`

| Method & path | Returns |
|---|---|
| `GET /` | `{ settings, layouts, presets, sop, claude, working, videos, photos, history }`. One entry per project, newest first, each with its lead thumbnail or `null`; the photo sets not tied to a video; every variation and replaced thumbnail. Each item carries `type`, `gap`, `stoppers`, `tone`, `checks`, `passed` and its set's `variants`. |
| `PATCH /settings` | `{ auto, sub, logo, layout, accent, presets }` — `auto: false` stops every automatic thumbnail; `presets` is the creator's own text presets. |
| `POST /videos/:id/auto` | `{ auto }` for one video. |
| `POST /videos/:id/generate` | `{ preset? }` Makes three variations now, whatever the switches say. Replaces that video's thumbnail. |
| `POST /photos` | multipart `photos` (up to 12), `videoId?`, `title?`, `about?`, `preset?`. Three variations from the creator's photos. |
| `PATCH /items/:id` | `{ headline, word, sub, badge, layout, tone, accent, logo, frame }` then repaints. |
| `POST /items/:id/photos` | multipart `photos`. Adds the creator's own photos to that thumbnail's stills and repaints it with the best one. |
| `POST /items/:id/check` | Runs the four tests and the checklist again on the item's set. Reports only. |
| `POST /items/:id/again` | `{ preset? }` Three fresh variations for the same video or photos. |
| `POST /items/:id/restore` | Makes a variation (or a replaced thumbnail) the one the video leads with. |
| `POST /items/:id/rate` | `{ liked }` — ♥ / ✕, which also teaches `titles/`. |
| `DELETE /items/:id` | Forgets the thumbnail (and its stills once no variation uses them). Deleting a lead hands the lead to the next variation. |
| `GET /items/:id/file` | The 1280×720 JPEG. `?download` saves it under the video's name. |
| `GET /items/:id/frames/:file` | One candidate still. |
| `GET /for?projectId=` | `{ thumbnail }` — for other sessions. |

## For other sessions

Read `GET /api/thumbnails/for?projectId=<id>` for the thumbnail a video leads with instead of pulling your own poster frame.
The record carries `url`, `headline`, `word`, `sub`, `frame.at` (the second it was taken from, useful as a Reel
cover) and the candidate stills. It's read-only from outside; thumbnails are made here.

Requirements: Google Chrome (set `THUMBNAIL_CHROME`/`CHROME_PATH` if it lives somewhere unusual) and, for the
words, `ANTHROPIC_API_KEY`. Without a key the best-scoring still still gets a line pulled from the transcript,
and the tab says so.
