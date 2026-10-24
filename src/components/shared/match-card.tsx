"use client";

import * as React from "react";
import { Star, Radio, MapPin } from "lucide-react";
import type { Match } from "@/lib/types";
import { useFavorites } from "@/stores/favorites";
import { useNav } from "@/stores/nav";
import { formatTime, dayLabel, statusLabel, useCountdown } from "@/lib/datetime";
import { imgUrl } from "@/lib/img";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function MatchCard({ match, featured = false }: { match: Match; featured?: boolean }) {
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const setView = useNav((s) => s.setView);
  const fav = has("match", match.id);
  const live = match.status === "live";
  const finished = match.status === "finished";
  const cd = useCountdown(match.kickoff);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-2.5 shadow-sm transition-all hover:shadow-md",
        featured ? "border-gold/40 ring-1 ring-gold/20" : "border-border",
        live && "ring-1 ring-emerald/40",
      )}
    >
      {/* Row 1: tournament + status (compact single line) */}
      <div className="mb-2 flex items-center justify-between gap-1.5">
        <span className="truncate text-[10px] font-bold text-emerald">
          {match.tournamentName ?? match.tournament?.nameAr ?? "بطولة"}
        </span>
        {live ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald px-1.5 py-0.5 text-[9px] font-bold text-white">
            <span className="h-1 w-1 rounded-full bg-white live-dot" />
            {statusLabel(match.status)}
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              finished ? "bg-muted text-muted-foreground" : "bg-secondary text-emerald",
            )}
          >
            {statusLabel(match.status)}
          </span>
        )}
      </div>

      {/* Row 2: teams + score/time (single row, compact) */}
      <div className="flex items-center justify-between gap-1.5">
        <TeamCol name={match.homeName} logo={match.homeLogo} />
        <div className="flex shrink-0 flex-col items-center">
          {finished || live ? (
            <div className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-0.5 text-sm font-extrabold text-emerald-dark">
              <span>{match.homeScore ?? 0}</span>
              <span className="text-[10px] text-muted-foreground">-</span>
              <span>{match.awayScore ?? 0}</span>
            </div>
          ) : (
            <span className="text-sm font-extrabold text-emerald">{formatTime(match.kickoff)}</span>
          )}
          <span className="mt-0.5 text-[8px] text-muted-foreground">{dayLabel(match.kickoff)}</span>
        </div>
        <TeamCol name={match.awayName} logo={match.awayLogo} />
      </div>

      {/* Row 3: countdown for featured upcoming (compact) */}
      {featured && !live && !finished && !cd.done && (
        <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-gradient-to-l from-emerald to-emerald-light px-1.5 py-1 text-white">
          <span className="text-[9px] font-semibold">انطلاق خلال</span>
          <CountdownChip v={cd.days} l="ي" />
          <CountdownChip v={cd.hours} l="س" />
          <CountdownChip v={cd.minutes} l="د" />
          <CountdownChip v={cd.seconds} l="ث" />
        </div>
      )}

      {/* Row 4: meta (stadium + channel) + actions (watch + fav) — merged into one compact row */}
      <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-border pt-1.5">
        {/* Left: stadium + channel (compact) */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {match.stadium && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[90px]">{match.stadium}</span>
            </span>
          )}
          {match.channel ? (
            <span className="flex items-center gap-0.5 text-[9px]">
              <Radio className="h-2.5 w-2.5 shrink-0 text-gold" />
              <span className="truncate font-bold text-emerald">
                {match.channel.nameAr ?? match.channel.name}
              </span>
            </span>
          ) : (
            <span className="text-[9px] text-muted-foreground">قناة غير محددة</span>
          )}
        </div>

        {/* Right: actions (compact) */}
        <div className="flex shrink-0 items-center gap-1">
          {match.channel && (
            <button
              onClick={() => setView({ name: "player", channelId: match.channel!.id })}
              className="rounded-lg bg-emerald px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-emerald-dark"
            >
              مشاهدة
            </button>
          )}
          <button
            onClick={() => {
              toggle("match", match.id);
              toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
              fav
                ? "border-gold bg-gold text-white"
                : "border-border text-muted-foreground hover:text-gold",
            )}
            aria-label="إضافة للمفضلة"
          >
            <Star className="h-3.5 w-3.5" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Brand watermark — minimal */}
      <div className="mt-1.5 flex items-center justify-center gap-1">
        <span className="h-px flex-1 bg-border/50" />
        <span className="gold-text text-[8px] font-extrabold tracking-wide">WazaNI TV</span>
        <span className="h-px flex-1 bg-border/50" />
      </div>
    </div>
  );
}

function TeamCol({ name, logo }: { name: string; logo?: string | null }) {
  const [err, setErr] = React.useState(false);
  const [retry, setRetry] = React.useState(0);

  // إعادة تعيين حالة الخطأ عندما يتغير logo
  React.useEffect(() => {
    setErr(false);
    setRetry(0);
  }, [logo]);

  const resolvedSrc = React.useMemo(() => {
    if (!logo) return undefined;
    const base = imgUrl(logo);
    if (!base) return undefined;
    if (retry > 0 && base.startsWith("/api/img?url=")) {
      return `${base}&retry=${retry}`;
    }
    return base;
  }, [logo, retry]);

  const handleError = () => {
    if (retry < 1) setRetry((r) => r + 1);
    else setErr(true);
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border">
        {logo && !err ? (
          <img
            key={retry}
            src={resolvedSrc}
            alt={name}
            referrerPolicy="no-referrer"
            onError={handleError}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold text-emerald">{name.slice(0, 1)}</span>
        )}
      </div>
      <span className="line-clamp-1 max-w-[72px] text-[10px] font-bold leading-tight text-foreground">
        {name}
      </span>
    </div>
  );
}

function CountdownChip({ v, l }: { v: number; l: string }) {
  return (
    <span className="flex items-baseline gap-0.5 rounded bg-white/20 px-1 py-0.5 text-[10px] font-bold tabular-nums">
      {String(v).padStart(2, "0")}
      <span className="text-[7px] opacity-80">{l}</span>
    </span>
  );
}
