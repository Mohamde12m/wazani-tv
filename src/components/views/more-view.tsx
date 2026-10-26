"use client";

import * as React from "react";
import {
  Trophy,
  Tv,
  CalendarDays,
  ChevronLeft,
  Sun,
  Moon,
  ShieldAlert,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useNav } from "@/stores/nav";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { AppLogo } from "@/components/shared/app-logo";
import { AdSlot } from "@/components/shared/ad-slot";
import { toast } from "sonner";

export function MoreView() {
  const setView = useNav((s) => s.setView);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === "dark";

  // ── مدخل سري للوحة المسؤول: 5 ضغطات على الشعار خلال ثانيتين ──
  // لا يظهر أي تلميح بصري للمستخدم — فقط المسؤول يعرف السرّ
  const tapCountRef = React.useRef(0);
  const lastTapRef = React.useRef(0);
  const handleSecretTap = React.useCallback(() => {
    const now = Date.now();
    // إعادة العد لو مرّ أكثر من ثانيتين منذ آخر ضغطة
    if (now - lastTapRef.current > 2000) {
      tapCountRef.current = 0;
    }
    tapCountRef.current += 1;
    lastTapRef.current = now;
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setView({ name: "admin" });
    }
  }, [setView]);

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
    toast.success(checked ? "تم التبديل إلى الوضع الداكن" : "تم التبديل إلى الوضع الفاتح");
  };

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-dark text-white shadow-md">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold leading-tight text-foreground">المزيد</h1>
          <p className="text-[11px] text-muted-foreground">الإعدادات والقوائم ومعلومات التطبيق</p>
        </div>
      </div>

      {/* Navigation menu */}
      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">قائمة التنقل</h2>
        <MenuCard
          icon={Trophy}
          iconTone="emerald"
          title="البطولات الرياضية"
          subtitle="تصفح أهم البطولات والفرق"
          onClick={() => setView({ name: "tournaments" })}
        />
        <MenuCard
          icon={Tv}
          iconTone="emerald"
          title="جميع القنوات"
          subtitle="استكشف القنوات العربية حسب الدولة والتصنيف"
          onClick={() => setView({ name: "channels" })}
        />
        <MenuCard
          icon={CalendarDays}
          iconTone="emerald"
          title="جدول المباريات"
          subtitle="مباريات اليوم والأسبوع القادم"
          onClick={() => setView({ name: "matches" })}
        />
      </section>

      {/* إعلان أعلى المزيد — بعد قائمة التنقل */}
      <AdSlot slot="more_top" />

      {/* Settings */}
      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">الإعدادات</h2>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
              {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">المظهر</p>
              <p className="text-[11px] text-muted-foreground">
                {isDark ? "الوضع الداكن مفعل" : "الوضع الفاتح مفعل"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground">فاتح</span>
              <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="تبديل المظهر" />
              <span className="text-[11px] font-bold text-muted-foreground">داكن</span>
            </div>
          </div>
        </div>
      </section>

      {/* About — يحتوي على الشعار الذي يفتح لوحة المسؤول بعد 5 ضغطات */}
      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">حول التطبيق</h2>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleSecretTap}
              aria-label="شعار WazaNI TV"
              className="shrink-0 cursor-default rounded-full focus:outline-none"
              tabIndex={-1}
            >
              <AppLogo size={56} className="shadow-md" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-extrabold text-emerald">
                  Waza<span className="gold-text">NI</span> TV
                </h3>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-emerald">
                  v1.0.0
                </span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-foreground">القنوات العربية ومباريات كرة القدم</p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                تطبيق عربي عصري يجمع بين قنوات التلفزيون العربية وجدول مباريات كرة القدم، بتصميم أنيق ودعم
                كامل للغة العربية واتجاه الكتابة من اليمين إلى اليسار.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="space-y-3">
        <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          حقوق المصادر وإخلاء المسؤولية
        </h2>
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="space-y-2 text-[11px] leading-relaxed text-foreground/90">
              <p>
                تطبيق <span className="font-bold">WazaNI TV</span> منصة عربية متكاملة لمتابعة القنوات
                التلفزيونية ومباريات كرة القدم. تتيح لك تصفّح القنوات حسب الدولة والتصنيف، ومتابعة
                المباريات المباشرة والقادمة مع روابط بث مستقلة لكل مباراة.
              </p>
              <p>
                القنوات المُعلَّمة بـ«<span className="font-bold text-emerald">متاح</span>» تتوفر لها روابط
                بث موثّقة، فيما تظهر بقية القنوات بوصفها «<span className="font-bold">غير متاح</span>» حتى
                يتم التحقق من توفر بث رسمي لها.
              </p>
              <p className="text-muted-foreground">
                جميع الأسماء والشعارات والعلامات التجارية ملك لأصحابها الأصليين ويتم استخدامها لأغراض
                التعريف فقط.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MenuCard({
  icon: Icon,
  iconTone = "emerald",
  title,
  subtitle,
  onClick,
}: {
  icon: LucideIcon;
  iconTone?: "emerald" | "gold";
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-md active:scale-[0.99]"
    >
      <span
        className={
          iconTone === "gold"
            ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold"
            : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald"
        }
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-foreground">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
