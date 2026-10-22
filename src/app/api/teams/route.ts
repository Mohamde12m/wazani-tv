import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { svgLogo } from "@/lib/logo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");
  const teams = await db.team.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    include: { tournament: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ teams });
}

const createSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  logo: z.string().nullable().optional(),
  country: z.string().optional(),
  tournamentId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    if (!data.logo) data.logo = svgLogo(data.nameAr ?? data.name, { shape: "circle" });
    const team = await db.team.create({ data });
    return NextResponse.json({ team });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
