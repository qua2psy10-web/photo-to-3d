/** Upload rules for the dummy product (multi-angle stills, simulated reconstruction). */
export const MIN_IMAGES = 4;
export const WARN_BELOW = 8;
export const RECOMMENDED_IMAGES = 12;
export const MAX_IMAGES = 40;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
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
