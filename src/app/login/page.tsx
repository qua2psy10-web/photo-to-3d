"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/jobs";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("パスワードが違います");
        setSubmitting(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("ログインに失敗しました");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          共有シークレット（APP_SECRET）
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? "ログイン中…" : "ログイン"}
      </button>
      <p className="text-xs text-neutral-500">
        開発時の既定値は{" "}
        <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
          dev-secret-change-me
        </code>
        。詳細は README / .env.example。
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          ジョブの作成・一覧・詳細を見るには共有シークレットが必要です。
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">読み込み中…</p>}>
        <LoginForm />
      </Suspense>
      <nav>
        <Link href="/" className="text-sm text-blue-600 underline dark:text-blue-400">
          ホーム
        </Link>
      </nav>
    </main>
  );
}
