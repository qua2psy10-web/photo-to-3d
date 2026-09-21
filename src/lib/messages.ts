import {
  MAX_FILE_BYTES,
  MAX_IMAGES,
  MIN_IMAGES,
  RECOMMENDED_IMAGES,
} from "@/lib/limits";

/** Stable error codes for API JSON `error` field. */
export const ErrorCode = {
  expected_multipart: "expected_multipart",
  no_images: "no_images",
  too_few_images: "too_few_images",
  too_many_images: "too_many_images",
  invalid_image: "invalid_image",
  file_too_large: "file_too_large",
  payload_too_large: "payload_too_large",
  unauthorized: "unauthorized",
  not_found: "not_found",
  retry_failed: "retry_failed",
  retry_no_images: "retry_no_images",
  create_failed: "create_failed",
  invalid_password: "invalid_password",
  provider_not_configured: "provider_not_configured",
  dummy_simulated_fail: "dummy_simulated_fail",
  dummy_generic_fail: "dummy_generic_fail",
} as const;

export type ErrorCodeName = (typeof ErrorCode)[keyof typeof ErrorCode];

export const MESSAGES = {
  expected_multipart:
    "画像は multipart/form-data の images フィールドで送ってください。",
  no_images: "画像が1枚もありません。",
  too_few_images: (count: number) =>
    `作成には最低 ${MIN_IMAGES} 枚必要です（現在 ${count} 枚）。推奨は ${RECOMMENDED_IMAGES} 枚前後です。`,
  too_many_images: (count: number) =>
    `一度にアップロードできるのは最大 ${MAX_IMAGES} 枚です（現在 ${count} 枚）。`,
  invalid_image: (name: string) =>
    `対応していないファイルです: ${name}。JPG / PNG / WebP を選んでください。`,
  file_too_large: (name: string) =>
    `${name} が大きすぎます。1枚あたり ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB までです。`,
  payload_too_large:
    "写真の合計サイズが大きすぎて受け取れませんでした。枚数を減らすか、小さい画像にしてください。",
  unauthorized: "ログインが必要です。",
  not_found: "ジョブが見つかりません。削除されたか、権限がありません。",
  retry_failed: "再試行に失敗しました。",
  retry_no_images:
    "保存済みの写真が無いため再試行できません。新規ジョブで写真を上げ直してください。",
  create_failed: "ジョブの作成に失敗しました。",
  invalid_password: "パスワードが違います。",
  provider_not_configured:
    "この復元プロバイダは未設定です。RECONSTRUCTION_PROVIDER=dummy で起動してください。",
  dummy_simulated_fail:
    "ダミー復元が失敗をシミュレートしました。同じ写真で再試行するか、新規にアップロードしてください。",
  dummy_generic_fail:
    "3Dモデルの生成に失敗しました。同じ写真で再試行するか、新規にアップロードしてください。",
  dummy_banner:
    "現在の復元はシミュレーションです。出力はデモ用の立方体 GLB で、入力写真の形状は反映しません。",
  local_banner:
    "この Mac 上で Object Capture（フォトグラメトリ）を実行します。被写体を一周した 8 枚以上の写真が必要で、数分かかることがあります。",
  local_cli_missing:
    "Object Capture 用のコマンドをビルドできませんでした。Xcode コマンドラインツールが入っているか確認してください。",
  local_too_few_views:
    "使える写真が足りません。被写体を囲むように 8 枚以上を上げてください。",
  local_capture_failed:
    "3D 復元に失敗しました。明るい場所で、重なりのある写真を増やして再試行してください。",
  local_convert_failed:
    "メッシュはできましたが GLB への変換に失敗しました。もう一度お試しください。",
  local_unsupported:
    "この Mac では Object Capture を使えません（Apple Silicon または AMD GPU が必要です）。",
} as const;

export class UserFacingError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "UserFacingError";
    this.code = code;
    this.status = status;
  }
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return {
    body: { ok: false as const, error: code, message, ...extra },
    status,
  };
}
