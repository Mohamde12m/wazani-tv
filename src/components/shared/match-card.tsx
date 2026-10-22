"use client";

import * as React from "react";
import { Star, Radio, MapPin } from "lucide-react";
import type { Match } from "@/lib/types";
import { useFavorites } from "@/stores/favorites";
import { useNav } from "@/stores/nav";
import { formatTime, dayLabel, statusLabel, useCountdown } from "@/lib/datetime";
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
        "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        featured ? "border-gold/40 ring-1 ring-gold/20" : "border-border",
        live && "ring-1 ring-emerald/40",
      )}
    >
      {/* top row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate font-semibold text-emerald">{match.tournamentName ?? match.tournament?.nameAr ?? "بطولة"}</span>
        </div>
        {live ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
            {statusLabel(match.status)}
          </span>
        ) : (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", finished ? "bg-muted text-muted-foreground" : "bg-secondary text-emerald")}>
            {statusLabel(match.status)}
          </span>
        )}
      </div>

      {/* teams */}
      <div className="flex items-center justify-between gap-2">
        <TeamCol name={match.homeName} logo={match.homeLogo} />
        <div className="flex flex-col items-center px-1">
          {finished || live ? (
            <div className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-lg font-extrabold text-emerald-dark">
              <span>{match.homeScore ?? 0}</span>
              <span className="text-muted-foreground">-</span>
              <span>{match.awayScore ?? 0}</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-base font-extrabold text-emerald">{formatTime(match.kickoff)}</div>
            </div>
          )}
          <div className="mt-1 text-[10px] text-muted-foreground">{dayLabel(match.kickoff)}</div>
        </div>
        <TeamCol name={match.awayName} logo={match.awayLogo} />
      </div>

      {/* meta */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          {match.stadium && (
            <>
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[110px]">{match.stadium}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {match.channel ? (
            <>
              <Radio className="h-3 w-3 text-gold" />
              <span className="font-semibold text-emerald">{match.channel.nameAr ?? match.channel.name}</span>
            </>
          ) : (
            <span>قناة ناقلة غير محددة</span>
          )}
        </div>
      </div>

      {/* countdown for featured upcoming */}
      {featured && !live && !finished && !cd.done && (
        <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-emerald to-emerald-light px-2 py-1.5 text-white">
          <span className="text-[10px] font-semibold">انطلاق خلال</span>
          <CountdownChip v={cd.days} l="ي" />
          <CountdownChip v={cd.hours} l="س" />
          <CountdownChip v={cd.minutes} l="د" />
          <CountdownChip v={cd.seconds} l="ث" />
        </div>
      )}

      {/* actions */}
      <div className="mt-3 flex items-center gap-2">
        {match.channel && (
          <button
            onClick={() => setView({ name: "player", channelId: match.channel!.id })}
            className="flex-1 rounded-xl bg-emerald px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-dark"
          >
            مشاهدة القناة
          </button>
        )}
        <button
          onClick={() => {
            toggle("match", match.id);
            toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
            fav ? "border-gold bg-gold text-white" : "border-border text-muted-foreground hover:text-gold",
          )}
          aria-label="إضافة للمفضلة"
        >
          <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Brand watermark — replaces the old "بيانات تجريبية" ribbon */}
      <div className="mt-3 flex items-center justify-center gap-1.5 pt-1">
        <span className="h-px flex-1 bg-border/60" />
        <span className="gold-text text-[9px] font-extrabold tracking-wide">
          ArabVision TV
        </span>
        <span className="h-px flex-1 bg-border/60" />
      </div>
    </div>
  );
}

function TeamCol({ name, logo }: { name: string; logo?: string | null }) {
  const [err, setErr] = React.useState(false);
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-secondary ring-1 ring-border">
        {logo && !err ? (
           
          <img src={logo} alt={name} onError={() => setErr(true)} className="h-full w-full object-cover" />
        ) : (
          <span className="text-base font-bold text-emerald">{name.slice(0, 1)}</span>
        )}
      </div>
      <span className="line-clamp-2 text-xs font-bold leading-tight text-foreground">{name}</span>
    </div>
  );
}

function CountdownChip({ v, l }: { v: number; l: string }) {
  return (
    <span className="flex items-baseline gap-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-bold tabular-nums">
      {String(v).padStart(2, "0")}
      <span className="text-[9px] opacity-80">{l}</span>
    </span>
  );
}
