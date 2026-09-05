import Link from "next/link";
import { JobStatus } from "@/components/JobStatus";
import { ModelViewer } from "@/components/ModelViewer";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">ジョブ詳細</h1>
      <p className="font-mono text-sm">id: {id}</p>
      <JobStatus status="pending" />
      <ModelViewer src={undefined} />
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
