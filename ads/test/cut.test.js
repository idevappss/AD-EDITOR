// ads/build.js finishSentences: the cut never stops halfway through a sentence. The creator re-cut "Atlas Took
// Everything Off" by hand on 2026-10-28 because the plan kept "…does everything for me so that" and dropped the rest.
// Run: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import { finishSentences } from "../build.js";

/** Words at a steady 0.3 s each, as the transcript gives them (punctuation on the word). */
const said = (text, t0 = 0) => text.split(" ").map((w, i) => ({ text: w, start: r(t0 + i * 0.3), end: r(t0 + i * 0.3 + 0.25) }));
const r = (n) => Math.round(n * 1000) / 1000;
const atlas = said("I now have Atlas AI, which literally does everything for me so that I only have to worry about creating the content, helping the people inside my offers. It runs my ads.");
const at = (words, w) => words.findIndex((x) => x.text === w);

test("a kept line that stops mid-sentence runs on to the sentence's end", () => {
  const [k] = finishSentences([{ from: 0, to: at(atlas, "me") }], atlas);
  assert.equal(atlas[k.to].text, "offers.");
});

test("a line that ends its sentence, or a clause the plan splices on from, is left alone", () => {
  assert.deepEqual(finishSentences([{ from: 0, to: at(atlas, "offers.") }], atlas)[0].to, at(atlas, "offers."));
  assert.deepEqual(finishSentences([{ from: 0, to: at(atlas, "AI,") }], atlas)[0].to, at(atlas, "AI,"));
  // The plan plays the rest of the sentence from elsewhere: that's a splice, not half a sentence.
  const keep = [{ from: 0, to: at(atlas, "me") }, { from: at(atlas, "I") + 12, to: at(atlas, "offers.") }];
  assert.equal(finishSentences(keep, atlas)[0].to, at(atlas, "me"));
});

test("the rest of a sentence that's a flubbed retake isn't pulled back in", () => {
  // "…it gets people to run my ads it runs my ads." — the plan stops on "book" and keeps the clean "it runs my ads." later.
  const words = said("It gets people to book it gets people to run my ads it runs my ads. I love it.");
  const keep = [{ from: 0, to: 4 }, { from: 15, to: 17 }];
  assert.equal(finishSentences(keep, words)[0].to, 4);
});

test("a long run-on or a pause after the kept words isn't joined on", () => {
  const long = said(`So ${"and then this happened ".repeat(10)}today.`);
  assert.equal(finishSentences([{ from: 0, to: 1 }], long)[0].to, 1);
  const paused = [...said("This is for me"), ...said("so that I can rest.", 10)];
  assert.equal(finishSentences([{ from: 0, to: 3 }], paused)[0].to, 3);
});

test("a line spliced onto its restart keeps the splice, and the abandoned tangent stays out", () => {
  // The creator's own splice: "This has | been life changing… I needed help so bad and this has | taken everything off my plate."
  const words = said("This has been life changing for me as a mother. I needed help so bad and this has taken everything off my plate.");
  const keep = [{ from: 0, to: 1 }, { from: at(words, "taken"), to: words.length - 1 }];
  assert.equal(finishSentences(keep, words)[0].to, 1);
});

test("\"you know\" is cut as an aside, never when it's the sentence's own words", async () => {
  const { tightenClip } = await import("../../lib/tighten.js");
  const run = (text) => {
    const words = said(text);
    const out = tightenClip(words, [{ start: 0, end: words.at(-1).end + 0.1 }]);
    return out.words.map((w) => w.text).join(" ");
  };
  assert.match(run("You can take everything that you know, the questions you get every day."), /that you know,/);
  assert.doesNotMatch(run("It is, you know, the best thing I did."), /you know/);
});

test("re-mixing an ad thins its effects, turns them and the music down, and adds nothing", async () => {
  const { remixSounds } = await import("../build.js");
  const sfx = Array.from({ length: 24 }, (_, i) => ({ id: `s${i}`, type: "sfx", start: i * 1.25, duration: 0.5, sfx: i % 3 ? "click" : "whoosh", volume: 1 }));
  const doc = { design: { musicLevel: 0.2 }, tracks: [{ kind: "video", clips: [{ start: 0, duration: 30 }] }, { kind: "sfx", clips: sfx }, { kind: "audio", id: "music", clips: [{ start: 0, duration: 30, volume: 0.2 }] }] };
  const out = remixSounds(doc);
  assert.ok(out.after <= 6 && out.after >= 3, `${out.before} → ${out.after} effects`);
  assert.ok(doc.tracks[1].clips.every((c) => c.volume === 0.1 && sfx.includes(c)));
  assert.ok(doc.tracks[2].clips[0].volume === 0.11 && doc.design.musicLevel === 0.11);
});
