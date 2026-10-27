/**
 * تحديث حساب المسؤول الرسمي في قاعدة Turso
 * Usage: bun run scripts/init-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL يجب أن يشير إلى Turso");
  process.exit(1);
}

const adapter = new PrismaLibSQL({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = new PrismaClient({ adapter });

const adminEmail = (process.env.ADMIN_EMAIL ?? "mohamdelwazzani@gmail.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "mohamde12345";
const adminName = process.env.ADMIN_NAME ?? "محمد الوزاني";

async function main() {
  console.log("👤 تهيئة حساب المسؤول الرسمي…");
  console.log("   البريد:", adminEmail);
  console.log("   الاسم: ", adminName);

  // حذف كل حسابات AdminUser القديمة (نريد حسابًا واحدًا فقط — بريدك)
  const deleted = await db.adminUser.deleteMany({});
  console.log(`🗑️  تم حذف ${deleted.count} حساب قديم`);

  // إنشاء حساب المسؤول الجديد بكلمة مرور مُجزّأة (bcrypt)
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await db.adminUser.create({
    data: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "superadmin",
    },
  });

  console.log("✅ تم إنشاء حساب المسؤول بنجاح:");
  console.log("   id   :", admin.id);
  console.log("   email:", admin.email);
  console.log("   name :", admin.name);
  console.log("   role :", admin.role);
  console.log("");
  console.log("🔐 بيانات الدخول (احفظها في مكان آمن):");
  console.log(`   البريد: ${adminEmail}`);
  console.log(`   كلمة المرور: ${adminPassword}`);
  console.log("");
  console.log("⚠️  لا تشارك هذه البيانات مع أحد.");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
