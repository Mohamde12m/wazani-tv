"use client";

import * as React from "react";

/**
 * Popunder Loader —invisible, loads HilltopAds Popunder on all pages.
 *
 * كيف يعمل:
 * 1. يحمّل كود الإعلان من /api/ads?slot=popunder
 * 2. يستخرج رابط الإعلان من الكود
 * 3. يحقن كود HilltopAds الأصلي (مع البروكسي) في <head>
 * 4. كاحتياط: لو فشل HilltopAds بعد 3 ثوانٍ، ينشئ Popunder يدوي
 *    عند أول نقرة من المستخدم:
 *    - في المتصفح: يفتح تبويب جديد خلفي
 *    - في PWA/التطبيق المثبت: يفتح في نافذة جديدة أو نفس النافذة
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

        // استخرج رابط الإعلان من الكود (للاستخدام الاحتياطي)
        const srcMatch = ad.adCode.match(
          /\.src\s*=\s*["'](https?:)?\/\/([^"']+)["']/
        );
        const fallbackUrl = srcMatch ? `https://${srcMatch[2]}` : null;

        // حقن كود HilltopAds الأصلي مع البروكسي
        try {
          const template = document.createElement("template");
          template.innerHTML = ad.adCode.trim();

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
            } else {
              document.head.appendChild(node.cloneNode(true));
            }
          });
        } catch {
          // تجاهل أخطاء الحقن
        }

        // احتياط: لو فشل HilltopAds (منطقة جديدة/CDN)، فعّل Popunder يدوي بعد 3 ثوانٍ
        if (fallbackUrl) {
          setTimeout(() => {
            setupManualPopunder(fallbackUrl);
          }, 3000);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}

/**
 * Popunder يدوي: يفتح رابط الإعلان عند أول نقرة
 * (يُستخدم عندما يكون سكربت HilltopAds غير متاح/جديد)
 *
 * يعمل في:
 * - المتصفح العادي: يفتح تبويب جديد خلفي (popunder)
 * - PWA/التطبيق المثبت: يفتح في نافذة جديدة أو المتصفح الخارجي
 * - iOS Safari: يفتح في نفس النافذة لو فشل tab جديد
 */
function setupManualPopunder(url: string) {
  const POPUNDER_KEY = "hilltopads_popunder_fired";

  // لا تكرر في نفس الجلسة
  if (sessionStorage.getItem(POPUNDER_KEY)) return;

  const handler = (e: MouseEvent) => {
    if (sessionStorage.getItem(POPUNDER_KEY)) return;
    sessionStorage.setItem(POPUNDER_KEY, "1");

    try {
      // استخدم <a target="_blank"> مع click اصطناعي فقط
      // (أكثر موثوقية من window.open في PWA و iOS)
      // لا نستخدم window.open لتجنب فتح عدة تبويبات
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error - iOS Safari
        window.navigator.standalone === true;

      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      // في PWA، استخدم _top لفتح في المتصفح الخارجي لو فشل _blank
      if (isPWA) {
        a.target = "_top";
      }
      a.style.position = "fixed";
      a.style.left = "-9999px";
      a.style.top = "0";
      a.style.width = "1px";
      a.style.height = "1px";
      a.style.opacity = "0";
      document.body.appendChild(a);

      // استخدم click() الحقيقي (موثوق في كل المتصفحات)
      a.click();

      // نظّف بعد ثانية
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1000);
    } catch {
      // تجاهل الأخطاء
    }

    // أزل المستمع بعد أول إطلاق
    document.removeEventListener("click", handler, true);
  };

  // استخدم capture ليُلتقط أي نقرة على أي عنصر
  document.addEventListener("click", handler, true);
}
