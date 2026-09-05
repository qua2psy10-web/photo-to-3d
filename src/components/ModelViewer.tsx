"use client";

type Props = {
  src?: string;
};

/**
 * Minimal stub for @google/model-viewer.
 * Real custom-element wiring is Day5; package is installed for Week1.
 */
export function ModelViewer({ src }: Props) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-600 dark:bg-neutral-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-200 text-2xl dark:bg-neutral-800">
        🧊
      </div>
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        ModelViewer（スタブ）
      </p>
      <p className="max-w-full break-all text-center text-xs text-neutral-500">
        {src ? src : "no modelUrl"}
      </p>
      <p className="text-[11px] text-neutral-400">
        実GLB表示は Day5 で実装予定
      </p>
    </div>
  );
}
