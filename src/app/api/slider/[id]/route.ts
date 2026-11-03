import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cache } from "@/lib/cache";

const updateSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  gradient: z.string().optional(),
  linkType: z.enum(["channel", "match", "url", "none"]).optional(),
  linkId: z.string().nullable().optional(),
  buttonText: z.string().optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const item = await db.sliderItem.update({ where: { id }, data });
    cache.invalidatePrefix("slider:");
    return NextResponse.json({ item });
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
    await db.sliderItem.delete({ where: { id } });
    cache.invalidatePrefix("slider:");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الحذف";
    return NextResponse.json({ error: msg }, { status });
  }
}
