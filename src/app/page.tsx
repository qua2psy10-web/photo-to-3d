import Link from "next/link";
import { MESSAGES } from "@/lib/messages";
import { MIN_IMAGES, RECOMMENDED_IMAGES } from "@/lib/limits";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-4 sm:p-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">photo-to-3d</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          被写体を囲むように撮った写真を上げると、ジョブが走り、ブラウザで
          GLB を回転プレビューできます。
        </p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          {MESSAGES.dummy_banner}
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          {
            n: "1",
            title: "撮る",
            body: `被写体を一周。最低 ${MIN_IMAGES} 枚、推奨 ${RECOMMENDED_IMAGES} 枚前後。`,
          },
          {
            n: "2",
            title: "上げる",
            body: "ログインして写真をドロップ。サーバの data/ に保存されます。",
          },
          {
            n: "3",
            title: "待つ",
            body: "約12秒でデモ GLB が開きます。履歴からいつでも再開できます。",
          },
        ].map((step) => (
          <li
            key={step.n}
            className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
          >
            <p className="text-xs font-mono text-neutral-400">{step.n}</p>
            <p className="mt-1 font-semibold">{step.title}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/jobs/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900"
        >
          新規ジョブ
        </Link>
        <Link
          href="/jobs"
          className="inline-flex min-h-11 items-center rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-900"
        >
          履歴
        </Link>
      </div>
    </main>
  );
}
