# Glass / Apple-UI motion templates (reference study)

Sources studied frame by frame (contact sheets and 12–15 fps strips): `glass.mp4` (DaVinci "pop-up message with reflection": finished shot at 0:00–0:08 and 9:50),
`notify3d.mp4` (3D notification: result at 0:00–0:03 and 0:35–0:38), `appleui.mp4` (13 s Apple-style UI logo animation, 60 fps).
All positions are % of a 1080×1920 frame. On a talking head, keep the overlay out of the face box (usually y 18–45%). Use the lower third (y 55–80%) or the top band (y 6–18%).
Colours map to `public/theme.css` tokens where one exists. The hex values here are reference values only.

### glass-float-notif — Liquid-glass floating message
- Use when: the speaker mentions a text, DM, lead, booking or patient message coming in ("I got a message from…", "patients DM me", "my phone blew up").
- Looks like: a wide, almost clear glass pill (≈ 78% w × 7.5% h, radius 999px) floating in space. It sits at x 11%, y 60% on a talking head (in the reference it hovers above the phone it came from).
  - Left: a 128px circular avatar with a 44px app badge (WhatsApp green #25D366) overlapping its bottom-right corner, plus a soft green outer glow (0 0 24px #25D366 at 55%).
  - Text: name on line 1 (600 weight, 44px, #FFFFFF, sentence case, plus an emoji), message on line 2 (400 weight, 40px, #F2F2F7). The text is left-aligned, so the right ~55% of the pill is empty glass.
  - Material: backdrop blur 6–10px only (the reference is nearly clear, so the background stays readable), tint rgba(255,255,255,0.06), and saturate(140%).
  - Rim: a 1.5px border, rgba(255,255,255,0.55) along the top and left edges fading to 0.15 on the bottom and right. Build it with a gradient border via mask-composite, or with an inset box-shadow `inset 1px 1px 0 rgba(255,255,255,.6), inset -1px -1px 0 rgba(255,255,255,.12)`.
  - Inner highlight: a linear-gradient(180deg, rgba(255,255,255,.18) 0%, transparent 40%) on the top half.
  - Shadow: 0 30px 60px rgba(0,0,0,.35).
  - Reflection: a mirrored copy on the surface below (the phone screen in the reference) with a strong green glow cast on that surface. The mirror is flipped vertically, blurred 6–8px, at 35% opacity, and masked to fade out.
- Motion:
  - Enter (≈ 0.35 s): the pill starts inside the source (phone or lower edge) at scale .35, y +18%, rotX 25°, opacity 0. All properties tween together with `expo.out`: it lifts up (y), scales 1.0 and flattens rotX to about −6°. There is no bounce, just a fast launch and a soft landing. The green glow ramps 0→1 over the last 0.15 s, and the reflection fades in at the same moment.
  - Hold: the reference is static. Add a 2–3px sine y-float every 3 s and a very slow specular sweep (see recipe) once, 0.4 s after landing.
  - Exit (≈ 0.3 s, `power3.in`): reverse the enter. It drops back toward its source while scaling to .4, then snaps off. The reflection and glow go out first (0.1 s).
- Sound: a soft two-note "message received" chime or a glassy tick on landing (not a stock iPhone tone). Add a faint airy whoosh under the lift, and a short reverse-whoosh or low "tuck" thump on exit.
- Build notes:
  - Build it as a `div.glass` with `backdrop-filter: blur(8px) saturate(140%)`. Stack the rim, highlight and specular as ::before/::after layers.
  - For 3D, give the parent `perspective: 1400px`, set `transform-style: preserve-3d` on the pill, and animate `rotationX`, `y` and `scale` with GSAP.
  - Reflection: use `-webkit-box-reflect: below 24px linear-gradient(transparent 55%, rgba(0,0,0,.35))`, but it cannot be blurred. The better route is a cloned node wrapped in `scaleY(-1)` + `filter: blur(7px)` + `mask-image: linear-gradient(to top, #000, transparent 70%)`, placed on the "surface" line.
  - On a talking head with no phone, fake the surface: the mirror sits just below the pill and is squashed with `scaleY(-.6)`.
  - Surface glow: a radial-gradient ellipse in #25D366 at 30%, `mix-blend-mode: screen`.
  - Can't do in the browser: tracking the pill onto a moving real phone. The reference used a planar tracker. For our ads, place it on a static locked shot or use it on the talking head without a phone. The avatar photo and app badge are image inputs.

### notify-3d-banner — White banner lying on a surface
- Use when: the speaker describes a notification or alert ("you'll get a reminder", "the booking confirmation comes through").
  - Better on B-roll of a desk or phone than on a face.
- Looks like: an opaque iOS-style white banner (≈ 44% w × 6.5% h, radius 28px, #FFFFFF at 96%). It is rotated about −17° in-plane and tilted about 50° back so it lies in the plane of the tabletop phone and hangs off its top-left corner.
  - Contents: a 72px iMessage-green (#34C759) rounded app icon, the sender in bold (600, 34px, #000000), a one-line message (400, 30px, #3C3C43, ellipsis), and "now" in the top-right corner (400, 22px, #8E8E93).
  - Glow: a soft white glow around it (0 0 40px rgba(255,255,255,.55)). This is the reference's "soft glow" finish and makes it read as emissive in a dark room.
  - Shadow: a faint cast shadow on the surface.
- Motion:
  - Enter (≈ 0.5 s): the banner rises out of the phone surface (translateZ −200 → 0, rotX 90° → 50°) while sliding up-left (x −4%, y −3%), with `back.out(1.4)` so it overshoots slightly past the rest pose and settles.
  - The reference hides the start with a whip-pan transition (motion-blurred camera swing ~0.3 s). Do this as a directional blur on the whole frame.
  - Hold: static. Optionally the glow breathes 0.8 → 1 over 2 s.
  - Exit: the reference cuts on a whip pan. Otherwise reverse the enter (sink back into the phone, 0.3 s `power2.in`).
- Sound: an iPhone-style tri-tone substitute (bright glassy "ding"). Add a fast whoosh on the whip pan.
- Build notes:
  - Build it with `perspective: 900px` and `transform: rotateX(50deg) rotateZ(-17deg)`. Match the angle of the surface in the footage by eye, and store rotX/rotZ/x/y per clip.
  - Glow: `filter: drop-shadow(0 0 30px #fff8)`.
  - Whip-pan: animate a full-frame `filter: blur()` plus translateX on a wrapper holding the video element, or render a pre-made motion-blur transition.
  - Can't do: stick to a moving phone (no tracker). Use it only on locked-off shots or static B-roll.

### profile-card-follow — Profile card with cursor "Follow" click
- Use when: "follow me", "check out my page", "@handle", a social proof number ("200K followers"), or a CTA to DM.
- Looks like: a flat white card (≈ 70% w × 17% h, x 15%, y 46–63%, radius 24px, #FFFFFF, shadow 0 20px 50px rgba(0,0,0,.45)).
  - Top left: a 150px circular avatar.
  - Beside it: the name line (600, 34px, #000) and a bio line (400, 30px, #000).
  - Stats row: three columns, count (500, 34px) over label (400, 28px, #000).
  - Button row: "Follow" (filled #4F5BD5-ish blue, white text, radius 12px), then "Message" and "Email" (1.5px #000 outline), then an add-person icon button.
  - A macOS hand cursor (white with black outline, 64px).
- Motion:
  - Enter (≈ 0.35 s): the card slides in from off-screen right (x +110% → 0) with a heavy horizontal motion blur, landing with a soft ease-out (`expo.out`).
  - The cursor glides in from bottom-right (0.4 s `power2.inOut`) and hovers over Follow. Press: the button scales .94 for 0.08 s, then back.
  - On release the button swaps to "Following ⌄": white fill, 1.5px black outline, black text. The swap is instant, with a small 1.03 pop.
  - Hold ~1 s.
  - Exit (≈ 0.3 s): slides down-left off frame with motion blur, used as the transition into the next shot.
- Sound: a mouse click (two-part tick) on press, a subtle UI "pop" on the state change, and a whoosh on the enter and exit slides.
- Build notes: this is pure HTML/CSS. For motion blur, animate `filter: blur(Xpx)` (x-only is impossible in CSS). Use an SVG `feGaussianBlur stdDeviation="18 0"` filter on the moving card during the slide, and tween the deviation 18 → 0. Numbers can count up (our ads already love counting numbers). Avatar and handle come from the brand kit (`/api/resources/brand`).

### app-icon-expand — Logo icon that unfolds into an app-store card
- Use when: the brand or practice is named for the first time, a logo reveal, "we're the #1 rated…", ratings or reviews.
- Looks like: pure black or heavily dimmed background.
  - The icon: a white rounded-square app icon (≈ 11% w, radius 22%) with the logo mark in #1C1C1E and a strong soft white bloom (0 0 60px rgba(255,255,255,.5)).
  - The card: it becomes a dark glass card (≈ 76% w × 12% h, radius 48px) filled rgba(44,44,46,.72) with a 1px rgba(255,255,255,.12) border.
  - Card contents: the icon at left (≈ 17% w, still glowing); a title (700, 46px, #FFFFFF, e.g. brand name); a subtitle (300, 40px, #EBEBF5 at 80%); five stars (#FF9F0A, 34px, the last one partial); "(4.5) 1.3k Rating" (400, 30px, #EBEBF5 at 60%); and a pill button at the right ("chat", #0A84FF text on rgba(10,132,255,.25), radius 999px, with a blue glow on the text).
- Motion:
  - Enter icon (0–0.45 s): it flies in from the top-left corner along a curved path, scale .2 → 1, with motion blur, and settles at the centre with `expo.out`. It idles 0.8 s.
  - Unfold (≈ 1.0 s): a dark pill grows out of the icon (width 11% → 76%, `power3.inOut`).
    - Meanwhile the whole card makes a loose 3D wobble: rotZ −8° → +6° → 0, rotY ±20°, like a lid being flipped.
    - The icon does a 360° rotY flip while it travels to the left edge.
  - Contents cascade in (0.08 s stagger): the title fades and slides up 10px (0.3 s); the subtitle reveals as if typed or with a left-to-right mask; the stars pop in one by one (scale 0 → 1.2 → 1, 0.06 s apart); the rating text fades in; the button fills in last.
  - Hold: a subtle bloom flicker on the icon.
  - Exit (the intro reversed): the card contents clear right-to-left and the pill collapses back into the icon, which travels to the right edge. The icon holds 1 s and shrinks to a point (scale 1 → 0, 0.3 s `power2.in`) that blinks out.
- Sound: a soft "whoosh-in" on the fly-in, a low glassy "shimmer/expand" swell under the unfold, 5 tiny ticks for the stars, and a bubbly tap on the button. Close with a reverse-whoosh and a tiny "blip" on the shrink-to-dot.
- Build notes: all HTML/CSS/GSAP.
  - Width tween: use a `clip-path: inset(0 X 0 0 round 48px)` reveal, or animate `width` on an absolutely positioned pill.
  - Wobble: a parent with `perspective: 1200px` + `rotationY/rotationZ` keyframes. Icon flip: `rotationY: 360`, with `backface-visibility` handled by keeping one face.
  - Bloom: layered `box-shadow` plus a blurred white duplicate behind the icon.
  - For a talking head, run it on a darkened, blurred freeze-frame or over the top band (y 6–18%) with the card at 60% scale.
  - Logo and rating numbers come from the brand kit.

### service-stack — Glass list rows with 3D objects popping out
- Use when: the speaker lists services or benefits or steps ("we do X, Y and Z", "three things…", "here's what's included"). The rows double as a checklist, which the user loves.
- Looks like: the app-icon-expand card moves to the top (y 8%) and 4 rows stack below it.
  - Row size and spacing: ≈ 70% w × 10% h, x 16%, gap 3.5% h, radius 44px.
  - Row fill: dark glass rgba(44,44,46,.55), 1px rgba(255,255,255,.14) border, backdrop blur 20px.
  - Inside each row:
    - An inner media strip: a rounded 60% w thumbnail/video loop at 70% opacity behind the title.
    - The title: 700, 56px, #FFFFFF, with a white glow `0 0 18px rgba(255,255,255,.6)`.
    - The caption: 400, 28px, #1C1C1E on a pale pill rgba(255,255,255,.75).
    - A right-hand "collect" text button: #0A84FF with a blue glow.
  - A 3D object breaks the row's left edge (≈ 20% w, overflowing ~40% outside the row): e.g. a laptop, colour wheel, glossy red sphere, or headphones. For our niche: spine model, stethoscope, dumbbell, calendar.
- Motion:
  - Header lift (0.4 s `power3.inOut`): y centre → 8%.
  - Rows enter one at a time, 0.35 s apart. Each rises from y +6% as a small pill (scale .6, opacity 0) and expands to full size (`back.out(1.3)`, 0.45 s).
  - The row's object pops in 0.1 s later: scale 0 → 1.15 → 1, with a slight rotZ −15° → 0.
  - The title types or wipes in, and the caption pill fades in last.
  - Hold: the stack breathes (y ±4px, 3 s sine), the objects bob ±6px out of phase, and the media strips keep playing.
  - Exit: the rows collapse upward into the header one at a time, last row first, 0.12 s stagger. Each scales to .6 and fades while moving to the header's y (motion blur).
  - As each row is "absorbed", the header flashes a colour (see glow-tint-pulse).
- Sound: a rising "pluck" or bubble pop per row (pitch up each step, like a checklist tick) and a tiny sparkle when each object lands. Use a soft swoosh-up per absorbed row on exit.
- Build notes:
  - Rows are HTML with `backdrop-filter`. The objects must be transparent PNG/WebP renders, and they are the one thing CSS can't make.
  - Generate each object with an AI image model: "single glossy 3D render of a [object], studio lighting, soft rim light, isolated on transparent background, 3/4 view".
  - Then remove the background (media-use `remove-background`). Use `filter: drop-shadow(0 12px 20px #0008)` for grounding.
  - Media strips are short muted loops from the clip or the brand kit.

### glow-tint-pulse — Card flashes a neon colour with a room-wide glow
- Use when: a hard emphasis beat inside a list or card sequence ("the biggest one…", a price or result, a warning). It is also the exit accent for service-stack.
- Looks like: the whole card body floods with a saturated colour and throws a big coloured glow across the black background (the full frame gets a coloured vignette).
  - The reference sequence runs red #FF3B30 → amber #FF9F0A/yellow #FFD60A → green #30D158 → magenta #FF2D95. The magenta flash also has a bright green blob sweeping across the card, like a lava-lamp highlight.
  - The text stays white and the button stays blue.
- Motion:
  - Each flash lasts ≈ 0.25 s in and 0.35 s out. The card simultaneously tilts (rotZ ±6°, rotX 10°), scales 1.06 and then returns.
  - Colour changes cut on the beat. Use `steps` or 1–2-frame crossfades, not a slow blend.
  - The frame glow (radial gradient) lags the card by 2 frames.
- Sound: synth "stab" or bass hit per flash, pitched per colour; or the music's snare. Keep SFX sparse.
- Build notes:
  - Stack a colour layer over the card: `background: color-mix(in srgb, var(--flash) 85%, transparent)` with `mix-blend-mode: screen`.
  - Add a full-frame `radial-gradient(circle at card-centre, var(--flash) 0%, transparent 60%)` at 45% opacity.
  - Moving blob: an absolutely positioned blurred (40px) circle animated across the card, with `overflow: hidden` on the card.
  - Pulling the brand colour from the theme keeps it on-brand. Use one flash per ad, not four.

## Liquid glass: can we build it?
**Yes: about 85% of the look in the browser, with two conditions.** The reference "liquid glass" is mostly a clear pill with a bright uneven rim, a soft inner highlight, a glowing avatar and a mirror reflection. It is not heavy frosting, and every part of that is CSS.

Conditions:
1. `backdrop-filter` only blurs what is *in the same page beneath it*. The talking-head `<video>` must be rendered inside the HyperFrames composition under the overlay. It must not be composited later with ffmpeg over a transparent overlay render, or the glass turns into a flat grey box. If overlays are rendered alpha-only, fake the blur by placing a second copy of the video inside the pill: `filter: blur(8px)` + `clip-path` matching the pill, positioned identically.
2. True refraction (edges bending the picture behind, Apple's 2025 "Liquid Glass") needs `backdrop-filter: url(#lens)` with an SVG `feDisplacementMap`. This works in Chromium only (fine for our renderer). Test that the headless render honours it, and fall back to plain blur if not.

Recipe, layer by layer:
1. `.glass` element:
   - `border-radius: 999px; background: rgba(255,255,255,.06); backdrop-filter: blur(8px) saturate(140%) brightness(1.05);`
   - `box-shadow: 0 30px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(255,255,255,.1);`
2. Rim: ::before with `padding: 1.5px`, `background: linear-gradient(135deg, rgba(255,255,255,.8), rgba(255,255,255,.08) 40%, rgba(255,255,255,.35) 100%)`, masked to border-only with `mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude`. The uneven brightness is what sells "glass".
3. Inner highlight: ::after with `linear-gradient(180deg, rgba(255,255,255,.22), transparent 45%)` over the top half, border-radius inherited.
4. Specular sweep: a child `span` 30% wide with a skewX(−20deg) gradient `transparent → rgba(255,255,255,.35) → transparent` and `mix-blend-mode: overlay`. GSAP moves it from x −120% → 220% over 0.9 s `power2.inOut`, once after landing.
5. Refraction (optional): an SVG filter with `feTurbulence baseFrequency=.008` (or a baked radial displacement map PNG with a stronger bend at the edges) → `feDisplacementMap scale=30`, applied as `backdrop-filter: url(#lens) blur(6px)`.
6. Content glow: the avatar gets `box-shadow: 0 0 24px var(--app-colour)`, and the text gets a faint `text-shadow: 0 1px 2px rgba(0,0,0,.3)` for legibility on busy footage.
7. Reflection: a cloned node, `transform: scaleY(-1)`, `filter: blur(7px)`, opacity .3, `mask-image: linear-gradient(to top, #000 0%, transparent 65%)`, placed under the pill. A matching colour pool (radial-gradient, screen blend) sits on the "surface".
8. Motion: the enter/exit from glass-float-notif, under `perspective: 1400px` so rotX reads as depth.

What the browser can't do, and what to supply instead:
- Planar tracking onto a moving real phone, and physically correct light bouncing off a real surface. Use locked shots, or have an AI video model generate a B-roll plate (e.g. "phone lying on a dark wood desk, shallow depth of field, static camera") and float the glass over it.
- 3D objects (service-stack) need AI-generated transparent renders.
- The avatar photo and brand icon come from the brand kit.
