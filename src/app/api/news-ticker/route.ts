import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1";
  const admin = await getCurrentAdmin();
  const showAll = all && admin;

  const cacheKey = showAll ? "news:all" : "news:active";
  const items = await cache.getOrSet(cacheKey, CACHE_TTL.MEDIUM, () => {
    const where: { active?: boolean } = {};
    if (!showAll) where.active = true;
    return db.newsTicker.findMany({ where, orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  });

  return NextResponse.json({ items, admin: admin ? { name: admin.name } : null });
}

const createSchema = z.object({
  text: z.string().min(1),
  active: z.boolean().default(true),
  order: z.number().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const item = await db.newsTicker.create({ data });
    cache.invalidatePrefix("news:");
    return NextResponse.json({ item });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
