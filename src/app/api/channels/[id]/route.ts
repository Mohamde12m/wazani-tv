import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  logo: z.string().nullable().optional(),
  countryId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  streamUrl: z.string().nullable().optional(),
  streamType: z.enum(["hls", "mp4", "youtube", "none"]).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  verified: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const channel = await db.channel.update({ where: { id }, data });
    return NextResponse.json({ channel });
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
    await db.channel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الحذف";
    return NextResponse.json({ error: msg }, { status });
  }
}
