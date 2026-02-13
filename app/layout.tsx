import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "SENSE-GUARD | 청각장애인을 위한 AI 소리 감지 앱",
  description: "Hear Less. Sense More. AI 기반 소리 감지로 위험을 실시간 알림. 재난 정보, 긴급 알림을 제공합니다.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "SENSE-GUARD",
    description: "청각장애인을 위한 AI 소리 감지 앱 - Hear Less. Sense More.",
    url: "https://sense-guard.vercel.app",
    siteName: "SENSE-GUARD",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "SENSE-GUARD Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SENSE-GUARD",
    description: "청각장애인을 위한 AI 소리 감지 앱",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-200 flex justify-center items-center min-h-screen`}
      >
        <div className="w-full max-w-md min-h-screen bg-white relative shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
