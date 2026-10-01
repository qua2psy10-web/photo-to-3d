/** Japanese labels for Object Capture phases shown on the waiting screen. */

export type CaptureStage =
  | "queued"
  | "preparing"
  | "loading"
  | "analyzing"
  | "aligning"
  | "points"
  | "meshing"
  | "texturing"
  | "optimizing"
  | "downsampling"
  | "exporting"
  | "converting"
  | "done";

export const STAGE_ACTIVITY: Record<CaptureStage, string> = {
  queued: "順番を待っています",
  preparing: "写真を準備しています",
  loading: "写真を読み込んでいます",
  analyzing: "写真を解析しています",
  aligning: "写真の位置を合わせています",
  points: "点群を作っています",
  meshing: "メッシュを作っています",
  texturing: "テクスチャを貼っています",
  optimizing: "形を整えています",
  downsampling: "解像度を下げてやり直しています",
  exporting: "3Dモデルを書き出しています",
  converting: "ブラウザ用のファイルに変換しています",
  done: "完了しました",
};

/** Coarse steps on the waiting screen. Indexes match `stepIndexForStage`. */
export const CAPTURE_STEPS = [
  { key: "uploaded", label: "アップロード済" },
  { key: "analyzing", label: "写真を解析" },
  { key: "aligning", label: "位置合わせ" },
  { key: "meshing", label: "メッシュ" },
  { key: "texturing", label: "テクスチャ" },
  { key: "converting", label: "変換" },
  { key: "done", label: "完了" },
] as const;

const STEP_INDEX: Record<CaptureStage, number> = {
  queued: 0,
  preparing: 1,
  loading: 1,
  analyzing: 1,
  aligning: 2,
  points: 3,
  meshing: 3,
  optimizing: 3,
  downsampling: 3,
  texturing: 4,
  exporting: 5,
  converting: 5,
  done: 6,
};

const MAX_LOG = 8;

export type StageSnapshot = {
  stage: CaptureStage;
  activity: string;
  log: string[];
  invalid: number;
  skipped: number;
};

export function isCaptureStage(value: string | undefined): value is CaptureStage {
  return !!value && Object.prototype.hasOwnProperty.call(STAGE_ACTIVITY, value);
}

export function beginStage(stage: CaptureStage): StageSnapshot {
  const activity = STAGE_ACTIVITY[stage];
  return { stage, activity, log: [activity], invalid: 0, skipped: 0 };
}

export function moveStage(
  state: StageSnapshot,
  stage: CaptureStage,
  activity: string = STAGE_ACTIVITY[stage],
): StageSnapshot {
  if (state.stage === stage && state.activity === activity) return state;
  return {
    ...state,
    stage,
    activity,
    log: pushLog(state.log, activity),
  };
}

function pushLog(log: string[], line: string): string[] {
  if (log[log.length - 1] === line) return log;
  return [...log, line].slice(-MAX_LOG);
}

function replaceByPrefix(log: string[], prefix: string, line: string): string[] {
  const idx = log.findIndex((entry) => entry.startsWith(prefix));
  if (idx >= 0) {
    const next = log.slice();
    next[idx] = line;
    return next;
  }
  return pushLog(log, line);
}

/** Map PhotogrammetrySession.Request.ProgressInfo text to a stage. */
export function stageFromProgressInfo(
  info: string,
): { stage: CaptureStage; activity: string } | null {
  const s = info.toLowerCase();
  if (s.includes("preprocess")) {
    return { stage: "analyzing", activity: STAGE_ACTIVITY.analyzing };
  }
  if (s.includes("alignment") || s.includes("align")) {
    return { stage: "aligning", activity: STAGE_ACTIVITY.aligning };
  }
  if (s.includes("point")) {
    return { stage: "points", activity: STAGE_ACTIVITY.points };
  }
  if (s.includes("texture")) {
    return { stage: "texturing", activity: STAGE_ACTIVITY.texturing };
  }
  if (s.includes("mesh")) {
    return { stage: "meshing", activity: STAGE_ACTIVITY.meshing };
  }
  if (s.includes("optim")) {
    return { stage: "optimizing", activity: STAGE_ACTIVITY.optimizing };
  }
  return null;
}

type CaptureEvent = {
  event?: string;
  info?: string;
  fraction?: number;
};

/**
 * Fold one CLI stdout JSON line into the live stage.
 * Progress fractions do not change the stage. Returns the same object when nothing changed.
 */
export function applyCaptureLine(state: StageSnapshot, line: string): StageSnapshot {
  let ev: CaptureEvent;
  try {
    ev = JSON.parse(line) as CaptureEvent;
  } catch {
    return state;
  }
  switch (ev.event) {
    case "start":
      return moveStage(state, "loading");
    case "inputComplete":
      return moveStage(state, "analyzing");
    case "progressInfo": {
      const mapped = stageFromProgressInfo(String(ev.info ?? ""));
      if (!mapped) return state;
      return moveStage(state, mapped.stage, mapped.activity);
    }
    case "automaticDownsampling":
      return moveStage(state, "downsampling");
    case "invalidSample": {
      const invalid = state.invalid + 1;
      const activity = `使えない写真が ${invalid} 枚あります`;
      return {
        ...state,
        invalid,
        activity,
        log: replaceByPrefix(state.log, "使えない写真", activity),
      };
    }
    case "skippedSample": {
      const skipped = state.skipped + 1;
      const activity = `飛ばした写真が ${skipped} 枚あります`;
      return {
        ...state,
        skipped,
        activity,
        log: replaceByPrefix(state.log, "飛ばした写真", activity),
      };
    }
    case "stitchingIncomplete":
      return {
        ...state,
        activity: "重なりが足りず、つなぎが不完全です",
        log: pushLog(state.log, "重なりが足りず、つなぎが不完全です"),
      };
    case "model":
    case "requestComplete":
      return moveStage(state, "exporting");
    case "obj":
      return moveStage(state, "exporting", "メッシュを書き出しています");
    case "done":
      return moveStage(state, "exporting", "書き出しが終わりました");
    default:
      return state;
  }
}

export function publicLog(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const lines = value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .slice(-MAX_LOG);
  return lines.length > 0 ? lines : undefined;
}

type JobLikeStatus =
  | "queued"
  | "pending"
  | "uploading"
  | "processing"
  | "ready"
  | "completed"
  | "failed";

/** Index into `CAPTURE_STEPS`. `-1` when the job failed. */
export function stepIndexForStage(
  stage: string | undefined,
  status: JobLikeStatus,
  progress?: number,
): number {
  if (status === "ready" || status === "completed") return CAPTURE_STEPS.length - 1;
  if (status === "failed") return -1;
  if (isCaptureStage(stage)) return STEP_INDEX[stage];
  if (status === "queued" || status === "pending" || status === "uploading") return 0;
  if (typeof progress === "number") {
    if (progress < 25) return 1;
    if (progress < 45) return 2;
    if (progress < 70) return 3;
    if (progress < 90) return 4;
    return 5;
  }
  return 1;
}
