import assert from "node:assert/strict";
import { test } from "node:test";
import { explainCaptureFailure } from "../src/lib/photogrammetry/explain";
import { MESSAGES } from "../src/lib/messages";

test("maps overlap failures to Japanese", () => {
  const text = explainCaptureFailure("stitching failed: low overlap");
  assert.equal(text, MESSAGES.fail_overlap);
});

test("maps featureless surfaces to Japanese", () => {
  const text = explainCaptureFailure("Not enough landmarks; featureless surface");
  assert.ok(text.includes("模様"));
});

test("mentions unused photos when several samples are dropped", () => {
  const text = explainCaptureFailure("reconstruction failed", {
    invalid: 2,
    skipped: 2,
  });
  assert.ok(text.includes("使われなかった写真が 4 枚"));
});

test("keeps a generic Japanese line when the log is unknown", () => {
  const text = explainCaptureFailure("something odd happened");
  assert.ok(text.startsWith(MESSAGES.local_capture_failed));
  assert.ok(text.includes("something odd happened"));
});
