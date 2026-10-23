# Sound effects reference (analysis only)

Studied from two reference videos: **A** = "Vector Sound Effects Library… Official Trailer" (40 s, paid library) and **B** = "Top 3 sound effects that go viral every time" (21 s short). No audio was extracted or saved from either video. Every sound below is **made by us** with the ffmpeg recipe, or found on Pixabay (free for commercial use).
Run each recipe as `ffmpeg -y <inputs> <filters> -ac 2 -ar 48000 out.wav` (every one was test-rendered). Mix SFX at roughly -18 to -12 dB RMS under the voice. Big hits can go louder.

## The 3 "go viral every time" sounds (video B, 7–17 s)
Each one is shown as a green "waveform" card with a play button:
1. **Slice** (the card clicked at 8.1 s, sound at 8.6–10.7 s): a low swell, then a sharp metallic blade *shing*. See `vs-slice`.
2. **Bell** (11.4 s): one clean *ding* at about 1050 Hz with a slow ring-out. See `vs-bell`.
3. **Impact** (labelled "Impact – whoosh sfx", 12.8–17 s): a 1.3 s rising whoosh into a sub *boom* that holds. See `vs-impact`.

---
### vs-slice — Sword/blade slice
- Heard at: B 8.56–10.7 s, the "Slice sfx" card. The 8.06 s and 8.18 s clicks are the cursor clicking play (see `vx-tick`).
- Character: 3 parts. (1) 0.8 s low swell, energy at 110–400 Hz, bell-shaped, slight L/R drift. (2) A 0.25 s upward sweep whose brightness rises from about 2 kHz to 8 kHz. (3) At 9.66 s a **mono** metallic ring with inharmonic partials at 7.1, 7.3, 9.3 and 14.7 kHz. Its attack is under 5 ms and it rings about 1.1 s (falls about 40 dB/s).
- Use it for: a hard cut, a text "slash" reveal, a split-screen wipe, before→after.
- Recreate: `-f lavfi -i "aevalsrc='(0.6*sin(2*PI*7130*t)+0.8*sin(2*PI*7320*t)+sin(2*PI*9280*t)+0.9*sin(2*PI*14680*t))/3.3*exp(-4.5*t)':s=48000:d=1.2" -f lavfi -i "anoisesrc=c=pink:d=0.35:a=0.5" -filter_complex "[1]highpass=f=2500,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.05[w];[0]afade=t=in:d=0.003,adelay=300:all=1[r];[w][r]amix=inputs=2:normalize=0:duration=longest,aecho=0.8:0.4:25:0.3,volume=2"`. For the real steel texture, Pixabay: "sword slice", "katana swoosh".

### vs-bell — Clean ding
- Heard at: B 11.42 s, the "Bell sfx" card. The same kind of ding appears in A at 36.39 s ("Get Vector Now"), there at about 1.0–1.3 kHz.
- Character: a broadband strike click, then a sine at **1050 Hz** with a 2100 Hz octave (-12 to -22 dB) and a faint 6.3 kHz partial. Instant attack, about 1.2 s decay (-10 → -54 dB), slight 5 Hz shimmer and a small stereo wobble.
- Use it for: a checklist tick, a key number or stat landing, "correct", a reward, a CTA appearing.
- Recreate: `-f lavfi -i "aevalsrc='(sin(2*PI*1050*t)+0.25*sin(2*PI*2100*t)+0.06*sin(2*PI*6300*t))*exp(-3.2*t)*(1+0.12*sin(2*PI*5*t))':s=48000:d=1.6" -af "afade=t=in:d=0.002,aecho=0.8:0.5:40:0.2,volume=0.9"`

