# Reference 2: "AI motion graphics" Short (Brad Gaines, 35.9 s, 1080x1920, 30 fps)

The user called this "a perfect example for the motion graphics". Rebuild the **format**, not the product.
Coordinates are % of the 1080x1920 frame (x from left, y from top). Times are seconds.

## 0. The core format: stacked split screen (0–29.0 s)
- **Speaker card** is fixed to the bottom: a rounded rectangle (radius ~2.5% of width), full-bleed at the bottom edge.
  Size changes per scene: 5–95% x, 70.5–100% y (0–4 s) → 12–88% x, 73–100% y (from 8.6 s). Resize with a
  0.4 s `power3.inOut` tween on the scene change, never mid-scene.
- The speaker is **background-removed** and placed over a plate: a bright cool-blue sci-fi corridor, which is AI-generated.
  **His head and cap break out of the card's top edge** by ~7% of frame height, so the face sits *above* the card
  (y 62–72%). Stack order: card plate → graphic area → speaker cutout → captions.
- The **graphic stage** fills the rest of the frame (y 0 to ~72%), full-bleed with no border, and runs behind the card.
  Graphics never go under the face: nothing important sits below y 60% at x 30–70%.
- From 29.0 s the speaker is **removed** and the graphics go full-screen (for the payoff and CTA).
- Cut rate: **a new graphic scene every 2.1–3.3 s** (11 scenes in 36 s). The speaker shot itself never cuts.

