# Sound and edit study: the master reference (2026-10-23)

The creator's words on it: "this is a perfect example of exactly how to use the captions, the motion graphics, the
elements, the sound effects/sfx, the transitions, the zooms & face tracking… even the amount of volume on the sound
effects, it's not too loud but it's not too low and it comes in at the right time."

- **Master:** the first 48 s of *content is hard until you build systems like this* (SooWei Goh and Dr. Odell Miller,
  YouTube `ktOcm0l3oMk`, 16:9). The creator sent a silent screen recording of it. The audio was studied from the
  YouTube original. Both are kept locally in `reels/` (gitignored, as `6-master-*`).
- **Supporting examples:** four of SooWei Goh's reels (`reels/7-…` to `reels/10-…`), the same editor's style.

## How it was measured

The soundtrack was split into voice / drums / bass / other with Demucs. Then:
- every effect in the voice-free stems was found by its sub-bass and high-band jumps (`> 200 Hz` and `> 4 kHz`);
- each effect was lined up against the 21 cuts and against what's on screen;
- each was matched against the creator's pack (`~/Desktop/SFX & Transitions`, 1,276 ad-friendly sounds indexed by length
  and peak in `data/sfx-library/index.json`);
- loudness was measured with EBU R128.

The voice sits at −18.6 LUFS integrated in their mix, and every level below is against that.

## The rules it follows

| Role | When, exactly | Level vs the voice | What it sounds like (closest in the pack) |
|---|---|---|---|
| Music bed | Under everything after the cold open. The cold open (0–13 s) has no bed, just voice and hits. | **−14 dB** | soft, warm, low |
| **Cut** whip | On a cut *into or out of* B-roll, a full-screen graphic or a new angle, peaking on the cut (±0.05 s). About half the cuts get one. Plain jump cuts in the same shot get nothing. | **−10 to −12 dB**, just above the bed | Quick Whips 24 / 31 / 4 / 15 |
| **UI** click | As an element appears: a title card, a mind-map node, a screenshot landing, a key caption word. | **−14 dB** (caption-word clicks are softer, ~−27 dB) | Camera Shutters: Very Short Shutter 6 / 3, High End White Noise Shutter |
| Count | A fast ticker under a number counting up, then a bright beep as it lands. | ticks **−14 dB**, land **−15 dB** | ticker; Flash Shutter Beep |
| **Riser** | Into each big section change: the reveal, the first graphic scene, the name title, the episode start. A 1–2 s swell whose peak lands *exactly on the cut*, then it stops dead. Four in 48 s. | peak **−1 to −2 dB** | Wind Risers: High Pitched SciFi, Low Drone Air Pump; Distorted Risers: Fast Airy Passing |
| **Boom** | Twice in total: the cold open's first frame and the name reveal ("SooWei"). | **about 0 dB** | Deep Impacts: Small Hit Drum; Epic Hits: Soft Metal Hit Big Low Boom |

What it never does: a whoosh on every cut, glitch sounds, stacked hits, an effect louder than the voice except those
two booms, and an effect under a sentence without something on screen for it.

### Time-coded (0–50 s)

| t (s) | On screen | Sound |
|---|---|---|
| 0.0 | Cold open, "if I'm scrolling" | deep boom (0 dB), no music |
| 1.8 | Cut to an Instagram profile screenshot on black | whip on the cut |
| 4.3 | Cut back to the two-shot | whip |
| 5.0 | "a reason to listen" | low hit under the line |
| 6.6, 9.0 | "tried to **influence**", "to a **neutral**" (emphasised words) | faint click |
| 11.0 → 13.0 | Two-shot → blur crossfade to Soo Wei's single | riser peaking on the cut; the music bed starts here |
| 14.1 | Cut to Odell's selfie clip | whip |
| 14.7–15.4 | "$849,519" counting up | ticker |
| 16.2 | "$850,000 / consulting business" lands | beep |
| 18.2, 20.1 | Angle changes | whips |
| 21.3, 22.3 | "doing **organic content**", "because you're like:" | clicks |
| 23.5 → 25.3 | "why would I do this…" → cut to a screenshot grid on black | riser peaking on the cut; the bed drops out for a beat |
| 26.1 | Screenshots fly into a funnel | click |
| 28.0, 30.3 | Cuts to Soo Wei, then to the document + picture-in-picture scene | whips |
| 35.3 → 36.5 | Document scene → "SooWei" letter-by-letter name reveal | riser into a boom (0 dB) |
| 37.7 | "founder of Goh Consulting" sub-title | click |
| 39.3–40.3 | "$9,870,802" counting up over a stage shot | ticker |
| 42.7 | Cut to the light mind-map | whip |
| 43.7, 45.8, 47.5 | Each mind-map node appears | click on each |
| 47.5 → 49.7 | Mind-map → "so let's get into it" | riser peaking on the cut, then the episode |

