import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/Badge";
import type { ConversionJob } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "operator" && me?.role !== "admin") {
    return <div className="rounded-xl bg-amber-50 p-6 text-amber-800">この画面は運営（operator / admin）のみ閲覧できます。</div>;
  }

  const { data: jobs } = await supabase.from("conversion_jobs").select("*").order("created_at", { ascending: false });
  const { data: pays } = await supabase.from("payments").select("amount_jpy, status");
  const list = (jobs ?? []) as ConversionJob[];
  const revenue = (pays ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount_jpy || 0), 0);
  const byStatus = (s: string) => list.filter((j) => j.status === s).length;

  const cards = [
    { label: "総ジョブ数", value: list.length },
    { label: "変換中", value: byStatus("processing") },
    { label: "補正待ち", value: byStatus("review") },
    { label: "累計売上(モック)", value: "¥" + revenue.toLocaleString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
      <p className="text-sm text-ink-faint">全ジョブの一覧・ステータス・売上サマリー。</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-ink-faint">{c.label}</div>
            <div className="mt-1 text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-ink-faint">
            <tr><th className="px-4 py-3">タイトル</th><th className="px-4 py-3">ページ</th><th className="px-4 py-3">ステータス</th><th className="px-4 py-3">作成日</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{j.title}</td>
                <td className="px-4 py-3">{j.page_count}</td>
                <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                <td className="px-4 py-3 text-ink-faint">{new Date(j.created_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-4 py-3 text-right"><Link href={`/editor/${j.id}`} className="text-brand-700 hover:underline">補正</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-ink-faint">※ Claude APIコスト監視・オペレーター割り当ては本番実装で追加予定（現在はモック）。</p>
    </div>
  );
}
