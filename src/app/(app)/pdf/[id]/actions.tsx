"use client";
import { Button, LinkButton } from "@/components/ui/Button";
import { Printer, Download, Share2 } from "lucide-react";

export default function PdfActions({ title, downloadUrl, expiresAt }: {
  title: string; downloadUrl: string | null; expiresAt: string | null;
}) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title, url }); return; } catch {} }
    await navigator.clipboard.writeText(url);
    alert("リンクをコピーしました");
  }
  return (
    <div className="flex items-center gap-2">
      {downloadUrl && (
        <a href={downloadUrl} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
          <Download className="h-4 w-4" />保存版(HTML)
        </a>
      )}
      <Button onClick={() => window.print()}><Printer className="h-4 w-4" />PDFとして保存 / 印刷</Button>
      <button onClick={share} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">
        <Share2 className="h-4 w-4" />共有
      </button>
    </div>
  );
}
