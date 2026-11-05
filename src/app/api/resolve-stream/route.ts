import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/resolve-stream?url=https://freeshot.live/embed/beINSPORTSAR7.php
 *
 * يأخذ رابط صفحة تضمين (freeshot.live/embed/...) ويستخرج منه رابط m3u8 النظيف بدون إعلانات.
 *
 * + تخزين مؤقت (Cache) لمدة 5 دقائق:
 *   أول مستخدم ينتظر 2-3 ثوانٍ (يستخرج الرابط)
 *   بقية المستخدمين خلال 5 دقائق → 0.3 ثانية ⚡ (الرابط مخزّن)
 */

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
};

// === Cache في الذاكرة ===
interface CacheEntry {
  streamUrl: string;
  channel: string;
  expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق
const cache = new Map<string, CacheEntry>();

// تنظيف دوري للـ cache المنتهي
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  // === تحقق من Cache ===
  // لو فيه معامل _t (cache-busting)، تجاوز الكاش واحضر token جديد
  const bypassCache = searchParams.has("_t");
  
  cleanExpiredCache();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now() && !bypassCache) {
    // الرابط مخزّن وصالح ← أرجعه فورًا ⚡
    return NextResponse.json({
      ok: true,
      streamUrl: cached.streamUrl,
      channel: cached.channel,
      cached: true,
    });
  }

  try {
    // 1. اجلب صفحة freeshot
    const freeshotRes = await fetch(url, {
      headers: { ...HEADERS, Referer: "https://freeshot.live/" },
      // @ts-expect-error - next cache
      next: { revalidate: 0 },
    });

    if (!freeshotRes.ok) {
      return NextResponse.json({ error: `freeshot fetch failed: ${freeshotRes.status}` }, { status: 502 });
    }

    const freeshotHtml = await freeshotRes.text();

    // 2. استخرج رابط wideiptv.top/player/XXX من الـ iframe
    const iframeMatch = freeshotHtml.match(/wideiptv\.top\/player\/([A-Za-z0-9]+)/i);
    if (!iframeMatch) {
      return NextResponse.json({ error: "wideiptv iframe not found" }, { status: 502 });
    }

    const channelCode = iframeMatch[1];
    const playerUrl = `https://wideiptv.top/player/${channelCode}`;

    // 3. اجلب صفحة المشغل
    const playerRes = await fetch(playerUrl, {
      headers: { ...HEADERS, Referer: "https://freeshot.live/" },
      // @ts-expect-error - next cache
      next: { revalidate: 0 },
    });

    if (!playerRes.ok) {
      return NextResponse.json({ error: `player fetch failed: ${playerRes.status}` }, { status: 502 });
    }

    const playerHtml = await playerRes.text();

    // 4. استخرج رابط m3u8 مع token
    let streamUrl: string | null = null;

    const streamMatch = playerHtml.match(/streamUrl:\s*"(https?:\\?\/\\?\/[^"]+\.m3u8[^"]*)"/);
    if (streamMatch) {
      streamUrl = streamMatch[1].replace(/\\\//g, "/");
    } else {
      const altMatch = playerHtml.match(/https?:\/\/[^"'\s]+\.m3u8\?token=[A-Za-z0-9_.-]+/);
      if (altMatch) {
        streamUrl = altMatch[0].replace(/\\\//g, "/");
      }
    }

    if (!streamUrl) {
      return NextResponse.json({ error: "streamUrl not found" }, { status: 502 });
    }

    // === خزّن في Cache لمدة 5 دقائق ===
    cache.set(url, {
      streamUrl,
      channel: channelCode,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return NextResponse.json({
      ok: true,
      streamUrl,
      channel: channelCode,
      cached: false,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
