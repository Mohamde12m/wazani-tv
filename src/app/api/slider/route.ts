import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";

/**
 * GET /api/slider
 * - عام: يُرجع العناصر النشطة فقط
 * - مسؤول: يُرجع الكل لو ?all=1
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1";
  const admin = await getCurrentAdmin();
  const showAll = all && admin;

  const cacheKey = showAll ? "slider:all" : "slider:active";

  const items = await cache.getOrSet(cacheKey, CACHE_TTL.MEDIUM, () => {
    const where: { active?: boolean } = {};
    if (!showAll) where.active = true;
    return db.sliderItem.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  });

  return NextResponse.json({ items, admin: admin ? { name: admin.name } : null });
}

const createSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().default(""),
  imageUrl: z.string().nullable().optional(),
  gradient: z.string().default("linear-gradient(135deg, #022B1C 0%, #00875A 50%, #022B1C 100%)"),
  linkType: z.enum(["channel", "match", "url", "none"]).default("none"),
  linkId: z.string().nullable().optional(),
  buttonText: z.string().default("شاهد الآن"),
  active: z.boolean().default(true),
  order: z.number().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const item = await db.sliderItem.create({ data });
    cache.invalidatePrefix("slider:");
    return NextResponse.json({ item });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
