# Ads Editor

The **Ads Editor** tab (`#/ads`) turns raw ad footage into a finished ad: upload the video, describe what you want,
and it cuts the retakes, flubs and dead air, grades it, crops it to the format, and adds captions, motion
graphics, big glowing words behind the speaker, sound effects and a music bed. You preview it in the app, then
**Save video** (renders an MP4 to download) or **Open in timeline** to change anything by hand.
Owned by the **Ads Editor** session: `ads/` and `data/ads/`.

## How it works

1. **Upload** goes through the normal `POST /api/projects` with `autoPick=false`, so the video is only transcribed
   (with the working copy, word alignment and so on). It shows up in Projects like any other video.
2. **Edit my ad** (`POST /api/ads/:id/edit`) waits for the transcript, then `plan.js` sends Claude every word
   numbered, three frames and the creator's request (plus `ads/STYLE.md`, the house style learned from the
   example ad). Claude returns the word ranges to keep, the graphics, the big words, extra sound effects, a grade
   and whether to use music, all anchored to word numbers. Without a key, a heuristic keeps everything and adds a few graphics.
3. `build.js` turns the plan into an **editor document** for the project's `ad` clip: the kept ranges go
   through `lib/tighten.js` (so "um"s and long pauses go too) and become linked video and voice clips. Captions
   are regrouped on the cut timeline, and graphics, big words, sound effects and music each get their own track.
   Graphics never overlap; sound effects are added automatically per graphic (whoosh on headlines, bass hit on
   numbers, pops on list items, a riser into the CTA). The document is saved as edited, so renders follow it.
4. **Preview** is the editor's own preview (`/api/editor/projects/<p>/clips/ad/preview`); **Open in timeline** is
   `#/edit/<p>/ad`; **Save video** queues the normal render (`queueRender`), which honours edited documents.

## Batch uploads

Drop several videos at once. Each uploads in turn and becomes an ad; with **Edit them automatically** on, each goes into
the edit queue with the batch brief (remembered in the browser), and with **Save the videos when done** on, each is
rendered as soon as its edit finishes. Edits run one at a time (`enqueueEdit` / `pumpEdits` in `index.js`); waiting ads
show "Queued: N ahead". A restart re-queues unfinished edits instead of failing them.

## House rules (from the creator's feedback, 2026-09-23)

- **Minimal.** The planner only places logos, counting numbers and checklists. It never adds titles, headlines,
  badges or glowing words (the other looks still exist for hand use in the timeline).
- **Logos** are transparent and uploaded per ad (Brand logos on the ad page). Competitors named together share one
  moment: they glide in, then a fat red X slams onto each. The product gets a hero entrance (a fly-up with motion blur,
  a glow and a float) with a riser before it.
- **Grade:** "Auto" uses the creator's own LUT from Assets (built for their log camera). Renders bake it in, and the
  preview plays a LUT-graded copy (`data/ads/previews/`).
- **Framing:** face-tracked horizontally (`clipFocus`, run during the edit). The shot jumps wide (1.2×) and tight
  (1.38×) at cuts and sentence breaks, anchored low (50% 88%), so the speaker sits high with little empty ceiling. It goes
  to 1.08× under graphics.
- **Checklists** have no card: a Marker Felt kicker with a brush underline and sparks, Anton italic caps lines, glowing
  ticks, and the key word (`*stars*`, else "free", else a number) in the accent with a brush underline.
- **Colours:** the brand palette in Assets (black, white, gold-orange `#F4930F`) is the accent; the X is always red.
- **Captions** are off by default. When on, they're small (0.45), low (80%) and plain, with no italic serif emphasis.
- **Music bed** is on by default, with risers into every reveal. The mix lands around −14 LUFS.
- **Transcript** download after an edit: `.txt` or `.srt`, built from the timeline as it stands.
- Renders switch to HyperFrames `--low-memory-mode` when the disk has under 15 GB free (`lib/render.js`), because the full
  4K-source frame capture needs about 7 GB.

## Variety, templates, slides and storage (2026-09-24)

- **Defaults are always on:** sound effects, music bed and captions, plus a standing brief (`STANDING_BRIEF` in `plan.js`).
- **Rotation:** each edit picks a sound palette (`classic`/`crisp`/`airy` in `build.js` `PALETTES`), a stat look (glow/pill)
  and a CTA look (button/sonar), never repeating the last ad's; the planner is told which templates recent ads used.
- **Template library:** `templates/`, 18 looks: bar-chart, line-chart, notification, typing-prompt, glass-card, network,
  sonar-cta, light-leak, glass-notif (liquid glass), app-card, service-stack, glow-pulse, profile-follow, percent-circle,
  trend-line, loading-bar, countdown-ring, comment-pill. Shared bits in `templates/_parts.js`. The planner picks them as `kind: "template"`. Ideas behind them: `references/`.
- **Slides:** a shared library on the Ads Editor page (`data/ads/slides/`, `/api/ads/slides`). The planner sees each
  slide and can drop one in as `kind: "slide"` (a glass-framed card) when the words match it.
