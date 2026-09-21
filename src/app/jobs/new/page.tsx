import { UploadDropzone } from "@/components/UploadDropzone";
import {
  MAX_IMAGES,
  MIN_IMAGES,
  RECOMMENDED_IMAGES,
} from "@/lib/limits";
import { MESSAGES } from "@/lib/messages";

export default function NewJobPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold">新規ジョブ</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          被写体を囲むように、正面・斜め・側面・背面など角度を変えて撮ってください。
          最低 {MIN_IMAGES} 枚、推奨 {RECOMMENDED_IMAGES} 枚、最大 {MAX_IMAGES}{" "}
          枚です。
        </p>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          {MESSAGES.dummy_banner}
        </p>
      </div>
      <UploadDropzone />
    </main>
  );
}
