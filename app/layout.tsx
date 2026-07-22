import type { Metadata, Viewport } from "next";
import { Geist, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const libre = Libre_Baskerville({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Signal — 高质量思想流",
  description: "只刷值得你注意的思想。轻点翻译，上滑下一条。",
  applicationName: "Signal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Signal",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-180.png",
  },
  openGraph: {
    title: "Signal — Ideas worth your attention.",
    description: "A private, distraction-free stream of high-quality ideas.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal — Ideas worth your attention.",
    description: "A private, distraction-free stream of high-quality ideas.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#11110f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geist.variable} ${libre.variable}`}>{children}</body>
    </html>
  );
}
