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
        background:
          "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(31, 224, 122, 0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(245, 200, 66, 0.12) 0%, transparent 55%), linear-gradient(180deg, #021410 0%, #04190F 50%, #021410 100%)",
      }}
    >
      {/* ===== جسيمات متحركة (Particles) — CSS فقط (لا Math.random) لتجنب hydration mismatch ===== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="splash-particle splash-particle-1" />
        <div className="splash-particle splash-particle-2" />
        <div className="splash-particle splash-particle-3" />
        <div className="splash-particle splash-particle-4" />
        <div className="splash-particle splash-particle-5" />
        <div className="splash-particle splash-particle-6" />
        <div className="splash-particle splash-particle-7" />
        <div className="splash-particle splash-particle-8" />
      </div>

      {/* ===== تدرج خلفي متحرك ===== */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(31, 224, 122, 0.22) 0%, transparent 60%)",
          animation: "pulse 3s ease-in-out infinite",
        }}
      />

      {/* ===== توهج ذهبي سفلي سينمائي ===== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(245, 200, 66, 0.08) 100%)",
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
          Waza<span className="bg-gradient-to-l from-emerald-300 to-amber-300 bg-clip-text text-transparent">NI</span> TV
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
            className="h-full rounded-full bg-gradient-to-l from-emerald-300 via-emerald-400 to-amber-300 transition-all duration-100"
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
        /* جسيمات CSS ثابتة (لا Math.random) لتجنب hydration mismatch */
        .splash-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(31, 224, 122, 0.3);
          animation: float 4s ease-in-out infinite;
        }
        .splash-particle-1 { width: 4px; height: 4px; left: 10%; top: 20%; animation-delay: 0s; }
        .splash-particle-2 { width: 6px; height: 6px; left: 80%; top: 30%; animation-delay: 0.5s; }
        .splash-particle-3 { width: 3px; height: 3px; left: 30%; top: 70%; animation-delay: 1s; }
        .splash-particle-4 { width: 5px; height: 5px; left: 60%; top: 80%; animation-delay: 1.5s; }
        .splash-particle-5 { width: 4px; height: 4px; left: 90%; top: 60%; animation-delay: 0.3s; }
        .splash-particle-6 { width: 6px; height: 6px; left: 20%; top: 50%; animation-delay: 0.8s; }
        .splash-particle-7 { width: 3px; height: 3px; left: 50%; top: 15%; animation-delay: 1.2s; }
        .splash-particle-8 { width: 5px; height: 5px; left: 70%; top: 90%; animation-delay: 1.8s; }
      `}</style>
    </div>
  );
}
