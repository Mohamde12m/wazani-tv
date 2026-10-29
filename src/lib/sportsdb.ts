import { db } from "@/lib/db";
import { cache } from "@/lib/cache";

/**
 * خدمة سحب المباريات الحقيقية من theSportsDB API
 *
 * المفتاح المجاني: "123" (يعمل بدون تسجيل)
 * الحد: غير محدود عمليًا (مع تأخير بسيط)
 *
 * الدوريات المفعّلة (حددها المستخدم):
 * - الدوريات الأوروبية الكبرى (الإسباني، الإنجليزي، الإيطالي، الفرنسي، الألماني)
 * - شامبيونز ليغ + يوروبا ليغ
 * - كأس العالم
 * - الدوريات العربية (المغرب، مصر، الجزائر، تونس، قطر)
 */

/**
 * المفتاح المجاني العام "123" محدود جدًا (429 بسرعة).
 * للحصول على مفتاح أفضل، سجّل في https://www.thesportsdb.com/
 * وأضف: SPORTSDB_API_KEY=your_key في متغيرات البيئة
 */
const SPORTSDB_KEY = process.env.SPORTSDB_API_KEY || "123";
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}`;

/** الدوريات المفعّلة — يمكن تعديلها من لوحة الإدارة مستقبلاً */
export const ENABLED_LEAGUES = [
  // 🇪🇺 الدوريات الأوروبية الكبرى
  { id: "4335", name: "الدوري الإسباني", nameEn: "Spanish La Liga", country: "إسبانيا", type: "league", priority: 1 },
  { id: "4328", name: "الدوري الإنجليزي", nameEn: "English Premier League", country: "إنجلترا", type: "league", priority: 1 },
  { id: "4332", name: "الدوري الإيطالي", nameEn: "Italian Serie A", country: "إيطاليا", type: "league", priority: 1 },
  { id: "4334", name: "الدوري الفرنسي", nameEn: "French Ligue 1", country: "فرنسا", type: "league", priority: 1 },
  { id: "4331", name: "الدوري الألماني", nameEn: "German Bundesliga", country: "ألمانيا", type: "league", priority: 1 },
  // 🏆 البطولات القارية
  { id: "4480", name: "دوري أبطال أوروبا", nameEn: "UEFA Champions League", country: "أوروبا", type: "cup", priority: 1 },
  { id: "4481", name: "الدوري الأوروبي", nameEn: "UEFA Europa League", country: "أوروبا", type: "cup", priority: 2 },
  // 🌍 بطولات عالمية
  { id: "4429", name: "كأس العالم", nameEn: "FIFA World Cup", country: "عالمي", type: "international", priority: 1 },
  // 🇲🇦 الدوريات العربية
  { id: "4520", name: "الدوري المغربي", nameEn: "Moroccan Championship", country: "المغرب", type: "league", priority: 1 },
  { id: "4829", name: "الدوري المصري", nameEn: "Egyptian Premier League", country: "مصر", type: "league", priority: 2 },
  { id: "4753", name: "الدوري الجزائري", nameEn: "Algerian Ligue 1", country: "الجزائر", type: "league", priority: 2 },
  { id: "4828", name: "الدوري التونسي", nameEn: "Tunisian Ligue 1", country: "تونس", type: "league", priority: 2 },
  { id: "4663", name: "الدوري القطري", nameEn: "Qatar Stars League", country: "قطر", type: "league", priority: 3 },
  { id: "4668", name: "الدوري السعودي للمحترفين", nameEn: "Saudi Pro League", country: "السعودية", type: "league", priority: 1 },
] as const;

export interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strSport: string;
  idLeague: string;
  strLeague: string;
  strLeagueBadge?: string;
  strSeason: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string | null;
  strTimestamp: string | null;
  strVenue?: string;
  strStatus?: string;
  strPostponed?: string;
  idHomeTeam: string;
  idAwayTeam: string;
}

/**
 * يجلب المباريات القادمة من theSportsDB لكل دوري مفعّل
 * يستخدم eventsnextleague.php لكل دوري
 * يضيف تأخير بين الطلبات لتجنب rate limiting (429)
 */
export async function fetchUpcomingMatches(): Promise<SportsDBEvent[]> {
  const allEvents: SportsDBEvent[] = [];
  const seenIds = new Set<string>();

  // اطلب بشكل متسلسل مع تأخير 1.5 ثانية بين كل دوري
  for (const league of ENABLED_LEAGUES) {
    try {
      const url = `${SPORTSDB_BASE}/eventsnextleague.php?id=${league.id}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "WazaNI-TV/1.0" },
        // @ts-expect-error - next cache
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.error(`[sportsdb] league ${league.id} (${league.name}): HTTP ${res.status}`);
        // لو 429، انتظر أطول
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 3000));
        }
        continue;
      }

      const data = await res.json();
      const events: SportsDBEvent[] = data.events || [];
      for (const event of events) {
        if (!seenIds.has(event.idEvent)) {
          seenIds.add(event.idEvent);
          allEvents.push(event);
        }
      }
    } catch (err) {
      console.error(`[sportsdb] fetch error for league ${league.id}:`, err);
    }

    // تأخير 600ms بين كل دوري (لتجنب 429)
    await new Promise((r) => setTimeout(r, 600));
  }

  return allEvents;
}

