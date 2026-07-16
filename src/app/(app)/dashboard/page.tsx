import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import type { ConversionJob } from "@/lib/types";
import { Plus, FileText, Download, PenTool } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: jobs } = await supabase
    .from("conversion_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (jobs ?? []) as ConversionJob[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">変換ジョブ</h1>
          <p className="text-sm text-ink-faint">アップロードしたノートの変換状況を確認できます。</p>
        </div>
        <LinkButton href="/upload"><Plus className="h-4 w-4" />新しいノートを変換</LinkButton>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium">まだ変換ジョブがありません</p>
          <p className="text-sm text-ink-faint">ノート写真をアップロードして最初の清書PDFを作りましょう。</p>
          <LinkButton href="/upload" className="mt-4"><Plus className="h-4 w-4" />ノートをアップロード</LinkButton>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-ink-faint">
              <tr>
                <th className="px-4 py-3">タイトル</th>
                <th className="px-4 py-3">ページ数</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">作成日</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium"><Link href={`/jobs/${j.id}`} className="hover:text-brand-700">{j.title}</Link></td>
                  <td className="px-4 py-3">{j.page_count}枚</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3 text-ink-faint">{new Date(j.created_at).toLocaleDateString("ja-JP")}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {(j.status === "review" || j.status === "completed") && (
                        <Link href={`/editor/${j.id}`} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"><PenTool className="h-3 w-3" />補正</Link>
                      )}
                      {j.status === "completed" && (
                        <Link href={`/pdf/${j.id}`} className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700"><Download className="h-3 w-3" />PDF</Link>
                      )}
                      <Link href={`/jobs/${j.id}`} className="inline-flex items-center rounded-md px-2 py-1 text-xs text-brand-700 hover:bg-brand-50">詳細</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
