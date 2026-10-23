import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const tournaments = await db.tournament.findMany({
    where: { visible: true },
    include: { _count: { select: { matches: true, teams: true } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ tournaments });
}

const createSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  logo: z.string().nullable().optional(),
  country: z.string().optional(),
  type: z.enum(["league", "cup", "international"]).default("league"),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const tournament = await db.tournament.create({ data });
    return NextResponse.json({ tournament });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