### vs-impact — Whoosh-into-boom
- Heard at: B 12.8–17.0 s, the "Impact whoosh sfx" card. It is the loudest thing in the short (about -5 dB RMS).
- Character: a 1.3 s **rising** noise whoosh; its brightness climbs from 230 to 530 Hz with a thin band sweeping up toward 2 kHz. At 14.2 s comes a **sub boom** at about 93 Hz with harmonics at 140 and 217 Hz, held about 1.8 s, then a 1 s decay while the stereo widens. Mostly centred.
- Use it for: the hook's first frame, a big reveal, a logo slam, the "price/offer" drop. Use at most once per ad.
- Recreate: `-f lavfi -i "anoisesrc=c=pink:d=1.3:a=0.5" -f lavfi -i "aevalsrc='0.3*sin(2*PI*(200*t+350*t*t))*(t/1.3)^2':s=48000:d=1.3" -f lavfi -i "aevalsrc='sin(2*PI*(50*t+7.5*(1-exp(-8*t))))*if(lt(t,1.8),1,exp(-3*(t-1.8)))':s=48000:d=2.6" -filter_complex "[0]bandpass=f=900:width_type=o:w=2.5,afade=t=in:d=1.3:curve=exp[n];[n][1]amix=inputs=2:normalize=0[rise];[2]lowpass=f=180,afade=t=in:d=0.005,adelay=1300:all=1,volume=0.9[boom];[rise][boom]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.9"`. Pixabay for a richer version: "cinematic whoosh impact", "boom hit trailer".

### vs-swoosh — Short transition swoosh (B intro)
- Heard at: B 0.05–0.5 s (noise swells up into the first word as the folder pops in), and B 6.1–6.55 s (mono, brightness falls from 1.8 kHz to 500 Hz over 0.45 s as the screen swipes to the cards).
- Use it for: a swipe or scene change. Recreate with the `vx-air` recipe, changing `f=4500` to `f=1500` and using d=0.45.

---
Video A: an upbeat music bed runs 2.0–33.5 s and 36.2–40 s with a kick at about 164 Hz and hats at 6–8 kHz. The SFX below sit **on top of it, synced exactly to the motion**. Nearly every visual move gets a sound.

### vx-pop — Bloop pop
- Heard at: A 0.62 s, when the "ocular" logo pops on (peak -4 dBFS).
- Character: about 0.15 s. A click transient, then a pitched blip that falls from about 1.3 kHz to 300 Hz in about 100 ms. Tonal, mono.
- Use it for: an icon, logo or badge popping on; bubble-style pop-ups.
- Recreate: `-f lavfi -i "aevalsrc='sin(2*PI*(300*t+33.3*(1-exp(-30*t))))*exp(-22*t)+0.5*(random(0)*2-1)*exp(-600*t)':s=48000:d=0.25" -af "afade=t=in:d=0.001,volume=0.8"`

### vx-suck-snap — Reverse swell into snap
- Heard at: A 0.95–1.8 s, as the red dot drops and the logo letters collapse.
- Character: a 0.35 s reverse "suck-in" swell (-68 → -35 dB), then a snap at 1.36 s with a **350 Hz thump** that decays 0.3 s.
- Use it for: an element collapsing or zooming in, an object landing.
- Recreate: `-f lavfi -i "anoisesrc=c=pink:d=0.4:a=0.5" -f lavfi -i "aevalsrc='sin(2*PI*350*t)*exp(-10*t)+0.6*(random(0)*2-1)*exp(-500*t)':s=48000:d=0.45" -filter_complex "[0]lowpass=f=3000,afade=t=in:d=0.38:curve=exp,afade=t=out:st=0.38:d=0.02[a];[1]adelay=400:all=1[b];[a][b]amix=inputs=2:normalize=0:duration=longest,volume=0.7"`

### vx-type-riser — Typing ticks over a rising tone
- Heard at: A 2.03–3.7 s, while "introducing" and then "Vector" build letter by letter.
- Character: ticks every about 70 ms over a sine that rises from **290 to 770 Hz** in 0.9 s, plus a faint high partial gliding from 7.4 to 8.1 kHz. It then lands on a held **1.56 kHz** tone for about 0.7 s.
- Use it for: typewriter or kinetic text, a title building up, a short riser into a word.
- Recreate: `-f lavfi -i "aevalsrc='0.35*sin(2*PI*(290*t+266.7*t*t))+0.12*sin(2*PI*(7400*t+222*t*t))+0.5*sin(2*PI*4000*t)*exp(-300*mod(t,0.07))':s=48000:d=0.9" -f lavfi -i "aevalsrc='0.35*sin(2*PI*1560*t)*exp(-2.5*t)':s=48000:d=0.8" -filter_complex "[1]adelay=900:all=1[h];[0][h]concat=n=2:v=0:a=1"`. Scale d and the `mod` period to match the letter count.

