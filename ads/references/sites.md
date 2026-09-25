# Ideas from motion tools the creator pointed at (2026-09-24)

Ideas and techniques only: none of their assets, presets or sounds are copied. Everything here is rebuilt by us.

## Hera (hera.video): an "AI motion designer" with a template library organised by job
- **Organise by job, not by look.** Their packs: an overlay pack (lower thirds, quote cards, callouts, chapter markers,
  metric labels), infographic/data stories (charts, dashboards, survey results), app demos (phone mockups, UI callouts),
  social video ads (hooks, offer frames, proof overlays, CTA cutdowns), countdowns, speaker/agenda cards, and a brand
  motion kit (intros, CTA cards, product callouts, proof cards, chart styles, lower thirds).
- **Prompt to direct, then fine-tune any detail.** This is the same model as our AI plan followed by the timeline editor.
- For us: the template catalog carries a `job` tag (proof, offer, data, product, cta, hook, transition), and the
  planner picks by job and then rotates looks within it.

## FastFX (a Premiere plugin): make every cut hit
- **Effects on the cut, one click:** hits (zoom punch + flash), shakes, wipes, flashes, custom transitions, and looks
  like CRT, Thermal and Black & White. Each has intensity, motion blur, direction and timing controls.
- Its idea is rhythm: a hit on the beat or the key word, not decoration.
- For us: "hits" are camera moves on the Camera track (`shake`, `zoom-hit`, `flash`, `rgb-split`, `bw-hit`,
  `crt`, `whip`), each 0.1–0.4 s, placed by the plan on key words and hook cuts, and paired with a sound.

## Topview Motion Studio: product-launch motion
- **Float-enter:** an element flies in from an offset (`--from-x/--from-y`), scales 0.08 → 1.08 → 1 over 0.86 s with
  `cubic-bezier(0.16, 1, 0.3, 1)` (a soft expo-out), and the overshoot lands at ~68% of the time.
- **Idle float:** once landed, every element keeps drifting a few px and swinging ±3° on a 6–9 s sine loop, with
  different periods per element (A 7.5 s, B 9 s, C 6.4 s) so the motion never syncs. Nothing is ever dead still.
- **Glass stroke:** a 2px border drawn as a 135° gradient (white 92% → 38% → pale blue 28% → 6% → blue 34% → white 70%)
  on a dark fill, plus an inset 1px top highlight and a soft drop shadow. Light catches the corners.
- Their style vocabulary: cream backgrounds, coral/blue/violet **gradient spheres**, bold black-and-white **kinetic
  type**, sparkle icons, **purple orbital paths**, floating UI cards, an AI prompt composer, smooth scaling,
  **circular masks, match cuts, motion blur**, and a closing logo card, with interface sounds and upbeat electronic music.
- A subtle perspective grid plane masked to fade upward, as a background texture.
