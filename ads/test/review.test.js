// The reviewer (ads/review.js): the creator's checks on every ad before it's handed over (2026-10-29).
// Run with: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import { reviewAd, reviewCaptions, reviewFraming, reviewGraphics, reviewSound } from "../review.js";
import { AD_CAPTION_LINE, pickCaptionY } from "../../motion/render.js";

// A speaker framed like the creator's ads: hair pad at 25% of the frame, chin at 48%.
const FACE = { top: 0.25, bottom: 0.48 };
const SOURCE = { width: 3840, height: 2160 };

function ad({ face = FACE, camera = [], graphics = [], captions = null, sfx = [], music = 0.11, D = 20 } = {}) {
  const caps = captions ?? Array.from({ length: D }, (_, i) => ({ id: `c${i}`, type: "caption", start: i, duration: 1, words: [{ text: "word", s: 0, e: 0.8 }] }));
  return {
    aspect: "4:5",
    design: { framing: "cinematic", autoFrame: true, musicLevel: music },
    tracks: [
      { id: "graphics", kind: "graphic", clips: graphics },
      { id: "camera", kind: "camera", clips: camera },
      { id: "captions", kind: "caption", clips: caps },
      { id: "video", kind: "video", clips: [{ id: "v1", type: "video", start: 0, duration: D, sourceStart: 0, sourceEnd: D, speed: 1, ...(face ? { face } : {}) }] },
      { id: "voice", kind: "audio", clips: [{ id: "a1", type: "audio", start: 0, duration: D, sourceStart: 0, sourceEnd: D }] },
      { id: "sfx", kind: "sfx", clips: sfx },
      { id: "music", kind: "audio", clips: [{ id: "m1", type: "audio", start: 0, duration: D, volume: music }] },
    ],
  };
}
const centered = (D = 20) => Array.from({ length: D + 1 }, (_, t) => ({ t, x: 0.5 }));

test("sound: music goes to 11%, every effect to 10%; 10% music and 9% effects are left alone", () => {
  const doc = ad({ music: 0.126, sfx: [{ id: "s1", sfx: "boom", volume: 0.875 }, { id: "s2", sfx: "whip", volume: 1.339 }, { id: "s3", sfx: "land", volume: 0.09 }] });
  const fixed = reviewSound(doc);
  assert.equal(doc.tracks.find((t) => t.id === "music").clips[0].volume, 0.11);
  assert.equal(doc.design.musicLevel, 0.11);
  assert.deepEqual(doc.tracks.find((t) => t.id === "sfx").clips.map((c) => c.volume), [0.1, 0.1, 0.09]);
  assert.deepEqual(fixed, ["Music 12.6% → 11%", "2 sound effects 87.5%–133.9% → 10%"]);
  const quiet = ad({ music: 0.1, sfx: [{ id: "s1", sfx: "boom", volume: 0.1 }] });
  assert.deepEqual(reviewSound(quiet), []);
  assert.equal(quiet.tracks.find((t) => t.id === "music").clips[0].volume, 0.1);
});

test("framing: a clean ad passes", () => {
  assert.deepEqual(reviewFraming(ad(), { focus: centered(), source: SOURCE }), []);
});

test("framing: missing tracking, a gap in it, and a speaker pushed to the edge are caught", () => {
  assert.match(reviewFraming(ad(), { focus: [], source: SOURCE }).join(), /tracking is missing/);
  const gap = centered().filter((p) => p.t < 5 || p.t > 12);
  assert.match(reviewFraming(ad(), { focus: gap, source: SOURCE }).join(), /not tracked from 4s to 13s/);
  const edge = centered().map((p) => (p.t === 8 ? { t: 8, x: 0.03 } : p));
  assert.match(reviewFraming(ad(), { focus: edge, source: SOURCE }).join(), /off-center at 8s/);
  // A vertical recording needs no crop, so no tracking.
  assert.deepEqual(reviewFraming(ad(), { focus: [], source: { width: 1080, height: 1920 } }).filter((i) => /track/.test(i)), []);
});

