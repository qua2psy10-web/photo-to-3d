import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8 space-y-4">
      <h1 className="text-3xl font-bold">photo-to-3d</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Week2 vessel: ディスク保存・SQLite・ダミー復元。有料 API は未接続。
      </p>
      <nav className="flex flex-wrap gap-4">
        <Link
          href="/jobs/new"
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
        >
          新規ジョブ
        </Link>
        <Link
          href="/jobs"
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
        >
          履歴
        </Link>
        <Link
          href="/login"
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
        >
          ログイン
        </Link>
      </nav>
    </main>
  );
}
