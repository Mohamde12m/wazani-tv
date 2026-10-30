"use client";

import * as React from "react";

/**
 * Skeleton/Shimmer Loading Components
 *
 * مكونات التحميل اللامع بدلًا من الدوارة (spinner)
 * تعطي إحساس احترافي أثناء تحميل البيانات
 */

export function SkeletonChannelCard() {
  return (
    <div className="w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[4/3] w-full">
        <div className="wazani-skeleton h-full w-full" />
        <div className="absolute right-2 top-2 h-5 w-12 rounded-full wazani-skeleton" />
      </div>
      <div className="space-y-1.5 p-2">
        <div className="h-3 w-3/4 rounded wazani-skeleton" />
        <div className="h-2 w-1/2 rounded wazani-skeleton" />
        <div className="flex items-center gap-1">
          <div className="h-4 w-12 rounded-full wazani-skeleton" />
          <div className="h-4 w-12 rounded-full wazani-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonMatchCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 w-24 rounded wazani-skeleton" />
        <div className="h-5 w-12 rounded-full wazani-skeleton" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="h-12 w-12 rounded-full wazani-skeleton" />
          <div className="h-2 w-14 rounded wazani-skeleton" />
        </div>
        <div className="h-6 w-12 rounded wazani-skeleton" />
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="h-12 w-12 rounded-full wazani-skeleton" />
          <div className="h-2 w-14 rounded wazani-skeleton" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-2 w-20 rounded wazani-skeleton" />
        <div className="h-7 w-16 rounded-lg wazani-skeleton" />
      </div>
    </div>
  );
}

export function SkeletonChannelGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-square w-full wazani-skeleton" />
          <div className="space-y-1.5 p-2">
            <div className="h-3 w-3/4 rounded wazani-skeleton" />
            <div className="h-2 w-1/2 rounded wazani-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMatchList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMatchCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChannelRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden px-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChannelCard key={i} />
      ))}
    </div>
  );
}
