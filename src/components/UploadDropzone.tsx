"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PreviewItem = {
  id: string;
  file: File;
  url: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/*";
const MIN_CREATE = 4;
const WARN_BELOW = 8;
const RECOMMENDED = 12;

function isAcceptedImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  );
}

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(isAcceptedImage);
    if (files.length === 0) return;

    setItems((prev) => {
      const next = [...prev];
      for (const file of files) {
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          url: URL.createObjectURL(file),
        });
      }
      return next;
    });
    setError(null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const canCreate = items.length >= MIN_CREATE;
  const showWarning = items.length > 0 && items.length < WARN_BELOW;

  async function handleCreate() {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageCount: items.length }),
      });
      if (!res.ok) {
        throw new Error(`作成に失敗しました (${res.status})`);
      }
      const data = (await res.json()) as { id?: string };
      if (!data.id) {
        throw new Error("ジョブIDが返りませんでした");
      }
      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors sm:p-10",
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
            : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500",
        ].join(" ")}
      >
        <p className="text-sm font-medium">
          写真をドラッグ＆ドロップ
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          またはタップして選択（JPG / PNG / WebP）
        </p>
        <p className="mt-3 text-xs text-neutral-400">
          推奨 {RECOMMENDED} 枚以上 · 最低 {MIN_CREATE} 枚
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          選択中:{" "}
          <span className="font-semibold tabular-nums">{items.length}</span> 枚
          {items.length > 0 && items.length < RECOMMENDED && (
            <span className="ml-2 text-xs text-neutral-500">
              （推奨 {RECOMMENDED} 枚）
            </span>
          )}
        </p>
      </div>

      {showWarning && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          枚数が少なめです（{WARN_BELOW} 枚未満）。精度のため {RECOMMENDED}{" "}
          枚前後を推奨します。
        </p>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label={`${item.file.name} を削除`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white hover:bg-black"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="button"
        disabled={!canCreate || submitting}
        onClick={handleCreate}
        className={[
          "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors sm:w-auto sm:min-w-40",
          canCreate && !submitting
            ? "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            : "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600",
        ].join(" ")}
      >
        {submitting ? "作成中…" : "作成する"}
      </button>

      {!canCreate && items.length > 0 && (
        <p className="text-xs text-neutral-500">
          作成にはあと {MIN_CREATE - items.length} 枚必要です。
        </p>
      )}
    </div>
  );
}
