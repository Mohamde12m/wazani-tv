"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WazaNI TV — official brand logo.
 *
 * Uses two static PNG assets derived from the user-provided artwork:
 *  - /wazani-logo.png        — full lockup (icon + "WazaNI TV" wordmark + tagline)
 *  - /wazani-logo-mark.png   — icon-only crop (the "W" + golden TV) for small sizes
 *
 * Small renderings (≤48px) use the mark so the artwork stays legible; larger
 * renderings (login screens, about cards) use the full lockup.
 */
export function AppLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Below this threshold the wordmark text inside the full logo becomes hard
  // to read, so we switch to the icon-only mark.
  const useMark = size < 56;
  const src = useMark ? "/wazani-logo-mark.png" : "/wazani-logo.png";
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="WazaNI TV"
      role="img"
      aria-label="WazaNI TV"
      draggable={false}
      className={cn(
        "shrink-0 rounded-2xl object-cover bg-emerald-dark",
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Full lockup: logo + "WazaNI TV" wordmark. Use in headers/landing.
 * "Waza" emerald, "NI" gold gradient, "TV" muted.
 */
export function AppLogoLockup({
  size = 40,
  className,
  showTagline = false,
}: {
  size?: number;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AppLogo size={size} />
      <div className="text-right leading-tight">
        <h1 className="text-lg font-extrabold text-emerald">
          Waza<span className="gold-text">NI</span>{" "}
          <span className="text-sm font-bold text-muted-foreground">TV</span>
        </h1>
        {showTagline && (
          <p className="-mt-0.5 text-[9px] text-muted-foreground">
            القنوات العربية ومباريات كرة القدم
          </p>
        )}
      </div>
    </div>
  );
}
