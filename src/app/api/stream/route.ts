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

/** يتحقق إن كان المحتوى m3u8 أو segment */
function isHlsContent(contentType: string, url: string): boolean {
  const ct = contentType.toLowerCase();
  const u = url.toLowerCase();
  return (
    ct.includes("mpegurl") ||
    ct.includes("m3u8") ||
    ct.includes("vnd.apple.mpegurl") ||
    u.endsWith(".m3u8") ||
    u.endsWith(".ts") ||
    u.endsWith(".m4s") ||
    u.endsWith(".mp4") ||
    ct.startsWith("video/") ||
    ct.includes("application/octet-stream")
  );
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

/** يبني الاستجابة النهائية حسب نوع المحتوى (m3u8 / segment / غيره) */
async function respondWith(res: Response, sourceUrl: URL): Promise<NextResponse> {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  const trimmed = text.trimStart();

  // 🚫 اكتشاف HTML (redirect فاشل أو hotlink protection)
  const isHtml =
    contentType.includes("text/html") ||
    trimmed.toLowerCase().startsWith("<!doctype") ||
    trimmed.toLowerCase().startsWith("<html") ||
    (trimmed.includes("<title>") && trimmed.includes("</title>"));

  if (isHtml) {
    // أرمِ خطأ ليُجرّب المتصل حلًّا آخر
    return NextResponse.json(
      { error: "HTML returned instead of stream (hotlink protection)" },
      { status: 502 }
    );
  }

  // لو m3u8 — أعد كتابته
  if (
    contentType.includes("mpegurl") ||
    contentType.includes("m3u8") ||
    contentType.includes("vnd.apple.mpegurl") ||
    sourceUrl.pathname.endsWith(".m3u8") ||
    trimmed.startsWith("#EXTM3U")
  ) {
    const rewritten = rewriteM3u8(text, sourceUrl.toString());
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

  // لو segment (ts/m4s/mp4)
  if (isHlsContent(contentType, sourceUrl.toString())) {
    // النص أصلاً محمّل كـ text — أعد الجلب كـ ArrayBuffer للـ segments الثنائية
    const segRes = await fetch(sourceUrl.toString(), {
      headers: { ...BROWSER_HEADERS, Referer: pickReferer(sourceUrl) },
      credentials: "omit",
    });
    const body = await segRes.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "video/mp2t",
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
        "X-Stream-Source": "proxy-segment",
      },
    });
  }

  // نوع غير معروف — أعد المحتوى
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
