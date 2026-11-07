import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy متقدم لـ HLS (m3u8) — يحل مشاكل:
 *  ✅ CORS (المتصفح لا يستطيع جلب m3u8 من مصادر لا تدعم CORS)
 *  ✅ Hotlink protection (Referer-based blocking)
 *  ✅ Token-protected HLS (الـ token يُمرّر عبر الـ proxy)
 *  ✅ User-Agent based blocking
 *  ✅ wideiptv.top: تجديد الـ token تلقائيًا عند انتهائه (5 دقائق)
 *
 * كيف يعمل:
 *  1. يجلب ملف m3u8 من الخادم برؤوس متصفح حقيقية
 *  2. يكتشف نوع المصدر (wideiptv / hdm1 / عام) ويختار Referer الصحيح
 *  3. لو حصل 403 من wideiptv (token منتهي)، يجدد الـ token ويعيد المحاولة
 *  4. يُعيد كتابة روابط الـ segments النسبية لتصبح مطلقة وتمر عبر الـ proxy
 *  5. يُعيد الملف مع content-type الصحيح
 *
 * Usage:
 *  /api/stream?url=https://cdn.wideiptv.top/beINARNEWS/index.m3u8?token=...
 *  /api/stream?url=https://example.com/segment.ts  (للـ segments)
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
};

/** يحدد Referer الصحيح حسب نطاق الـ stream */
function pickReferer(url: URL): string {
  const host = url.hostname;

  // wideiptv CDN يتطلب Referer من صفحة المشغل (ليس من الـ CDN نفسه)
  if (host.includes("wideiptv.top") || host.includes("cdn.wideiptv")) {
    return "https://wideiptv.top/";
  }
  // hdm1.net يستخدم Referer من same-origin غالبًا
  if (host.includes("hdm1.net")) {
    return `https://${url.host}/`;
  }
  // افتراضي: same-origin
  return `${url.protocol}//${url.host}/`;
}

/** يكتشف إن كان الرابط لـ wideiptv CDN (يحتاج تجديد token) */
function isWideiptvCdn(url: URL): boolean {
  return (
    url.hostname.includes("cdn.wideiptv.top") ||
    url.hostname.includes("wideiptv.top")
  );
}

/** يستخرج اسم القناة من رابط wideiptv CDN */
function extractWideiptvChannel(url: URL): string | null {
  // /beINARNEWS/index.m3u8 → beINARNEWS
  const m = url.pathname.match(/^\/([A-Za-z0-9]+)\//);
  return m ? m[1] : null;
}

/** يستخرج الـ token الحالي من الرابط */
function extractToken(url: URL): string | null {
  return url.searchParams.get("token");
}

// === Cache لتجديد الـ tokens (لتجنب طلب refresh متكرر) ===
interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}
const tokenCache = new Map<string, TokenCacheEntry>();
const TOKEN_CACHE_TTL = 4 * 60 * 1000; // 4 دقائق (أقل من 5 دقائق صلاحية الـ token)

