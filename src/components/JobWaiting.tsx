"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { JobStatus } from "@/components/JobStatus";
import { ModelViewer } from "@/components/ModelViewer";
import type { Job, JobStatus as Status } from "@/lib/types";

type JobPayload = Job & {
  ok?: boolean;
  progress?: number;
  error?: string;
};

type Props = {
  jobId: string;
  initialJob?: Job | null;
};

const POLL_MS = 1500;

export function JobWaiting({ jobId, initialJob }: Props) {
  const [job, setJob] = useState<JobPayload | null>(initialJob ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialJob);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (res.status === 404) {
        setJob(null);
        setError("ジョブが見つかりません（再起動後の可能性あり）");
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
            {error ??
              "メモリ上のストアにないか、サーバー再起動後です。新規ジョブから作り直してください。"}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-block rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          新規ジョブへ
        </Link>
      </div>
    );
  }

  const status = job.status;
  const isReady = status === "ready" || status === "completed";
  const isFailed = status === "failed";

  return (
    <div className="space-y-6">
      <JobStatus
        status={status}
        createdAt={job.createdAt}
        progress={job.progress}
      />

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-neutral-500">画像枚数</dt>
        <dd className="tabular-nums">{job.imageCount}</dd>
        <dt className="text-neutral-500">作成日時</dt>
        <dd className="font-mono text-xs break-all">{job.createdAt}</dd>
      </dl>

      {isReady && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">3Dプレビュー</h2>
          <ModelViewer
            src={job.modelUrl}
            alt={`ジョブ ${job.id} の3Dモデル`}
          />
        </section>
      )}

      {isFailed && (
        <section className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-800 dark:text-red-200">
            生成に失敗しました。写真を選び直して再試行できます。
          </p>
          <Link
            href="/jobs/new"
            className="inline-block rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
          >
            再試行（新規ジョブ）
          </Link>
        </section>
      )}

      {!isReady && !isFailed && (
        <p className="text-center text-xs text-neutral-400">
          自動更新中（約1.5秒ごと）…
        </p>
      )}
    </div>
  );
}
