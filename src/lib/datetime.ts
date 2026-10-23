"use client";

import * as React from "react";

/** Client-side Arabic date/time helpers using Intl. */

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-MA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Casablanca",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Africa/Casablanca",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(iso: string): boolean {
  return isSameDay(new Date(iso), new Date());
}

export function isTomorrow(iso: string): boolean {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return isSameDay(new Date(iso), t);
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(iso)) return "اليوم";
  if (isTomorrow(iso)) return "غدًا";
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Casablanca",
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
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
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
