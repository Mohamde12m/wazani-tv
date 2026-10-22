"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WazaNI TV — custom brand logo (SVG).
 *
 * Concept: a rounded-square emerald gradient badge containing a stylized
 * television screen silhouette whose screen holds a golden soccer ball,
 * with a subtle gold accent ring. Conveys both "TV" and "football".
 *
 * Pure SVG so it stays razor-sharp at any size and supports theming.
 */
export function AppLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="WazaNI TV"
      className={cn("shrink-0", className)}
    >
      <defs>
        {/* Emerald gradient for the badge background */}
        <linearGradient id="wazani-emerald" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f9b6e" />
          <stop offset="1" stopColor="#084d37" />
        </linearGradient>
        {/* Gold gradient for the ball + ring */}
        <linearGradient id="wazani-gold" x1="22" y1="26" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e3b45a" />
          <stop offset="1" stopColor="#c9962e" />
        </linearGradient>
        {/* Soft shadow under the badge */}
        <filter id="wazani-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#084d37" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer rounded-square badge */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="16"
        fill="url(#wazani-emerald)"
        filter="url(#wazani-shadow)"
      />
      {/* Subtle gold inner ring (luxury accent) */}
      <rect
        x="7.5"
        y="7.5"
        width="49"
        height="49"
        rx="13"
        stroke="#c9962e"
        strokeOpacity="0.35"
        strokeWidth="0.75"
      />

      {/* TV antenna (playful retro nod) */}
      <g stroke="#e3b45a" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        <path d="M26 17 L31 24" />
        <path d="M38 17 L33 24" />
        <circle cx="32" cy="24" r="1.2" fill="#e3b45a" stroke="none" />
      </g>

      {/* Television body */}
      <rect
        x="16"
        y="23"
        width="32"
        height="22"
        rx="4"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      {/* TV screen (recessed) */}
      <rect
        x="18.5"
        y="25.5"
        width="22"
        height="17"
        rx="2.5"
        fill="#084d37"
      />
      {/* TV stand/base */}
      <path
        d="M27 45 L37 45 L38.5 49 L25.5 49 Z"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      {/* TV side knob detail */}
      <circle cx="44.5" cy="29" r="1.1" fill="#c9962e" />
      <circle cx="44.5" cy="33" r="0.9" fill="#c9962e" fillOpacity="0.7" />
      <circle cx="44.5" cy="37" r="0.7" fill="#c9962e" fillOpacity="0.5" />

      {/* Soccer ball inside the screen */}
      <g>
        <circle cx="29.5" cy="34" r="5.4" fill="url(#wazani-gold)" />
        {/* Ball pentagon pattern (simplified) */}
        <path
          d="M29.5 30.2 L31.7 31.8 L30.9 34.5 L28.1 34.5 L27.3 31.8 Z"
          fill="#084d37"
          fillOpacity="0.9"
        />
        <path
          d="M29.5 30.2 L29.5 28.6 M31.7 31.8 L33.4 31.4 M30.9 34.5 L32.3 36.6 M28.1 34.5 L26.7 36.6 M27.3 31.8 L25.6 31.4"
          stroke="#084d37"
          strokeOpacity="0.85"
          strokeWidth="0.6"
          strokeLinecap="round"
        />
      </g>

      {/* Gold corner accent dot (brand signature) */}
      <circle cx="52" cy="12" r="2" fill="#e3b45a" />
    </svg>
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
