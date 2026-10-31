"use client";

import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "channels"; country?: string; category?: string }
  | { name: "matches"; tab?: string }
  | { name: "movies" }
  | { name: "favorites" }
  | { name: "more" }
  | { name: "player"; channelId: string }
  | { name: "match-player"; matchId: string }
  | { name: "movie-player"; movieId: string }
  | { name: "tournaments" }
  | { name: "tournament"; id: string }
  | { name: "search"; q?: string }
  | { name: "admin" };

interface NavState {
  view: View;
  history: View[];
  setView: (v: View) => void;
  back: () => void;
  canBack: () => boolean;
}

export const useNav = create<NavState>((set, get) => ({
  view: { name: "home" },
  history: [],
  setView: (v) =>
    set((s) => ({ view: v, history: [...s.history, s.view].slice(-30) })),
  back: () => {
    const h = [...get().history];
    if (h.length === 0) {
      set({ view: { name: "home" }, history: [] });
      return;
    }
    const prev = h.pop()!;
    set({ view: prev, history: h });
  },
  canBack: () => get().history.length > 0,
}));
