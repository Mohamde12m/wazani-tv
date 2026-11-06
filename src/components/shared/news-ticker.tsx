"use client";

import * as React from "react";
import { Newspaper } from "lucide-react";
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
 * NewsTicker — شريط إخباري احترافي
 *
 * - "BREAKING" ثابتة يمين بأيقونة Newspaper + خلفية حمراء احترافية
 * - مضغوط وحواف حادة (no border-radius)
 * - نص يمر بسلاسة من اليمين لليسار
 */
export function NewsTicker() {
  const { data } = useFetch<NewsResponse>("/api/news-ticker");
  const items = (data?.items ?? []).filter((i) => i.active);

  if (items.length === 0) return null;

  const fullText = items.map((i) => i.text).join("    •    ");
  const repeatedText = `${fullText}    •    ${fullText}    •    `;

  return (
    <div
      className="relative flex items-stretch overflow-hidden"
      style={{
        background: "#0D0D0D",
        height: 32,
        borderRadius: 0,
      }}
    >
      {/* الكلمة الثابتة — BREAKING بالإنجليزية + أيقونة */}
      <div
        className="flex h-full shrink-0 items-center gap-1.5 px-2.5"
        style={{
          background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
          color: "#FFFFFF",
          zIndex: 2,
        }}
      >
        <Newspaper className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="text-[11px] font-extrabold tracking-wide">BREAKING</span>
      </div>

      {/* النص المتحرك */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ direction: "rtl" }}
      >
        <div
          className="whitespace-nowrap"
          style={{
            display: "inline-block",
            animation: "wz-ticker-pro 35s linear infinite",
            fontSize: 12,
            fontWeight: 500,
            color: "#E0E0E0",
            lineHeight: "32px",
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
