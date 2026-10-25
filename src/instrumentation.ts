/**
 * Next.js Instrumentation Hook
 *
 * يُستدعى مرة واحدة عند بدء الخادم (dev أو production).
 * نستخدمه لبدء مهمة خلفية تزامن حالة المباريات كل 60 ثانية:
 *   scheduled → live (عند وصول وقت البداية)
 *   live → finished (بعد 100 دقيقة من البداية)
 *
 * هذا يُحدّث قاعدة البيانات فعليًا، بينما يقوم GET /api/matches
 * بحساب الحالة على الطاير كطبقة إضافية من الضمان.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // لا تشغّل المهمة الخلفية أثناء البناء (next build)
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  // استيراد ديناميكي لتجنب تحميل منطق قاعدة البيانات في build time
  const { syncMatchStatuses } = await import("@/lib/match-status");

  // استخدم متغير عالمي لمنع إنشاء عدة فواصل زمنية (intervals) أثناء إعادة التحميل السريع (hot reload) في وضع التطوير
  const g = globalThis as unknown as { __matchSyncInterval?: ReturnType<typeof setInterval> };

  if (g.__matchSyncInterval) {
    clearInterval(g.__matchSyncInterval);
  }

  // شغّل المزامنة فورًا عند بدء التشغيل
  syncMatchStatuses().catch((err) => {
    console.error("[match-sync] فشلت المزامنة الأولية:", err);
  });

  // ثم كل 60 ثانية
  g.__matchSyncInterval = setInterval(() => {
    syncMatchStatuses().catch((err) => {
      console.error("[match-sync] فشلت المزامنة الدورية:", err);
    });
  }, 60_000);

  console.log("[match-sync] بدأت مهمة تزامن حالة المباريات (كل 60 ثانية)");
}
