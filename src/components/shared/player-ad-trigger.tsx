"use client";

import * as React from "react";
import { useNav } from "@/stores/nav";

/**
 * Player Ad Trigger — يفتح إعلان Popunder عند فتح مشغل قناة
 *
 * كيف يعمل:
 * - يراقب انتقال المستخدم إلى view = "player"
 * - بعد 8 ثوانٍ من فتح المشغل، يفتح إعلان Popunder
 * - مرة واحدة فقط لكل جلسة (session-based)
 * - يعمل في PWA والمتصفح العادي
 *
 * هذا "إعلان آخر في مكان آخر":
 * - الإعلان الأول (PopunderLoader): يفتح عند أول نقطة في أي مكان
 * - هذا الإعلان: يفتح عند مشاهدة قناة (مكان مختلف، توقيت مختلف)
 */
export function PlayerAdTrigger() {
  const view = useNav((s) => s.view);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    // لو المستخدم فتح مشغل قناة
    if (view.name !== "player") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // لا تكرر في نفس الجلسة
    const PLAYER_AD_KEY = "hilltopads_player_ad_fired";
    if (sessionStorage.getItem(PLAYER_AD_KEY)) return;

    // بعد 8 ثوانٍ من فتح المشغل، افتح الإعلان
    timerRef.current = setTimeout(() => {
      sessionStorage.setItem(PLAYER_AD_KEY, "1");
      fetch("/api/ads?slot=popunder")
        .then((r) => r.json())
        .then((d) => {
          if (!d.ads || d.ads.length === 0) return;
          const ad = d.ads[0];
          if (!ad.adCode) return;

          const srcMatch = ad.adCode.match(
            /\.src\s*=\s*["'](https?:)?\/\/([^"']+)["']/
          );
          if (!srcMatch) return;

          const url = `https://${srcMatch[2]}`;
          openAdUrl(url);
        })
        .catch(() => {});
    }, 8000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [view.name]);

  return null;
}

/**
 * يفتح رابط الإعلان (يعمل في PWA والمتصفح)
 * يستخدم <a>.click() فقط لتجنب فتح عدة تبويبات
 */
function openAdUrl(url: string) {
  try {
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS Safari
      window.navigator.standalone === true;

    const a = document.createElement("a");
    a.href = url;
    a.target = isPWA ? "_top" : "_blank";
    a.rel = "noopener noreferrer";
    a.style.position = "fixed";
    a.style.left = "-9999px";
    a.style.top = "0";
    a.style.width = "1px";
    a.style.height = "1px";
    a.style.opacity = "0";
    document.body.appendChild(a);

    a.click();

    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1000);
  } catch {
    // تجاهل
  }
}
