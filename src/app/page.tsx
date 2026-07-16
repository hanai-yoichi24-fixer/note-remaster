import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { Sparkles, Upload, PenTool, FileDown, Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-ink">
            <Sparkles className="h-5 w-5 text-brand-600" />
            ノート美化AIリマスター
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <LinkButton href="/dashboard">ダッシュボード</LinkButton>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink">ログイン</Link>
                <LinkButton href="/signup">無料で始める</LinkButton>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> Claude Vision × HCI補正
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ink md:text-5xl">
              汚ノートを、<br />売れる清書PDFに。
            </h1>
            <p className="mt-4 text-lg text-ink-soft">
              手書きノートをアップロードするだけ。AIが文字・図・数式を構造解析して清書し、
              HCIを学ぶ学生オペレーターが仕上げます。目次・索引・キーワードハイライト付きの
              教材PDFを書き出して、そのまま販売できます。
            </p>
            <div className="mt-6 flex gap-3">
              <LinkButton href="/signup">ノートを変換する</LinkButton>
              <LinkButton href="#pricing" variant="secondary">料金を見る</LinkButton>
            </div>
          </div>

          {/* Before / After */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-100 p-4">
                <div className="mb-2 text-xs font-semibold text-slate-500">BEFORE</div>
                <div className="space-y-1.5 opacity-70">
                  {["✍ みだれた手書き", "図がぐちゃぐちゃ", "見出しがない", "誤字・脱字"].map((t) => (
                    <div key={t} className="rounded bg-white px-2 py-1 text-[11px] text-slate-500 [transform:rotate(-1deg)]">{t}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-brand-50 p-4">
                <div className="mb-2 text-xs font-semibold text-brand-700">AFTER</div>
                <div className="space-y-1.5">
                  {["整った清書テキスト", "自動目次・索引", "キーワード強調", "販売可能なPDF"].map((t) => (
                    <div key={t} className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-brand-800"><Check className="h-3 w-3" />{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold">4ステップで完結</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { icon: Upload, t: "1. アップロード", d: "ノート写真を最大20枚まとめて投稿" },
              { icon: Sparkles, t: "2. AI変換", d: "Claudeが構造解析して清書Markdown化" },
              { icon: PenTool, t: "3. 人手補正", d: "HCIオペレーターがレイアウトを調整" },
              { icon: FileDown, t: "4. ダウンロード", d: "目次・索引付きPDFを書き出し" },
            ].map((s) => (
              <div key={s.t} className="rounded-xl border border-slate-200 p-5">
                <s.icon className="h-7 w-7 text-brand-600" />
                <div className="mt-3 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold">料金プラン</h2>
        <p className="mt-2 text-center text-ink-soft">ページ単位のわかりやすい従量課金。</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={"rounded-2xl border p-6 " + (p.highlight ? "border-brand-500 shadow-lg ring-1 ring-brand-200" : "border-slate-200")}>
              {p.highlight && <div className="mb-2 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">人気</div>}
              <div className="text-lg font-bold">{p.name}</div>
              <div className="mt-2"><span className="text-3xl font-extrabold">¥{p.pricePerPage}</span><span className="text-ink-faint"> / ページ</span></div>
              <div className="mt-1 text-xs text-ink-faint">最大 {p.maxPages} ページ / ジョブ</div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-600" />{f}</li>
                ))}
              </ul>
              <LinkButton href="/signup" variant={p.highlight ? "primary" : "secondary"} className="mt-6 w-full">このプランで始める</LinkButton>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-faint">
          © 2026 ノート美化AIリマスター — MVP デモ（AI変換・決済はモック実装）
        </div>
      </footer>
    </main>
  );
}
