// A restart mid-processing mustn't leave a video "transcribing" forever, holding up every ad behind it (the C7070 ad,
// 2026-10-23 → 10-28). Run: node --test ads/test/
import test from "node:test";
import assert from "node:assert/strict";
import { MAX_RESUMES, STALL_MS, processingStalled, resumeInterrupted } from "../../lib/pipeline.js";

const at = (iso) => Date.parse(iso);

test("a restart puts interrupted videos back in line, oldest first, and leaves the rest alone", () => {
  const projects = [
    { id: "b", createdAt: "2026-10-24T00:00:00Z", status: "transcribing", message: "Making a fast working copy… 74%" },
    { id: "a", createdAt: "2026-10-23T00:00:00Z", status: "downloading", message: "Downloading… 12%" },
    { id: "c", createdAt: "2026-10-22T00:00:00Z", status: "ready", message: "" },
    { id: "d", createdAt: "2026-10-21T00:00:00Z", status: "stopped", message: "Stopped" },
  ];
  const resumed = resumeInterrupted(projects);
  assert.deepEqual(resumed.map((p) => p.id), ["a", "b"]);
  for (const p of resumed) {
    assert.equal(p.status, "queued");
    assert.equal(p.resumes, 1);
    assert.equal(p.error, null);
  }
  assert.equal(projects.find((p) => p.id === "c").status, "ready");
  assert.equal(projects.find((p) => p.id === "d").status, "stopped");
});

test("a video interrupted again and again is flagged instead of looping", () => {
  const project = { id: "x", createdAt: "2026-10-23T00:00:00Z", status: "preparing" };
  for (let i = 0; i < MAX_RESUMES; i++) {
    assert.equal(resumeInterrupted([project]).length, 1);
    project.status = "transcribing"; // the server went down again mid-way
  }
  assert.equal(resumeInterrupted([project]).length, 0);
  assert.equal(project.status, "error");
  assert.match(project.error, /try again/);
});

test("an ad stops waiting on a video that hasn't moved in a long time with nothing processing", () => {
  const stuck = { status: "transcribing", updatedAt: "2026-10-23T10:00:00Z" };
  const now = at("2026-10-28T10:00:00Z");
  // Waiting since long ago (or with no start time given): stuck.
  assert.equal(processingStalled(stuck, { now, since: at("2026-10-23T10:00:00Z") }), true);
  // An ad that only just started waiting gets the full stall time first (the restart may be about to queue it).
  assert.equal(processingStalled(stuck, { now, since: now - 1000 }), false);
  assert.equal(processingStalled(stuck, { now: now + STALL_MS + 1000, since: now }), true);
  // Progress a minute ago: still moving.
  assert.equal(processingStalled({ ...stuck, updatedAt: new Date(now - 60_000).toISOString() }, { now }), false);
  // Finished, failed or stopped videos aren't "stalled"; waitForProject handles those on their own.
  for (const status of ["ready", "error", "stopped"]) assert.equal(processingStalled({ ...stuck, status }, { now }), false);
  assert.equal(processingStalled(null, { now }), false);
});
