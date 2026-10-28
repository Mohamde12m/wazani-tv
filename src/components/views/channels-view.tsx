"use client";

import * as React from "react";
import {
  Search,
  Tv,
  Play,
  Star,
  BadgeCheck,
  X,
  LayoutGrid,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { ChannelLogo } from "@/components/shared/channel-logo";
import {
  SectionHeader,
  EmptyState,
  LoadingGrid,
} from "@/components/shared/section";
import type { Channel, Country, Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Map category icon names (stored as strings on the category) to lucide glyphs.
const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Trophy: <Tv className="h-3.5 w-3.5" />,
  Newspaper: <Tv className="h-3.5 w-3.5" />,
  Clapperboard: <Tv className="h-3.5 w-3.5" />,
  Moon: <Tv className="h-3.5 w-3.5" />,
  Globe: <Tv className="h-3.5 w-3.5" />,
  Film: <Tv className="h-3.5 w-3.5" />,
  Baby: <Tv className="h-3.5 w-3.5" />,
  Music: <Tv className="h-3.5 w-3.5" />,
  Tv: <Tv className="h-3.5 w-3.5" />,
};

function categoryIcon(name?: string | null) {
  if (!name) return <Tv className="h-3.5 w-3.5" />;
  return CATEGORY_ICON_MAP[name] ?? <Tv className="h-3.5 w-3.5" />;
}

/**
 * A compact grid-friendly channel card. The shared <ChannelCard /> is fixed
 * at 150px wide (designed for horizontal rows), so we build a slightly
 * different variant here that fits a 2-3-4 column responsive grid.
 */
function GridChannelCard({ channel }: { channel: Channel }) {
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const fav = has("channel", channel.id);
  const available = !!channel.streamUrl && channel.streamType !== "none";

  return (
    <button
      onClick={() => setView({ name: "player", channelId: channel.id })}
      className="group relative flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative mx-auto w-fit">
        <ChannelLogo
          src={channel.logo}
          name={channel.nameAr ?? channel.name}
          size={96}
          className="!rounded-xl"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-dark/0 opacity-0 transition-all group-hover:bg-emerald-dark/30 group-hover:opacity-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white shadow-lg">
            <Play className="h-4 w-4 translate-x-[-1px]" fill="currentColor" />
          </span>
        </span>
        {channel.verified && (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white ring-2 ring-card">
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
        )}
        {available ? (
          <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-emerald px-1.5 py-0.5 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white live-dot" />
            متاح
          </span>
        ) : (
          <span className="absolute bottom-1 right-1 rounded-full bg-muted-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            غير متاح
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">
          {channel.nameAr ?? channel.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {channel.country?.name ?? "عربية"} · {channel.category?.name ?? "عامة"}
        </p>
      </div>
      <span
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          toggle("channel", channel.id);
          toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
        }}
        className={cn(
          "absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-card transition-all",
          fav
            ? "bg-gold text-white"
            : "border border-border bg-card text-muted-foreground hover:text-gold",
        )}
        aria-label="إضافة إلى المفضلة"
      >
        <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
      </span>
    </button>
  );
}

interface ChannelsResponse {
  channels: Channel[];
}
interface CountriesResponse {
  countries: Country[];
}
interface CategoriesResponse {
  categories: Category[];
}

export function ChannelsView({
  country,
  category,
}: {
  country?: string;
  category?: string;
}) {
  // Initial filters come from navigation props (country code / category slug).
  const [selectedCountry, setSelectedCountry] = React.useState<string | undefined>(country);
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(category);
  const [query, setQuery] = React.useState("");

  // Keep filter state in sync if the user re-enters this view with different props.
  React.useEffect(() => {
    setSelectedCountry(country);
  }, [country]);
  React.useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  const {
    data: channelsData,
    loading: channelsLoading,
  } = useFetch<ChannelsResponse>("/api/channels");
  const { data: countriesData } = useFetch<CountriesResponse>("/api/countries");
  const { data: categoriesData } = useFetch<CategoriesResponse>("/api/categories");

  const channels = channelsData?.channels ?? [];
  const countries = countriesData?.countries ?? [];
  const categories = categoriesData?.categories ?? [];

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return channels.filter((ch) => {
      if (selectedCountry && ch.country?.code !== selectedCountry) return false;
      if (selectedCategory && ch.category?.slug !== selectedCategory) return false;
      if (q) {
        const haystack = [
          ch.name,
          ch.nameAr,
          ch.country?.name ?? "",
          ch.category?.name ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [channels, selectedCountry, selectedCategory, query]);

  const clearFilters = () => {
    setSelectedCountry(undefined);
    setSelectedCategory(undefined);
    setQuery("");
  };

  const hasActiveFilter =
    !!selectedCountry || !!selectedCategory || query.trim().length > 0;

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Filter bar — sticky below the main header */}
      <div className="sticky top-0 z-20 -mx-4 space-y-2 bg-background/95 px-4 py-3 backdrop-blur-md">
        {/* Row 1 — Countries */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={!selectedCountry}
            onClick={() => setSelectedCountry(undefined)}
          >
            <span className="text-sm">🌐</span>
            <span>الكل</span>
          </FilterChip>
          {countries.map((c) => (
            <FilterChip
              key={c.id}
              active={selectedCountry === c.code}
              onClick={() => setSelectedCountry(c.code)}
            >
              <span className="text-sm">{c.flag ?? "🏳️"}</span>
              <span>{c.name}</span>
            </FilterChip>
          ))}
        </div>

        {/* Row 2 — Categories */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={!selectedCategory}
            onClick={() => setSelectedCategory(undefined)}
          >
            {categoryIcon("Tv")}
            <span>الكل</span>
          </FilterChip>
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              active={selectedCategory === cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {categoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </FilterChip>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن قناة أو دولة أو فئة..."
            className="h-11 w-full rounded-xl border border-border bg-card pr-10 pl-10 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-emerald focus:ring-2 focus:ring-emerald/20"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <SectionHeader
          title="القنوات"
          icon={<LayoutGrid className="h-5 w-5" />}
        />
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-emerald">
            عدد القنوات: {filtered.length}
          </span>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-destructive"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Results grid */}
      {channelsLoading ? (
        <LoadingGrid count={8} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد قنوات مطابقة"
          subtitle="جرّب تعديل الفلاتر أو مسح البحث لعرض المزيد من القنوات."
          icon={<Tv className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((ch, i) => (
            <React.Fragment key={ch.id}>
              <GridChannelCard channel={ch} />
              {/* إعلان وسط القنوات — كل 8 قنوات */}
              {/* spacer to keep grid rhythm without ads */}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-all active:scale-95",
        active
          ? "border-emerald bg-emerald text-white shadow-sm"
          : "border-border bg-card text-foreground hover:border-emerald/40 hover:text-emerald",
      )}
    >
      {children}
    </button>
  );
}