/** يجدد token من wideiptv عبر refresh_token.php */
async function refreshWideiptvToken(channel: string, currentToken: string): Promise<string | null> {
  // تحقق من cache أولًا
  const cached = tokenCache.get(channel);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  try {
    const res = await fetch(`https://wideiptv.top/api/refresh_token.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...BROWSER_HEADERS,
        Referer: "https://wideiptv.top/",
      },
      body: JSON.stringify({
        channel,
        current_token: currentToken,
      }),
      // @ts-expect-error — next cache options
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.token) {
      tokenCache.set(channel, {
        token: data.token,
        expiresAt: Date.now() + TOKEN_CACHE_TTL,
      });
      return data.token as string;
    }
    return null;
  } catch {
    return null;
  }
}

/** يبني رابط m3u8 جديد بـ token محدّث */
function rebuildUrlWithToken(url: URL, newToken: string): URL {
  const newUrl = new URL(url.toString());
  newUrl.searchParams.set("token", newToken);
  return newUrl;
}

// === Cache لـ master playlist (index.m3u8) ===
// الـ master playlist ثابت لكل قناة (يحتوي فقط على رابط sub-playlist)
// تخزينه يُسرّع الفتح المتكرر للقناة (يتجنب TLS handshake + fetch في كل مرة)
interface M3u8CacheEntry {
  body: string;
  contentType: string;
  expiresAt: number;
}
const m3u8Cache = new Map<string, M3u8CacheEntry>();
const MASTER_M3U8_TTL = 2 * 60 * 1000; // دقيقتان

/** مفتاح الكاش: نطاق+قناة (يتجاهل الـ token لأن المحتوى لا يعتمد عليه) */
function getM3u8CacheKey(url: URL): string | null {
  // فقط للـ master playlist (index.m3u8) من wideiptv CDN
  if (url.hostname.includes("wideiptv.top") && url.pathname.endsWith("/index.m3u8")) {
    const channel = extractWideiptvChannel(url);
    return channel ? `master:${channel}` : null;
  }
  return null;
}

/** يعيد كتابة m3u8: يحوّل الروابط النسبية لمطلقة، ويجعلها تمر عبر الـ proxy */
function rewriteM3u8(content: string, baseUrl: string): string {
  try {
    const base = new URL(baseUrl);
    const lines = content.split("\n");
    const rewritten: string[] = [];

    for (let line of lines) {
      const trimmed = line.trim();

      // تخطّي التعليقات والأسطر الفارغة
      if (trimmed.startsWith("#") || trimmed === "") {
        // عدّل روابط URI داخل #EXT-X-KEY و #EXT-X-MAP و #EXT-X-MEDIA
        if (
          trimmed.startsWith("#EXT-X-KEY") ||
          trimmed.startsWith("#EXT-X-MAP") ||
          trimmed.startsWith("#EXT-X-MEDIA")
        ) {
          line = rewriteUriInTag(line, base);
        }
        rewritten.push(line);
        continue;
      }

      // سطر يحتوي على URL (segment أو playlist فرعية)
      try {
        const absoluteUrl = new URL(trimmed, base).toString();
        rewritten.push(`/api/stream?url=${encodeURIComponent(absoluteUrl)}`);
      } catch {
        rewritten.push(line);
      }
    }

    return rewritten.join("\n");
  } catch {
    return content; // لو فشل، أعد المحتوى الأصلي
  }
}

/** يعيد كتابة URI=... داخل وسوم #EXT-X-KEY و #EXT-X-MAP */
function rewriteUriInTag(tag: string, base: URL): string {
  const match = tag.match(/URI="([^"]+)"/);
  if (!match) return tag;
  const uri = match[1];
  try {
    const absoluteUri = new URL(uri, base).toString();
    const proxiedUri = `/api/stream?url=${encodeURIComponent(absoluteUri)}`;
    return tag.replace(`URI="${uri}"`, `URI="${proxiedUri}"`);
  } catch {
    return tag;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  // تحقق من البروتوكول
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "protocol not allowed" }, { status: 400 });
  }

  const referer = pickReferer(parsed);
  const isWideiptv = isWideiptvCdn(parsed);

  // المحاولة الأولى: بالـ token الحالي + Referer الصحيح
  let currentUrl = parsed;
  let tokenRefreshed = false;

  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = { ...BROWSER_HEADERS, Referer: referer };

    try {
      const res = await fetch(currentUrl.toString(), {
        headers,
        credentials: "omit",
        redirect: "follow",
        // @ts-expect-error — next cache options
        next: { revalidate: 0 },
      });

      // لو 403 و wideiptv ولم نجدّد الـ token بعد ← جدّده وأعد المحاولة
      if (res.status === 403 && isWideiptv && !tokenRefreshed) {
        const channel = extractWideiptvChannel(currentUrl);
        const currentToken = extractToken(currentUrl);
        if (channel && currentToken) {
          const newToken = await refreshWideiptvToken(channel, currentToken);
          if (newToken && newToken !== currentToken) {
            currentUrl = rebuildUrlWithToken(currentUrl, newToken);
            tokenRefreshed = true;
            continue; // أعد المحاولة بالـ token الجديد
          }
        }
      }

      if (!res.ok) {
        // لو فشل، جرّب بدون Referer
        if (attempt === 0) {
          const res2 = await fetch(currentUrl.toString(), {
            headers: { ...BROWSER_HEADERS, Referer: "" },
            credentials: "omit",
            redirect: "follow",
            // @ts-expect-error
            next: { revalidate: 0 },
          });
          if (res2.ok) {
            return await respondWith(res2, currentUrl);
          }
        }
        continue;
      }

      return await respondWith(res, currentUrl);
    } catch {
      continue;
    }
  }

  // كل المحاولات فشلت
  return NextResponse.json(
    {
      error: "Failed to fetch stream",
      hint: "The stream may be IP-locked, geo-blocked, or require specific credentials.",
    },
    { status: 502 }
  );
}

/** يبني الاستجابة النهائية حسب نوع المحتوى (m3u8 / segment / غيره)
 *
 *  ⚡ تحسين الأداء:
 *  - نفحص content-type من headers أولًا (بدون استهلاك body)
 *  - للـ segments (ts/m4s/mp4): نُمرّر res.body مباشرة (streaming) — صفر نسخ، صفر إعادة جلب
 *  - للـ m3u8 فقط: نستهلك body كـ text ونُعيد كتابة الروابط
 *  - هذا يلغي الجلب المزدوج السابق ويُسرّع بدء التشغيل بشكل كبير
 */
async function respondWith(res: Response, sourceUrl: URL): Promise<NextResponse> {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const urlLower = sourceUrl.toString().toLowerCase();

  // === تصنيف نوع المحتوى من headers + امتداد الرابط (بدون استهلاك body) ===
  const isVideo = contentType.startsWith("video/");
  const isMpegurl =
    contentType.includes("mpegurl") ||
    contentType.includes("m3u8") ||
    contentType.includes("vnd.apple.mpegurl");
  const isHtml = contentType.includes("text/html");
  const isM3u8ByExt = urlLower.endsWith(".m3u8") || urlLower.includes(".m3u8?");
  const isSegmentByExt =
    urlLower.endsWith(".ts") ||
    urlLower.endsWith(".m4s") ||
    urlLower.endsWith(".mp4") ||
    urlLower.includes(".ts?") ||
    urlLower.includes(".m4s?") ||
    urlLower.includes(".mp4?");

  // segment = فيديو (ليس m3u8) أو امتداد .ts/.m4s/.mp4 (وليس .m3u8)
  const isSegment =
    !isMpegurl && !isM3u8ByExt && !isHtml && (isVideo || isSegmentByExt);

  // === 1) segment (ts/m4s/mp4) — STREAM مباشر ===
  if (isSegment && res.body) {
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "video/mp2t",
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
        "X-Stream-Source": "proxy-segment-stream",
      },
    });
  }

  // === 2) m3u8 — اقرأ كـ text وأعد كتابة الروابط ===
  if (isMpegurl || isM3u8ByExt) {
    // ⚡ تحقق من كاش الـ master playlist أولًا
    const cacheKey = getM3u8CacheKey(sourceUrl);
    if (cacheKey) {
      const cached = m3u8Cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return new NextResponse(cached.body, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
            "X-Stream-Source": "proxy-m3u8-cached",
          },
        });
      }
    }

    const text = await res.text();
    const trimmed = text.trimStart();

    // 🚫 لو HTML بدل m3u8 (hotlink protection فاشل)
    if (
      isHtml ||
      trimmed.toLowerCase().startsWith("<!doctype") ||
      trimmed.toLowerCase().startsWith("<html")
    ) {
      return NextResponse.json(
        { error: "HTML returned instead of stream (hotlink protection)" },
        { status: 502 }
      );
    }

    const rewritten = rewriteM3u8(text, sourceUrl.toString());

    // ⚡ خزّن الـ master playlist في الكاش (يتجنب TLS handshake في الفتح القادم)
    if (cacheKey) {
      m3u8Cache.set(cacheKey, {
        body: rewritten,
        contentType: "application/vnd.apple.mpegurl",
        expiresAt: Date.now() + MASTER_M3U8_TTL,
      });
    }

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "X-Stream-Source": "proxy-m3u8",
      },
    });
  }

  // === 3) HTML (خطأ hotlink) ===
  if (isHtml) {
    return NextResponse.json(
      { error: "HTML returned instead of stream (hotlink protection)" },
      { status: 502 }
    );
  }

  // === 4) نوع آخر — مرّر الـ body مباشرة (streaming) ===
  if (res.body) {
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "X-Stream-Source": "proxy-unknown-stream",
      },
    });
  }

  // fallback: لو body null (نادر)
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
