"use client";

import * as React from "react";
import {
  Download,
  Smartphone,
  Shield,
  Zap,
  Bell,
  Tv,
  Calendar,
  Heart,
  Moon,
  Globe,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";

/**
 * صفحة تحميل التطبيق — احترافية وحقيقية
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

  const features = [
    { icon: Tv, title: "+130 قناة عربية", desc: "من المغرب، الخليج، مصر، الشام" },
    { icon: Calendar, title: "جدول المباريات", desc: "مباريات اليوم والأسبوع كاملًا" },
    { icon: Heart, title: "المفضلة", desc: "احفظ قنواتك المفضلة" },
    { icon: Bell, title: "تذكير المباريات", desc: "إشعار قبل المباراة بـ5 دقائق" },
    { icon: Moon, title: "الوضع الداكن", desc: "مظهر أنيق يحمي عينيك" },
    { icon: Globe, title: "محتوى منظم", desc: "حسب الدولة والتصنيف" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06140f] via-[#0b2820] to-[#06140f] px-4 py-8 text-white" dir="rtl">
      <div className="mx-auto max-w-md">
        {/* ===== Header ===== */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/icon-512.png"
              alt="WazaNI TV"
              className="h-28 w-28 rounded-3xl shadow-2xl ring-2 ring-emerald-500/30"
            />
          </div>
          <h1 className="mb-2 text-3xl font-extrabold">WazaNI TV</h1>
          <p className="text-sm text-white/70">
            القنوات العربية ومباريات كرة القدم
          </p>

          {/* Rating */}
          <div className="mt-3 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="mr-2 text-xs text-white/60">الأحدث</span>
          </div>
        </div>

        {/* ===== App Info Card ===== */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/5 p-3">
              <Package className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <div className="text-[10px] text-white/50">الإصدار</div>
              <div className="text-sm font-bold text-emerald-400">1.0.0</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <Download className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <div className="text-[10px] text-white/50">الحجم</div>
              <div className="text-sm font-bold text-emerald-400">~5 MB</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <Clock className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <div className="text-[10px] text-white/50">آخر تحديث</div>
              <div className="text-sm font-bold text-emerald-400">اليوم</div>
            </div>
          </div>
        </div>

        {/* ===== Install Button ===== */}
        <div className="mb-8">
          {isInstalled ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-emerald-400" />
              <p className="font-bold">التطبيق مثبت على جهازك</p>
              <p className="mt-1 text-xs text-white/60">
                افتحه من الشاشة الرئيسية
              </p>
            </div>
          ) : isIOS ? (
            <div className="rounded-2xl bg-white p-6 text-sm text-gray-800">
              <h3 className="mb-3 flex items-center gap-2 font-bold">
                <Smartphone className="h-5 w-5 text-emerald-500" />
                تثبيت على iPhone
              </h3>
              <ol className="space-y-2 text-gray-600">
                <li>1. اضغط زر المشاركة ⬆️ في Safari</li>
                <li>2. اختر «إضافة إلى الشاشة الرئيسية»</li>
                <li>3. اضغط «إضافة»</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 text-lg font-bold text-white shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
              {deferredPrompt ? "تنزيل التطبيق للأندرويد" : "تثبيت من قائمة Chrome"}
            </button>
          )}
        </div>

        {/* ===== Installation Steps ===== */}
        {!isInstalled && !isIOS && !deferredPrompt && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <Smartphone className="h-5 w-5 text-emerald-400" />
              خطوات التثبيت
            </h3>
            <ol className="space-y-3 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">1</span>
                <span>اضغط زر القائمة ⋮ في أعلى يمين Chrome</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">2</span>
                <span>اختر «تثبيت التطبيق» أو «Add to Home screen»</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">3</span>
                <span>اضغط «تثبيت» — ستظهر أيقونة WazaNI TV على شاشتك</span>
              </li>
            </ol>
          </div>
        )}

        {/* ===== Features Grid ===== */}
        <div className="mb-8">
          <h2 className="mb-4 text-center text-xl font-bold">مميزات التطبيق</h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur transition hover:bg-white/10"
              >
                <feature.icon className="mx-auto mb-2 h-7 w-7 text-emerald-400" />
                <p className="text-sm font-bold">{feature.title}</p>
                <p className="mt-1 text-[11px] text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Security Note ===== */}
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <Shield className="h-5 w-5 shrink-0 text-amber-400" />
          <div className="text-sm">
            <p className="mb-1 font-bold text-amber-200">ملاحظة التثبيت</p>
            <p className="text-xs text-amber-100/80">
              قد يطلب أندرويد إذن «تثبيت من مصادر خارجية» — هذا إجراء أمان عادي
              من النظام. وافق عليه لإكمال التثبيت.
            </p>
          </div>
        </div>

        {/* ===== Quick Stats ===== */}
        <div className="mb-8 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <div className="text-2xl font-extrabold text-emerald-400">+130</div>
            <div className="text-[10px] text-white/60">قناة عربية</div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <div className="text-2xl font-extrabold text-emerald-400">+20</div>
            <div className="text-[10px] text-white/60">بطولة</div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3">
            <div className="text-2xl font-extrabold text-emerald-400">+70</div>
            <div className="text-[10px] text-white/60">فريق</div>
          </div>
        </div>

        {/* ===== Open Website ===== */}
        <a
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 font-bold backdrop-blur transition hover:bg-white/10"
        >
          <ExternalLink className="h-5 w-5" />
          فتح الموقع في المتصفح
        </a>

        {/* ===== Footer ===== */}
        <div className="mt-8 text-center text-xs text-white/40">
          <p>© 2026 WazaNI TV</p>
          <p className="mt-1">جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
