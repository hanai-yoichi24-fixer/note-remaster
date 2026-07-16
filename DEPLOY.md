# デプロイ手順（note-remaster）

## 冪等性ルール
- Vercel プロジェクトは**1リポにつき1つ**。初回 create に env を全部入れる。
- 以降の更新は `git push` → Vercel CI 自動デプロイ。**再 create しない**（-002 増殖事故防止）。

## 必要な環境変数（Vercel）
| キー | 用途 |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Supabase プロジェクトURL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | anon キー |
| SUPABASE_SERVICE_ROLE_KEY | PDF保存等のサーバ処理（RLSバイパス） |
| NEXT_PUBLIC_APP_URL | 本番URL |
| ANTHROPIC_API_KEY / AI_MODE=live | （任意）実AI変換に切替 |

## Supabase Auth 設定
- 本番デプロイ後、Auth の Site URL / Redirect URLs を本番URLに更新
  （Cowork の `supabase-set-auth-url`）。
- デモを簡単にするため、Email confirmation を OFF にすると登録後すぐログイン可。

## DB
- スキーマ・RLS・Storageバケットは Supabase 側に構築済み（migration は本番運用で管理下に）。
