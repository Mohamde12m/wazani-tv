import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy متقدم لـ HLS (m3u8) — يحل مشاكل:
 *  ✅ CORS (المتصفح لا يستطيع جلب m3u8 من مصادر لا تدعم CORS)
 *  ✅ Hotlink protection (Referer-based blocking)
 *  ✅ Token-protected HLS (الـ token يُمرّر عبر الـ proxy)
 *  ✅ User-Agent based blocking
 *
 * كيف يعمل:
 *  1. يجلب ملف m3u8 من الخادم برؤوس متصفح حقيقية
 *  2. لو نجح، يُعيد كتابة روابط الـ segments النسبية لتصبح مطلقة
 *  3. يُعيد كتابة روابط الـ segments لتمر عبر /api/stream?url=...
 *  4. يُعيد الملف مع content-type الصحيح
 *
 * Usage:
 *  /api/stream?url=https://example.com/stream.m3u8
 *  /api/stream?url=https://example.com/segment.ts  (للـ segments)
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
};

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

  // Referer من نفس نطاق الـ stream
  const sameOriginReferer = `${parsed.protocol}//${parsed.host}/`;

  // قائمة المحاولات برؤوس مختلفة
  const attempts: Record<string, string>[] = [
    { ...BROWSER_HEADERS, Referer: sameOriginReferer },
    { ...BROWSER_HEADERS, Referer: "" },
    { "User-Agent": BROWSER_HEADERS["User-Agent"], Accept: "*/*" },
  ];

  for (const headers of attempts) {
    try {
      const res = await fetch(parsed.toString(), {
        headers,
        credentials: "omit",
        redirect: "follow",
        // @ts-expect-error — next cache options
        next: { revalidate: 0 },
      });

      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      // 🚫 اكتشاف HTML (redirect فاشل أو hotlink protection)
      // لو النص يحتوي على <html أو <DOCTYPE، فهو ليس m3u8
      const trimmed = text.trimStart();
      const isHtml =
        contentType.includes("text/html") ||
        trimmed.toLowerCase().startsWith("<!doctype") ||
        trimmed.toLowerCase().startsWith("<html") ||
        (trimmed.includes("<title>") && trimmed.includes("</title>"));

      if (isHtml) {
        // جرّب المحاولة التالية
        continue;
      }

      // لو m3u8 — أعد كتابته
      if (
        contentType.includes("mpegurl") ||
        contentType.includes("m3u8") ||
        parsed.pathname.endsWith(".m3u8") ||
        trimmed.startsWith("#EXTM3U")
      ) {
        const rewritten = rewriteM3u8(text, parsed.toString());
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

      // لو segment (ts/m4s/mp4) — أعد المحتوى كـ ArrayBuffer
      if (isHlsContent(contentType, parsed.toString())) {
        const segRes = await fetch(parsed.toString(), {
          headers,
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

      // لو HTML (redirect فاشل) — جرّب المحاولة التالية
      if (contentType.includes("text/html")) continue;

      // نوع غير معروف — أعد المحتوى
      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        },
      });
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
    { status: 502 },
  );
}
