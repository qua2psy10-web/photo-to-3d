import Link from "next/link";
import { UploadDropzone } from "@/components/UploadDropzone";

export default function NewJobPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">新規ジョブ</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          被写体を囲むように複数枚の写真を選んでください。推奨は12枚以上です。
          作成後はジョブ詳細へ進みます（復元処理は第2週以降）。
        </p>
      </div>
      <UploadDropzone />
      <nav className="flex gap-4 text-sm">
        <Link href="/" className="text-blue-600 underline">
          ホーム
        </Link>
      </nav>
    </main>
  );
}
