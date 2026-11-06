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
  title: "WazaNI TV | بث مباشر للقنوات العربية ومباريات كرة القدم",
  description: "WazaNI TV — شاهد القنوات العربية والمغربية مباشرة + مباريات كرة القدم بث مباشر مجاني. beIN Sports, MBC, 2M, الأولى, الجزيرة وأكثر من 130 قناة.",
  keywords: [
    "WazaNI TV",
    "بث مباشر",
    "قنوات عربية",
    "قنوات مغربية",
    "مباريات اليوم",
    "كرة القدم",
    "beIN Sports",
    "MBC",
    "2M",
    "الأولى",
    "الجزيرة",
    "البطولات",
    "دوري أبطال أوروبا",
    "الدوري الإنجليزي",
    "الدوري الإسباني",
    "الدوري السعودي",
    "بث مجاني",
    "مشاهدة القنوات",
    "تطبيق رياضي",
  ],
  authors: [{ name: "WazaNI TV" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WazaNI TV",
  },
  openGraph: {
    title: "WazaNI TV | بث مباشر للقنوات العربية ومباريات كرة القدم",
    description: "شاهد القنوات العربية والمغربية مباشرة + مباريات كرة القدم بث مباشر مجاني. أكثر من 130 قناة.",
    type: "website",
    siteName: "WazaNI TV",
    locale: "ar_AR",
    images: ["/wazani-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "WazaNI TV | بث مباشر للقنوات العربية ومباريات كرة القدم",
    description: "شاهد القنوات العربية والمغربية مباشرة + مباريات كرة القدم بث مباشر مجاني.",
    images: ["/wazani-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://wazani-tv-live.vercel.app",
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
        <meta name="google-site-verification" content="kGN5FFW_n_f5FC_6ArfiZWysPeFyAU0sISmaZV4TRcQ" />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "WazaNI TV",
              url: "https://wazani-tv-live.vercel.app",
              description: "بث مباشر للقنوات العربية والمغربية ومباريات كرة القدم مجانًا",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Web, Android, iOS",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              publisher: {
                "@type": "Organization",
                name: "WazaNI TV",
                logo: "https://wazani-tv-live.vercel.app/wazani-logo.png",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1200",
              },
            }),
          }}
        />
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
