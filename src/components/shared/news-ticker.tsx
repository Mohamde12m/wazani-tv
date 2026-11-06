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
 * NewsTicker — شريط إخباري متحرك
 *
 * - "آخر الأخبار" ثابتة في الجهة اليمنى بخلفية ذهبية
 * - النص المتحرك يبدأ من اليمين (بعد "آخر الأخبار") ويتحرك نحو اليسار
 * - يختفي من اليسار ثم يظهر مرة أخرى من اليمين
 * - النص يظهر بالكامل بدون قطع
 */
export function NewsTicker() {
  const { data } = useFetch<NewsResponse>("/api/news-ticker");
  const items = (data?.items ?? []).filter((i) => i.active);

  if (items.length === 0) return null;

  // ادمج كل النصوص في شريط واحد مفصول بـ •
  const fullText = items.map((i) => i.text).join("   •   ");

  return (
    <div
      className="relative flex items-stretch overflow-hidden rounded-xl border border-border"
      style={{
        background: "linear-gradient(90deg, var(--card) 0%, color-mix(in srgb, var(--card) 90%, #000) 100%)",
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

      {/* النص المتحرك — يبدأ من اليمين ويتحرك نحو اليسار */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ direction: "rtl" }}
      >
        <div
          className="whitespace-nowrap"
          style={{
            display: "inline-block",
            animation: "wz-ticker-scroll 20s linear infinite",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            paddingRight: "100%",
            paddingLeft: "20px",
          }}
        >
          {fullText}
        </div>
      </div>

      <style>{`
        @keyframes wz-ticker-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
