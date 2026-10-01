/** Object Capture mesh detail. Matches the Swift CLI `--detail` values. */

export const CAPTURE_DETAILS = [
  "preview",
  "reduced",
  "medium",
  "full",
  "raw",
] as const;

export type CaptureDetail = (typeof CAPTURE_DETAILS)[number];

export const DETAIL_OPTIONS: {
  value: CaptureDetail;
  label: string;
  hint: string;
}[] = [
  {
    value: "preview",
    label: "試し",
    hint: "粗いモデルです。角度が足りるかの確認向けで、いちばん速く終わります。",
  },
  {
    value: "reduced",
    label: "低",
    hint: "軽めのモデルです。待ち時間を短くしたいときに使います。",
  },
  {
    value: "medium",
    label: "標準",
    hint: "ふだんはこれです。形とテクスチャのバランスを取ります。",
  },
  {
    value: "full",
    label: "高",
    hint: "細かい形を残します。標準より時間がかかります。",
  },
  {
    value: "raw",
    label: "最高",
    hint: "いちばん細かいモデルです。ディスクと時間が大きく増えます。",
  },
];

export function parseDetail(value: unknown): CaptureDetail | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if ((CAPTURE_DETAILS as readonly string[]).includes(normalized)) {
    return normalized as CaptureDetail;
  }
  return null;
}

/** Env fallback when a job does not name a detail. The new-job form overrides this. */
export function defaultDetail(): CaptureDetail {
  return parseDetail(process.env.PHOTOGRAMMETRY_DETAIL) ?? "medium";
}

export function detailLabel(value: string | undefined): string | undefined {
  const parsed = parseDetail(value);
  if (!parsed) return undefined;
  return DETAIL_OPTIONS.find((option) => option.value === parsed)?.label;
}
