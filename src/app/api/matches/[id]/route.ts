import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cache } from "@/lib/cache";

const updateSchema = z.object({
  homeName: z.string().optional(),
  awayName: z.string().optional(),
  homeLogo: z.string().nullable().optional(),
  awayLogo: z.string().nullable().optional(),
  homeTeamId: z.string().nullable().optional(),
  awayTeamId: z.string().nullable().optional(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().optional(),
  kickoff: z.string().optional(),
  status: z.enum(["scheduled", "live", "finished", "postponed"]).optional(),
  homeScore: z.number().nullable().optional(),
  awayScore: z.number().nullable().optional(),
  stadium: z.string().nullable().optional(),
  channelId: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  demo: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const payload: Record<string, unknown> = { ...data };
    if (data.kickoff) payload.kickoff = new Date(data.kickoff);
    const match = await db.match.update({ where: { id }, data: payload });
    cache.invalidatePrefix("matches:");
    return NextResponse.json({ match });
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
    await db.match.delete({ where: { id } });
    cache.invalidatePrefix("matches:");
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الحذف";
    return NextResponse.json({ error: msg }, { status });
  }
}
