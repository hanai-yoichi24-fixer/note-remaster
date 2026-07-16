import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planById, estimatePrice } from "@/lib/plans";

export const dynamic = "force-dynamic";

// MOCK payment. Records a paid payment row, registers uploaded pages,
// and moves the job to "processing". In production this would be driven by a
// Stripe Checkout Session + webhook (see docs). The signature keeps that swap easy.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobId = params.id;
  const body = await req.json().catch(() => ({}));
  const pages: { pageOrder: number; storagePath: string }[] = body.pages || [];

  const { data: job, error: jobErr } = await supabase
    .from("conversion_jobs").select("*").eq("id", jobId).single();
  if (jobErr || !job) return NextResponse.json({ error: "job not found" }, { status: 404 });

  // register note_pages
  if (pages.length) {
    const rows = pages.map((p) => ({
      job_id: jobId, page_order: p.pageOrder, original_image_url: p.storagePath, is_approved: false,
    }));
    const { error: pErr } = await supabase.from("note_pages").insert(rows);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });
  }

  const amount = estimatePrice(job.plan_type, pages.length || job.page_count);

  await supabase.from("payments").insert({
    user_id: user.id, job_id: jobId,
    stripe_session_id: "mock_" + Math.random().toString(36).slice(2, 10),
    amount_jpy: amount, status: "paid", paid_at: new Date().toISOString(),
  });

  await supabase.from("conversion_jobs").update({
    status: "processing", paid_at: new Date().toISOString(),
    page_count: pages.length || job.page_count,
  }).eq("id", jobId);

  return NextResponse.json({ ok: true, amount });
}
