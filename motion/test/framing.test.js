// Framing (motion/render.js framingProgram): the creator's Premium complaint of 2026-10-28 — her head was cut off and
// the shot jumped in and out at random. Run with: node --test motion/test/
import test from "node:test";
import assert from "node:assert/strict";
import { ANCHOR, framingProgram } from "../render.js";

// The face band of the ad that was cut off ("Atlas AI agents now do"): forehead at 17.7% of the frame height, chin 41.9%.
const FACE = { top: 0.177, bottom: 0.419 };
/** Where the top of the head (hair included) sits: the face box is eyebrows to chin, the skull rises ~half a face above it. */
const headTop = (f) => f.top - 0.55 * (f.bottom - f.top);
/** Where a point at height y lands after zooming by scale from the step's origin (the cinematic framing sets its own). */
const onScreen = (y, scale, origin = ANCHOR) => origin - (origin - y) * scale;

function doc(framing, { camera = [] } = {}) {
  // Three shots with a cut between each, and a sentence break every couple of seconds (what made "rhythm" jump).
  const video = [
    { id: "v1", type: "video", start: 0, duration: 8, face: FACE },
    { id: "v2", type: "video", start: 8, duration: 7, face: FACE },
    { id: "v3", type: "video", start: 15, duration: 9, face: FACE },
  ];
  const caption = [];
  for (let t = 0; t < 24; t += 1) caption.push({ id: `c${t}`, type: "caption", start: t, duration: 1, words: [{ text: t % 2 ? "done." : "word", s: 0, e: 0.8 }] });
  return {
    aspect: "4:5",
    design: { framing },
    tracks: [
      { id: "camera", kind: "camera", clips: camera },
      { id: "captions", kind: "caption", clips: caption },
      { id: "video", kind: "video", clips: video },
    ],
  };
}

for (const framing of ["rhythm", "key", "cinematic"]) {
  test(`${framing}: no zoom ever pushes the top of the head out of frame`, () => {
    const punch = [{ id: "m1", type: "camera", move: "punch", start: 10, duration: 2 }];
    for (const p of framingProgram(doc(framing, { camera: punch }), [])) {
      for (const s of [p.scale, p.to].filter((x) => x != null)) {
        const y = onScreen(headTop(FACE), s, p.oy ?? ANCHOR);
        assert.ok(y >= 0.02, `${framing} at ${p.t}s: scale ${s} puts the head top at ${y.toFixed(3)}`);
        assert.ok(onScreen(FACE.bottom, s, p.oy ?? ANCHOR) <= 0.98, `${framing} at ${p.t}s: scale ${s} drops the chin out of frame`);
      }
    }
  });
}

test("cinematic: a punch-in that starts just before a cut still happens, in the next shot", () => {
  // The re-edited ad of 2026-10-28: the punch's word started 0.04 s before the cut at 8 s here (11.48 vs 11.52 there).
  const punch = [{ id: "m1", type: "camera", move: "punch", start: 7.96, duration: 0.8 }];
  const program = framingProgram(doc("cinematic", { camera: punch }), []);
  const into = program.find((p) => p.ease === "in");
  assert.ok(into, "the punch-in is in the program");
  assert.ok(into.t >= 8 && into.t < 8.1, `it starts on the cut, at ${into?.t}s`);
  assert.ok(into.to > 1.08);
});

test("cinematic: zooms out to wide at the start, never jumps mid-shot, and only zooms in on purpose", () => {
  const punch = [{ id: "m1", type: "camera", move: "punch", start: 10, duration: 2 }];
  const d = doc("cinematic", { camera: punch });
  const program = framingProgram(d, []);
  assert.equal(program[0].t, 0);
  // The opening zoom-out (the creator, 2026-10-28): it starts tight, with the whole head in frame, and eases out to
  // the wide shot.
  assert.equal(program[0].ease, "open");
  assert.ok(program[0].scale > program[0].to, "it opens tight and zooms out");
  assert.ok(Math.abs(program[0].to - 1) < 0.02, "landing on the wide shot (where its slow drift has got to)");
  assert.ok(onScreen(headTop(FACE), program[0].scale, program[0].oy) >= 0.02, "with the whole head in frame");
  const cuts = new Set(d.tracks.find((t) => t.id === "video").clips.map((c) => c.start));
  // The scale a step starts from must be where the shot already is, except on a cut (the picture changes anyway).
  const at = (t) => {
    let v = program[0].scale;
    for (const p of program) {
      if (p.t > t + 1e-6) break;
      v = p.to != null ? p.scale + (p.to - p.scale) * Math.min(1, (t - p.t) / (p.dur || 1e-6)) : p.scale;
    }
    return v;
  };
  program.forEach((p, i) => {
    if (!i || cuts.has(p.t)) return;
    assert.ok(Math.abs(at(p.t - 1e-3) - p.scale) < 0.012, `jump at ${p.t}s: ${at(p.t - 1e-3).toFixed(3)} → ${p.scale}`);
    assert.ok(p.to != null && p.dur > 0, `step at ${p.t}s isn't animated`);
  });
  // No wide/tight alternation on sentence breaks: outside the punch (and the opening zoom-out), zoom only drifts
  // gently (≤ 6%).
  for (const p of program) {
    const inPunch = p.t >= 10 - 1e-6 && p.t <= 12.7;
    if (!inPunch && p.ease !== "open") assert.ok(Math.max(p.scale, p.to ?? 0) <= 1.061, `unplanned zoom to ${Math.max(p.scale, p.to ?? 0)} at ${p.t}s`);
  }
  assert.ok(program.some((p) => p.t >= 10 && p.t < 10.1 && p.to > 1.08), "the planned punch-in still happens");
});

