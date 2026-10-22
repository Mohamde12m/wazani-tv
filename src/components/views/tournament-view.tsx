"use client";

import * as React from "react";
import { Trophy, Star, CalendarDays, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/shared/match-card";
import { EmptyState, LoadingGrid } from "@/components/shared/section";
import { useFetch } from "@/hooks/use-fetch";
import { useFavorites } from "@/stores/favorites";
import { dayLabel } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Match, Tournament, Team } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  league: "دوري",
  cup: "كأس",
  international: "دولي",
};

export function TournamentView({ id }: { id: string }) {
  const [tab, setTab] = React.useState<"matches" | "teams">("matches");

  const { data: tData, loading: tLoading } = useFetch<{ tournaments: Tournament[] }>(
    "/api/tournaments",
  );
  const { data: mData, loading: mLoading } = useFetch<{ matches: Match[] }>(
    "/api/matches",
  );
  const { data: teamsData, loading: teamsLoading } = useFetch<{ teams: Team[] }>(
    `/api/teams?tournamentId=${encodeURIComponent(id)}`,
  );

  const tournament = tData?.tournaments.find((t) => t.id === id);
  const matches = React.useMemo(
    () => (mData?.matches ?? []).filter((m) => m.tournamentId === id),
    [mData, id],
  );
  const teams = teamsData?.teams ?? [];

  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const fav = has("tournament", id);

  const headerLoading = tLoading && !tournament;

  // Group matches by date
  const grouped = React.useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const d = new Date(m.kickoff);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    const groups = Array.from(map, ([key, ms]) => ({
      key,
      label: dayLabel(ms[0].kickoff),
      matches: ms,
    }));
    groups.sort(
      (a, b) =>
        new Date(a.matches[0].kickoff).getTime() -
        new Date(b.matches[0].kickoff).getTime(),
    );
    return groups;
  }, [matches]);

  return (
    <div className="space-y-4 px-4 py-4">
      {headerLoading ? (
        <div className="space-y-4">
          <div className="shimmer h-32 rounded-2xl bg-muted" />
          <LoadingGrid count={4} />
        </div>
      ) : !tournament ? (
        <EmptyState
          title="البطولة غير موجودة"
          subtitle="ربما تم حذفها أو أن المعرف غير صحيح"
          icon={<Trophy className="h-6 w-6" />}
        />
      ) : (
        <>
          {/* Header */}
          <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-l from-emerald/5 to-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <TournamentLogo
                src={tournament.logo}
                name={tournament.nameAr ?? tournament.name}
                size={72}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-foreground">
                      {tournament.nameAr ?? tournament.name}
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {tournament.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      toggle("tournament", id);
                      toast.success(
                        fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة",
                      );
                    }}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      fav
                        ? "border-gold bg-gold text-white"
                        : "border-border text-muted-foreground hover:text-gold",
                    )}
                    aria-label="إضافة للمفضلة"
                  >
                    <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  {tournament.country && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-emerald">
                      {tournament.country}
                    </span>
                  )}
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">
                    {TYPE_LABEL[tournament.type] ?? "دوري"}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {tournament._count?.matches ?? matches.length} مباراة
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {tournament._count?.teams ?? teams.length} فريق
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "matches" | "teams")}
            className="gap-3"
          >
            <TabsList className="no-scrollbar h-auto w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
              <TabsTrigger
                value="matches"
                className="flex-none gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-bold data-[state=active]:border-emerald data-[state=active]:bg-emerald data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                المباريات ({matches.length})
              </TabsTrigger>
              <TabsTrigger
                value="teams"
                className="flex-none gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-bold data-[state=active]:border-emerald data-[state=active]:bg-emerald data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                الفرق ({teams.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tab content */}
          {tab === "matches" ? (
            <>
              {mLoading ? (
                <LoadingGrid count={4} />
              ) : matches.length === 0 ? (
                <EmptyState
                  title="لا توجد مباريات لهذه البطولة حاليًا"
                  subtitle="عُد لاحقًا لمتابعة الجدول الجديد"
                  icon={<Trophy className="h-6 w-6" />}
                />
              ) : (
                <div className="space-y-4">
                  {grouped.map((g) => (
                    <div key={g.key} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                        <h3 className="text-xs font-bold text-emerald">
                          {g.label}
                        </h3>
                        <span className="text-[10px] text-muted-foreground">
                          ({g.matches.length})
                        </span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {g.matches.map((m) => (
                          <MatchCard key={m.id} match={m} featured={m.featured} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {teamsLoading ? (
                <LoadingGrid
                  count={6}
                  className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                />
              ) : teams.length === 0 ? (
                <EmptyState
                  title="لا توجد فرق مسجلة لهذه البطولة"
                  icon={<Users className="h-6 w-6" />}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {teams.map((t) => (
                    <TeamCard key={t.id} team={t} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TournamentLogo({
  src,
  name,
  size,
}: {
  src?: string | null;
  name: string;
  size: number;
}) {
  const [err, setErr] = React.useState(false);
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-light/20 to-emerald/10 ring-1 ring-border"
      style={{ width: size, height: size }}
    >
      {src && !err ? (
         
        <img
          src={src}
          alt={name}
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-bold text-emerald"
          style={{ fontSize: size * 0.32 }}
        >
          {name.slice(0, 1)}
        </span>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  const [err, setErr] = React.useState(false);
  const name = team.nameAr ?? team.name;
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-sm transition-all hover:border-emerald/30 hover:shadow-md">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-light/20 to-emerald/10 ring-1 ring-border">
        {team.logo && !err ? (
           
          <img
            src={team.logo}
            alt={name}
            onError={() => setErr(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-emerald">
            {name.slice(0, 1)}
          </span>
        )}
      </div>
      <p className="line-clamp-2 min-h-[2.4em] text-xs font-bold leading-tight text-foreground">
        {name}
      </p>
    </div>
  );
}
