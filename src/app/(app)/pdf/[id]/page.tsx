import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { buildToc, buildIndex, renderHtml } from "@/lib/markdown";
import type { NotePage, ConversionJob, PdfOutput } from "@/lib/types";
import PdfActions from "./actions";

export const dynamic = "force-dynamic";

export default async function PdfPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: job } = await supabase.from("conversion_jobs").select("*").eq("id", params.id).single();
  if (!job) notFound();

  const { data: pages } = await supabase.from("note_pages").select("*").eq("job_id", params.id).order("page_order");
  const { data: out } = await supabase.from("pdf_outputs").select("*").eq("job_id", params.id)
    .order("generated_at", { ascending: false }).limit(1).maybeSingle();

  const list = (pages ?? []) as NotePage[];
  const combined = list.map((p) => p.corrected_markdown ?? p.ai_markdown ?? "").join("\n\n");
  const toc = buildToc(combined);
  const index = buildIndex(combined);
  const bodyHtml = renderHtml(combined, { toc, index });
  const j = job as ConversionJob;
  const pdf = out as PdfOutput | null;

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{j.title}</h1>
          <p className="text-sm text-ink-faint">清書教材PDF プレビュー — 目次・索引・キーワードハイライト付き</p>
        </div>
        <PdfActions title={j.title} downloadUrl={pdf?.download_url ?? null} expiresAt={pdf?.expires_at ?? null} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* TOC panel */}
        <aside className="no-print h-fit rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <div className="font-semibold">目次</div>
          <ul className="mt-2 space-y-1">
            {toc.length ? toc.map((t) => (
              <li key={t.anchor} style={{ marginLeft: (t.level - 2) * 12 }}>
                <a href={`#${t.anchor}`} className="text-brand-700 hover:underline">{t.title}</a>
              </li>
            )) : <li className="text-ink-faint">（見出しなし）</li>}
          </ul>
        </aside>

        {/* rendered document */}
        <article className="print-page mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6 border-b-2 border-brand-600 pb-4 text-center">
            <h2 className="text-2xl font-extrabold">{j.title}</h2>
            <p className="text-xs text-ink-faint">ノート美化AIリマスター — 清書教材PDF</p>
          </header>
          <div className="prose-note" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <section className="mt-10 rounded-lg bg-slate-50 p-4">
            <div className="font-semibold">索引</div>
            <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {index.length ? index.map((it) => (
                <li key={it.term}>{it.term} <span className="text-ink-faint text-xs">{it.refs.join(", ")}</span></li>
              )) : <li className="text-ink-faint">（索引なし）</li>}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
