import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runConversion } from "@/lib/mock-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AI 構造解析・清書生成。既定はモック（mock-ai）。AI_MODE=live で Claude Vision に切替。
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobId = params.id;
  const { data: job } = await supabase.from("conversion_jobs").select("*").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  if (!job.paid_at) return NextResponse.json({ error: "payment required" }, { status: 402 });

  const { data: pages } = await supabase
    .from("note_pages").select("id, page_order, original_image_url")
    .eq("job_id", jobId).order("page_order");

  if (!pages || pages.length === 0)
    return NextResponse.json({ error: "no pages" }, { status: 400 });

  try {
    const results = await runConversion(
      pages.map((p) => ({ pageOrder: p.page_order, imageUrl: p.original_image_url ?? "" }))
    );
    const byOrder = new Map(results.map((r) => [r.pageOrder, r.markdown]));
    for (const p of pages) {
      const md = byOrder.get(p.page_order) ?? "";
      await supabase.from("note_pages")
        .update({ ai_markdown: md, corrected_markdown: md })
        .eq("id", p.id);
    }
    await supabase.from("conversion_jobs").update({ status: "review" }).eq("id", jobId);
    return NextResponse.json({ ok: true, pages: results.length });
  } catch (e: any) {
    await supabase.from("conversion_jobs").update({ status: "failed" }).eq("id", jobId);
    return NextResponse.json({ error: e?.message || "conversion failed" }, { status: 500 });
  }
}
