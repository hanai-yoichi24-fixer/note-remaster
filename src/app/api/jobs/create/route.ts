import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { planById, estimatePrice } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const title: string = (body.title || "無題のノート").toString().slice(0, 120);
  const planId: string = body.planId || "standard";
  const pageCount: number = Math.max(1, Math.min(20, Number(body.pageCount) || 1));
  const plan = planById(planId);

  const { data: job, error } = await supabase
    .from("conversion_jobs")
    .insert({ user_id: user.id, title, plan_type: plan.id, page_count: pageCount, status: "pending" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    jobId: job.id,
    userId: user.id,
    amount: estimatePrice(plan.id, pageCount),
  });
}
