"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Star, ChevronLeft, Radio, Loader2 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { formatTime, formatDate, statusLabel } from "@/lib/datetime";
import { toast } from "sonner";
import type { Match } from "@/lib/types";

// StreamPlayer must be loaded client-side only (uses hls.js)
const StreamPlayer = dynamic(
  () =>
    import("@/components/shared/stream-player").then((m) => ({
      default: m.StreamPlayer,
    })),
  {
    ssr: false,
    loading: () => <div className="aspect-video w-full bg-emerald-dark" />,
  },
);

type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "iframe" | "none";

interface MatchesResponse {
  matches: Match[];
}

/**
 * مشغل مباريات مبسّط — يستخدم رابط البث المضاف من لوحة الإدارة.
 *
 * - يجلب المباراة من API
 * - يستخدم StreamPlayer (hls.js) مع match.streamUrl
 * - يمرر روابط HLS عبر /api/stream proxy لتجاوز CORS/Referer
 */
export function MatchPlayerView({ matchId }: { matchId: string }) {
  const setView = useNav((s) => s.setView);
  const back = useNav((s) => s.back);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const { data, loading } = useFetch<MatchesResponse>("/api/matches");

  const matches = data?.matches ?? [];
  const match = React.useMemo(
    () => matches.find((m) => m.id === matchId),
    [matches, matchId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">المباراة غير موجودة</p>
        <button
          onClick={() => setView({ name: "matches" })}
          className="rounded-lg bg-emerald px-4 py-2 text-sm font-bold text-white"
        >
          العودة للمباريات
        </button>
      </div>
    );
  }

  const available = !!match.streamUrl && match.streamType !== "none";
  const streamKind: StreamKind = (match.streamType as StreamKind) ?? "none";

  // مرّر روابط HLS الخارجية عبر /api/stream لتجاوز CORS/Referer
  const proxiedSrc =
    available && streamKind === "hls" && match.streamUrl?.startsWith("http")
      ? `/api/stream?url=${encodeURIComponent(match.streamUrl)}`
      : match.streamUrl;

  const fav = has("match", match.id);

  return (
    <div>
      {/* Full-width video player */}
      <div className="relative">
        <StreamPlayer
          key={`match-${match.id}`}
          src={available ? proxiedSrc : null}
          kind={available ? streamKind : "none"}
          autoplay
          reloadNonce={0}
        />
        {!available && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-dark/90">
            <Radio className="h-12 w-12 text-white/50" />
            <span className="text-sm font-bold text-white/90">
              لا يتوفر رابط بث لهذه المباراة بعد
            </span>
            <span className="text-xs text-white/60">
              سيتم إضافته قريبًا من لوحة الإدارة
            </span>
          </div>
        )}
      </div>

      {/* Match info bar */}
      <div className="space-y-3 px-4 py-4">
        {/* Back button */}
        <button
          onClick={back}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald"
        >
          <ChevronLeft className="h-4 w-4" />
          رجوع
        </button>

        {/* Match header */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Home team */}
            <div className="flex flex-1 flex-col items-center gap-1">
              {match.homeLogo && (
                <img
                  src={match.homeLogo}
                  alt={match.homeName}
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="truncate text-xs font-bold">{match.homeName}</span>
            </div>

            {/* Score / vs */}
            <div className="flex flex-col items-center gap-1">
              {match.homeScore !== null && match.homeScore !== undefined ? (
                <span className="text-2xl font-extrabold text-emerald">
                  {match.homeScore} - {match.awayScore ?? 0}
                </span>
              ) : (
                <span className="text-lg font-bold text-muted-foreground">VS</span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatTime(match.kickoff)}
              </span>
            </div>

            {/* Away team */}
            <div className="flex flex-1 flex-col items-center gap-1">
              {match.awayLogo && (
                <img
                  src={match.awayLogo}
                  alt={match.awayName}
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="truncate text-xs font-bold">{match.awayName}</span>
            </div>
          </div>

          {/* Favorite button */}
          <button
            onClick={() => {
              toggle("match", match.id);
              toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
            }}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              fav
                ? "border-gold bg-gold text-white"
                : "border-border text-muted-foreground hover:text-gold"
            }`}
            aria-label="إضافة للمفضلة"
          >
            <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Match details */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-lg bg-secondary/50 px-2 py-1 font-semibold text-foreground">
            {match.tournament?.nameAr || match.tournament?.name || match.tournamentName || "—"}
          </span>
          <span className="rounded-lg bg-secondary/50 px-2 py-1">
            {formatDate(match.kickoff)}
          </span>
          <span className="rounded-lg bg-secondary/50 px-2 py-1">
            {statusLabel(match.status)}
          </span>
          {match.broadcaster && (
            <span className="flex items-center gap-1 rounded-lg bg-emerald/10 px-2 py-1 font-bold text-emerald">
              <Radio className="h-3 w-3" />
              {match.broadcaster}
            </span>
          )}
          {match.stadium && (
            <span className="rounded-lg bg-secondary/50 px-2 py-1">
              {match.stadium}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
