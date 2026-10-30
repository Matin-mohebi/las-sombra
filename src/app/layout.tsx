import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "لاس سومبرا — بازی اکشن دنیای باز سه‌بعدی",
  description:
    "دنیای باز سه‌بعدی با ترکیب حال‌وهوای GTA و وسترن: ماشین‌سواری و تعقیب‌وگریز پلیس در شهر، اسب‌سواری و شش‌لول در بیابان. ساخته‌شده با Three.js و Next.js — سازگار با ویندوز، اندروید و آیفون.",
  keywords: ["بازی", "دنیای باز", "GTA", "وسترن", "Three.js", "سه‌بعدی", "اندروید", "ویندوز", "آیفون", "PWA"],
  authors: [{ name: "Las Sombra" }],
  applicationName: "لاس سومبرا",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0c10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
        {/* PWA / installable on Android, iPhone (Add to Home Screen) and desktop browsers */}
        <link rel="manifest" href="manifest.webmanifest" />
        <link rel="icon" href="favicon.ico" sizes="32x48" />
        <link rel="icon" href="icon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="apple-touch-icon.png" sizes="180x180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="لاس سومبرا" />
        <meta name="application-name" content="لاس سومبرا" />
      </head>
      <body className="antialiased bg-[#0a0c10] text-[#f0e8d8] overflow-hidden overscroll-none">
        {children}
      </body>
    </html>
  );
}
