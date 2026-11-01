import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";

/**
 * GET /api/movies
 * - عام: يُرجع الأفلام النشطة فقط
 * - مسؤول: يُرجع كل الأفلام لو ?all=1
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "1";
  const admin = await getCurrentAdmin();
  const showAll = all && admin;

  const cacheKey = showAll ? "movies:all" : "movies:active";

  const movies = await cache.getOrSet(cacheKey, CACHE_TTL.LONG, () => {
    const where: { active?: boolean } = {};
    if (!showAll) where.active = true;
    return db.movie.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  });

  return NextResponse.json({
    movies,
    admin: admin ? { name: admin.name } : null,
  });
}

const createSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().nullable().optional(),
  description: z.string().default(""),
  posterUrl: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).default(0),
  duration: z.string().default(""),
  year: z.number().int().default(2024),
  genres: z.string().default(""),
  gradient: z.string().default("linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"),
  streamUrl: z.string().nullable().optional(),
  streamType: z.string().default("none"),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  order: z.number().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const movie = await db.movie.create({ data });
    cache.invalidatePrefix("movies:");
    return NextResponse.json({ movie });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
