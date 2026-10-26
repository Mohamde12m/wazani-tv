"use client";

import * as React from "react";
import {
  CalendarDays,
  Radio,
  CalendarClock,
  CheckCircle2,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchCard } from "@/components/shared/match-card";
import { EmptyState, LoadingGrid } from "@/components/shared/section";
import { AdSlot } from "@/components/shared/ad-slot";
import { useFetch } from "@/hooks/use-fetch";
import { useFavorites } from "@/stores/favorites";
import { isToday, isTomorrow, isSameDay } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/types";

const VALID_TABS = [
  "today",
  "tomorrow",
  "live",
  "upcoming",
  "finished",
  "favorites",
] as const;
type TabKey = (typeof VALID_TABS)[number];

const TAB_DEFS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "today", label: "مباريات اليوم", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: "tomorrow", label: "مباريات الغد", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: "live", label: "المباريات المباشرة", icon: <Radio className="h-3.5 w-3.5" /> },
  { key: "upcoming", label: "المباريات القادمة", icon: <CalendarClock className="h-3.5 w-3.5" /> },
  { key: "finished", label: "المباريات المنتهية", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { key: "favorites", label: "المفضلة", icon: <Star className="h-3.5 w-3.5" /> },
];

const STATUS_CHIPS = [
  { key: "all", label: "الكل" },
  { key: "live", label: "مباشر" },
  { key: "scheduled", label: "مجدولة" },
  { key: "finished", label: "منتهية" },
];

