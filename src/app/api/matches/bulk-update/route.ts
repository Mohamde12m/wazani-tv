import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cache } from "@/lib/cache";

/**
 * PUT /api/matches/bulk-update
 *
 * يحدّث روابط البث لعدة مباريات دفعة واحدة.
 * يستخدم raw SQL لتجنب مشاكل Prisma client cache.
 *
 * Body:
 *   { updates: [{ id: string, streamUrl: string|null, streamType?: string, broadcaster?: string|null }] }
 *
 * يتطلب صلاحيات المسؤول.
 */
const updateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().min(1),
        streamUrl: z.string().nullable(),
        streamType: z.enum(["hls", "mp4", "youtube", "none", "iframe"]).optional(),
        broadcaster: z.string().nullable().optional(),
      })
    )
    .min(1)
    .max(100),
});

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = updateSchema.parse(body);

    let updated = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const u of data.updates) {
      try {
        const streamType = u.streamType || (u.streamUrl ? "hls" : "none");
        await db.$executeRaw`
          UPDATE Match SET
            streamUrl = ${u.streamUrl},
            streamType = ${streamType},
            broadcaster = ${u.broadcaster ?? null},
            updatedAt = ${new Date()}
          WHERE id = ${u.id}
        `;
        updated++;
      } catch (err) {
        errors.push({
          id: u.id,
          error: err instanceof Error ? err.message : "unknown error",
        });
      }
    }

    // ابطل الكاش
    cache.invalidatePrefix("matches:");

    return NextResponse.json({
      ok: true,
      updated,
      errors,
    });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في التحديث";
    return NextResponse.json({ error: msg }, { status });
  }
}
