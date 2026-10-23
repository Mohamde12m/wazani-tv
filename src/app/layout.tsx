import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

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
  manifest: undefined,
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
