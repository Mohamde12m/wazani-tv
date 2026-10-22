"use client";

import * as React from "react";
import { Search, X, Sparkles, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChannelCard } from "@/components/shared/channel-card";
import { EmptyState, LoadingGrid, SectionHeader } from "@/components/shared/section";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import type { Channel, Category } from "@/lib/types";
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
  const categoriesRes = useFetch<{ categories: Category[] }>("/api/categories");

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const channels = channelsRes.data?.channels ?? [];
  const categories = categoriesRes.data?.categories ?? [];

  const query = q.trim();
  const normQ = normalize(query);

  const results = React.useMemo(() => {
    if (!normQ) return [];
    return channels.filter((c) => {
      const hay = normalize(
        [c.name, c.nameAr, c.country?.name, c.category?.name].filter(Boolean).join(" "),
      );
      return hay.includes(normQ);
    });
  }, [channels, normQ]);

  const featured = React.useMemo(
    () => channels.filter((c) => c.featured).slice(0, 8),
    [channels],
  );

  const hasQuery = normQ.length > 0;
  const loading = channelsRes.loading;

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن قناة، دولة، أو تصنيف…"
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
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-bold text-muted-foreground">
              نتائج البحث:{" "}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-emerald">
                {results.length}
              </span>
            </p>
            {loading && <span className="text-[11px] text-muted-foreground">جارٍ التحميل…</span>}
          </div>

          {loading ? (
            <LoadingGrid count={4} className="grid-cols-2 sm:grid-cols-3" />
          ) : results.length === 0 ? (
            <EmptyState
              title={`لا توجد نتائج مطابقة لـ «${query}»`}
              subtitle="جرّب كلمة أخرى أو تحقق من الإملاء"
              icon={<Search className="h-6 w-6" />}
            />
          ) : (
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {results.map((c) => (
                <ChannelCard key={c.id} channel={c} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
