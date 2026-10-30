"use client";

import * as React from "react";
import { Search, Star, ChevronRight } from "lucide-react";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { AppLogo } from "@/components/shared/app-logo";
import { AppWordmark } from "@/components/shared/app-wordmark";

export function TopHeader({ title, subtitle, showBack = false }: { title?: string; subtitle?: string; showBack?: boolean }) {
  const setView = useNav((s) => s.setView);
  const back = useNav((s) => s.back);
  const canBack = useNav((s) => s.canBack());
  const favCount = useFavorites((s) => s.favorites.length);

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--card) 94%, transparent) 0%, color-mix(in srgb, var(--card) 80%, transparent) 100%)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
        boxShadow: "0 4px 20px -8px rgba(2, 20, 16, 0.12)",
      }}
    >
      {/* شريط ذهبي علوي رفيع */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 55%, transparent) 50%, transparent 100%)",
        }}
      />
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        {showBack && canBack ? (
          <button
            onClick={back}
            className="wz-glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-emerald transition-all hover:scale-105 active:scale-95"
            aria-label="رجوع"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => setView({ name: "home" })}
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="WazaNI TV"
          >
            <AppLogo size={48} />
            <AppWordmark />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <>
              <h1 className="wz-section-title truncate text-base font-extrabold">{title}</h1>
              {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
            </>
          )}
        </div>
        <button
          onClick={() => setView({ name: "search" })}
          className="wz-glass-chip flex h-9 w-9 items-center justify-center rounded-xl text-emerald transition-all hover:scale-105 active:scale-95"
          aria-label="بحث"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          onClick={() => setView({ name: "favorites" })}
          className="wz-glass-chip relative flex h-9 w-9 items-center justify-center rounded-xl text-emerald transition-all hover:scale-105 active:scale-95"
          aria-label="المفضلة"
        >
          <Star className="h-5 w-5" />
          {favCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                boxShadow: "0 2px 6px -1px color-mix(in srgb, var(--accent) 60%, transparent)",
              }}
            >
              {favCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

/**
 * Backwards-compatible `Logo` re-export so existing imports
 * (`import { Logo } from "@/components/shared/top-header"`) keep working.
 * Now renders the custom AppLogo instead of the generic shield icon.
 */
export function Logo({ size = 36 }: { size?: number }) {
  return <AppLogo size={size} />;
}

