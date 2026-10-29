"use client";

import * as React from "react";
import { Home, Tv, Trophy, Star, Menu } from "lucide-react";
import { useNav } from "@/stores/nav";
import { cn } from "@/lib/utils";

const items = [
  { key: "home", label: "الرئيسية", icon: Home },
  { key: "channels", label: "القنوات", icon: Tv },
  { key: "matches", label: "المباريات", icon: Trophy },
  { key: "favorites", label: "المفضلة", icon: Star },
  { key: "more", label: "المزيد", icon: Menu },
] as const;

export function BottomNav() {
  const view = useNav((s) => s.view);
  const setView = useNav((s) => s.setView);
  const active = view.name;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* الشريط الزجاجي الأساسي */}
      <div
        className="relative mx-auto max-w-3xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(250,248,240,0.8) 50%, rgba(255,255,255,0.85) 100%)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderTop: "1px solid rgba(218, 165, 32, 0.3)",
          borderBottom: "1px solid rgba(0, 135, 90, 0.1)",
          boxShadow:
            "0 -8px 32px -8px rgba(0, 48, 32, 0.15), 0 -1px 0 0 rgba(255, 215, 0, 0.15)",
        }}
      >
        {/* شريط ذهبي علوي رفيع متحرك */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #FFD700 20%, #DAA520 50%, #FFD700 80%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "wazani-gold-shimmer 4s linear infinite",
          }}
        />

        {/* تأثير ضوء ذهبي خلفي يتحرك ببطء */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex items-stretch justify-between px-2 py-1.5">
          {items.map((it, index) => {
            const Icon = it.icon;
            const isActive = active === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setView({ name: it.key } as never)}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-all duration-300",
                  "active:scale-95",
                )}
                style={{
                  animation: mounted
                    ? `wazani-fade-up 0.4s ease-out ${index * 0.06}s both`
                    : undefined,
                }}
              >
                {/* الكبسولة الزجاجية النشطة */}
                {isActive && (
                  <span
                    className="absolute top-0.5 h-9 w-12 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0, 135, 90, 0.12) 0%, rgba(218, 165, 32, 0.12) 100%)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 215, 0, 0.35)",
                      animation: "wazani-glass-glow 2.5s ease-in-out infinite",
                    }}
                  >
                    {/* بريق ذهبي متحرك */}
                    <span
                      className="absolute inset-0 overflow-hidden rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent)",
                        backgroundSize: "200% 100%",
                        animation: "wazani-gold-shimmer 2.5s linear infinite",
                      }}
                    />
                  </span>
                )}

                {/* الأيقونة */}
                <span
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center transition-all duration-300",
                    isActive ? "scale-110 -translate-y-0.5" : "scale-100",
                  )}
                  style={
                    isActive
                      ? { animation: "wazani-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }
                      : undefined
                  }
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.6 : 2}
                    style={
                      isActive
                        ? {
                            color: "#00875A",
                            filter:
                              "drop-shadow(0 1px 2px rgba(0, 135, 90, 0.3)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))",
                          }
                        : { color: "#5C6B62" }
                    }
                  />
                </span>

                {/* النص */}
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-bold transition-all duration-300",
                    isActive ? "scale-105" : "",
                  )}
                  style={{
                    color: isActive ? "#00875A" : "#5C6B62",
                    textShadow: isActive
                      ? "0 0 8px rgba(255, 215, 0, 0.4)"
                      : "none",
                  }}
                >
                  {it.label}
                </span>

                {/* نقطة ذهبية نابضة أسفل الأيقونة النشطة */}
                {isActive && (
                  <span
                    className="absolute bottom-0 h-1 w-1 rounded-full"
                    style={{
                      background: "#FFD700",
                      boxShadow: "0 0 6px 1px rgba(255, 215, 0, 0.6)",
                      animation: "wazani-dot-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* شريط ذهبي سفلي رفيع */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(218, 165, 32, 0.5) 50%, transparent 100%)",
          }}
        />
      </div>
    </nav>
  );
}
