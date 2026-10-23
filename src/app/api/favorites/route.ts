import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// GET favorites for a session
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ favorites: [] });
  const favorites = await db.favorite.findMany({
    where: { sessionId },
    include: { channel: true, match: true },
  });
  return NextResponse.json({ favorites });
}

const addSchema = z.object({
  sessionId: z.string().min(1),
  kind: z.enum(["channel", "match", "tournament", "team"]),
  refId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, kind, refId } = addSchema.parse(body);
    const data: Record<string, unknown> = { sessionId, kind, refId };
    if (kind === "channel") data.channelId = refId;
    if (kind === "match") data.matchId = refId;
    const fav = await db.favorite.upsert({
      where: { sessionId_kind_refId: { sessionId, kind, refId } },
      update: {},
      create: data as { sessionId: string; kind: string; refId: string; channelId?: string; matchId?: string },
    });
    return NextResponse.json({ favorite: fav });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const kind = searchParams.get("kind");
    const refId = searchParams.get("refId");
    if (!sessionId || !kind || !refId) {
      return NextResponse.json({ error: "ناقص" }, { status: 400 });
    }
    await db.favorite.deleteMany({ where: { sessionId, kind, refId } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
