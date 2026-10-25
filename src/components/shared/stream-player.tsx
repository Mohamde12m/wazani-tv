"use client";

import * as React from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize2,
  PictureInPicture2,
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize,
} from "lucide-react";

export type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "none";

interface StreamPlayerProps {
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
 * WazaNI TV — مشغل فيديو احترافي باستخدام hls.js وأيقونات Lucide.
 *
 * المميزات:
 * - أيقونات متجهة احترافية (Lucide) مع تأثيرات زجاجية (glass-morphism)
 * - زر تشغيل كبير في المنتصف عند الإيقاف مع توهج نابض
 * - إخفاء تلقائي للأزرار بعد 3 ثوانٍ من الخمول أثناء التشغيل
 * - مؤشر تحميل أنيق أثناء التخزين المؤقت
 * - ملء الشاشة مع تدوير تلقائي للهاتف (landscape)
 * - PiP، تحكم بالصوت، شعار القناة كخلفية عند التوقف
 * - دعم لوحة المفاتيح: مسافة = تشغيل/إيقاف، F = ملء الشاشة، M = كتم
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
}: StreamPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPip, setIsPip] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isBuffering, setIsBuffering] = React.useState(true);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  // وضع التدوير القسري (force-landscape): يُفعّل عند الضغط على زر التدوير أو ملء الشاشة
  // على الأجهزة التي لا تدعم screen.orientation.lock (iOS Safari)
  const [forceLandscape, setForceLandscape] = React.useState(false);

  // كشف اتجاه الشاشة الحالي
  const portrait = useIsPortrait();

  // تهيئة المشغل
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsPlaying(false);
    setHasStarted(false);
    setIsBuffering(true);

    if (!src || kind === "none") {
      setIsBuffering(false);
      onReady?.();
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handlePlay = () => { setIsPlaying(true); setHasStarted(true); setIsBuffering(false); };
    const handlePlaying = () => { setIsPlaying(true); setIsBuffering(false); };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleVolume = () => setIsMuted(video.muted);
    const handleEnterPip = () => setIsPip(true);
    const handleLeavePip = () => setIsPip(false);
    const handleError = () => { setIsBuffering(false); onError?.(); };

    video.addEventListener("play", handlePlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("volumechange", handleVolume);
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
            setIsMuted(true);
            video.play().catch(() => {});
          } else {
            setIsBuffering(false);
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) { setIsBuffering(false); onError?.(); }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        onReady?.();
        if (autoplay) {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        } else {
          setIsBuffering(false);
        }
      } else {
        setIsBuffering(false);
        onError?.();
      }
    } else if (kind === "mp4" || kind === "dash") {
      video.src = src;
      onReady?.();
      if (autoplay) {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      } else {
        setIsBuffering(false);
      }
    } else if (kind === "youtube") {
      setIsBuffering(false);
      onError?.();
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("volumechange", handleVolume);
      video.removeEventListener("enterpictureinpicture", handleEnterPip);
      video.removeEventListener("leavepictureinpicture", handleLeavePip);
      video.removeEventListener("error", handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, kind, autoplay, onError, onReady, reloadNonce]);

  // تتبع حالة ملء الشاشة + تفعيل force-landscape تلقائيًا عند الدخول لملء الشاشة
  React.useEffect(() => {
    const handleFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        // عند الخروج من ملء الشاشة، أعد الاتجاه للعمودي + أوقف التدوير القسري
        setForceLandscape(false);
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            unlock?: () => void;
          };
          orientation?.unlock?.();
        } catch { /* noop */ }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // كشف تدوير الهاتف الفعلي (orientationchange) — عند الدخول لملء الشاشة + تدوير الجهاز، فعّل force-landscape
  React.useEffect(() => {
    const handleOrient = () => {
      // إذا كان المستخدم في ملء الشاشة ولا تزال الشاشة عمودية، فعّل التدوير القسري
      if (document.fullscreenElement && portrait) {
        setForceLandscape(true);
      }
    };
    window.addEventListener("orientationchange", handleOrient);
    window.addEventListener("resize", handleOrient);
    return () => {
      window.removeEventListener("orientationchange", handleOrient);
      window.removeEventListener("resize", handleOrient);
    };
  }, [portrait]);

  // إخفاء تلقائي للأزرار بعد 3 ثوانٍ من الخمول أثناء التشغيل
  const scheduleHide = React.useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  const revealControls = React.useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  React.useEffect(() => {
    if (isPlaying) scheduleHide();
    else setShowControls(true);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, scheduleHide]);

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
    setIsMuted(video.muted);
    // عند إلغاء الكتم، ارفع الصوت قليلًا إذا كان صفرًا
    if (!video.muted && video.volume === 0) video.volume = 0.7;
  };

  // ملء الشاشة مع تدوير تلقائي للهاتف (landscape)
  // استراتيجية: 1) requestFullscreen → 2) screen.orientation.lock('landscape') (Android) →
  // 3) إذا فشل/fشاشة عمودية، فعّل force-landscape (CSS rotation) لملء الشاشة بالعرض
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        // الخروج يُعالَج في handleFsChange (يعيد forceLandscape=false)
      } else {
        await container.requestFullscreen();
        // حاول قفل الاتجاه أفقيًا (يعمل على Android Chrome)
        let locked = false;
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: "landscape" | "portrait") => Promise<void>;
        };
        if (orientation?.lock) {
          try {
            await orientation.lock("landscape");
            locked = true;
          } catch { /* iOS Safari لا يدعم هذا، أو يتطلب HTTPS + user gesture */ }
        }
        // إذا لم يُقفل الاتجاه ولا تزال الشاشة عمودية، فعّل التدوير القسري بالـ CSS
        if (!locked) {
          // تحقق بعد لحظة قصيرة: قد يكون المتصفح قد دوّر الشاشة فعليًا
          setTimeout(() => {
            const stillPortrait =
              (typeof window !== "undefined" &&
                (window.matchMedia?.("(orientation: portrait)").matches ??
                  window.innerHeight > window.innerWidth));
            if (stillPortrait) {
              setForceLandscape(true);
            }
          }, 100);
        }
      }
    } catch { /* noop */ }
  };

  // زر تدوير مستقل (للأجهزة التي تريد التدوير دون ملء الشاشة)
  const toggleRotate = () => {
    setForceLandscape((v) => !v);
  };

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

  const reload = () => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  };

  // دعم لوحة المفاتيح
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "m":
        e.preventDefault();
        toggleMute();
        break;
    }
  };

  const showBackground =
    !src ||
    kind === "none" ||
    isPip ||
    (!isPlaying && !hasStarted) ||
    (!isPlaying && hasStarted);

  const showCenterPlay = src && kind !== "none" && !isPlaying && !isBuffering && !isPip;
  const controlsVisible = src && kind !== "none" && (showControls || !isPlaying);

  // في وضع force-landscape، objectFit=cover لملء الشاشة بالكامل دون جوانب سوداء
  // في الوضع العادي، objectFit=contain لإظهار كامل الإطار دون قص
  const useCover = isFullscreen || forceLandscape;

  // عند force-landscape، الحاوية الداخلية تدور 90° وتُصبح بحجم الشاشة العمودية
  // الـ container الخارجي يبقى بحجمه العادي، لكن نضع خلفية سوداء كاملة
  const containerStyle: React.CSSProperties = forceLandscape
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        maxHeight: "100dvh",
        aspectRatio: "auto",
        backgroundColor: "#000",
        overflow: "hidden",
        zIndex: 9999,
        cursor: controlsVisible ? "default" : "none",
      }
    : {
        position: "relative",
        backgroundColor: "#0b2820",
        width: "100%",
        aspectRatio: "16 / 9",
        overflow: "hidden",
        cursor: controlsVisible ? "default" : "none",
      };

  // الغلاف الداخلي الذي يحتوي الفيديو: في وضع force-landscape، ندوره 90° ونجعله يملأ الشاشة
  const innerWrapperStyle: React.CSSProperties = forceLandscape
    ? {
        position: "absolute",
        // ندور حول المركز، ثم نوسّط
        top: "50%",
        left: "50%",
        width: "100vh",
        height: "100vw",
        transform: "translate(-50%, -50%) rotate(90deg)",
        transformOrigin: "center center",
      }
    : {
        position: "absolute",
        inset: 0,
      };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onMouseMove={revealControls}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onTouchStart={revealControls}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* الغلاف الداخلي — يدير المحتوى في وضع force-landscape */}
      <div style={innerWrapperStyle}>
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
            background: useCover ? "#000" : "linear-gradient(135deg, #0b2820 0%, #0b6e4f 100%)",
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

      {/* عنصر video — يملأ الـ container بالكامل.
          في وضع ملء الشاشة/force-landscape، نستخدم objectFit=cover لملء الشاشة
          بالكامل دون جوانب سوداء (مع قص طفيف للإطار). في الوضع العادي نستخدم
          contain لإظهار كامل الإطار دون قص. */}
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
          objectFit: useCover ? "cover" : "contain",
          zIndex: 1,
        }}
        onClick={togglePlay}
      />

      {/* مؤشر التحميل — أنيق ومركز */}
      {isBuffering && src && kind !== "none" && !isPip && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            background: "radial-gradient(circle, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <Loader2
              className="animate-spin"
              style={{ width: 30, height: 30, color: "#c9962e" }}
              strokeWidth={2.5}
            />
          </div>
        </div>
      )}

      {/* زر الخروج من وضع التدوير القسري — يظهر فقط في وضع force-landscape */}
      {forceLandscape && !isFullscreen && (
        <button
          onClick={() => setForceLandscape(false)}
          aria-label="إنهاء التدوير"
          className="cp-btn"
          style={{
            position: "absolute",
            top: "max(12px, env(safe-area-inset-top))",
            right: "max(12px, env(safe-area-inset-right))",
            zIndex: 5,
            width: 40,
            height: 40,
          }}
        >
          <Minimize strokeWidth={2.2} className="cp-icon" />
        </button>
      )}

      {/* زر التشغيل الكبير في المنتصف — احترافي مع توهج نابض */}
      {showCenterPlay && (
        <button
          onClick={togglePlay}
          aria-label="تشغيل"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3,
            width: "76px",
            height: "76px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11, 110, 79, 0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.5), 0 0 0 8px rgba(11,110,79,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
            transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease",
            animation: "playerPulse 2.4s ease-in-out infinite",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.08)";
            e.currentTarget.style.boxShadow =
              "0 16px 48px rgba(0,0,0,0.55), 0 0 0 12px rgba(11,110,79,0.22), inset 0 1px 0 rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
            e.currentTarget.style.boxShadow =
              "0 12px 40px rgba(0,0,0,0.5), 0 0 0 8px rgba(11,110,79,0.18), inset 0 1px 0 rgba(255,255,255,0.15)";
          }}
        >
          <Play
            fill="white"
            strokeWidth={1}
            style={{
              width: 34,
              height: 34,
              color: "white",
              marginLeft: 4, // مركز البصري للمثلث
            }}
          />
        </button>
      )}

      {/* شريط التحكم السفلي — زجاجي احترافي */}
      {controlsVisible && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "10px 12px",
            background:
              "linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0) 100%)",
            direction: "ltr",
            transition: "opacity 0.3s ease",
          }}
        >
          {/* زر التشغيل/الإيقاف */}
          <ControlButton onClick={togglePlay} label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}>
            {isPlaying ? (
              <Pause fill="currentColor" strokeWidth={1} className="cp-icon" />
            ) : (
              <Play fill="currentColor" strokeWidth={1} className="cp-icon" style={{ marginLeft: 2 }} />
            )}
          </ControlButton>

          {/* زر إعادة التشغيل */}
          <ControlButton onClick={reload} label="إعادة">
            <RotateCcw className="cp-icon" strokeWidth={2} />
          </ControlButton>

          {/* زر الصوت */}
          <ControlButton onClick={toggleMute} label={isMuted ? "إلغاء الكتم" : "كتم"}>
            {isMuted ? (
              <VolumeX className="cp-icon" strokeWidth={2} />
            ) : (
              <Volume2 className="cp-icon" strokeWidth={2} />
            )}
          </ControlButton>

          <div style={{ flex: 1 }} />

          {/* زر التدوير (يُظهر/يُخفي وضع force-landscape يدويًا) */}
          <ControlButton onClick={toggleRotate} label="تدوير الشاشة" active={forceLandscape}>
            <RotateCwIcon className="cp-icon" strokeWidth={2} />
          </ControlButton>

          {/* زر PiP */}
          <ControlButton onClick={togglePip} label="نافذة عائمة" active={isPip}>
            <PictureInPicture2 className="cp-icon" strokeWidth={2} />
          </ControlButton>

          {/* زر ملء الشاشة */}
          <ControlButton onClick={toggleFullscreen} label={isFullscreen ? "إنهاء ملء الشاشة" : "ملء الشاشة"}>
            {isFullscreen ? (
              <Minimize2 className="cp-icon" strokeWidth={2} />
            ) : (
              <Maximize className="cp-icon" strokeWidth={2} />
            )}
          </ControlButton>
        </div>
      )}

      {/* أنماط CSS المضمّنة */}
      <style>{`
        @keyframes playerPulse {
          0%, 100% { box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 8px rgba(11,110,79,0.18), inset 0 1px 0 rgba(255,255,255,0.15); }
          50% { box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 14px rgba(11,110,79,0.10), inset 0 1px 0 rgba(255,255,255,0.15); }
        }
        .cp-icon { width: 20px; height: 20px; color: white; }
        .cp-btn {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.12);
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
          flex-shrink: 0;
        }
        .cp-btn:hover {
          background: rgba(201,150,46,0.32);
          border-color: rgba(201,150,46,0.55);
          transform: scale(1.08);
        }
        .cp-btn:active {
          transform: scale(0.92);
        }
        .cp-btn[data-active="true"] {
          background: rgba(201,150,46,0.38);
          border-color: rgba(201,150,46,0.6);
        }
      `}</style>
      {/* إغلاق الغلاف الداخلي (force-landscape wrapper) */}
      </div>
    </div>
  );
}

/** كشف ما إذا كانت الشاشة عمودية (portrait) */
function useIsPortrait() {
  const [portrait, setPortrait] = React.useState(true);
  React.useEffect(() => {
    const check = () => {
      setPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);
  return portrait;
}

/** أيقونة تدوير عقارب الساعة (Lucide لا يصدر RotateCw مباشرة، نستخدم ماكرو) */
function RotateCwIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

/** زر تحكم احترافي بحجم ثابت وتأثيرات زجاجية */
function ControlButton({
  onClick,
  label,
  active = false,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-active={active ? "true" : "false"}
      className="cp-btn"
    >
      {children}
    </button>
  );
}
