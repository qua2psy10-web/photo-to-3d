/** Upload rules for local photogrammetry (Object Capture). */
export const MIN_IMAGES = 8;
export const WARN_BELOW = 12;
export const RECOMMENDED_IMAGES = 16;
export const MAX_IMAGES = 40;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Multipart total: per-file cap × max count, plus form overhead. */
export const MAX_UPLOAD_BYTES =
  MAX_IMAGES * MAX_FILE_BYTES + 16 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
] as const;

export const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function isAcceptedImageName(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isAcceptedMime(mime: string): boolean {
  if (!mime) return false;
  if (ACCEPTED_MIME.has(mime.toLowerCase())) return true;
  return mime.toLowerCase().startsWith("image/");
}
