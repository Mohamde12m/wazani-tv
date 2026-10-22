"use client";

import { create } from "zustand";

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

interface AdminState {
  admin: AdminUser | null;
  loading: boolean;
  load: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAdmin = create<AdminState>((set) => ({
  admin: null,
  loading: true,
  load: async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      set({ admin: data.admin, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? "فشل تسجيل الدخول" };
      set({ admin: data.admin });
      return { ok: true };
    } catch {
      return { ok: false, error: "تعذّر الاتصال بالخادم" };
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ admin: null });
  },
}));
