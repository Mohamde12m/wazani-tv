"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  icon,
  action,
  onAction,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-gold">{icon}</span>}
        <h2 className="text-base font-extrabold text-foreground sm:text-lg">{title}</h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="rounded-full px-3 py-1 text-xs font-bold text-emerald transition-colors hover:bg-secondary"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function ChannelRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {children}
    </div>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        {icon ?? <span className="text-2xl">📭</span>}
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      {subtitle && <p className="px-6 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function LoadingRow({ count = 4 }: { count?: number }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer h-[200px] w-[150px] shrink-0 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

export function LoadingGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer h-44 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
