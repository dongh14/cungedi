import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "餐厅收集器 | Restaurant Collector",
    template: "%s | 餐厅收集器",
  },
  description: "帮助你保存旅行中发现的餐厅线索，并在之后轻松找回。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
