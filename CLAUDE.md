# ノート美化AIリマスター (note-remaster)

手書きノート画像を、AI清書 → HCI補正 → 目次・索引付きPDF に変換するWebアプリのMVP。

## 更新・再デプロイの原則（重要）
- **正本は GitHub リモート**。ローカルは作業コピー。壊れたら clone し直す。
- **Vercel プロジェクトは1リポにつき1つ。再 create 禁止**。更新は `git push` → CI 自動デプロイ。
- 本番URLは production alias（`<project>-<team>.vercel.app`）。per-deploy 固定URLを正本にしない。
- 修正は Cowork の `update-deploy`（clone→編集→push→CI監視→smoke）を既定入口にする。

## 技術構成
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase: Auth / Postgres / Storage（project ref は Vercel env に設定）
- AI変換・決済は **モック実装**（MVP）。本番差し替えポイントは下記。

## モック → 本番の差し替えポイント
- AI変換: `src/lib/mock-ai.ts` の `runConversion()`。`AI_MODE=live` + `ANTHROPIC_API_KEY` で
  Claude Vision 実装（`callClaudeVision`）に切替。理想は Supabase Edge Function 上で実行し
  クライアントにAPIキーを露出しない（要件どおり）。
- 決済: `src/app/api/jobs/[id]/pay/route.ts` のモック決済を Stripe Checkout Session +
  Webhook 署名検証に置換。
- PDF: 現在は印刷用HTML生成 + `window.print()`。要件どおり Puppeteer サーバ生成に置換可。
- メール通知: Resend 連携は未実装（Phase 2）。

## ディレクトリ
- `src/app/(app)/*` … 認証必須の画面（dashboard/upload/jobs/editor/pdf/admin）
- `src/app/api/*` … ジョブ作成・決済(mock)・変換(mock)・PDF生成
- `src/lib/*` … supabaseクライアント、型、markdown処理、mock-ai、plans

## ローカル起動
1. `.env.local` に `.env.example` の値を設定
2. `npm install && npm run dev`
