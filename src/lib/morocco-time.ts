/**
 * 🕐 تحويلات توقيت المغرب ↔ UTC (تعمل على الخادم)
 *
 * المشرف يُدخل أوقات المباريات بتوقيت المغرب (Africa/Casablanca).
 * المغرب يستخدم:
 *   - GMT+1 صيفًا (أواخر أبريل → أواخر أكتوبر)
 *   - GMT+0 شتاءً (بقية السنة)
 *   - GMT+0 خلال رمضان (تجاوز للقاعدة الصيفية)
 *
 * نستخدم Intl.DateTimeFormat مع timeZone:"Africa/Casablanca" لتحديد الإزاحة
 * تلقائيًا لأي تاريخ — بلا حساب يدوي للـ DST/رمضان.
 *
 * 🔒 يجب أن تعمل هذه الدوال على الخادم فقط (API routes) لضمان استخدام
 * قاعدة ICU محدّثة (متصفحات المشرفين قد تكون قديمة وتعطي إزاحة خاطئة).
 */

/** يحسب إزاحة المغرب (بالدقائق) عند لحظة UTC معينة — يتعامل مع DST/رمضان تلقائيًا. */
export function getMoroccoOffsetMinutes(d: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Casablanca",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) =>
      parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
    let h = get("hour");
    if (h === 24) h = 0; // بعض البيئات تُرجع 24 لمنتصف الليل
    // أنشئ طابعًا زمنيًا كأن القيم المغربية هي UTC (مرجع للمقارنة)
    const moroccoAsUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      h,
      get("minute"),
      get("second"),
    );
    // الفرق = الإزاحة (موجب = المغرب أمام UTC)
    return Math.round((moroccoAsUtc - d.getTime()) / 60000);
  } catch {
    return 60; // افتراضي: المغرب GMT+1
  }
}

/**
 * يحوّل وقتًا محليًا بالمغرب (Morocco wall-clock) إلى ISO UTC.
 * مثال: "2026-11-08T20:00" (شتاء GMT+0) → "2026-11-08T20:00:00.000Z"
 *        "2026-07-15T20:00" (صيف GMT+1) → "2026-07-15T19:00:00.000Z"
 *
 * @param moroccoLocalStr سلسلة بصيغة "YYYY-MM-DDTHH:MM" (بدون لاحقة زمنية)
 */
export function moroccoLocalToUTC(moroccoLocalStr: string): string {
  // 1. أنشئ تاريخًا مرشحًا بتفسير السلسلة كأنها UTC (مرجع مؤقت)
  const candidate = new Date(moroccoLocalStr + ":00.000Z");
  if (isNaN(candidate.getTime())) {
    // لو السلسلة غير صالحة، حاول تحليلها مباشرة
    const fallback = new Date(moroccoLocalStr);
    if (isNaN(fallback.getTime())) return moroccoLocalStr;
    return fallback.toISOString();
  }
  // 2. اعرف إزاحة المغرب عند تلك اللحظة (تتعامل تلقائيًا مع DST/رمضان)
  const offsetMin = getMoroccoOffsetMinutes(candidate);
  // 3. الوقت المحلي بالمغرب = UTC + الإزاحة ← UTC = المحلي − الإزاحة
  const utc = new Date(candidate.getTime() - offsetMin * 60 * 1000);
  return utc.toISOString();
}

/**
 * يحوّل ISO UTC إلى وقت محلي بالمغرب بصيغة datetime-local "YYYY-MM-DDTHH:MM".
 * مثال: "2026-11-08T20:00:00.000Z" (شتاء GMT+0) → "2026-11-08T20:00"
 *        "2026-07-15T19:00:00.000Z" (صيف GMT+1) → "2026-07-15T20:00"
 *
 * @param utcIso سلسلة ISO بتوقيت UTC (مثل "2026-11-08T20:00:00.000Z")
 */
export function utcToMoroccoLocal(utcIso: string): string {
  const d = new Date(utcIso);
  if (isNaN(d.getTime())) return utcIso;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Casablanca",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) =>
      parts.find((p) => p.type === t)?.value ?? "00";
    let h = get("hour");
    if (h === "24") h = "00";
    return `${get("year")}-${get("month")}-${get("day")}T${h}:${get("minute")}`;
  } catch {
    // fallback: استخدم قيم UTC الخام
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
      d.getUTCDate(),
    )}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
}
