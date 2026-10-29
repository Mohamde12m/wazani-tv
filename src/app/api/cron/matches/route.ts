import { NextRequest, NextResponse } from "next/server";
import { syncDailyMatches } from "@/lib/sportsdb";

/**
 * GET /api/cron/matches
 *
 * مهمة مجدولة (cron) تسحب مباريات اليوم وغدًا من theSportsDB
 * وتخزنها في قاعدة البيانات.
 *
 * الأمان: يتطلب إما:
 * - ترويسة Authorization بقيمة CRON_SECRET من متغيرات البيئة
 * - أو معامل ?token=<secret>
 *
 * يُستدعى من:
 * - Vercel Cron (يوميًا 6:00 UTC)
 * - أو يدويًا من لوحة الإدارة
 */

// مدة تشغيل أطول لهذه الدالة (300 ثانية = 5 دقائق) لأنها تسحب من 14 دوريًا × 3 أيام مع retry
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // تحقق من الأمان
  const authHeader = req.headers.get("authorization");
  const token = new URL(req.url).searchParams.get("token");
  const expectedSecret = process.env.CRON_SECRET || "wazani-cron-secret-2026";

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` || token === expectedSecret;

  // في التطوير، اسمح بدون مصادقة
  const isDev = process.env.NODE_ENV === "development";
  if (!isAuthorized && !isDev) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncDailyMatches();
    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("[cron/matches] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
