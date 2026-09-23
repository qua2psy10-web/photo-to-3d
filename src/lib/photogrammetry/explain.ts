import { MESSAGES } from "@/lib/messages";

export type CaptureStats = {
  invalid: number;
  skipped: number;
};

const RULES: { test: RegExp; message: string }[] = [
  {
    test: /overlap|stitch|align|registration/i,
    message: MESSAGES.fail_overlap,
  },
  {
    test: /feature|landmark|detail|textureless|uniform|contrast|blank/i,
    message: MESSAGES.fail_featureless,
  },
  {
    test: /blur|focus|motion|sharp/i,
    message: MESSAGES.fail_blur,
  },
  {
    test: /dark|bright|expos|lighting|overexposed|underexposed/i,
    message: MESSAGES.fail_light,
  },
  {
    test: /not enough|too few|insufficient|minimum number|at least/i,
    message: MESSAGES.local_too_few_views,
  },
  {
    test: /not supported|unsupported|invalid image|format|heic/i,
    message: MESSAGES.fail_format,
  },
  {
    test: /storage|disk|space|no space/i,
    message: MESSAGES.fail_storage,
  },
  {
    test: /cancel/i,
    message: MESSAGES.fail_cancelled,
  },
  {
    test: /without writing a usdz|no mesh|empty/i,
    message: MESSAGES.fail_no_model,
  },
];

/** Turn Object Capture's English logs into a short Japanese reason. */
export function explainCaptureFailure(
  raw: string,
  stats: CaptureStats = { invalid: 0, skipped: 0 },
): string {
  const parts: string[] = [];
  for (const rule of RULES) {
    if (rule.test.test(raw) && !parts.includes(rule.message)) {
      parts.push(rule.message);
    }
  }
  const unused = stats.invalid + stats.skipped;
  if (unused >= 3) {
    parts.push(
      `使われなかった写真が ${unused} 枚あります（無効 ${stats.invalid}、スキップ ${stats.skipped}）。被写体が大きく写り、隣と半分ほど重なるように撮り直してください。`,
    );
  }
  if (parts.length > 0) return parts.join("\n");
  const trimmed = raw.trim();
  if (!trimmed) return MESSAGES.local_capture_failed;
  return `${MESSAGES.local_capture_failed}\n${trimmed}`;
}
