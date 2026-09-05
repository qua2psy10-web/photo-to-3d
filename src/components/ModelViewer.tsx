"use client";

type Props = {
  src?: string;
};

/**
 * Minimal stub for @google/model-viewer.
 * Real custom-element wiring comes later; package is installed for Week1.
 */
export function ModelViewer({ src }: Props) {
  return (
    <div className="flex h-64 items-center justify-center rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500">
        ModelViewer（スタブ）{src ? `: ${src}` : " — no modelUrl"}
      </p>
    </div>
  );
}
