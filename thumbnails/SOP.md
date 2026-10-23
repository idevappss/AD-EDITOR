# The thumbnail SOP, as built

The creator's **YouTube Thumbnails SOP** (GOH Consulting) is the standard every thumbnail here is made and
checked against. `sop.js` holds the rules the prompts and the checklist use. This page maps each part of the SOP
to the code that carries it out.

| SOP | What the code does |
|---|---|
| **1. Curiosity gap.** Raise the question, never answer it. | Every variation carries a `gap`: the question the viewer is left with. It's shown in the editor as "Viewer asks: …". |
| **2. The 5 types.** Moment, Story, Result, Transformation, Novelty. Pick one before designing. | Claude picks a `type` for each variation first (`headline.js`). The type shows on every card. |
| **3. Stop the scroll.** One or two stoppers, not all seven. Use the four corners. | Each variation names its `stoppers` (at most 2). The **corner hit** (`badge`: a big number, money, "Day 90") sits in a top corner on the text's side (`compose.js`). |
| **4. The 3 C's.** One focal point, rule of thirds, contrast. | Stills with one dominant face score higher than ones where faces compete (`frames.js`). The still is pushed in (up to 1.45×) so the face lands on the third away from the words. A spotlight grade lifts the subject and lets the frame fall off. |
| **5. Match the vibe.** Cool for serious, brighter for quirky. | `tone`: serious (cool), bold (punchy), bright (warm and light) sets the grade. It can be changed in the editor. |
| **Title + thumbnail are one unit.** | Claude is given the video's best YouTube title (from the analysis) and has to open a loop that title doesn't close, without repeating its words. |
| **Text: 2–3 short lines, clear font.** | Headlines are capped at 6 words (usually 2–4). The page shrinks the text until it fits on 3 lines at most, and reports the line count. |
| **6. The 4 tests.** Clarity, Contrast, Glance, Bonus (3 variations). | `check.js` lays each variation out at phone-feed size and sidebar size, in YouTube dark and light mode, and Claude judges that sheet against the full Banger checklist. What fails and can be fixed with words, layout or the corner hit gets fixed, repainted and checked again. The variation most likely to win leads. |
| **Banger checklist.** Every box a yes. | 12 boxes (`CHECKLIST` in `sop.js`), each stored per variation with a note. The card shows the score (e.g. 12/12), and the editor lists every box. **Run it again** re-checks after hand edits. |
| **On-brand with the last ten.** | The last ten lead thumbnails (and which ones were ♥ or ✕) go into both the build and the check. |
| **7. Shoot your thumbnails.** A bank of real expressions. | **From your photos** takes up to 12 of the creator's own photos (HEIC too) and builds the three variations from them, for a video or on their own. |
| **8. Test like a startup.** A/B test and let the data decide. | Every video gets 3 variations (A, B, C). Each one saves separately (e.g. `Video name B.jpg`), ready for YouTube's Test & Compare. Click one to make it lead. |
| **Text options.** | Presets like **Day In A Life** and **Week In The Life** (`PRESETS` in `sop.js`), plus any the creator saves with **Save words as preset**. Picking one when making thumbnails puts those exact words on all three variations. |
| **9. Build your swipe file.** | **Your style** tab: thumbnails the creator loves (uploads or YouTube links, with notes) are broken down by the SOP and distilled into a style profile that steers every build and the on-brand check (`style.js`). |

Not automated: Creator Hooks Pro's Hook Score (step 9) and the
tools in step 10 (Thumbnail Sketcher, TubeBuddy heat maps). Those stay the creator's own habits.
