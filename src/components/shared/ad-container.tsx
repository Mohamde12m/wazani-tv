"use client";

import * as React from "react";

/**
 * حاوية إعلان احترافية لـ HilltopAds
 *
 * المميزات:
 * - متجاوبة مع جميع الشاشات (mobile-first)
 * - تدعم: بانر، In-Page Push، Popunder، Direct Link
 * - تحميل كسول (lazy) لتجنب إبطاء الموقع
 * - لا تظهر إذا لم يوجد كود إعلان
 * - مناطق آمنة (safe zones) للهاتف
 */

export type AdType = "banner" | "inpage_push" | "popunder" | "direct_link" | "interstitial";

export interface AdConfig {
  id: string;
  slot: string;
  type: AdType;
  adCode: string; // كود HilltopAds الكامل (اسم الحقل في DB)
  active: boolean;
}

/**
 * يحمل إعلانًا واحدًا من API وي عرضه في حاوية متجاوبة.
 * لا يأخذ مساحة إذا لم يوجد إعلان نشط.
 */
export function AdContainer({
  slot,
  variant = "banner",
  className,
}: {
  slot: string;
  variant?: "banner" | "sticky";
  className?: string;
}) {
  const [ad, setAd] = React.useState<AdConfig | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/ads?slot=${slot}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.ads && d.ads.length > 0) {
          setAd(d.ads[0]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [slot]);

  // لا تأخذ مساحة قبل التحميل أو إذا لم توجد إعلانات
  if (!loaded || !ad || !ad.adCode) return null;

  // وضع لاصق أسفل الشاشة
  if (variant === "sticky") {
    return (
      <div
        className="fixed inset-x-0 z-30"
        style={{
          bottom: "calc(64px + env(safe-area-inset-bottom))",
          pointerEvents: "none",
        }}
      >
        <div
          className="mx-auto max-w-md px-3 pb-1"
          style={{ pointerEvents: "auto" }}
        >
          {/* حاوية شفافة تسمح لـ HilltopAds بعرض واجهته الخاصة (Video Slider / Native) */}
          <AdCodeRenderer code={ad.adCode} style={{ minHeight: 0 }} />
        </div>
      </div>
    );
  }

  // وضع بانر عادي
  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <span className="absolute right-2 top-2 z-10 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          إعلان
        </span>
        <AdCodeRenderer code={ad.adCode} style={{ minHeight: 90 }} />
      </div>
    </div>
  );
}

/**
 * يعرض كود إعلان HilltopAds بأمان.
 * - يدعم <script> tags
 * - يعيد إنشاء scripts لتفعيل التنفيذ
 * - حجم ثابت ليبقى الإعلان في مكانه
 */
export function AdCodeRenderer({
  code,
  style,
}: {
  code: string;
  style?: React.CSSProperties;
}) {
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
      if (node.nodeName === "SCRIPT") {
        const script = document.createElement("script");
        const original = node as HTMLScriptElement;
        if (original.src) {
          // مرّر السكربت الخارجي عبر /api/adscript
          script.src = `/api/adscript?url=${encodeURIComponent(original.src)}`;
        }
        if (original.type) script.type = original.type;
        if (original.async) script.async = true;
        // للسكربتات inline: أعد كتابة أي s.src="..." ليستخدم البروكسي
        if (original.text) {
          script.text = original.text.replace(
            /(\w+)\.src\s*=\s*["'](https?:)?\/\/([^"']+)["']/g,
            (match, varName, protocol, rest) => {
              const fullUrl = `https://${rest}`;
              return `${varName}.src = "/api/adscript?url=" + encodeURIComponent("${fullUrl}")`;
            }
          );
        }
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