### vx-air — Airy whoosh / pen swipe
- Heard at: A 3.8–4.0 s (the "A sound library…" line swooshes in) and A 16.2–17.6 s (the pen draws the underline on "Minimal, but rich").
- Character: noise only, centred at 3–6 kHz with a little 300–500 Hz body. Bell envelope 0.3–1.4 s long, soft attack, with a gentle L/R drift.
- Use it for: an underline or stroke drawing on, text sliding in, a soft transition.
- Recreate: `-f lavfi -i "anoisesrc=c=pink:d=1.0:a=0.6" -af "bandpass=f=4500:width_type=o:w=2,afade=t=in:d=0.5:curve=qsin,afade=t=out:st=0.5:d=0.5:curve=qsin,apulsator=mode=sine:hz=1:amount=0.7,volume=5"`

### vx-chirp — Up-chirp "confirm/fill" with stutter
- Heard at: A 11.95 s (the red ring chart fills and shows "578.1 kb") and A 22.9 s (the toggle switch flips on).
- Character: an up-chirp from **420 to 1740 Hz in about 120 ms**, settling to a held tone at 1.26–1.5 kHz for about 0.5 s. Underneath, 7 short pulses at about 430 Hz, 100 ms apart. Clean and tonal.
- Use it for: a toggle or switch turning on, a progress ring or bar filling, a "success" state.
- Recreate: `-f lavfi -i "aevalsrc='0.6*sin(2*PI*(1740*t-52.8*(1-exp(-25*t))))*exp(-4*t)+0.3*sin(2*PI*430*t)*exp(-40*mod(t,0.1))*lt(t,0.7)':s=48000:d=0.8" -af "afade=t=in:d=0.003"`

### vx-tick — UI pop/tick
- Heard at: A 18.0–18.95 s ("Interface pops and ticks": about 10 ticks, 60–120 ms apart), A 22.2–22.8 s, and B 8.06/8.18 s (the cursor clicking play).
- Character: 30–60 ms each. A 200–700 Hz body falling fast, plus a 6.3–8 kHz click. Mono and dry.
- Use it for: every UI element appearing, cursor clicks, list items, checklist boxes (play one per item).
- Recreate: `-f lavfi -i "aevalsrc='(0.7*sin(2*PI*(200+500*exp(-120*t))*t)+0.4*sin(2*PI*6400*t)*exp(-300*t))*exp(-70*t)':s=48000:d=0.06"`

### vx-drag-hum — Drag/hold tone
- Heard at: A 20.0–21.5 s ("Ready for drag and drop", while a waveform bar is dragged).
- Character: a sustained dyad of **364 + 486 Hz** (a soft minor third) with a slight 6 Hz wobble, under a few clicks. It opens with a short swoosh.
- Use it for: a held or dragged element, a slider moving, a card being carried.
- Recreate: `-f lavfi -i "aevalsrc='(0.5*sin(2*PI*364*t)+0.5*sin(2*PI*486*t))*(0.8+0.2*sin(2*PI*6*t))':s=48000:d=1.2" -af "afade=t=in:d=0.08,afade=t=out:st=0.9:d=0.3,volume=0.6"`

### vx-whistle — Falling whistle blip
- Heard at: A 23.4–23.6 s, as the toggle knob pops off into a ball. It is followed by an **816 Hz** pop at 23.55 s (use `vx-pop` for that).
- Character: short descending whistles from about 6 kHz to 4 kHz, about 150 ms, soft.
- Use it for: something flying or dropping away, a cartoon "fall", dismissing an element.
- Recreate: `-f lavfi -i "aevalsrc='0.5*sin(2*PI*(4000*t+100*(1-exp(-20*t))))*sin(PI*t/0.15)':s=48000:d=0.15"`

