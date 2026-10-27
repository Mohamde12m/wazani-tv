"use client";

import * as React from "react";

/**
 * شاشة البداية (Splash Screen) — احترافية بتأثيرات ديناميكية
 * تظهر عند فتح التطبيق لمدة 2.5 ثانية ثم تختفي
 *
 * المميزات:
 * - شعار متحرك مع توهج نابض
 * - جسيمات متحركة (particles)
 * - تدرج خلفي متحرك
 * - شريط تحميل أنيق
 * - اسم التطبيق بتأثير typewriter
 */
export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const [progress, setProgress] = React.useState(0);
  const [fadeOut, setFadeOut] = React.useState(false);

  React.useEffect(() => {
    // تحديث شريط التحميل
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          // ابدأ الاختفاء التدريجي
          setTimeout(() => setFadeOut(true), 200);
          // أبلغ الـ parent بعد الاختفاء
          setTimeout(() => onFinish?.(), 600);
          return 100;
        }
        return p + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #06140f 0%, #0b2820 50%, #06140f 100%)",
      }}
    >
      {/* ===== جسيمات متحركة (Particles) ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-400/30"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* ===== تدرج خلفي متحرك ===== */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(11, 110, 79, 0.3) 0%, transparent 60%)",
          animation: "pulse 3s ease-in-out infinite",
        }}
      />

      {/* ===== المحتوى ===== */}
      <div className="relative z-10 flex flex-col items-center">
        {/* الشعار مع توهج نابض */}
        <div className="relative mb-6">
          {/* توهج خلفي */}
          <div
            className="absolute inset-0 -z-10 scale-150 rounded-full bg-emerald-500/40 blur-3xl"
            style={{ animation: "glow 2s ease-in-out infinite" }}
          />
          {/* الشعار */}
          <img
            src="/icon-512.png"
            alt="WazaNI TV"
            className="h-32 w-32 rounded-3xl shadow-2xl ring-2 ring-emerald-500/50"
            style={{
              animation: "logoEntry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </div>

        {/* اسم التطبيق */}
        <h1
          className="mb-2 text-4xl font-extrabold text-white"
          style={{
            animation: "textEntry 0.8s ease-out 0.3s both",
          }}
        >
          Waza<span className="bg-gradient-to-l from-emerald-400 to-amber-400 bg-clip-text text-transparent">NI</span> TV
        </h1>

        {/* الوصف */}
        <p
          className="mb-8 text-sm text-white/60"
          style={{
            animation: "textEntry 0.8s ease-out 0.5s both",
          }}
        >
          القنوات العربية ومباريات كرة القدم
        </p>

        {/* شريط التحميل */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-emerald-600 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* نسبة التحميل */}
        <p
          className="mt-3 text-xs text-white/40"
          style={{ animation: "textEntry 0.8s ease-out 0.7s both" }}
        >
          {progress < 100 ? "جاري التحميل..." : "جاهز"}
        </p>
      </div>

      {/* ===== أنماط CSS المضمّنة ===== */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; transform: scale(1.5); }
          50% { opacity: 0.7; transform: scale(1.8); }
        }
        @keyframes logoEntry {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes textEntry {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
