export interface Plan {
  id: string;
  name: string;
  pricePerPage: number;
  maxPages: number;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "light",
    name: "ライト",
    pricePerPage: 120,
    maxPages: 5,
    features: ["AI清書・構造化", "自動目次・索引", "標準PDFテンプレート"],
  },
  {
    id: "standard",
    name: "スタンダード",
    pricePerPage: 200,
    maxPages: 12,
    features: ["ライトの全機能", "HCIオペレーターによる人手補正", "キーワードハイライト"],
    highlight: true,
  },
  {
    id: "pro",
    name: "プロ",
    pricePerPage: 320,
    maxPages: 20,
    features: ["スタンダードの全機能", "個人情報の自動伏字化", "優先処理・品質レビュー"],
  },
];

export function planById(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1];
}

export function estimatePrice(planId: string, pageCount: number): number {
  const plan = planById(planId);
  return plan.pricePerPage * Math.max(1, pageCount);
}
