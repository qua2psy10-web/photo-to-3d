import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "photo-to-3d",
  description: "Photo to 3D — Week1 UI shell",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
