// ads/plan.js: when Claude can't be reached the plan says so (failed), instead of passing the bare fallback off as an
// edit. On 2026-10-27 a request that timed out while the Mac slept came back as a "ready" ad with one graphic.
// Run: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Nothing listens on port 9: every request fails fast, like the timed-out one did, without touching the real API.
process.env.ANTHROPIC_API_KEY = "sk-ant-test-unreachable";
process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:9";
const { planAd } = await import("../plan.js");

const words = "this is a short test ad about atlas and what it does for you".split(" ").map((text, i) => ({ text, start: i * 0.4, end: i * 0.4 + 0.35 }));

test("an unreachable Claude marks the plan failed, with the reason", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ads-plan-test-"));
  try {
    const plan = await planAd({ words, prompt: "", duration: 6, aspect: "4:5", videoFile: path.join(tmpDir, "missing.mp4"), tmpDir, options: { editStyle: "premium" } });
    assert.equal(plan.failed, true);
    assert.notEqual(plan.by, "claude");
    assert.match(plan.error, /\S/, "keeps the reason");
    assert.ok(plan.keep?.length, "still has a usable cut, for a creator who wants it anyway");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
