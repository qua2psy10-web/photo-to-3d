import type { JobStatus as Status } from "@/lib/types";

type Props = {
  status: Status;
};

/** Minimal stub */
export function JobStatus({ status }: Props) {
  return (
    <div className="rounded border border-neutral-200 p-4 dark:border-neutral-700">
      <p className="text-sm">
        JobStatus: <span className="font-mono font-semibold">{status}</span>
      </p>
    </div>
  );
}
