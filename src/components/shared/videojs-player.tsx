"use client";

import * as React from "react";
import videojs, { type Player } from "video.js";
import "video.js/dist/video-js.css";
import "@/lib/videojs-theme.css";

// Side-effect plugin registrations.
// - @videojs/http-streaming: HLS (.m3u8) + DASH (.mpd) support via VHS.
// - videojs-youtube: YouTube live/VOD tech (loaded lazily, only when a
//   youtube source is used, to avoid pulling the iframe API eagerly).
import "@videojs/http-streaming";

export type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "none";

interface VideoJsPlayerProps {
  /** The stream URL (m3u8, mpd, mp4, or youtube watch/embed URL). */
  src: string | null;
  /** Stream kind — decides the MIME type / YouTube tech. */
  kind: StreamKind;
  /** Poster image (channel logo) shown before play. */
  poster?: string | null;
  /** Whether to autoplay on load (muted by default to satisfy browsers). */
  autoplay?: boolean;
  /** Called when the player reports an unrecoverable error. */
  onError?: () => void;
  /** Called once when the player is ready to play. */
  onReady?: () => void;
  /** A nonce that, when changed, forces a full reload of the source. */
  reloadNonce?: number;
  className?: string;
}

/**
 * WazaNI TV — official video player (Video.js 8).
 *
 * Supports HLS (.m3u8), DASH (.mpd), MP4, and YouTube live/VOD streams with
 * a premium emerald/gold themed UI, native controls, fullscreen, ABR
 * quality switching (via VHS), and robust error handling with retry.
 *
 * ✨ تحسين: خلفية المشغل تعرض شعار القناة بدلًا من الأسود عندما:
 *   - الفيديو في وضع PiP (Picture-in-Picture)
 *   - الفيديو متوقف أو لم يبدأ بعد
 *   - لا يوجد بث متاح
 */
export function VideoJsPlayer({
  src,
  kind,
  poster,
  autoplay = true,
  onError,
  onReady,
  reloadNonce = 0,
  className,
}: VideoJsPlayerProps) {
  const containerRef = React.useRef<HTMLVideoElement>(null);
  const playerRef = React.useRef<Player | null>(null);
  const erroredRef = React.useRef(false);

  // حالة المشغل — لتحديد متى تظهر خلفية الشعار
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPip, setIsPip] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);

  // Resolve the Video.js source object from our `kind` + `src`.
  const source = React.useMemo(() => {
    if (!src || kind === "none") return null;
    if (kind === "youtube") {
      return { src, type: "video/youtube" };
    }
    if (kind === "hls") {
      return { src, type: "application/x-mpegURL" };
    }
    if (kind === "dash") {
      return { src, type: "application/dash+xml" };
    }
    return { src, type: "video/mp4" };
  }, [src, kind]);

  // Initialise the player once on mount.
  React.useEffect(() => {
    if (!containerRef.current) return;

    const isYoutube = kind === "youtube";

    const player = videojs(containerRef.current, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      responsive: true,
      poster: poster ?? undefined,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      controlBar: {
        pictureInPictureToggle: true,
        volumePanel: { inline: true },
      },
      techOrder: isYoutube ? ["youtube", "html5"] : ["html5"],
      youtube: isYoutube
        ? { ytControls: false, rel: 0, modestbranding: true, iv_load_policy: 3 }
        : undefined,
    });

    playerRef.current = player;

    player.on("ready", () => {
      player.addClass("vjs-wazani");
      onReady?.();
    });
    player.on("error", () => {
      if (erroredRef.current) return;
      erroredRef.current = true;
      onError?.();
    });

    // تتبع حالة التشغيل — لعرض/إخفاء خلفية الشعار
    player.on("play", () => {
      setIsPlaying(true);
      setHasStarted(true);
    });
    player.on("playing", () => {
      setIsPlaying(true);
      setHasStarted(true);
    });
    player.on("pause", () => setIsPlaying(false));
    player.on("ended", () => setIsPlaying(false));
    player.on("enterpictureinpicture", () => setIsPip(true));
    player.on("leavepictureinpicture", () => setIsPip(false));

    // تتبع PiP عبر document.pictureInPictureElement أيضًا
    const handlePipChange = () => {
      setIsPip(!!document.pictureInPictureElement);
    };
    document.addEventListener("enterpictureinpicture", handlePipChange);
    document.addEventListener("leavepictureinpicture", handlePipChange);

    // Lazy-load the YouTube tech only when actually needed.
    if (isYoutube) {
      import("videojs-youtube")
        .then(() => {
          /* plugin self-registers on videojs global */
        })
        .catch(() => {
          /* non-fatal: falls back to html5 */
        });
    }

    return () => {
      try {
        player.dispose();
      } catch {
        /* noop */
      }
      playerRef.current = null;
      erroredRef.current = false;
      document.removeEventListener("enterpictureinpicture", handlePipChange);
      document.removeEventListener("leavepictureinpicture", handlePipChange);
    };
  }, []);

  // Load / reload the source when `source` or `reloadNonce` changes.
  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    erroredRef.current = false;
    setHasStarted(false);
    setIsPlaying(false);

    if (!source) {
      try {
        player.reset();
      } catch {
        /* noop */
      }
      return;
    }

    const applySource = () => {
      try {
        player.src(source);
        // Only attempt autoplay after the source has loaded (canplay) to
        // avoid "Illegal invocation" errors from calling play() too early.
        if (autoplay) {
          // Mute first so browsers allow autoplay, then play after the
          // source has loaded (canplay) to avoid "Illegal invocation".
          player.muted(true);
          const startPlay = () => {
            try {
              const p = player.play();
              if (p && typeof (p as Promise<void>).catch === "function") {
                (p as Promise<void>).catch(() => {
                  /* autoplay can be blocked until user gesture */
                });
              }
            } catch {
              /* noop */
            }
          };
          player.one("canplay", startPlay);
        }
      } catch {
        onError?.();
      }
    };

    // If the player isn't ready yet, wait for the ready event.
    if (player.isReady_) {
      applySource();
    } else {
      player.one("ready", applySource);
    }
  }, [source, reloadNonce, autoplay, onError]);

  // هل تظهر خلفية الشعار؟
  // نعم عندما: لا يوجد بث، أو الفيديو في PiP، أو الفيديو متوقف ولم يبدأ، أو متوقف
  const showBackground = !source || isPip || (!isPlaying && !hasStarted) || (!isPlaying && hasStarted);

  return (
    <div data-vjs-player className={className} style={{ position: "relative", backgroundColor: "#0b2820" }}>
      {/* طبقة خلفية: شعار القناة — تظهر بدلًا من الأسود */}
      {showBackground && poster && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0b2820 0%, #0b6e4f 100%)",
            pointerEvents: "none",
          }}
        >
          <img
            src={poster}
            alt="شعار القناة"
            style={{
              maxWidth: "60%",
              maxHeight: "60%",
              objectFit: "contain",
              opacity: 0.85,
              filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))",
            }}
          />
        </div>
      )}
      <video
        ref={containerRef}
        className="video-js vjs-big-play-centered vjs-fluid"
        style={{ position: "relative", zIndex: 1 }}
        playsInline
        controls={false}
      />
    </div>
  );
}
