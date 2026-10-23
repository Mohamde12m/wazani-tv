"use client";

import { create } from "zustand";

const SESSION_KEY = "avt_session_id";

function getOrCreateSession(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type FavKind = "channel" | "match" | "tournament" | "team";
export interface FavItem {
  kind: FavKind;
  refId: string;
  channel?: { id: string; name: string; nameAr?: string | null; logo?: string | null; country?: { name: string } | null; category?: { name: string } | null };
  match?: { id: string; homeName: string; awayName: string; homeLogo?: string | null; awayLogo?: string | null; tournamentName?: string | null; kickoff: string; status: string; homeScore?: number | null; awayScore?: number | null };
}

interface FavState {
  sessionId: string;
  favorites: FavItem[];
  loaded: boolean;
  load: () => Promise<void>;
  has: (kind: FavKind, refId: string) => boolean;
  toggle: (kind: FavKind, refId: string) => Promise<void>;
  setFavorites: (items: FavItem[]) => void;
}

export const useFavorites = create<FavState>((set, get) => ({
  sessionId: "",
  favorites: [],
  loaded: false,
  load: async () => {
    const sessionId = getOrCreateSession();
    set({ sessionId });
    try {
      const res = await fetch(`/api/favorites?sessionId=${sessionId}`);
      const data = await res.json();
      set({ favorites: data.favorites ?? [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  has: (kind, refId) => get().favorites.some((f) => f.kind === kind && f.refId === refId),
  setFavorites: (items) => set({ favorites: items }),
  toggle: async (kind, refId) => {
    const sessionId = get().sessionId || getOrCreateSession();
    set({ sessionId });
    const exists = get().has(kind, refId);
    if (exists) {
      set((s) => ({ favorites: s.favorites.filter((f) => !(f.kind === kind && f.refId === refId)) }));
      await fetch(`/api/favorites?sessionId=${sessionId}&kind=${kind}&refId=${refId}`, { method: "DELETE" });
    } else {
      set((s) => ({ favorites: [...s.favorites, { kind, refId }] }));
      await fetch(`/api/favorites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, kind, refId }),
      });
      await get().load();
    }
  },
}));
