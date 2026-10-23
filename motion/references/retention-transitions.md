# Retention, transitions, graphs and voice FX: notes from 3 reference videos
Sources (in scratch refs/): **hooked** = "4 CapCut Animations That Look Like After Effects" (5:47, 16:9 tutorial);
**transitions** = "Think Of Growing Your Brand" (34 s, 9:16, motion graphics only); **beforeafter** = agency
before/after reel (72 s, 9:16, Hindi talking heads). The beforeafter "after" panel sits at x 312–676, y 334–996 of 720×1280.
The timestamps below are from those files. All % values are of the 1080×1920 frame.

## 1. Template specs

### ba-stat-counter-badge: Year + people + number badge
- Use when: a number is tied to a year or a growth claim ("2020… 20 million users", "by 2030…").
- Looks like: bg #FFF6F6 with a faint doodle pattern; a huge salmon year (#F48A92, heavy sans, ~22% w, top 18%); a dark globe/earth photo tinted pink filling the bottom 55%; 3 white circle-head people icons (center, y 52%); a glossy red rounded badge (#FC5065, radius 24, 40% w) with white "20 / million" (Poppins ExtraBold, number 2× the label).
- Motion: bg crossfades in with blur 0.3 s → icons pop in one at a time (scale 0→1.1→1, 0.15 s each, back.out) → badge grows from a thin line (scaleY 0.05→1, 0.3 s) → number blur-in (8px→0). **Year change** = vertical odometer roll with motion blur (2020→2023→2024→2025 over 0.6 s, power3.inOut) while the number gets blurred out and the badge empties and refills with a new value ("85+ million"). A small flag/icon can fade into the people.
- Sound: soft pop per icon, a riser on the odometer roll, a "ding" when the new number lands.
- Build notes: pure HTML/CSS + GSAP; the year is a clipped column of numbers translated in Y. The globe image needs an AI or stock image with a pink duotone CSS filter.

