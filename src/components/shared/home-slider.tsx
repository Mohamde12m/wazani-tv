"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useNav } from "@/stores/nav";
import { useFetch } from "@/hooks/use-fetch";

interface SliderItemData {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  gradient: string;
  linkType: string;
  linkId?: string | null;
  buttonText: string;
  active: boolean;
  order: number;
}

interface SliderResponse {
  items: SliderItemData[];
}

/**
 * HomeSlider — شاشة منزلقة احترافية فوق البحث في الصفحة الرئيسية
 *
 * - يدور تلقائيًا كل 5 ثوانٍ
 * - سحب يدوي يمين/يسار
 * - مؤشرات نقطية
 * - زر "شاهد الآن" يفتح القناة/المباراة/الرابط
 */
export function HomeSlider() {
  const { data, loading } = useFetch<SliderResponse>("/api/slider");
  const items = (data?.items ?? []).filter((i) => i.active);

  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // دوران تلقائي
  React.useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  // اضغط على مؤشر
  const goTo = (idx: number) => setCurrent(idx);

  if (loading || items.length === 0) return null;

  return (
    <div
      className="relative -mx-4 mb-3 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* الشرائح */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${current * 100}%)` }}
      >
        {items.map((item) => (
          <SliderSlide key={item.id} item={item} />
        ))}
      </div>

      {/* أزرار التنقل */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + items.length) % items.length)}
            className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full wz-glass-chip text-white transition-all hover:scale-110 active:scale-95"
            aria-label="السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % items.length)}
            className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full wz-glass-chip text-white transition-all hover:scale-110 active:scale-95"
            aria-label="التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      {/* المؤشرات النقطية */}
      {items.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === current ? 20 : 6,
                background: i === current
                  ? "linear-gradient(90deg, #F5C842, #C99A2E)"
                  : "rgba(255,255,255,0.35)",
              }}
              aria-label={`شريحة ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SliderSlide({ item }: { item: SliderItemData }) {
  const setView = useNav((s) => s.setView);

  const handleClick = () => {
    if (item.linkType === "channel" && item.linkId) {
      setView({ name: "player", channelId: item.linkId });
    } else if (item.linkType === "match" && item.linkId) {
      setView({ name: "match-player", matchId: item.linkId });
    } else if (item.linkType === "url" && item.linkId) {
      window.open(item.linkId, "_blank");
    }
  };

  return (
    <div className="relative w-full shrink-0 px-4">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16 / 7",
          background: item.imageUrl ? "#000" : item.gradient,
          border: "1px solid rgba(245, 200, 66, 0.25)",
          boxShadow: "0 8px 24px -8px rgba(0,0,0,0.4)",
        }}
      >
        {/* الصورة */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* تدرج سفلي للنص */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.8) 100%)",
          }}
        />

        {/* المحتوى */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h2 className="mb-1 text-lg font-extrabold text-white drop-shadow-lg">
            {item.title}
          </h2>
          {item.subtitle && (
            <p className="mb-3 text-xs text-white/70 line-clamp-2">{item.subtitle}</p>
          )}
          {item.linkType !== "none" && (
            <button
              onClick={handleClick}
              className="flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-black"
              style={{
                background: "linear-gradient(135deg, #F5C842 0%, #C99A2E 100%)",
                boxShadow: "0 4px 12px -2px rgba(245, 200, 66, 0.5)",
              }}
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              {item.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
