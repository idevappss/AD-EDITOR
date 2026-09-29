# Atlas motion kit (the creator's favourite look)

Studied 2026-09-28 from three finished Atlas motion-graphic ads on the creator's Desktop, all 720x1280, 30 fps:
`Atlas-AI-Demo.mov` (49 s), `Atlas-V1-LightTrail.mov` (30 s) and `Atlas-V2-Kinetic.mov` (25 s). These are pure
motion-graphic ads (no speaker). The creator asked for "the minimalistic and simplicity of these effects". Every
Ads Editor graphic now follows this language, and the scenes below are rebuilt as templates in `ads/templates/`
(template id in brackets).

## The language

- **Minimal.** One idea on screen at a time, lots of empty dark space, small UI, no stickers, emojis or badges.
  Motion is slow and soft: things *arrive*; they don't pop.
- **Ground:** a warm near-black (`#15110F` to `#1B1512`) with a big soft accent glow behind the subject (radial,
  about 15–25 % opacity), a dark vignette, and faint drifting dust specks (1–2 px warm dots, slowly twinkling).
  For contrast, some scenes flip to a **full-bleed accent** ground (`#E0673F` orange, with a darker vignette) with
  dark or cream type. The cut between dark and orange is a hard cut on a beat, or a quick crossfade.
