"use client";

import * as React from "react";
import { Film, Play, Star, Search } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { ChannelLogo } from "@/components/shared/channel-logo";
import { ChannelCard } from "@/components/shared/channel-card";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/shared/page-transitions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Channel } from "@/lib/types";

interface ChannelsResponse {
  channels: Channel[];
}

/**
 * MoviesView — قسم الأفلام السينمائي الاحترافي
 *
 * يعرض:
 * - رأس سينمائي بتصميم فاخر
 * - قنوات الأفلام في شبكة احترافية
 * - فلترة حسب فئة الأفلام + الترفيهية
 * - بطاقات سينمائية مع تأثيرات hover
 */
export function MoviesView() {
  const { data, loading } = useFetch<ChannelsResponse>("/api/channels");
  const setView = useNav((s) => s.setView);

  const allChannels = data?.channels ?? [];

  // فلترة قنوات الأفلام + الترفيهية (لمحتوى أكثر)
  const movieChannels = React.useMemo(() => {
    return allChannels.filter(
      (c) =>
        c.category?.slug === "movies" ||
        c.category?.slug === "entertainment" ||
        (c.nameAr && (c.nameAr.includes("سينما") || c.nameAr.includes("أفلام"))) ||
        (c.name && c.name.toLowerCase().includes("film"))
    );
  }, [allChannels]);

  // grouped by country
  const grouped = React.useMemo(() => {
    const groups: Record<string, Channel[]> = {};
    for (const ch of movieChannels) {
      const country = ch.country?.name ?? "أخرى";
      if (!groups[country]) groups[country] = [];
      groups[country].push(ch);
    }
    return groups;
  }, [movieChannels]);

  return (
    <div className="min-h-screen">
      {/* ===== رأس سينمائي فاخر ===== */}
      <FadeIn delay={0}>
        <div
          className="relative mb-6 overflow-hidden rounded-3xl mx-4 mt-4"
          style={{
            background:
              "linear-gradient(135deg, var(--color-emerald-dark) 0%, color-mix(in srgb, var(--primary) 50%, #000) 50%, var(--color-emerald-dark) 100%)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
            boxShadow: "0 20px 60px -20px rgba(2,20,16,0.4)",
          }}
        >
          {/* توهج خلفي */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(31, 224, 122, 0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(245, 200, 66, 0.12) 0%, transparent 60%)",
            }}
          />

          {/* لمعان متحرك */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
              backgroundSize: "250% 100%",
              animation: "wazani-gold-shimmer 6s linear infinite",
            }}
          />

          <div className="relative p-6 text-center">
            {/* أيقونة الفيلم */}
            <div
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                boxShadow: "0 8px 24px -4px color-mix(in srgb, var(--accent) 60%, transparent)",
              }}
            >
              <Film className="h-8 w-8 text-white" />
            </div>

            <h1
              className="mb-1 text-2xl font-extrabold"
              style={{
                background: "linear-gradient(90deg, #FFFFFF 0%, var(--color-gold-light) 50%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              قسم الأفلام
            </h1>
            <p className="text-xs text-white/60">
              {movieChannels.length} قناة أفلام وترفيه — شاهد أفضل الأفلام العربية والعالمية
            </p>
          </div>

          {/* شريط ذهبي سفلي */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)",
            }}
          />
        </div>
      </FadeIn>

      {/* ===== المحتوى ===== */}
      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="h-8 w-8 rounded-full border-2"
              style={{
                borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                borderTopColor: "var(--accent)",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        ) : movieChannels.length === 0 ? (
          <div className="wz-cine-card flex flex-col items-center justify-center gap-3 rounded-2xl py-16 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent) 0%, color-mix(in srgb, var(--primary) 10%, transparent) 100%)",
                color: "var(--accent)",
              }}
            >
              <Film className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-foreground">لا توجد قنوات أفلام متاحة حاليًا</p>
            <p className="px-6 text-xs text-muted-foreground">سيتم إضافة المزيد من قنوات الأفلام قريبًا</p>
          </div>
        ) : (
          <StaggerContainer className="space-y-6">
            {/* عرض كل القنوات في شبكة سينمائية */}
            <StaggerItem>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 100%)",
                    color: "var(--accent)",
                  }}
                >
                  <Film className="h-5 w-5" />
                </span>
                <h2 className="wz-section-title text-base font-extrabold sm:text-lg">
                  قنوات الأفلام والترفيه
                </h2>
              </div>
            </StaggerItem>

            {/* شبكة البطاقات */}
            <StaggerItem>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {movieChannels.map((channel) => (
                  <MovieChannelCard key={channel.id} channel={channel} />
                ))}
              </div>
            </StaggerItem>

            {/* مجموعات حسب الدولة */}
            {Object.keys(grouped).length > 1 && (
              <>
                {Object.entries(grouped).map(([country, channels]) => (
                  <StaggerItem key={country}>
                    <div className="mb-3 mt-6 flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{country}</h3>
                      <span className="text-xs text-muted-foreground">({channels.length})</span>
                    </div>
                    <div className="no-scrollbar wz-scroll-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                      {channels.map((ch) => (
                        <ChannelCard key={ch.id} channel={ch} />
                      ))}
                    </div>
                  </StaggerItem>
                ))}
              </>
            )}
          </StaggerContainer>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * MovieChannelCard — بطاقة قناة أفلام سينمائية
 */
function MovieChannelCard({ channel }: { channel: Channel }) {
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const fav = has("channel", channel.id);
  const available = !!channel.streamUrl && channel.streamType !== "none";

  return (
    <button
      onClick={() => setView({ name: "player", channelId: channel.id })}
      className="wz-cine-card group relative flex flex-col overflow-hidden rounded-2xl text-right active:scale-[0.98]"
    >
      {/* منطقة الشعار */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--color-emerald-dark) 0%, color-mix(in srgb, var(--primary) 50%, #000) 100%)",
        }}
      >
        {/* توهج خلفي */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(31, 224, 122, 0.15) 0%, transparent 65%)",
          }}
        />

        <ChannelLogo src={channel.logo} name={channel.nameAr ?? channel.name} size={80} className="!rounded-xl transition-transform duration-300 group-hover:scale-110" />

        {/* overlay عند الhover */}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/50 group-hover:opacity-100">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
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

        {/* شارة متاح */}
        {available && (
          <span
            className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #000) 100%)",
              animation: "wazani-live-pulse 2s ease-in-out infinite",
            }}
          >
            <span className="h-1 w-1 rounded-full bg-white" />
            متاح
          </span>
        )}

        {/* زر المفضلة */}
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            toggle("channel", channel.id);
            toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
          }}
          className={cn(
            "absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-card transition-all",
            fav ? "text-white" : "bg-card/80 text-muted-foreground hover:text-gold",
          )}
          style={
            fav
              ? {
                  background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                  boxShadow: "0 4px 10px -2px color-mix(in srgb, var(--accent) 55%, transparent)",
                }
              : undefined
          }
        >
          <Star className="h-3.5 w-3.5" fill={fav ? "currentColor" : "none"} />
        </span>
      </div>

      {/* معلومات */}
      <div className="p-2">
        <p className="truncate text-xs font-bold text-foreground">{channel.nameAr ?? channel.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {channel.country?.name ?? "عربية"} · {channel.category?.name ?? "أفلام"}
        </p>
      </div>
    </button>
  );
}
