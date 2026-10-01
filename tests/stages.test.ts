import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyCaptureLine,
  beginStage,
  stepIndexForStage,
} from "../src/lib/photogrammetry/stages";

test("progressInfo imageAlignment becomes the aligning stage", () => {
  const next = applyCaptureLine(
    beginStage("analyzing"),
    JSON.stringify({
      event: "progressInfo",
      info: "PhotogrammetrySession.Request.ProgressInfo.imageAlignment",
    }),
  );
  assert.equal(next.stage, "aligning");
  assert.equal(next.activity, "写真の位置を合わせています");
  assert.ok(next.log.includes("写真の位置を合わせています"));
});

test("a progress fraction does not change the current stage", () => {
  const start = applyCaptureLine(
    beginStage("analyzing"),
    JSON.stringify({ event: "progressInfo", info: "pointCloudGeneration" }),
  );
  const next = applyCaptureLine(
    start,
    JSON.stringify({ event: "progress", fraction: 0.8 }),
  );
  assert.equal(next, start);
  assert.equal(next.stage, "points");
});

test("invalid samples keep a single updated count", () => {
  let state = beginStage("aligning");
  state = applyCaptureLine(state, JSON.stringify({ event: "invalidSample", reason: "blurry" }));
  state = applyCaptureLine(state, JSON.stringify({ event: "invalidSample", reason: "blurry" }));
  assert.equal(state.invalid, 2);
  assert.equal(state.stage, "aligning");
  assert.equal(state.activity, "使えない写真が 2 枚あります");
  assert.equal(state.log.filter((line) => line.startsWith("使えない写真")).length, 1);
});

test("automatic downsampling and texture mapping are distinct", () => {
  let state = beginStage("meshing");
  state = applyCaptureLine(state, JSON.stringify({ event: "automaticDownsampling" }));
  assert.equal(state.stage, "downsampling");
  assert.match(state.activity, /解像度/);
  state = applyCaptureLine(
    state,
    JSON.stringify({ event: "progressInfo", info: "textureMapping" }),
  );
  assert.equal(state.stage, "texturing");
  assert.equal(stepIndexForStage(state.stage, "processing"), 4);
});

test("unknown progress info is ignored", () => {
  const start = beginStage("analyzing");
  const next = applyCaptureLine(
    start,
    JSON.stringify({ event: "progressInfo", info: "somethingElse" }),
  );
  assert.equal(next, start);
});

test("missing stage falls back to percent buckets", () => {
  assert.equal(stepIndexForStage(undefined, "queued", 5), 0);
  assert.equal(stepIndexForStage(undefined, "processing", 10), 1);
  assert.equal(stepIndexForStage(undefined, "processing", 50), 3);
  assert.equal(stepIndexForStage("done", "ready", 100), 6);
  assert.equal(stepIndexForStage("meshing", "failed", 40), -1);
});
