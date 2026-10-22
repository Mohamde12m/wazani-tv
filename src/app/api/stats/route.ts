import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [channels, matches, tournaments, countries, categories, teams, admins] = await Promise.all([
      db.channel.count(),
      db.match.count(),
      db.tournament.count(),
      db.country.count(),
      db.category.count(),
      db.team.count(),
      db.adminUser.count(),
    ]);
    const liveMatches = await db.match.count({ where: { status: "live" } });
    const featuredChannels = await db.channel.count({ where: { featured: true } });
    const verifiedChannels = await db.channel.count({ where: { verified: true } });
    return NextResponse.json({
      stats: {
        channels, matches, tournaments, countries, categories, teams, admins,
        liveMatches, featuredChannels, verifiedChannels,
      },
    });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
