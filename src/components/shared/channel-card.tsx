"use client";

import * as React from "react";
import { Play, Star, BadgeCheck } from "lucide-react";
import type { Channel } from "@/lib/types";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { ChannelLogo } from "./channel-logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ChannelCard({ channel }: { channel: Channel }) {
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const fav = has("channel", channel.id);

  const available = !!channel.streamUrl && channel.streamType !== "none";

  return (
    <button
      onClick={() => setView({ name: "player", channelId: channel.id })}
      className="group relative flex w-[150px] shrink-0 flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative">
        <ChannelLogo src={channel.logo} name={channel.nameAr ?? channel.name} size={128} className="mx-auto !rounded-xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-dark/0 opacity-0 transition-all group-hover:bg-emerald-dark/30 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-white shadow-lg">
            <Play className="h-5 w-5 translate-x-[-1px]" fill="currentColor" />
          </span>
        </span>
        {channel.verified && (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white ring-2 ring-card">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
        )}
        {available ? (
          <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-emerald px-1.5 py-0.5 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
            متاح
          </span>
        ) : (
          <span className="absolute bottom-1 right-1 rounded-full bg-muted-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            غير متاح
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{channel.nameAr ?? channel.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {channel.country?.name ?? "عربية"} · {channel.category?.name ?? "عامة"}
        </p>
      </div>
      <span
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          toggle("channel", channel.id);
          toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
        }}
        className={cn(
          "absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-card transition-all",
          fav ? "bg-gold text-white" : "bg-card text-muted-foreground hover:text-gold border border-border",
        )}
      >
        <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
      </span>
    </button>
  );
}