## 1. Scene-by-scene graphics (trigger word in quotes)
| t | Graphic (stage area) | Entrance / hold / exit |
|---|---|---|
| 0.0–2.0 | Satellite map of the US West Coast, full stage. A glowing white line (4px, outer glow in violet #8B7BFF) **traces the California border**, then the state **fills with translucent purple** #7A5CFF at 55%. | Opens with a 0.3 s blur-to-sharp and scale 1.15→1.0. The line draws over 0.9 s, starting on "generate". The fill fades in 0.25 s on "graphics". |
| 2.0–4.0 | Beige radial-gradient stage (#EDE9D6 center → #CFCBB8 edges). A 5-node network: circular icon badges (cream #F6F0D8, 1.5px dark ring, soft shadow, ~7% width). One node sits at the top, four at the corners. Dashed tan lines (#C9A57A) cross, with small grey pill labels and a centre dot. | Top node pops in first (scale 0→1.08→1, 0.35 s). The other 4 pop with a 0.08 s stagger on "like this". Lines draw with a dashoffset over 0.5 s, then labels fade in. Exit: **horizontal whip** (below). |
| 4.0–6.5 | Sky-blue gradient stage (#6FB6FF → #4A9BF5, soft pink blob bottom-left) holding a **collage of 4 floating cards**: a video player showing a UK satellite map (x 9–91%, y 9–37%), a dark Figma card #1C1C1C, a white-bordered "$4M" stat card, and a white bar-chart card ("Global Population Growth Metrics"). Each card has a white 6px border, radius 1%, and a **long hard drop shadow at 45° to the bottom-right** (#2F6FD6 at 60%, offset ~40px). | Cards slide in from the right with motion blur, 0.1 s stagger. The bar chart **grows its bars left→right** (0.8 s stagger, gradient red #E8434F top → blue #4B5CF0 base). "$4M" count-up is blurred→sharp. |
| 6.5–8.6 | **Vertical scrolling column of cards** (stage looks like an app feed on a peach #F8E6DA dotted-grid bg): a black card with green "Reason 1" tag rows, an NYT-style article card (serif headline types in), and a **pink-gradient card with a logo reveal** (logo dots assemble, then the wordmark and a typed tagline). The speaker card becomes the last card of this column. | Enters with a **fast vertical whip**: the whole stage translates up ~60% in 0.25 s with a heavy vertical blur, and the speaker card is carried up from below. The headline and tagline typewrite at ~18 chars/s. |
| 8.6–10.9 | Next section of the same column: a black stock chart card (a green area line draws left→right with a white glow on the leading edge), a light-grey card where 3 dark app icons pop in one by one, and a lavender card with an iPhone mockup. | Another vertical whip up (0.25 s, blurred). Chart draws over 1.2 s. Icons pop on "tell", "what", "want" (scale 0→1, `back.out(2)`). |
| 10.9–12.9 | Pure black stage. A **glassmorphism profile card carousel**: a card with a thin 1px white 20% border, radius 4%, labelled "Young / Adult / Old", with 3 progress bars (Time / Energy / Money in orange #FF8A3D, green #9BE33A, red #FF3B3B). Behind the glass are huge blurred glowing blobs (purple #9B3BFF, cyan #1EC8FF, lime #A6F03A). | Cards slide horizontally, ~40% width per step, 0.35 s `power3.inOut`, with a 0.1 s blur. The blobs morph and move with the slide. The bars re-animate their widths per card. |
| 12.9–13.4 | **Light-leak flash**: orange/peach burn sweeps across, then white, over ~0.4 s. | Transition. See §4. |
| 13.4–16.6 | Cream **"AI prompt UI" mockup**: bold black title (Inter/Plus Jakarta 800, ~5.5% frame height), a grey subtitle, an input card with pill chips (Image/Video/Audio/Font/CSV). A colourful logo tile **drops into the input** from above. Then the prompt **typewrites**. | UI slides/scales in from the top-left (scale 1.1→1, 0.4 s). Logo drop: y −30%→0 with a small bounce. Typing 14 chars/s, beginning after "logo". |
| 16.6–17.0 | Second light-leak flash (orange → white). | Transition. |
| 17.0–19.4 | Dark #1E1E1E stage. A 5-circle logo **assembles**: the circles drift in, overlap, then snap into the logo shape. | Circles move with `elastic.out(1,0.5)` over 1.2 s. They hold still from 18 s. |
| 19.4–22.6 | Back to the prompt UI (from a 0.3 s cross-dissolve). A new prompt typewrites word by word, and the caret blinks. | Typing matches the spoken words. |
| 22.6–26.6 | The prompt UI switches to a Square format. Typing continues, and a **camera slow-pans right** following the caret (UI translates x 0 → −35% over 4 s). | Enters with a **horizontal motion-blur whip** (0.2 s). |
| 26.6–27.0 | White flash (UI blows out to #FFFFFF). | On "cinematic zoom". Sparkle SFX. |
| 27.0–28.8 | **AI product render**: orange-juice bottle on an orange #F07A10 → #E86A00 stage. It starts on a macro close-up of the orange slice on the label, then **zooms out** to the full bottle (scale 3→1, 1.5 s `power2.out`). Kinetic title: small white "Watch it appear in" words fade up one per word on slightly different baselines, then **"SECONDS"** (heavy condensed sans, white, ~10% frame height, dark drop shadow 0 8px 16px #00000066) slams in. | "SECONDS": scale 1.4→1 with opacity 0→1 over 0.2 s, colour grey→white, landing on "seconds". Title zone is y 7–20%, above the bottle. |
| 28.8–32.2 | Full screen, no speaker. **AI 3D render**: a translucent blue human figure floating on a soft periwinkle stage (#9DB5F0 → #6E8FE8), a white ring of 6 small icon badges **orbiting its waist**, and a brand badge on its head. Italic text top-left: small "Can be your full-time", big "**Motion Designer**" in navy #1A2A8C, bold italic serif, and small "on demand." | The figure fades up from a blur (0.4 s). The ring orbits continuously (~6 s per turn). Words appear **one per spoken word** (opacity + y 10px, 0.15 s). |
| 32.2–35.9 | **CTA**: flat cyan #35B6FF stage. Purple #7B4FD6 **concentric rings pulse out** from the centre (like a sonar/target). A thin crosshair "+". "Click Link" in white Poppins Light, ~7% frame height. "In Comments" in black Poppins ExtraBold, slides in from the left. A pixel-art hand cursor taps, and a handwritten "comment" appears. | Rings: scale 0→2.5, 0.6 s each, a new ring every ~0.5 s. "Click Link" fades in per word from the right (0.2 s). The hand bobs (y ±8px yoyo, 0.4 s). |

## 2. AI-generated vs template (GSAP) split
**Template-animatable (HTML/CSS + GSAP, rebuild these):** the network diagram, the card collage with long shadows and growing bar chart, the scrolling card feed (lists, article, logo reveal), the stock line draw, icon pops, glass profile cards with blurred blobs (CSS `filter: blur(80px)` circles + `backdrop-filter`), the prompt UI with typewriter, the logo circle assembly, the "SECONDS" kinetic type, the italic word-by-word title, the CTA rings + cursor, light-leak flashes (a radial gradient overlay), and all whips/blurs.
**AI-generated (need a generator):**
- *Speaker plate*: "bright futuristic white-and-cyan sci-fi corridor, glowing ceiling light strips, symmetrical, shallow depth, clean" (image, 16:9, full-frame, static).
- *Satellite map*: "photoreal satellite view of <region>, slow top-down drift, subtle clouds" (image or 3 s video, full-frame). The border trace itself is an SVG path in GSAP.
- *Product hero*: "studio product shot of <product> on a solid <brand colour> background, soft top light, reflection, centred; open on a macro close-up of the label then pull back" (5 s video, 9:16, full-frame). Alternatively, use a still with a GSAP scale 3→1.
- *3D figure*: "translucent glossy blue human figure, arms slightly out, floating, soft periwinkle studio, pale shadow" (image, 9:16). Orbit ring + badges go on top in GSAP.

## 3. Captions
- **Default:** 1–3 words per chunk, hard-cut swaps with no pop and no highlight colour. White Poppins/Montserrat **Bold**, ~48px (2.5% of frame height), sentence case. Each chunk sits on a **tight black box** rgba(0,0,0,0.78) with 8px 14px padding and radius 6px. Centred at **y ≈ 57–60%**, just above the speaker's cap, so it overlaps the bottom of the graphic stage and never sits on the face.
- **Variant in the blue collage scene:** a frosted glass pill (rgba(255,255,255,0.25), 1px white 60% border, radius 14px, backdrop blur 10px) with medium-weight white text, fixed width ~50%. Words **type in** inside it.
- Variant in light scenes: a light-grey glass pill with dark #333 text.
- **No captions in the full-screen AI payoff (27–32 s)**: there, the on-screen words *are* the motion graphic (kinetic type).

## 4. Transitions and camera
- **Whip (vertical or horizontal):** the stage and speaker card move together 40–60% in 0.2–0.25 s with `power4.in`→`power4.out` and a directional blur of 20–40px in the travel direction. Used at 4.0 (horizontal) and 6.5 and 8.6 (vertical).
- **Light-leak flash:** an orange #FF8A3D → peach → white radial overlay sweeping left→right, 0.35–0.45 s, opacity 0→1→0. The speaker tints orange during it. Used at 12.9 and 16.6.
- **White blow-out:** exposure to #FFF in 0.15 s, hold 2 frames, then reveal (26.6).
- Blur dissolve (28.8) and plain 0.3 s crossfade (19.4).
- **Inside-scene camera:** slow push/pan on the UI (22.6–26.6), zoom-out reveal (27.0), with a constant 1–2% drift so nothing is ever dead-still. The speaker card itself never zooms.

## 5. Sound design (measured)
- The voice sits at ~−18 dBFS RMS. A quiet music bed runs under it at ~−38 dBFS (≈20 dB under the voice, ~10% volume), which is audible only in pauses.
- **Sub booms** (<70 Hz) on big scene changes: 0.2 (open), 4.3 (collage lands), 6.3 (whip), **8.7 (strongest, −19 dB)**, 11.4, 12.6, 29.4 (full-screen payoff).
- **Whoosh** air (>6 kHz bursts) on whips and flashes: 6.4, 13.0, 16.6, 19.6, 28.7–29.1 (with a falling pitch sweep).
- **Sparkle/chime** (harmonic lines 5–12 kHz, 0.6 s) exactly on the white flash / product reveal at 26.8.
- SFX are subtle: they are felt more than heard, and there are no pops on every caption.

## 6. Layout rules
- The face is never covered. The face zone is x 30–70%, y 60–75%. Captions stay above it and graphics stay behind or above it.
- Graphic cards keep 6–9% side margins. Titles go in y 5–20%.
- Density: ~3 scenes per 10 s, each with 2–4 animated sub-elements, so something moves on-screen **every ~0.5 s**.
- Background colour changes every scene (sat-map → beige → sky blue → peach → black → cream → charcoal → orange → periwinkle → cyan). The contrast jump itself is the pattern-interrupt.

## 7. Top techniques (ranked) + how to build
1. **Stacked split screen with head pop-out.** The speaker cutout sits over a card plate, the head breaks the card's top edge, and graphics fill the top 70%. *Build:* 3 layers: `.stage` (absolute, top 0, h 72%), `.plate` (rounded div, bottom 0, h 29%, `overflow:hidden`) and `.speaker` (the transparent cutout, *outside* the plate, z-index above the stage). Tween the plate's `inset` on scene change.
2. **Scene swap every 2–3 s with whip transitions.** *Build:* `gsap.timeline()`: `to(stage,{yPercent:-60,filter:'blur(30px)',duration:.12,ease:'power4.in'})`, then swap content, then `fromTo(stage,{yPercent:60},{yPercent:0,filter:'blur(0)',duration:.14,ease:'power4.out'})`. Pair it with a whoosh + sub boom.
3. **UI-mockup typewriter prompt** (the "tell it what you want" moment). *Build:* a DOM card with chips. Reveal the text by character with GSAP `TextPlugin` or a `steps()` width reveal, synced to transcript word times, and add a blinking caret (`opacity` yoyo 0.5 s). Add a slow `x` pan on the parent.
4. **Floating card collage with long 45° hard shadows + growing charts.** *Build:* cards use `box-shadow: 40px 40px 0 rgba(47,111,214,.6)` plus a soft shadow. Stagger `x:120%→0` in from the right. Bars `scaleY 0→1` with `transformOrigin:'bottom'`, stagger 0.05.
5. **Glassmorphism cards over huge blurred colour blobs.** *Build:* 3 absolutely positioned circles (`filter:blur(90px)`, saturated purple/cyan/lime) behind a card with `backdrop-filter:blur(20px)`, a 1px border and a translucent bg. Drift the blobs with `x/y` sine yoyo tweens (3–4 s).
6. **Light-leak / white-flash transitions.** *Build:* a full-frame overlay `radial-gradient(circle at 20% 50%, #FF8A3D, #FFD9B8 40%, #fff 70%)`, `mix-blend-mode:screen`. Sweep it with `xPercent:-100→100` and opacity 0→1→0 over 0.4 s.
7. **Kinetic payoff word ("SECONDS") slam + word-per-word italic title.** *Build:* per-word spans. Small words get `from({opacity:0,y:12,duration:.15})` at their transcript time. The hero word gets `from({scale:1.4,opacity:0,duration:.2,ease:'power4.out'})`, then a 0.1 s colour grey→white and a drop-shadow.
8. **CTA sonar rings + pixel cursor tap.** *Build:* `repeat:-1` ring spawns (`scale 0→2.5`, `opacity 1→0`, 0.6 s, every 0.5 s), text slides from opposite sides, and the cursor has a `y` yoyo and a scale 0.9 "tap" each 0.8 s.
