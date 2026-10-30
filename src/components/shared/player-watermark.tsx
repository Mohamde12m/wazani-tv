"use client";

import * as React from "react";
import Image from "next/image";

/**
 * PlayerWatermark — علامة مائية متحركة لشعار WazaNI TV في المشغل
 *
 * أنيميشن CSS احترافي (لا حاجة لملف فيديو):
 * - توهج ذهبي ناعم يتنفس (gold breathe)
 * - لمعان يمر على الشعار (shimmer)
 * - ظهور تدريجي (fade in)
 *
 * يمكن وضعه في أي زاوية من المشغل.
 */

export type WatermarkPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type WatermarkAnimation = "glow" | "shimmer" | "both";

const positionClasses: Record<WatermarkPosition, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

export function PlayerWatermark({
  position = "top-left",
  animation = "both",
  size = 56,
  opacity = 0.75,
  logoSrc = "/wazani-logo.png",
}: {
  position?: WatermarkPosition;
  animation?: WatermarkAnimation;
  size?: number;
  opacity?: number;
  logoSrc?: string;
}) {
  const [hovered, setHovered] = React.useState(false);
  const currentOpacity = hovered ? 1 : opacity;

  return (
    <div
      className={`pointer-events-auto absolute z-20 ${positionClasses[position]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transition: "opacity 0.3s ease",
        opacity: currentOpacity,
      }}
    >
      <div
        className="relative"
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          overflow: "hidden",
          animation: "wz-wm-fade-in 0.6s ease-out both",
        }}
      >
        {/* توهج ذهبي خلفي */}
        {(animation === "glow" || animation === "both") && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              borderRadius: 14,
              boxShadow: "0 0 16px 2px rgba(245, 200, 66, 0.5)",
              animation: "wz-wm-glow 3s ease-in-out infinite",
            }}
          />
        )}

        {/* الشعار */}
        <div
          className="relative h-full w-full"
          style={{
            background: "linear-gradient(135deg, rgba(2,20,16,0.55) 0%, rgba(2,43,28,0.4) 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(245, 200, 66, 0.35)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <Image
            src={logoSrc}
            alt="WazaNI TV"
            fill
            sizes={`${size}px`}
            className="object-contain p-1.5"
            priority
          />

          {/* لمعان يمر (shimmer) */}
          {animation === "shimmer" || animation === "both" ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
                backgroundSize: "250% 100%",
                animation: "wz-wm-shimmer 4s ease-in-out infinite",
              }}
            />
          ) : null}

          {/* حافة ذهبية لامعة */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[14px]"
            style={{
              boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.18)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes wz-wm-fade-in {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes wz-wm-glow {
          0%, 100% {
            box-shadow: 0 0 10px 0 rgba(245, 200, 66, 0.35);
          }
          50% {
            box-shadow: 0 0 22px 4px rgba(245, 200, 66, 0.65);
          }
        }
        @keyframes wz-wm-shimmer {
          0%   { background-position: 120% 0; }
          60%  { background-position: -20% 0; }
          100% { background-position: -20% 0; }
        }
      `}</style>
    </div>
  );
}
