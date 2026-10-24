import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  const admin = await getCurrentAdmin();
  // استخدم الكاش (المباريات تتغير بسرعة، لذا TTL أقصر)
  const matches = await cache.getOrSet(
    "matches:all",
    CACHE_TTL.SHORT,
    () =>
      db.match.findMany({
        include: { tournament: true, channel: true, homeTeam: true, awayTeam: true },
        orderBy: { kickoff: "asc" },
      }),
  );
  return NextResponse.json({ matches, admin: admin ? { name: admin.name } : null });
}

const createSchema = z.object({
  homeName: z.string().min(1),
  awayName: z.string().min(1),
  homeLogo: z.string().nullable().optional(),
  awayLogo: z.string().nullable().optional(),
  homeTeamId: z.string().nullable().optional(),
  awayTeamId: z.string().nullable().optional(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().optional(),
  kickoff: z.string(),
  status: z.enum(["scheduled", "live", "finished", "postponed"]).default("scheduled"),
  homeScore: z.number().nullable().optional(),
  awayScore: z.number().nullable().optional(),
  stadium: z.string().nullable().optional(),
  channelId: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  demo: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const match = await db.match.create({ data: { ...data, kickoff: new Date(data.kickoff) } });
    cache.invalidatePrefix("matches:");
    return NextResponse.json({ match });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
