"use client";

import * as React from "react";

/**
 * Popunder Loader —invisible, loads HilltopAds Popunder on all pages.
 *
 * كيف يعمل:
 * 1. يحمّل كود الإعلان من /api/ads?slot=popunder
 * 2. يحقن السكربتات (الخارجية + inline) في <head> عبر /api/adscript proxy
 * 3. للسكربتات inline: يعيد كتابة s.src="..." ليستخدم البروكسي
 * 4. لو فشل تحميل السكربت (منطقة جديدة/CDN غير جاهز): ينشئ Popunder يدوي
 *    بفتح رابط الإعلان في تبويب خلفي عند أول نقرة من المستخدم
 *
 * The ad code is fetched from /api/ads?slot=popunder
 */
export function PopunderLoader() {
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    fetch("/api/ads?slot=popunder")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ads || d.ads.length === 0) return;
        const ad = d.ads[0];
        if (!ad.adCode) return;

        // استخرج رابط السكربت من الكود (للاستخدام الاحتياطي)
        const srcMatch = ad.adCode.match(/\.src\s*=\s*["'](https?:)?\/\/([^"']+)["']/);
        const fallbackUrl = srcMatch ? `https://${srcMatch[2]}` : null;

        // Parse the ad code and inject scripts into <head>
        const template = document.createElement("template");
        template.innerHTML = ad.adCode.trim();

        let scriptInjected = false;
        Array.from(template.content.childNodes).forEach((node) => {
          if (node.nodeName === "SCRIPT") {
            const script = document.createElement("script");
            const original = node as HTMLScriptElement;
            if (original.src) {
              script.src = `/api/adscript?url=${encodeURIComponent(original.src)}`;
            }
            if (original.type) script.type = original.type;
            if (original.async) script.async = true;
            if (original.text) {
              script.text = original.text.replace(
                /(\w+)\.src\s*=\s*["'](https?:)?\/\/([^"']+)["']/g,
                (_match, varName, _protocol, rest) => {
                  const fullUrl = `https://${rest}`;
                  return `${varName}.src = "/api/adscript?url=" + encodeURIComponent("${fullUrl}")`;
                }
              );
            }
            document.head.appendChild(script);
            scriptInjected = true;

            // لو فشل تحميل السكربت (onerror)، فعّل Popunder اليدوي
            if (fallbackUrl) {
              script.addEventListener("error", () => {
                setupManualPopunder(fallbackUrl);
              });
            }
          } else {
            document.head.appendChild(node.cloneNode(true));
          }
        });

        // لو لم يُحقن أي سكربت لكن يوجد رابط، فعّل Popunder اليدوي
        if (!scriptInjected && fallbackUrl) {
          setupManualPopunder(fallbackUrl);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}

/**
 * Popunder يدوي: يفتح رابط الإعلان في تبويب خلفي عند أول نقرة
 * (يُستخدم عندما يكون سكربت HilltopAds غير متاح/جديد)
 */
function setupManualPopunder(url: string) {
  let fired = false;
  const POPUNDER_KEY = "hilltopads_popunder_fired";

  // لا تكرر في نفس الجلسة
  if (sessionStorage.getItem(POPUNDER_KEY)) return;

  const handler = (e: MouseEvent) => {
    if (fired) return;
    fired = true;
    sessionStorage.setItem(POPUNDER_KEY, "1");

    try {
      // افتح في تبويب جديد خلفي (popunder)
      const w = window.open(url, "_blank");
      if (w) {
        w.blur();
        window.focus();
      }
    } catch {
      // تجاهل الأخطاء
    }

    // أزل المستمع بعد أول إطلاق
    document.removeEventListener("click", handler, true);
  };

  // استخدم capture ليُلتقط أي نقرة على أي عنصر
  document.addEventListener("click", handler, true);
}
