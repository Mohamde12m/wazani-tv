"use client";

import * as React from "react";
import {
  Search,
  Trophy,
  Newspaper,
  Tv,
  Film,
  Moon,
  Globe,
  Radio,
  MapPin,
  ChevronLeft,
  Clock,
  Plus,
  Star,
  Landmark,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChannelCard,
} from "@/components/shared/channel-card";
import { Logo } from "@/components/shared/top-header";
import { AppWordmark } from "@/components/shared/app-wordmark";
import {
  SectionHeader,
  ChannelRow,
  EmptyState,
  LoadingRow,
} from "@/components/shared/section";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { formatTime, dayLabel, useCountdown, isToday } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/img";
import { AdSlot } from "@/components/shared/ad-slot";
import type { Channel, Match } from "@/lib/types";

// Channel with optional createdAt for sorting recent additions
type ChannelWithMeta = Channel & { createdAt?: string };

interface ChannelsResponse {
  channels: ChannelWithMeta[];
  admin: { name: string; role?: string } | null;
}

interface MatchesResponse {
  matches: Match[];
  admin: { name: string } | null;
}

// Country code groups for regional sections
const GULF_CODES = new Set(["SA", "AE", "QA", "KW", "BH", "OM"]);
const LEVANT_CODES = new Set(["JO", "LB", "PS", "SY"]);
const ENTERTAINMENT_SLUGS = new Set(["entertainment", "documentary", "movies"]);

