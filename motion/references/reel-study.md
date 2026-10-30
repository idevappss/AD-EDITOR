# Reel study (2026-10-22)

Five Instagram reels the creator sent as "animations, elements and motion graphics we will be using", plus "make sure you
copy this same format/framework". The originals are in `reels/` (downloaded 2026-10-22, 720–1080 × 1280–1920). Everything
below is rebuilt from scratch as HyperFrames templates; nothing is copied from the videos themselves.

| File | Source | What it is | Rebuilt as |
|---|---|---|---|
| `reels/1-workflow-energy-DcHTz3AsQ-6.mp4` | @cog._mind, 8 s | AI real-estate agent: an n8n-style flow on a tilted grid, an energy pulse lighting each node | `workflow-run` |
| `reels/2-workflow-n8n-Dd9zPqUPgDB.mp4` | @cog._mind, 10 s | The same idea on the real n8n canvas: dots streaming down wires, nodes flaring orange → white → green | `workflow-run` |
| `reels/3-laptop-dive-journal-DevAWBmMIat.mp4` | @mazinecrypto, 10 s | "I hate journaling… / Me:" meme, a laptop opens, dive into a tilted Notion trading journal | `app-flythrough` + `dive` |
| `reels/4-laptop-dive-habits-DeuiidxyVVZ.mp4` | @thedashbit, 11 s | "POV: I turned fixing my life into a cool app", the same dive into a mint-on-black habit tracker | `app-flythrough` + `dive` |
| `reels/5-frame-markup-DeXICxsI8OI.mp4` | @adam.kelada.media, 17 s | Talking-head tips on placement: one-word captions plus shapes drawn on the shot | `frame-markup` (+ the Basic caption style) |

## 1 + 2. The workflow run (`workflow-run`)

- **Canvas.** Dark slate (`#12161A`), a faint 120 px grid, tilted in 3D (about rotateX 30°, rotateZ −8°) and seen close:
  2–3 nodes fill a 9:16 frame. Soft depth of field at the edges, and a few dim mono "HUD" labels for texture.
- **Nodes.** Rounded-square tiles (about 150 px, 32 px radius) in graphite with a 1 px hairline, a coloured line icon in the
  middle, a white bold label under it and a small mono caps tag. The AI step is a wide card with its icon and name inside.
  Ports are small grey dots at the ends of each wire.
- **The pulse.** A white-hot head with an orange (accent) glow zips along the wire (ease in-out, about 0.4–0.8 s), trailing
  a glowing segment and shedding sparks that drift and fall. When it lands, the node's rim draws round it in the accent, the
  glow flares then settles, a ring breathes out and the icon "wakes" (desaturated → full colour). The camera glides to the
  next node with the pulse.
- **Fan-out.** The agent node sends blue dashed lines down to its tools (circles: model, memory, sheet). They light blue in a
  haze of particles. Then the run continues along the main chain.
- **After.** Lit wires brighten and keep streaming small light dots (reel 2). The last node flashes green with a check (reel
  2's green column). Reel 2 also has the orange "Execute workflow" button; ours is clicked by the cursor to start the run.

## 3 + 4. The laptop dive and the app flythrough (`dive`, `app-flythrough`)

- **Format.** Top caption in plain white bold ("POV: …", "\"I hate journaling…\" / Me:") over a real shot of a laptop being
  opened, about 4 s. Then a hard dive into the screen: the footage smears with an RGB split and blur, and the UI rushes back
  from too close. In our editor that's the `dive` scene transition, best placed right after the speaker shows a laptop or phone.
- **The flythrough.** A dark app (near black, mono labels) lying at a steep angle like a laptop seen from the side
  (about rotateY −27°, rotateX 14°), heavy depth of field at the edges, a faint screen glare. The camera glides from panel
  to panel (about 1 s each), and each panel fills as we reach it:
  - rings that sweep round while the number counts up (white, the accent, red for losses);
  - a habit grid ticking across in the accent, with % and ★ streaks on the right (reel 4's mint `#2EE6B8`);
  - table rows dropping in with green WIN / red LOSS pills;
  - bars growing (blue, gold, white);
  - an area chart drawing itself with a big italic % number.
- One screen colour per video: mint (reel 4), blue (reel 3), or the brand accent.

## 5. The talking-head framework (`frame-markup`, captions)

- **Framing.** The speaker sits centred, tight, eyes at about 40% of the height. Every element stays inside the safe zone,
  which is exactly our `REEL_SAFE` (`lib/facezone.js`: 14–86% tall, 13% sides).
- **Captions.** One word (two at most) at a time, lowercase, white, a heavy rounded grotesk, on `CAPTION_LINE` (76%). No box,
  just a soft shadow. That's the Basic ("talking-head") edit style's caption look already, so nothing new was needed.
- **Markup.** Flat translucent shapes drawn straight onto the shot on the exact word, under the captions:
  - a yellow highlighter pill swipes across the eyes, or behind the caption word ("this is where your *caption* goes");
  - a yellow pill grows at the top and fills in with "Title Hook";
  - a green box opens out from the middle over the safe zone;
  - the frame tints red everywhere *outside* the safe zone ("danger");
  - a dashed white eyeline draws across.
  One mark per beat, about 1 s each, off before the next.

## 11 + 12. The Premium targets (2026-10-28)

The creator's answer to a bad Premium edit (head cut off, random zooms, one graphic, no build-ups, captions too big):
"this is perfect… how his face stays in the screen, the zooms ins n outs". Saved as `reels/reel-DfDMY6kIRx4.mp4`
(86 s, filmed 16:9) and `reels/reel-DehNeOjoa2W.mp4` (27 s, 9:16, "very interactive and viral").

- **Framing.** Always wide enough that the whole head has air above it; the face never touches the frame edge. Reel 11
  moves the camera only with slow continuous push-ins (a few % over several seconds), never a wide/tight jump per sentence.
  Reel 12 mostly holds a steady wide shot and gets its energy from cutting to graphics instead.
- **Captions.** Small: one lowercase word at a time, about a third of the size we use. Reel 11 sits it on the chest just
  under the chin; reel 12 puts a bolder white word above the head. Key words get a colour treatment (red word, yellow
  highlight box with dashed selection handles).
- **Graphics.** Dense: a new visual every 1–3 s. Count-up money ("$1,9…,560 → $2,000,000") over the head, big words that
  sit behind/over the speaker ("content", "ideation", "results"), a Venn, a "TOP VIDEOS → CLAUDE" flow, document cards,
  bar charts on white full-screen cards, B-roll cutaways; reel 12 adds full-screen app/UI scenes (retro computer typing
  "CLAUDE_" word by word with the speech, phone menus, logo tiles, editor timelines).
- **Look.** Reel 11: teal/orange cinematic grade. Music bed with whips and risers into each full-screen scene.

## How to use them

- The Ads planner has a **Screen Dive** direction (`ads/plan.js`) that leads with these. Any direction can still pick them
  from the catalog.
- The clip editor gets all three (Elements panel and its director); `dive` is in the scene "Comes in" menu.
- Dope clips get the two scenes; `frame-markup` too (it's not a CTA).