### ba-percent-circle: Big glossy stat circle that morphs
- Use when: a single striking % or count ("293%", "82 million").
- Looks like: red sphere (#F94A5E→#FC5065 radial gradient, top-left highlight, soft drop shadow), 70% w, centered; white number (~18% w) plus a small label under it.
- Motion: enters as a **pie wedge sweeping clockwise** over the previous shot (0.4 s) that becomes a full circle while the video fades to white. Text is written in with a left→right soft mask (0.3 s). **Next stat**: the old text fades to 0 in 0.15 s, the empty circle holds for 2 frames, the new number scales 1.15→1 and the circle grows 5%.
- Sound: whoosh on the sweep, a tick or pop on each number swap.
- Build notes: SVG circle + conic-gradient mask for the sweep; GSAP timeline.

### ba-pie-reveal: Pie slice with an image in the wedge
- Use when: "X% of <group>" ("44% unemployed youth").
- Looks like: the stat circle zooms up to 160% (it bleeds off the frame); a light wedge (#FF8789) against the dark red (#FC4B5F); a photo of the group masked inside the wedge; "44%" white bold plus a small label.
- Motion: circle scales 1→1.6 and x+20% (0.4 s, power2.inOut) while a straight divider rotates open to form the wedge (0.3 s). The photo rises 10% into the wedge. Exit: push in until the pale wedge fills the frame (0.3 s), then flat salmon → cut.
- Sound: whoosh on the zoom, a thump when the slice opens.
- Build notes: SVG path with the arc angle driven by GSAP; the photo is clipPath'd to the wedge. The crowd image comes from AI or stock.

### ba-trend-line: Neon trend line drawn over the speaker
- Use when: "growing fast", "going up", "doubled".
- Looks like: the speaker stays full-frame; a red neon zig-zag line (#FF3355, 10px, glow blur 20px) rises from bottom-left to top-right across the chest; caption "this market / **growing fast**" in white with a small line above it.
- Motion: stroke-dashoffset draw over 1.8 s (linear with slight steps), then the tip overshoots off-frame. Exit: white flash-dissolve to the next graphic (0.3 s).
- Sound: rising synth or riser under the draw, a click on each vertex (optional).
- Build notes: SVG polyline + dash animation + CSS drop-shadow glow.

### ba-swipe-cards: Profile cards swiping with a full-frame tint
- Use when: choosing, rejecting, "left or right", comparing options.
- Looks like: a small profile card (22% w, bottom-right, rounded 16, name/age/job) over the speaker. A left swipe washes the frame **red** (#E86A6A at 35%); a right swipe washes it **green** (#3FBF6A at 35%).
- Motion: the card slides out sideways with rotate ±15° and a blur (0.2 s) while the next card slides in. The tint fades in with the swipe (0.15 s), holds 0.4 s and fades out.
- Sound: a swipe/whoosh per card, then an error buzz (red) or a success ding (green).

### ba-silhouette-rise: Mood cut-out behind the lower third
- Use when: emotional words ("lonely", "alone", "stuck").
- Looks like: a black silhouette (a person on a bench plus a fence) in the bottom 30%, in front of the speaker's body; a white bold italic caption on top.
- Motion: the silhouette rises from y+100% (0.35 s, power3.out), then the fence slides in.
- Build notes: needs an AI-generated silhouette PNG; the rest is CSS.

### ba-keyword-glow: Small caption + giant glowing keyword
- Use when: the emotional or key word of a line ("pyaar", "automated", "badega", "trap", "save").
- Looks like: context words in white Poppins SemiBold (~5% h) at y 62%; the keyword underneath or inline at 2–3× size, in pink-red (#FF5A6E), with an outer glow (0 0 30px #FF3355) and a slight blur bloom. It sits in front of the body and behind nothing.
- Motion: context words appear word-by-word (hard in, 0 ms). The keyword blurs in (12px→0, scale 1.2→1, 0.2 s), holds, and fades with the caption line.
- Sound: nothing extra (the voice carries it), or a subtle sub hit on the biggest keyword.

### ba-image-card-inset: Full-bleed colour → rounded card
- Use when: introducing a group or topic ("unemployed youth").
- Looks like: the frame becomes a solid #F2475C with people rising from the bottom; it then shrinks into a rounded card (78% w, radius 28) on white with a white label at the top.
- Motion: the red block slides up (0.2 s), the crowd rises (0.3 s), then the whole thing scales 1→0.8 with the radius animating 0→28 (0.3 s, power2.out) and the label types in.

### ba-censor-split: Two-panel scam/warning
- Use when: risk, scam, fraud, danger.
- Looks like: 2 stacked dark photos (a man and a woman on phones) in a rounded card; red censor bars (#FF6B6B) over the eyes; a red ⚠ "SCAM" stamp top-left; small red label pills ("Scam", "Fraud").
- Motion: zoomed in at 130% for 0.2 s, pulls out to the card (0.3 s); the bars slide in from the sides; the labels pop.
- Sound: an alert beep or glitch on the ⚠.

### ba-engage-phone: Hand holding a phone with a like / comment / message CTA
- Use when: the CTA "like, comment, message".
- Looks like: a black-and-white cut-out hand holding a phone diagonally on white; red heart notification bubbles; red pills "comment", "message" appearing one per word.
- Motion: the phone slides in from the right with rotation; each pill pops in (back.out) in sync with its word.
- Build notes: needs an AI cut-out hand+phone PNG.

### ba-particle-logo-outro: Video dissolves into a particle logo
- Use when: the last 2 s / end card.
- Motion (66.9–69.2): cyan/white particles fly across the talking head (0.6 s) → the frame goes dark → particles stream into the logo shape (0.8 s) → the solid logo, wordmark and CTA line settle (0.4 s).
- Sound: the voice is swept to underwater and faded (see VFX-2), then a chime/logo sting (clean tones at ~1.5, 3.2, 4.8, 6.3 kHz).
- Build notes: canvas particle system with target points sampled from the logo alpha; seed it for determinism.

### tr-counter-cardstack: Fast counter over a card stack
- Use when: growth numbers, followers, "k".
- Looks like: a huge light-blue (#8AE6FE→#1AA0EF) italic "6.4k" at the top 20% with a ghost blur trail; a 3D emoji avatar + "Think of growing **Business** & **Brand**" (the key nouns in #1AA0EF); 3 portrait cards (rounded 12, shadow) in a row.
- Motion: the count runs 0.1k→6.7k over 2.2 s (linear, 1 decimal) while the cards stagger in (0.1 s each). Exit: cards tilt and scatter with motion blur (0.15 s).
- Sound: rapid ticking during the count, a whoosh on the scatter.

### tr-iris-bar: Circle iris → rising bar chart
- Use when: moving from a problem to a comparison ("always one step ahead").
- Motion: the whole scene collapses into a blue dot (#1AA0EF) with a dashed orbit ring (0.3 s). The dot shrinks, turns into a 🤔 emoji, and a rounded blue bar (gradient #1AA0EF→#0B3C6E) grows up out of it (0.5 s, expo.out). A label ("Ahead") drops in above the bar with 3 avatar heads, and a ghost "step 1" outline appears behind.
- Sound: whoosh-in, then a rising "bloop" as the bar grows.

### tr-glow-word: Soft bloom word that floats away
- Use when: reassurance lines ("Don't worry").
- Looks like: pink-magenta text (#E040FB) with a big blurred glow on white.
- Motion: blur in, hold 0.8 s, then the word shrinks, rotates about 10° and fades (0.4 s).

### tr-pill-slide: Logo pill with motion blur and a heavy shadow
- Use when: a brand or name reveal.
- Motion: the logo icon flies in rotated (0.1 s) and a pill expands out of it to the right (0.3 s, back.out(1.4)) with a big soft shadow (0 40px 80px rgba(0,0,0,.35)); the text wipes in left→right.
- Sound: whoosh plus a soft "pop" or ding on settle.

### tr-whip / tr-block-wipe / tr-phone-dive: The core transitions (use one on every scene change)
- **Whip pan**: the outgoing scene moves x −60% with a 40px horizontal blur over 0.12 s; the incoming scene comes from +60% (0.15 s, power4.out). Whoosh sound.
- **Colour block wipe**: a solid #8AE6FE block slides up from the bottom and covers the frame (0.25 s). The next scene is revealed through blur 20px→0 with the scale settling 1.1→1. Swoosh sound.
- **Phone dive**: a phone top (dynamic island, purple gradient #7B2FF7→#E040FB) rises from the bottom and fills the frame. The camera pushes through the screen and the new UI starts inside it (0.4 s). Sub whoosh.
- **Zoom-blur punch (hooked 9.25–9.4)**: scale 1→1.4 with a radial blur on the speaker over 4 frames, then cut to the graphic. Sub boom.
- **Film-burn flash (hooked 12.17–12.4)**: orange/white light-leak burns over 3 frames to full white, then the next graphic is revealed. Big sub boom (the loudest low end in the video).

### tr-ui-scenes: UI mock beats
- **scan-line phone**: a glowing blue horizontal bar (#1E90FF, blur 30px) sweeps down over a phone video (0.8 s) and "analyzes" it.
- **map-radar**: a light map; a blue location dot with a radar cone; avatars pop onto the map (staggered 0.08 s); a label "your Audience".
- **orbit ring**: concentric white rings with avatars orbiting (rotation 20°/s) and a center label.
- **notification stack**: payment/DM notification cards drop and stack (y −40 → 0, 0.12 s stagger). Ding per card.
- **3D card fan**: cards flip and fan out in perspective (rotateY 30°), and one card flies at the camera.
- Build notes: all CSS 3D + GSAP. Faces and photos come from AI images; the map from a static tile screenshot.

### hk-loading-bar: Glowing progress bar + %
- Looks like: a glass panel (#2A2A3A, radius 14) with a bar track in grey (#D0D0D0) and a fill in #07A2FF; "80%" small white above-right; outer glow.
- Motion: the panel enters in 3D (rotateX 40°→0, 0.4 s); the fill runs 0→80% with an ease that starts fast and ends slow (power3.out, 1.2 s); the % counter is synced to the fill; a white shine sweeps across once.
- Sound: a rising tick or whoosh, then a "ding" at the end.

### hk-ui-pop: "Comment" input pill
- Looks like: a rounded pill (#6F83A3→#3B4A6B gradient, 2px white stroke); a round avatar on the left; "Comment" text; a cyan circular arrow button (#1EB4F5) on the right.
- Motion: pops from scale 0.6 → 1.05 → 1 (0.3 s), the text types in character by character, the button pulses once.

### hk-ui-rect: Card with a rotating light stroke
- Looks like: a dark purple glass rectangle (#1A0B2E→#2C1450) with a 2px white stroke whose bright segment travels around the border.
- Motion: conic-gradient border that rotates continuously (~2 turns/s at "rotation 700"); the card fades or scales in.

### hk-countdown-ring: Clock-wipe countdown
- Looks like: a thick ring (#00BBFF over a light-blue track #7FD8FF); a big digit plus "SECONDS" (Orbitron-style); a glow.
- Motion: the ring clock-wipes over the full duration; the digit hard-cuts every 1 s (5→1).
- Sound: a tick per second, a hit on 0.

### hk-kinetic-words: One word per screen, and the intro title card
- Looks like: dark radial purple bg (#0E0220 centre → #090014 edges); one white word, centred (Poppins SemiBold, 4% h); a pixel font for "level 1"; a big wide heavy gradient title ("After Effects", #6A6CD4→#B39DFF) with floating tilted app icons and a ghost copy of the title behind.
- Motion: every word hard-cuts in on its syllable (0.2–0.6 s per word); the milestone word scales from small to huge. UI elements (bar, badge "$1,000,000", ring, pill) **float around the speaker's head** in the intro, each with a small drift.

## 2. Voice effect specs (ffmpeg)
**VFX-1 underwater hit** (beforeafter 53.50–55.40 s, the reveal line "…it's all automated")
- Measured vs normal speech, dB: <120 Hz **+19** (boom plus bass), 250 Hz +4, 600 −4, 1.2k −5, 2.4k −8, 4.8k −9, >8 kHz **−19**.
- Visual at the same time: a hard cut to a 125% punch-in (53.5), then at 54.2 a fast zoom-out with blur while a robot/AI image ghosts over the speaker and the keyword "automated" glows red. A hard cut back to the normal frame at 55.3.
- Entry/exit: hard in on the visual cut, with a sub-boom/impact SFX landing exactly on it; hard out on the next cut (use 20 ms ramps only to avoid clicks).
- Matched chain: `highshelf=f=1500:g=-8,lowpass=f=6500:p=2,bass=g=8:f=110:w=0.7,aecho=0.8:0.5:35:0.2,volume=1dB`
- "Classic underwater" (stronger, for our library): `lowpass=f=900,lowpass=f=900,bass=g=6:f=120,aecho=0.8:0.6:60|110:0.3|0.2,chorus=0.6:0.9:40:0.3:0.25:2,volume=2dB`
- Time-gating: `[0:a]asplit[d][w];[w]CHAIN,volume='clip((t-53.5)/0.02,0,1)*clip((55.4-t)/0.02,0,1)':eval=frame[wet];[d]volume='1-clip((t-53.5)/0.02,0,1)*clip((55.4-t)/0.02,0,1)':eval=frame[dry];[dry][wet]amix=inputs=2:normalize=0`

**VFX-2 underwater sweep-out** (beforeafter 67.0–68.9 s, under the particle dissolve)
- Measured per 0.4–0.5 s window: the 1.2 kHz band goes −33 → −37 → −47 → −57 dB and >8 kHz goes −52 → −49 → −70 → −84 dB. The cutoff falls while the level fades.
- Chain: `asendcmd=c='67.0 lowpass f 5000;67.5 lowpass f 2000;67.9 lowpass f 900;68.4 lowpass f 400',lowpass=f=8000,afade=t=out:st=67.0:d=1.9:curve=qsin`, then a hard cut to the logo chime at 69.1.

**VFX-3 soft muffle** (optional; beforeafter 5.9–6.8 on "lonely"): about −8 dB at 1.2 kHz and −6 dB at 4.8 kHz. Chain: `highshelf=f=1000:g=-7`. This one is subtle and could just be the speaker's voice.

*hooked* has **no sustained voice filter** (no muffled stretch over 0.2 s). Its "voice effects" come from SFX stacked on the voice: a sub-boom on big cuts (loudest at 12.0 s), whooshes on every graphic, and high "ding/sparkle" tones (7–8 kHz) when UI lands. The music is a quiet synth pad about 10–15 dB under the voice.

## 3. Retention playbook
1. **Something changes every 1–1.5 s** in shorts (beforeafter: about 50 visual beats in 70 s; transitions: a new scene every 2–3 s with constant motion inside each). In long-form, change every 2–4 s (a screen zoom or pan, a pop-up, a label).
2. **Never hold a static frame**: every scene has inner motion (counter running, line drawing, orbit, float, slow push-in 100→104%).
3. **Every number becomes a graphic**: year → odometer roll, value → badge/circle, % → pie, "growing" → trend line. Numbers animate (count or roll); they never just appear.
4. **Cut on the word**: word-by-word captions with hard-in text; one keyword per line gets 2–3× size + glow in the accent colour.
5. **Alternate speaker and full-screen graphic** at a ratio of about 50/50 in shorts. Graphic beats last 1.5–4 s, then back to the face.
6. **Zoom pattern**: punch-in 115–125% on emphasis (hard cut); zoom-blur punch or fast zoom-out as a transition; never two punch-ins in a row without a graphic between them.
7. **Sound on every change**: whoosh on transitions, pop on element entry, tick on counters, ding on landing or confirmation, sub-boom on the 2–3 biggest moments only.
8. **Voice FX as punctuation**: one underwater hit per short, on the reveal line, synced to a hard visual cut and a boom; one underwater sweep-out under the end card.
9. **Music**: a constant bed about 12–15 dB under the voice (a heavier beat in pure-motion ads). Drop the music out for 0.2–0.4 s right before a key line and slam it back on the cut.
10. **Transition vocabulary**: one per scene change, rotating whip → block wipe → iris/morph → phone dive → flash. Motion blur on everything that moves fast.
11. **Hook**: in the first 3 s, floating UI around the head plus a bold title card with the promise; by 12 s at least 5 distinct visuals have appeared.
12. **Chapter reset** (long-form): a "level complete" kinetic-word sequence on a dark bg, one word per 0.2–0.6 s, to re-hook between sections.
13. **Palette discipline**: each video uses one accent (beforeafter red #FC5065 on #FFF6F6; transitions blue #1AA0EF + magenta; hooked cyan #00BBFF on purple #0E0220). All graphics share it.
