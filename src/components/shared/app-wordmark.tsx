"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WazaNI TV — animated wordmark text.
 *
 * Renders the app name "WazaNI TV" + optional tagline with premium,
 * tasteful motion:
 *  • on mount: the letters fade + slide in from the right (RTL) with a
 *    soft elastic ease.
 *  • continuously: the gold "NI" letters shimmer with a moving golden
 *    gradient (wazani-text-shine).
 *  • continuously: the tagline gently fades in/out (wazani-tagline-fade)
 *    for a subtle "live" feel.
 *
 * "Waza" is emerald, "NI" is a gold gradient, "TV" is muted.
 * Honors prefers-reduced-motion (animations disabled via globals.css).
 */
export function AppWordmark({
  className,
  showTagline = true,
  size = "md",
}: {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const nameCls =
    size === "lg"
      ? "text-3xl"
      : size === "sm"
        ? "text-base"
        : "text-lg";
  const tvCls =
    size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-sm";
  const tagCls =
    size === "lg" ? "text-[11px]" : size === "sm" ? "text-[8px]" : "text-[9px]";

  return (
    <div className={cn("text-right leading-tight", className)}>
      <h1
        className={cn(
          "wazani-text-in font-extrabold text-emerald",
          nameCls,
        )}
      >
        Waza
        {/* Gold "NI" with a moving shimmer gradient */}
        <span
          className="wazani-text-shine gold-text inline-block"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #c9962e 0%, #f4d488 25%, #fff7e0 50%, #f4d488 75%, #c9962e 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          NI
        </span>{" "}
        <span className={cn("font-bold text-muted-foreground", tvCls)}>TV</span>
      </h1>
      {showTagline && (
        <p
          className={cn(
            "wazani-tagline-fade -mt-0.5 font-semibold text-muted-foreground",
            tagCls,
          )}
        >
          القنوات العربية ومباريات كرة القدم
        </p>
      )}
    </div>
  );
}
