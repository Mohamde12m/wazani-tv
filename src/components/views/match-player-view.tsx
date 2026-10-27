"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Star,
  ChevronLeft,
  Radio,
  Tv,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { EmptyState } from "@/components/shared/section";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Video.js must be loaded client-side only
const VideoJsPlayer = dynamic(
  () =>
    import("@/components/shared/videojs-player").then((m) => ({
      default: m.VideoJsPlayer,
    })),
  { ssr: false, loading: () => <div className="aspect-video w-full bg-emerald-dark" /> },
);

type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "none";

interface MatchStream {
  url: string;
  type: StreamKind;
  label?: string | null;
  index: number; // 1, 2, 3
}

interface Match {
  id: string;
  homeName: string;
  awayName: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  kickoff: string;
  status: string;
  tournamentName?: string | null;
  stadium?: string | null;
  stream1Url?: string | null;
  stream1Type?: string;
  stream1Label?: string | null;
  stream2Url?: string | null;
  stream2Type?: string;
  stream2Label?: string | null;
  stream3Url?: string | null;
  stream3Type?: string;
  stream3Label?: string | null;
}

interface MatchesResponse {
  matches: Match[];
}

/**
 * مشغل مباريات يدعم 3 روابط بث مستقلة.
 * يعرض تبويبات للمستخدم لاختيار الرابط المناسب.
 */
