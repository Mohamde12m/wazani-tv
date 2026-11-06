"use client";

import * as React from "react";
import { useFetch } from "@/hooks/use-fetch";

interface NewsItem {
  id: string;
  text: string;
  active: boolean;
  order: number;
}

interface NewsResponse {
  items: NewsItem[];
}

/**
 * NewsTicker — شريط إخباري احترافي مثل القنوات الفضائية
 *
 * تصميم مثل الجزيرة / Sky News Arabia:
 * - "📢 آخر الأخبار" ثابتة يمين بخلفية ذهبية
 * - النص يمر بسلاسة من اليمين إلى اليسار (طبيعي للعربية)
 * - حلقة سلسة بلا انقطاع (النص مكرر)
 * - سرعة ثابتة هادئة ومناسبة للقراءة
 */
export function NewsTicker() {
  const { data } = useFetch<NewsResponse>("/api/news-ticker");
  const items = (data?.items ?? []).filter((i) => i.active);

  if (items.length === 0) return null;

  // ادمج كل النصوص
  const fullText = items.map((i) => i.text).join("    •    ");

  // كرر النص مرتين للحلقة السلسة
  const repeatedText = `${fullText}    •    ${fullText}    •    `;

  return (
    <div
      className="relative flex items-stretch overflow-hidden rounded-xl border border-border"
      style={{
        background: "linear-gradient(90deg, var(--card) 0%, color-mix(in srgb, var(--card) 92%, #000) 100%)",
        height: 38,
      }}
    >
      {/* الكلمة الثابتة — الجهة اليمنى */}
      <div
        className="flex h-full shrink-0 items-center gap-1.5 px-3 text-xs font-extrabold"
        style={{
          background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
          color: "#0A0A0A",
          zIndex: 2,
        }}
      >
        <span className="text-sm">📢</span>
        <span>آخر الأخبار</span>
      </div>

      {/* النص المتحرك — يمر من اليمين إلى اليسار بسلاسة */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ direction: "rtl" }}
      >
        <div
          className="whitespace-nowrap"
          style={{
            display: "inline-block",
            animation: "wz-ticker-pro 35s linear infinite",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            willChange: "transform",
          }}
        >
          {repeatedText}
        </div>
      </div>

      <style>{`
        @keyframes wz-ticker-pro {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}
