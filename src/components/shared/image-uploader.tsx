"use client";

import * as React from "react";
import { Upload, X, Loader2, FolderOpen, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ImageUploader — رفع صورة من جهاز المستخدم (ملفات الهاتف أو الحاسوب)
 *
 * - يفتح مدير الملفات مباشرة (بدون كاميرا)
 * - يضغط الصورة تلقائيًا إلى 256px JPEG ~15KB
 * - يُرجع النتيجة كـ data URL (يُخزّن في قاعدة البيانات كنص)
 * - يستخدم في: شعارات القنوات، شعارات الفرق (المضيف/الضيف)، شعارات البطولات، شعارات الدول
 *
 * @example
 * <ImageUploader value={form.logo} onChange={(v) => set("logo", v)} label="شعار القناة" />
 */

interface ImageUploaderProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  hint?: string;
  /** حجم المعاينة (px) */
  previewSize?: number;
  className?: string;
}

const TARGET_SIZE = 256; // px
const JPEG_QUALITY = 0.85;

export function ImageUploader({
  value,
  onChange,
  label,
  hint,
  previewSize = 72,
  className,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // تحقق من النوع
    if (!file.type.startsWith("image/")) {
      setError("الملف ليس صورة");
      return;
    }

    // تحقق من الحجم (10MB كحد أقصى قبل الضغط)
    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة كبير جدًا (الحد 10MB)");
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await compressImage(file, TARGET_SIZE, JPEG_QUALITY);
      onChange(dataUrl);
    } catch (e) {
      console.error("Image compress error:", e);
      setError("تعذّر معالجة الصورة");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // إعادة تعيين ليُمكن رفع نفس الملف مرة أخرى
    e.target.value = "";
  };

  const handleClear = () => {
    onChange(null);
    setError(null);
  };

  const hasImage = !!value;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-bold text-foreground">{label}</label>
      )}

      <div className="flex items-center gap-3">
        {/* المعاينة */}
        <div
          className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-secondary"
          style={{ width: previewSize, height: previewSize }}
        >
          {hasImage ? (
            <img
              src={value!}
              alt={label ?? "معاينة"}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-5 w-5 animate-spin text-emerald" />
            </div>
          )}
        </div>

        {/* أزرار التحكم */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={`upload-${label ?? "img"}`}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-dark disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {hasImage ? "تغيير الصورة" : "رفع من الجهاز"}
            </label>
            <input
              ref={inputRef}
              id={`upload-${label ?? "img"}`}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              disabled={loading}
              className="hidden"
            />
            {hasImage && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-4 w-4" />
                حذف
              </button>
            )}
          </div>
          {hasImage && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald">
              <CheckCircle2 className="h-3 w-3" />
              <span>تم رفع الصورة</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-destructive">
              <X className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}
          {hint && !hasImage && !error && (
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * يضغط الصورة إلى حجم محدد ويحوّلها إلى JPEG data URL
 */
async function compressImage(
  file: File,
  targetSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // احسب الأبعاد مع الحفاظ على النسبة
        let { width, height } = img;
        if (width > height) {
          if (width > targetSize) {
            height = Math.round((height * targetSize) / width);
            width = targetSize;
          }
        } else {
          if (height > targetSize) {
            width = Math.round((width * targetSize) / height);
            height = targetSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        // خلفية بيضاء للصور الشفافة (PNG)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}
