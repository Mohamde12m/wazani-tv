"use client";

import * as React from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize2,
  PictureInPicture2,
  Loader2,
  RotateCcw,
  Minimize,
} from "lucide-react";

export type StreamKind = "hls" | "dash" | "mp4" | "youtube" | "iframe" | "none";

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
  // وضع التدوير القسري (force-landscape): يُفعّل تلقائيًا عند الضغط على ملء الشاشة
  // إذا كانت الشاشة عمودية، ليُظهر الفيديو أفقيًا فورًا دون ضغط زر إضافي.
  // على الأجهزة التي لا تدعم screen.orientation.lock (iOS Safari)، هذا هو
  // الأسلوب الوحيد للتدوير. إذا نجح orientation.lock على Android، يُلغى هذا
  // الوضع تلقائيًا عبر مستمع orientationchange.
  const [forceLandscape, setForceLandscape] = React.useState(false);

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
    } else if (kind === "iframe") {
      // iframe يعمل بشكل مستقل — لا نحتاج hls.js أو video element
      setIsBuffering(false);
      setHasStarted(true);
      setIsPlaying(true);
      onReady?.();
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

  // كشف التدوير النظامي للهاتف: إذا أصبحت الشاشة أفقية فعليًا (عبر
  // screen.orientation.lock أو تدوير المستخدم للجهاز)، أوقف التدوير القسري
  // (force-landscape) لتجنب التدوير المزدوج. هذا يضمن عرضًا أفقيًا نظيفًا.
  React.useEffect(() => {
    const handleOrient = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && forceLandscape) {
        setForceLandscape(false);
      }
    };
    // تأخير بسيط ليكتشف التغيير بعد اكتمال الانتقال
    const debounced = () => setTimeout(handleOrient, 150);
    window.addEventListener("orientationchange", debounced);
    window.addEventListener("resize", debounced);
    return () => {
      window.removeEventListener("orientationchange", debounced);
      window.removeEventListener("resize", debounced);
    };
  }, [forceLandscape]);

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

  // ملء الشاشة مع تدوير تلقائي فوري للهاتف (landscape)
  // الاستراتيجية:
  // 1) فعّل force-landscape فورًا إذا الشاشة عمودية → المستخدم يرى الفيديو أفقيًا
  //    مباشرة دون ضغط زر إضافي (هذا يعمل حتى لو فشل requestFullscreen على iOS Safari)
  // 2) حاول requestFullscreen() (يعمل على Android Chrome / Desktop)
  // 3) حاول screen.orientation.lock('landscape') بالتوازي (Android Chrome)
  //    إذا نجح ودوّر الجهاز فعليًا، الـ effect أعلاه سيكتشف ذلك ويُلغي force-landscape
  //    تلقائيًا لتجنب التدوير المزدوج.
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        // الخروج يُعالَج في handleFsChange (يعيد forceLandscape=false)
      } else {
        // سجّل الحالة قبل الدخول لملء الشاشة
        const wasPortrait = window.innerHeight > window.innerWidth;
        // فعّل التدوير القسري فورًا إذا كانت الشاشة عمودية — هذا يضمن
        // أن المستخدم يرى الفيديو أفقيًا مباشرة دون ضغط زر إضافي.
        // نفعّله قبل requestFullscreen حتى لو فشلت (iOS Safari)، يبقى التدوير يعمل.
        if (wasPortrait) {
          setForceLandscape(true);
        }
        // حاول ملء الشاشة (Android Chrome / Desktop) — لا تُعرقل العملية إذا فشلت
        try {
          await container.requestFullscreen();
        } catch { /* iOS Safari قد لا يدعم requestFullscreen على عناصر غير video */ }
        // حاول قفل الاتجاه أفقيًا (Android Chrome) — بالتوازي، دون انتظار
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (o: "landscape" | "portrait") => Promise<void>;
        };
        if (orientation?.lock) {
          orientation.lock("landscape").catch(() => {
            /* iOS Safari لا يدعم، أو يتطلب HTTPS + user gesture —
               لا مشكلة: force-landscape مُفعّل بالفول */
          });
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

      {/* عنصر video أو iframe حسب نوع البث.
          - hls/dash/mp4: يُستخدم <video> مع hls.js
          - iframe: يُستخدم <iframe> مع صفحة HTML مُولّدة تحمل السكريبت/الرابط
            (لأن الرابط قد يكون سكريبت JS وليس صفحة HTML كاملة)
          في وضع ملء الشاشة/force-landscape، نستخدم objectFit=cover لملء الشاشة
          بالكامل دون جوانب سوداء (مع قص طفيف للإطار). في الوضع العادي نستخدم
          contain لإظهار كامل الإطار دون قص. */}
      {kind === "iframe" && src ? (
        <IframePlayer
          src={src}
          poster={poster}
          onReady={() => {
            setHasStarted(true);
            setIsPlaying(true);
            setIsBuffering(false);
            onReady?.();
          }}
        />
      ) : (
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
      )}

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

/**
 * مشغل iframe ذكي — يكتشف نوع الرابط ويعرضه بشكل صحيح:
 * - إذا كان الرابط سكريبت JS (.js أو content-type: application/javascript):
 *   ينشئ صفحة HTML مُولّدة تحمل السكريبت داخل container
 * - إذا كان الرابط صفحة HTML كاملة: يعرضه في iframe مباشرة
 * - إذا كان رابط YouTube embed: يعرضه مباشرة
 * - يدعم ملء الشاشة، PiP، التشغيل التلقائي
 */
function IframePlayer({
  src,
  poster,
  onReady,
}: {
  src: string;
  poster?: string | null;
  onReady?: () => void;
}) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);

    // اكتشف نوع الرابط
    const isJavascriptUrl =
      src.endsWith(".js") ||
      src.includes(".js?") ||
      src.includes("script");

    const isHtmlPage =
      src.includes("/embed/") ||
      src.includes("/player") ||
      src.includes("youtube.com/embed") ||
      src.includes("youtu.be") ||
      src.includes("dailymotion.com/embed") ||
      src.includes("twitch.tv/embed") ||
      src.includes("vimeo.com");

    let finalSrc = src;

    if (isJavascriptUrl && !isHtmlPage) {
      // الرابط سكريبت JS — أنشئ صفحة HTML تحمل السكريبت
      const html = `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #player { width: 100%; height: 100%; }
    #player > * { width: 100% !important; height: 100% !important; }
    #player video { width: 100% !important; height: 100% !important; object-fit: contain; }
    #player iframe { width: 100% !important; height: 100% !important; border: none; }
    #player div { width: 100% !important; height: 100% !important; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    // حاوية لتثبيت المشغل
    window.player = document.getElementById('player');
  </script>
  <script src="${src}"></script>
  <script>
    // أبلغ الحاوية أن السكريبت تم تحميله
    window.parent.postMessage({ type: 'iframe-ready' }, '*');
  </script>
</body>
</html>`;
      finalSrc = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    }

    setIframeSrc(finalSrc);
    // أبلغ عن الجاهزية بعد فترة قصيرة
    const t = setTimeout(() => {
      setLoading(false);
      onReady?.();
    }, 800);
    return () => clearTimeout(t);
  }, [src, onReady]);

  // استمع لرسائل من الـ iframe
  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "iframe-ready") {
        setLoading(false);
        onReady?.();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onReady]);

  return (
    <>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
          }}
        >
          <Loader2
            className="animate-spin"
            style={{ width: 36, height: 36, color: "#c9962e" }}
            strokeWidth={2.5}
          />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="بث مباشر"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; camera; microphone"
        allowFullScreen
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-modals"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
          zIndex: 1,
          backgroundColor: "#000",
        }}
      />
    </>
  );
}
