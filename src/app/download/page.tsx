"use client";

import * as React from "react";
import { Download, Smartphone, Shield, Zap, Bell, ExternalLink } from "lucide-react";

/**
 * صفحة تحميل التطبيق
 * الرابط: https://wazani-tv-live.vercel.app/download
 */
export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-dark via-emerald to-emerald-dark px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* أيقونة التطبيق */}
        <div className="mb-6 flex justify-center">
          <img
            src="/icon-512.png"
            alt="WazaNI TV"
            className="h-32 w-32 rounded-3xl shadow-2xl"
          />
        </div>

        {/* عنوان */}
        <h1 className="mb-2 text-center text-3xl font-extrabold text-white">
          WazaNI TV
        </h1>
        <p className="mb-8 text-center text-sm text-white/80">
          القنوات العربية ومباريات كرة القدم
        </p>

        {/* زر التثبيت */}
        <div className="mb-8">
          {isInstalled ? (
            <div className="rounded-2xl bg-white/10 p-6 text-center text-white backdrop-blur">
              <Shield className="mx-auto mb-2 h-10 w-10 text-emerald-light" />
              <p className="font-bold">التطبيق مثبت بالفعل! ✅</p>
              <p className="mt-1 text-xs text-white/70">
                افتحه من الشاشة الرئيسية
              </p>
            </div>
          ) : isIOS ? (
            <div className="rounded-2xl bg-white p-6 text-sm">
              <h3 className="mb-3 font-bold text-foreground">
                تثبيت على iPhone:
              </h3>
              <ol className="space-y-2 text-muted-foreground">
                <li>1. اضغط زر المشاركة ⬆️ في Safari</li>
                <li>2. اختر «إضافة إلى الشاشة الرئيسية»</li>
                <li>3. اضغط «إضافة»</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-emerald shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Download className="h-6 w-6" />
              {deferredPrompt ? "تثبيت التطبيق" : "جاري التحميل..."}
            </button>
          )}
        </div>

        {/* المميزات */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4 text-white backdrop-blur">
            <Zap className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <p className="font-bold">سريع</p>
              <p className="text-xs text-white/70">يفتح مباشرة من شاشتك</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4 text-white backdrop-blur">
            <Bell className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <p className="font-bold">إشعارات</p>
              <p className="text-xs text-white/70">تنبيه قبل المباريات</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-4 text-white backdrop-blur">
            <Smartphone className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <p className="font-bold">تطبيق حقيقي</p>
              <p className="text-xs text-white/70">أيقونة على شاشتك الرئيسية</p>
            </div>
          </div>
        </div>

        {/* رابط الموقع */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 underline hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            أو افتح الموقع في المتصفح
          </a>
        </div>
      </div>
    </div>
  );
}
