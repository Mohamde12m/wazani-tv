"use client";

import * as React from "react";
import { Star, Trash2, Trophy, Tv, CalendarDays, ShieldCheck } from "lucide-react";
import { ChannelCard } from "@/components/shared/channel-card";
import { MatchCard } from "@/components/shared/match-card";
import { EmptyState, LoadingGrid } from "@/components/shared/section";
import { AdSlot } from "@/components/shared/ad-slot";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFetch } from "@/hooks/use-fetch";
import { useFavorites, type FavKind } from "@/stores/favorites";
import { toast } from "sonner";
import type { Channel, Match } from "@/lib/types";

export function FavoritesView() {
  const favorites = useFavorites((s) => s.favorites);
  const favLoaded = useFavorites((s) => s.loaded);
  const toggle = useFavorites((s) => s.toggle);

  const channelsRes = useFetch<{ channels: Channel[] }>("/api/channels");
  const matchesRes = useFetch<{ matches: Match[] }>("/api/matches");

  const channels = channelsRes.data?.channels ?? [];
  const matches = matchesRes.data?.matches ?? [];

  const channelIds = React.useMemo(
    () => new Set(favorites.filter((f) => f.kind === "channel").map((f) => f.refId)),
    [favorites],
  );
  const matchIds = React.useMemo(
    () => new Set(favorites.filter((f) => f.kind === "match").map((f) => f.refId)),
    [favorites],
  );
  const otherFavs = React.useMemo(
    () => favorites.filter((f) => f.kind === "tournament" || f.kind === "team"),
    [favorites],
  );

  const favChannels = React.useMemo(
    () => channels.filter((c) => channelIds.has(c.id)),
    [channels, channelIds],
  );
  const favMatches = React.useMemo(
    () => matches.filter((m) => matchIds.has(m.id)),
    [matches, matchIds],
  );

  const loading = !favLoaded || channelsRes.loading || matchesRes.loading;

  const removeOther = async (kind: FavKind, refId: string) => {
    await toggle(kind, refId);
    toast.success("أُزيلت من المفضلة");
  };

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-light text-white shadow-md">
            <Star className="h-5 w-5" fill="currentColor" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold leading-tight text-foreground">المفضلة</h1>
            <p className="text-[11px] text-muted-foreground">قنواتك ومبارياتك المفضلة في مكان واحد</p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-emerald">
          {favorites.length} عنصر
        </span>
      </div>

      <Tabs defaultValue="channels" className="w-full" dir="rtl">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-secondary p-1">
          <TabsTrigger value="channels" className="flex flex-col items-center gap-0.5 rounded-xl py-2">
            <Tv className="h-4 w-4" />
            <span className="text-[11px] font-bold">القنوات</span>
            <span className="rounded-full bg-emerald/10 px-1.5 text-[10px] font-bold text-emerald">
              {favChannels.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex flex-col items-center gap-0.5 rounded-xl py-2">
            <Trophy className="h-4 w-4" />
            <span className="text-[11px] font-bold">المباريات</span>
            <span className="rounded-full bg-emerald/10 px-1.5 text-[10px] font-bold text-emerald">
              {favMatches.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="other" className="flex flex-col items-center gap-0.5 rounded-xl py-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-[11px] font-bold">البطولات والفرق</span>
            <span className="rounded-full bg-emerald/10 px-1.5 text-[10px] font-bold text-emerald">
              {otherFavs.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* إعلان أعلى المفضلة — بعد التبويبات */}
        <AdSlot slot="favorites_top" className="mt-4" />

        {/* Channels tab */}
        <TabsContent value="channels" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} className="grid-cols-2 sm:grid-cols-3" />
          ) : favChannels.length === 0 ? (
            <EmptyState
              title="لم تقم بإضافة أي قناة إلى المفضلة بعد"
              subtitle="تصفح القنوات واضغط على نجمة القناة لإضافتها هنا"
              icon={<Tv className="h-6 w-6" />}
            />
          ) : (
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {favChannels.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Matches tab */}
        <TabsContent value="matches" className="mt-4">
          {loading ? (
            <LoadingGrid count={3} className="grid-cols-1 sm:grid-cols-2" />
          ) : favMatches.length === 0 ? (
            <EmptyState
              title="لا توجد مباريات في مفضلتك"
              subtitle="تصفح جدول المباريات واضغط على نجمة المباراة لإضافتها هنا"
              icon={<Trophy className="h-6 w-6" />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {favMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tournaments & teams tab */}
        <TabsContent value="other" className="mt-4">
          {otherFavs.length === 0 ? (
            <EmptyState
              title="لا توجد بطولات أو فرق في مفضلتك"
              subtitle="سيتم عرض البطولات والفرق التي تتابعها هنا"
              icon={<CalendarDays className="h-6 w-6" />}
            />
          ) : (
            <div className="space-y-2">
              {otherFavs.map((f) => (
                <div
                  key={`${f.kind}-${f.refId}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    {f.kind === "tournament" ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {f.kind === "tournament" ? "بطولة" : "فريق"}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                      {f.refId}
                    </p>
                  </div>
                  <button
                    onClick={() => removeOther(f.kind, f.refId)}
                    aria-label="إزالة من المفضلة"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
