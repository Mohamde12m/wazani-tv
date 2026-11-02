import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy لسكريبتات إعلانات HilltopAds
 *
 * المشكلة: HilltopAds CDN يرجع 404 عندما يُحمّل السكربت كـ <script src>
 * من المتصفح (بسبب Sec-Fetch-Dest: script).
 *
 * الحل: نحمّل السكربت من الخادم برؤوس متصفح حقيقية، ثم نعيده كـ JavaScript
 * مع CORS headers مفتوحة. المتصفح يحمّل السكربت من نفس النطاق (no cross-origin).
 *
 * Usage:
 *   /api/adscript?url=https://idolizedoffice.com/...
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
  "Sec-Fetch-Dest": "script",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "protocol not allowed" }, { status: 400 });
  }

  // Referer من نفس نطاق السكربت (لبعض شبكات الإعلانات)
  const sameOriginReferer = `${parsed.protocol}//${parsed.host}/`;

  const attempts: Record<string, string>[] = [
    { ...BROWSER_HEADERS, Referer: sameOriginReferer },
    { ...BROWSER_HEADERS, Referer: "https://wazani-tv-live.vercel.app/" },
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

      const text = await res.text();

      // تأكد أن المحتوى JavaScript وليس HTML خطأ
      if (
        text.trim().startsWith("<!") ||
        text.trim().startsWith("<html") ||
        text.trim().startsWith("<body")
      ) {
        continue;
      }

      // أعد السكربت كـ JavaScript
      return new NextResponse(text, {
        status: 200,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, max-age=0",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { error: "failed to fetch ad script" },
    { status: 502 }
  );
}
