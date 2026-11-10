import { db } from "@/lib/db";

/**
 * 📊 نظام مراقبة استهلاك bandwidth
 *
 * يتعقب البايتات المرسلة عبر /api/stream (proxy) شهريًا.
 * يوفر حماية تلقائية من تجاوز حدود Vercel المجانية (100GB/شهر).
 *
 * الحدود:
 * - 70GB (70%): تحذير مبكر ← يظهر في لوحة الإدارة
 * - 90GB (90%): حماية تلقائية ← يوقف الـ proxy
 * - 100GB (100%): Vercel يوقف الموقع بالكامل
 */

/// حد Vercel المجاني بالبايت (100 GB)
export const VERCEL_FREE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024; // 107,374,182,400

/// حد التحذير المبكر (70%)
export const WARNING_THRESHOLD = 0.7;

/// حد الحماية التلقائية — يوقف الـ proxy (90%)
export const PROTECTION_THRESHOLD = 0.9;

/** يحصل على الشهر الحالي بصيغة "YYYY-MM" */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * يسجّل استهلاك bandwidth للشهر الحالي.
 * يزيد proxyBytes + proxyRequests في قاعدة البيانات.
 *
 * @param bytes عدد البايتات المرسلة في هذا الطلب
 */
export async function trackBandwidth(bytes: number): Promise<void> {
  const month = getCurrentMonth();
  try {
    // upsert: أنشئ الصف لو غير موجود، وإلا زِد القيم
    await db.usage.upsert({
      where: { month },
      create: {
        month,
        proxyBytes: BigInt(bytes),
        proxyRequests: 1,
      },
      update: {
        proxyBytes: { increment: BigInt(bytes) },
        proxyRequests: { increment: 1 },
      },
    });
  } catch {
    // تجاهل أخطاء التتبع — لا نعرقل البث
  }
}

/**
 * يحسب نسبة الاستهلاك الحالي من حد Vercel المجاني.
 * @returns نسبة من 0 إلى 1 (0.7 = 70%)
 */
export async function getUsageRatio(): Promise<number> {
  const usage = await getCurrentUsage();
  if (!usage) return 0;
  return Number(usage.proxyBytes) / VERCEL_FREE_LIMIT_BYTES;
}

/**
 * يجلب الاستهلاك الحالي للشهر الجاري.
 */
export async function getCurrentUsage() {
  const month = getCurrentMonth();
  try {
    return await db.usage.findUnique({ where: { month } });
  } catch {
    return null;
  }
}

/**
 * 🛡️ يتحقق ما إذا كان يجب تفعيل الحماية التلقائية.
 * يُستدعى في بداية كل طلب proxy — لو true، يُرجع خطأ 503.
 *
 * @returns true لو تجاوز 90% (يجب حظر الـ proxy)
 */
export async function isProxyProtected(): Promise<boolean> {
  const ratio = await getUsageRatio();
  return ratio >= PROTECTION_THRESHOLD;
}

/**
 * 📊 يجلب ملخص الاستهلاك للوحة الإدارة.
 */
export async function getUsageSummary() {
  const usage = await getCurrentUsage();
  const bytes = usage ? Number(usage.proxyBytes) : 0;
  const requests = usage ? usage.proxyRequests : 0;
  const ratio = bytes / VERCEL_FREE_LIMIT_BYTES;
  const percent = Math.round(ratio * 100);

  return {
    bytes,
    requests,
    ratio,
    percent,
    /// بالجيجابايت (منزلة عشرية واحدة)
    gb: (bytes / (1024 * 1024 * 1024)).toFixed(1),
    /// حد Vercel بالجيجابايت
    limitGb: (VERCEL_FREE_LIMIT_BYTES / (1024 * 1024 * 1024)).toFixed(0),
    /// الحالة: safe | warning | protected
    status:
      ratio >= PROTECTION_THRESHOLD
        ? ("protected" as const)
        : ratio >= WARNING_THRESHOLD
          ? ("warning" as const)
          : ("safe" as const),
    /// هل يجب حظر الـ proxy؟
    proxyBlocked: ratio >= PROTECTION_THRESHOLD,
  };
}

/**
 * ينسّق البايتات بشكل مختصر: 1.5GB, 500MB, 800KB
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + "GB";
  }
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  }
  if (bytes >= 1024) {
    return (bytes / 1024).toFixed(1) + "KB";
  }
  return bytes + "B";
}
