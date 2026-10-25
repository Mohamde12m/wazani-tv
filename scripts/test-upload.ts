// محاكاة رفع صورة حقيقية (data URL كبير ~15KB) عبر API
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "mohamdelwazzani@gmail.com";
const ADMIN_PASSWORD = "mohamde12345";

// 1. سجّل الدخول واحصل على كوكيز الجلسة
console.log("1️⃣ تسجيل الدخول...");
const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
});
const loginData = await loginRes.json();
console.log(`   ${loginData.admin ? "✅ نجح" : "❌ فشل"}`);
if (!loginData.admin) process.exit(1);

const cookie = loginRes.headers.get("set-cookie");
if (!cookie) { console.log("❌ لا يوجد set-cookie"); process.exit(1); }
const sessionCookie = cookie.split(";")[0];
console.log(`   Cookie: ${sessionCookie.substring(0, 40)}...`);

// 2. اقرأ صورة حقيقية وحوّلها إلى data URL
console.log("\n2️⃣ قراءة صورة حقيقية...");
const fs = await import("fs");
const imgBuf = fs.readFileSync("/home/z/my-project/public/wazani-logo-mark.png");
const imgBase64 = imgBuf.toString("base64");
const dataUrl = `data:image/jpeg;base64,${imgBase64}`;
console.log(`   حجم الصورة: ${imgBuf.length} بايت`);
console.log(`   حجم data URL: ${dataUrl.length} بايت`);

// 3. أنشئ قناة جديدة بالصورة الحقيقية
console.log("\n3️⃣ إنشاء قناة جديدة بالصورة...");
const createRes = await fetch("http://localhost:3000/api/channels", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie: sessionCookie,
  },
  body: JSON.stringify({
    name: "TestChannelWithLogo_" + Date.now(),
    nameAr: "قناة اختبار بصورة",
    logo: dataUrl,
    streamType: "none",
    active: true,
    featured: false,
    verified: false,
    order: 999,
  }),
});
const createData = await createRes.json();
console.log(`   HTTP ${createRes.status}`);
if (createData.channel) {
  console.log(`   ✅ تم إنشاء: ${createData.channel.name}`);
  console.log(`   logo length in response: ${createData.channel.logo?.length ?? 0} بايت`);
} else {
  console.log(`   ❌ خطأ: ${JSON.stringify(createData)}`);
}

// 4. استعلم عن القناة من API للتأكد
console.log("\n4️⃣ الاستعلام عن القنوات...");
const listRes = await fetch("http://localhost:3000/api/channels");
const listData = await listRes.json();
const found = listData.channels?.find((c: any) => c.name?.startsWith("TestChannelWithLogo_"));
if (found) {
  console.log(`   ✅ وُجدت في القائمة: ${found.name}`);
  console.log(`   logo length: ${found.logo?.length ?? 0} بايت`);
  console.log(`   logo preview: ${found.logo?.substring(0, 50) ?? "(فارغ)"}...`);
} else {
  console.log(`   ❌ لم تُوجد في القائمة!`);
}
process.exit(0);
