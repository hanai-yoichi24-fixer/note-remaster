"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Poll for status changes while the job is still processing.
export default function JobStatusWatcher({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;
    const t = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(t);
  }, [jobId, status, router]);
  return null;
}
