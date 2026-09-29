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
- **Grade:** two grade templates, each an Assets LUT, set on the Ads page (Template 1 / Template 2 and which one new
  ads use; `data/ads/settings.json`). Template 1 is "S-Log3 → Rec.709 Warm + Blue" (warm skin, cool whites) and the default; Template 2 is "Dr. OD
  Film Grade + Ads Boost". An ad can instead use a built-in grade or any other LUT. On a finished ad, changing the
  grade applies on the spot (no re-edit): only `design.lut` changes, and the next save bakes it in. Renders bake the
  LUT in, and the preview plays a LUT-graded copy (`data/ads/previews/`, one per ad, LUT and .cube version).
- **Framing:** face-tracked horizontally (`clipFocus`, run during the edit). The shot jumps wide (1.2×) and tight
  (1.38×) at cuts and sentence breaks, anchored low (50% 88%), so the speaker sits high with little empty ceiling. It goes
  to 1.08× under graphics.
- **Checklists** (superseded 2026-09-28 by the Atlas kit's task card, below). Were: a Marker Felt kicker with a brush underline and sparks, Anton italic caps lines, glowing
  ticks, and the key word (`*stars*`, else "free", else a number) in the accent with a brush underline.
- **Colours:** the brand palette in Assets (black, white, gold-orange `#F4930F`) is the accent; the X is always red.
- **Captions** are small (0.45) and plain, with no italic serif emphasis. Where each caption sits is decided per caption in
  `injectAdLayers` (`placeCaptions`, the creator 2026-09-28): right on top of a card or CTA in the lower half when one is
  up, else the middle of the frame (50%, nudged to 44/56/38/62%), and only when those would cover the face (the face band
  at the most zoomed-in the shot gets while the caption is up), a graphic, a CTA or a logo, all the way at the top, then
  all the way at the bottom. Captions now stay up with cards and CTAs; only full-screen scenes hide them.
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

## The Atlas motion kit (2026-09-28)

The creator's favourite look, studied from their own Atlas motion ads (`references/atlas-motion-kit.md`, which the planner
reads with `STYLE.md` on every edit). Minimal and calm: dark warm glass with an accent hairline, mono kickers, two-tone
lines (cream, then the accent), soft blur-ins and blur-outs, a slow 3D settle, and no bounce.

- **28 kit templates** (`templates/`, listed first in `KIT` in `templates/index.js`): trail-prompt, task-card,
  approval-pill, task-board, schedule-clock, word-swap, strike-swap, notif-stack, card-carousel, stat-rows, logo-rings,
  chat-thread, org-chart, agent-grid, statement, end-card; plus, from the creator's Remotion source and the Jeremy AI demo,
  orbit-network, agent-log, approval-card, phone-report, chat-app, chain-stack, wordmark-type, status-flood, app-window,
  skill-cards, tool-map and voice-ring.
- **Brand values** come from the creator's Remotion theme: the palette, Plus Jakarta Sans, Inter and JetBrains Mono (`assets/fonts/`),
  the glass recipe, glow text, the ATLAS mark (the fallback logo) and the `atlas-*` sounds (`ads/sfx/`).
- **Scene grounds and transitions:** `tone` is dark (radial ink, grain, rising embers), accent (flat coral) or paper (cream,
  white cards). `transition` is fade, slide, wipe, circle or glitch, and rotates when it isn't set. Colours are CSS variables
  (`--tx`, `--tx2`, `--surface`, `--ink`…), so every template works on all three grounds.
- **Ending offer:** dropping videos in opens a chooser: **ATLAS · 7-day free trial** (the default) or **Book a call**. It is
  stored as `options.offer` (`trial` or `call`), can be changed per ad in the "Ending" dropdown, and drives the planner's
  brief and `<offer>` rule (`OFFERS` in plan.js) and the CTA fallback text, so every CTA, end card and closing line sells
  that one offer.
- **Creative directions:** every new ad gets one of `DIRECTIONS` (plan.js): Ink & Ember, Kinetic Type, Product Demo,
  Command Center, Team & Orbit or Quiet Luxury. It is never the same as the last two ads', and it is kept in `ad.style.direction`.
  The planner builds the ad around that family's scenes with creative freedom inside the kit.
