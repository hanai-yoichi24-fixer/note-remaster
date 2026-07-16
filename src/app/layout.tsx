import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ノート美化AIリマスター",
  description: "手書きノートを、販売できる清書PDF教材に。アップロード → AI変換 → 人手補正 → ダウンロード。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