export function MatchesView({ tab }: { tab?: string }) {
  const initialTab: TabKey =
    tab && (VALID_TABS as readonly string[]).includes(tab)
      ? (tab as TabKey)
      : "today";
  const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);

  // Chip filters
  const [fTournament, setFTournament] = React.useState<string>("all");
  const [fCountry, setFCountry] = React.useState<string>("all");
  const [fDate, setFDate] = React.useState<string>("all");
  const [fStatus, setFStatus] = React.useState<string>("all");
  // Which filter group is expanded (compact UI: one group visible at a time)
  const [filterGroup, setFilterGroup] = React.useState<
    "tournament" | "country" | "date" | "status"
  >("tournament");

  const { data, loading } = useFetch<{ matches: Match[] }>("/api/matches");
  const matches = data?.matches ?? [];

  const favorites = useFavorites((s) => s.favorites);
  const favMatchIds = React.useMemo(
    () =>
      new Set(
        favorites.filter((f) => f.kind === "match").map((f) => f.refId),
      ),
    [favorites],
  );

  // Unique tournaments
  const tournaments = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of matches) {
      const id = m.tournamentId ?? "unknown";
      const name =
        m.tournamentName ??
        m.tournament?.nameAr ??
        m.tournament?.name ??
        "بطولة";
      if (!map.has(id)) map.set(id, name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [matches]);

  // Unique countries
  const countries = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      const c = m.tournament?.country;
      if (c) set.add(c);
    }
    return Array.from(set);
  }, [matches]);

  // Date chips: "الكل" + "اليوم" + "غدًا" + next 3 days
  const dateChips = React.useMemo(() => {
    const arr: { key: string; label: string; offset: number | null }[] = [
      { key: "all", label: "الكل", offset: null },
      { key: "today", label: "اليوم", offset: 0 },
      { key: "tomorrow", label: "غدًا", offset: 1 },
    ];
    for (let i = 2; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push({
        key: `d${i}`,
        label: new Intl.DateTimeFormat("ar", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }).format(d),
        offset: i,
      });
    }
    return arr;
  }, []);

  // Filtered + sorted matches
  const filtered = React.useMemo(() => {
    let list = matches;

    // Tab filter
    if (activeTab === "today") {
      list = list.filter((m) => isToday(m.kickoff));
    } else if (activeTab === "tomorrow") {
      list = list.filter((m) => isTomorrow(m.kickoff));
    } else if (activeTab === "live") {
      list = list.filter((m) => m.status === "live");
    } else if (activeTab === "upcoming") {
      const future = list.filter(
        (m) =>
          m.status === "scheduled" &&
          !isToday(m.kickoff) &&
          !isTomorrow(m.kickoff) &&
          new Date(m.kickoff).getTime() > Date.now(),
      );
      // Fallback to all scheduled-not-today/tomorrow if no future matches
      list =
        future.length > 0
          ? future
          : list.filter(
              (m) =>
                m.status === "scheduled" &&
                !isToday(m.kickoff) &&
                !isTomorrow(m.kickoff),
            );
    } else if (activeTab === "finished") {
      list = list.filter((m) => m.status === "finished");
    } else if (activeTab === "favorites") {
      list = list.filter((m) => favMatchIds.has(m.id));
    }

    // Chip: tournament
    if (fTournament !== "all") {
      list = list.filter((m) => (m.tournamentId ?? "unknown") === fTournament);
    }
    // Chip: country
    if (fCountry !== "all") {
      list = list.filter((m) => (m.tournament?.country ?? "") === fCountry);
    }
    // Chip: date
    if (fDate !== "all") {
      const chip = dateChips.find((c) => c.key === fDate);
      if (chip && chip.offset !== null) {
        const target = new Date();
        target.setDate(target.getDate() + chip.offset);
        list = list.filter((m) => isSameDay(new Date(m.kickoff), target));
      }
    }
    // Chip: status
    if (fStatus !== "all") {
      list = list.filter((m) => m.status === fStatus);
    }

    // Sort
    if (activeTab === "finished") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime(),
      );
    } else {
      list = [...list].sort((a, b) => {
        if (a.status === "live" && b.status !== "live") return -1;
        if (b.status === "live" && a.status !== "live") return 1;
        return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
      });
    }
    return list;
  }, [
    matches,
    activeTab,
    favMatchIds,
    fTournament,
    fCountry,
    fDate,
    fStatus,
    dateChips,
  ]);

  const featuredList = filtered.filter((m) => m.featured);
  const restList = filtered.filter((m) => !m.featured);

  return (
    <div className="space-y-4 px-4 py-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="gap-3"
        dir="rtl"
      >
        <TabsList className="no-scrollbar h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {TAB_DEFS.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="flex-none gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-bold data-[state=active]:border-emerald data-[state=active]:bg-emerald data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Compact filter bar: one row of group tabs + one row of chips for the active group */}
        <div className="space-y-2">
          {/* Group selector tabs (single row) */}
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
            <FilterTab
              active={filterGroup === "tournament"}
              label="البطولة"
              hasValue={fTournament !== "all"}
              onClick={() => setFilterGroup("tournament")}
            />
            {countries.length > 0 && (
              <FilterTab
                active={filterGroup === "country"}
                label="الدولة"
                hasValue={fCountry !== "all"}
                onClick={() => setFilterGroup("country")}
              />
            )}
            <FilterTab
              active={filterGroup === "date"}
              label="التاريخ"
              hasValue={fDate !== "all"}
              onClick={() => setFilterGroup("date")}
            />
            <FilterTab
              active={filterGroup === "status"}
              label="الحالة"
              hasValue={fStatus !== "all"}
              onClick={() => setFilterGroup("status")}
            />
          </div>

          {/* Active chips for the selected group (single scrollable row) */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            {filterGroup === "tournament" && (
              <>
                <Chip
                  active={fTournament === "all"}
                  label="الكل"
                  onClick={() => setFTournament("all")}
                />
                {tournaments.map((t) => (
                  <Chip
                    key={t.id}
                    active={fTournament === t.id}
                    label={t.name}
                    onClick={() => setFTournament(t.id)}
                  />
                ))}
              </>
            )}
            {filterGroup === "country" && countries.length > 0 && (
              <>
                <Chip
                  active={fCountry === "all"}
                  label="الكل"
                  onClick={() => setFCountry("all")}
                />
                {countries.map((c) => (
                  <Chip
                    key={c}
                    active={fCountry === c}
                    label={c}
                    onClick={() => setFCountry(c)}
                  />
                ))}
              </>
            )}
            {filterGroup === "date" &&
              dateChips.map((c) => (
                <Chip
                  key={c.key}
                  active={fDate === c.key}
                  label={c.label}
                  onClick={() => setFDate(c.key)}
                />
              ))}
            {filterGroup === "status" &&
              STATUS_CHIPS.map((c) => (
                <Chip
                  key={c.key}
                  active={fStatus === c.key}
                  label={c.label}
                  onClick={() => setFStatus(c.key)}
                />
              ))}
          </div>

          {/* Active filters summary + clear all (only when a filter is set) */}
          {(fTournament !== "all" ||
            fCountry !== "all" ||
            fDate !== "all" ||
            fStatus !== "all") && (
            <button
              onClick={() => {
                setFTournament("all");
                setFCountry("all");
                setFDate("all");
                setFStatus("all");
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-gold"
            >
              <X className="h-3 w-3" />
              مسح كل الفلاتر
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-1">
          {/* إعلان أعى المباريات — بعد الفلاتر */}
          <AdSlot slot="matches_top" />

          {loading ? (
            <LoadingGrid count={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="لا توجد مباريات في هذا القسم حاليًا"
              subtitle="جرّب تغيير الفلاتر أو عُد لاحقًا لمتابعة جديد المباريات"
              icon={<Trophy className="h-6 w-6" />}
            />
          ) : (
            <div className="space-y-3">
              {featuredList.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {featuredList.map((m) => (
                    <MatchCard key={m.id} match={m} featured />
                  ))}
                </div>
              )}
              {/* إعلان وسط المباريات — بين المميزة وبقية المباريات */}
              {featuredList.length > 0 && restList.length > 0 && <AdSlot slot="matches_middle" />}
              {restList.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {restList.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-emerald bg-emerald text-white shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-emerald/40 hover:text-emerald",
      )}
    >
      {label}
    </button>
  );
}

function FilterTab({
  active,
  label,
  hasValue,
  onClick,
}: {
  active: boolean;
  label: string;
  hasValue?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
        active
          ? "bg-emerald text-white shadow-sm"
          : "text-muted-foreground hover:text-emerald",
      )}
    >
      {label}
      {/* Dot indicator when this group has a non-"all" value selected */}
      {hasValue && !active && (
        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      )}
    </button>
  );
}
