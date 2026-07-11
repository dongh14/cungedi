import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "开发验证夹具",
  description: "仅用于本地开发环境下验证地点提取流程的固定夹具页面。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevFixturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Development/test-only fixture routes. They stay out of the product UI and
  // are disabled in production so manual validation still goes through the real
  // extractor without exposing extra public pages.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return children;
}
