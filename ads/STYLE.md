# Ads Editor style spec (reference: "Atlas" problem-aware ad, 3-1.mp4)

Studied 2026-09-23: finished ad `~/Desktop/3/3-1.mp4` (28.4 s, 1080x1920, 30 fps) against the raw file
`ATLAS ADS/PROBLEM AWARE/C6863.MP4` (43.5 s, 4K 16:9, 10-bit 4:2:2, flat log profile).
It is the **same performance, but a different camera**. The finished ad uses a second, closer, low, wide-lens
angle, so it is not a crop of C6863. The gestures match word for word. Use these instructions for any
talking-head direct-response ad in this style.

The overall feel is clean and premium, with very little on screen. The words and the speaker carry the ad. Graphics appear
only when a **brand/product is named**, and each graphic is big and bold.

## Cuts
- **Tighten the speech first.** Start on the first word of the good take at frame 0. Cut the earlier false start, the
  "okay, ready?" slate, a flubbed word ("spitting, spitting"), and a repeated phrase in the CTA ("click below, click the link
  below" becomes "click below"). Keep the script order exactly.
- **Pauses:** trim gaps between sentences to about 0.15–0.35 s. The longest pause left in the ad is about 0.35 s. Remove
  mid-sentence hesitations over about 0.15 s. The raw take had 0.3–0.5 s hesitations and a 1.5 s flub, and 43.5 s became 28.4 s (65 %).
- **Jump cuts in one continuous angle.** There are about 13 cuts in 28.4 s: 0.33, 1.83, 3.0, 5.0, 6.9, 7.27, 10.93, 13.13, 16.3,
  18.83, 21.4, 22.07, 24.57, 26.03, 27.3. That is **about 0.5 cuts/s, with an average shot of about 2.1 s** (range 0.4–3.7 s).
  Cuts land at sentence and clause boundaries, never mid-word.
- **Punch-in / punch-out:** framing changes scale between shots. It alternates between **wide** (head/cap width ≈ 20 % of
  frame, knees and ceiling visible) and **tight** (head ≈ 28–30 % of frame, cropped at mid-chest). That is about 1.35–1.5x. Tight
  shots sit on the value/offer lines (≈ 20–24.5 s, "extra $50k–$100k a month"). Wide shots sit on big-gesture lines (hands-up
  "ten fingers" moments at about 8.5–10 s and 17.5–19.5 s). Most cuts also change scale by 1.1–1.2x, so no two
  adjacent shots are the same size. There is no slow Ken-Burns drift inside shots; the scale changes only at cuts and in the logo transitions.
- No B-roll, no screen recordings, no stock footage in this style.

## Motion graphics (brand-mention logos only; about 1 every 6–9 s, 3 in total)
Rule: **when the speaker names a brand or product, its logo appears huge, at the same moment as the word.**
- **Competitor logos placed behind the speaker** (the speaker is cut out, so the logo sits between the wall and the person):
  - 6.0–6.9 s, on "Claude": an orange starburst (≈ `#FC6B00`) fills about 120 % of the frame width, centred behind the head.
    **Entrance:** spins in about 30°, zooms from about 130 % to 100 %, and starts with heavy radial motion blur over 0.1–0.15 s.
    There is a soft orange glow (about 40 px feather) where it meets the speaker's outline.
  - 6.9–8.0 s, on "ChatGPT": a giant dark knot/hexagon outline logo (≈ `#1E1E1E`, about 85 % opacity, soft gradient fades on
    the strokes), about 200 % of the frame width, so only arcs are visible. **Entrance:** a whip/zoom from the
    previous logo (0.1 s blur transition), with a punch-in on the speaker at 7.27. The logo drifts slowly (about 5 %) and dissolves out with blur.
  - Each competitor logo stays on screen about 0.9–1.1 s, and the two logos play back to back.
- **Product logo above the speaker's head** (15.4–20.3 s, on "It's called Atlas"):
  - Icon: flat orange `#F85B00` mark, centred at x = 50 %. It spans y ≈ 4–31 % and is about 47 % of the frame width. The
    wordmark "ATLAS" sits below it: black `#111`, heavy geometric sans (Montserrat/Gilroy ExtraBold style), all caps,
    about 45 % wide, y ≈ 33–40 %. It sits in the ceiling headroom, **over** the background and not over the face.
  - **Entrance:** the icon launches from the speaker's chest (y ≈ 60 %) and flies up to its resting spot in 0.2–0.3 s
    with vertical motion blur and a slight scale-up. It settles by 15.6 s. The wordmark follows 0.4 s later (16.0 s) with a **horizontal
    motion-blur-in** (starts about 30 px blurred and sharpens over 0.15 s).
  - **Hold** for about 4.3 s. It survives jump cuts, and the wordmark does a quick blur pulse on a cut (about 17.5 s).
  - **Exit** (19.7–20.4 s): the wordmark blurs out. The icon changes colour from orange to yellow `#FFD400` while it
    melts and blurs into a soft yellow square, then vanishes in about 0.6 s.
- **Super minimal (the creator's rule):** no titles, headlines, text cards, badges, glowing words, emojis, arrows or
  stickers — ever. Logos are the only graphics, always transparent (no boxes behind them), always animated in and out.
  Competitors named together get one moment side by side with a fat red X slamming across them.
- **Exception the creator loves: number moments.** A key number (trial length, price, money made) gets a big card that
  pops in on the word, counts up to the number and pops out, with a bass hit. Only the 1–3 strongest numbers.
- **And checklist moments.** When the speaker runs through what you get, the items tick in one by one (pop per tick).
  No card: a hand-written kicker ("What you get") with a brush underline and sparks, then bold italic caps lines with a
  glowing tick circle each and ONE key word per line in the brand accent with its own brush underline (mark it with
  *stars*, usually "free"). 2–4 items, at most one or two per ad.

## Captions
- **None.** If the creator turns captions on, keep them plain: no cursive/italic serif emphasis. There are no burned-in captions or keyword pop-ups in this style. Captions are **off by default** for this
  preset (platform auto-captions cover accessibility). If the user turns captions on, use the house caption style and keep
  them clear of the top 40 %, which is reserved for logos.

## Sound effects (subtle, sit under the voice)
- 1.9 s: a **low sub-boom/impact** (broadband, mostly under 150 Hz, about 0.15 s) on the first big claim word ("hire AI agents").
  Level about −6 dB under the voice.
- 4.7 s: a **bright chime/ding** (tonal partials at about 2.2, 3.2, 6, 7.7 and 11 kHz, about 0.5 s decay) at the end of the first sentence.
  Level about −15 dB under the voice.
- 6.0 s and 6.9 s: a very quiet swoosh on each competitor-logo entrance (barely audible, about −20 dB).
- 13.9–15.4 s: a **riser** (noise and low rumble that swells up, about 1.5 s) building into the product name.
- 15.7 s: a **hit/impact** (full-band transient, about 0.3 s tail) as the product logo lands.
- 19.6–20.0 s: a **high sparkle/shimmer** (about 11 kHz tone) on the logo's colour-melt exit.
- Rule: one SFX per graphic event, plus one hook impact and one end-of-sentence ding. No SFX on ordinary jump cuts.

## Music
- **Music bed ON** (the creator's call, overriding the reference): a low instrumental under the voice at the house level
  that builds anticipation, with risers swelling into every reveal (product logo, numbers, checklist).
- Loudness: normalise the mix to −14 LUFS and keep the SFX levels relative to the voice.

## Grade & framing
- The raw file is flat log: luma roughly 94–140 of 255, saturation near zero. Finished grade: normal Rec.709 contrast (luma about 85–187),
  deep but not crushed blacks (the cap is about `#151515`), a **warm cream wall** (`#B3A69C`, `#A4988D`), slightly **cool shadows**
  (`#61636B`), rich warm skin, and moderate saturation (not punchy). Highlights roll off softly (window glare and white jacket are not clipped),
  and practical lamps stay amber. The look is a clean, slightly filmic teal/orange-lite.
- Framing is 9:16. The speaker is horizontally centred (x = 50 %). There is **generous headroom**: the top of the head sits at y ≈ 40–45 % in wide
  shots and about 33 % in tight shots, and the eyes are at about 50–55 %. The headroom is deliberate, so the product logo has a place to sit.
  If you have only a 16:9 source, crop a 9:16 window (full height, 1215 px of 3840) centred on the face, and create the
  wide/tight shots with scale 1.0–1.5x on top of that crop.

## Hook (0–3 s)
- Frame 0 is the first spoken word of the bold "for the first time ever" claim. There is no title card, text hook or logo.
- The speed comes from the cuts: 3 jump cuts in the first 3 s (0.33, 1.83, 3.0), each changing scale slightly, plus the sub-boom at about 1.9 s.

## Ending / CTA
- Spoken CTA ("try it 7 days free…", "click below or comment the word ___"), shown on a **tight** shot while the offer
  lines play and a **wide** shot for the sign-off. There is no end card, CTA button, arrow or text.
- Hard out 0.3–0.5 s after the last word ("see you inside"), on a smile. No fade.

## What our system can't do yet (ads/graphics.js)
- **Brand-logo pop-ups:** we have text/icon looks only. We need a `logo` look that takes a logo image asset (from
  `/api/resources/brand` or a per-ad upload), sets its position to behind / above-head, and offers the entrances "spin-zoom-blur", "fly-up-from-chest"
  and "blur-in", and the exit "colour-melt".
- **Behind-speaker layering for images:** the director can already put big captions behind the speaker. The same matte is needed
  for logo layers.
- **Motion blur** on graphic entrances: GSAP needs a blur filter keyframe and/or a directional-blur SVG filter.
- **Auto-detect brand mentions** in the transcript (Claude, ChatGPT, the product name) to place logos at the exact word time.
- **Multi-camera:** the reference uses a second camera angle. We only handle one source file per ad.
- **Riser/impact/shimmer/ding SFX** need to exist in the SFX library with these names.

## Lessons from the creator's corrections (2026-09-23)
- **Cut ruthlessly.** After the value lines ("…eight hours a day"), go straight to the final clean CTA take ("learn how you
  can put AI agents in your business today…"). Everything between them (early CTAs, restarts, re-explaining) goes.
- **No dead air.** Every pause where nothing is said comes out. Watch for chatter the transcript missed ("hold on",
  "okay"): a word that lasts far too long usually hides it.
- **Don't overwhelm the ear.** At most one boom in the hook. The product reveal swells in (whoosh and riser) with no boom on
  top, and the X over a competitor lands with a crash, not a crash plus a boom.
- **Never cover the face.** Logos and the ATLAS name sit high in the headroom; numbers go above the head; the checklist
  and CTA go low, above the captions.
- **Attention first.** Intentional zooms (punch, push, pull) on the lines that matter, fastest in the first 5–10 seconds.


## More lessons (2026-09-23, evening)
- **Always the click button.** When the speaker says "click", "tap" or "comment", the CTA button with the clicking cursor
  is on that word. The builder adds it when the plan doesn't.
- **Every money figure, 24/7 and free-trial length gets its number card** (money counts up green with the counter and
  cha-ching; 24/7 pops in whole). Never swap them for a checklist.
- **Graphics land on their word** in the finished ad, not "around" it. Timing that looks random reads as cheap.
- **Graphics stay small and clean:** they support the speaker and never compete with the face.
- **Every pause, repeat and mess-up goes.** The finished ad is listened back to and rebuilt until there are none.
