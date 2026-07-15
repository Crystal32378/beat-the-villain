import type { Metadata } from "next";
import { Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "線上打小人出氣筒 · 驚蟄祭壇",
  description:
    "驚蟄時節，線上打小人出氣筒。輸入令你勞氣的人事物，拖鞋、桃木劍、五雷符一一招呼，咒語纏繞、紙人顫抖，為你掃走晦氣、迎來好運。",
  keywords: [
    "打小人",
    "驚蟄",
    "出氣",
    "紙紮",
    "小人祭壇",
    "拖鞋打小人",
    "香港習俗",
  ],
  authors: [{ name: "線上打小人出氣筒" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "線上打小人出氣筒 · 驚蟄祭壇",
    description: "驚蟄時節線上打小人，掃走晦氣、迎來好運。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" suppressHydrationWarning>
      <body
        className={`${notoSerifTC.variable} antialiased bg-[#1a0808] text-[#f5e6d0]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