## The edit around it (for the visual side)

- **Captions:** small, plain white, lowercase, 1–3 words, just under the face, with no box. Emphasis is bold or bigger for
  a key phrase ("paid ads", "CONTENT STRATEGY" in caps), italic in quotes for reported speech ("oh, if ads are working so
  well", "why would I do this shit?"), and a red highlight box for one word ("the catch").
- **Numbers:** big white numbers count up over the shot ("$850,000" with a small italic sub-line), or over B-roll.
- **Name title:** the name builds letter by letter ("S… SooWei") with a small italic sub-line under it.
- **Graphic scenes:** screenshots on black (profile, grid); screenshots flying in 3D into a wireframe funnel; a document
  card with both speakers as picture-in-picture under it while the captions continue; and a light-grey mind-map the
  camera pans across, nodes appearing with lines between them.
- **Transitions:** mostly straight cuts. Big moments get a soft blur/zoom crossfade.
- **Zooms:** punch-ins on the speaker for emphasis, in and out on the line.

## Where it lives

- `motion/library.js`: the 13 sounds picked from the pack (`lib-whip-1…4`, `lib-click-1…3`, `lib-riser-1…3`,
  `lib-boom-1…2`, `lib-land`). They're converted into `motion/sfx/` on first load and gitignored (the pack's licence
  allows use, not redistribution).
- `motion/sounds.js`: `SFX_ROLE`, `ROLE_LEVEL` (the levels above) and `BED_LEVEL`.
- `ads/build.js`: the **studio** palette (classic sounds → these roles), role-level mixing in `sfxCap`, a whip on the
  way out of every full-screen scene, a riser into the first one, two booms at most, and the bed at
  `STUDIO_MUSIC_LEVEL` (0.2, 15 dB under the voice: the reference's 14, rounded to the line the render review allows). `ads/index.js` uses studio for every ad when the pack is on the
  machine, and the old palette rotation otherwise.
- `motion/templates/focus-count.js`: the 12 → 20 → 3 to-do graphic from reel 8, with the reference's count sounds.

## The visual pieces, as built (2026-10-23)

| Master | Built as |
|---|---|
| Captions: words rise in out of a soft blur as they're said; quotes in italics, a key phrase in big caps, a red box behind one twist | the **studio** caption look (`lib/compose.js`, `highlight: "studio"`). Words carry a `mark` (`quote`, `caps`, `box`) from the planner's `caption_marks` (`ads/plan.js`, applied in `ads/build.js`) through the editor document; a marked caps/box phrase is grouped on its own. Ads with the studio sound use it. |
| "$850,000 / *consulting business*": white number spinning up in a motion blur, landing sharp, italic line word by word | the number card's **studio** variant (`motion/render.js`, `variant: "studio"`, set by `ads/build.js` with the studio sound) |
| "S… SooWei / *founder of Goh Consulting*" | `name-title` |
| Posts pouring into a funnel, "0 Clients" | `content-funnel` (full-screen) |
| The light mind-map the camera pans down | `mind-map` (full-screen) |
| The soft blur crossfade into a big moment | the **blur** scene transition and the **blur** cut hit (`motion/render.js`; a riser peaks with it, `ads/build.js` `HIT_SFX`) |
| Punch-ins on the key lines | already the ad framing's punch (`motion/render.js adFraming`) |
| The to-do list cut from 20 to 3 (reel 8) | `focus-count` |

The Premium style now uses the **Master Edit** direction (`ads/plan.js`), which leads with these.
