// The ads' mix (2026-10-30, "I can't hear the music or the sound effects"): the creator's timeline levels (music 11%,
// effects 10%) apply to loudness-matched sound, so every effect at 10% plays at the same level. Run: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import { injectAdLayers } from "../../motion/render.js";

const doc = (sfx) => ({
  aspect: "4:5",
  design: {},
  tracks: [
    { kind: "video", clips: [{ id: "v1", start: 0, duration: 10, sourceStart: 0, sourceEnd: 10 }] },
    { kind: "sfx", clips: sfx.map(([name, volume], i) => ({ id: `s${i}`, type: "sfx", start: i, duration: 0.5, sfx: name, volume })) },
  ],
});
const volumes = (html) => [...html.matchAll(/data-volume="([\d.]+)"/g)].map((m) => Number(m[1]));
// The composer's page as injectAdLayers expects it: a style block, the stage, then the timeline script.
const html = '<style>\n    </style><div id="stage"><div id="video-punch"></div>\n</div>\n    <script>var tl = gsap.timeline(); window.__timelines = window.__timelines || {};</script>';

test("each effect's 10% is matched to the same loudness", () => {
  // A quiet whip (-27 LUFS) and a loud boom (-14 LUFS), both at 10%: matched to -2, they play 13 dB apart in gain.
  const gain = (name) => 10 ** ((-2 - { whip: -27, boom: -14 }[name]) / 20);
  const [whip, boom] = volumes(injectAdLayers(html, doc([["whip", 0.1], ["boom", 0.1]]), { sfxSrc: (n) => `${n}.mp3`, sfxGain: gain }));
  assert.ok(Math.abs(20 * Math.log10(whip / boom) - 13) < 0.2, `${whip} vs ${boom}`);
  assert.ok(whip > 0.08 && whip <= 1.6);
});

test("without a gain, effects play at their clip volume as before", () => {
  assert.deepEqual(volumes(injectAdLayers(html, doc([["whip", 0.1]]), { sfxSrc: (n) => `${n}.mp3` })), [0.08]);
});
