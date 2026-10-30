// ads/awake.js: macOS really holds "prevent idle sleep" while edits run, and lets go after. Run: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { holdAwake, isHeldAwake } from "../awake.js";

const assertions = () => execFileSync("pmset", ["-g", "assertions"], { encoding: "utf8" });
const ours = () => assertions().split("\n").some((l) => /caffeinate/.test(l) && /PreventUserIdleSystemSleep/.test(l));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("holds the no-sleep assertion while editing and releases it after", { skip: process.platform !== "darwin" }, async () => {
  assert.equal(holdAwake(true), true);
  assert.equal(holdAwake(true), true, "a second hold reuses the first");
  await wait(400);
  assert.ok(ours(), "macOS shows caffeinate preventing idle sleep");
  assert.equal(holdAwake(false), false);
  await wait(400);
  assert.equal(isHeldAwake(), false);
});
