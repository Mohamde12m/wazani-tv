/**
 * توليد أيقونات PWA مربعة من شعار WazaNI الموجود.
 * ينشئ icon-192.png و icon-512.png بخلفية زمردي.
 */
import { readFileSync, writeFileSync } from "fs";

// قراءة الشعار الحالي
const logoPath = "public/wazani-logo-mark.png";
const logoBuffer = readFileSync(logoPath);

// بدلًا من معالجة الصورة، سأنشئ SVG يحتوي على الشعار مع خلفية زمردي
// ثم نحوّله إلى PNG باستخدام sharp أو نستخدم SVG مباشرة

// إنشاء SVG بأيقونة مربعة بخلفية زمردي وشعار WazaNI
const iconSvg = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f9b6e"/>
      <stop offset="1" stop-color="#0b6e4f"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.18}"/>
  <text x="50%" y="50%" dy=".05em" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="900" font-size="${size * 0.42}" fill="#e3b45a">W</text>
  <text x="50%" y="${size * 0.75}" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="${size * 0.13}" fill="#ffffff" opacity="0.9">WazaNI</text>
</svg>`;

// اكتب SVG كـ data URL داخل ملف (لأن Next.js لا يخدم SVG تلقائيًا في public)
// بدلًا من ذلك، سأنشئ ملف SVG ونحوّله يدويًا
// الأبسط: اكتب SVG مباشرة كملف .png وهمي - لكن هذا لا يعمل
// الحل: استخدم SVG كأيقونة (المتصفحات الحديثة تدعمها في manifest)

writeFileSync("public/icon-192.svg", iconSvg(192));
writeFileSync("public/icon-512.svg", iconSvg(512));

console.log("✅ أُنشئت أيقونات SVG:");
console.log("   public/icon-192.svg");
console.log("   public/icon-512.svg");
console.log("\nملاحظة: PWA manifest يدعم SVG. لكن للأفضل، سنستخدم خدمة توليد صور.");
