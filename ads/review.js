// The reviewer: every ad is checked before it's handed to the creator (the creator, 2026-10-29: "you are the reviewer
// when an ad gets edited, before giving it to me you need to check everything"). Four checks:
//   - sound: the music at 11% (10% is fine), every sound effect at 9–10%. Fixed here, on the document.
//   - framing: the face tracked and centered in the crop, the head never cut off by a zoom, never too tight or too wide.
//   - captions: there for the whole ad, the middle a bit down, to the bottom or top around a graphic, never on a face.
//   - motion graphics: never on the face, never on a caption.
// Sound is put right; the rest is reported (lib/review.js does the same for clips). The same rules the renderer places
// things by (motion/render.js pickCaptionY, faceOnScreen), so what's checked is what gets rendered.
import { ASPECTS, normalizeDesign } from "../lib/compose.js";
import { AD_CAPTION_LINE, ANCHOR, OPEN, captionSafe, faceOnScreen, framingProgram, headBand, headTop, pickCaptionY } from "../motion/render.js";
import { TEMPLATES, isScene } from "../motion/templates/index.js";
import { AD_MUSIC_LEVEL, AD_MUSIC_MIN, AD_SFX_LEVEL, AD_SFX_MIN } from "./build.js";

/** Framing limits, as shares of the frame height: the face band (hair pad to chin) on screen. */
export const FRAMING = { recordingTop: 0.01, headroom: 0.02, chin: 0.98, tightest: 0.5, widest: 0.15, centered: [0.3, 0.7], trackGap: 2.5 };
/** A caption's height before it's laid out (one line, about 94 px on 1080 at the ads' 0.8 scale). */
const CAPTION_H = 0.07;
/** Where a graphic can go around the face (motion/render.js place): above it from the top, below it down to here. */
const GRAPHIC_TOP = 0.035;
const GRAPHIC_FLOOR = 0.77;
const GRAPHIC_PAD = 0.025;
/** A graphic's height before it's laid out: about a fifth of the frame; place() shrinks it to fit a smaller gap. */
const GRAPHIC_H = 0.2;
const CAPTION_PAD = 0.018;

const pct = (v) => `${Math.round(v * 1000) / 10}%`;
const at = (t) => `${Math.round(t * 10) / 10}s`;
const tracks = (doc, kind) => doc.tracks.filter((t) => t.kind === kind && !t.hidden);
const clipsOf = (doc, kind) => tracks(doc, kind).flatMap((t) => t.clips);
const overlaps = (c, s, e) => c.start < e && c.start + c.duration > s;
const spread = (vs) => (Math.min(...vs) === Math.max(...vs) ? pct(vs[0]) : `${pct(Math.min(...vs))}–${pct(Math.max(...vs))}`);
const clip = (s, n = 40) => (String(s || "").length > n ? `${String(s).slice(0, n - 1)}…` : String(s || ""));

/**
 * Music at AD_MUSIC_LEVEL (AD_MUSIC_MIN to it is fine), every effect at AD_SFX_LEVEL (AD_SFX_MIN to it is fine).
 * Anything else is set to the level, in place. Returns what was changed.
 */
export function reviewSound(doc) {
  const fixed = [];
  const music = doc.tracks.filter((t) => t.kind === "audio" && t.id === "music").flatMap((t) => t.clips);
  const loud = music.filter((c) => !(c.volume >= AD_MUSIC_MIN - 1e-9 && c.volume <= AD_MUSIC_LEVEL + 1e-9));
  if (loud.length) fixed.push(`Music ${spread(loud.map((c) => c.volume ?? 1))} → ${pct(AD_MUSIC_LEVEL)}`);
  for (const c of loud) c.volume = AD_MUSIC_LEVEL;
  if (doc.design && !(doc.design.musicLevel >= AD_MUSIC_MIN - 1e-9 && doc.design.musicLevel <= AD_MUSIC_LEVEL + 1e-9)) doc.design.musicLevel = AD_MUSIC_LEVEL;
  const sfx = doc.tracks.filter((t) => t.kind === "sfx").flatMap((t) => t.clips);
  const off = sfx.filter((c) => !(c.volume >= AD_SFX_MIN - 1e-9 && c.volume <= AD_SFX_LEVEL + 1e-9));
  if (off.length) fixed.push(`${off.length} sound effect${off.length === 1 ? "" : "s"} ${spread(off.map((c) => c.volume ?? 0.5))} → ${pct(AD_SFX_LEVEL)}`);
  for (const c of off) c.volume = AD_SFX_LEVEL;
  return fixed;
}

/**
 * The face in the crop: tracked across every shot, centered, the whole head in frame at every zoom, and neither too
 * tight nor too wide.
 * @param focus   the subject path (lib/pipeline.js clipFocus): [{ t, x }], t in seconds from `offset` in the source
 * @param source  { width, height } of the recording
 */
