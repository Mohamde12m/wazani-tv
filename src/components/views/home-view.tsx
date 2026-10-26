"use client";

import * as React from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import type { Channel } from "@/lib/types";

interface ChannelsResponse {
  channels: Channel[];
}

/**
 * نسخة مبسطة من HomeView لتشخيص React Error #130.
 * إذا عملت هذه، فالمشكلة في أحد المكونات الفرعية (FeaturedHero, ChannelSection, etc).
 */
export function HomeView() {
  const setView = useNav((s) => s.setView);
  const { data, loading } = useFetch<ChannelsResponse>("/api/channels");
  const channels = data?.channels ?? [];

  return (
    <div className="px-4 py-4">
      <h1 className="text-2xl font-bold text-emerald mb-4">WazaNI TV</h1>
      <p className="text-sm text-muted-foreground mb-6">
        القنوات العربية ومباريات كرة القدم
      </p>

      {loading ? (
        <div className="text-sm text-muted-foreground">جاري التحميل...</div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-bold mb-2">القنوات</h2>
          {channels.slice(0, 20).map((c) => (
            <button
              key={c.id}
              onClick={() => setView({ name: "player", channelId: c.id })}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-right"
            >
              {c.logo && (
                <img
                  src={c.logo.startsWith("http") ? `/api/img?url=${encodeURIComponent(c.logo)}` : c.logo}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="text-sm font-bold">{c.nameAr || c.name}</div>
                <div className="text-xs text-muted-foreground">
                  {c.country?.name || "عربية"} · {c.category?.name || "عامة"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
