import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Editor from "./editor";
import type { NotePage, ConversionJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditorPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: job } = await supabase.from("conversion_jobs").select("*").eq("id", params.id).single();
  if (!job) notFound();

  const { data: pages } = await supabase
    .from("note_pages").select("*").eq("job_id", params.id).order("page_order");

  // signed URLs for original images (24h)
  const signed: Record<string, string> = {};
  for (const p of (pages ?? []) as NotePage[]) {
    if (p.original_image_url) {
      const { data } = await supabase.storage.from("note-images")
        .createSignedUrl(p.original_image_url, 60 * 60 * 24);
      if (data?.signedUrl) signed[p.id] = data.signedUrl;
    }
  }

  return <Editor job={job as ConversionJob} pages={(pages ?? []) as NotePage[]} imageUrls={signed} />;
}
