"use client";

import * as React from "react";

/**
 * نظام إعلانات مبسط وآمن — لا يستخدم useFetch المعقد.
 * يجلب الإعلانات من /api/ads ويعرض أول إعلان نشط للموضع المحدد.
 * إذا لم توجد إعلانات، لا يأخذ أي مساحة.
 */
export function AdBanner({ slot }: { slot: string }) {
  const [ad, setAd] = React.useState<{
    imageUrl?: string | null;
    linkUrl?: string | null;
    adCode?: string | null;
    type: string;
    label?: string;
  } | null>(null);
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
  if (!loaded || !ad) return null;

  // إعلان صورة
  if (ad.type === "image" && ad.imageUrl) {
    const img = (
      <img
        src={ad.imageUrl}
        alt={ad.label || "إعلان"}
        className="h-[90px] w-full rounded-xl object-cover"
        loading="lazy"
      />
    );
    return (
      <div className="relative">
        <span className="absolute right-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          إعلان
        </span>
        {ad.linkUrl ? (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    );
  }

  // إعلان كود
  if (ad.type === "code" && ad.adCode) {
    return (
      <div className="relative">
        <span className="absolute right-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          إعلان
        </span>
        <div
          className="min-h-[90px] w-full overflow-hidden rounded-xl bg-card"
          dangerouslySetInnerHTML={{ __html: ad.adCode }}
        />
      </div>
    );
  }

  return null;
}

/**
 * إعلان لاصق أسفل الشاشة — بسيط وآمن.
 */
export function StickyAd({ slot = "sticky_bottom" }: { slot?: string }) {
  const [ad, setAd] = React.useState<{
    imageUrl?: string | null;
    linkUrl?: string | null;
    type: string;
    label?: string;
  } | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
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

  if (!loaded || !ad || dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 z-40"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-md px-3 pb-1">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <button
            onClick={() => setDismissed(true)}
            aria-label="إغلاق الإعلان"
            className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
          >
            ×
          </button>
          <span className="absolute right-1 top-1 z-10 rounded bg-black/50 px-1 text-[9px] text-white/80">
            إعلان
          </span>
          {ad.type === "image" && ad.imageUrl ? (
            <a
              href={ad.linkUrl || "#"}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              <img
                src={ad.imageUrl}
                alt={ad.label || "إعلان"}
                className="h-[56px] w-full object-cover"
                loading="lazy"
              />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
