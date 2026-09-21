"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/jobs/new", label: "新規ジョブ" },
  { href: "/jobs", label: "履歴" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          photo-to-3d
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/jobs"
                  ? pathname === "/jobs" ||
                    /^\/jobs\/[0-9a-f-]+$/i.test(pathname)
                  : pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "font-medium text-neutral-900 dark:text-neutral-50"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }
              >
                {link.label}
              </Link>
            );
          })}
          {pathname !== "/login" && (
            <button
              type="button"
              onClick={() => void logout()}
              disabled={busy}
              className="text-neutral-500 hover:text-neutral-800 disabled:opacity-50 dark:hover:text-neutral-200"
            >
              {busy ? "…" : "ログアウト"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
