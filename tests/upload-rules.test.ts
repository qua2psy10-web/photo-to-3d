import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_FILE_BYTES,
  MAX_IMAGES,
  MAX_UPLOAD_BYTES,
  MIN_IMAGES,
} from "../src/lib/limits";
import { ErrorCode, UserFacingError } from "../src/lib/messages";
import { validateUploadFiles } from "../src/lib/upload-rules";

function file(name: string, size = 100, mimeType = "image/jpeg") {
  return { originalName: name, mimeType, size };
}

test("rejects fewer than MIN_IMAGES", () => {
  const files = Array.from({ length: MIN_IMAGES - 1 }, (_, i) =>
    file(`a${i}.jpg`),
  );
  assert.throws(
    () => validateUploadFiles(files),
    (err: unknown) =>
      err instanceof UserFacingError && err.code === ErrorCode.too_few_images,
  );
});

test("accepts MIN_IMAGES jpeg files", () => {
  const files = Array.from({ length: MIN_IMAGES }, (_, i) => file(`a${i}.jpg`));
  assert.doesNotThrow(() => validateUploadFiles(files));
});

test("rejects more than MAX_IMAGES", () => {
  const files = Array.from({ length: MAX_IMAGES + 1 }, (_, i) =>
    file(`a${i}.jpg`),
  );
  assert.throws(
    () => validateUploadFiles(files),
    (err: unknown) =>
      err instanceof UserFacingError && err.code === ErrorCode.too_many_images,
  );
});

test("rejects non-image names without an image mime", () => {
  assert.throws(
    () =>
      validateUploadFiles([
        file("a.jpg"),
        file("b.jpg"),
        file("c.jpg"),
        file("notes.txt", 10, "text/plain"),
      ]),
    (err: unknown) =>
      err instanceof UserFacingError && err.code === ErrorCode.invalid_image,
  );
});

test("upload body cap covers several camera stills beyond Next 10MB default", () => {
  assert.ok(MAX_UPLOAD_BYTES > 10 * 1024 * 1024);
  assert.ok(MAX_UPLOAD_BYTES >= MAX_IMAGES * MAX_FILE_BYTES);
});

test("rejects oversized files", () => {
  assert.throws(
    () =>
      validateUploadFiles([
        file("a.jpg"),
        file("b.jpg"),
        file("c.jpg"),
        file("huge.jpg", 20 * 1024 * 1024),
      ]),
    (err: unknown) =>
      err instanceof UserFacingError && err.code === ErrorCode.file_too_large,
  );
});
