import { MIN_IMAGES, RECOMMENDED_IMAGES } from "@/lib/limits";

const TIPS = [
  `被写体を机に置き、一周する。最低 ${MIN_IMAGES} 枚、推奨 ${RECOMMENDED_IMAGES} 枚前後。`,
  "隣の写真と画面の半分ほど重ねる。大きく角度を飛ばさない。",
  "被写体が画面の中央に大きく写る。人が映り込まない。",
  "明るい場所。白飛びと暗い影を避ける。撮影中に照明を動かさない。",
  "模様・文字・角があるもの向き。真っ白や単色の面だけだと失敗しやすい。",
  "ピントを合わせ、手ぶれしない。24MP の普通の写真で足りる。ProRAW は不要。",
];

export function ShootingTips({ title = "撮り方" }: { title?: string }) {
  return (
    <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
        {TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}
