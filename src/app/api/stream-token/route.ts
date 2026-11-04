import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/stream-token?channel=beINAR7
 *
 * يجلب token جديد من wideiptv.top ويُرجع رابط m3u8 كامل.
 *
 * كيف يعمل:
 * 1. يطلب صفحة المشغل من wideiptv.top/player/{channel}
 * 2. يستخرج الـ token من الكود
 * 3. يُرجع رابط m3u8 جاهز
 *
 * الاستخدام من المشغل:
 *   بدلًا من رابط ثابت، يطلب المشغل هذا الـ API
 *   ويعيد رابطًا جديدًا في كل مرة
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
  Referer: "https://freeshot.live/",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");

  if (!channel) {
    return NextResponse.json({ error: "missing channel parameter" }, { status: 400 });
  }

  try {
    // اطلب صفحة المشغل
    const res = await fetch(`https://wideiptv.top/player/${channel}`, {
      headers: BROWSER_HEADERS,
      // @ts-expect-error - next cache
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `failed to fetch player page: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // استخرج الـ token من streamUrl
    const tokenMatch = html.match(/token=([A-Za-z0-9_.-]+)/);
    if (!tokenMatch) {
      return NextResponse.json(
        { error: "token not found in player page" },
        { status: 502 }
      );
    }

    const token = tokenMatch[1];
    const streamUrl = `https://cdn.hdm1.net/${channel}/index.m3u8?token=${token}`;

    return NextResponse.json({
      ok: true,
      streamUrl,
      token,
      channel,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
