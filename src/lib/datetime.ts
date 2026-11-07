"use client";

import * as React from "react";

/**
 * Client-side Arabic date/time helpers.
 *
 * 🔒 سياسة التوقيت (literal / no-conversion):
 *   - الأوقات تُخزَّن كما أدخلها المشرف حرفيًا (بدون تحويل UTC أو إزاحة منطقة زمنية).
 *   - العرض يستخدم دوال getUTC* دائمًا → ما يراه المستخدم = ما أدخله المشرف بالضبط.
 *   - لا نستخدم Intl مع timeZone محددة (لا Africa/Casablanca ولا منطقة المتصفح).
 *   - للمقارنات (isToday/isTomorrow/isSameDay) نستخدم تاريخ UTC للجانبين.
 */

/** يُنسق الوقت كـ HH:MM (24 ساعة) من قيم UTC الحرفية للوقت المخزَّن. */
export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = d.getUTCHours().toString().padStart(2, "0");
    const m = d.getUTCMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
}

/** يُنسق التاريخ بالعربية (يوم الأسبوع + اليوم + الشهر) من قيم UTC الحرفية. */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** هل يقع التاريخان في نفس اليوم التقويمي (UTC)؟ */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** هل يقع iso في "اليوم" (حسب تاريخ UTC)؟ */
export function isToday(iso: string): boolean {
  return isSameDay(new Date(iso), new Date());
}

/** هل يقع iso في "غدًا" (حسب تاريخ UTC)؟ */
export function isTomorrow(iso: string): boolean {
  const t = new Date();
  t.setUTCDate(t.getUTCDate() + 1);
  return isSameDay(new Date(iso), t);
}

/** وصف موجز لليوم: "اليوم" / "غدًا" / تاريخ مختصر. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(iso)) return "اليوم";
  if (isTomorrow(iso)) return "غدًا";
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
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
