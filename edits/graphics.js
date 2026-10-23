// Motion graphics for dope edits: the motion graphics library's template kit (motion/, the Atlas motion kit first) and
// its sound design, planned by the director and laid on the edit's timeline here. The plan carries them as motion
// clips (plan.graphics, plan.graphicSfx) so lib/dope.js can draw them with motion/render.js injectAdLayers, exactly
// as the Ads Editor does. Imported only: the kit itself lives (and is edited) under motion/.
import { DOPE_TEMPLATES, SCENE_SOUND, SCENE_TONES, SCENE_TRANSITIONS, TEMPLATES, isScene, soundClips, templateCatalog, templateHits } from "../motion/index.js";

export { SCENE_TONES, SCENE_TRANSITIONS };

const r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** The templates a dope edit may use: everything but the ads' call-to-action / offer cards (end cards, trial passes…). */
export const GRAPHIC_TEMPLATES = DOPE_TEMPLATES;
const ALLOWED = new Set(GRAPHIC_TEMPLATES);

/** The kit's catalog lines (motion templateCatalog), without the CTA templates. */
export const graphicsCatalog = () =>
  templateCatalog()
    .split("\n")
    .filter((line) => ALLOWED.has(line.match(/^- ([\w-]+)/)?.[1]))
    .join("\n");

/** The director's rules for graphics (the motion-graphics-director notes the Ads Editor follows too). */
export const GRAPHICS_RULES = `Motion graphics (the creator's minimal "Atlas" kit, drawn over the footage):
- 2–5 per edit, only where they add something: a number, a claim, a list, a product beat the footage can't show. Minimal: one idea per beat.
- Never two on screen at once. Never over the first 1.5 s hook unless the graphic IS the hook (then leave the title empty).
- Full-screen scenes (fullscreen=true, or templates that are always full-screen) cut away from the footage: at most 1–2 per edit, 3 s or less each.
- Each one must be readable: about 3 words a second of its text, plus the entrance. Short text wins: 1–6 words.
- One *italic serif* accent word per graphic is allowed: wrap it in stars, e.g. "Hours become *minutes*".
- Anchor each on a shot: at_shot = index into your shots list (0 = first shot), offset = seconds after that shot starts (for a spoken line, the word's source second minus the shot's start).
- Don't put a text slam on a shot a graphic covers.`;

const MAX_GRAPHICS = 5;
const MAX_SCENES = 2;
const HOOK = 1.5;

// Words to read on screen, counted as ads/build.js readWords does ("24/7 | Always on" is three).
const wordCount = (g) => [g.text, g.sub, g.highlight, ...(g.items || [])].filter((x) => x && x !== "-").join(" ").replace(/[|;:*]/g, " ").split(/\s+/).filter(Boolean).length;

/** Director output → clean graphic requests (drops unknown templates and empty ones). */
export function cleanGraphics(list) {
  return (Array.isArray(list) ? list : [])
    .map((g) => ({
      template: String(g?.template || ""),
      atShot: Math.round(Number(g?.atShot ?? g?.at_shot) || 0),
      offset: Number(g?.offset) || 0,
      duration: Number(g?.duration) || 0,
      text: String(g?.text || "").trim().slice(0, 120),
      sub: String(g?.sub || "").trim().slice(0, 120),
      highlight: String(g?.highlight || "").trim().slice(0, 140),
      items: (Array.isArray(g?.items) ? g.items : []).map((x) => String(x ?? "").trim().slice(0, 140)).filter(Boolean).slice(0, 8),
      fullscreen: Boolean(g?.fullscreen),
      tone: SCENE_TONES.includes(g?.tone) ? g.tone : "dark",
      transition: SCENE_TRANSITIONS.includes(g?.transition) ? g.transition : null,
    }))
    .filter((g) => ALLOWED.has(g.template) && (g.text || g.items.length));
}

