"use client";

import * as React from "react";
import { Film, Play, Star, ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { useNav } from "@/stores/nav";
import { useFetch } from "@/hooks/use-fetch";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/shared/page-transitions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MovieItem } from "@/lib/types";

interface MoviesResponse {
  movies: MovieItem[];
}

/**
 * MoviesView — قسم الأفلام السينمائي الاحترافي (Netflix-style)
 *
 * - يجلب الأفلام من /api/movies
 * - شريط منزلق أفقي في الأعلى للأفلام المميزة (Featured Carousel)
 * - صفوف أفلام حسب النوع (Genre Rows)
 */
export function MoviesView() {
  const setView = useNav((s) => s.setView);
  const [activeGenre, setActiveGenre] = React.useState<string>("الكل");
  const { data, loading } = useFetch<MoviesResponse>("/api/movies");

  const allMovies = React.useMemo(() => {
    return (data?.movies ?? []).map((m) => ({
      ...m,
      genresArray: m.genres ? m.genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
    }));
  }, [data?.movies]);

  const featuredMovies = React.useMemo(
    () => allMovies.filter((m) => m.featured),
    [allMovies]
  );

  const allGenres = React.useMemo(() => {
    const genres = new Set<string>();
    allMovies.forEach((m) => m.genresArray.forEach((g) => genres.add(g)));
    return Array.from(genres).sort();
  }, [allMovies]);

  const getMoviesByGenre = (genre: string) => allMovies.filter((m) => m.genresArray.includes(genre));

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

  if (allMovies.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent) 0%, color-mix(in srgb, var(--primary) 10%, transparent) 100%)",
            color: "var(--accent)",
          }}
        >
          <Film className="h-8 w-8" />
        </div>
        <p className="text-sm font-bold text-foreground">لا توجد أفلام متاحة حاليًا</p>
        <p className="text-xs text-muted-foreground">سيتم إضافة أفلام جديدة قريبًا</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      {/* ===== رأس سينمائي مختصر ===== */}
      <FadeIn delay={0}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                boxShadow: "0 4px 12px -2px color-mix(in srgb, var(--accent) 55%, transparent)",
              }}
            >
              <Film className="h-5 w-5 text-white" />
            </span>
            <div>
              <h1 className="wz-section-title text-xl font-extrabold">الأفلام</h1>
              <p className="text-[10px] text-muted-foreground">{allMovies.length} فيلم — شاهد أفضل الأفلام</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ===== الشريط المنزلق العلوي (Featured Carousel) ===== */}
      {featuredMovies.length > 0 && (
        <FadeIn delay={0.1}>
          <FeaturedCarousel movies={featuredMovies} />
        </FadeIn>
      )}

      {/* ===== فلترة الأنواع ===== */}
      {allGenres.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="no-scrollbar wz-scroll-x -mx-4 flex gap-2 overflow-x-auto px-4 py-3">
            <GenreChip
              label="الكل"
              active={activeGenre === "الكل"}
              onClick={() => setActiveGenre("الكل")}
            />
            {allGenres.map((g) => (
              <GenreChip
                key={g}
                label={g}
                active={activeGenre === g}
                onClick={() => setActiveGenre(g)}
              />
            ))}
          </div>
        </FadeIn>
      )}

      {/* ===== صفوف الأفلام حسب النوع ===== */}
      <StaggerContainer className="space-y-6 px-4">
        {activeGenre === "الكل" ? (
          allGenres.map((genre) => {
            const movies = getMoviesByGenre(genre);
            if (movies.length === 0) return null;
            return (
              <StaggerItem key={genre}>
                <MovieRow title={genre} movies={movies} />
              </StaggerItem>
            );
          })
        ) : (
          <StaggerItem>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {getMoviesByGenre(activeGenre).map((m) => (
                <MovieCard key={m.id} movie={m} compact />
              ))}
            </div>
          </StaggerItem>
        )}
      </StaggerContainer>
    </div>
  );
}

