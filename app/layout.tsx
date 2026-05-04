import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Definition — 多立场精神分析",
  description: "投一个问题，看不同立场如何折射它",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
