"use client";

import * as React from "react";
import { Play, Star, BadgeCheck, Eye, TrendingUp } from "lucide-react";
import type { Channel } from "@/lib/types";
import { useNav } from "@/stores/nav";
import { useFavorites } from "@/stores/favorites";
import { ChannelLogo } from "./channel-logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================
//  🎨 لوحات ألوان مدمجة فريدة لكل بطاقة قناة
//  نختار اللون بناءً على تصنيف القناة + معرفها (ثابت لكل قناة)
// ============================================================

interface CardPalette {
  /// التدرج الرئيسي للخلفية (طبقة سفلية)
  bg: string;
  /// توهج راديالي علوي
  glow: string;
  /// لون الحدود
  border: string;
  /// ظل ملوّن
  shadow: string;
  /// لون نص الإضافة (أبيض دائمًا للتباين على الخلفيات الداكنة)
}

/// 12 لوحة ألوان مدمجة زاهية على خلفية سوداء غامقة
const PALETTES: CardPalette[] = [
  { // 1. زمردي ذهبي
    bg: "linear-gradient(145deg, #0a3324 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(0,255,136,0.18) 0%, transparent 55%)",
    border: "rgba(0,255,136,0.35)",
    shadow: "0 6px 18px -6px rgba(0,255,136,0.25)",
  },
  { // 2. ذهبي برتقالي
    bg: "linear-gradient(145deg, #3d2607 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(255,215,0,0.18) 0%, transparent 55%)",
    border: "rgba(255,215,0,0.35)",
    shadow: "0 6px 18px -6px rgba(255,165,0,0.25)",
  },
  { // 3. أحمر وردي ناري
    bg: "linear-gradient(145deg, #3d0a1e 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(255,71,87,0.18) 0%, transparent 55%)",
    border: "rgba(255,71,87,0.35)",
    shadow: "0 6px 18px -6px rgba(255,71,87,0.25)",
  },
  { // 4. بنفسجي ملكي
    bg: "linear-gradient(145deg, #1e0a3d 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(124,92,255,0.18) 0%, transparent 55%)",
    border: "rgba(124,92,255,0.35)",
    shadow: "0 6px 18px -6px rgba(124,92,255,0.25)",
  },
  { // 5. أزرق سماوي
    bg: "linear-gradient(145deg, #0a1e3d 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(79,195,247,0.18) 0%, transparent 55%)",
    border: "rgba(79,195,247,0.35)",
    shadow: "0 6px 18px -6px rgba(79,195,247,0.25)",
  },
  { // 6. تركوازي
    bg: "linear-gradient(145deg, #07303d 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(0,229,255,0.18) 0%, transparent 55%)",
    border: "rgba(0,229,255,0.35)",
    shadow: "0 6px 18px -6px rgba(0,229,255,0.25)",
  },
  { // 7. برتقالي ذهبي
    bg: "linear-gradient(145deg, #3d1e0a 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(255,138,101,0.18) 0%, transparent 55%)",
    border: "rgba(255,138,101,0.35)",
    shadow: "0 6px 18px -6px rgba(255,138,101,0.25)",
  },
  { // 8. وردي فوشيا
    bg: "linear-gradient(145deg, #3d0a2e 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(255,68,170,0.18) 0%, transparent 55%)",
    border: "rgba(255,68,170,0.35)",
    shadow: "0 6px 18px -6px rgba(255,68,170,0.25)",
  },
  { // 9. أخضر ليموني
    bg: "linear-gradient(145deg, #1e3d0a 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(170,255,0,0.18) 0%, transparent 55%)",
    border: "rgba(170,255,0,0.35)",
    shadow: "0 6px 18px -6px rgba(170,255,0,0.25)",
  },
  { // 10. نيلي ملكي
    bg: "linear-gradient(145deg, #0a0a3d 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(99,102,241,0.18) 0%, transparent 55%)",
    border: "rgba(99,102,241,0.35)",
    shadow: "0 6px 18px -6px rgba(99,102,241,0.25)",
  },
  { // 11. فيروزي
    bg: "linear-gradient(145deg, #073d3d 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(45,212,191,0.18) 0%, transparent 55%)",
    border: "rgba(45,212,191,0.35)",
    shadow: "0 6px 18px -6px rgba(45,212,191,0.25)",
  },
  { // 12. عنابي خمري
    bg: "linear-gradient(145deg, #2e072e 0%, #0a0a0a 60%)",
    glow: "radial-gradient(circle at 80% 0%, rgba(217,70,239,0.18) 0%, transparent 55%)",
    border: "rgba(217,70,239,0.35)",
    shadow: "0 6px 18px -6px rgba(217,70,239,0.25)",
  },
];

