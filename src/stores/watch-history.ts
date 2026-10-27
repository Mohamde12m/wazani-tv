"use client";

import { create } from "zustand";
import type { Channel } from "@/lib/types";

/**
 * سجل المشاهدة — يخزن آخر 10 قنوات شاهدها المستخدم.
 * - يُخزّن في localStorage (يحفظ بين الجلسات)
 * - عند فتح قناة، تُضاف لأعلى السجل
 * - لو فتح نفس القناة مرة أخرى، تنتقل لأعلى السجل (لا تكرار)
 * - يعرض في الصفحة الرئيسية للوصول السريع
 */

const STORAGE_KEY = "wazani_watch_history";
const MAX_ITEMS = 10;

export interface WatchHistoryItem {
  id: string;
  name: string;
  nameAr?: string | null;
  logo?: string | null;
  country?: { name: string } | null;
  category?: { name: string } | null;
  watchedAt: number; // timestamp
}

interface WatchHistoryState {
  items: WatchHistoryItem[];
  loaded: boolean;
  load: () => void;
  add: (channel: Channel) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useWatchHistory = create<WatchHistoryState>((set, get) => ({
  items: [],
  loaded: false,

  load: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      set({ items, loaded: true });
    } catch {
      set({ items: [], loaded: true });
    }
  },

  add: (channel: Channel) => {
    if (typeof window === "undefined") return;
    const newItem: WatchHistoryItem = {
      id: channel.id,
      name: channel.name,
      nameAr: channel.nameAr,
      logo: channel.logo,
      country: channel.country,
      category: channel.category,
      watchedAt: Date.now(),
    };

    const existing = get().items.filter((i) => i.id !== channel.id);
    const updated = [newItem, ...existing].slice(0, MAX_ITEMS);

    set({ items: updated });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      /* noop */
    }
  },

  clear: () => {
    if (typeof window === "undefined") return;
    set({ items: [] });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  },

  has: (id: string) => get().items.some((i) => i.id === id),
}));
