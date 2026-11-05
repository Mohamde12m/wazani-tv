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
 * - النص المتحرك يبدأ من اليسار ويتحرك نحو اليمين ويختفي تحت "آخر الأخبار"
 * - يدعم عدة نصوص (تظهر بالتتابع مفصولة بـ •)
 */
export function NewsTicker() {
  const { data } = useFetch<NewsResponse>("/api/news-ticker");
  const items = (data?.items ?? []).filter((i) => i.active);

  if (items.length === 0) return null;

  // ادمج كل النصوص في شريط واحد مفصول بـ •
  const fullText = items.map((i) => i.text).join("   •   ");
  // كرر النص لضمان حركة سلسة بلا انقطاع
  const repeatedText = `${fullText}   •   ${fullText}`;

  return (
    <div
      className="relative flex items-center overflow-hidden rounded-xl border border-border"
      style={{
        background: "linear-gradient(90deg, var(--card) 0%, color-mix(in srgb, var(--card) 90%, #000) 100%)",
        height: 36,
      }}
    >
      {/* الكلمة الثابتة — الجهة اليمنى */}
      <div
        className="flex h-full shrink-0 items-center gap-1.5 px-3 text-xs font-extrabold"
        style={{
          background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
          color: "#0A0A0A",
          zIndex: 2,
          borderRadius: "0 0 0 0",
        }}
      >
        <span className="text-sm">📢</span>
        <span>آخر الأخبار</span>
      </div>

      {/* النص المتحرك — يبدأ من اليسار ويتحرك يمينًا */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ direction: "rtl" }}
      >
        <div
          className="whitespace-nowrap"
          style={{
            animation: "wz-ticker-scroll 25s linear infinite",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            paddingLeft: "100%",
          }}
        >
          {repeatedText}
        </div>
      </div>

      <style>{`
        @keyframes wz-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