export function MatchPlayerView({ matchId }: { matchId: string }) {
  const setView = useNav((s) => s.setView);
  const back = useNav((s) => s.back);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const { data, loading, error } = useFetch<MatchesResponse>("/api/matches");

  const matches = data?.matches ?? [];
  const match = React.useMemo(
    () => matches.find((m) => m.id === matchId),
    [matches, matchId],
  );

  // استخراج الروابط المتاحة (تخطّي الفارغة أو none)
  const streams: MatchStream[] = React.useMemo(() => {
    if (!match) return [];
    const result: MatchStream[] = [];
    if (match.stream1Url && match.stream1Type && match.stream1Type !== "none") {
      result.push({
        url: match.stream1Url,
        type: match.stream1Type as StreamKind,
        label: match.stream1Label,
        index: 1,
      });
    }
    if (match.stream2Url && match.stream2Type && match.stream2Type !== "none") {
      result.push({
        url: match.stream2Url,
        type: match.stream2Type as StreamKind,
        label: match.stream2Label,
        index: 2,
      });
    }
    if (match.stream3Url && match.stream3Type && match.stream3Type !== "none") {
      result.push({
        url: match.stream3Url,
        type: match.stream3Type as StreamKind,
        label: match.stream3Label,
        index: 3,
      });
    }
    return result;
  }, [match]);

  // الرابط المختار حاليًا (افتراضيًا الأول)
  const [activeStream, setActiveStream] = React.useState(0);

  React.useEffect(() => {
    // لو الرابط الحالي لم يعد متاحًا، عُد للأول
    if (activeStream >= streams.length) setActiveStream(0);
  }, [streams.length, activeStream]);

  // ─── حالات التحميل والخطأ ───
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald" />
          <p className="text-sm text-muted-foreground">جارٍ تحميل المباراة…</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="px-4 py-6">
        <TopBar title="المباراة غير متوفرة" />
        <EmptyState
          icon={AlertTriangle}
          title="تعذّر تحميل المباراة"
          subtitle={error?.message ?? "ربما تم حذفها أو لا توجد"}
        />
        <button
          onClick={() => setView({ name: "matches" })}
          className="mt-4 rounded-lg bg-emerald px-4 py-2 text-sm font-bold text-white"
        >
          العودة للمباريات
        </button>
      </div>
    );
  }

  const fav = has("match", match.id);
  const isLive = match.status === "live";

  // الرابط الفعّال الحالي
  const current = streams[activeStream];
  const available = !!current && current.type !== "none";

  // لو hls-proxy → مرّر عبر /api/stream
  const useProxy = current?.type === "hls-proxy";
  const effectiveType = useProxy ? "hls" : (current?.type as StreamKind) ?? "none";
  const effectiveUrl = useProxy
    ? `/api/stream?url=${encodeURIComponent(current.url)}`
    : current?.url;

  return (
    <div>
      <TopBar
        title={isLive ? "بث مباشر" : "مشاهدة المباراة"}
        onBack={() => (back ? back() : setView({ name: "matches" }))}
      />

      {/* Full-width video player */}
      {available ? (
        <VideoJsPlayer
          src={effectiveUrl ?? null}
          kind={effectiveType}
          poster={undefined}
          autoplay
          reloadNonce={activeStream}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-emerald-dark text-center text-white">
          <div className="space-y-2 px-4">
            <Tv className="mx-auto h-12 w-12 opacity-50" />
            <p className="text-sm font-bold">لا تتوفر روابط بث لهذه المباراة</p>
            <p className="text-xs text-white/70">
              لم تتم إضافة أي روابط بث بعد من قبل المسؤول
            </p>
          </div>
        </div>
      )}

      {/* Padded content below */}
      <div className="space-y-4 px-4 py-4">
        {/* Match info bar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {/* Teams + score */}
          <div className="flex items-center justify-between gap-3">
            {/* Home team */}
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt={match.homeName}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10 text-lg font-bold text-emerald">
                  {match.homeName.slice(0, 1)}
                </div>
              )}
              <span className="text-xs font-bold text-foreground">
                {match.homeName}
              </span>
            </div>

            {/* Score / vs */}
            <div className="flex flex-col items-center gap-1">
              {isLive && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  مباشر
                </span>
              )}
              <div className="flex items-center gap-2 text-2xl font-extrabold tabular-nums text-foreground">
                <span>{match.homeScore ?? 0}</span>
                <span className="text-muted-foreground">-</span>
                <span>{match.awayScore ?? 0}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {match.tournamentName ?? "مباراة"}
              </span>
            </div>

            {/* Away team */}
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              {match.awayLogo ? (
                <img
                  src={match.awayLogo}
                  alt={match.awayName}
                  className="h-12 w-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald/10 text-lg font-bold text-emerald">
                  {match.awayName.slice(0, 1)}
                </div>
              )}
              <span className="text-xs font-bold text-foreground">
                {match.awayName}
              </span>
            </div>
          </div>

          {/* Favorite button */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => {
                toggle("match", match.id);
                toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
                fav
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-gold",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", fav && "fill-gold")} />
              {fav ? "في المفضلة" : "أضف للمفضلة"}
            </button>
          </div>
        </div>

        {/* Stream selector — يظهر فقط لو عندنا أكثر من رابط */}
        {streams.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Radio className="h-4 w-4 text-gold" />
              <h2 className="text-base font-extrabold text-foreground sm:text-lg">
                اختر مصدر البث
              </h2>
              <span className="text-[11px] text-muted-foreground">
                لو فشل رابط، جرّب الآخر
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {streams.map((s, i) => (
                <button
                  key={s.index}
                  onClick={() => setActiveStream(i)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-3 text-right transition-all",
                    i === activeStream
                      ? "border-emerald bg-emerald/10 shadow-sm"
                      : "border-border bg-card hover:border-emerald/40",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      i === activeStream
                        ? "bg-emerald text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.index}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {s.label || `البث ${s.index}`}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {s.type === "hls" && "HLS مباشر"}
                      {s.type === "hls-proxy" && "HLS + Proxy"}
                      {s.type === "mp4" && "MP4"}
                      {s.type === "youtube" && "YouTube"}
                    </p>
                  </div>
                  {i === activeStream && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Match meta info */}
        {(match.tournamentName || match.stadium) && (
          <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
            {match.tournamentName && (
              <p>
                <span className="font-bold text-foreground">البطولة:</span>{" "}
                {match.tournamentName}
              </p>
            )}
            {match.stadium && (
              <p className="mt-1">
                <span className="font-bold text-foreground">الملعب:</span>{" "}
                {match.stadium}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Top bar ─── */
function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  const setView = useNav((s) => s.setView);
  const back = useNav((s) => s.back);
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md">
      <button
        onClick={() => (onBack ? onBack() : back ? back() : setView({ name: "matches" }))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
        aria-label="رجوع"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h1 className="flex-1 truncate text-base font-extrabold text-emerald">
        {title}
      </h1>
      <button
        onClick={() => setView({ name: "search" })}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
        aria-label="بحث"
      >
        <Radio className="h-4 w-4" />
      </button>
    </header>
  );
}