/** يختار لوحة ألوان ثابتة لكل قناة بناءً على معرفها */
function pickPalette(channelId: string): CardPalette {
  // اجمع أحرف المعرف لتحويلها لرقم ثابت
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = ((hash << 5) - hash + channelId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETTES.length;
  return PALETTES[idx];
}

/** ينسّق عدد المشاهدات بشكل مختصر: 1234 → "1.2K"، 1500000 → "1.5M" */
function formatViews(count: number): string {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(count);
}

/**
 * 📊 يولّد عدد مشاهدة ديكوري ثابت لكل قناة (من معرّفها).
 * النطاق: 500 → 6500 (أرقام غير مستديرة لتبدو واقعية).
 * نفس القناة = نفس الرقم دائمًا (حتمي).
 *
 * ملاحظة: هذه أرقام تجميلية للعرض فقط، ليست مشاهدات حقيقية.
 */
function generateDecorativeViews(channelId: string): number {
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = ((hash << 5) - hash + channelId.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);
  // النطاق الأساسي: 500 → 6500
  const base = 500 + (absHash % 6000);
  // تذبذب لجعل الرقم غير مستدير (0 → 899)
  const jitter = (absHash >> 8) % 900;
  return base + jitter;
}

export function ChannelCard({ channel }: { channel: Channel }) {
  const setView = useNav((s) => s.setView);
  const has = useFavorites((s) => s.has);
  const toggle = useFavorites((s) => s.toggle);
  const fav = has("channel", channel.id);

  const available = !!channel.streamUrl && channel.streamType !== "none";
  const palette = pickPalette(channel.id);

  return (
    <button
      onClick={() => setView({ name: "player", channelId: channel.id })}
      className="group relative flex w-[150px] shrink-0 flex-col gap-2 rounded-2xl p-3 text-right transition-transform duration-200 will-change-transform active:scale-[0.98] hover:-translate-y-1"
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
        contain: "layout style paint",
      }}
    >
      {/* توهج رادياري علوي ملوّن */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: palette.glow }}
      />
      {/* لمعة علوية داخلية */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
      />
      {/* لمعان يمر عند hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
        }}
      />

      <div className="relative">
        <ChannelLogo src={channel.logo} name={channel.nameAr ?? channel.name} size={128} className="mx-auto !rounded-xl" />
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-emerald-dark/0 opacity-0 transition-all group-hover:bg-emerald-dark/40 group-hover:opacity-100">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
              boxShadow: "0 6px 18px -4px color-mix(in srgb, var(--accent) 60%, transparent)",
            }}
          >
            <Play className="h-5 w-5 translate-x-[-1px]" fill="currentColor" />
          </span>
        </span>
        {channel.verified && (
          <span
            className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-card"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
            }}
          >
            <BadgeCheck className="h-3.5 w-3.5" />
          </span>
        )}
        {available ? (
          <span
            className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #000) 100%)",
              animation: "wazani-live-pulse 2s ease-in-out infinite",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            متاح
          </span>
        ) : (
          <span className="absolute bottom-1 right-1 rounded-full bg-muted-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            غير متاح
          </span>
        )}
      </div>
      <div className="relative min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{channel.nameAr ?? channel.name}</p>
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[11px] text-muted-foreground">
            {channel.country?.name ?? "عربية"} · {channel.category?.name ?? "عامة"}
          </p>
          {/* 📊 شارة نسبة المشاهدة (ديكوري ثابت لكل قناة) */}
          <span
            className="flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px] font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,255,136,0.05))",
              border: "1px solid rgba(0,255,136,0.3)",
              color: "#00FF88",
            }}
          >
            <Eye className="h-2.5 w-2.5" />
            {formatViews(generateDecorativeViews(channel.id))}
          </span>
        </div>
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
          fav ? "text-white" : "bg-card text-muted-foreground hover:text-gold border border-border",
        )}
        style={
          fav
            ? {
                background: "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-deep) 100%)",
                boxShadow: "0 4px 12px -2px color-mix(in srgb, var(--accent) 55%, transparent)",
              }
            : undefined
        }
      >
        <Star className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
      </span>
    </button>
  );
}
