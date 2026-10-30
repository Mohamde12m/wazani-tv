"use client";

import * as React from "react";

/**
 * Ripple Effect — تأثير الموجة عند النقر (Material Design)
 *
 * كيف يعمل:
 * - يلتقط موقع النقر داخل العنصر
 * - ينشئ موجة دائرية تتوسع من نقطة النقر
 * - تتلاشى بعد 600ms
 *
 * الاستخدام:
 * <Ripple>
 *   <button>اضغط هنا</button>
 * </Ripple>
 *
 * أو كـ wrapper:
 * <div className="relative overflow-hidden">
 *   <Ripple />
 *   المحتوى
 * </div>
 */
export function Ripple({ children, color = "rgba(255, 215, 0, 0.4)" }: { children?: React.ReactNode; color?: string }) {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.6;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y, size }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative overflow-hidden"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            borderRadius: "50%",
            background: color,
            transform: "scale(0)",
            animation: "wazani-ripple 0.6s ease-out",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Hook لإضافة ripple effect لأي عنصر
 */
export function useRipple(color = "rgba(255, 215, 0, 0.4)") {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  const addRipple = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 0.6;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y, size }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const ripplesEl = (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            borderRadius: "50%",
            background: color,
            transform: "scale(0)",
            animation: "wazani-ripple 0.6s ease-out",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ))}
    </>
  );

  return { addRipple, ripples: ripplesEl };
}
