import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OhMe — 你的内在人格工坊",
  description: "构建不同人格Agent，探索自我、疗愈内心、解决问题",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
