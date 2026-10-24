"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/img";

/**
 * ChannelLogo — يعرض شعار القناة بشكل موثوق.
 *
 * - إذا كان الشعار data URL (مرفوع من الجهاز): يظهر مباشرة
 * - إذا كان رابطًا خارجيًا: يمر عبر /api/img proxy
 * - إذا فشل التحميل: يعيد المحاولة مرة واحدة، ثم يعرض الحرف الأول
 * - الحرف الأول يظهر كـ fallback أنيق (دائرة متدرجة)
 */
export function ChannelLogo({
  src,
  name,
  className,
  size = 56,
}: {
  src?: string | null;
  name: string;
  className?: string;
  size?: number;
}) {
  const [error, setError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const show = src && !error;

  // إعادة تعيين حالة الخطأ عندما يتغير src
  React.useEffect(() => {
    setError(false);
    setRetryCount(0);
  }, [src]);

  const handleError = React.useCallback(() => {
    // أعد المحاولة مرة واحدة فقط
    if (retryCount < 1) {
      setRetryCount((c) => c + 1);
    } else {
      setError(true);
    }
  }, [retryCount]);

  // إضافة معامل إعادة المحاولة للروابط الخارجية فقط (ليس data URLs)
  const resolvedSrc = React.useMemo(() => {
    if (!src) return undefined;
    const base = imgUrl(src);
    if (!base) return undefined;
    // للروابط الخارجية، أضف معامل cache-bust عند إعادة المحاولة
    if (retryCount > 0 && base.startsWith("/api/img?url=")) {
      return `${base}&retry=${retryCount}`;
    }
    return base;
  }, [src, retryCount]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-light/20 to-emerald/10 ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {show ? (
        <img
          key={retryCount}
          src={resolvedSrc}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleError}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-bold text-emerald"
          style={{ fontSize: size * 0.32 }}
        >
          {name.trim().slice(0, 1)}
        </span>
      )}
    </div>
  );
}
