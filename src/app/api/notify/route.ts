import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sendPushNotification } from "@/lib/onesignal";

const notifySchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  url: z.string().optional(),
});

/**
 * POST /api/notify
 * يرسل إشعارًا فوريًا لكل المشتركين (للمسؤول فقط)
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = notifySchema.parse(body);

    const result = await sendPushNotification({
      headings: { ar: data.title },
      contents: { ar: data.message },
      url: data.url || "https://wazani-tv-live.vercel.app",
    });

    if (result.success) {
      return NextResponse.json({ ok: true, id: result.id });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإرسال";
    return NextResponse.json({ error: msg }, { status });
  }
}
