"use client";

import * as React from "react";
import { PlayerWatermark, type WatermarkPosition, type WatermarkAnimation } from "@/components/shared/player-watermark";
import { Play, Pause, Volume2, Maximize } from "lucide-react";

/**
 * صفحة معاينة للـ PlayerWatermark — لرؤية الشعار المتحرك قبل تطبيقه.
 *
 * تعرض مشغل فيديو وهمي مع 4 خيارات للموضع + 3 خيارات للأنيميشن.
 */

export default function WatermarkPreviewPage() {
  const [position, setPosition] = React.useState<WatermarkPosition>("top-left");
  const [animation, setAnimation] = React.useState<WatermarkAnimation>("both");
  const [size, setSize] = React.useState(56);
  const [opacity, setOpacity] = React.useState(0.75);
  const [playing, setPlaying] = React.useState(true);

  const positions: { key: WatermarkPosition; label: string }[] = [
    { key: "top-left", label: "يسار أعلى" },
    { key: "top-right", label: "يمين أعلى" },
    { key: "bottom-left", label: "يسار أسفل" },
    { key: "bottom-right", label: "يمين أسفل" },
  ];

  const animations: { key: WatermarkAnimation; label: string }[] = [
    { key: "glow", label: "توهج ذهبي" },
    { key: "shimmer", label: "لمعان" },
    { key: "both", label: "كلاهما" },
  ];

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(31, 224, 122, 0.12) 0%, transparent 55%), linear-gradient(180deg, #021410 0%, #04190F 50%, #021410 100%)",
        color: "#E8F0EA",
      }}
    >
      <div className="mx-auto max-w-2xl">
        {/* العنوان */}
        <div className="mb-6 text-center">
          <h1
            className="text-2xl font-extrabold"
            style={{
              background: "linear-gradient(90deg, #1FE07A 0%, #F5C842 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            معاينة العلامة المائية المتحركة
          </h1>
          <p className="mt-1 text-sm text-white/60">
            شعار WazaNI TV في المشغل — اختر الموضع والأنيميشن قبل التطبيق
          </p>
        </div>

        {/* مشغل وهمي */}
        <div
          className="relative mb-6 overflow-hidden rounded-2xl"
          style={{
            aspectRatio: "16 / 9",
            background:
              "linear-gradient(135deg, #0A2418 0%, #0E2C1E 50%, #0A2418 100%)",
            border: "1px solid rgba(245, 200, 66, 0.2)",
            boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
          }}
        >
          {/* خلفية مشهد وهمية */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 40%, rgba(31, 224, 122, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(245, 200, 66, 0.06) 0%, transparent 50%)",
            }}
          />

          {/* نص "مشغل تجريبي" */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, rgba(245, 200, 66, 0.2) 0%, rgba(31, 224, 122, 0.15) 100%)",
                border: "1px solid rgba(245, 200, 66, 0.4)",
              }}
            >
              {playing ? (
                <Pause className="h-7 w-7 text-white/70" />
              ) : (
                <Play className="h-7 w-7 translate-x-0.5 text-white/70" fill="currentColor" />
              )}
            </div>
            <p className="text-xs text-white/40">مشغل فيديو تجريبي</p>
          </div>

          {/* العلامة المائية — هنا يظهر الشعار */}
          <PlayerWatermark
            position={position}
            animation={animation}
            size={size}
            opacity={opacity}
          />

          {/* شريط تحكم سفلي وهمي */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 py-2.5"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)",
            }}
          >
            <button
              onClick={() => setPlaying((p) => !p)}
              className="text-white/80 transition-colors hover:text-white"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
            </button>
            <Volume2 className="h-5 w-5 text-white/60" />
            <div className="h-1 flex-1 rounded-full bg-white/20">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-l from-emerald-400 to-amber-300" />
            </div>
            <span className="text-[10px] text-white/50">00:42 / 02:14</span>
            <Maximize className="h-5 w-5 text-white/60" />
          </div>
        </div>

        {/* أدوات التحكم */}
        <div className="space-y-4">
          {/* الموضع */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 text-sm font-bold text-white/80">📌 الموضع</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {positions.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPosition(p.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    position === p.key
                      ? "bg-gradient-to-l from-emerald-500 to-amber-400 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* الأنيميشن */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-3 text-sm font-bold text-white/80">✨ الأنيميشن</p>
            <div className="grid grid-cols-3 gap-2">
              {animations.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAnimation(a.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    animation === a.key
                      ? "bg-gradient-to-l from-emerald-500 to-amber-400 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* الحجم */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-2 text-sm font-bold text-white/80">
              🔍 الحجم: <span className="text-amber-300">{size}px</span>
            </p>
            <input
              type="range"
              min={40}
              max={88}
              step={4}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* الشفافية */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-2 text-sm font-bold text-white/80">
              👁 الشفافية: <span className="text-amber-300">{Math.round(opacity * 100)}%</span>
            </p>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* الإعدادات الحالية */}
          <div
            className="rounded-xl p-4 text-center text-xs"
            style={{
              background: "linear-gradient(135deg, rgba(31, 224, 122, 0.12) 0%, rgba(245, 200, 66, 0.10) 100%)",
              border: "1px solid rgba(245, 200, 66, 0.25)",
            }}
          >
            <span className="text-white/60">الإعداد الحالي: </span>
            <span className="font-bold text-amber-300">
              {positions.find((p) => p.key === position)?.label} ·{" "}
              {animations.find((a) => a.key === animation)?.label} · {size}px ·{" "}
              {Math.round(opacity * 100)}%
            </span>
          </div>

          {/* ملاحظة */}
          <p className="text-center text-[11px] text-white/40">
            هذه صفحة معاينة فقط — لم يتم تطبيق العلامة المائية على المشغل الفعلي بعد.
            <br />
            اختر الإعداد المفضل وسأطبقه على مشغل القنوات والمباريات.
          </p>
        </div>
      </div>
    </div>
  );
}