export function reviewFraming(doc, { focus = null, source = null, offset = 0 } = {}) {
  const issues = [];
  const video = clipsOf(doc, "video");
  const { width: W, height: H } = ASPECTS[normalizeDesign({ ...doc.design, aspect: doc.aspect }).aspect];
  // The share of the source width the frame shows: under 1, the crop has to follow the speaker.
  const visible = source?.width && source?.height ? W / H / (source.width / source.height) : 1;
  if (visible < 0.999) {
    if (doc.design?.autoFrame === false) issues.push("Auto-framing is off: the crop doesn't follow the speaker.");
    else if (!focus?.length) issues.push("Face tracking is missing: the crop can't follow the speaker.");
    else {
      for (const v of video) {
        const from = v.sourceStart ?? 0, to = v.sourceEnd ?? from + v.duration, speed = v.speed || 1;
        const toAd = (t) => v.start + (t - from) / speed;
        const seen = focus.map((p) => ({ t: p.t + offset, x: p.x })).filter((p) => p.t >= from - 1 && p.t <= to + 1);
        // Gaps in the tracking: the crop holds still there, wherever the speaker goes.
        const times = [from, ...seen.map((p) => p.t), to].sort((a, b) => a - b);
        for (let i = 1; i < times.length; i++) {
          if (times[i] - times[i - 1] > FRAMING.trackGap) issues.push(`Face not tracked from ${at(toAd(Math.max(from, times[i - 1])))} to ${at(toAd(Math.min(to, times[i])))}.`);
        }
        // Centered: where the speaker lands in the crop once it's pushed against the edge of the recording.
        const edge = seen.filter((p) => p.t >= from && p.t <= to).map((p) => {
          const left = Math.min(Math.max(p.x - visible / 2, 0), 1 - visible);
          return { t: p.t, pos: (p.x - left) / visible };
        }).find((p) => p.pos < FRAMING.centered[0] || p.pos > FRAMING.centered[1]);
        if (edge) issues.push(`Speaker off-center at ${at(toAd(edge.t))} (${Math.round(edge.pos * 100)}% across the frame): they're at the edge of the recording.`);
      }
    }
  }
  const program = framingProgram(doc);
  for (const v of video) {
    if (!v.face) {
      issues.push(`No face found in the shot at ${at(v.start)}: the zooms and graphics can't keep clear of it.`);
      continue;
    }
    const end = v.start + v.duration;
    const head = headTop(v.face);
    // The head at the very top of the recording: the camera's framing, nothing a zoom can bring back. The render's
    // frame check saw a head at 0.6% here cut off (2026-10-29), so touching the edge counts.
    if (head < FRAMING.recordingTop) issues.push(`Top of the head touches the top of the original recording at ${at(v.start)} (the camera framing): no zoom can show more above it.`);
    // Every zoom step while this shot is up, at its start and its end. A zoom cuts the head off when it moves it out
    // of frame; a head already up at the top of the recording stays where it was (the zoom pivots on the top edge).
    program.forEach((p, i) => {
      const next = program[i + 1]?.t ?? Infinity;
      if (p.t >= end - 0.01 || next <= v.start + 0.01) return;
      const t = Math.max(p.t, v.start), o = p.oy ?? ANCHOR;
      for (const s of [p.scale, p.to].filter((x) => x != null)) {
        const on = (y) => o - (o - y) * s;
        if (on(head) < Math.min(FRAMING.headroom, head) - 0.005) issues.push(`Head cut off at ${at(t)}: the zoom (${s.toFixed(2)}×) pushes the top of the head out of frame.`);
        else if (on(v.face.bottom) > Math.max(FRAMING.chin, v.face.bottom) + 0.005) issues.push(`Chin cut off at ${at(t)}: the zoom (${s.toFixed(2)}×) pushes it out of frame.`);
        else if ((v.face.bottom - v.face.top) * s > FRAMING.tightest) issues.push(`Too zoomed in at ${at(t)}: the face fills ${pct((v.face.bottom - v.face.top) * s)} of the frame.`);
      }
    });
    const most = faceOnScreen(v.face, program, v.start, end);
    if (most.bottom - most.top < FRAMING.widest) issues.push(`Too zoomed out at ${at(v.start)}: the face is only ${pct(most.bottom - most.top)} of the frame, even at its closest.`);
  }
  return [...new Set(issues)];
}

/** Graphics that cover the speaker (full-screen scenes) or speak in the captions' place: captions are off meanwhile. */
const hidesCaptions = (g) => isScene(TEMPLATES[g.look], g) || TEMPLATES[g.look]?.hideCaptions || (g.look === "stat" && g.variant === "studio");
/** Graphics that sit beside the speaker, placed around the face (motion/render.js place). Overlays draw on the shot on purpose. */
const besideFace = (g) => !isScene(TEMPLATES[g.look], g) && !TEMPLATES[g.look]?.overlay;