// Basic (framing "key"), 2026-10-28: once the cap protected the top of the head, zooming from ANCHOR left a speaker
// framed this high almost no room, and Basic's pop-ins on its key lines all but disappeared.
test("key: a punch on a high-framed speaker still pops in, and keeps the head", () => {
  const punch = [{ id: "m1", type: "camera", move: "punch", start: 10, duration: 2 }];
  const program = framingProgram(doc("key", { camera: punch }), []);
  const pop = program.find((p) => p.t === 10);
  assert.ok(pop, "the punch is in the program");
  const before = program.findLast((p) => p.t < 10);
  assert.ok(pop.scale >= 1.15, `the punch reaches ${pop.scale}x`);
  assert.ok(pop.scale / before.scale >= 1.1, `it pops ${before.scale}x → ${pop.scale}x`);
  assert.equal(pop.oy, before.oy, "it zooms from the same origin as the hold, so the picture doesn't jump");
  assert.ok(onScreen(headTop(FACE), pop.scale, pop.oy) >= 0.02, "the top of the head stays in frame");
  // And it pops back out once the line is over.
  const out = program.find((p) => p.t === 12);
  assert.ok(out && out.scale < pop.scale, "it pops back out");
});

test("key: a speaker with headroom zooms from ANCHOR, as Basic always has", () => {
  const roomy = { top: 0.42, bottom: 0.66 };
  const d = doc("key", { camera: [{ id: "m1", type: "camera", move: "punch", start: 10, duration: 2 }] });
  for (const c of d.tracks.find((t) => t.id === "video").clips) c.face = roomy;
  const program = framingProgram(d, []);
  // After the opening zoom-out, which glides its origin back to ANCHOR as it lands.
  assert.equal(program[0].oyTo ?? program[0].oy, ANCHOR, JSON.stringify(program[0]));
  assert.ok(program.slice(1).every((p) => p.oy === ANCHOR), JSON.stringify(program));
  assert.equal(program.find((p) => p.t === 10).scale, 1.38);
});

test("key: each shot zooms from its own origin, switched on the cut", () => {
  const d = doc("key");
  d.tracks.find((t) => t.id === "video").clips[1].face = { top: 0.42, bottom: 0.66 };
  const program = framingProgram(d, []);
  const cut = program.find((p) => p.t === 8);
  assert.ok(cut, "a step on the cut");
  assert.equal(cut.oy, ANCHOR);
  const back = program.find((p) => p.t === 15);
  assert.ok(back && back.oy < 0.2, "the high-framed shot after it pivots near the head again");
  for (const p of program) {
    const face = p.t >= 8 && p.t < 15 ? { top: 0.42, bottom: 0.66 } : FACE;
    assert.ok(onScreen(headTop(face), p.scale, p.oy) >= 0.02, `head cut off at ${p.t}s`);
  }
});

test("key: a punch said right before a cut pops in on the next shot", () => {
  // As in "Atlas Agents Do Everything": the punch's word starts 0.04 s before the cut.
  const punch = [{ id: "m1", type: "camera", move: "punch", start: 7.96, duration: 0.8 }];
  const program = framingProgram(doc("key", { camera: punch }), []);
  const pop = program.find((p) => p.t === 8);
  assert.ok(pop && pop.scale >= 1.15 && !pop.cut, `it pops in on the new shot: ${JSON.stringify(pop)}`);
  assert.ok(!program.some((p) => p.t > 7.5 && p.t < 8), "nothing pops under the cut");
  assert.ok(program.some((p) => p.t > 8.4 && p.t <= 8.76 && p.scale < pop.scale), "and it pops back out where the line ends");
});

// The creator, 2026-10-28: "for both premium and basic, give me a zoomout at the beginning of all videos".
test("every framing style opens with a zoom-out that keeps the head in frame", () => {
  for (const framing of ["cinematic", "key", "rhythm"]) {
    const program = framingProgram(doc(framing), []);
    const open = program[0];
    assert.equal(open.t, 0, framing);
    assert.equal(open.ease, "open", `${framing} opens with the zoom-out`);
    assert.ok(open.scale - open.to >= 0.04, `${framing} starts tighter than it lands (${open.scale} → ${open.to})`);
    assert.ok(open.dur >= 0.5 && open.dur <= 1, `${framing} eases out within the first second`);
    assert.ok(onScreen(headTop(FACE), open.scale, open.oy ?? ANCHOR) >= 0.02, `${framing} keeps the whole head in frame`);
    assert.ok(program.slice(1).every((p) => p.t >= open.dur - 1e-6), `${framing}: nothing else moves until it lands`);
  }
});