/**
 * يجلب مباريات يوم محدد من theSportsDB لكل دوري مفعّل
 * يستخدم eventsday.php?l=<league> لكل دوري
 */
export async function fetchMatchesForDate(dateStr: string): Promise<SportsDBEvent[]> {
  const allEvents: SportsDBEvent[] = [];
  const seenIds = new Set<string>();

  for (const league of ENABLED_LEAGUES) {
    try {
      const url = `${SPORTSDB_BASE}/eventsday.php?d=${dateStr}&l=${league.id}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "WazaNI-TV/1.0" },
        // @ts-expect-error - next cache
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 2000));
        }
        continue;
      }

      const data = await res.json();
      const events: SportsDBEvent[] = data.events || [];
      for (const event of events) {
        if (!seenIds.has(event.idEvent)) {
          seenIds.add(event.idEvent);
          allEvents.push(event);
        }
      }
    } catch (err) {
      console.error(`[sportsdb] fetch error for ${dateStr} league ${league.id}:`, err);
    }

    // تأخير 600ms
    await new Promise((r) => setTimeout(r, 600));
  }

  return allEvents;
}

/**
 * يحفظ المباريات المسحوبة في قاعدة البيانات
 * - يتجنب التكرار (externalId فريد)
 * - ينشئ البطولات والفرق تلقائيًا إن لم تكن موجودة
 */
export async function saveMatchesToDB(events: SportsDBEvent[]): Promise<{
  created: number;
  updated: number;
  skipped: number;
  skipReasons: string[];
}> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const event of events) {
    try {
      // تخطّي المباريات المؤجلة
      if (event.strPostponed === "yes") {
        skipReasons.push(`postponed: ${event.strHomeTeam} vs ${event.strAwayTeam}`);
        skipped++;
        continue;
      }

      // ابحث عن البطولة أو أنشئها
      const leagueInfo = ENABLED_LEAGUES.find((l) => l.id === event.idLeague);
      if (!leagueInfo) {
        skipReasons.push(`unknown league ${event.idLeague}: ${event.strHomeTeam} vs ${event.strAwayTeam}`);
        skipped++;
        continue;
      }

      const tournament = await db.tournament.upsert({
        where: { id: `sportsdb-${event.idLeague}` },
        create: {
          id: `sportsdb-${event.idLeague}`,
          name: leagueInfo.name,
          nameAr: leagueInfo.name,
          logo: event.strLeagueBadge || null,
          country: leagueInfo.country,
          type: leagueInfo.type,
          order: leagueInfo.priority,
          visible: true,
        },
        update: {
          logo: event.strLeagueBadge || undefined,
        },
      });

      // حدّد وقت البداية
      let kickoff: Date;
      if (event.strTimestamp) {
        kickoff = new Date(event.strTimestamp);
      } else if (event.strTime && event.dateEvent) {
        kickoff = new Date(`${event.dateEvent}T${event.strTime}Z`);
      } else {
        kickoff = new Date(`${event.dateEvent}T20:00:00Z`);
      }

      // حدّد الحالة
      let status: "scheduled" | "live" | "finished" = "scheduled";
      const now = new Date();
      if (event.strStatus === "FT" || event.strStatus === "Match Finished") {
        status = "finished";
      } else if (event.strStatus === "In Play" || event.strStatus === "1H" || event.strStatus === "2H" || event.strStatus === "HT") {
        status = "live";
      } else if (now.getTime() > kickoff.getTime() + 100 * 60 * 1000) {
        status = "finished";
      } else if (now.getTime() >= kickoff.getTime()) {
        status = "live";
      }

      // حدّد النتيجة
      const homeScore = event.intHomeScore ? parseInt(event.intHomeScore, 10) : null;
      const awayScore = event.intAwayScore ? parseInt(event.intAwayScore, 10) : null;

      // upsert المباراة (externalId فريد)
      // استخدم raw SQL للتحقق من وجود المباراة (لتجنب مشاكل Prisma client cache)
      const existingRows = await db.$queryRaw<{ id: string }[]>`
        SELECT id FROM Match WHERE externalId = ${event.idEvent} LIMIT 1
      `;
      const existing = existingRows.length > 0 ? existingRows[0] : null;

      if (existing) {
        // حدّث النتيجة + الحالة فقط (لا تمسح streamUrl لو أضافه المسؤول)
        await db.$executeRaw`
          UPDATE Match SET
            homeScore = ${homeScore},
            awayScore = ${awayScore},
            status = ${status},
            homeLogo = COALESCE(${event.strHomeTeamBadge || null}, homeLogo),
            awayLogo = COALESCE(${event.strAwayTeamBadge || null}, awayLogo),
            tournamentName = ${tournament.name},
            stadium = COALESCE(${event.strVenue || null}, stadium),
            updatedAt = ${new Date()}
          WHERE id = ${existing.id}
        `;
        updated++;
      } else {
        // استخدم raw SQL للإنشاء (لتجنب مشاكل Prisma client cache على Vercel)
        const newId = `sportsdb-${event.idEvent}`;
        await db.$executeRaw`
          INSERT INTO Match (id, externalId, homeName, awayName, homeLogo, awayLogo, tournamentId, tournamentName, kickoff, status, homeScore, awayScore, stadium, demo, featured, streamType, createdAt, updatedAt)
          VALUES (
            ${newId},
            ${event.idEvent},
            ${event.strHomeTeam},
            ${event.strAwayTeam},
            ${event.strHomeTeamBadge || null},
            ${event.strAwayTeamBadge || null},
            ${tournament.id},
            ${tournament.name},
            ${kickoff},
            ${status},
            ${homeScore},
            ${awayScore},
            ${event.strVenue || null},
            ${false},
            ${leagueInfo.priority === 1},
            'none',
            ${new Date()},
            ${new Date()}
          )
        `;
        created++;
      }
    } catch (err) {
      skipReasons.push(`error: ${event.strHomeTeam} vs ${event.strAwayTeam} - ${err instanceof Error ? err.message : 'unknown'}`);
      skipped++;
    }
  }

  // ابطل الكاش
  cache.invalidatePrefix("matches:");

  return { created, updated, skipped, skipReasons };
}

/**
 * المهمة الرئيسية: تسحب كل مباريات 3 أيام (اليوم + غدًا + بعد غد)
 * لكل الدوريات المفعّلة. تستخدم eventsday.php?l=<league> لكل دوري
 * (يرجع كل مباريات اليوم لكل دوري، مش مباراة واحدة).
 *
 * النتيجة: 30-50 مباراة حقيقية موزعة على 3 أيام × 14 دوري
 */
export async function syncDailyMatches(): Promise<{
  upcoming: { created: number; updated: number; skipped: number };
  today: { created: number; updated: number; skipped: number };
  tomorrow: { created: number; updated: number; skipped: number };
  daysScanned: number;
  totalFetched: number;
}> {
  const now = new Date();
  const dates: string[] = [];
  // 3 أيام: اليوم + غدًا + بعد غد
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split("T")[0]);
  }

  console.log(`[sportsdb] scanning dates: ${dates.join(", ")}`);

  const allEvents: SportsDBEvent[] = [];
  const seenIds = new Set<string>();

  // لكل يوم، اسحب مباريات كل الدوريات
  for (const dateStr of dates) {
    console.log(`[sportsdb] fetching matches for ${dateStr}...`);
    const events = await fetchMatchesForDate(dateStr);
    for (const e of events) {
      if (!seenIds.has(e.idEvent)) {
        seenIds.add(e.idEvent);
        allEvents.push(e);
      }
    }
    console.log(`[sportsdb] ${dateStr}: ${events.length} events`);
  }

  console.log(`[sportsdb] total unique events: ${allEvents.length}`);

  // احفظهم
  const result = await saveMatchesToDB(allEvents);
  console.log(
    `[sportsdb] sync: ${result.created} new, ${result.updated} updated, ${result.skipped} skipped`
  );

  return {
    upcoming: result,
    today: { created: 0, updated: 0, skipped: 0 },
    tomorrow: { created: 0, updated: 0, skipped: 0 },
    daysScanned: dates.length,
    totalFetched: allEvents.length,
  };
}
