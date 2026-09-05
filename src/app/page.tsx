import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8 space-y-4">
      <h1 className="text-3xl font-bold">photo-to-3d</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        第1週: UIのみ / 第2週: 復元API
      </p>
      <nav>
        <Link
          href="/jobs/new"
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
        >
          新規ジョブを作成
        </Link>
      </nav>
    </main>
  );
}
