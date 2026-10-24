"use client";

import * as React from "react";
import { Search, X, Sparkles, Tv, Trophy, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChannelCard } from "@/components/shared/channel-card";
import { MatchCard } from "@/components/shared/match-card";
import { EmptyState, LoadingGrid, SectionHeader } from "@/components/shared/section";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import type { Channel, Category, Match } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Normalize Arabic text for case-insensitive, diacritic-insensitive matching. */
function normalize(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // tashkeel/diacritics
    .replace(/[\u0640]/g, "") // tatweel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function SearchView({ initialQuery }: { initialQuery?: string }) {
  const [q, setQ] = React.useState(initialQuery ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const setView = useNav((s) => s.setView);

  const channelsRes = useFetch<{ channels: Channel[] }>("/api/channels");
  const matchesRes = useFetch<{ matches: Match[] }>("/api/matches");
  const categoriesRes = useFetch<{ categories: Category[] }>("/api/categories");

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const channels = channelsRes.data?.channels ?? [];
  const matches = matchesRes.data?.matches ?? [];
  const categories = categoriesRes.data?.categories ?? [];

  const query = q.trim();
  const normQ = normalize(query);

  // نتائج القنوات
  const channelResults = React.useMemo(() => {
    if (!normQ) return [];
    return channels.filter((c) => {
      const hay = normalize(
        [c.name, c.nameAr, c.country?.name, c.category?.name].filter(Boolean).join(" "),
      );
      return hay.includes(normQ);
    });
  }, [channels, normQ]);

  // نتائج المباريات (بحث في الفرق والبطولات والملعب)
  const matchResults = React.useMemo(() => {
    if (!normQ) return [];
    return matches.filter((m) => {
      const hay = normalize(
        [
          m.homeName,
          m.awayName,
          m.tournamentName,
          m.tournament?.nameAr,
          m.tournament?.name,
          m.stadium,
          m.channel?.nameAr,
          m.channel?.name,
        ].filter(Boolean).join(" "),
      );
      return hay.includes(normQ);
    });
  }, [matches, normQ]);

  const featured = React.useMemo(
    () => channels.filter((c) => c.featured).slice(0, 8),
    [channels],
  );

  const hasQuery = normQ.length > 0;
  const loading = channelsRes.loading || matchesRes.loading;
  const totalResults = channelResults.length + matchResults.length;

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن قناة، مباراة، فريق، بطولة…"
          className="h-12 rounded-2xl border-border bg-card pr-10 pl-10 text-sm font-medium shadow-sm focus-visible:border-emerald focus-visible:ring-emerald/20"
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label="مسح البحث"
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {hasQuery ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-bold text-muted-foreground">
              نتائج البحث:{" "}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-emerald">
                {totalResults}
              </span>
            </p>
            {loading && <span className="text-[11px] text-muted-foreground">جارٍ التحميل…</span>}
          </div>

          {loading ? (
            <LoadingGrid count={4} className="grid-cols-2 sm:grid-cols-3" />
          ) : totalResults === 0 ? (
            <EmptyState
              title={`لا توجد نتائج مطابقة لـ «${query}»`}
              subtitle="جرّب كلمة أخرى أو تحقق من الإملاء"
              icon={<Search className="h-6 w-6" />}
            />
          ) : (
            <>
              {/* نتائج المباريات */}
              {matchResults.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    title={`المباريات (${matchResults.length})`}
                    icon={<Trophy className="h-4 w-4" />}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {matchResults.slice(0, 10).map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </section>
              )}

              {/* نتائج القنوات */}
              {channelResults.length > 0 && (
                <section className="space-y-3">
                  <SectionHeader
                    title={`القنوات (${channelResults.length})`}
                    icon={<Tv className="h-4 w-4" />}
                  />
                  <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                    {channelResults.map((c) => (
                      <ChannelCard key={c.id} channel={c} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* اقتراحات سريعة */}
          <section className="space-y-2">
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              اقتراحات سريعة
            </p>
            <div className="flex flex-wrap gap-2">
              {["الأهلي", "الزمالك", "ريال مدريد", "برشلونة", "الجزيرة", "MBC", "الدوري المغربي", "أبطال أوروبا"].map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:text-emerald active:scale-[0.97]"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Popular categories */}
          {categories.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="تصفّح حسب التصنيف" icon={<Sparkles className="h-4 w-4" />} />
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setView({ name: "channels", category: cat.slug })}
                    className={cn(
                      "rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-sm transition-all",
                      "hover:-translate-y-0.5 hover:border-emerald/40 hover:text-emerald active:scale-[0.97]",
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Featured channels */}
          <section className="space-y-3">
            <SectionHeader title="قنوات مميزة" icon={<Tv className="h-4 w-4" />} />
            {loading ? (
              <LoadingGrid count={4} className="grid-cols-2 sm:grid-cols-3" />
            ) : featured.length === 0 ? (
              <EmptyState
                title="لا توجد قنوات مميزة حالياً"
                subtitle="ستظهر هنا القنوات المختارة"
                icon={<Tv className="h-6 w-6" />}
              />
            ) : (
              <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                {featured.map((c) => (
                  <ChannelCard key={c.id} channel={c} />
                ))}
              </div>
            )}
          </section>

          {/* المباريات القادمة */}
          {!loading && matches.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="مباريات قادمة" icon={<Calendar className="h-4 w-4" />} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matches
                  .filter((m) => m.status === "scheduled" || m.status === "live")
                  .slice(0, 4)
                  .map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
