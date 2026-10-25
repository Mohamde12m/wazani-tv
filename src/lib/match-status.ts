import { db } from "@/lib/db";
import { cache } from "@/lib/cache";

/**
 * منطق التحويل التلقائي لحالة المباريات.
 *
 * القواعد:
 * - "postponed" (مؤجلة) = تجاوز يدوي — لا تتغير تلقائيًا أبدًا
 * - الآن < kickoff → "scheduled" (مجدولة)
 * - kickoff ≤ الآن < kickoff + MATCH_DURATION_MS → "live" (مباشر)
 * - الآن ≥ kickoff + MATCH_DURATION_MS → "finished" (انتهت)
 *
 * هذا يضمن أن المباراة تنتقل تلقائيًا:
 *   scheduled → live (عند وصول وقت البداية)
 *   live → finished (بعد 100 دقيقة من البداية)
 * دون أي تدخل يدوي من المسؤول.
 */

/** مدة المباراة بالمللي ثانية (100 دقيقة). */
export const MATCH_DURATION_MS = 100 * 60 * 1000;

/** الحالات المسموح بها. */
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

/** الحالات التي تُحسب تلقائيًا (لا تشمل "postponed" لأنها تجاوز يدوي). */
const AUTO_STATUSES: ReadonlySet<string> = new Set(["scheduled", "live", "finished"]);

/**
 * يحسب الحالة الفعلية للمباراة بناءً على وقت البداية والوقت الحالي.
 *
 * @param kickoff وقت بداية المباراة
 * @param storedStatus الحالة المخزنة في قاعدة البيانات
 * @param now الوقت الحالي (افتراضي: new Date())
 * @returns الحالة الفعلية بعد التطبيق التلقائي
 */
export function computeMatchStatus(
  kickoff: Date,
  storedStatus: string,
  now: Date = new Date(),
): MatchStatus {
  // "مؤجلة" = تجاوز يدوي — احترمه دائمًا ولا تغيره تلقائيًا
  if (storedStatus === "postponed") return "postponed";

  const kickoffMs = kickoff.getTime();
  const nowMs = now.getTime();
  const endTimeMs = kickoffMs + MATCH_DURATION_MS;

  if (nowMs < kickoffMs) return "scheduled";
  if (nowMs < endTimeMs) return "live";
  return "finished";
}

/**
 * يطبّق الحالة المحسوبة على قائمة مباريات (للاستخدام في API قبل الإرسال).
 * يُرجع كائنات جديدة (لا يُعدّل الأصلية).
 */
export function applyComputedStatus<T extends { kickoff: Date | string; status: string }>(
  matches: T[],
  now: Date = new Date(),
): T[] {
  return matches.map((m) => {
    const kickoff = typeof m.kickoff === "string" ? new Date(m.kickoff) : m.kickoff;
    const computed = computeMatchStatus(kickoff, m.status, now);
    if (computed === m.status) return m;
    return { ...m, status: computed };
  });
}

/**
 * يزامن قاعدة البيانات: يحدّث حالة كل مباراة تحتاج انتقالًا.
 * يتجاهل المباريات "المؤجلة" (postponed) لأنها تجاوز يدوي.
 *
 * يُستدعى من:
 * - مهمة خلفية في instrumentation.ts (كل 60 ثانية)
 * - يمكن استدعاؤه يدويًا من API
 *
 * @returns عدد المباريات المُحدّثة + قائمة الانتقالات
 */
export async function syncMatchStatuses(): Promise<{
  updated: number;
  transitions: Array<{ id: string; homeName: string; awayName: string; from: string; to: string }>;
}> {
  const now = new Date();
  const transitions: Array<{ id: string; homeName: string; awayName: string; from: string; to: string }> = [];

  // اجلب كل المباريات التي ليست "مؤجلة" (لأن المؤجلة لا تتغير تلقائيًا)
  const matches = await db.match.findMany({
    where: { status: { in: ["scheduled", "live", "finished"] } },
    select: { id: true, kickoff: true, status: true, homeName: true, awayName: true },
  });

  for (const m of matches) {
    const computed = computeMatchStatus(m.kickoff, m.status, now);
    if (computed !== m.status) {
      await db.match.update({
        where: { id: m.id },
        data: { status: computed },
      });
      transitions.push({
        id: m.id,
        homeName: m.homeName,
        awayName: m.awayName,
        from: m.status,
        to: computed,
      });
    }
  }

  if (transitions.length > 0) {
    // ابطل الكاش لي sees الزوار الحالة الجديدة فورًا
    cache.invalidatePrefix("matches:");
  }

  return { updated: transitions.length, transitions };
}
