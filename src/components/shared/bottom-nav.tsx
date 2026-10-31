"use client";

import * as React from "react";
import { Home, Tv, Trophy, Film, Menu } from "lucide-react";
import { useNav } from "@/stores/nav";
import { cn } from "@/lib/utils";

const items = [
  { key: "home", label: "الرئيسية", icon: Home },
  { key: "channels", label: "القنوات", icon: Tv },
  { key: "matches", label: "المباريات", icon: Trophy },
  { key: "movies", label: "أفلام", icon: Film },
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
      {/* الشريط الزجاجي السينمائي */}
      <div
        className="relative mx-auto max-w-3xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--card) 92%, transparent) 0%, color-mix(in srgb, var(--card) 82%, transparent) 100%)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderTop: "1px solid color-mix(in srgb, var(--accent) 32%, transparent)",
          borderBottom: "1px solid color-mix(in srgb, var(--primary) 14%, transparent)",
          boxShadow:
            "0 -10px 36px -8px rgba(2, 20, 16, 0.22), 0 -1px 0 0 color-mix(in srgb, var(--accent) 22%, transparent)",
        }}
      >
        {/* شريط ذهبي علوي رفيع متحرك */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--accent) 20%, var(--color-gold-light) 50%, var(--accent) 80%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "wazani-gold-shimmer 5s linear infinite",
          }}
        />

        {/* توهج ذهبي خلفي */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 70%)",
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
                {/* الكبسولة الزجاجية النشطة — سينمائية */}
                {isActive && (
                  <span
                    className="absolute top-0.5 h-9 w-12 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, transparent) 0%, color-mix(in srgb, var(--accent) 16%, transparent) 100%)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      border: "1px solid color-mix(in srgb, var(--accent) 42%, transparent)",
                      animation: "wazani-glass-glow 2.8s ease-in-out infinite",
                    }}
                  >
                    {/* بريق ذهبي متحرك */}
                    <span
                      className="absolute inset-0 overflow-hidden rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 50%, transparent), transparent)",
                        backgroundSize: "200% 100%",
                        animation: "wazani-gold-shimmer 3s linear infinite",
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
                            color: "var(--primary)",
                            filter:
                              "drop-shadow(0 1px 2px color-mix(in srgb, var(--primary) 40%, transparent)) drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 50%, transparent))",
                          }
                        : { color: "var(--muted-foreground)" }
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
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                    textShadow: isActive
                      ? "0 0 10px color-mix(in srgb, var(--accent) 45%, transparent)"
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
                      background: "var(--accent)",
                      boxShadow: "0 0 8px 1px color-mix(in srgb, var(--accent) 70%, transparent)",
                      animation: "wazani-dot-pulse 1.6s ease-in-out infinite",
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
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 60%, transparent) 50%, transparent 100%)",
          }}
        />
      </div>
    </nav>
  );
}
