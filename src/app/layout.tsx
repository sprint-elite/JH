import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "대지나염 | 정직한 단체티 나염",
    template: "%s | 대지나염",
  },
  description:
    "반팔티, 카라티, 후드·맨투맨을 나염으로 1장부터 제작하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "대지나염",
    title: "대지나염 | 정직한 단체티 나염",
    description:
      "반팔티, 카라티, 후드·맨투맨을 나염으로 1장부터 제작하세요.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "대지나염 | 정직한 단체티 나염",
    description:
      "반팔티, 카라티, 후드·맨투맨을 나염으로 1장부터 제작하세요.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
