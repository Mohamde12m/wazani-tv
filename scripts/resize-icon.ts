import { readFileSync, writeFileSync } from "fs";
// استخدام sharp لتغيير حجم الصورة
try {
  const sharp = (await import("sharp")).default;
  const buf = readFileSync("public/icon-1024.png");
  // 192x192
  await sharp(buf).resize(192, 192).png().toFile("public/icon-192.png");
  console.log("✅ public/icon-192.png");
  // 512x512
  await sharp(buf).resize(512, 512).png().toFile("public/icon-512.png");
  console.log("✅ public/icon-512.png");
} catch (e) {
  console.log("sharp غير متوفر. سأستخدم copy مباشرة.");
  // نسخ بسيط
  const buf = readFileSync("public/icon-1024.png");
  writeFileSync("public/icon-192.png", buf);
  writeFileSync("public/icon-512.png", buf);
  console.log("✅ نُسخت الصورة كـ icon-192 و icon-512 (نفس الحجم)");
}
