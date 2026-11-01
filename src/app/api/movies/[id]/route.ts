import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cache } from "@/lib/cache";

const updateSchema = z.object({
  title: z.string().optional(),
  titleEn: z.string().nullable().optional(),
  description: z.string().optional(),
  posterUrl: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).optional(),
  duration: z.string().optional(),
  year: z.number().int().optional(),
  genres: z.string().optional(),
  gradient: z.string().optional(),
  streamUrl: z.string().nullable().optional(),
  streamType: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const movie = await db.movie.update({ where: { id }, data });
    cache.invalidatePrefix("movies:");
    return NextResponse.json({ movie });
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
    await db.movie.delete({ where: { id } });
    cache.invalidatePrefix("movies:");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الحذف";
    return NextResponse.json({ error: msg }, { status });
  }
}
