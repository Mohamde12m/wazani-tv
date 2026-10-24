// اختبار شامل: رفع صورة مضغوطة (256px JPEG ~15KB) مثل ما يعمل ImageUploader
import bcrypt from "bcryptjs";

// 1. سجّل الدخول
const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "mohamdelwazzani@gmail.com", password: "mohamde12345" }),
});
const loginData = await loginRes.json();
const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] ?? "";

// 2. أنشئ صورة JPEG صغيرة (1x1 أحمر) كـ data URL
// هذا يحاكي ما ينتجه ImageUploader بعد الضغط
const tinyJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAEAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

console.log("1️⃣ إنشاء قناة بصورة JPEG صغيرة...");
const createRes = await fetch("http://localhost:3000/api/channels", {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({
    name: "TestImgDisplay_" + Date.now(),
    nameAr: "اختبار عرض الصورة",
    logo: tinyJpeg,
    streamType: "none",
    order: 1,
    featured: true,  // اجعلها مميزة لتظهر في الصفحة الرئيسية
  }),
});
const createData = await createRes.json();
console.log(`   HTTP ${createRes.status}`);
console.log(`   ${createData.channel ? "✅ تم إنشاء" : "❌ فشل: " + JSON.stringify(createData)}`);
if (createData.channel) {
  console.log(`   logo in response: ${createData.channel.logo?.length ?? 0} بايت`);
  console.log(`   starts with: ${createData.channel.logo?.substring(0, 30)}`);
}

// 3. استعلم من API
console.log("\n2️⃣ الاستعلام من /api/channels...");
const listRes = await fetch("http://localhost:3000/api/channels");
const listData = await listRes.json();
const found = listData.channels?.find((c: any) => c.name?.startsWith("TestImgDisplay_"));
if (found) {
  console.log(`   ✅ وُجدت: ${found.name}`);
  console.log(`   logo length: ${found.logo?.length ?? 0} بايت`);
  console.log(`   logo starts with: ${found.logo?.substring(0, 40)}`);
  console.log(`   featured: ${found.featured}`);
} else {
  console.log(`   ❌ لم تُوجد!`);
}

// 4. اعرض محتوى logo من API مباشرة للتأكد
console.log("\n3️⃣ محتوى logo الكامل من API:");
console.log(`   ${found?.logo?.substring(0, 100)}...`);
process.exit(0);
