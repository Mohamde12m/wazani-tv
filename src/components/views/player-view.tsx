"use client";

import * as React from "react";
import { useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Star,
  ChevronRight,
  ChevronLeft,
  MonitorOff,
  Tv,
  Loader2,
  Radio,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { ChannelLogo } from "@/components/shared/channel-logo";
import { ChannelCard } from "@/components/shared/channel-card";
import {
  SectionHeader,
  EmptyState,
} from "@/components/shared/section";
import { Slider } from "@/components/ui/slider";
import type { Channel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/img";
import { toast } from "sonner";

import type HlsType from "hls.js";

interface ChannelsResponse {
  channels: Channel[];
}

export function PlayerView({ channelId }: { channelId: string }) {
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const { data, loading } = useFetch<ChannelsResponse>("/api/channels");

  const channels = data?.channels ?? [];
  const channel = React.useMemo(
    () => channels.find((c) => c.id === channelId) ?? null,
    [channels, channelId],
  );

  // Index in the full ordered channel list, used for prev/next navigation.
  const index = React.useMemo(
    () => channels.findIndex((c) => c.id === channelId),
    [channels, channelId],
  );
  const prevChannel = index > 0 ? channels[index - 1] : null;
  const nextChannel = index >= 0 && index < channels.length - 1 ? channels[index + 1] : null;

  const fav = channel ? has("channel", channel.id) : false;

  // Suggestions — same category, exclude current, cap at 12.
  const suggestions = React.useMemo(() => {
    if (!channel) return [];
    const cat = channel.category?.slug;
    return channels
      .filter((c) => c.id !== channel.id && c.category?.slug === cat)
      .slice(0, 12);
  }, [channels, channel]);

  if (loading || !channel) {
    return (
      <div>
        {/* Full-width skeleton — edge to edge like YouTube */}
        <div className="shimmer aspect-video w-full bg-muted" />
        <div className="space-y-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="shimmer h-12 w-12 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-4 w-1/3 rounded bg-muted" />
              <div className="shimmer h-3 w-1/4 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const available =
    !!channel.streamUrl && channel.streamType !== "none";

  return (
    <div>
      {/* Full-width video player — edge to edge like YouTube (no side margins) */}
      <Player
        key={channel.id}
        streamUrl={channel.streamUrl ?? null}
        streamType={channel.streamType}
        channelName={channel.nameAr ?? channel.name}
      />

      {/* Padded content below the player */}
      <div className="space-y-4 px-4 py-4">
      {/* Channel info bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <ChannelLogo
          src={channel.logo}
          name={channel.nameAr ?? channel.name}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-extrabold text-foreground">
              {channel.nameAr ?? channel.name}
            </h2>
            {channel.verified && (
              <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                موثّقة
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {channel.country?.name ?? "عربية"} · {channel.category?.name ?? "عامة"}
          </p>
        </div>
        <button
          onClick={async () => {
            await toggle("channel", channel.id);
            toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت إلى المفضلة");
          }}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95",
            fav
              ? "border-gold bg-gold text-white"
              : "border-border bg-card text-muted-foreground hover:text-gold",
          )}
          aria-label={fav ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        >
          <Star className="h-5 w-5" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Previous / Next navigation */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={!prevChannel}
          onClick={() =>
            prevChannel && setView({ name: "player", channelId: prevChannel.id })
          }
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-right shadow-sm transition-all",
            prevChannel
              ? "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              : "cursor-not-allowed opacity-40",
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-emerald">
            <ChevronRight className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold text-muted-foreground">
              السابقة
            </span>
            <span className="block truncate text-sm font-bold text-foreground">
              {prevChannel ? prevChannel.nameAr ?? prevChannel.name : "—"}
            </span>
          </span>
        </button>
        <button
          disabled={!nextChannel}
          onClick={() =>
            nextChannel && setView({ name: "player", channelId: nextChannel.id })
          }
          className={cn(
            "flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-all",
            nextChannel
              ? "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              : "cursor-not-allowed opacity-40",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold text-muted-foreground">
              التالية
            </span>
            <span className="block truncate text-sm font-bold text-foreground">
              {nextChannel ? nextChannel.nameAr ?? nextChannel.name : "—"}
            </span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-emerald">
            <ChevronLeft className="h-5 w-5" />
          </span>
        </button>
      </div>

      {/* Suggestions — same category */}
      <div>
        <SectionHeader
          title="القنوات المقترحة"
          icon={<Radio className="h-5 w-5" />}
        />
        {suggestions.length === 0 ? (
          <EmptyState
            title="لا توجد قنوات مقترحة في نفس الفئة"
            icon={<Tv className="h-6 w-6" />}
          />
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {suggestions.map((c) => (
              <ChannelCard key={c.id} channel={c} />
            ))}
          </div>
        )}
      </div>

      {/* Honest notice when no stream is available */}
      {!available && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
          <MonitorOff className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="leading-relaxed">
            لا تتوفر حالياً أي مصادر بث رسمية موثّقة لهذه القناة. WazaNI
            TV تلتزم بعرض المحتوى المرخّص فقط، ويعمل على إضافة المزيد من
            القنوات التي تملك حقوق البث الرسمية باستمرار.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Internal: video player with custom controls and HLS support         */
/* ------------------------------------------------------------------ */

function Player({
  streamUrl,
  streamType,
  channelName,
}: {
  streamUrl: string | null;
  streamType: string;
  channelName: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  // A nonce lets us force a full re-init from the retry button.
  const [retryNonce, setRetryNonce] = React.useState(0);

  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1);
  const [ready, setReady] = React.useState(false);
  const [streamError, setStreamError] = React.useState(false);

  const isHls = streamType === "hls";
  const isMp4 = streamType === "mp4";
  const hasStream = !!streamUrl && (isHls || isMp4);

  // (Re)initialise the player whenever the source, type or retry nonce changes.
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!streamUrl || (!isHls && !isMp4)) {
      setReady(false);
      setStreamError(false);
      return;
    }

    let hls: HlsType | null = null;
    let cancelled = false;
    setReady(false);
    setStreamError(false);

    const onCanPlay = () => {
      if (!cancelled) setReady(true);
    };
    const onError = () => {
      if (!cancelled) setStreamError(true);
    };
    const onPlay = () => {
      if (!cancelled) setPlaying(true);
    };
    const onPause = () => {
      if (!cancelled) setPlaying(false);
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);

    if (isMp4) {
      // Plain mp4 — let the browser handle it natively.
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {
        /* autoplay can be blocked; user can press play */
      });
    } else if (isHls) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari / iOS).
        video.src = streamUrl;
        video.play().catch(() => {
          /* ignore */
        });
      } else {
        // Fallback to hls.js on other browsers.
        import("hls.js")
          .then(({ default: HlsC }) => {
            if (cancelled || !videoRef.current) return;
            if (HlsC.isSupported()) {
              hls = new HlsC({ enableWorker: true });
              hlsRef.current = hls;
              hls.loadSource(streamUrl);
              hls.attachMedia(video);
              hls.on(HlsC.Events.MANIFEST_PARSED, () => {
                if (!cancelled) setReady(true);
                video.play().catch(() => {
                  /* ignore */
                });
              });
              hls.on(HlsC.Events.ERROR, (_e, data) => {
                if (data.fatal && !cancelled) {
                  setStreamError(true);
                }
              });
            } else {
              if (!cancelled) setStreamError(true);
            }
          })
          .catch(() => {
            if (!cancelled) setStreamError(true);
          });
      }
    }

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
      if (hls) {
        hls.destroy();
        if (hlsRef.current === hls) hlsRef.current = null;
      }
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch {
        /* noop */
      }
    };
  }, [streamUrl, isHls, isMp4, retryNonce]);

  // Keep the video element volume in sync with the slider.
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted || volume === 0;
  }, [volume, muted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => setMuted((m) => !m);

  const requestFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const retry = () => {
    setStreamError(false);
    setReady(false);
    setRetryNonce((n) => n + 1);
    toast.info("جارٍ إعادة المحاولة...");
  };

  // ----- Render states -----
  const showUnavailable = !hasStream;
  const showError = hasStream && streamError;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden bg-emerald-dark"
    >
      {/* Video element is always mounted (controls overlay depends on it) */}
      {!showUnavailable && !showError && (
        <video
          ref={videoRef}
          className="h-full w-full bg-emerald-dark"
          playsInline
          controls={false}
        />
      )}

      {/* Loading overlay — while the manifest is being parsed */}
      {hasStream && !showError && !ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-dark/80 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-xs font-bold">جارٍ تحميل البث...</p>
        </div>
      )}

      {/* Center play button when paused & ready */}
      {hasStream && !showError && ready && !playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-emerald-dark/30 transition-colors hover:bg-emerald-dark/40"
          aria-label="تشغيل"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-white shadow-lg transition-transform hover:scale-105">
            <Play className="h-7 w-7 translate-x-[-2px]" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Error state */}
      {showError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-dark p-6 text-center text-white">
          <MonitorOff className="h-10 w-10 text-gold" />
          <div>
            <p className="text-sm font-extrabold">تعذّر تشغيل البث</p>
            <p className="mt-1 text-xs text-white/70">
              تحقق من اتصالك بالإنترنت أو أعد المحاولة لاحقاً.
            </p>
          </div>
          <button
            onClick={retry}
            className="mt-1 flex h-11 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Unavailable state — no verified stream */}
      {showUnavailable && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-dark p-6 text-center text-white">
          <MonitorOff className="h-10 w-10 text-gold" />
          <div>
            <p className="text-sm font-extrabold">البث غير متاح حالياً</p>
            <p className="mt-1 text-xs text-white/70">
              لا تملك هذه القناة مصدر بث رسمي موثّق.
            </p>
          </div>
          <button
            onClick={retry}
            className="mt-1 flex h-11 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Custom control bar — only when stream is ready */}
      {hasStream && !showError && ready && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-emerald-dark/95 to-transparent px-3 pb-2 pt-6">
          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
          >
            {playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="h-5 w-5 translate-x-[-1px]" fill="currentColor" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>

          <div className="w-24 max-w-[40%] sm:w-32">
            <Slider
              value={[muted ? 0 : Math.round(volume * 100)]}
              min={0}
              max={100}
              step={1}
              onValueChange={(v) => {
                const val = (v[0] ?? 0) / 100;
                setVolume(val);
                if (val > 0) setMuted(false);
                else setMuted(true);
              }}
              aria-label="مستوى الصوت"
            />
          </div>

          <div className="flex-1" />

          <span className="hidden truncate text-xs font-bold text-white/80 sm:block">
            {channelName}
          </span>

          <button
            onClick={retry}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            aria-label="إعادة التحميل"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={requestFullscreen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            aria-label="ملء الشاشة"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
