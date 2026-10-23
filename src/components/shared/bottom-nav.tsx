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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setView({ name: it.key } as never)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                isActive ? "text-emerald" : "text-muted-foreground",
              )}
            >
              {isActive && (
                <span className="absolute -top-px h-1 w-10 rounded-full bg-gradient-to-l from-emerald to-gold" />
              )}
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  isActive ? "bg-emerald/10" : "",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.6 : 2} />
              </span>
              <span className={cn("text-[10px] font-bold", isActive && "text-emerald")}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
