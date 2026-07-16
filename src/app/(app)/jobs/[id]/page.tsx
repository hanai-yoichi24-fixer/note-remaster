import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import JobStatusWatcher from "./watcher";
import type { ConversionJob } from "@/lib/types";
import { PenTool, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function JobDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: job } = await supabase.from("conversion_jobs").select("*").eq("id", params.id).single();
  if (!job) notFound();
  const j = job as ConversionJob;

  const { count } = await supabase.from("note_pages").select("*", { count: "exact", head: true }).eq("job_id", j.id);

  return (
    <div className="mx-auto max-w-2xl">
      <JobStatusWatcher jobId={j.id} status={j.status} />
      <h1 className="text-2xl font-bold">{j.title}</h1>
      <div className="mt-2 flex items-center gap-3 text-sm text-ink-faint">
        <StatusBadge status={j.status} />
        <span>{count ?? j.page_count}ページ</span>
        <span>作成 {new Date(j.created_at).toLocaleString("ja-JP")}</span>
      </div>

      <ol className="mt-8 space-y-3">
        {[
          { k: "pending", label: "支払い待ち" },
          { k: "processing", label: "AIが構造解析・清書中" },
          { k: "review", label: "HCI補正待ち" },
          { k: "completed", label: "PDF出力完了" },
        ].map((s, i) => {
          const order = ["pending", "processing", "review", "completed"];
          const cur = order.indexOf(j.status);
          const state = j.status === "failed" ? "fail" : i < cur ? "done" : i === cur ? "active" : "todo";
          return (
            <li key={s.k} className="flex items-center gap-3">
              <span className={"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " +
                (state === "done" ? "bg-green-100 text-green-700" : state === "active" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400")}>
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className={state === "active" ? "font-semibold" : "text-ink-soft"}>{s.label}</span>
              {state === "active" && j.status === "processing" && <span className="text-xs text-brand-600">処理中...</span>}
            </li>
          );
        })}
      </ol>

      {j.status === "failed" && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">変換に失敗しました。もう一度お試しください。</p>
      )}

      <div className="mt-8 flex gap-3">
        {(j.status === "review" || j.status === "completed") && (
          <LinkButton href={`/editor/${j.id}`}><PenTool className="h-4 w-4" />補正エディタを開く</LinkButton>
        )}
        {j.status === "completed" && (
          <LinkButton href={`/pdf/${j.id}`} variant="secondary"><Download className="h-4 w-4" />PDFを見る</LinkButton>
        )}
      </div>
    </div>
  );
}