- **Mix:** the ad music bed is `AD_MUSIC_LEVEL` 0.112, and sound effects are scaled by `AD_SFX_GAIN` 0.7 (build.js).
- **Banned in ads (the creator, 2026-09-28):** the glitch sounds and the underwater voice effect (`BANNED_SFX` and
  `BANNED_VOICEFX` in `build.js`). Both still exist for the rest of the app.
- **Shared kit** (`templates/_parts.js`): `KIT_CSS` (`.mk-card`, `.mk-kick`, `.mk-h` with `.ac`, status dots, the scene
  ground) is added to every composition with graphics. `KIT_JS` provides `blurIn`, `blurOut`, `settle3d`, `typeOn`, `blink` and `hide`.
  `hide` keeps an element invisible from the graphic's start until its own entrance (`CUR_T0`), so seeking is deterministic.
- **Full-screen scenes:** a template with `scene: "optional"` plays as a cutaway when the clip has `fullscreen: true`,
  and `scene: "always"` ones (statement, end-card) always do. The voice carries on over a warm near-black ground
  (`.ag-bd`, with glow, vignette and drifting dust), or over the full-bleed accent when `tone: "accent"`. Captions hide
  while a scene is up. The planner sets `fullscreen` and `tone` per graphic, 1–3 scenes per ad.
- **Everything else got the same treatment:** `soften()` strips `back`, `elastic` and `bounce` eases from every template
  and built-in timeline. `floatIn` is a blur-rise, and `drift` is smaller. The number, checklist (now the task card), CTA (a glowing pill with no
  icon or shine), check, proof, badge, headline, name bar, compare, logo and slide looks all use the kit's glass and type,
  and so do the typing-prompt, glass-card and comment-pill templates.
- **Sounds follow the motion:** air, tick, ping and chirp instead of pops and whooshes. A template's `sfx` can be a
  function of the clip (`templateSfx`), so ticks land on each item's beat.
- **Items:** up to 8 per graphic, 140 characters each. Positional items take `"-"` for an empty slot (`slots()`).

## Files

| File | What it is |
|---|---|
| `index.js` | `/api/ads` router, the edit job, save/download |
| `plan.js` | Claude planner (structured output) and the no-key fallback |
| `build.js` | Plan → editor document; writes `data/editor/<project>/ad.json` |
| `graphics.js` | Looks, icons, sound effects and grades, and `injectAdLayers()`: HTML/CSS/GSAP + `<audio>` into a composition |
| `layers.js` | `applyAdLayers()`: the hook the editor calls on preview and render (brand accent, ad grade, sfx paths) |
| `store.js` | `data/ads/db.json`, and `data/ads/settings.json` (the grade templates) |
| `dev.js` | Dev server on 5198: this router with the code on disk, everything else proxied to 5173 (`node ads/dev.js`) |
| `STYLE.md` | House style from the creator's example ad; read into every plan |
| `references/atlas-motion-kit.md` | The Atlas motion kit: the creator's favourite motion language, read into every plan |
| `templates/` | The template library (the kit first); `_parts.js` holds the shared kit CSS and motion helpers |
| `public/ads.js`, `public/ads.css` | The tab. `mountAds(el)` |

## Tracks it adds to editor documents

Two new track kinds, drawn by `ads/graphics.js`:

- `graphic` clips: `{ look, text, sub, highlight, items[], icon, position, fullscreen?, tone? }`, where look is one of headline, stat
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
| `GET /` | `{ ads, claude, aspects, grades, luts, templates, defaultTemplate, looks, sfx, offers }` |
| `PUT /settings` | `{ gradeTemplates: [lutId, lutId], defaultTemplate: 1 \| 2 }` → the grade templates |
| `POST /` | `{ projectId, name, aspect }` → a new ad for an uploaded video |
| `GET /:id` | One ad, with its project status, preview/editor URLs, render state and saved video |
| `POST /:id/edit` | `{ prompt, aspect, options: { grade, lut, template, music, sfx, captions }, autoSave? }` → queues a (re)build of the ad; `autoSave` renders it when done. `template` 1/2 picks a grade template; `grade: "auto"` with no LUT or template uses the default template |
| `POST /:id/grade` | `{ options: { grade, lut, template } }` → switches a finished ad's grade without re-editing |
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
