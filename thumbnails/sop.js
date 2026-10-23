// The creator's YouTube Thumbnails SOP (GOH Consulting), turned into the rules every thumbnail is built and
// checked against. SOP.md is the readable version; this is what the prompts and the checklist use.

/** The five ways to open a curiosity gap. Every thumbnail is one of them. */
export const TYPES = [
  { id: "moment", label: "Moment", hint: "the second right before a big reaction — they click to see what happens (vlogs, behind the scenes)" },
  { id: "story", label: "Story", hint: "a point of tension or a question that sets up the first act — they click to see how it resolves" },
  { id: "result", label: "Result", hint: "the desired result on full display — they click to find out how it was done" },
  { id: "transformation", label: "Transformation", hint: "the before and the after side by side — the distance between them is the click" },
  { id: "novelty", label: "Novelty", hint: "something the viewer has never seen before" },
];
export const TYPE_IDS = TYPES.map((t) => t.id);

/** The scroll stoppers. Use one or two, never all of them. */
export const STOPPERS = [
  { id: "face", label: "Face (a genuine, unexpected expression, not a posed smile)" },
  { id: "emotion", label: "Emotion" },
  { id: "color", label: "Bright colour" },
  { id: "number", label: "A large number" },
  { id: "money", label: "Money" },
  { id: "danger", label: "Danger or movement" },
  { id: "aesthetic", label: "Aesthetically pleasing composition" },
];
export const STOPPER_IDS = STOPPERS.map((s) => s.id);

/** Match the vibe: the grade follows the tone of the video, so the click keeps its promise. */
export const TONES = [
  { id: "serious", label: "Serious — cool tones" },
  { id: "bold", label: "Bold — punchy contrast" },
  { id: "bright", label: "Bright — warm and light" },
];
export const TONE_IDS = TONES.map((t) => t.id);

/** The Banger Thumbnail Checklist, plus the four tests. Every box a yes, or it isn't done. */
export const CHECKLIST = [
  { id: "type", label: "Built on one of the 5 types" },
  { id: "gap", label: "Opens a curiosity gap the title doesn't close" },
  { id: "focal", label: "One clear focal point" },
  { id: "stoppers", label: "One or two scroll stoppers, not all seven" },
  { id: "contrast", label: "High contrast: the subject pops" },
  { id: "text", label: "Text is 2–3 short lines, readable at a glance" },
  { id: "emotion", label: "Evokes a real emotion" },
  { id: "tone", label: "Tone matches the video" },
  { id: "brand", label: "On-brand: your trained style and your last ten" },
  { id: "clarity", label: "Clarity test: reads at phone and sidebar size, light and dark mode" },
  { id: "glance", label: "Glance test: a stranger gets it in two seconds" },
  { id: "variations", label: "At least 3 variations ready for A/B testing" },
];
export const CHECK_IDS = CHECKLIST.map((c) => c.id);

/** Headline words the creator reuses. Their own saved ones are added after these. */
export const PRESETS = [
  "Day In A Life",
  "Week In The Life",
  "Month In The Life",
  "A Day In My Life",
  "Behind The Scenes",
  "My Morning Routine",
  "Inside The Boardroom",
  "Day 1 Vs Day 90",
  "$0 To $1M",
  "It's Not This",
];

/** The most words a headline may carry and still pass the glance test. */
export const MAX_WORDS = 6;

export const SOP_PROMPT = `Follow the creator's YouTube Thumbnails SOP. The thumbnail has one job: make not clicking feel impossible.

1. Curiosity gap. The click comes from the gap between what the viewer knows and what they want to know. Raise a question, never answer it. If the viewer could work out the whole story from the picture, the loop is closed and the click is gone. For every variation, write the exact question the viewer is left with.
2. Build it on one of the five types, and pick the type before anything else:
${TYPES.map((t) => `   - ${t.label}: ${t.hint}`).join("\n")}
3. Stop the scroll with one or two of: ${STOPPERS.map((s) => s.label.toLowerCase()).join("; ")}. Stacking them all is noise and dilutes the brand. The four corners are prime real estate: put the most eye-catching element (a big number, money, a "Day 90") in a corner.
4. The three C's:
   - Contents: one main character as the focal point. A second person only if they widen the gap. If an element doesn't widen the gap, cut it.
   - Composition: the subject centred or on a third, the eye led to it.
   - Contrast: luminosity, saturation and hue. The subject jumps off the background.
   Bad: three faces, seven words, four props. Good: one face, one prop, three words.
5. Match the vibe: cool tones for serious topics, bright for quirkier ones, bold in between. A mismatch reads as bait-and-switch.
6. The thumbnail and the title are one unit: the words on the thumbnail complement the title and never repeat it. Together they open a loop only the video closes.
7. Text: 2–3 short lines at most, usually 2–4 words. Readable at phone size in light and dark mode. Pick a real expression (surprise, curiosity, excitement, intensity), never a mid-blink or mid-word face, never a posed smile when there's a genuine one.
8. Stay on-brand: the same identity video after video, so it feels like following a journey, not clickbait.`;
