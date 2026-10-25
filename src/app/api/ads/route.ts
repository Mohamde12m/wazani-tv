import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";

/**
 * GET /api/ads
 * - عام (بدون مصادقة): يُرجع الإعلانات النشطة فقط، يمكن تصفيتها بـ ?slot=...
 * - مسؤول: يُرجع كل الإعلانات (نشطة + معطّلة) إذا أرسل ?all=1
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slot = url.searchParams.get("slot");
  const all = url.searchParams.get("all") === "1";
  const admin = await getCurrentAdmin();
  const showAll = all && admin;

  const cacheKey = showAll
    ? `ads:all${slot ? ":" + slot : ""}`
    : `ads:active${slot ? ":" + slot : ""}`;

  const ads = await cache.getOrSet(cacheKey, CACHE_TTL.LONG, () => {
    const where: { active?: boolean; slot?: string } = {};
    if (!showAll) where.active = true;
    if (slot) where.slot = slot;
    return db.ad.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  });

  return NextResponse.json({
    ads,
    admin: admin ? { name: admin.name } : null,
  });
}

const createSchema = z.object({
  slot: z.enum(["home_top", "home_middle", "home_bottom", "sticky_bottom", "matches_top"]),
  label: z.string().default(""),
  type: z.enum(["image", "code"]).default("image"),
  imageUrl: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  adCode: z.string().nullable().optional(),
  active: z.boolean().default(true),
  order: z.number().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const ad = await db.ad.create({ data });
    cache.invalidatePrefix("ads:");
    return NextResponse.json({ ad });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
