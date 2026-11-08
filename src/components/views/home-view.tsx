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
import { HomeSlider } from "@/components/shared/home-slider";
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
import { useWatchHistory } from "@/stores/watch-history";
import { History, X, Play } from "lucide-react";
import { toast } from "sonner";
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
  const watchHistory = useWatchHistory((s) => s.items);
  const loadHistory = useWatchHistory((s) => s.load);
  const clearHistory = useWatchHistory((s) => s.clear);

  const { data: channelsData, loading: channelsLoading } =
    useFetch<ChannelsResponse>("/api/channels");
  const { data: matchesData, loading: matchesLoading } =
    useFetch<MatchesResponse>("/api/matches");

  // حمّل سجل المشاهدة عند بدء التطبيق
  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
      <header
        className="sticky top-0 z-30"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--card) 94%, transparent) 0%, color-mix(in srgb, var(--card) 80%, transparent) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
          boxShadow: "0 4px 20px -8px rgba(2, 20, 16, 0.12)",
        }}
      >
        {/* شريط ذهبي علوي رفيع */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 55%, transparent) 50%, transparent 100%)",
          }}
        />
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2.5">
          {/* Brand block (right side in RTL) — animated logo + animated wordmark */}
          <button
            onClick={() => setView({ name: "home" })}
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
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
            className="wz-glass-chip flex h-10 w-10 items-center justify-center rounded-xl text-emerald transition-all hover:scale-105 active:scale-95"
            aria-label="بحث"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications button (left side) */}
          <button
            onClick={() => setView({ name: "matches", tab: "live" })}
            className="wz-glass-chip relative flex h-10 w-10 items-center justify-center rounded-xl text-emerald transition-all hover:scale-105 active:scale-95"
            aria-label="التنبيهات"
          >
            <Bell className="h-5 w-5" />
            {liveCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                  boxShadow: "0 2px 6px -1px color-mix(in srgb, var(--accent) 60%, transparent)",
                }}
              >
                {liveCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Page body */}
      <div className="space-y-6 px-4 py-4">
      {/* 0. شاشة منزلقة احترافية */}
      <HomeSlider />


      {/* 1.5. سجل المشاهدة — آخر القنوات التي شاهدتها */}
      {watchHistory.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 100%)",
                  color: "var(--accent)",
                }}
              >
                <History className="h-5 w-5" />
              </span>
              <h2 className="wz-section-title text-base font-extrabold sm:text-lg">
                تابع المشاهدة
              </h2>
            </div>
            <button
              onClick={() => {
                if (confirm("مسح سجل المشاهدة؟")) {
                  clearHistory();
                  toast.success("تم مسح السجل");
                }
              }}
              className="wz-glass-chip rounded-full p-1.5 text-muted-foreground transition hover:text-foreground"
              aria-label="مسح السجل"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="no-scrollbar wz-scroll-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {watchHistory.map((item) => {
              // مؤشر تقدم ديكوري: الأحدث = شريط أطول/ذهبي أكثف
              const ageMinutes = (Date.now() - (item.watchedAt || 0)) / 60000;
              const progress = Math.max(15, Math.min(100, 100 - ageMinutes * 0.05));
              const isRecent = ageMinutes < 60; // آخر ساعة

              return (
                <button
                  key={item.id}
                  onClick={() => setView({ name: "player", channelId: item.id })}
                  className="wz-cine-card group relative w-[140px] shrink-0 overflow-hidden rounded-2xl text-right active:scale-[0.98]"
                >
                  {/* رأس البطاقة — شعار + تدرج سينمائي */}
                  <div
                    className="relative flex h-20 items-center justify-center overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, var(--color-emerald-dark) 0%, color-mix(in srgb, var(--primary) 60%, #000) 100%)",
                    }}
                  >
                    {/* توهج خلفي ناعم */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: "radial-gradient(circle at 50% 50%, rgba(31, 224, 122, 0.22) 0%, transparent 65%)",
                      }}
                    />

                    {/* الشعار */}
                    {item.logo ? (
                      <img
                        src={item.logo.startsWith("http") ? `/api/img?url=${encodeURIComponent(item.logo)}` : item.logo}
                        alt={item.nameAr || item.name}
                        className="relative h-12 w-12 rounded-xl object-cover shadow-md transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="relative text-2xl font-bold text-white">
                        {(item.nameAr || item.name).charAt(0)}
                      </span>
                    )}

                    {/* زر تشغيل عائم — يظهر عند الhover */}
                    <span
                      className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100"
                    >
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                        style={{
                          background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                          boxShadow: "0 6px 18px -4px color-mix(in srgb, var(--accent) 65%, transparent)",
                          transform: "scale(0.85)",
                          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                      >
                        <Play className="h-5 w-5 translate-x-[-1px]" fill="currentColor" />
                      </span>
                    </span>

                    {/* شارة "شوهد مؤخرًا" للأحدث */}
                    {isRecent && (
                      <span
                        className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-black"
                        style={{
                          background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-light) 100%)",
                          boxShadow: "0 2px 6px -1px color-mix(in srgb, var(--accent) 50%, transparent)",
                        }}
                      >
                        <span className="h-1 w-1 rounded-full bg-black/60" />
                        الآن
                      </span>
                    )}
                  </div>

                  {/* جسم البطاقة */}
                  <div className="p-2">
                    <div className="truncate text-xs font-bold text-foreground">
                      {item.nameAr || item.name}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {item.country?.name || "عربية"} · {item.category?.name || "عامة"}
                    </div>
                  </div>

                  {/* مؤشر التقدم السفلي — ذهبي يتناقص مع الوقت */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1 overflow-hidden"
                    style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                  >
                    <div
                      className="h-full rounded-r-full"
                      style={{
                        width: `${progress}%`,
                        background: isRecent
                          ? "linear-gradient(90deg, var(--accent) 0%, var(--color-gold-light) 100%)"
                          : "linear-gradient(90deg, var(--color-gold-deep) 0%, var(--accent) 100%)",
                        boxShadow: isRecent
                          ? "0 0 8px 0 color-mix(in srgb, var(--accent) 60%, transparent)"
                          : "none",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

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

      {/* Footer spacing for bottom nav */}
      <div className="h-2" />
      </div>
    </div>
  );
}

// ============ Compact today match card (horizontal, minimal height) ============
// 🎨 تصميم احترافي: خلفية متدرجة داكنة + شريط جانبي زاهٍ حسب الحالة + كبسولات ذهبية
// نفس الأبعاد السابقة تماماً (w-[210px], نفس الصفوف)
function TodayMatchCard({ match }: { match: Match }) {
  const setView = useNav((s) => s.setView);
  const live = match.status === "live";
  const finished = match.status === "finished";
  const tournamentName =
    match.tournamentName ?? match.tournament?.nameAr ?? match.tournament?.name ?? "بطولة";

  // 🎨 لوحة الألوان حسب الحالة — شريط جانبي + توهج خلفي
  const palette = live
    ? {
        bar: "linear-gradient(180deg, #F43F5E 0%, #DC2626 50%, #B91C1C 100%)",
        glow: "radial-gradient(circle at 50% 0%, rgba(244,63,94,0.18) 0%, transparent 60%)",
        ring: "rgba(244,63,94,0.5)",
      }
    : finished
      ? {
          bar: "linear-gradient(180deg, #64748B 0%, #475569 50%, #334155 100%)",
          glow: "radial-gradient(circle at 50% 0%, rgba(100,116,139,0.12) 0%, transparent 60%)",
          ring: "rgba(100,116,139,0.3)",
        }
      : {
          bar: "linear-gradient(180deg, #F5C842 0%, #C99A2E 50%, #00B377 100%)",
          glow: "radial-gradient(circle at 50% 0%, rgba(245,200,66,0.14) 0%, transparent 60%)",
          ring: "rgba(0,179,119,0.35)",
        };

  return (
    <button
      onClick={() => setView({ name: "matches" })}
      className="group relative w-[210px] shrink-0 overflow-hidden rounded-xl p-2.5 text-right transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        background: "linear-gradient(145deg, #0a1622 0%, #0f1f2e 45%, #0a1622 100%)",
        boxShadow: `0 4px 16px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* 🎨 الشريط الجانبي الزاهي - يميز الحالة */}
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 w-1"
        style={{ background: palette.bar }}
      />
      {/* 🎨 التوهج الخلفي العلوي */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: palette.glow }}
      />
      {/* 🎨 حدود ناعمة بتدرج */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ border: `1px solid ${palette.ring}`, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03)` }}
      />
      {/* 🎨 لمعان يمر عند hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
        }}
      />

      {/* === الصف 1: البطولة + شارة الحالة === */}
      <div className="relative mb-1.5 flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1">
          {/* أيقونة كأس ذهبية مصغرة */}
          <Trophy className="h-2.5 w-2.5 shrink-0" style={{ color: "#F5C842" }} />
          <span
            className="truncate text-[10px] font-extrabold"
            style={{
              background: "linear-gradient(90deg, #F5C842, #FFD700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {tournamentName}
          </span>
        </div>

        {/* شارة الحالة */}
        {live ? (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #F43F5E 0%, #DC2626 100%)",
              boxShadow: "0 2px 8px -1px rgba(244,63,94,0.6)",
            }}
          >
            <span
              className="h-1 w-1 rounded-full bg-white"
              style={{ animation: "wazani-match-pulse 1.4s ease-in-out infinite" }}
            />
            مباشر
          </span>
        ) : finished ? (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white/80"
            style={{ background: "rgba(100,116,139,0.4)", backdropFilter: "blur(4px)" }}
          >
            انتهت
          </span>
        ) : (
          <span
            className="flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #00B377 0%, #00916B 100%)",
              boxShadow: "0 2px 8px -1px rgba(0,179,119,0.5)",
            }}
          >
            <Clock className="h-2 w-2" />
            {formatTime(match.kickoff)}
          </span>
        )}
      </div>

      {/* === الصف 2: الفريقان + النتيجة/VS === */}
      <div className="relative flex items-center justify-between gap-1">
        <TeamMini name={match.homeName} logo={match.homeLogo} />

        {/* المنتصف: VS أو النتيجة في كبسولة احترافية */}
        <div className="flex shrink-0 flex-col items-center">
          {live || finished ? (
            <div
              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-extrabold tabular-nums"
              style={{
                background: live
                  ? "linear-gradient(135deg, rgba(244,63,94,0.25), rgba(220,38,38,0.15))"
                  : "linear-gradient(135deg, rgba(100,116,139,0.25), rgba(71,85,105,0.15))",
                border: `1px solid ${live ? "rgba(244,63,94,0.4)" : "rgba(100,116,139,0.35)"}`,
                color: live ? "#FCA5A5" : "#CBD5E1",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              <span>{match.homeScore ?? 0}</span>
              <span className="text-[10px] opacity-60">-</span>
              <span>{match.awayScore ?? 0}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[10px] font-black tracking-wider"
              style={{
                background: "linear-gradient(135deg, #F5C842 0%, #C99A2E 100%)",
                color: "#0A0A0A",
                boxShadow: "0 2px 10px -2px rgba(245,200,66,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              VS
            </div>
          )}
        </div>

        <TeamMini name={match.awayName} logo={match.awayLogo} />
      </div>

      {/* === الصف 3: القناة === */}
      {match.channel && (
        <div
          className="relative mt-1.5 flex items-center justify-center gap-1 pt-1.5 text-[9px]"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Radio className="h-2.5 w-2.5 shrink-0" style={{ color: "#F5C842" }} />
          <span
            className="truncate font-bold"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {match.channel.nameAr ?? match.channel.name}
          </span>
        </div>
      )}

      <style>{`
        @keyframes wazani-match-pulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.6); }
          50% { opacity: 0.6; transform: scale(1.2); box-shadow: 0 0 0 3px rgba(255,255,255,0); }
        }
      `}</style>
    </button>
  );
}

function TeamMini({ name, logo }: { name: string; logo?: string | null }) {
  const [err, setErr] = React.useState(false);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
      <div className="relative flex h-9 w-9 items-center justify-center">
        {/* توهج خلفي للشعار */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-lg opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(245,200,66,0.22) 0%, transparent 70%)",
          }}
        />
        <div
          className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg p-0.5"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {logo && !err ? (
            <img
              src={imgUrl(logo)}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => setErr(true)}
              className="h-full w-full rounded object-cover"
            />
          ) : (
            <span
              className="text-sm font-black"
              style={{
                background: "linear-gradient(135deg, #F5C842, #C99A2E)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {name.slice(0, 1)}
            </span>
          )}
        </div>
      </div>
      <span
        className="line-clamp-1 max-w-[72px] text-[9px] font-bold leading-tight"
        style={{ color: "rgba(255,255,255,0.92)" }}
      >
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
