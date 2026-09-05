import type { JobStatus as Status } from "@/lib/types";

type Props = {
  status: Status;
};

const LABELS: Record<Status, string> = {
  queued: "キュー待ち",
  pending: "準備中",
  uploading: "アップロード中",
  processing: "処理中",
  completed: "完了",
  failed: "失敗",
};

const STYLES: Record<Status, string> = {
  queued: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  pending: "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700",
  uploading: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  processing: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  completed: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800",
  failed: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
};

export function JobStatus({ status }: Props) {
  return (
    <div
      className={`rounded border p-4 ${STYLES[status] ?? STYLES.pending}`}
    >
      <p className="text-sm">
        ステータス:{" "}
        <span className="font-semibold">{LABELS[status] ?? status}</span>
        <span className="ml-2 font-mono text-xs opacity-70">({status})</span>
      </p>
    </div>
  );
}
