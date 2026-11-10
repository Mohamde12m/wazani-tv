import { NextResponse } from "next/server";
import { getUsageSummary } from "@/lib/bandwidth";

/**
 * GET /api/usage
 *
 * يُرجع ملخص استهلاك bandwidth للشهر الحالي.
 * يُستخدم في لوحة الإدارة لعرض شريط التقدم + التنبيهات.
 */
export async function GET() {
  try {
    const summary = await getUsageSummary();
    return NextResponse.json({ usage: summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