/** Where a graphic will sit (0–1 of the frame height), as motion/render.js place() puts it, or null without a face. */
function graphicBand(g, program, shots) {
  if (!g.face) return null;
  const f = faceOnScreen(headBand(g.face, shots, g.start, g.start + g.duration), program, g.start, g.start + g.duration, OPEN);
  const above = { a: GRAPHIC_TOP, b: f.top - GRAPHIC_PAD };
  const below = { a: f.bottom + GRAPHIC_PAD, b: GRAPHIC_FLOOR };
  const low = g.look === "list" || g.look === "cta" || TEMPLATES[g.look]?.position === "bottom";
  const order = low ? [below, above] : [above, below];
  const zone = order.find((z) => z.b - z.a >= GRAPHIC_H * 0.7) || (above.b - above.a >= below.b - below.a ? above : below);
  const room = Math.max(0, zone.b - zone.a), h = Math.min(GRAPHIC_H, room);
  const a = zone === below && low ? zone.b - h : zone.a + (room - h) / 2;
  return { a, b: a + h, room };
}

/** Motion graphics: placed with the face known, room for them beside it, and off the captions (reviewCaptions). */
export function reviewGraphics(doc) {
  const issues = [];
  const program = framingProgram(doc);
  const shots = clipsOf(doc, "video");
  for (const g of clipsOf(doc, "graphic").filter(besideFace)) {
    const name = `"${clip(g.text || g.look)}" (${at(g.start)})`;
    const band = graphicBand(g, program, shots);
    if (!band) issues.push(`Graphic ${name} was placed without knowing where the face is: it can cover it.`);
    else if (band.room < GRAPHIC_H * 0.45) issues.push(`Graphic ${name} has no room beside the face (${pct(band.room)} of the frame): it's squeezed small or touches the face.`);
  }
  return issues;
}

/** Captions: there whenever someone's talking, the middle a bit down, around the graphics and never on a face. */
export function reviewCaptions(doc) {
  const issues = [];
  const caps = clipsOf(doc, "caption");
  const voice = doc.tracks.filter((t) => t.kind === "audio" && t.id !== "music" && !t.hidden).flatMap((t) => t.clips);
  if (!caps.length) return voice.length ? ["No captions: the caption track is empty or hidden."] : [];
  const graphics = clipsOf(doc, "graphic");
  const quiet = graphics.filter(hidesCaptions);
  // Talking with no caption up (and no graphic taking their place) for over 2 s.
  const covered = [...caps, ...quiet].map((c) => [c.start, c.start + c.duration]).sort((a, b) => a[0] - b[0]);
  for (const v of voice) {
    let t = v.start;
    for (const [s, e] of covered) {
      if (e <= t) continue;
      if (s >= v.start + v.duration) break;
      if (s - t > 2) issues.push(`No captions from ${at(t)} to ${at(s)} while they're talking.`);
      t = Math.max(t, e);
    }
    if (v.start + v.duration - t > 2) issues.push(`No captions from ${at(t)} to ${at(v.start + v.duration)} while they're talking.`);
  }
  const { width: W, height: H } = ASPECTS[normalizeDesign({ ...doc.design, aspect: doc.aspect }).aspect];
  const FH = H, h = CAPTION_H * FH, pad = CAPTION_PAD * FH, safe = captionSafe(H > W);
  const program = framingProgram(doc);
  const video = clipsOf(doc, "video");
  const shown = graphics.filter(besideFace).map((g) => ({ g, band: graphicBand(g, program, video) })).filter((x) => x.band);
  let onFace = 0, onGraphic = 0, first = null;
  for (const c of caps) {
    const s = c.start, e = c.start + c.duration;
    if (quiet.some((g) => overlaps(g, s, e - 0.01))) continue;
    const faces = video.filter((v) => v.face && overlaps(v, s, e)).map((v) => {
      const f = faceOnScreen({ top: headTop(v.face), bottom: v.face.bottom }, program, s, e);
      return { a: f.top * FH - pad, b: f.bottom * FH + pad };
    });
    const boxes = shown.filter((x) => overlaps(x.g, s, e)).map((x) => ({ a: x.band.a * FH - pad, b: x.band.b * FH + pad }));
    const y = pickCaptionY({ line: AD_CAPTION_LINE, h, FH, safeT: safe.top, safeB: safe.bottom, faces, boxes });
    const hit = (bands) => bands.some((b) => y + h / 2 > b.a && y - h / 2 < b.b);
    if (hit(faces)) onFace++, (first ??= s);
    else if (hit(boxes)) onGraphic++, (first ??= s);
  }
  if (onFace) issues.push(`${onFace} caption${onFace === 1 ? "" : "s"} can't find a spot off the face (first at ${at(first)}).`);
  if (onGraphic) issues.push(`${onGraphic} caption${onGraphic === 1 ? "" : "s"} land on a motion graphic: no clear spot around it (first at ${at(first)}).`);
  return issues;
}

/**
 * The whole review. Sound is fixed on `doc` in place; everything else comes back as issues for the creator to see.
 * @returns {{ at: string, ok: boolean, fixed: string[], issues: string[] }}
 */
export function reviewAd(doc, framing = {}) {
  const fixed = reviewSound(doc);
  const issues = [...reviewFraming(doc, framing), ...reviewCaptions(doc), ...reviewGraphics(doc)];
  return { at: new Date().toISOString(), ok: !issues.length, fixed, issues };
}