- **Face in frame:** every video piece records the face band (`face`), and zooms are capped so the whole face stays in.
- **Logos library:** `data/ads/logos/_library/`, so any ad can use a logo uploaded once.
- **Cut hits** (Camera track, FastFX / CapCut-style): `whip` (on a cut), `zoom-blur`, `flash`, `shake`, `bw` (black-and-white
  beat), `rgb` (colour split). Each is 0.3–1.5 s with its own sound (`HIT_SFX` in `build.js`), drawn on `#video-punch` in
  `graphics.js` (`adFraming`), and reset when it ends, so seeking is safe. The planner uses 2–4 per ad and rotates them.
- **Voice FX** (`voicefx` track, `voicefx.js`): `underwater`, `muffle` or `phone` on one line. Each is a filtered copy of
  the project's whole audio (`data/ads/voicefx/<project>-<effect>.m4a`, made during the edit), and the voice pieces swap
  to it over the clip with the same source offsets. Underwater also gets a boom and a punch-in. Chains come from
  `references/retention-transitions.md`.
- **Delete:** the trash button on each ad removes the ad, its video, renders and backups, and shows the space freed.

## Files

| File | What it is |
|---|---|
| `index.js` | `/api/ads` router, the edit job, save/download |
| `plan.js` | Claude planner (structured output) and the no-key fallback |
| `build.js` | Plan → editor document; writes `data/editor/<project>/ad.json` |
| `graphics.js` | Looks, icons, sound effects and grades, and `injectAdLayers()`: HTML/CSS/GSAP + `<audio>` into a composition |
| `layers.js` | `applyAdLayers()`: the hook the editor calls on preview and render (brand accent, ad grade, sfx paths) |
| `store.js` | `data/ads/db.json` |
| `STYLE.md` | House style from the creator's example ad; read into every plan |
| `public/ads.js`, `public/ads.css` | The tab. `mountAds(el)` |

## Tracks it adds to editor documents

Two new track kinds, drawn by `ads/graphics.js`:

- `graphic` clips: `{ look, text, sub, highlight, items[], icon, position }`, where look is one of headline, stat
  (counts up), list, lower-third, callout, cta, compare or icon, and position is top, center or bottom.
- `sfx` clips: `{ sfx, volume, offset? }`, with sounds from `edits/sfx/`.

The ad's colour grade (`clean`, `punchy`, `warm`, `cinematic`, `none`) lives on the ad record and replaces the
composition's HyperFrames `data-color-grading`. Choosing one of the creator's LUTs sets `design.lut` instead, and renders bake it in.

## Wiring in other sessions' files (applied 2026-09-23)

- `server.js` (ENGINE): `import ads from "./ads/index.js"`, `app.use("/api/ads", ads.router)`, `ads.start()`.
- `public/index.html`: the **Ads Editor** nav link after Thumbnails. `public/app.js`: the `/ads` route.
  `public/shell.js`: `["Ads Editor", "#/ads", …]` in `PAGES`.
- `editor/` (Video Editor session):
  - `document.js`: `graphic` and `sfx` in `KINDS`, plus their normalizers.
  - `index.js`: the preview calls `applyAdLayers` after `injectLayers`.
  - `director/render.js`: renders call `applyAdLayers` (it no longer returns early when there are no overlays).
  - `public/timeline.js`, `public/inspector.js` and `editor.css`: labels, heights, icons and inspector panels for the two kinds.
  All of these are no-ops for documents without those tracks.

## HTTP API: `/api/ads`

| Method & path | What |
|---|---|
| `GET /` | `{ ads, claude, aspects, grades, luts, looks, sfx }` |
| `POST /` | `{ projectId, name, aspect }` → a new ad for an uploaded video |
| `GET /:id` | One ad, with its project status, preview/editor URLs, render state and saved video |
| `POST /:id/edit` | `{ prompt, aspect, options: { grade, lut, music, sfx, captions }, autoSave? }` → queues a (re)build of the ad; `autoSave` renders it when done |
| `POST /:id/stop` | Stop an edit in progress |
| `PATCH /:id` | `{ name }` |
| `POST /:id/save`, `POST /:id/cancel` | Render the ad to MP4, or stop that render |
| `GET /:id/download` | The saved MP4 |
| `GET /:id/transcript` | The ad's transcript as `.txt`, or `?format=srt` |
| `POST /:id/logos`, `PATCH`/`DELETE /:id/logos/:logoId` | Brand logos for the ad (multipart `logos`), and renaming or removing them |
| `GET /:id/graded.mp4` | The LUT-graded preview copy |
| `DELETE /:id` | Delete the ad and its video (`?keepVideo=1` keeps the video) → `{ freed }` |
| `GET/POST /slides`, `PATCH/DELETE /slides/:slideId` | The shared slides library (multipart `slides`) |
| `GET /sfx/:name.mp3` | A sound effect, for previews |
| `GET /voicefx/:file` | A voice-effect copy, for previews |
