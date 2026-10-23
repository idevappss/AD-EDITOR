# Timeline editor

"Preview & edit" for a generated clip: a full-screen, timeline-based editor. It is owned by the **Video Editor** session (it took over from the Timeline session): `editor/` and `data/editor/`.

- **Opens at** `#/edit/<projectId>/<clipId>`. `public/app.js` routes there and imports `/api/editor/ui/editor.js`.
- **API** mounted by `server.js` at `/api/editor`.
- **Dev server:** `node editor/dev.js` → http://localhost:5193. It serves `public/` from disk, mounts this router, and proxies everything else to Ads Editor on 5173.

## Model

The editor state is separate from rendering. The editor edits a **document**. The server turns that document into composition inputs (`document.js` `compositionInputs`), and `lib/compose.js` builds the HTML from them, the same way it does for renders.

```
Document { version, projectId, clipId, rev, aspect, fps, design, tracks[] }
Track    { id, kind: text|caption|video|audio, role?: voice|music, name, hidden, locked, muted, clips[] }
Clip     { id, type, start, duration, link?, transform? }
  video/audio  + sourceStart, sourceEnd, speed, volume      (music also has sound, name, loop)
  text         + content, highlight, style { preset }
  caption      + words [{ text, s, e }]   (s and e are relative to the clip's start)
```

- **First open:** `seedDocument` builds the document from `planClip`. The kept pieces become linked video and voice clips. The re-timed words are grouped into caption clips with `groupCaptions`. The hook title becomes a text clip and the bed becomes a music clip. So a clip opens looking exactly like its current preview and render.
- **Saving:** documents autosave to `data/editor/<projectId>/<clipId>.json` (`PUT …/document`, with a revision check). `DELETE …/document` goes back to the AI edit.
- **Magnet (magnetic timeline):** on by default, remembered per browser, toggled with the toolbar button or `M`. While it is on, the picture chain plays back to back: deleting takes the time out, trimming an edge slides everything after it, and a dropped clip closes the hole it left. The same time comes out of (or goes into) every unlocked track, so captions and titles stay on their words. `model.js` does this with `gaps` / `weld` / `rippleTrim` / `insertRange`, all built on `removeRange`. Hold ⌥ while dragging to ignore snapping, and use "Ripple" or ⇧Del to force the other behavior.
- **Media:** waveform peaks (`…/peaks`, 50 per second) and filmstrip frames (`…/thumbs/<sec>`) are cut with ffmpeg and cached under `data/editor/`.

## Who shows the edited timeline

Once a clip has a saved document, that document *is* the clip:

- `/api/editor/…/preview` builds from it (and takes `?design=…&title=…&highlight=…` overrides on top, for the classic editor's live tweaks).
- Renders use it too: `lib/pipeline.js` `prepareClip` calls `documentPlan` when `readSavedDocument` finds one.
- `/api/projects/:id/clips/:clipId/preview` (the studio's own route, used by the classic editor) redirects to the editor preview when a document exists, so no screen shows the AI's cut for a clip the creator has edited.
- A finished MP4 on disk is still whatever was last rendered — autosave doesn't re-render it. **Save** in the header (⌘S) does: it flushes the document, then renders the clip from it (`actions.save` in `editor.js`). Each clip render records the document `rev` it was built from (`render.docRev`, set by the render route in `server.js`), and `GET …/render` reports it, so the button reads "Save" while the file is behind the timeline, "Updating video N%" while it renders, and "Saved" once it matches. The Ads tab tracks the same thing with `renderedRev` and marks the video stale.

## Staying smooth during a drag

A drag has to hold 60fps while the document changes on every frame, so the timeline splits its work:

- `perFrame` in `timeline.js` coalesces `pointermove` into one update per animation frame, and **flushes** the last one on release, so a drag always lands exactly where the pointer was let go.
- `draw({ live: true })` (used for transient, mid-gesture changes) only moves and resizes clips. Filmstrips, waveforms, labels, the ruler and the toolbar are left alone; a trimmed head slides its filmstrip with a transform instead, and video clips render 1.5× the frames they need so lengthening shows picture, not a hole. The full pass runs once when the gesture ends.
- `place()` skips style writes for clips that didn't move, and `will-change` is only set while dragging.
- The player is seeked at most every 70ms with a trailing update (`canvas.js`), instead of once per pointer move, and preview reloads wait 420ms after the last save and dim the frame rather than flashing.

## Front end (`public/`, plain ES modules, no build)

| File | Role |
|---|---|
| `editor.js` | Mounts the workspace. Holds the actions, keyboard shortcuts, resizable panels, context menu and export modal. |
| `store.js` | Document plus undo/redo history (drags count as one step), selection, playhead, debounced autosave. |
| `model.js` | Pure timeline operations: move, trim, split, delete, ripple delete, duplicate, place, snap. Linked clips move together. |
| `timeline.js` | Ruler, track headers, keyed clip nodes (filmstrip, waveform, blocks), playhead, drag, trim and scrub. |
| `canvas.js` | HyperFrames player on the saved document, transport, clip switcher, AI score. |
| `inspector.js` | Settings for the selection: the clip, a title, a caption, video or audio. |
| `assets.js` | Tool rail and panels: media library, sounds, add text. |
| `header.js` | Breadcrumbs, autosave status, undo/redo, share, export. |

## AI director (`director/`)

The creator uploads slides (PDF, PowerPoint, PNG/JPG) and phone screen recordings or B-roll. The director places them on the timeline where they talk about them, and turns a few key lines into big glowing captions behind the speaker. Everything it does becomes ordinary timeline clips that can be moved, trimmed, re-laid-out or deleted, and one undo removes the whole pass.

| File | Role |
|---|---|
| `director/assets.js` | Uploads under `data/editor/<project>/assets/<id>/`. PDFs become trimmed slide PNGs plus text (`tools/pdfslides.swift`, PDFKit). PowerPoint slides are rebuilt from their text and pictures. Videos become seekable H.264 with sample frames. |
| `director/plan.js` | Claude (`claude-opus-5`) reads the timeline's caption words, looks at the slides and recording frames, and follows `shared/EDITOR_STYLE.md` when present. It returns cues, which are validated (no overlaps, breathing room, scarce emphasis) and then applied as the `overlay` and `emphasis` tracks. Without a key it falls back to keyword matching. |
| `director/matte.js` | Person cutouts for big captions: only the seconds under each caption go through `hyperframes remove-background` into a transparent WebM under `data/editor/<project>/mattes/`. |
| `director/layers.js` | Adds the layers to the composition's own GSAP timeline. The speaker's picture is scaled and clipped into a box while slides, phones and B-roll animate in and out. Big captions sit in a layer over the video with the cutout on top, and the cutout copies the footage's zoom tweens. |
| `director/render.js` | `applyEditorLayers(project, doc, dir)`: copies slides, recordings and cutouts into a render folder and injects the layers. `lib/pipeline.js` calls it for editor-edited clips. |

Tracks: `overlay` clips have `{ source: slide|screen|broll, asset, page?, sourceStart?, layout: split|full|card|pip, side, focus? }`, and `emphasis` clips have `{ text }`. The clip id `full` opens the whole recording for long-form edits.

The renderer draws `<video>` frames above DOM placed among them, so text never goes inside the video wrappers. `hyperframes snapshot` ignores WebM alpha, so check cutouts with a real `render`.

## Not honored by the composer yet (later phases)

These live in the document but don't reach the preview or render yet:

- Only the first title plays, and it always opens at 0.1s.
- Captions are regrouped by `maxWords` rather than by caption clip.
- The voice track can be muted but has no volume level.
