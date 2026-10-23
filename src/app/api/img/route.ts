import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy — fetches external images server-side to bypass:
 *  - CORS restrictions
 *  - hotlink protection (Referer-based blocking)
 *  - client-side rate limiting (e.g. wikipedia 429)
 *
 * Usage: /api/img?url=<external-image-url>
 *
 * The proxy validates the URL is http(s), fetches it with no Referer,
 * and streams the bytes back with the correct content-type and long
 * cache headers. This makes external team/channel logos reliably
 * render in <img> tags regardless of the source site's policies.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  // Only allow http/https URLs to prevent SSRF / file:// access.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "protocol not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        // No Referer → bypass hotlink protection on most CDNs.
        Referer: "",
        // A neutral UA avoids blocks that target missing/bot user agents.
        "User-Agent":
          "Mozilla/5.0 (compatible; WazaNI-ImageProxy/1.0; +https://wazani.tv)",
        Accept: "image/*,*/*;q=0.8",
      },
      // Don't send our cookies to the upstream host.
      credentials: "omit",
      // Cache the fetch on the edge for a day.
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/png";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
