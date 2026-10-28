"use client";

import * as React from "react";

/**
 * Popunder Loader —invisible, loads HilltopAds Popunder script globally.
 *
 * Popunder behavior:
 * - The script attaches a click listener to the whole document
 * - On any user click, it opens the ad URL in a new tab (behind the current window)
 * - No visible UI element is rendered
 * - Loads once per session, runs on every page
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

        // Parse the ad code and inject scripts into <head>
        const template = document.createElement("template");
        template.innerHTML = ad.adCode.trim();

        Array.from(template.content.childNodes).forEach((node) => {
          if (node.nodeName === "SCRIPT") {
            const script = document.createElement("script");
            const original = node as HTMLScriptElement;
            if (original.src) {
              // مرّر السكربت الخارجي عبر /api/adscript
              script.src = `/api/adscript?url=${encodeURIComponent(original.src)}`;
            }
            if (original.type) script.type = original.type;
            if (original.async) script.async = true;
            // للسكربتات inline: أعد كتابة أي s.src="..." ليستخدم البروكسي
            if (original.text) {
              script.text = original.text.replace(
                /(\w+)\.src\s*=\s*["'](https?:)?\/\/([^"']+)["']/g,
                (match, varName, protocol, rest) => {
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
      })
      .catch(() => {});
  }, []);

  return null;
}
