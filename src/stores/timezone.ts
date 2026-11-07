"use client";

import { create } from "zustand";

/**
 * تخزين توقيت المستخدم — يختار دولته ويتحول الوقت تلقائيًا
 */

export interface CountryTimezone {
  code: string;
  name: string;
  flag: string;
  offset: number; // UTC offset (ساعات)
}

export const COUNTRY_TIMEZONES: CountryTimezone[] = [
  { code: "auto", name: "تلقائي (حسب الجهاز)", flag: "🌍", offset: 0 },
  { code: "MA", name: "المغرب", flag: "🇲🇦", offset: 1 },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿", offset: 1 },
  { code: "TN", name: "تونس", flag: "🇹🇳", offset: 1 },
  { code: "LY", name: "ليبيا", flag: "🇱🇾", offset: 2 },
  { code: "EG", name: "مصر", flag: "🇪🇬", offset: 2 },
  { code: "SD", name: "السودان", flag: "🇸🇩", offset: 2 },
  { code: "SA", name: "السعودية", flag: "🇸🇦", offset: 3 },
  { code: "QA", name: "قطر", flag: "🇶🇦", offset: 3 },
  { code: "AE", name: "الإمارات", flag: "🇦🇪", offset: 4 },
  { code: "OM", name: "عمان", flag: "🇴🇲", offset: 4 },
  { code: "BH", name: "البحرين", flag: "🇧🇭", offset: 3 },
  { code: "KW", name: "الكويت", flag: "🇰🇼", offset: 3 },
  { code: "IQ", name: "العراق", flag: "🇮🇶", offset: 3 },
  { code: "JO", name: "الأردن", flag: "🇯🇴", offset: 3 },
  { code: "LB", name: "لبنان", flag: "🇱🇧", offset: 3 },
  { code: "PS", name: "فلسطين", flag: "🇵🇸", offset: 3 },
  { code: "SY", name: "سوريا", flag: "🇸🇾", offset: 3 },
  { code: "YE", name: "اليمن", flag: "🇾🇪", offset: 3 },
  { code: "MR", name: "موريتانيا", flag: "🇲🇷", offset: 0 },
];

interface TimezoneState {
  selected: string; // country code or "auto"
  offset: number; // UTC offset
  loaded: boolean;
  setCountry: (code: string) => void;
  load: () => void;
}

function getBrowserOffset(): number {
  // يحسب فرق التوقيت من المتصفح (بساعات)
  return -new Date().getTimezoneOffset() / 60;
}

export const useTimezone = create<TimezoneState>((set, get) => ({
  selected: "auto",
  offset: 0,
  loaded: false,

  load: () => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("wazani_timezone");
      if (saved) {
        const country = COUNTRY_TIMEZONES.find((c) => c.code === saved);
        if (country) {
          const offset = country.code === "auto" ? getBrowserOffset() : country.offset;
          set({ selected: saved, offset, loaded: true });
          return;
        }
      }
    } catch {}
    // افتراضي: تلقائي
    set({ selected: "auto", offset: getBrowserOffset(), loaded: true });
  },

  setCountry: (code: string) => {
    const country = COUNTRY_TIMEZONES.find((c) => c.code === code);
    if (!country) return;
    const offset = country.code === "auto" ? getBrowserOffset() : country.offset;
    set({ selected: code, offset });
    if (typeof window !== "undefined") {
      localStorage.setItem("wazani_timezone", code);
    }
  },
}));

/**
 * يحول وقت UTC إلى توقيت المستخدم المحلي
 */
export function toLocalTime(utcDate: Date | string, offset: number): Date {
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return new Date(d.getTime() + offset * 60 * 60 * 1000);
}

/**
 * يحول وقت UTC إلى توقيت المستخدم ويعرضه كنص HH:MM
 */
export function formatLocalTime(utcDate: Date | string, offset: number): string {
  const local = toLocalTime(utcDate, offset);
  const h = local.getUTCHours().toString().padStart(2, "0");
  const m = local.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * يحول وقت UTC إلى تاريخ محلي ويعرض "اليوم / غدًا / التاريخ"
 */
export function formatLocalDay(utcDate: Date | string, offset: number): string {
  const local = toLocalTime(utcDate, offset);
  const nowLocal = toLocalTime(new Date(), offset);
  
  const localDay = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const todayDay = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate()));
  
  const diff = (localDay.getTime() - todayDay.getTime()) / (24 * 60 * 60 * 1000);
  
  if (diff === 0) return "اليوم";
  if (diff === 1) return "غدًا";
  if (diff === -1) return "أمس";
  
  const d = local.getUTCDate().toString().padStart(2, "0");
  const mo = (local.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${d}/${mo}`;
}
