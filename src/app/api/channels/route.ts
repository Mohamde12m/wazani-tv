import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  const admin = await getCurrentAdmin();
  // استخدم الكاش لتفادي الاستعلام في كل طلب (3s → 50ms)
  const channels = await cache.getOrSet(
    "channels:active",
    CACHE_TTL.MEDIUM,
    () =>
      db.channel.findMany({
        where: { active: true },
        include: { country: true, category: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
  );
  return NextResponse.json({ channels, admin: admin ? { name: admin.name, role: admin.role } : null });
}

const createSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  countryId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  streamUrl: z.string().nullable().optional(),
  streamType: z.enum(["hls", "mp4", "youtube", "iframe", "none"]).default("none"),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  verified: z.boolean().default(false),
  order: z.number().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const channel = await db.channel.create({ data });
    // أمسح الكاش ليعكس التحديث
    cache.invalidatePrefix("channels:");
    return NextResponse.json({ channel });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
