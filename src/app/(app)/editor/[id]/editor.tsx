"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { renderHtml, buildToc, buildIndex } from "@/lib/markdown";
import { Button } from "@/components/ui/Button";
import type { NotePage, ConversionJob } from "@/lib/types";
import { Check, Save, Eye, PencilLine, ImageIcon, RotateCcw, Loader2, FileDown } from "lucide-react";

export default function Editor({ job, pages, imageUrls }: {
  job: ConversionJob; pages: NotePage[]; imageUrls: Record<string, string>;
}) {
  const router = useRouter();
  const [items, setItems] = useState(() =>
    pages.map((p) => ({ ...p, corrected_markdown: p.corrected_markdown ?? p.ai_markdown ?? "" }))
  );
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [saved, setSaved] = useState(false);

  const page = items[active];
  const changed = page && page.corrected_markdown !== (page.ai_markdown ?? "");

  const previewHtml = useMemo(() => {
    if (!page) return "";
    const md = page.corrected_markdown;
    return renderHtml(md, { toc: buildToc(md), index: buildIndex(md) });
  }, [page]);

  function update(v: string) {
    setItems((prev) => prev.map((it, i) => (i === active ? { ...it, corrected_markdown: v } : it)));
    setSaved(false);
  }
  function revert() {
    setItems((prev) => prev.map((it, i) => (i === active ? { ...it, corrected_markdown: it.ai_markdown ?? "" } : it)));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("note_pages")
      .update({ corrected_markdown: page.corrected_markdown })
      .eq("id", page.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function toggleApprove() {
    const next = !page.is_approved;
    setItems((prev) => prev.map((it, i) => (i === active ? { ...it, is_approved: next } : it)));
    const supabase = createClient();
    await supabase.from("note_pages")
      .update({ corrected_markdown: page.corrected_markdown, is_approved: next })
      .eq("id", page.id);
  }

  async function finish() {
    setFinishing(true);
    const supabase = createClient();
    // persist all pages
    for (const it of items) {
      await supabase.from("note_pages")
        .update({ corrected_markdown: it.corrected_markdown, is_approved: true })
        .eq("id", it.id);
    }
    const res = await fetch(`/api/pdf/${job.id}`, { method: "POST" });
    setFinishing(false);
    if (res.ok) { router.push(`/pdf/${job.id}`); router.refresh(); }
  }

  const approvedCount = items.filter((i) => i.is_approved).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">HCI補正エディタ — {job.title}</h1>
          <p className="text-sm text-ink-faint">AIの清書を確認し、レイアウトや文章を仕上げてください。承認 {approvedCount}/{items.length}</p>
        </div>
        <Button onClick={finish} disabled={finishing}>
          {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          承認してPDFを生成
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[180px_1fr]">
        {/* page rail */}
        <aside className="flex gap-2 overflow-x-auto lg:flex-col">
          {items.map((it, i) => (
            <button key={it.id} onClick={() => setActive(i)}
              className={"flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm " +
                (i === active ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
              <span className="font-medium">P.{it.page_order}</span>
              {it.is_approved && <Check className="h-3.5 w-3.5 text-green-600" />}
            </button>
          ))}
        </aside>

        {/* editor / preview */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <div className="flex gap-1">
              <button onClick={() => setMode("edit")} className={"flex items-center gap-1 rounded-md px-3 py-1.5 text-sm " + (mode === "edit" ? "bg-slate-100 font-medium" : "text-ink-faint")}><PencilLine className="h-4 w-4" />編集</button>
              <button onClick={() => setMode("preview")} className={"flex items-center gap-1 rounded-md px-3 py-1.5 text-sm " + (mode === "preview" ? "bg-slate-100 font-medium" : "text-ink-faint")}><Eye className="h-4 w-4" />プレビュー</button>
            </div>
            <div className="flex items-center gap-2">
              {changed && <span className="text-[11px] text-amber-600">AI出力から変更あり</span>}
              <button onClick={revert} title="AI出力に戻す" className="rounded-md p-1.5 text-ink-faint hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button>
              <button onClick={save} className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3 text-green-600" /> : <Save className="h-3 w-3" />}
                保存
              </button>
              <button onClick={toggleApprove} className={"flex items-center gap-1 rounded-md px-2 py-1 text-xs " + (page?.is_approved ? "bg-green-100 text-green-700" : "bg-brand-600 text-white")}>
                <Check className="h-3 w-3" />{page?.is_approved ? "承認済み" : "承認"}
              </button>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            {/* original image */}
            <div className="border-r border-slate-100 p-3">
              <div className="mb-2 flex items-center gap-1 text-xs text-ink-faint"><ImageIcon className="h-3.5 w-3.5" />元のノート画像</div>
              {page && imageUrls[page.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrls[page.id]} alt="original" className="w-full rounded-lg border border-slate-200" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50 text-xs text-ink-faint">画像プレースホルダー</div>
              )}
            </div>
            {/* edit or preview */}
            <div className="p-3">
              {mode === "edit" ? (
                <textarea value={page?.corrected_markdown ?? ""} onChange={(e) => update(e.target.value)}
                  className="h-[420px] w-full resize-none rounded-lg border border-slate-200 p-3 font-mono text-[13px] leading-6 focus:border-brand-500 focus:outline-none"
                  spellCheck={false} />
              ) : (
                <div className="prose-note h-[420px] overflow-auto rounded-lg border border-slate-100 p-3"
                  dangerouslySetInnerHTML={{ __html: previewHtml }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
