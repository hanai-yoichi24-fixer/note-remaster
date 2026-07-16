// ---------------------------------------------------------------------------
// AI 構造解析・清書エンジン（モック）
//
// 本番では Supabase Edge Function 上で Claude Vision API を呼び、
// 画像URL群 -> 構造化Markdown を返す想定。ここではキーが無効なため、
// 決定論的なモックで「らしい」清書結果を生成する。runConversion() の
// シグネチャは本番実装と同じにしてあり、AI_MODE=live + ANTHROPIC_API_KEY
// があれば callClaudeVision() に差し替えるだけで切り替えられる。
// ---------------------------------------------------------------------------

export interface PageInput { pageOrder: number; imageUrl: string; }
export interface PageResult { pageOrder: number; markdown: string; }

const TOPICS = [
  {
    h: "情報アーキテクチャの基礎",
    body: [
      "本ページでは、ユーザーが情報を探し当てるための構造設計について整理する。",
      "### 1. 組織化の5原則 (LATCH)",
      "- **Location（場所）**: 地理・空間で並べる",
      "- **Alphabet（五十音・アルファベット）**: 名称順で並べる",
      "- **Time（時間）**: 時系列で並べる",
      "- **Category（カテゴリー）**: 種類で分類する",
      "- **Hierarchy（階層）**: 大小・重要度で並べる",
      "",
      "> 補足: 実務では複数の原則を組み合わせる。まず「利用者が何をキーに探すか」を決めることが重要。",
    ],
  },
  {
    h: "認知負荷とインタラクション設計",
    body: [
      "人間の短期記憶には限界があり、一度に扱える情報の塊は概ね **7±2** とされる。",
      "### 主要な指標",
      "1. **ヒックの法則**: 選択肢が増えるほど決定に時間がかかる",
      "2. **フィッツの法則**: 対象が近く大きいほど到達が速い",
      "3. **ミラーの法則**: チャンク化により記憶保持を助ける",
      "",
      "数式例: 決定時間 $T = a + b\\log_2(n+1)$",
      "",
      "画面設計では「選択肢を減らす」「関連要素をまとめる」ことで認知負荷を下げる。",
    ],
  },
  {
    h: "ユーザビリティ評価手法",
    body: [
      "### ニールセンの10原則（抜粋）",
      "- システム状態の可視化",
      "- 現実世界との一致",
      "- ユーザーによる制御と自由",
      "- 一貫性と標準化",
      "- エラーの予防",
      "",
      "評価は **ヒューリスティック評価** と **ユーザーテスト** を併用する。前者は専門家が原則に照らして問題を洗い出し、後者は実際の利用者の行動を観察する。",
      "",
      "| 手法 | コスト | 発見できる問題 |",
      "| --- | --- | --- |",
      "| ヒューリスティック | 低 | 設計原則違反 |",
      "| ユーザーテスト | 中 | 実利用での躓き |",
    ],
  },
];

export function mockPageMarkdown(pageOrder: number): string {
  const t = TOPICS[(pageOrder - 1) % TOPICS.length];
  const lines = [`## ${t.h}`, "", ...t.body, ""];
  return lines.join("\n");
}

// Public entry — same signature intended for the live implementation.
export async function runConversion(pages: PageInput[]): Promise<PageResult[]> {
  const mode = process.env.AI_MODE ?? "mock";
  if (mode === "live" && process.env.ANTHROPIC_API_KEY) {
    // return callClaudeVision(pages)  // ← 本番差し替えポイント
  }
  // simulate processing latency lightly
  return pages
    .sort((a, b) => a.pageOrder - b.pageOrder)
    .map((p) => ({ pageOrder: p.pageOrder, markdown: mockPageMarkdown(p.pageOrder) }));
}
