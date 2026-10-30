import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { OneSignalProvider } from "@/components/shared/onesignal-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WazaNI TV | القنوات العربية ومباريات كرة القدم",
  description: "تطبيق WazaNI TV لمتابعة القنوات التلفزيونية العربية وجدول مباريات كرة القدم بتصميم عصري وفاخر.",
  keywords: ["WazaNI", "قنوات عربية", "مباريات", "كرة القدم", "بث مباشر", "البطولات"],
  authors: [{ name: "WazaNI TV" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WazaNI TV",
  },
  openGraph: {
    title: "WazaNI TV",
    description: "القنوات العربية ومباريات كرة القدم",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6e4f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WazaNI TV" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="monetag" content="01972d802a9fb14f20f046b76d02edb5" />
      </head>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
          <OneSignalProvider />
          <PWARegister />
          {/* Monetag Vignette Ad — يعمل على客户端 فقط */}
          <Script
            id="monetag-vignette"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(s){s.dataset.zone='12156403',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * تسجيل Service Worker لجعل التطبيق PWA قابلًا للتثبيت
 * ويعمل بلا اتصال (آخر قنوات شاهدها المستخدم).
 */
function PWARegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          });
        }`,
      }}
    />
  );
}