/* ============================================================
   الشريط المنزلق العلوي — Featured Carousel
============================================================ */
function FeaturedCarousel({ movies }: { movies: MovieItem[] }) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: "left" | "right") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cardWidth = 280;
    scroller.scrollBy({ left: dir === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <div className="relative mb-2">
      <button
        onClick={() => scrollByCards("right")}
        className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full wz-glass-chip text-emerald transition-all hover:scale-110 active:scale-95"
        aria-label="التالي"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <button
        onClick={() => scrollByCards("left")}
        className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full wz-glass-chip text-emerald transition-all hover:scale-110 active:scale-95"
        aria-label="السابق"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="no-scrollbar wz-scroll-x flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {movies.map((movie) => (
          <FeaturedCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ movie }: { movie: MovieItem }) {
  const setView = useNav((s) => s.setView);
  const genresArray = movie.genres ? movie.genres.split(",").map((g) => g.trim()).filter(Boolean) : [];

  return (
    <button
      onClick={() => setView({ name: "movie-player", movieId: movie.id })}
      className="wz-cine-card relative w-[280px] shrink-0 overflow-hidden rounded-2xl"
      style={{ scrollSnapAlign: "start" }}
    >
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{ background: movie.posterUrl ? undefined : movie.gradient }}
      >
        {movie.posterUrl && (
          <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
        )}

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        <div className="absolute right-3 top-3 flex items-center gap-1">
          <span className="wz-glass-chip flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold text-white">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            {movie.rating.toFixed(1)}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="mb-1 text-base font-extrabold text-white drop-shadow-lg">{movie.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-white/70">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {movie.year}
            </span>
            {movie.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {movie.duration}
              </span>
            )}
            {genresArray[0] && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] font-bold">
                {genresArray[0]}
              </span>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 hover:bg-black/40 hover:opacity-100">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
              boxShadow: "0 6px 18px -4px color-mix(in srgb, var(--accent) 65%, transparent)",
            }}
          >
            <Play className="h-6 w-6 translate-x-[-1px]" fill="currentColor" />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   صف أفلام حسب نوع — Movie Row
============================================================ */
function MovieRow({ title, movies }: { title: string; movies: MovieItem[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-3 w-1 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--accent), var(--color-gold-deep))" }}
        />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        <span className="text-[10px] text-muted-foreground">({movies.length})</span>
      </div>
      <div className="no-scrollbar wz-scroll-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   بطاقة فيلم — Movie Card
============================================================ */
function MovieCard({ movie, compact = false }: { movie: MovieItem; compact?: boolean }) {
  const setView = useNav((s) => s.setView);
  const genresArray = movie.genres ? movie.genres.split(",").map((g) => g.trim()).filter(Boolean) : [];

  return (
    <button
      onClick={() => setView({ name: "movie-player", movieId: movie.id })}
      className={cn(
        "wz-cine-card group relative shrink-0 overflow-hidden rounded-xl text-right active:scale-[0.98]",
        compact ? "w-full" : "w-[130px]"
      )}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden"
        style={{ background: movie.posterUrl ? undefined : movie.gradient }}
      >
        {movie.posterUrl && (
          <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
        )}

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {!movie.posterUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="h-8 w-8 text-white/20" />
          </div>
        )}

        <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-yellow-400 backdrop-blur-sm">
          <Star className="h-2.5 w-2.5 fill-current" />
          {movie.rating.toFixed(1)}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-2">
          <p className="truncate text-[11px] font-bold text-white drop-shadow">{movie.title}</p>
          <p className="truncate text-[8px] text-white/60">{movie.year}{genresArray[0] ? ` · ${genresArray[0]}` : ""}</p>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/50 group-hover:opacity-100">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
              boxShadow: "0 4px 14px -2px color-mix(in srgb, var(--accent) 60%, transparent)",
              transform: "scale(0.85)",
              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <Play className="h-5 w-5 translate-x-[-1px]" fill="currentColor" />
          </span>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   شارة نوع فيلم — Genre Chip
============================================================ */
function GenreChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all",
        active
          ? "text-white"
          : "wz-glass-chip text-muted-foreground hover:text-foreground"
      )}
      style={
        active
          ? {
              background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #000) 100%)",
              boxShadow: "0 4px 12px -2px color-mix(in srgb, var(--primary) 50%, transparent)",
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
