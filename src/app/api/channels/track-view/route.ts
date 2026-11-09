import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cache } from "@/lib/cache";

/**
 * POST /api/channels/track-view?channelId=xxx
 *
 * يُسجّل مشاهدة لقناة — يزيد viewCount بمقدار 1.
 * يُستدعى عند فتح المشغل لقناة معينة.
 *
 * ✅ سريع: update واحد فقط، لا استعلامات إضافية
 * ✅ آمن: لا يتطلب مصادقة (المشاهد العادي يسجّل مشاهدته)
 * ✅ يبطل كاش القنوات ليعكس العدد المحدّث
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json({ error: "missing channelId" }, { status: 400 });
    }

    // زيادة viewCount بمقدار 1 (atomic increment)
    await db.channel.update({
      where: { id: channelId },
      data: { viewCount: { increment: 1 } },
    });

    // ابطل كاش القنوات ليعكس العدد المحدّث
    cache.invalidatePrefix("channels:");

    return NextResponse.json({ ok: true });
  } catch (err) {
    // لو القناة غير موجودة أو خطأ آخر — لا نعرقل المشاهد
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 200 }, // 200 وليس 500 لئلا يظهر خطأ في المتصفح
    );
  }
}
