import Link from "next/link";
import { JobStatus } from "@/components/JobStatus";
import { ModelViewer } from "@/components/ModelViewer";
import { getJob } from "@/lib/jobs-store";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = getJob(id);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">ジョブ詳細</h1>
      <p className="font-mono text-sm break-all">id: {id}</p>

      {job ? (
        <>
          <JobStatus status={job.status} />
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-neutral-500">画像枚数</dt>
            <dd>{job.imageCount}</dd>
            <dt className="text-neutral-500">作成日時</dt>
            <dd className="font-mono text-xs">{job.createdAt}</dd>
          </dl>
          <ModelViewer src={job.modelUrl} />
        </>
      ) : (
        <>
          <div className="rounded border border-neutral-200 p-4 dark:border-neutral-700">
            <p className="text-sm font-medium">準備中</p>
            <p className="mt-1 text-xs text-neutral-500">
              ジョブが見つかりません（メモリ上のストアにないか、サーバー再起動後です）。
              詳細は後続の復元API実装で永続化されます。
            </p>
          </div>
          <JobStatus status="pending" />
          <ModelViewer src={undefined} />
        </>
      )}

      <nav className="flex gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline">
          ホーム
        </Link>
        <Link href="/jobs/new" className="text-blue-600 underline">
          新規ジョブ
        </Link>
      </nav>
    </main>
  );
}
