"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS, planById, estimatePrice } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { UploadCloud, X, ImageIcon, CreditCard, Loader2, Check } from "lucide-react";

type Step = "idle" | "creating" | "uploading" | "paying" | "converting" | "done";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [planId, setPlanId] = useState("standard");
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const plan = planById(planId);
  const price = estimatePrice(planId, Math.max(1, files.length));

  const addFiles = useCallback((fl: FileList | null) => {
    if (!fl) return;
    const imgs = Array.from(fl).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...imgs].slice(0, plan.maxPages));
  }, [plan.maxPages]);

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit() {
    if (files.length === 0) { setErr("画像を1枚以上追加してください。"); return; }
    setErr(null);
    const supabase = createClient();
    try {
      // 1) create job
      setStep("creating"); setProgress("ジョブを作成中...");
      const cr = await fetch("/api/jobs/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || files[0].name, planId, pageCount: files.length }),
      });
      const crJson = await cr.json();
      if (!cr.ok) throw new Error(crJson.error || "作成に失敗");
      const { jobId, userId } = crJson;

      // 2) upload images to storage
      setStep("uploading");
      const pages: { pageOrder: number; storagePath: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`画像をアップロード中... (${i + 1}/${files.length})`);
        const ext = (files[i].name.split(".").pop() || "jpg").toLowerCase();
        const path = `${userId}/${jobId}/${String(i + 1).padStart(3, "0")}.${ext}`;
        const { error: upErr } = await supabase.storage.from("note-images")
          .upload(path, files[i], { upsert: true, contentType: files[i].type });
        if (upErr) throw new Error("アップロード失敗: " + upErr.message);
        pages.push({ pageOrder: i + 1, storagePath: path });
      }

      // 3) mock payment
      setStep("paying"); setProgress("お支払いを処理中... (モック決済)");
      const pay = await fetch(`/api/jobs/${jobId}/pay`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      if (!pay.ok) throw new Error((await pay.json()).error || "決済に失敗");

      // 4) AI conversion (mock)
      setStep("converting"); setProgress("AIがノートを構造解析・清書しています...");
      const conv = await fetch(`/api/jobs/${jobId}/convert`, { method: "POST" });
      if (!conv.ok) throw new Error((await conv.json()).error || "変換に失敗");

      setStep("done"); setProgress("完了しました。補正エディタへ移動します...");
      setTimeout(() => { router.push(`/editor/${jobId}`); router.refresh(); }, 900);
    } catch (e: any) {
      setErr(e.message || "エラーが発生しました");
      setStep("idle");
    }
  }

  const busy = step !== "idle" && step !== "done";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">ノートをアップロード</h1>
      <p className="text-sm text-ink-faint">JPG / PNG を最大 {plan.maxPages} 枚まで。まとめて変換できます。</p>

      {/* dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className="mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:border-brand-400"
      >
        <UploadCloud className="mx-auto h-10 w-10 text-brand-500" />
        <p className="mt-2 font-medium">ここにドラッグ&ドロップ、またはクリックして選択</p>
        <p className="text-xs text-ink-faint">複数枚まとめて選択できます</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => addFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((f, i) => (
            <div key={i} className="relative rounded-lg border border-slate-200 bg-white p-2">
              <div className="flex h-20 items-center justify-center overflow-hidden rounded bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
              </div>
              <div className="mt-1 truncate text-[10px] text-ink-faint">{i + 1}. {f.name}</div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 shadow"><X className="h-4 w-4 text-slate-500" /></button>
            </div>
          ))}
        </div>
      )}

      {/* title */}
      <div className="mt-6">
        <label className="text-sm font-medium">タイトル</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：認知心理学 第3回 講義ノート"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
      </div>

      {/* plan */}
      <div className="mt-6">
        <label className="text-sm font-medium">プラン</label>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => (
            <button key={p.id} onClick={() => setPlanId(p.id)}
              className={"rounded-xl border p-3 text-left transition " + (planId === p.id ? "border-brand-500 ring-1 ring-brand-200 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300")}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                {planId === p.id && <Check className="h-4 w-4 text-brand-600" />}
              </div>
              <div className="text-sm text-ink-soft">¥{p.pricePerPage} / ページ</div>
              <div className="text-[11px] text-ink-faint">最大{p.maxPages}枚</div>
            </button>
          ))}
        </div>
      </div>

      {/* summary + checkout */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">{plan.name}プラン × {files.length || 0}ページ</span>
          <span className="text-xl font-bold">¥{price.toLocaleString()}</span>
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">※ デモ環境のため、決済はモックです（実際の請求は発生しません）。</p>

        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        {busy && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <Loader2 className="h-4 w-4 animate-spin" />{progress}
          </div>
        )}
        {step === "done" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <Check className="h-4 w-4" />{progress}
          </div>
        )}

        <Button onClick={onSubmit} disabled={busy || step === "done" || files.length === 0} className="mt-4 w-full">
          <CreditCard className="h-4 w-4" />決済して変換を開始する
        </Button>
      </div>
    </div>
  );
}