export function HomeView() {
  const setView = useNav((s) => s.setView);

  const { data: channelsData, loading: channelsLoading } =
    useFetch<ChannelsResponse>("/api/channels");
  const { data: matchesData, loading: matchesLoading } =
    useFetch<MatchesResponse>("/api/matches");

  const channels = channelsData?.channels ?? [];
  const matches = matchesData?.matches ?? [];

  // Live + soon-starting matches count → drives the notification badge
  const liveCount = React.useMemo(() => {
    const now = Date.now();
    return matches.filter((m) => {
      if (m.status === "live") return true;
      const t = new Date(m.kickoff).getTime();
      return t > now && t - now < 60 * 60 * 1000; // within 1 hour
    }).length;
  }, [matches]);

  // ---- Derived groupings (memoized) ----
  const {
    featuredChannels,
    sports,
    news,
    entertainment,
    religious,
    moroccan,
    gulf,
    egyptian,
    levant,
    recent,
  } = React.useMemo(() => {
    const featured: Channel[] = [];
    const sp: Channel[] = [];
    const nw: Channel[] = [];
    const ent: Channel[] = [];
    const rel: Channel[] = [];
    const ma: Channel[] = [];
    const gulfList: Channel[] = [];
    const eg: Channel[] = [];
    const levantList: Channel[] = [];

    for (const c of channels) {
      if (c.featured) featured.push(c);
      const slug = c.category?.slug;
      const code = c.country?.code;
      if (slug === "sports") sp.push(c);
      if (slug === "news") nw.push(c);
      if (slug && ENTERTAINMENT_SLUGS.has(slug)) ent.push(c);
      if (slug === "religious") rel.push(c);
      if (code === "MA") ma.push(c);
      if (code && GULF_CODES.has(code)) gulfList.push(c);
      if (code === "EG") eg.push(c);
      if (code && LEVANT_CODES.has(code)) levantList.push(c);
    }

    const recent = [...channels]
      .sort((a, b) => {
        const ad = (a as ChannelWithMeta).createdAt;
        const bd = (b as ChannelWithMeta).createdAt;
        if (ad && bd) return bd.localeCompare(ad);
        // fallback to order desc
        return (b.order ?? 0) - (a.order ?? 0);
      })
      .slice(0, 10);

    return {
      featuredChannels: featured,
      sports: sp,
      news: nw,
      entertainment: ent,
      religious: rel,
      moroccan: ma,
      gulf: gulfList,
      egyptian: eg,
      levant: levantList,
      recent,
    };
  }, [channels]);

  // ---- Featured match selection (live first, else earliest upcoming) ----
  const featuredMatch = React.useMemo(() => {
    const featured = matches.filter((m) => m.featured);
    const liveFeatured = featured.find((m) => m.status === "live");
    if (liveFeatured) return liveFeatured;
    const now = Date.now();
    const upcomingFeatured = featured
      .filter((m) => new Date(m.kickoff).getTime() > now)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];
    if (upcomingFeatured) return upcomingFeatured;
    // fallback: earliest upcoming match overall
    return (
      matches
        .filter((m) => new Date(m.kickoff).getTime() > now)
        .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0]
    );
  }, [matches]);

  // ---- Today's important matches ----
  const todaysMatches = React.useMemo(() => {
    return matches
      .filter((m) => isToday(m.kickoff))
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  }, [matches]);

  return (
    <div>
      {/* ===== App header (sticky) =====
          RTL: brand on the RIGHT (start), search + bell on the LEFT (end) */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2.5">
          {/* Brand block (right side in RTL) — animated logo + animated wordmark */}
          <button
            onClick={() => setView({ name: "home" })}
            className="flex items-center gap-2"
            aria-label="WazaNI TV"
          >
            <Logo size={48} />
            <AppWordmark />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search button (left side) */}
          <button
            onClick={() => setView({ name: "search" })}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-emerald transition-colors hover:bg-secondary/70 active:scale-95"
            aria-label="بحث"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications button (left side) */}
          <button
            onClick={() => setView({ name: "matches", tab: "live" })}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-emerald transition-colors hover:bg-secondary/70 active:scale-95"
            aria-label="التنبيهات"
          >
            <Bell className="h-5 w-5" />
            {liveCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
                {liveCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Page body */}
      <div className="space-y-6 px-4 py-4">
      {/* 1. Compact search trigger */}
      <button
        onClick={() => setView({ name: "search" })}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-right shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
        aria-label="بحث"
      >
        <Search className="h-5 w-5 shrink-0 text-gold" />
        <span className="flex-1 truncate text-sm text-muted-foreground">
          ابحث عن قناة، دولة، أو تصنيف...
        </span>
        <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold text-emerald">
          بحث
        </span>
      </button>

      {/* 2. Featured match hero */}
      {matchesLoading ? (
        <div className="shimmer h-32 rounded-2xl bg-muted" />
      ) : featuredMatch ? (
        <FeaturedHero match={featuredMatch} />
      ) : null}

      {/* إعلان أعلى الصفحة — بعد المباراة المميزة */}
      <AdSlot slot="home_top" />

      {/* 3. Today's important matches */}
      <section>
        <SectionHeader
          title="مباريات اليوم المهمة"
          icon={<Trophy className="h-5 w-5" />}
          action="عرض الكل"
          onAction={() => setView({ name: "matches" })}
        />
        {matchesLoading ? (
          <LoadingRow count={3} />
        ) : todaysMatches.length === 0 ? (
          <EmptyState
            title="لا توجد مباريات اليوم"
            subtitle="تابع كل المباريات القادمة في صفحة المباريات"
            icon={<Trophy className="h-6 w-6" />}
          />
        ) : (
          <ChannelRow>
            {todaysMatches.map((m) => (
              <TodayMatchCard key={m.id} match={m} />
            ))}
          </ChannelRow>
        )}
      </section>

      {/* 4. Most watched (featured channels) */}
      {channelsLoading || featuredChannels.length > 0 ? (
        <section>
          <SectionHeader
            title="القنوات الأكثر مشاهدة"
            icon={<Star className="h-5 w-5" />}
            action="عرض الكل"
            onAction={() => setView({ name: "channels" })}
          />
          {channelsLoading ? (
            <LoadingRow />
          ) : (
            <ChannelRow>
              {featuredChannels.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </ChannelRow>
          )}
        </section>
      ) : null}

      {/* 5. Sports channels */}
      {(channelsLoading || sports.length > 0) && (
        <ChannelSection
          title="القنوات الرياضية"
          icon={<Trophy className="h-5 w-5" />}
          channels={sports}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", category: "sports" })}
        />
      )}

      {/* 6. News channels */}
      {(channelsLoading || news.length > 0) && (
        <ChannelSection
          title="القنوات الإخبارية"
          icon={<Newspaper className="h-5 w-5" />}
          channels={news}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", category: "news" })}
        />
      )}

      {/* 7. Moroccan channels */}
      {(channelsLoading || moroccan.length > 0) && (
        <ChannelSection
          title="القنوات المغربية"
          icon={<Landmark className="h-5 w-5" />}
          channels={moroccan}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", country: "MA" })}
        />
      )}

      {/* إعلان منتصف الصفحة — بين المغربية والخليجية */}
      <AdSlot slot="home_middle" />

      {/* 8. Gulf channels */}
      {(channelsLoading || gulf.length > 0) && (
        <ChannelSection
          title="القنوات الخليجية"
          icon={<Globe className="h-5 w-5" />}
          channels={gulf}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", country: "SA" })}
        />
      )}

      {/* 9. Egyptian channels */}
      {(channelsLoading || egyptian.length > 0) && (
        <ChannelSection
          title="القنوات المصرية"
          icon={<Tv className="h-5 w-5" />}
          channels={egyptian}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", country: "EG" })}
        />
      )}

      {/* 10. Levant channels */}
      {(channelsLoading || levant.length > 0) && (
        <ChannelSection
          title="القنوات الشامية"
          icon={<Globe className="h-5 w-5" />}
          channels={levant}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", country: "JO" })}
        />
      )}

      {/* 11. Entertainment & documentary */}
      {(channelsLoading || entertainment.length > 0) && (
        <ChannelSection
          title="القنوات الترفيهية والوثائقية"
          icon={<Film className="h-5 w-5" />}
          channels={entertainment}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", category: "entertainment" })}
        />
      )}

      {/* 12. Religious channels */}
      {(channelsLoading || religious.length > 0) && (
        <ChannelSection
          title="القنوات الدينية"
          icon={<Moon className="h-5 w-5" />}
          channels={religious}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels", category: "religious" })}
        />
      )}

      {/* 13. Recently added channels */}
      {(channelsLoading || recent.length > 0) && (
        <ChannelSection
          title="آخر القنوات المضافة"
          icon={<Plus className="h-5 w-5" />}
          channels={recent}
          loading={channelsLoading}
          onAll={() => setView({ name: "channels" })}
        />
      )}

      {/* إعلان أسفل الصفحة — قبل التذييل */}
      <AdSlot slot="home_bottom" />

      {/* Footer spacing for bottom nav */}
      <div className="h-2" />
      </div>
    </div>
  );
}

