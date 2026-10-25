"use client";

import * as React from "react";
import Hls from "hls.js";

export type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "none";

interface VideoJsPlayerProps {
  src: string | null;
  kind: StreamKind;
  poster?: string | null;
  autoplay?: boolean;
  onError?: () => void;
  onReady?: () => void;
  reloadNonce?: number;
  className?: string;
}

/**
 * WazaNI TV — مشغل فيديو بسيط وموثوق باستخدام hls.js.
 *
 * المميزات:
 * - يدعم HLS (.m3u8) عبر hls.js و MP4 مباشرة
 * - ملء الشاشة مع تدوير تلقائي للهاتف (landscape)
 * - PiP، تحكم بالصوت، شعار القناة كخلفية عند التوقف
 * - بدون شعار/اسم قناة فوق الفيديو — نظيف تمامًا
 */
export function StreamPlayer({
  src,
  kind,
  poster,
  autoplay = true,
  onError,
  onReady,
  reloadNonce = 0,
  className,
}: VideoJsPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPip, setIsPip] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [showControls, setShowControls] = React.useState(false);

  // تهيئة المشغل
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsPlaying(false);
    setHasStarted(false);

    if (!src || kind === "none") {
      onReady?.();
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handlePlay = () => { setIsPlaying(true); setHasStarted(true); };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleEnterPip = () => setIsPip(true);
    const handleLeavePip = () => setIsPip(false);
    const handleError = () => onError?.();

    video.addEventListener("play", handlePlay);
    video.addEventListener("playing", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("enterpictureinpicture", handleEnterPip);
    video.addEventListener("leavepictureinpicture", handleLeavePip);
    video.addEventListener("error", handleError);

    if (kind === "hls") {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          onReady?.();
          if (autoplay) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) onError?.();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        onReady?.();
        if (autoplay) {
          video.muted = true;
          video.play().catch(() => {});
        }
      }
    } else if (kind === "mp4" || kind === "dash") {
      video.src = src;
      onReady?.();
      if (autoplay) {
        video.muted = true;
        video.play().catch(() => {});
      }
    } else if (kind === "youtube") {
      onError?.();
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("playing", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("enterpictureinpicture", handleEnterPip);
      video.removeEventListener("leavepictureinpicture", handleLeavePip);
      video.removeEventListener("error", handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, kind, autoplay, onError, onReady, reloadNonce]);

  const showBackground = !src || kind === "none" || isPip || (!isPlaying && !hasStarted) || (!isPlaying && hasStarted);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  // ملء الشاشة مع تدوير تلقائي للهاتف (landscape)
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
        // تدوير تلقائي للهاتف عند ملء الشاشة
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: "landscape" | "portrait") => Promise<void>;
        };
        if (orientation?.lock) {
          try {
            await orientation.lock("landscape");
          } catch { /* browsers may block orientation lock */ }
        }
      }
    } catch { /* noop */ }
  };

  // عند الخروج من ملء الشاشة، أعد الاتجاه للعمودي
  React.useEffect(() => {
    const handleFsChange = async () => {
      if (!document.fullscreenElement) {
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            unlock?: () => void;
          };
          orientation?.unlock?.();
        } catch { /* noop */ }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch { /* noop */ }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", backgroundColor: "#0b2820", width: "100%", aspectRatio: "16 / 9", overflow: "hidden" }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* طبقة خلفية: شعار القناة — يظهر فقط عندما لا يوجد بث أو الفيديو متوقف */}
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
            alt=""
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

      {/* عنصر video — يملأ الـ container بالكامل */}
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        playsInline
        controls={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          zIndex: 1,
        }}
        onClick={togglePlay}
      />

      {/* أزرار التحكم */}
      {src && kind !== "none" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            display: showControls || !isPlaying ? "flex" : "none",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
            color: "white",
            direction: "ltr",
          }}
        >
          <button onClick={togglePlay} style={btnStyle} aria-label="تشغيل/إيقاف">
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={toggleMute} style={btnStyle} aria-label="كتم">
            🔊
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={togglePip} style={btnStyle} aria-label="PiP">
            ⧉
          </button>
          <button onClick={toggleFullscreen} style={btnStyle} aria-label="ملء الشاشة">
            ⛶
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.5)",
  border: "none",
  color: "white",
  fontSize: "18px",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
