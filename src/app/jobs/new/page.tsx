import Link from "next/link";
import { UploadDropzone } from "@/components/UploadDropzone";

export default function NewJobPage() {
  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">新規ジョブ</h1>
      <UploadDropzone />
      <nav className="flex gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline">
          ホーム
        </Link>
        <Link href="/jobs/demo" className="text-blue-600 underline">
          デモジョブ (/jobs/demo)
        </Link>
      </nav>
    </main>
  );
}
