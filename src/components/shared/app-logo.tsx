"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WazaNI TV — official brand logo.
 *
 * Always renders the FULL lockup artwork (icon + "WazaNI TV" wordmark +
 * "LIVE TV • SPORTS • ARABIC CHANNELS" tagline) from /wazani-logo.png,
 * at every size, so the complete logo with all its text is visible
 * everywhere in the app as required.
 *
 * The logo is a square (1:1) so we keep width === height and use
 * object-cover to fill the rounded badge nicely.
 */
export function AppLogo({
  size = 40,
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
