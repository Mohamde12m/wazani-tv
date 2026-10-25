import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { computeMatchStatus } from "@/lib/match-status";

export async function GET() {
  try {
    await requireAdmin();
    const [channels, matchesCount, tournaments, countries, categories, teams, admins] = await Promise.all([
      db.channel.count(),
      db.match.count(),
      db.tournament.count(),
      db.country.count(),
      db.category.count(),
      db.team.count(),
      db.adminUser.count(),
    ]);
    // احسب عدد المباريات المباشرة فعليًا (بناءً على وقت البداية + 100 دقيقة)
    // بدلًا من الاعتماد على الحالة المخزنة التي قد تكون قديمة
    const allMatches = await db.match.findMany({
      select: { kickoff: true, status: true },
    });
    const now = new Date();
    const liveMatches = allMatches.filter(
      (m) => computeMatchStatus(m.kickoff, m.status, now) === "live",
    ).length;
    const featuredChannels = await db.channel.count({ where: { featured: true } });
    const verifiedChannels = await db.channel.count({ where: { verified: true } });
    return NextResponse.json({
      stats: {
        channels, matches: matchesCount, tournaments, countries, categories, teams, admins,
        liveMatches, featuredChannels, verifiedChannels,
      },
    });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
