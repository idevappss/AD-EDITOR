// ads/index.js graphicGaps: where a hand-edited ad goes 4 s or more with no motion graphic, the save fills it (the
// creator, 2026-10-28: extended clips should get new motion graphics). Run: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import { graphicGaps } from "../index.js";

const doc = (graphics, D = 30) => ({
  tracks: [
    { kind: "video", clips: [{ start: 0, duration: D / 2, sourceStart: 0, sourceEnd: D / 2 }, { start: D / 2, duration: D / 2, sourceStart: 40, sourceEnd: 40 + D / 2 }] },
    { kind: "graphic", clips: graphics.map(([start, duration], i) => ({ id: `g${i}`, start, duration })) },
  ],
});

test("finds the stretches of 4 s or more with no graphic, the opening and the end included", () => {
  assert.deepEqual(graphicGaps(doc([[9, 2], [12, 3], [22, 2]])), [[0, 9], [15, 22], [24, 30]]);
});

test("an ad with a graphic every few seconds has none", () => {
  assert.deepEqual(graphicGaps(doc([[1, 3], [6, 3], [12, 3], [18, 4], [25, 5]])), []);
});
