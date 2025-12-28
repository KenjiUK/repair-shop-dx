import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProvider } from "@/components/providers/navigation-provider";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { SWRProvider } from "@/components/providers/swr-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // フォント読み込み中のテキスト表示を最適化
  preload: true, // フォントのプリロードを有効化
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // フォント読み込み中のテキスト表示を最適化
  preload: false, // モノスペースフォントは使用頻度が低いためプリロードしない
});

export const metadata: Metadata = {
  title: "ワイエムワークスデジタルガレージ",
  description: "整備工場業務管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SWRProvider>
          <NavigationProvider>
            <AppLayoutClient>
              {children}
            </AppLayoutClient>
          </NavigationProvider>
          <FeedbackButton />
          <Toaster 
            richColors 
            position="top-right"
            toastOptions={{
              duration: 4000,
            }}
            closeButton
            expand={true}
            visibleToasts={5}
          />
        </SWRProvider>
      </body>
    </html>
  );
}
