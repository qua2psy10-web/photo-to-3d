import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { resetDbForTests } from "../src/lib/db";
import {
  ensureLocalGlb,
  localGlbPath,
  publicModelUrl,
} from "../src/lib/model-store";

test("ensureLocalGlb copies demo cube into data/models", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pto3d-model-"));
  process.env.PHOTO_TO_3D_DATA_DIR = dir;
  resetDbForTests();
  try {
    const url = ensureLocalGlb("abc-123", "/samples/demo.glb");
    assert.equal(url, publicModelUrl("abc-123"));
    const dest = localGlbPath("abc-123");
    assert.equal(fs.existsSync(dest), true);
    assert.ok(fs.statSync(dest).size > 0);
    const again = ensureLocalGlb("abc-123", "/samples/demo.glb");
    assert.equal(again, url);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.PHOTO_TO_3D_DATA_DIR;
    resetDbForTests();
  }
});
