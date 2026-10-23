"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WazaNI TV — official brand logo (static image).
 *
 * Renders the exact user-provided artwork as-is from /wazani-logo.png
 * (rounded-square dark-emerald badge with the W + golden TV icon,
 * "WazaNI TV" wordmark, and "LIVE TV • SPORTS • ARABIC CHANNELS" tagline).
 * No effects are applied to the logo itself — it stays as a clean image
 * exactly as designed. The dynamic/animated treatment lives on the
 * wordmark text beside the logo (see AppWordmark), not on the logo.
 */
export function AppLogo({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/wazani-logo.png"
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
  size = 48,
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
