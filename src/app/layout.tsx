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
    "驚蟄時節，線上打小人出氣筒。輸入讓你勞氣的人事物，用拖鞋、長針、九節鞭、桃木劍拍打紙人，咒語飄動、紙人顫抖，舒緩心頭之火。",
  keywords: [
    "打小人",
    "驚蟄",
    "出氣",
    "紙紮",
    "小人祭壇",
    "拖鞋打小人",
    "線上紓壓",
  ],
  authors: [{ name: "Crystal32378" }],
  icons: {
    icon: "/favicon.svg",
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
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${notoSerifTC.variable} antialiased bg-[#1a0808] text-[#f5e6d0]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