test("framing: no face found, too wide and too tight are caught", () => {
  assert.match(reviewFraming(ad({ face: null }), { focus: centered(), source: SOURCE }).join(), /No face found/);
  assert.match(reviewFraming(ad({ face: { top: 0.55, bottom: 0.65 } }), { focus: centered(), source: SOURCE }).join(), /Too zoomed out/);
  assert.match(reviewFraming(ad({ face: { top: 0.3, bottom: 0.88 } }), { focus: centered(), source: SOURCE }).join(), /Too zoomed in|Chin cut off/);
});

test("captions: missing, or a gap while talking, is caught", () => {
  assert.match(reviewCaptions(ad({ captions: [] })).join(), /No captions/);
  const gappy = ad({ captions: [{ id: "c1", type: "caption", start: 0, duration: 4 }, { id: "c2", type: "caption", start: 9, duration: 11 }] });
  assert.match(reviewCaptions(gappy).join(), /No captions from 4s to 9s/);
  assert.deepEqual(reviewCaptions(ad()), []);
});

test("captions: the middle a bit down; around a graphic in the middle, the bottom or the top; never the face", () => {
  const FH = 1350, h = 0.07 * FH, base = { line: AD_CAPTION_LINE, h, FH, safeT: 0.05, safeB: 0.93 };
  const face = [{ a: 0.1 * FH, b: 0.48 * FH }];
  // Nothing in the way: the middle, a bit down.
  assert.equal(pickCaptionY({ ...base, faces: face, boxes: [] }), AD_CAPTION_LINE * FH);
  // A graphic in the middle: straight to the bottom.
  const y = pickCaptionY({ ...base, faces: face, boxes: [{ a: 0.5 * FH, b: 0.75 * FH }] });
  assert.equal(y, 0.93 * FH - h / 2);
  // The bottom taken as well: the top.
  const top = pickCaptionY({ ...base, faces: [{ a: 0.4 * FH, b: 0.55 * FH }], boxes: [{ a: 0.55 * FH, b: 0.93 * FH }] });
  assert.ok(top + h / 2 <= 0.4 * FH, `top at ${top}`);
  // The face fills the middle: just under the chin.
  const under = pickCaptionY({ ...base, faces: [{ a: 0.2 * FH, b: 0.7 * FH }], boxes: [] });
  assert.ok(under - h / 2 >= 0.7 * FH && under < 0.8 * FH, `under the chin at ${under / FH}`);
  // No spot clear of both: the face wins over the graphic.
  const tight = pickCaptionY({ ...base, faces: [{ a: 0.05 * FH, b: 0.6 * FH }], boxes: [{ a: 0.6 * FH, b: 0.93 * FH }] });
  assert.ok(tight - h / 2 >= 0.6 * FH, "kept off the face");
});

test("graphics: one placed without the face, or with no room beside it, is caught", () => {
  const g = (extra) => ({ id: "g1", type: "graphic", start: 4, duration: 3, look: "headline", text: "Saved 20 hours", ...extra });
  assert.match(reviewGraphics(ad({ graphics: [g({})] })).join(), /without knowing where the face is/);
  assert.deepEqual(reviewGraphics(ad({ graphics: [g({ face: FACE })] })), []);
  assert.match(reviewGraphics(ad({ graphics: [g({ face: { top: 0.06, bottom: 0.74 } })] })).join(), /no room beside the face/);
});

test("graphics: one going above the face clears the whole head, not just the face band", async () => {
  const { headBand, headTop } = await import("../../motion/render.js");
  // The 2026-10-29 render: a testimonial card "above" a face band starting at 19% sat on the speaker's hair.
  const shots = [{ start: 30, duration: 5, face: { top: 0.131, bottom: 0.359 } }];
  const band = headBand({ top: 0.19, bottom: 0.385 }, shots, 32.8, 37.8);
  assert.ok(band.top <= headTop({ top: 0.131, bottom: 0.359 }) + 0.001, `head top ${band.top}`);
  assert.equal(band.bottom, 0.385);
});

test("the whole review: fixes the sound, reports the rest, ok only when nothing's left", () => {
  const good = reviewAd(ad({ music: 0.2 }), { focus: centered(), source: SOURCE });
  assert.equal(good.ok, true);
  assert.deepEqual(good.fixed, ["Music 20% → 11%"]);
  const bad = reviewAd(ad({ captions: [] }), { focus: [], source: SOURCE });
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.length >= 2);
});
