# Motion graphics library

The one home for every motion graphic, scene transition, camera move and sound effect. Every editor pulls from here
when it edits a video. Until 2026-10-01 these lived inside the Ads Editor (`ads/templates`, `ads/graphics.js`, `ads/sfx`),
with copies of the sound rules in the clip editor and Dope clips.

| Path | What it holds |
|---|---|
| `index.js` | **The front door.** Import from here, never from the files behind it. |
| `templates/` | The template kit: 61 graphics, one file each (36 Atlas kit + 7 from the reel studies and the master edit + 18 earlier looks). `_parts.js` is the shared kit CSS and motion code (`blurIn`, `settle3d`, `typeOn`, count-up, cursor, the ATLAS palette). |
| `render.js` | The renderer (`injectAdLayers`): draws graphic, sfx and camera clips onto any HyperFrames composition, for previews and renders. Also the classic looks, icons, scene transitions, camera moves, grades. |
| `sounds.js` | Every sound effect (`SFX`) and the house rules: peak alignment, ambience under the music, no glitch on graphics, the 0.7 mix. `soundClips()` places a graphic's sounds. |
| `sfx/` | All 35 sound files (Pixabay ones credited in `CREDITS.md`), plus the `lib-*` picks from the creator's pack (gitignored). |
| `library.js` | The creator's licensed pack (`~/Desktop/SFX & Transitions`) and the 13 sounds picked from it to match `references/sound-study.md`, converted into `sfx/` on first load. |
| `references/` | The motion language (below). |

## Who pulls from it

| Editor | What it uses |
|---|---|
| **Ads Editor** (`ads/build.js`, `ads/plan.js`, `ads/layers.js`) | Every template, incl. the offer CTAs. Ads add their own rules on top: sound palettes, the loudness cap, banned voice effects. |
| **Clip editor** (`editor/index.js` pickers, `editor/director/plan.js` AI director) | `CLIP_TEMPLATES`: everything but the Atlas offer closes (keeps sonar, comment and follow CTAs). |
| **Dope clips** (`edits/graphics.js`, `lib/dope.js`) | `DOPE_TEMPLATES`: no CTA cards at all. |
| **Clipping tab** | Gets graphics when a clip is opened in the clip editor (pipeline → `applyEditorLayers`). |
| **YouTube editor** (`lib/longedit.js`) | Nothing yet. It's ffmpeg + ASS captions with no HyperFrames layer, so graphics need a render step added first. |

## Adding a graphic

1. Make `templates/<id>.js` (shape documented at the top of `templates/index.js`). Use the kit helpers from `_parts.js`
   and follow `references/atlas-motion-kit.md`: blur-in/out, slow settle, no back/elastic/bounce (`soften()` strips them).
2. Register it in `templates/index.js` (`KIT` for kit templates).
3. If it's a CTA (`job: "cta"`), it stays in ads only unless you add it to `CLIP_TEMPLATES` in `index.js`.
4. If it draws on the shot itself rather than floating in a spot (like `frame-markup`), give it `overlay: true`: it then
   spans the whole frame and isn't moved off the face.

Every editor sees it right away: the Ads planner's catalog, the clip editor's Elements panel and director, Dope's director.

## Adding a sound

Drop `sfx/<id>.mp3`, add the label to `SFX` in `sounds.js`, and its peak (seconds into the file) to `PEAK` if it
isn't at the start. Whooshes and risers go in `AMBIENT_SFX`.

## References (the motion language)

- `atlas-motion-kit.md`: **the house style.** It covers the creator's Atlas ads (AI Demo, V1 LightTrail, V2 Kinetic, V3 Orbit), their
  Remotion source, the Jeremy AI product demo (`~/Desktop/HBA : CD Powerpoitns/jeremy-ai-product-demo.mov`), and the
  Motion Graphics Director rules as built.
- `director-playbook.md`, `archetypes.md`: the creator's Motion Graphics Director v2 playbook (from
  `~/Desktop/motion-graphics-director-v2/`): beat sheets, hook/proof/close, legibility, QA checklist.
- `reel-study.md` (with the five reels in `reels/`): the creator's reference reels of 2026-10-22, rebuilt as `workflow-run`,
  `app-flythrough`, `frame-markup` and the `dive` scene transition.
- `sound-study.md`: **the sound standard.** The master reference the creator called perfect (2026-10-23): when each
  sound comes in and how loud, by role. The pack picks in `library.js` and the studio palette follow it. `focus-count` came from it too.
- `glass-ui.md`, `retention-transitions.md`, `sites.md`, `sound-effects.md`: the studies behind individual templates and sounds.

## Not here (yet)

These are motion-adjacent but still built into their own engines:
- **Dope cut transitions, shot effects, text slams** (`edits/looks.js`, drawn twice: ffmpeg in `edits/render.js` and
  HyperFrames in `lib/editplan.js`).
- **Caption styles** (`lib/compose.js`, `lib/hfedit.js`, `edits/text.js`, `lib/longedit.js`).
- **HyperFrames registry blocks** (`compositions/`, pinned by `hyperframes.lock.json`, so the CLI owns that folder) and
  the 4 vendored ones in `assets/registry` (light leak, flash, camera shake, camera move).
- **Colour grades** (`render.js` `GRADES`, `lib/hfstyles.js`, `edits/looks.js`, LUTs in `lib/luts.js`).

`ads/sfx`, `edits/sfx` (→ `sfx/`) and `ads/references` (→ `references/`) are symlinks, kept only so a server started before the move still finds its
sounds and the kit notes. Delete them after the next engine restart.
