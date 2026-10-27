"use client";

import * as React from "react";
import { Download, X, Smartphone, Share } from "lucide-react";
import { toast } from "sonner";

/**
 * زر تثبيت التطبيق (PWA Install)
 *
 * يعمل كـ APK حقيقي على الأندرويد:
 * - يستخدم beforeinstallprompt event لعرض زر التثبيت
 * - عند الضغط، يفتح نافذة تثبيت التطبيق (مثل تثبيت APK)
 * - التطبيق يثبّت على الشاشة الرئيسية بأيقونتك الحالية
 *
 * على iOS (Safari): يعرض تعليمات "إضافة إلى الشاشة الرئيسية"
 * على الديسكتوب: يعرض زر تثبيت التطبيق
 */
export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showButton, setShowButton] = React.useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // تحقق إذا التطبيق مثبت بالفعل
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // استمع لحدث beforeinstallprompt (أندرويد Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // استمع لحدث appinstalled
    const installedHandler = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      toast.success("تم تثبيت التطبيق بنجاح! 🎉");
    };
    window.addEventListener("appinstalled", installedHandler);

    // اكتشف iOS (لا يدعم beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // اعرض زر التثبيت بعد 3 ثوانٍ على iOS
      const t = setTimeout(() => setShowButton(true), 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handler);
        window.removeEventListener("appinstalled", installedHandler);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    // iOS: اعرض التعليمات
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // أندرويد/ديسكتوب: استخدم deferredPrompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("جاري تثبيت التطبيق...");
      }
      setDeferredPrompt(null);
      setShowButton(false);
    }
  };

  // لا تظهر الزر إذا التطبيق مثبت أو لا يوجد prompt
  if (isInstalled || !showButton) return null;

  return (
    <>
      {/* زر تثبيت التطبيق */}
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald to-emerald-dark px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
        aria-label="تثبيت التطبيق"
      >
        <Download className="h-4 w-4" />
        تثبيت التطبيق
      </button>

      {/* تعليمات iOS */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                تثبيت التطبيق على iPhone
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                  1
                </span>
                <p>
                  اضغط زر المشاركة{" "}
                  <Share className="inline h-4 w-4 text-emerald" /> في شريط
                  Safari السفلي
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                  2
                </span>
                <p>
                  اختر{" "}
                  <strong className="text-foreground">
                    «إضافة إلى الشاشة الرئيسية»
                  </strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                  3
                </span>
                <p>
                  اضغط{" "}
                  <strong className="text-foreground">«إضافة»</strong> —
                  ستظهر أيقونة WazaNI TV على شاشتك الرئيسية
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald/10 p-3 text-xs text-emerald">
              <Smartphone className="h-4 w-4 shrink-0" />
              <p>التطبيق سيعمل كأنه تطبيق أصلي — يفتح بسرعة بدون متصفح</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
