"use client";

import * as React from "react";

/**
 * Client-side Arabic date/time helpers.
 *
 * 🕐 سياسة التوقيت:
 *   - المشرف يُدخل الأوقات بتوقيت المغرب (Morocco Time) — يتم تحويلها إلى UTC عند الحفظ.
 *   - العرض يستخدم توقيت جهاز المستخدم تلقائيًا (بدون تحديد timeZone في Intl،
 *     وبدون دوال getUTC* — بل دوال محلية get* التي تعكس توقيت الجهاز).
 *   - مثال: مباراة 21:30 بتوقيت المغرب (UTC+1) تُخزَّن 20:30 UTC:
 *       • مستخدم في المغرب (UTC+1) يرى: 21:30 ✓
 *       • مستخدم في مصر (UTC+2) يرى: 22:30 ✓
 *       • مستخدم في السعودية (UTC+3) يرى: 23:30 ✓
 */

/** يُنسق الوقت كـ HH:MM (24 ساعة) بتوقيت جهاز المستخدم. */
export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-MA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      // لا نحدد timeZone ← يستخدم توقيت جهاز المستخدم تلقائيًا
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** يُنسق التاريخ بالعربية (يوم الأسبوع + اليوم + الشهر) بتوقيت جهاز المستخدم. */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
      // لا نحدد timeZone ← توقيت الجهاز
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** هل يقع التاريخان في نفس اليوم التقويمي (حسب توقيت جهاز المستخدم)؟ */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** هل يقع iso في "اليوم" (حسب توقيت جهاز المستخدم)؟ */
export function isToday(iso: string): boolean {
  return isSameDay(new Date(iso), new Date());
}

/** هل يقع iso في "غدًا" (حسب توقيت جهاز المستخدم)؟ */
export function isTomorrow(iso: string): boolean {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return isSameDay(new Date(iso), t);
}

/** وصف موجز لليوم: "اليوم" / "غدًا" / تاريخ مختصر — حسب توقيت جهاز المستخدم. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(iso)) return "اليوم";
  if (isTomorrow(iso)) return "غدًا";
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "short",
    // لا نحدد timeZone ← توقيت الجهاز
  }).format(d);
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "مجدولة",
  live: "مباشر",
  finished: "انتهت",
  postponed: "مؤجلة",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Countdown to a future date. Returns d/h/m/s and a done flag. */
export function useCountdown(target: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
} {
  // استخدم 0 كقيمة ابتدائية لتجنب hydration mismatch في الإنتاج
  // (Date.now() على الخادم يختلف عن العميل)
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // عند now=0 (قبل الـ mount)، أرجع قيمًا محايدة لتجنب الـ mismatch
  if (now === 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  }
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, done: false };
}
