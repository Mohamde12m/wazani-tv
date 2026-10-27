"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Star,
  MonitorOff,
  Tv,
  Radio,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { useWatchHistory } from "@/stores/watch-history";
import { ChannelLogo } from "@/components/shared/channel-logo";
import { ChannelCard } from "@/components/shared/channel-card";
import {
  SectionHeader,
  EmptyState,
} from "@/components/shared/section";
import type { Channel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// استخدم dynamic import مع ssr:false لأن hls.js يحتاج window/document
const StreamPlayer = dynamic(
  () =>
    import("@/components/shared/stream-player").then((m) => ({
      default: m.StreamPlayer,
    })),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-emerald-dark" /> },
);

type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "iframe" | "none";

interface ChannelsResponse {
  channels: Channel[];
}

export function PlayerView({ channelId }: { channelId: string }) {
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const addToHistory = useWatchHistory((s) => s.add);
  const { data, loading } = useFetch<ChannelsResponse>("/api/channels");

  const channels = data?.channels ?? [];
  const channel = React.useMemo(
    () => channels.find((c) => c.id === channelId) ?? null,
    [channels, channelId],
  );

  // سجّل القناة في سجل المشاهدة عند فتحها
  React.useEffect(() => {
    if (channel) {
      addToHistory(channel);
    }
  }, [channel, addToHistory]);

  const fav = channel ? has("channel", channel.id) : false;

  const suggestions = React.useMemo(() => {
    if (!channel) return [];
    const cat = channel.category?.slug;
    return channels
      .filter((c) => c.id !== channel.id && c.category?.slug === cat)
      .slice(0, 12);
  }, [channels, channel]);

  if (loading || !channel) {
    return (
      <div>
        <div className="aspect-video w-full bg-emerald-dark" />
        <div className="space-y-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="shimmer h-12 w-12 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-4 w-1/3 rounded bg-muted" />
              <div className="shimmer h-3 w-1/4 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const available = !!channel.streamUrl && channel.streamType !== "none";
  const streamKind: StreamKind = (channel.streamType as StreamKind) ?? "none";

  return (
    <div>
      {/* Full-width video player (hls.js) */}
      <div className="relative">
        <StreamPlayer
          key={`player-${channel.id}`}
          src={available ? channel.streamUrl : null}
          kind={available ? streamKind : "none"}
          poster={channel.logo}
          autoplay
          reloadNonce={0}
        />
        {/* عندما لا يوجد بث، أظهر الشعار كبيرًا في وسط المشغل */}
        {!available && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-dark/90">
            <ChannelLogo
              src={channel.logo}
              name={channel.nameAr ?? channel.name}
              size={96}
              className="!rounded-2xl shadow-2xl"
            />
            <span className="text-sm font-bold text-white/90 drop-shadow">
              {channel.nameAr ?? channel.name}
            </span>
          </div>
        )}
      </div>

      {/* Padded content below the player */}
      <div className="space-y-4 px-4 py-4">
        {/* Channel info bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <ChannelLogo
            src={channel.logo}
            name={channel.nameAr ?? channel.name}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-extrabold text-foreground">
                {channel.nameAr ?? channel.name}
              </h2>
              {channel.verified && (
                <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                  موثّقة
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {channel.country?.name ?? "عربية"} · {channel.category?.name ?? "عامة"}
            </p>
          </div>
          <button
            onClick={async () => {
              await toggle("channel", channel.id);
              toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
            }}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95",
              fav
                ? "border-gold bg-gold text-white"
                : "border-border bg-card text-muted-foreground hover:text-gold",
            )}
            aria-label={fav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          >
            <Star className="h-5 w-5" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Unavailable notice */}
        {!available && (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
            <MonitorOff className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="leading-relaxed">
              لا تتوفر حالياً أي مصادر بث رسمية موثّقة لهذه القناة. WazaNI
              TV تلتزم بعرض المحتوى المرخّص فقط، ويعمل على إضافة المزيد من
              القنوات التي تملك حقوق البث الرسمية باستمرار.
            </p>
          </div>
        )}

        {/* Suggestions — same category */}
        <div>
          <SectionHeader
            title="القنوات المقترحة"
            icon={<Radio className="h-5 w-5" />}
          />
          {suggestions.length === 0 ? (
            <EmptyState
              title="لا توجد قنوات مقترحة في نفس الفئة"
              icon={<Tv className="h-6 w-6" />}
            />
          ) : (
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {suggestions.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
