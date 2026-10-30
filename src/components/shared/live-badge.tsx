"use client";

import * as React from "react";

/**
 * LiveBadge — شارة "مباشر" نابضة
 *
 * تستخدم للمباريات المباشرة والقنوات النشطة
 * تعطي إحساس حيوي بالبث المباشر
 */
export function LiveBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[9px] gap-1",
    md: "px-2 py-1 text-[10px] gap-1",
    lg: "px-3 py-1.5 text-xs gap-1.5",
  };

  const dotSize = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizeClasses[size]} wazani-live-badge`}
    >
      <span className={`rounded-full bg-white ${dotSize[size]}`} />
      مباشر
    </span>
  );
}

/**
 * LiveDot - نقطة حمراء نابضة فقط (بدون نص)
 */
export function LiveDot() {
  return (
    <span
      className="inline-flex h-2 w-2 rounded-full bg-red-600"
      style={{
        animation: "wazani-live-pulse 1.5s ease-in-out infinite",
        boxShadow: "0 0 6px 1px rgba(220, 38, 38, 0.6)",
      }}
    />
  );
}
