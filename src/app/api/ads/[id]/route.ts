import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cache } from "@/lib/cache";

const updateSchema = z.object({
  slot: z.enum([
    "home_top",
    "home_middle",
    "home_bottom",
    "sticky_bottom",
    "matches_top",
    "matches_middle",
    "channels_top",
    "channels_middle",
    "favorites_top",
    "player_top",
    "more_top",
    "interstitial",
    "popunder",
  ]).optional(),
  label: z.string().optional(),
  type: z.enum(["image", "code"]).optional(),
  imageUrl: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  adCode: z.string().nullable().optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const ad = await db.ad.update({ where: { id }, data });
    cache.invalidatePrefix("ads:");
    return NextResponse.json({ ad });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في التحديث";
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.ad.delete({ where: { id } });
    cache.invalidatePrefix("ads:");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الحذف";
    return NextResponse.json({ error: msg }, { status });
  }
}