### vx-revswell — Reverse whoosh-in
- Heard at: A 24.0–25.1 s, after near silence (-88 dB) and just before the green bars punch in at 25.15 s.
- Character: a reversed reverb tail that rises about 80 dB over 1.1 s and cuts off at its peak. Broadband and airy.
- Use it for: the lead-in to a big entrance or a chart appearing. Line it up so it ends exactly on the hit.
- Recreate: `-f lavfi -i "anoisesrc=c=pink:d=0.15:a=0.8" -af "lowpass=f=6000,afade=t=out:d=0.15,apad=pad_dur=1,aecho=0.8:0.9:60|140|260:0.5|0.35|0.25,areverse,volume=4"`

### vx-count — Counting-up ticks (numbers/bars)
- Heard at: A 25.2–26.8 s (the bars rise) and A 29.0–30.3 s (the bar chart and curve grow).
- Character: a fast tick train with about 70–100 ms spacing. Each tick is a 375–420 Hz blip plus a bright click whose pitch and brightness **rise over the run** (centroid 3.6 → 8.7 kHz). This reads as "going up".
- Use it for: **counting numbers, growing bars, stat counters, checklists filling**. These are the user's favourite ad elements.
- Recreate: `-f lavfi -i "aevalsrc='0.6*sin(2*PI*400*t)*exp(-60*mod(t,0.085))+0.25*sin(2*PI*(3000*t+1538*t*t))*exp(-300*mod(t,0.085))':s=48000:d=1.3" -af "afade=t=out:st=1.2:d=0.1"`. Set d to the length of the count-up and end it on `vs-bell`.

### vx-ping — High glass ping
- Heard at: A 32.0–32.5 s, a small high ping as the last chart element settles.
- Character: a pure **3.86 kHz** sine with a faint 10.6 kHz partial. About 0.5 s decay with a short slap echo.
- Use it for: glass UI, sparkle on a logo, a small highlight.
- Recreate: `-f lavfi -i "aevalsrc='(sin(2*PI*3860*t)+0.3*sin(2*PI*10650*t))*exp(-5*t)':s=48000:d=0.8" -af "afade=t=in:d=0.002,aecho=0.8:0.6:60|120:0.3|0.2,volume=0.8"`. Pixabay: "glass ding ui", "crystal ping".

### vx-bigswoosh — Swoosh with a long tail
- Heard at: A 32.7–36.0 s, as the product box flies in ("The motion toolkit."). The music drops out and a 2.5 s tail fades (-33 → -74 dB).
- Character: a dense 0.6 s noise whoosh centred at about 800 Hz with broad lows, then a long, dark, diffuse reverb decay.
- Use it for: the final product or logo reveal before the CTA, where the music drops out.
- Recreate: `-f lavfi -i "anoisesrc=c=pink:d=0.6:a=0.7" -af "bandpass=f=800:width_type=o:w=3,afade=t=in:d=0.35:curve=exp,afade=t=out:st=0.35:d=0.25,apad=pad_dur=2.5,aecho=0.8:0.85:300|700|1300:0.45|0.3|0.2,volume=6"`. Pixabay: "cinematic swoosh reverb tail".

## How the two videos use sound
- Every visual move gets a sound, and it lands on the exact frame. In A, sounds are about 100–300 ms apart during UI sections.
- A pairs a riser or swell with the hit it leads into: `vx-revswell`→bars, the `vs-impact` whoosh→boom, `vx-type-riser`→held tone.
- There is silence before big moments: A goes silent at 23.9–24.5 s, and B leaves about 0.1 s gaps between its three demos.
- Tonal SFX are pitched in the 300 Hz–1.8 kHz range, which is clear of the voice's formants in a mix. Keep the clicks bright (6–8 kHz).
