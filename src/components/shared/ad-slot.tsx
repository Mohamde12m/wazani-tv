"use client";

import * as React from "react";
import { X, Megaphone } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import type { Ad, AdSlotName } from "@/lib/types";

interface AdsResponse {
  ads: Ad[];
}

/**
 * مكان إعلان — يعرض الإعلانات النشطة للموضع المحدد.
 *
 * يدعم نوعين:
 * - "image": بانر صورة مع رابط (يفتح في تبويب جديد)
 * - "code": كود إعلان جاهز (HTML/script من شركة الإعلانات)
 *
 * يمكن للمستخدم إغلاق الإعلان (يُخفى مؤقتًا في الجلسة).
 * لا يظهر شيء إذا لم توجد إعلانات نشطة — لا يأخذ مساحة.
 */
export function AdSlot({
  slot,
  variant = "banner",
  className,
}: {
  slot: AdSlotName;
  /** "banner": بانر أفقي بين الأقسام. "sticky": لاصق أسفل الشاشة. */
  variant?: "banner" | "sticky";
  className?: string;
}) {
  const { data } = useFetch<AdsResponse>(`/api/ads?slot=${slot}`);
  const ads = data?.ads ?? [];
  const [dismissed, setDismissed] = React.useState<Set<string>>(React.useMemo(() => new Set(), []));
  const [adIndex, setAdIndex] = React.useState(0);

  // فلترة الإعلانات غير المغلقة
  const visibleAds = ads.filter((a) => !dismissed.has(a.id));
  const currentAd = visibleAds[adIndex % Math.max(visibleAds.length, 1)];

  // تبديل الإعلان كل 15 ثانية لو في أكثر من إعلان (يجب أن يكون قبل أي return)
  React.useEffect(() => {
    if (visibleAds.length <= 1) return;
    const t = setInterval(() => {
      setAdIndex((i) => (i + 1) % visibleAds.length);
    }, 15000);
    return () => clearInterval(t);
  }, [visibleAds.length]);

  // لا شيء للعرض — لا نأخذ أي مساحة
  if (visibleAds.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // وضع لاصق أسفل الشاشة
  if (variant === "sticky") {
    return (
      <div
        className="fixed inset-x-0 z-40"
        style={{
          bottom: "calc(64px + env(safe-area-inset-bottom))",
          pointerEvents: "none",
        }}
      >
        <div className="mx-auto max-w-md px-3 pb-1" style={{ pointerEvents: "auto" }}>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <button
              onClick={() => dismiss(currentAd.id)}
              aria-label="إغلاق الإعلان"
              className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <AdContent ad={currentAd} compact />
            <span className="absolute right-1 top-1 rounded bg-black/50 px-1 text-[9px] font-medium text-white/80">
              إعلان
            </span>
          </div>
        </div>
      </div>
    );
  }

  // وضع بانر عادي بين الأقسام
  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <span className="absolute right-2 top-2 z-10 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          إعلان
        </span>
        <AdContent ad={currentAd} />
      </div>
    </div>
  );
}

/** يعرض محتوى الإعلان حسب النوع. */
function AdContent({ ad, compact = false }: { ad: Ad; compact?: boolean }) {
  if (ad.type === "image" && ad.imageUrl) {
    const img = (
      <img
        src={ad.imageUrl}
        alt={ad.label || "إعلان"}
        className="w-full object-cover"
        style={{ height: compact ? 56 : 90, objectFit: "cover" }}
        loading="lazy"
      />
    );
    if (ad.linkUrl) {
      return (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
          aria-label={ad.label || "إعلان"}
        >
          {img}
        </a>
      );
    }
    return img;
  }

  if (ad.type === "code" && ad.adCode) {
    return (
      <AdCodeRenderer
        code={ad.adCode}
        style={{ height: compact ? 56 : 90 }}
      />
    );
  }

  // حالة فارغة احتياطية
  return (
    <div
      className="flex items-center justify-center bg-muted/30 text-muted-foreground"
      style={{ height: compact ? 56 : 90 }}
    >
      <Megaphone className="h-5 w-5 opacity-40" />
    </div>
  );
}

/**
 * يعرض كود إعلان جاهز (HTML/script) بأمان.
 * يستخدم dangerouslySetInnerHTML للسماح بتنفيذ scripts الإعلانات.
 * يُلصق في div بحجم ثابت ليبقى الإعلان في مكانه دون الخروج عليه.
 */
function AdCodeRenderer({ code, style }: { code: string; style?: React.CSSProperties }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // امسح المحتوى السابق
    container.innerHTML = "";

    // parse الكود كـ HTML
    const template = document.createElement("template");
    template.innerHTML = code.trim();

    // انقل كل العقد (بما فيها scripts) إلى الحاوية
    Array.from(template.content.childNodes).forEach((node) => {
      // للـ script nodes: أعد إنشائها لتفعيل التنفيذ
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

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center justify-center overflow-hidden"
      style={style}
    />
  );
}
