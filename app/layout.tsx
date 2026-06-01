import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Short URL Admin",
  description: "基于 Next.js 和 Cloudflare 的短链接系统",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="min-h-full bg-neutral-50">
      <body className="min-h-screen bg-neutral-50 font-sans text-neutral-950 antialiased selection:bg-neutral-950 selection:text-white">
        {children}
      </body>
    </html>
  );
}