// ============ Compact today match card (horizontal, minimal height) ============
function TodayMatchCard({ match }: { match: Match }) {
  const setView = useNav((s) => s.setView);
  const live = match.status === "live";
  const finished = match.status === "finished";
  const tournamentName =
    match.tournamentName ?? match.tournament?.nameAr ?? match.tournament?.name ?? "بطولة";

  return (
    <button
      onClick={() => setView({ name: "matches" })}
      className={cn(
        "relative w-[210px] shrink-0 overflow-hidden rounded-xl border bg-card p-2.5 text-right shadow-sm transition-all hover:shadow-md active:scale-[0.98]",
        live ? "border-emerald/40 ring-1 ring-emerald/20" : "border-border",
      )}
    >
      {/* Row 1: tournament + status (single line) */}
      <div className="mb-1.5 flex items-center justify-between gap-1.5">
        <span className="truncate text-[10px] font-bold text-emerald">{tournamentName}</span>
        {live ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald px-1.5 py-0.5 text-[8px] font-bold text-white">
            <span className="h-1 w-1 rounded-full bg-white live-dot" />
            مباشر
          </span>
        ) : finished ? (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">
            انتهت
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[8px] font-bold text-emerald">
            {formatTime(match.kickoff)}
          </span>
        )}
      </div>

      {/* Row 2: teams + score/time (single row) */}
      <div className="flex items-center justify-between gap-1.5">
        <TeamMini name={match.homeName} logo={match.homeLogo} />
        <div className="flex shrink-0 flex-col items-center">
          {live || finished ? (
            <div className="flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-sm font-extrabold text-emerald-dark">
              <span>{match.homeScore ?? 0}</span>
              <span className="text-[10px] text-muted-foreground">-</span>
              <span>{match.awayScore ?? 0}</span>
            </div>
          ) : (
            <span className="text-sm font-extrabold text-emerald">{formatTime(match.kickoff)}</span>
          )}
        </div>
        <TeamMini name={match.awayName} logo={match.awayLogo} />
      </div>

      {/* Row 3: channel (single line, optional) */}
      {match.channel && (
        <div className="mt-1.5 flex items-center gap-1 border-t border-border pt-1.5 text-[9px] text-muted-foreground">
          <Radio className="h-2.5 w-2.5 shrink-0 text-gold" />
          <span className="truncate font-semibold text-emerald">
            {match.channel.nameAr ?? match.channel.name}
          </span>
        </div>
      )}
    </button>
  );
}

function TeamMini({ name, logo }: { name: string; logo?: string | null }) {
  const [err, setErr] = React.useState(false);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-secondary p-0.5">
        {logo && !err ? (
          <img
            src={imgUrl(logo)}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setErr(true)}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <span className="text-sm font-extrabold text-emerald">{name.slice(0, 1)}</span>
        )}
      </div>
      <span className="line-clamp-1 max-w-[72px] text-[9px] font-bold leading-tight text-foreground">
        {name}
      </span>
    </div>
  );
}