- **Type:**
  - Headlines are a heavy geometric grotesk (Plus Jakarta Sans ExtraBold look; we use Inter 800) with tight tracking
    (about −0.035em), in sentence case and short lines ending in a full stop.
  - Headlines are **two-tone**: line 1 in cream white (`#F5EFE8`), line 2 in the accent ("One team. / *Never off the
    clock.*", "You ask. / *It does the work.*"). White text has a faint glow (text-shadow of 20–30 px, white at 35 %).
  - Kickers are small **mono caps**, widely tracked, in the accent or at 45 % white ("EVERY FRIDAY · WEEKLY ADS
    REPORT", "MEET YOUR NEW TEAM", "11:47 PM · OFFICE CLOSED", "TUE · 9:47 AM").
  - Body and UI text is Inter 500–600, small, at 55–70 % white.
- **Cards:** dark warm glass (`rgba(38,30,27,.72)`), a 1 px accent hairline border (the accent at about 35 %), a soft
  outer accent glow (about 40 px, 15–20 %) and rounded corners (about 22 px at 720 wide). They are **tilted in 3D**
  (rotateX about 8°, rotateY about −10°) and slowly rotate towards flat while on screen. There are no heavy drop shadows.
- **Status colours:** green `#3DDC84` for Done or online, the accent for Working or Scheduled, amber `#F5B63F` for In
  progress, red `#F0534A` for Needs approval or a missed call. They are small dots or text, never big fills.

## Motion rules

| Beat | How it moves |
|---|---|
| Enter | **Blur-in**: opacity 0 → 1, blur 12–16 px → 0, y +16–30 px → 0, scale .97 → 1, 0.6–0.8 s, `power3.out`/`expo.out`. No overshoot and no bounce. |
| Text | Lines blur in one after another (0.12–0.2 s apart). Line 2 (accent) lands after a short hold. |
| Exit | Blur-out: opacity → 0, blur → 10 px, a slight drift up, 0.35–0.45 s, `power2.in`. |
| Hold | A slow 3D settle (rotateX/rotateY ease toward 0 over the whole hold) or a 2–4 % push-in. It never sits dead still. |
| Swap | Words swap in place with a blur crossfade (old blurs out as the new one blurs in), about every 0.6–0.8 s. |
| Emphasis | A thin glow brightens, or a status flips (Working → Done), or a check strokes in. Never a scale punch over 1.05. |

## Scenes (each is a template)

1. **Light trail → prompt** (`trail-prompt`), V1 0–6 s. A glowing dot (white core, accent halo) rises from the bottom
   edge, drawing a thin accent line behind it that curves right into a horizontal run. The trail *becomes* the
   top-left corner of a glass prompt box, which then fades in as the trail fades out. The heading "What should Atlas
   handle today?" blurs in above it, and the prompt types itself with a caret. A small hint line sits under the box.
   The send button lights to the accent when typing finishes.
2. **Task card** (`task-card`), V1 6–11 s. The prompt tilts back in 3D, and a second glass card below it lists what the
   agent is doing: "Setter · following up" with a "● Working" status in the accent. The items are dim with empty check
   circles, and each one ticks green in turn (the circle and tick draw, the text brightens). When the last one ticks,
   the status flips to "● Done" in green.
3. **Approval pill** (`approval-pill`), V1 11–13 s. An outlined, glowing pill with an accent dot, "● Approval needed",
   sits alone in the dark. A mouse cursor glides in and clicks it; the pill fills solid accent and reads "Approved"
   with a dark dot, then blurs away.
4. **Task board** (`task-board`), V1 13–17 s. A tilted glass table with the mono kicker "TASKS · THIS WEEK". Rows add one
   at a time, each a task name on the left and a coloured status on the right (● Done / ● Scheduled · Fri /
   ● In progress / ● Needs approval). A mono kicker and a line of copy sit bottom-left.
5. **Schedule clock** (`schedule-clock`), V1 17–21 s. A mono accent kicker, a huge clock "11:58" with a small "AM",
   and a row of weekday chips (M T W T F S S) with one chip filled in the accent. A two-tone line under it: "Put it on
   a schedule. / *Never ask twice.*"
6. **Word swap** (`word-swap`), V1 21–25 s and V2 0–3 s. A small muted label ("AI that works as", "Every") above a big
   glowing word that swaps with a blur crossfade: "Your setter." → "Your marketer." → "Your assistant." → "Your COO."
   The last word is in the accent.
7. **Strike swap** (`strike-swap`), V2 3–4 s and Demo 0–3 s. A phrase gets a hand-drawn accent strike line drawn across
   it, left to right, and dims. The replacement then blurs in under it, bigger and in the accent: "no-show." →
   "*Handled.*", "Your clinic runs you." → "runs *itself*."
8. **Notification stack** (`notif-stack`), Demo 3.5–8 s. A mono time "TUE · 9:47 AM" at the top left and a red
   "47 unread" pill at the top right that counts up. Notifications pile in, each overlapping the last and slightly
   rotated: a mono label ("PHONE · now"), a coloured dot and a title with a detail line.
9. **Card carousel** (`card-carousel`), V2 5–11 s. A 3D carousel: one glass card faces you, then turns away on the
   Y axis as the next turns in (perspective, with both visible mid-turn). Each card has a mono header with the
   logo, a few rows with the last one highlighted in the accent, and a caption under the carousel that changes
   with each card.
10. **Stat rows** (`stat-rows`), V2 11–15 s. Big glowing numbers stacked on the left, each with a small muted label to
    the right: "24/7 Always on", "0 Call-offs" (in the accent), "1 Click to approve". The rows blur in one by one.
11. **Logo rings** (`logo-rings`), Demo 8–11 s and V1 25–30 s. The logo mark sits in thin concentric rings over a warm
    radial glow. The rings expand softly, the wordmark letters fade in with wide tracking, and a tagline and a mono
    accent kicker follow.
12. **Chat thread** (`chat-thread`), Demo 31–36 s. A mono header ("11:47 PM · OFFICE CLOSED"). The patient's bubbles
    are light and sit left; Atlas's are dark and sit right with a tiny mono "ATLAS · SETTER" tag. Each reply
    starts as three typing dots. A confirmation toast slides up at the end ("New consult · 2:30 PM ✓").
13. **Org chart** (`org-chart`), Demo 36–41 s. An outlined "CEO / You" box draws a line down to a solid accent "COO /
    Atlas" box. Curved lines then fan out to a row of department chips that appear one by one.
14. **Agent grid** (`agent-grid`), Demo 21–26 s. A two-column grid of dark cards pops in one by one, each numbered
    "01".."08" in mono with a green "● online", a bold name and a muted line.
15. **Statement** (`statement`): the two-tone headline as its own beat ("You ask. / *It does the work.*", "It won't
    replace you. / It handles the work that buries you.").
16. **End card** (`end-card`), V2 20–25 s and Demo 44–49 s. The logo mark, a mono kicker ("ATLAS BETA · LIMITED
    TIME"), a two-tone "Try it free / *for 7 days.*", a glowing pill button with the URL ("app.atlas-ai.club"), a
    small line under it and a mono audience footer ("CHIROPRACTORS · PHYSICAL THERAPISTS · HEALTHCARE OWNERS").
    It comes on the dark ground or the full-bleed accent ground.

## Full-screen scenes

In a talking-head ad these become **cutaways**: the speaker's voice keeps going while the picture cuts to the dark
(or accent) ground for the scene, then back to the speaker. The planner uses 1–3 per ad, 1.5–4 s each, on lines
that describe what the product does. Everything else floats over the speaker on the same glass.

## Sound

The references use a soft music bed with gentle UI sounds: a soft tick per checklist item, a glass ping on arrivals,
an air whoosh on scene changes and a click on the cursor. There are no crashes or big bass hits inside these scenes.
The templates' `sfx` follow that.

## The source: the creator's Remotion project and the Jeremy AI demo (added 2026-09-28)

The creator later shared the Remotion source of these ads (`~/Downloads/Atlas-Demo-Remotion-Project_1`: `AtlasDemo`,
V1 LightTrail, V2 Kinetic, and V3 Orbit, which is a fourth video) and a second reference, `~/Downloads/jeremy-ai-product-demo.mov`
(the same kind of ad for another brand, in cyan on navy). The kit now uses the source's exact values:

- **Palette:** coral `#EE7440` (the Atlas accent), coral-deep `#D95F2B`, peach `#F9CDB3`, cream `#FBF1E8`, paper `#F2EDE6`,
  ink `#17120F`, ink-2 `#231C18`, green `#3DDC84`, and muted cream at 62 %. The ad's accent comes from Assets; set it to coral to
  match the Atlas ads exactly.
- **Type:** Plus Jakarta Sans 800 for display, Inter 400–700 for UI and JetBrains Mono 500 for labels. The files are in
  `assets/fonts/`.
- **Glass:** `linear-gradient(160deg, cream 10 % → 3 %)`, a 2 px coral border at 45 %, radius 36, a 60 px coral glow at 18 % and
  an inset glow. On paper the cards are white with an ink border at 8 % and a soft drop shadow.
- **Glow text:** `0 0 .25em` at 40 % and `0 0 .6em` at 20 %. The easing is `bezier(0.16, 1, 0.3, 1)`, which is GSAP `expo.out`.
- **Grounds:** a V1 radial ink (`#2A1B14 → #17120F → #0C0907`), flat coral, or paper. All three get film grain (fractal noise,
  overlay, 5–7 %) and a vignette. The ink ground also gets rising ember motes (2–6 px coral dots that glow and twinkle).
- **The ATLAS mark:** five rounded rays rising over two horizon bars (`ATLAS_MARK` in `templates/_parts.js`). It is the fallback
  whenever an ad has no logo.
- **Scene transitions** (Remotion `TransitionSeries`): slide from the bottom, wipe, fade, a circle reveal, and the Jeremy demo's
  glitch cut. A clip picks one with `transition`, and they rotate when it doesn't.
- **Sounds:** the project's own synthesized effects (whoosh, click, pop, ding, marker, riser, impact, typing, success), stored as
  `ads/sfx/atlas-*.mp3`. Templates use them at the same beats as the source.

More scenes built from the source (template ids): `orbit-network` (V3: radar rings, a hub, agents spinning in and settling,
tool pills with streaming dashes, and a camera push into one agent), `agent-log` (V3's zoomed agent card, ChatDemo's task
rows), `approval-card` (V3's approval with a tap: Approve → Live ✓), `phone-report` (Report: a lock screen with a notification
and a button tap), `chat-app` (ChatDemo: type, send, "···", team rows ticking, approve → Campaign live), `chain-stack` (V3's
You → Atlas → Your AI team) and `wordmark-type` (V1's lockup with a typed question).

From the Jeremy demo: `status-flood` (one pill cycling Working → Approval needed → Ready for review → Complete, with the
whole frame flooding amber, cyan, violet and green under diagonal light streaks), `app-window` (a tilted dashboard with a
sidebar and a task table, a glowing scan line sweeping the rows under a "Looking through your knowledge" chip),
`skill-cards` (specialist cards flying in with a 3D tilt, the last lit with a sheen), `tool-map` (a hub tile with tool pills,
lines and light pulses running out), `voice-ring` (a round portrait inside radial audio bars, "Or just call him."), the
word-swap's segmented "02 / 05" counter, the schedule clock's rolling digits and weekday ranges, and the glitch transition.

Upgraded to their exact source scenes: word swap (V2 "Every ___": each word snaps in from 1.25×, then a thick marker strike
and the coral "Handled." punch with a flash), strike swap (the Hook's 24 px marker stroke, peach lines on coral), stat rows
(V2's count-up, 0 → 24 for "24/7"), the notification pile-up (the Chaos role headline, dropping cards, a ding each, a shake),
the carousel (a real rotating 3D ring with chat, slot and bar-chart faces), the agent grid (the Roster headline, cards rising),
the org chart (the mark in the Atlas box, footer lines), the light trail (a blurred coral stroke plus a cream core), the logo
reveal (the Reveal scene's expanding rings and a mark bursting in with its rays growing), the chat thread (the Setter scene's
bubbles, the "ATLAS · SETTER" tag and a booking toast with a date chip), the statement (Honest's side-bar note) and the end
card (the mark, the display kicker, a bigger pill).

Field conventions: two-tone headlines go in `highlight` as "line 1 / line 2", with spaces around the slash so "24/7"
survives. Positional items take "-" for an empty slot.

## Original CTA designs (added 2026-09-29, the creator: "come up with new ideas… creative freedom")

The creator asked for the CTA's look to change from ad to ad. Each ad gets one of `CTA_STYLES` (ads/plan.js), never the
same as the last two ads': the glowing button (kind "cta"), `search-cta`, `trial-pass`, `end-card` or `wordmark-type`.
The two new ones are in the kit's language:

- **Search CTA** (`search-cta`): a glass search bar blurs in and types the query ("atlas 7 day free trial"), the send
  button presses, and a result card rises under it with the mark, the product line, the accent button and a mono URL.
  A cursor then clicks the button and a soft ring bursts out. This is the natural fit for the creator's own line, "click
  below and search your seven day free trial". It floats over the speaker or runs full-screen (paper or accent).
- **7-day pass** (`trial-pass`): a dark ticket with notched sides. Seven day cells light up in the accent one after
  another, with a soft tick each. Then the two-tone "7 days. / On us." lands and the button rises. It's for the trial
  offer only.

On the accent ground, dark cards keep the brand accent inside them (`--brand`), so nothing goes coral-on-coral or
ink-on-ink.
