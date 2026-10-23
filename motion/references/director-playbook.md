<!-- The creator's Motion Graphics Director v2 playbook, copied from ~/Desktop/motion-graphics-director-v2/SKILL.md on
2026-10-01. Its rules are built into the kit (atlas-motion-kit.md, "Motion Graphics Director rules"); the creator's
brand tokens (Atlas coral, ink, cream; Plus Jakarta Sans) always win over its fallback palettes. -->

---
name: "motion-graphics-director"
description: "Plan and QA motion graphics videos (launch reels, showreels, explainers, product films, ads, animated social posts) before building them. Use when the user asks for a motion graphics video, kinetic type piece, or animated ad, or before any Remotion / HTML-GSAP / Higgsfield motion build. For Dr. OD transcript-driven CapCut overlays, use od-motion-graphics instead."
---

# Motion Graphics Director

Plan the piece first, get approval on a beat sheet, then build. Output of this skill: (1) a beat sheet table for approval, (2) after approval, a build in Remotion, HTML/CSS/GSAP, or Higgsfield, (3) a QA pass on rendered stills.

For the build itself, follow the `remotion:*` skills when using Remotion.

## 1. Confirm inputs before planning

Ask for anything missing in ONE message. If the user doesn't answer, use the default and say so.

| Input | Default |
|---|---|
| Goal + audience (what should the viewer do or feel?) | none, must ask |
| Platform / aspect ratio | 9:16 for social, 16:9 otherwise |
| Duration | 15s reel, 30s launch |
| Brand tokens (colors, fonts, logo) | fallback palettes in `archetypes.md` |
| Copy / VO / music | write copy, silent draft with hit-point markers |
| Loop? | no; yes for Stories/looping reels |

**Brand tokens always win.** Fallback palettes are used only when the user supplies none.

## 2. Pick an archetype

Choose one from `archetypes.md` (showreel, SaaS launch, illustrated narrative, product hero, mascot-led, hybrid footage, vertical app update). State the choice and why in one line. Do not mix more than two.


## 3. Beat sheet rules

- Open on almost nothing (one dot, line, cursor), then scale up hard. The contrast is the hook.
- One idea per beat. ~1 to 1.5s per beat for 15s reels, ~2 to 3s for launches.
- Hook: 3 to 6 words (a pain, a question, or a bold claim), on screen within the first second.
- Proof beat: numbers moving (counter, bar chart with last bar highlighted, filling grid).
- Close: logo lockup + one-line tagline + URL/CTA, held at least 1.5s. If looping, make the last frame match the first.
- Deliver the beat sheet as a table: time | visual | on-screen text | motion | transition | audio hit. Stop and get approval before building.

## 4. Typography and color

- Type is the hero: heavy grotesk, tight tracking, set huge; cropping off-frame is fine if the hook remains readable.
- One italic serif accent word inside a sans headline is allowed. Max 2 fonts total.
- Enter word-by-word or letter-by-letter with motion blur. Never fade whole paragraphs.
- Small monospace HUD microtype (timecode, "06/10", labels) adds an engineered feel; skip it for warm or consumer brands.
- 2 to 3 colors plus neutrals. Cut between full-bleed color fields on the beat.

**Legibility limits**
- Reading speed: about 3 words per second on screen. Every text beat must stay up long enough to read.
- Minimum body/caption size at 1080p: ~48px; headlines far larger.
- Text over footage or busy fields needs a scrim or solid backing. Check contrast (aim for 4.5:1).
- 9:16 safe zones: keep key content out of the top ~250px and bottom ~400px (platform UI), and ~60px from the sides.

## 5. Motion language

Defaults, adapt to the archetype (calm product hero: slower, fewer staggers; showreel: snappier):
- Entrances: fast-out/slow-in, `cubic-bezier(0.16, 1, 0.3, 1)`. UI and pop-ins: spring with light overshoot. Linear only for continuous loops and slow camera creeps.
- Stagger groups by 30 to 60ms.
- Match cuts: dot becomes logo, circle wipes to next field, shape morphs into UI.
- Particles/dot matrices assembling into a form; 3D cube waves, chrome objects, tilted UI cards.
- Floating UI fragments orbiting a headline = "many things, one place".
- An easing-curve or motion-path diagram as a beat signals craft.
- Every move has a clear start and a settle.

## 6. Audio

- Place music/SFX hit points on the beat sheet; land cuts and big entrances on them.
- With VO, sync on-screen words to the spoken word, arriving up to ~2 frames early rather than late.
- If no audio is supplied, still mark hit points so audio can be added later.

## 7. Anti-patterns

- More than 3 fonts or 3 accent colors.
- Fading everything in at the same time.
- Default template easing on every layer.
- Holding a beat after its idea has landed.
- Text on busy footage with no scrim.
- Reusing the fallback palette when the brand has its own.

## 8. Build workflow

1. Gather 3 to 5 reference frames; confirm archetype.
2. Lock tokens: colors, 2 fonts, logo, aspect, fps (30 or 60), duration.
3. Beat sheet table, approved by the user.
4. Build scene by scene: one component per beat, shared tokens file.
5. For real-world footage or characters, generate in Higgsfield, then layer type and UI in code.
6. Render a draft and run the QA checklist below, then polish.

## 9. QA checklist (run on rendered stills and the draft)

- [ ] Hook is readable within the first 1s
- [ ] Every text beat is on screen long enough to read (~3 words/s)
- [ ] Nothing important sits in safe-zone margins
- [ ] Contrast and scrims verified on text over footage
- [ ] Easing is consistent across beats; no accidental linear
- [ ] Only the approved fonts and colors appear
- [ ] Cuts land on audio hit points
- [ ] End card held at least 1.5s (and loops cleanly if required)

## 10. One-shot prompt template

```
Make a [duration]s [aspect] motion graphics video for [brand/product].
Goal/audience: [...]. Archetype: [...].
Palette: [hex, or "use fallback"]. Fonts: [heavy grotesk] + [italic serif accent].
Beats:
0.0–1.0s  [visual] | text: "..." | motion: [...] | transition: [...] | audio: [...]
...
End card: logo + "[tagline]" + [URL], held 1.5s. Loop: [yes/no].
Motion defaults: expo-out entrances, 40ms staggers, match cuts, no linear easing
(adjust to archetype).
```
