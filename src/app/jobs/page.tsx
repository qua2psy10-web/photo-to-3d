import Link from "next/link";
import { listJobs } from "@/lib/jobs-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  queued: "キュー待ち",
  pending: "準備中",
  uploading: "アップロード中",
  processing: "処理中",
  ready: "完了",
  completed: "完了",
  failed: "失敗",
};

export default async function JobsHistoryPage() {
  const jobs = await listJobs();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ジョブ履歴</h1>
          <p className="mt-1 text-sm text-neutral-500">
            新しい順 · サーバー再起動後も保持
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          新規ジョブ
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-600">
          まだジョブがありません。
        </p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const thumb =
              job.imagePaths.length > 0
                ? `/api/jobs/${job.id}/images/0`
                : null;
            return (
              <li
                key={job.id}
                className="flex gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                      no img
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
                      {STATUS_LABEL[job.status] ?? job.status}
                    </span>
                    <span className="text-xs text-neutral-500 tabular-nums">
                      {job.imageCount} 枚
                    </span>
                  </div>
                  <p className="truncate font-mono text-xs text-neutral-500">
                    {job.id}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(job.createdAt).toLocaleString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}{" "}
                    JST
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1 text-sm">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-blue-600 underline dark:text-blue-400"
                    >
                      詳細
                    </Link>
                    {job.status === "failed" && (
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-red-600 underline dark:text-red-400"
                      >
                        再試行へ
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline dark:text-blue-400">
          ホーム
        </Link>
        <Link
          href="/jobs/new"
          className="text-blue-600 underline dark:text-blue-400"
        >
          新規ジョブ
        </Link>
      </nav>
    </main>
  );
}