/**
 * Lay the director's graphics on the edit's timeline, enforcing the rules above, and give each its template's sounds.
 * @param list      raw.graphics (director output)
 * @param shotAt    (raw shot index) → the placed shot ({ slotStart, slotEnd }), or undefined when it was dropped
 * @param length    the edit's length in seconds
 * @param titleEnd  when the opening title leaves the screen (0 without one)
 * @param captions  the plan's captions ({ start, end }), so bottom cards move up out of their way
 * @param sfxLevel  1 full, 0.6 subtle, 0 off
 * @returns { graphics, sfx } as motion clips (motion/render.js injectAdLayers)
 */
export function placeGraphics(list, { shotAt, length, titleEnd = 0, captions = [], sfxLevel = 1 }) {
  const wanted = cleanGraphics(list)
    .map((g) => {
      const shot = shotAt(g.atShot);
      if (!shot) return null;
      const t = TEMPLATES[g.template];
      return { g, t, start: shot.slotStart + clamp(g.offset, 0, Math.max(0, shot.slotEnd - shot.slotStart - 0.2)) };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  const graphics = [];
  let scenes = 0;
  for (const { g, t, start: at } of wanted) {
    if (graphics.length >= MAX_GRAPHICS) break;
    let fullscreen = t.scene === "always" || (t.scene === "optional" && g.fullscreen);
    if (fullscreen && scenes >= MAX_SCENES) {
      if (t.scene === "always") continue;
      fullscreen = false;
    }
    // The hook: nothing over the opening title; without a title, a graphic may open the edit, else it waits 1.5 s.
    let start = at;
    if (titleEnd > 0) start = Math.max(start, titleEnd + 0.1);
    else if (start < HOOK) start = start <= 0.3 && !graphics.length ? 0.03 : HOOK;
    // Never two at once: a graphic that would have to wait more than a moment for the last one has lost its line.
    const prev = graphics.at(-1);
    if (prev && prev.start + prev.duration + 0.15 > start) {
      if (prev.start + prev.duration + 0.15 - start > 0.8) continue;
      start = prev.start + prev.duration + 0.15;
    }
    const minLen = Math.max(1.2, t.minLen || 1.2);
    // Long enough to read (~3 words a second plus the entrance), up to 6 s; full-screen scenes 3 s at most.
    let duration = Math.max(clamp(g.duration || minLen + 0.8, minLen, 6), Math.min(5, 0.6 + wordCount(g) / 3));
    if (fullscreen) duration = Math.min(duration, Math.max(3, t.minLen || 0));
    duration = Math.min(duration, length - 0.05 - start);
    if (duration < Math.max(1.2, minLen * 0.85)) continue;
    const end = start + duration;
    const underCaptions = captions.some((c) => c.start < end && c.end > start);
    graphics.push({
      id: `g${graphics.length + 1}`,
      type: "graphic",
      start: r3(start),
      duration: r3(duration),
      look: t.id,
      text: g.text,
      sub: g.sub,
      highlight: g.highlight,
      items: g.items,
      icon: "",
      ...(fullscreen ? { fullscreen: true, tone: g.tone, transition: g.transition || ["slide", "wipe", "fade", "circle"][scenes % 4] } : {}),
      // Dope captions sit low (74%): a bottom card moves to the top while they're up.
      position: fullscreen ? "center" : t.position === "bottom" && underCaptions ? "top" : t.position || "top",
    });
    if (fullscreen) scenes++;
  }

  // Sound design: each template's own sounds (timed to its animation) and a full-screen scene's transition sound,
  // peak-aligned and mixed by the house rules (motion/sounds.js).
  const hits = graphics.flatMap((g) => [
    ...templateHits(g),
    ...(isScene(TEMPLATES[g.look], g) ? [[SCENE_SOUND[g.transition] || "atlas-whoosh", Math.max(0, g.start - 0.1), g.transition === "circle" ? 0.6 : 0.4]] : []),
  ]);
  const sfx = soundClips(hits, { length, level: sfxLevel }).map((s, i) => ({ id: `k${i + 1}`, ...s }));
  return { graphics, sfx };
}
