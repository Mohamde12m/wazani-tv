"use client";

import * as React from "react";
import { Download, X, Smartphone, Share, Chrome, Info } from "lucide-react";
import { toast } from "sonner";

/**
 * زر تثبيت التطبيق (PWA Install)
 *
 * يعمل كـ APK حقيقي على الأندرويد:
 * - يستخدم beforeinstallprompt event لعرض زر التثبيت
 * - إذا لم يتوفر الحدث، يعرض تعليمات يدوية للتثبيت
 * - على iOS (Safari): يعرض تعليمات "إضافة إلى الشاشة الرئيسية"
 */
export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showButton, setShowButton] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [instructionsType, setInstructionsType] = React.useState<"ios" | "android" | "desktop">("android");
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // تحقق إذا التطبيق مثبت بالفعل
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // استمع لحدث beforeinstallprompt (أندرويد Chrome + Desktop)
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

    // اعرض الزر دائمًا (حتى لو لم يطلق الحدث — سنعرض تعليمات بديلة)
    // بعد 2 ثانية من تحميل الصفحة
    const t = setTimeout(() => setShowButton(true), 2000);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    // iOS: اعرض تعليمات iOS
    if (isIOS) {
      setInstructionsType("ios");
      setShowInstructions(true);
      return;
    }

    // إذا توفر beforeinstallprompt، استخدمه
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          toast.success("جاري تثبيت التطبيق...");
        }
        setDeferredPrompt(null);
        setShowButton(false);
      } catch {
        // إذا فشل، اعرض تعليمات بديلة
        setInstructionsType(isMobile ? "android" : "desktop");
        setShowInstructions(true);
      }
      return;
    }

    // إذا لم يتوفر beforeinstallprompt، اعرض تعليمات يدوية
    setInstructionsType(isMobile ? "android" : "desktop");
    setShowInstructions(true);
  };

  // لا تظهر الزر إذا التطبيق مثبت
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

      {/* تعليمات التثبيت */}
      {showInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {instructionsType === "ios"
                  ? "تثبيت على iPhone"
                  : instructionsType === "desktop"
                  ? "تثبيت على الكمبيوتر"
                  : "تثبيت التطبيق"}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {instructionsType === "ios" && (
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
            )}

            {instructionsType === "android" && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald/10 p-2.5 text-xs text-emerald">
                  <Chrome className="h-4 w-4 shrink-0" />
                  <p>استخدم متصفح Chrome للحصول على أفضل تجربة</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                    1
                  </span>
                  <p>
                    اضغط زر القائمة{" "}
                    <strong className="text-foreground">⋮</strong> في أعلى
                    يمين Chrome
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                    2
                  </span>
                  <p>
                    اختر{" "}
                    <strong className="text-foreground">
                      «تثبيت التطبيق»
                    </strong>{" "}
                    أو{" "}
                    <strong className="text-foreground">
                      «Add to Home screen»
                    </strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                    3
                  </span>
                  <p>
                    اضغط{" "}
                    <strong className="text-foreground">«تثبيت»</strong> —
                    ستظهر أيقونة WazaNI TV على شاشتك الرئيسية
                  </p>
                </div>
              </div>
            )}

            {instructionsType === "desktop" && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                    1
                  </span>
                  <p>
                    اضغط زر القائمة{" "}
                    <strong className="text-foreground">⋮</strong> في أعلى
                    يمين Chrome
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                    2
                  </span>
                  <p>
                    اختر{" "}
                    <strong className="text-foreground">
                      «تثبيت WazaNI TV»
                    </strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald text-xs font-bold text-white">
                    3
                  </span>
                  <p>ستظهر أيقونة التطبيق على سطح المكتب</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald/10 p-3 text-xs text-emerald">
              <Smartphone className="h-4 w-4 shrink-0" />
              <p>التطبيق يفتح مباشرة من شاشتك الرئيسية</p>
            </div>

            <a
              href="/download"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-dark"
            >
              <Info className="h-4 w-4" />
              صفحة التحميل الكاملة
            </a>
          </div>
        </div>
      )}
    </>
  );
}
