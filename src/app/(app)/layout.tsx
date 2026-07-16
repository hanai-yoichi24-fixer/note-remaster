import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sparkles, LayoutDashboard, Upload, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("display_name, role").eq("id", user.id).single();
  const isStaff = profile?.role === "operator" || profile?.role === "admin";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-brand-600" />ノート美化AIリマスター
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/dashboard" className="flex items-center gap-1 rounded-lg px-3 py-2 text-ink-soft hover:bg-slate-100"><LayoutDashboard className="h-4 w-4" />ダッシュボード</Link>
            <Link href="/upload" className="flex items-center gap-1 rounded-lg px-3 py-2 text-ink-soft hover:bg-slate-100"><Upload className="h-4 w-4" />新規変換</Link>
            {isStaff && <Link href="/admin" className="flex items-center gap-1 rounded-lg px-3 py-2 text-ink-soft hover:bg-slate-100"><Shield className="h-4 w-4" />管理</Link>}
            <span className="ml-2 hidden text-ink-faint sm:inline">{profile?.display_name ?? user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg px-3 py-2 text-ink-faint hover:bg-slate-100">ログアウト</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
