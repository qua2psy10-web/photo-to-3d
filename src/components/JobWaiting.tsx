"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JobStatus } from "@/components/JobStatus";
import { ModelViewer } from "@/components/ModelViewer";
import type { Job, JobStatus as Status } from "@/lib/types";

type JobPayload = Job & {
  ok?: boolean;
  progress?: number;
  error?: string;
  errorMessage?: string;
  thumbnailUrl?: string;
};

type Props = {
  jobId: string;
  initialJob?: Job | null;
};

const POLL_MS = 1500;

export function JobWaiting({ jobId, initialJob }: Props) {
  const router = useRouter();
  const [job, setJob] = useState<JobPayload | null>(initialJob ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialJob);
  const [retrying, setRetrying] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (res.status === 401) {
        setError("ログインが必要です");
        setLoading(false);
        return null;
      }
      if (res.status === 404) {
        setJob(null);
        setError("ジョブが見つかりません");
        setLoading(false);
        return null;
      }
      if (!res.ok) {
        throw new Error(`取得に失敗しました (${res.status})`);
      }
      const data = (await res.json()) as JobPayload;
      setJob(data);
      setError(null);
      setLoading(false);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
      setLoading(false);
      return null;
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;
      const data = await fetchJob();
      if (cancelled) return;
      const status = data?.status as Status | undefined;
      const terminal =
        status === "ready" || status === "completed" || status === "failed";
      if (!terminal) {
        timer = setTimeout(tick, POLL_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchJob]);

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(data?.message || `再試行に失敗しました (${res.status})`);
      }
      const data = (await res.json()) as { id?: string };
      if (!data.id) throw new Error("新しいジョブIDがありません");
      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "再試行に失敗しました");
      setRetrying(false);
    }
  }

  if (loading && !job) {
    return (
      <div className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-500 dark:border-neutral-700">
        読み込み中…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-medium">ジョブが見つかりません</p>
          <p className="mt-1 text-xs opacity-80">
            {error ?? "削除されたか、権限がありません。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/jobs/new"
            className="inline-block rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
          >
            新規ジョブへ
          </Link>
          <Link
            href="/jobs"
            className="inline-block rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium dark:border-neutral-600"
          >
            履歴へ
          </Link>
        </div>
      </div>
    );
  }

  const status = job.status;
  const isReady = status === "ready" || status === "completed";
  const isFailed = status === "failed";
  const failureReason =
    job.errorMessage ||
    "3Dモデルの生成に失敗しました。同じ写真で再試行するか、新規にアップロードしてください。";

  return (
    <div className="space-y-6">
      <JobStatus
        status={status}
        createdAt={job.createdAt}
        progress={job.progress}
        errorMessage={isFailed ? failureReason : undefined}
      />

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-neutral-500">画像枚数</dt>
        <dd className="tabular-nums">{job.imageCount}</dd>
        <dt className="text-neutral-500">作成日時</dt>
        <dd className="font-mono text-xs break-all">{job.createdAt}</dd>
        {job.provider && (
          <>
            <dt className="text-neutral-500">プロバイダ</dt>
            <dd className="font-mono text-xs">{job.provider}</dd>
          </>
        )}
      </dl>

      {job.imagePaths && job.imagePaths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {job.imagePaths.slice(0, 8).map((_, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={`/api/jobs/${job.id}/images/${i}`}
              alt={`upload ${i + 1}`}
              className="h-14 w-14 shrink-0 rounded-md object-cover border border-neutral-200 dark:border-neutral-700"
            />
          ))}
        </div>
      )}

      {isReady && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">3Dプレビュー</h2>
          <p className="text-xs text-neutral-500">
            現在はダミー GLB（/samples/demo.glb）を表示しています。有料復元 API は未接続です。
          </p>
          <ModelViewer
            src={job.modelUrl}
            alt={`ジョブ ${job.id} の3Dモデル`}
          />
        </section>
      )}

      {isFailed && (
        <section className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            生成に失敗しました
          </p>
          <p className="text-sm text-red-800/90 dark:text-red-200/90">
            {failureReason}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={retrying}
              onClick={handleRetry}
              className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {retrying ? "再試行中…" : "同じ写真で再試行"}
            </button>
            <Link
              href="/jobs/new"
              className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-800 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-200"
            >
              新規ジョブへ
            </Link>
            <Link
              href="/jobs"
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium dark:border-neutral-600"
            >
              履歴へ
            </Link>
          </div>
        </section>
      )}

      {!isReady && !isFailed && (
        <p className="text-center text-xs text-neutral-400">
          処理状況を更新しています（約1.5秒ごと）…
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
