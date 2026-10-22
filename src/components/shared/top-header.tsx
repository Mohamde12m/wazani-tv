"use client";

import * as React from "react";
import { Search, Star, ChevronRight } from "lucide-react";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { AppLogo } from "@/components/shared/app-logo";
import { cn } from "@/lib/utils";

export function TopHeader({ title, subtitle, showBack = false }: { title?: string; subtitle?: string; showBack?: boolean }) {
  const setView = useNav((s) => s.setView);
  const back = useNav((s) => s.back);
  const canBack = useNav((s) => s.canBack());
  const favCount = useFavorites((s) => s.favorites.length);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        {showBack && canBack ? (
          <button
            onClick={back}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-emerald transition-colors hover:bg-secondary/70"
            aria-label="رجوع"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => setView({ name: "home" })}
            className="flex items-center"
            aria-label="WazaNI TV"
          >
            <AppLogo size={48} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {title && (
            <>
              <h1 className="truncate text-base font-extrabold text-foreground">{title}</h1>
              {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
            </>
          )}
        </div>
        <button
          onClick={() => setView({ name: "search" })}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-emerald transition-colors hover:bg-secondary/70"
          aria-label="بحث"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          onClick={() => setView({ name: "favorites" })}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-emerald transition-colors hover:bg-secondary/70"
          aria-label="المفضلة"
        >
          <Star className="h-5 w-5" />
          {favCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
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

