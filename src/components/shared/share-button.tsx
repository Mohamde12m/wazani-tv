"use client";

import * as React from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * ShareButton - زر مشاركة المباراة/القناة
 *
 * يستخدم Web Share API (يعمل على الجوال + PWA)
 * مع fallback لنسخ الرابط للحافظة
 */
export function ShareButton({
  title,
  text,
  url,
  className = "",
  size = "sm",
}: {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = {
      title,
      text: text || title,
      url: shareUrl,
    };

    // جرّب Web Share API أولًا (يعمل على الجوال + PWA)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // المستخدم ألغى المشاركة — لا تفعل شيئًا
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback: نسخ الرابط للحافظة
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذّر نسخ الرابط");
    }
  };

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
  };

  return (
    <button
      onClick={handleShare}
      className={`flex ${sizeClasses[size]} items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-gold hover:text-gold active:scale-90 ${className}`}
      aria-label="مشاركة"
    >
      <Share2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </button>
  );
}
