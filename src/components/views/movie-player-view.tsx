"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Star, ChevronLeft, Clock, Calendar, Film } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { formatTime, formatDate } from "@/lib/datetime";
import { toast } from "sonner";
import type { MovieItem } from "@/lib/types";

const StreamPlayer = dynamic(
  () => import("@/components/shared/stream-player").then((m) => ({ default: m.StreamPlayer })),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-emerald-dark" /> },
);

type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "iframe" | "none";

interface MoviesResponse {
  movies: MovieItem[];
}

/**
 * MoviePlayerView — مشغل الأفلام
 * يجلب الفيلم من API ويشغّله عبر StreamPlayer
 */
export function MoviePlayerView({ movieId }: { movieId: string }) {
  const back = useNav((s) => s.back);
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const { data, loading } = useFetch<MoviesResponse>("/api/movies");

  const movies = data?.movies ?? [];
  const movie = React.useMemo(
    () => movies.find((m) => m.id === movieId),
    [movies, movieId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-8 w-8 rounded-full border-2"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
            borderTopColor: "var(--accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <Film className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">الفيلم غير موجود</p>
        <button
          onClick={() => setView({ name: "movies" })}
          className="rounded-lg bg-emerald px-4 py-2 text-sm font-bold text-white"
        >
          العودة للأفلام
        </button>
      </div>
    );
  }

  const available = !!movie.streamUrl && movie.streamType !== "none";
  const streamKind: StreamKind = (movie.streamType as StreamKind) ?? "none";

  // مرّر روابط HLS عبر البروكسي
  const proxiedSrc =
    available && streamKind === "hls" && movie.streamUrl?.startsWith("http")
      ? `/api/stream?url=${encodeURIComponent(movie.streamUrl)}`
      : movie.streamUrl;

  const fav = has("movie", movie.id);
  const genresArray = movie.genres ? movie.genres.split(",").map((g) => g.trim()).filter(Boolean) : [];

  return (
    <div>
      {/* المشغل */}
      <div className="relative">
        <StreamPlayer
          key={`movie-${movie.id}`}
          src={available ? proxiedSrc : null}
          kind={available ? streamKind : "none"}
          poster={movie.posterUrl}
          autoplay
          reloadNonce={0}
        />
        {!available && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-dark/90">
            <Film className="h-12 w-12 text-white/50" />
            <span className="text-sm font-bold text-white/90">
              لا يتوفر رابط بث لهذا الفيلم
            </span>
            <span className="text-xs text-white/60">سيتم إضافته قريبًا</span>
          </div>
        )}
      </div>

      {/* معلومات الفيلم */}
      <div className="space-y-3 px-4 py-4">
        {/* زر رجوع */}
        <button
          onClick={back}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald"
        >
          <ChevronLeft className="h-4 w-4" />
          رجوع
        </button>

        {/* رأس الفيلم */}
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
          {/* بوستر مصغر */}
          <div
            className="h-20 w-14 shrink-0 overflow-hidden rounded-lg"
            style={{ background: movie.posterUrl ? undefined : movie.gradient }}
          >
            {movie.posterUrl && (
              <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
            )}
            {!movie.posterUrl && (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="h-6 w-6 text-white/30" />
              </div>
            )}
          </div>

          {/* العنوان + التقييم */}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold text-foreground">{movie.title}</h1>
            {movie.titleEn && (
              <p className="truncate text-xs text-muted-foreground" dir="ltr">{movie.titleEn}</p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">
                <Star className="h-3 w-3 fill-current" />
                {movie.rating.toFixed(1)}
              </span>
              {movie.year > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {movie.year}
                </span>
              )}
              {movie.duration && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {movie.duration}
                </span>
              )}
            </div>
          </div>

          {/* زر المفضلة */}
          <button
            onClick={() => {
              toggle("movie", movie.id);
              toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
            }}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
              fav
                ? "border-gold bg-gold text-white"
                : "border-border text-muted-foreground hover:text-gold"
            }`}
          >
            <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* الوصف */}
        {movie.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{movie.description}</p>
        )}

        {/* الأنواع */}
        {genresArray.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genresArray.map((g) => (
              <span
                key={g}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-emerald"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
