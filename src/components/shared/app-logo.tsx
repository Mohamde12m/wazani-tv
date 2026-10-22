"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * WazaNI TV — animated brand logo (SVG).
 *
 * A faithful, dynamic recreation of the official logo:
 *  - rounded-square dark-emerald gradient badge with a thin gold border
 *  - a glossy ribbon "W" on the left
 *  - a golden retro TV (with antenna + play-button cutout) on the right
 *  - the "WazaNI TV" wordmark (white "WazaNI" + gold "TV")
 *  - the "LIVE TV • SPORTS • ARABIC CHANNELS" tagline with gold dots
 *  - a gold progress-bar line + play triangle at the bottom
 *
 * Live animations (defined in globals.css):
 *  • a golden sheen sweeps diagonally across the badge
 *  • the whole badge gently breathes (scale + shadow)
 *  • the golden TV body glows on/off
 *  • the antenna tips blink like signal lights (staggered)
 *  • the play triangle pulses to invite a click
 *  • the bottom progress line fills/empties like a media loader
 *
 * Honors `prefers-reduced-motion` for accessibility.
 */
export function AppLogo({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "wazani-breathe relative shrink-0 overflow-hidden rounded-[22%] bg-emerald-dark",
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label="WazaNI TV"
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        <defs>
          {/* Badge background: dark emerald, lighter top-left → near-black bottom-right */}
          <radialGradient id="wz-bg" cx="32%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#0f6b4d" />
            <stop offset="55%" stopColor="#0a3d2e" />
            <stop offset="100%" stopColor="#052017" />
          </radialGradient>
          {/* Gold gradient for the TV body + border + accents */}
          <linearGradient id="wz-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4d488" />
            <stop offset="45%" stopColor="#e3b45a" />
            <stop offset="100%" stopColor="#b8841f" />
          </linearGradient>
          {/* Glossy emerald gradient for the "W" ribbon */}
          <linearGradient id="wz-emerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          {/* Soft white gradient for "WazaNI" text */}
          <linearGradient id="wz-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
          {/* Clip so the sheen stays inside the badge */}
          <clipPath id="wz-clip">
            <rect x="4" y="4" width="112" height="112" rx="26" />
          </clipPath>
        </defs>

        {/* ---- Badge background ---- */}
        <rect x="4" y="4" width="112" height="112" rx="26" fill="url(#wz-bg)" />

        {/* ---- Thin gold border (luxury frame) ---- */}
        <rect
          x="5"
          y="5"
          width="110"
          height="110"
          rx="25"
          fill="none"
          stroke="url(#wz-gold)"
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* All inner artwork clipped to the badge */}
        <g clipPath="url(#wz-clip)">
          {/* ===== Icon row (top ~46px) ===== */}
          {/* Glossy "W" ribbon — left side */}
          <g fill="url(#wz-emerald)" stroke="#065f46" strokeWidth="0.6">
            <path d="M16 30 L22 54 L28 38 L34 54 L40 30 L34 30 L30 44 L26 34 L22 44 L18 30 Z" />
          </g>
          {/* W highlight (glossy top edge) */}
          <path
            d="M17 31 L19 33 L22 44 L24 41 Z M34 31 L36 33 L40 31 Z"
            fill="#ffffff"
            opacity="0.35"
          />

          {/* ===== Golden retro TV — right side, overlapping the W ===== */}
          <g className="wazani-glow">
            {/* Antenna rods */}
            <g
              stroke="url(#wz-gold)"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M64 30 L60 40" />
              <path d="M74 30 L78 40" />
            </g>
            {/* Antenna signal balls — staggered blink */}
            <circle cx="60" cy="39" r="1.7" fill="url(#wz-gold)" className="wazani-signal" />
            <circle cx="78" cy="39" r="1.7" fill="url(#wz-gold)" className="wazani-signal-delay" />

            {/* TV body (rounded gold rectangle) */}
            <rect
              x="50"
              y="40"
              width="42"
              height="28"
              rx="4.5"
              fill="url(#wz-gold)"
              stroke="#8a6418"
              strokeWidth="0.5"
            />
            {/* TV body gloss */}
            <rect x="51.5" y="41.5" width="39" height="5" rx="2.5" fill="#ffffff" opacity="0.3" />

            {/* TV screen (dark cutout) */}
            <rect x="54" y="44" width="28" height="20" rx="2.5" fill="#052017" />

            {/* Play triangle (cut-out style) — pulses */}
            <g className="wazani-play">
              <path
                d="M64 47 L64 61 L75 54 Z"
                fill="url(#wz-gold)"
              />
            </g>

            {/* TV stand */}
            <path d="M62 68 L80 68 L82 72 L60 72 Z" fill="url(#wz-gold)" />
            {/* TV side knobs */}
            <circle cx="94" cy="48" r="1.1" fill="url(#wz-gold)" opacity="0.9" />
            <circle cx="94" cy="52" r="0.9" fill="url(#wz-gold)" opacity="0.7" />
          </g>

          {/* ===== Wordmark "WazaNI TV" ===== */}
          <text
            x="60"
            y="92"
            textAnchor="middle"
            fontFamily="Cairo, system-ui, sans-serif"
            fontWeight="800"
            fontSize="13"
            letterSpacing="0.3"
          >
            <tspan fill="url(#wz-white)">WazaNI</tspan>
            <tspan fill="url(#wz-gold)"> TV</tspan>
          </text>

          {/* ===== Tagline ===== */}
          <text
            x="60"
            y="101"
            textAnchor="middle"
            fontFamily="Cairo, system-ui, sans-serif"
            fontWeight="600"
            fontSize="4.2"
            letterSpacing="0.6"
            fill="#e8e8e8"
            opacity="0.92"
          >
            LIVE TV • SPORTS • ARABIC CHANNELS
          </text>

          {/* ===== Bottom progress-bar line + play triangle (loader) ===== */}
          <line
            x1="26"
            y1="108"
            x2="94"
            y2="108"
            stroke="url(#wz-gold)"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.35"
          />
          <line
            x1="26"
            y1="108"
            x2="94"
            y2="108"
            stroke="url(#wz-gold)"
            strokeWidth="1.1"
            strokeLinecap="round"
            className="wazani-fill"
            pathLength={120}
          />
          <path d="M58 106 L58 110 L62 108 Z" fill="url(#wz-gold)" />
        </g>

        {/* ===== Sweeping golden sheen (top overlay) ===== */}
        <g clipPath="url(#wz-clip)" pointerEvents="none">
          <rect
            x="-40"
            y="0"
            width="24"
            height="120"
            fill="url(#wz-gold)"
            opacity="0.0"
            className="wazani-sheen"
            transform="skewX(-18)"
          />
        </g>
      </svg>
    </div>
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
