export type UserRole = "seller" | "buyer" | "operator" | "admin";
export type JobStatus = "pending" | "processing" | "review" | "completed" | "failed";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  plan_type: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface ConversionJob {
  id: string;
  user_id: string;
  title: string;
  status: JobStatus;
  page_count: number;
  plan_type: string;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface NotePage {
  id: string;
  job_id: string;
  page_order: number;
  original_image_url: string | null;
  ai_markdown: string | null;
  corrected_markdown: string | null;
  correction_note: string | null;
  is_approved: boolean;
}

export interface TocItem { level: number; title: string; anchor: string; }
export interface IndexItem { term: string; refs: string[]; }

export interface PdfOutput {
  id: string;
  job_id: string;
  storage_path: string | null;
  download_url: string | null;
  template_id: string;
  index_json: IndexItem[] | null;
  toc_json: TocItem[] | null;
  generated_at: string;
  expires_at: string | null;
}
