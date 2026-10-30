"use client";

import * as React from "react";

/**
 * PullToRefresh - اسحب للتحديث
 *
 * كيف يعمل:
 * - يكتشف اللمس في أعلى الصفحة
 * - عند السحب للأسفل أكثر من 70px، يظهر مؤشر التحديث
 * - عند الإفلات، يستدعي onRefresh
 *
 * الاستخدام:
 * <PullToRefresh onRefresh={async () => { await reload(); }}>
 *   <div>المحتوى</div>
 * </PullToRefresh>
 */
export function PullToRefresh({
  children,
  onRefresh,
}: {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
}) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startY = React.useRef(0);
  const isPulling = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const THRESHOLD = 70;
  const MAX_PULL = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    // فقط لو كنا في أعلى الصفحة
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      // مقاومة السحب (rubber band)
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: "relative" }}
    >
      {/* مؤشر التحديث */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: pullDistance,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transition: isRefreshing ? "none" : "height 0.3s ease",
          zIndex: 10,
        }}
      >
        <div
          style={{
            transform: `rotate(${progress * 360}deg)`,
            opacity: progress,
            transition: "opacity 0.2s",
          }}
        >
          {isRefreshing ? (
            <div
              style={{
                width: 28,
                height: 28,
                border: "3px solid rgba(218, 165, 32, 0.2)",
                borderTopColor: "#DAA520",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DAA520"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9c2.39 0 4.68.94 6.4 2.6L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          )}
        </div>
      </div>

      {/* المحتوى */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? "none" : "transform 0.3s ease",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
