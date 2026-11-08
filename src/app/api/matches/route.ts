import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentAdmin } from "@/lib/auth";
import { cache, CACHE_TTL } from "@/lib/cache";
import { applyComputedStatus } from "@/lib/match-status";
import { notifyNewMatch } from "@/lib/onesignal";
import { moroccoLocalToUTC, utcToMoroccoLocal } from "@/lib/morocco-time";

export async function GET() {
  const admin = await getCurrentAdmin();
  // استخدم الكاش (المباريات تتغير بسرعة، لذا TTL أقصر)
  const rawMatches = await cache.getOrSet(
    "matches:all",
    CACHE_TTL.SHORT,
    () =>
      db.match.findMany({
        include: { tournament: true, channel: true, homeTeam: true, awayTeam: true },
        orderBy: { kickoff: "asc" },
      }),
  );
  // طبّق الحالة المحسوبة تلقائيًا (scheduled → live → finished بعد 130 دقيقة)
  // هذا يضمن أن الزوار يرون الحالة الصحيحة فورًا دون انتظار المهمة الخلفية
  const matches = applyComputedStatus(rawMatches).map((m) => ({
    ...m,
    // 🕐 أضف kickoffLocal (بتوقيت المغرب) محسوبًا على الخادم لاستخدامه في لوحة الإدارة
    kickoffLocal: utcToMoroccoLocal(m.kickoff instanceof Date ? m.kickoff.toISOString() : m.kickoff),
  }));
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
  /// 🕐 وقت المباراة بتوقيت المغرب (سلسلة naive: "YYYY-MM-DDTHH:MM")
  /// يُحوَّل إلى UTC على الخادم لضمان الدقة (قاعدة ICU الخادم محدّثة)
  kickoffLocal: z.string().optional(),
  /// fallback: ISO string جاهز (للتوافق مع الإصدارات السابقة)
  kickoff: z.string().optional(),
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

    // 🕐 حدد قيمة kickoff النهائية:
    // - لو وصل kickoffLocal (سلسلة بتوقيت المغرب) → حوّلها على الخادم
    // - وإلا استخدم kickoff مباشرة (ISO string جاهز)
    let kickoffISO: string;
    if (data.kickoffLocal) {
      kickoffISO = moroccoLocalToUTC(data.kickoffLocal);
    } else if (data.kickoff) {
      kickoffISO = data.kickoff;
    } else {
      return NextResponse.json({ error: "وقت المباراة مطلوب (kickoffLocal أو kickoff)" }, { status: 400 });
    }

    const { kickoffLocal: _kl, kickoff: _k, ...rest } = data;
    const match = await db.match.create({ data: { ...rest, kickoff: new Date(kickoffISO) } });
    cache.invalidatePrefix("matches:");
    // أرسل إشعارًا فوريًا لكل المشتركين
    notifyNewMatch(match.homeName, match.awayName).catch(() => {
      // تجاهل أخطاء الإشعارات — لا تعرقل إنشاء المباراة
    });
    return NextResponse.json({ match });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