// ============ Featured Hero ============
function FeaturedHero({ match }: { match: Match }) {
  const setView = useNav((s) => s.setView);
  const live = match.status === "live";
  const finished = match.status === "finished";
  const cd = useCountdown(match.kickoff);
  const upcoming = !live && !finished && !cd.done;

  const tournamentName =
    match.tournamentName ?? match.tournament?.nameAr ?? match.tournament?.name ?? "بطولة";

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-emerald-dark/30 bg-gradient-to-bl from-emerald via-emerald to-emerald-dark px-3 py-2.5 shadow-md"
    >
      {/* Decorative gold glow */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full bg-gold/20 blur-3xl" />

      {/* Top row: tournament + status (compact) */}
      <div className="relative mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 shrink-0 text-gold-light" />
          <span className="truncate text-[11px] font-bold text-white/95">{tournamentName}</span>
        </div>
        {live ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald live-dot" />
            مباشر
          </span>
        ) : finished ? (
          <span className="shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
            انتهت
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(match.kickoff)}
          </span>
        )}
      </div>

      {/* Teams + score in ONE compact row */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <HeroTeam name={match.homeName} logo={match.homeLogo} />
        <div className="flex flex-col items-center">
          {live || finished ? (
            <div className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 backdrop-blur-sm">
              <span className="text-lg font-extrabold tabular-nums text-white">
                {match.homeScore ?? 0}
              </span>
              <span className="text-xs font-bold text-white/60">-</span>
              <span className="text-lg font-extrabold tabular-nums text-white">
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : upcoming ? (
            <div className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 backdrop-blur-sm">
              <HeroCountdownChip v={cd.hours} l="س" />
              <HeroCountdownChip v={cd.minutes} l="د" />
              <HeroCountdownChip v={cd.seconds} l="ث" />
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-lg bg-white/15 px-2 py-1 backdrop-blur-sm">
              <span className="text-sm font-extrabold tabular-nums text-white">
                {formatTime(match.kickoff)}
              </span>
              <span className="text-[8px] font-semibold text-white/80">
                {dayLabel(match.kickoff)}
              </span>
            </div>
          )}
        </div>
        <HeroTeam name={match.awayName} logo={match.awayLogo} />
      </div>

      {/* Bottom row: channel + watch button (single compact line) */}
      <div className="relative mt-2 flex items-center justify-between gap-2 border-t border-white/15 pt-2">
        <div className="flex min-w-0 items-center gap-2 text-[10px] text-white/85">
          {match.channel && (
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3 text-gold-light" />
              <span className="truncate font-bold text-white">
                {match.channel.nameAr ?? match.channel.name}
              </span>
            </span>
          )}
          {match.stadium && (
            <span className="hidden items-center gap-1 sm:flex">
              <MapPin className="h-3 w-3 text-gold-light" />
              <span className="truncate max-w-[100px]">{match.stadium}</span>
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {match.channel && (
            <Button
              onClick={() => setView({ name: "player", channelId: match.channel!.id })}
              size="sm"
              className="h-7 bg-gold px-2.5 text-[11px] font-bold text-white shadow hover:bg-gold/90 hover:text-white"
            >
              <Tv className="ml-1 h-3 w-3" />
              شاهد
            </Button>
          )}
          <Button
            onClick={() => setView({ name: "matches" })}
            size="sm"
            variant="outline"
            className="h-7 border-white/40 bg-white/10 px-2.5 text-[11px] font-bold text-white hover:bg-white/20 hover:text-white"
          >
            المباريات
          </Button>
        </div>
      </div>
    </section>
  );
}

function HeroTeam({ name, logo }: { name: string; logo?: string | null }) {
  const [err, setErr] = React.useState(false);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/15 p-0.5 ring-1 ring-white/20 sm:h-12 sm:w-12">
        {logo && !err ? (
          <img
            src={imgUrl(logo)}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setErr(true)}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <span className="text-base font-extrabold text-white sm:text-lg">
            {name.slice(0, 1)}
          </span>
        )}
      </div>
      <span className="line-clamp-1 max-w-[80px] text-[10px] font-bold leading-tight text-white sm:text-[11px]">
        {name}
      </span>
    </div>
  );
}

function HeroCountdownChip({ v, l }: { v: number; l: string }) {
  return (
    <span className="flex flex-col items-center rounded bg-white/20 px-1 py-0.5 leading-none">
      <span className="text-[11px] font-extrabold tabular-nums text-white">
        {String(v).padStart(2, "0")}
      </span>
      <span className="mt-px text-[7px] text-white/80">{l}</span>
    </span>
  );
}

// ============ Reusable channel section ============
function ChannelSection({
  title,
  icon,
  channels,
  loading,
  onAll,
}: {
  title: string;
  icon: React.ReactNode;
  channels: Channel[];
  loading: boolean;
  onAll: () => void;
}) {
  // Hide entirely if not loading and empty
  if (!loading && channels.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title={title}
        icon={icon}
        action="عرض الكل"
        onAction={onAll}
      />
      {loading ? (
        <LoadingRow />
      ) : (
        <ChannelRow>
          {channels.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </ChannelRow>
      )}
    </section>
  );
}
