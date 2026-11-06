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
 * - النص يظهر من اليسار ← يتحرك نحو اليمين ← يختفي ← يعود من اليسار
 * - السرعة تلقائية: تحسب حسب طول النص (نص طويل = أبطأ، نص قصير = أسرع)
 *   لتضمن أن النص يُقرأ بالكامل
 */
export function NewsTicker() {
  const { data } = useFetch<NewsResponse>("/api/news-ticker");
  const items = (data?.items ?? []).filter((i) => i.active);
  const textRef = React.useRef<HTMLDivElement>(null);
  const [duration, setDuration] = React.useState(30); // افتراضي 30 ثانية

  const fullText = items.map((i) => i.text).join("   •   ");

  // احسب السرعة تلقائيًا حسب طول النص
  React.useEffect(() => {
    if (!fullText) return;
    // كل حرف يحتاج ~0.8 ثانية — سرعة قراءة مريحة
    const calculated = Math.max(30, Math.min(120, fullText.length * 0.8));
    setDuration(calculated);
  }, [fullText]);

  if (items.length === 0) return null;

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

      {/* النص المتحرك — يبدأ من اليمين (مرئي فورًا) ← يتحرك نحو اليسار ← يعود */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ direction: "rtl" }}
      >
        <div
          ref={textRef}
          className="whitespace-nowrap"
          style={{
            display: "inline-block",
            animation: `wz-ticker-auto ${duration}s linear infinite`,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            paddingRight: "20px",
          }}
        >
          {fullText}
        </div>
      </div>

      <style>{`
        @keyframes wz-ticker-auto {
          0% { transform: translateX(100%); opacity: 0; }
          5% { opacity: 1; }
          90% { transform: translateX(-100%); opacity: 1; }
          95% { opacity: 0; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
