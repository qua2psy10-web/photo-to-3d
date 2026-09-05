"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** GLB / glTF URL (e.g. job.modelUrl → `/samples/demo.glb`) */
  src?: string;
  alt?: string;
  /** Enable gentle auto-rotate (default ON) */
  autoRotate?: boolean;
};

/**
 * Real @google/model-viewer wrapper.
 * Loads the custom element only on the client to avoid SSR issues with Three.js.
 */
export function ModelViewer({
  src,
  alt = "Generated 3D model",
  autoRotate = true,
}: Props) {
  const [libReady, setLibReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setLibReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "model-viewer の読み込みに失敗しました",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = viewerRef.current;
    if (!el) return;
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const req =
      el.requestFullscreen?.bind(el) ??
      anyEl.webkitRequestFullscreen?.bind(el);
    void req?.();
  }, []);

  if (!src) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-600 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500">モデルURLがありません</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
        {!libReady && (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-neutral-500 sm:min-h-[360px]">
            ビューアを準備中…
          </div>
        )}
        {libReady && (
          <model-viewer
            ref={viewerRef}
            src={src}
            alt={alt}
            camera-controls
            touch-action="pan-y"
            auto-rotate={autoRotate || undefined}
            shadow-intensity="1"
            exposure="1"
            className="block h-[min(70vh,520px)] w-full min-h-[280px] touch-manipulation bg-transparent"
            style={{ width: "100%", minHeight: 280 }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={src}
          download
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 sm:flex-none dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          GLBをダウンロード
        </a>
        <button
          type="button"
          onClick={enterFullscreen}
          disabled={!libReady}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50 sm:flex-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          全画面
        </button>
        <p className="w-full text-[11px] text-neutral-400 sm:ml-auto sm:w-auto">
          ドラッグで回転・ピンチ／スクロールでズーム
        </p>
      </div>
    </div>
  );
}
