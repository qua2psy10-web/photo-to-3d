"use client";

import type { JobStatus as Status } from "@/lib/types";
import { FAKE_PROGRESS } from "@/lib/types";

type Props = {
  status: Status;
  /** ISO createdAt — used to refine processing sub-steps */
  createdAt?: string;
  /** 0–100 from API; optional display */
  progress?: number;
};

type StepKey = "uploaded" | "analyzing" | "meshing" | "done";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "uploaded", label: "アップロード済" },
  { key: "analyzing", label: "解析中" },
  { key: "meshing", label: "メッシュ生成中" },
  { key: "done", label: "完了" },
];

function activeStepIndex(status: Status, createdAt?: string): number {
  if (status === "ready" || status === "completed") return 3;
  if (status === "failed") return -1;
  if (status === "queued" || status === "pending" || status === "uploading") {
    return 0;
  }
  // processing — split analyzing / meshing by elapsed
  if (createdAt) {
    const ms = Date.now() - new Date(createdAt).getTime();
    if (ms < FAKE_PROGRESS.analyzingUntilMs) return 1;
    return 2;
  }
  return 1;
}

const BADGE: Record<Status, { label: string; className: string }> = {
  queued: {
    label: "キュー待ち",
    className:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  },
  pending: {
    label: "準備中",
    className:
      "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700",
  },
  uploading: {
    label: "アップロード中",
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  },
  processing: {
    label: "処理中",
    className:
      "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  },
  ready: {
    label: "完了",
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  },
  completed: {
    label: "完了",
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  },
  failed: {
    label: "失敗",
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
  },
};

export function JobStatus({ status, createdAt, progress }: Props) {
  const badge = BADGE[status] ?? BADGE.pending;
  const current = activeStepIndex(status, createdAt);
  const isFailed = status === "failed";
  const pct =
    typeof progress === "number"
      ? progress
      : status === "ready" || status === "completed" || status === "failed"
        ? 100
        : 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-4 ${badge.className}`}>
        <p className="text-sm">
          ステータス:{" "}
          <span className="font-semibold">{badge.label}</span>
          <span className="ml-2 font-mono text-xs opacity-70">({status})</span>
        </p>
        {isFailed && (
          <p className="mt-2 text-sm">
            3Dモデルの生成に失敗しました。もう一度お試しください。
          </p>
        )}
      </div>

      {!isFailed && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>進捗</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-500 ease-out dark:bg-indigo-400"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <ol className="space-y-0">
        {STEPS.map((step, i) => {
          const done = !isFailed && current > i;
          const active = !isFailed && current === i;
          const muted = isFailed || current < i;

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done
                      ? "bg-green-500 text-white"
                      : active
                        ? "bg-indigo-500 text-white ring-4 ring-indigo-100 dark:ring-indigo-900"
                        : isFailed && i === 0
                          ? "bg-red-500 text-white"
                          : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
                  ].join(" ")}
                >
                  {done ? "✓" : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={[
                      "my-0.5 w-0.5 flex-1 min-h-4",
                      done
                        ? "bg-green-400"
                        : "bg-neutral-200 dark:bg-neutral-700",
                    ].join(" ")}
                  />
                )}
              </div>
              <div
                className={[
                  "pb-4 pt-0.5 text-sm",
                  active
                    ? "font-semibold text-neutral-900 dark:text-neutral-50"
                    : "",
                  done ? "text-neutral-700 dark:text-neutral-300" : "",
                  muted ? "text-neutral-400 dark:text-neutral-500" : "",
                ].join(" ")}
              >
                {step.label}
                {active && status !== "ready" && status !== "completed" && (
                  <span className="ml-2 inline-block animate-pulse text-xs font-normal text-indigo-600 dark:text-indigo-300">
                    …
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
