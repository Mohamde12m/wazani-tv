"use client";

import * as React from "react";
import { X, Clock } from "lucide-react";
import { useNav } from "@/stores/nav";

/**
 * نظام إعلانات الانتقال (Interstitial Ads) لـ HilltopAds
 *
 * كيف يعمل:
 * - يراقب التنقل بين الصفحات (useNav)
 * - كل 3 تنقلات، يظهر إعلان كامل الشاشة
 * - زر تخطي بعد 5 ثوانٍ
 * - لا يمنع الوصول للصفحة — فقط تأخير بسيط
 * - يستخدم sessionStorage لتتبع العداد بين الجلسات
 *
 * أنواع الإعلانات المدعومة:
 * - interstitial: إعلان كامل الشاشة
 * - direct_link: يفتح رابط مباشر في تبويب جديد
 * - video: إعلان فيديو
 */

const NAV_COUNT_KEY = "hilltopads_nav_count";
const SHOW_EVERY_N = 3; // أظهر كل 3 تنقلات
const SKIP_DELAY = 5000; // 5 ثوانٍ قبل ظهور زر التخطي

export function InterstitialAd() {
  const view = useNav((s) => s.view);
  const [showAd, setShowAd] = React.useState(false);
  const [canSkip, setCanSkip] = React.useState(false);
  const [adCode, setAdCode] = React.useState<string | null>(null);
  const skipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevViewRef = React.useRef<string>("");

  // تحقق من التنقل
  React.useEffect(() => {
    const currentView = view.name;
    if (prevViewRef.current === "") {
      prevViewRef.current = currentView;
      return;
    }
    if (prevViewRef.current === currentView) return;

    prevViewRef.current = currentView;

    // لا تظهر إعلان على صفحة المسؤول
    if (currentView === "admin") return;

    // زيد العداد
    const count = parseInt(sessionStorage.getItem(NAV_COUNT_KEY) || "0") + 1;
    sessionStorage.setItem(NAV_COUNT_KEY, count.toString());

    // أظهر الإعلان كل N تنقلات
    if (count % SHOW_EVERY_N === 0) {
      // اجلب كود الإعلان
      fetch("/api/ads?slot=interstitial")
        .then((r) => r.json())
        .then((d) => {
          if (d.ads && d.ads.length > 0 && d.ads[0].code) {
            setAdCode(d.ads[0].code);
            setShowAd(true);
            setCanSkip(false);

            // فعّل زر التخطي بعد 5 ثوانٍ
            skipTimerRef.current = setTimeout(() => {
              setCanSkip(true);
            }, SKIP_DELAY);
          }
        })
        .catch(() => {});
    }
  }, [view.name]);

  // تنظيف المؤقت
  React.useEffect(() => {
    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, []);

  const closeAd = () => {
    setShowAd(false);
    setAdCode(null);
    setCanSkip(false);
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
  };

  if (!showAd || !adCode) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      {/* محتوى الإعلان */}
      <div
        className="relative h-full w-full max-w-md"
        style={{ animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* زر التخطي */}
        <button
          onClick={closeAd}
          disabled={!canSkip}
          className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            canSkip
              ? "bg-white text-black hover:scale-105 active:scale-95"
              : "bg-white/20 text-white/50"
          }`}
        >
          {canSkip ? (
            <>
              <X className="h-3.5 w-3.5" />
              تخطي
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "2s" }} />
              5 ثوانٍ
            </>
          )}
        </button>

        {/* شعار إعلان */}
        <span className="absolute right-3 top-3 z-10 rounded bg-white/10 px-2 py-1 text-[10px] font-medium text-white/60">
          إعلان
        </span>

        {/* كود الإعلان */}
        <div className="flex h-full w-full items-center justify-center p-4">
          <InterstitialCodeRenderer code={adCode} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * يعرض كود إعلان interstitial بأمان
 */
function InterstitialCodeRenderer({ code }: { code: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const template = document.createElement("template");
    template.innerHTML = code.trim();

    Array.from(template.content.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        const script = document.createElement("script");
        const original = node as HTMLScriptElement;
        if (original.src) script.src = original.src;
        if (original.type) script.type = original.type;
        if (original.async) script.async = true;
        script.text = original.text;
        container.appendChild(script);
      } else {
        container.appendChild(node.cloneNode(true));
      }
    });
  }, [code]);

  return <div ref={containerRef} className="h-full w-full" />;
}
