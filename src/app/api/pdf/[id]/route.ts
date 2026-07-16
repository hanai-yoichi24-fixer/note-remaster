import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { buildToc, buildIndex, renderHtml } from "@/lib/markdown";
import type { NotePage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// PDF出力: 補正済みMarkdownを結合し、目次・索引・ハイライト付きの印刷用HTMLを
// 生成してStorage(pdf-outputs)に保存、24時間有効の署名付きURLを発行する。
// 印刷/PDF化はブラウザ側(window.print())で行うMVP方式。将来Puppeteerに差し替え可。
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobId = params.id;
  const { data: job } = await supabase.from("conversion_jobs").select("*").eq("id", jobId).single();
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });

  const { data: pages } = await supabase
    .from("note_pages").select("*").eq("job_id", jobId).order("page_order");
  const list = (pages ?? []) as NotePage[];

  const combined = list.map((p) => p.corrected_markdown ?? p.ai_markdown ?? "").join("\n\n");
  const toc = buildToc(combined);
  const index = buildIndex(combined);
  const bodyHtml = renderHtml(combined, { toc, index });

  const doc = htmlDocument(job.title, toc, index, bodyHtml);

  // upload rendered HTML to storage with service role (path under user folder)
  const svc = createServiceClient();
  const path = `${job.user_id}/${jobId}.html`;
  await svc.storage.from("pdf-outputs").upload(path, new Blob([doc], { type: "text/html" }), {
    upsert: true, contentType: "text/html",
  });
  const { data: signed } = await svc.storage.from("pdf-outputs").createSignedUrl(path, 60 * 60 * 24);

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // upsert pdf_outputs (delete old for this job to keep single latest)
  await supabase.from("pdf_outputs").delete().eq("job_id", jobId);
  await supabase.from("pdf_outputs").insert({
    job_id: jobId, storage_path: path, download_url: signed?.signedUrl ?? null,
    template_id: "default", index_json: index, toc_json: toc, expires_at: expires,
  });

  await supabase.from("conversion_jobs").update({
    status: "completed", completed_at: new Date().toISOString(),
  }).eq("id", jobId);

  return NextResponse.json({ ok: true, downloadUrl: signed?.signedUrl ?? null });
}

function htmlDocument(title: string, toc: any[], index: any[], body: string): string {
  const tocHtml = toc.map((t) =>
    `<li style="margin-left:${(t.level - 2) * 16}px"><a href="#${t.anchor}">${t.title}</a></li>`).join("");
  const indexHtml = index.map((i) => `<li>${i.term} <span class="ref">${i.refs.join(", ")}</span></li>`).join("");
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:"Hiragino Kaku Gothic ProN","Meiryo",system-ui,sans-serif;color:#0f172a;margin:0;padding:40px;line-height:1.7;}
  .cover{text-align:center;padding:60px 0;border-bottom:3px solid #1f43f5;margin-bottom:24px;}
  .cover h1{font-size:28px;margin:0;}
  .cover .sub{color:#64748b;margin-top:8px;font-size:13px;}
  h2{font-size:20px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-top:28px;}
  h3{font-size:15px;color:#1a2bb6;margin-top:18px;}
  table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px;}
  th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left;}
  th{background:#f1f5f9;}
  blockquote{border-left:4px solid #8eb4ff;background:#eef4ff;margin:12px 0;padding:6px 12px;color:#334155;}
  mark.kw{background:#fef08a;border-radius:2px;padding:0 2px;}
  .toc,.index{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0;}
  .toc h2,.index h2{border:none;margin-top:0;font-size:16px;}
  .toc ul{list-style:none;padding-left:0;} .toc a{color:#1f43f5;text-decoration:none;}
  .index ul{columns:2;font-size:13px;} .index .ref{color:#94a3b8;font-size:11px;}
  @media print{ body{padding:0;} .toc,.index{break-inside:avoid;} }
</style></head><body>
<div class="cover"><h1>${escapeHtml(title)}</h1><div class="sub">ノート美化AIリマスター — 清書教材PDF</div></div>
<div class="toc"><h2>目次</h2><ul>${tocHtml || "<li>（見出しなし）</li>"}</ul></div>
${body}
<div class="index"><h2>索引</h2><ul>${indexHtml || "<li>（索引なし）</li>"}</ul></div>
</body></html>`;
}
function escapeHtml(s: string){return s.replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c] as string));}
