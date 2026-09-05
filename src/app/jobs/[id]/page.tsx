import Link from "next/link";
import { JobWaiting } from "@/components/JobWaiting";
import { getJob } from "@/lib/jobs-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = (await getJob(id)) ?? null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold">ジョブ詳細</h1>
        <p className="mt-1 font-mono text-xs break-all text-neutral-500 sm:text-sm">
          id: {id}
        </p>
      </div>

      <JobWaiting jobId={id} initialJob={job} />

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline dark:text-blue-400">
          ホーム
        </Link>
        <Link
          href="/jobs"
          className="text-blue-600 underline dark:text-blue-400"
        >
          履歴
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
