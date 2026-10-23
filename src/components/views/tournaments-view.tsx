"use client";

import * as React from "react";
import { Trophy, Users, CalendarDays } from "lucide-react";
import { SectionHeader, EmptyState, LoadingGrid } from "@/components/shared/section";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/img";
import type { Tournament } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  league: "دوري",
  cup: "كأس",
  international: "دولي",
};

const TYPE_CLASS: Record<string, string> = {
  league: "bg-emerald/10 text-emerald",
  cup: "bg-gold/15 text-gold",
  international: "bg-emerald-light/15 text-emerald-light",
};

export function TournamentsView() {
  const { data, loading } = useFetch<{ tournaments: Tournament[] }>(
    "/api/tournaments",
  );
  const setView = useNav((s) => s.setView);
  const tournaments = data?.tournaments ?? [];

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="space-y-1">
        <SectionHeader
          title="البطولات الرياضية"
          icon={<Trophy className="h-5 w-5" />}
        />
        <p className="-mt-2 px-1 text-xs text-muted-foreground">
          تصفّح أهم البطولات المحلية والعالمية وتابع آخر المباريات والفرق
        </p>
      </div>

      {loading ? (
        <LoadingGrid
          count={8}
          className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        />
      ) : tournaments.length === 0 ? (
        <EmptyState
          title="لا توجد بطولات متاحة حاليًا"
          subtitle="عُد لاحقًا لمتابعة جديد البطولات"
          icon={<Trophy className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onClick={() => setView({ name: "tournament", id: t.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TournamentCard({
  tournament,
  onClick,
}: {
  tournament: Tournament;
  onClick: () => void;
}) {
  const [err, setErr] = React.useState(false);
  const type = tournament.type ?? "league";
  const matchCount = tournament._count?.matches ?? 0;
  const teamCount = tournament._count?.teams ?? 0;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald/30 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-light/20 to-emerald/10 ring-1 ring-border">
        {tournament.logo && !err ? (
           
          <img
            src={imgUrl(tournament.logo)}
            alt={tournament.nameAr ?? tournament.name}
            onError={() => setErr(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-emerald">
            {(tournament.nameAr ?? tournament.name).slice(0, 1)}
          </span>
        )}
      </div>

      <p className="line-clamp-2 min-h-[2.4em] text-xs font-bold leading-tight text-foreground">
        {tournament.nameAr ?? tournament.name}
      </p>

      {tournament.country && (
        <p className="text-[11px] text-muted-foreground">{tournament.country}</p>
      )}

      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          TYPE_CLASS[type] ?? TYPE_CLASS.league,
        )}
      >
        {TYPE_LABEL[type] ?? "دوري"}
      </span>

      <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1" title="عدد المباريات">
          <CalendarDays className="h-3 w-3" />
          {matchCount}
        </span>
        <span className="flex items-center gap-1" title="عدد الفرق">
          <Users className="h-3 w-3" />
          {teamCount}
        </span>
      </div>
    </button>
  );
}
