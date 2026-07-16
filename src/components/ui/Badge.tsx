import type { JobStatus } from "@/lib/types";
import { clsx } from "@/lib/cn";

const map: Record<JobStatus, { label: string; cls: string }> = {
  pending: { label: "支払い待ち", cls: "bg-slate-100 text-slate-600" },
  processing: { label: "AI変換中", cls: "bg-blue-100 text-blue-700" },
  review: { label: "補正待ち", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "完了", cls: "bg-green-100 text-green-700" },
  failed: { label: "失敗", cls: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = map[status];
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>
      {s.label}
    </span>
  );
}
