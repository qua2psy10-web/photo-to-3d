import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "photo-to-3d",
  description:
    "複数角度の写真から、この Mac 上のフォトグラメトリで 3D モデルを作ります。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
