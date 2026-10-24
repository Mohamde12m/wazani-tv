import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";
const client = createClient({ url, authToken: token });

const adminEmail = "mohamdelwazzani@gmail.com";
const adminPassword = "mohamde12345";
const adminName = "محمد الوزاني";
const passwordHash = await bcrypt.hash(adminPassword, 10);

console.log("=== إصلاح حساب المسؤول في Turso (bcrypt) ===\n");

const existing = await client.execute(`SELECT id, email, name FROM "AdminUser"`);
console.log(`المسؤولون الحاليون: ${existing.rows.length}`);
for (const r of existing.rows) {
  console.log(`  - ${r.email} (${r.name})`);
}

const realAdmin = existing.rows.find(r => r.email === adminEmail);
if (realAdmin) {
  await client.execute({
    sql: `UPDATE "AdminUser" SET "passwordHash" = ?, "name" = ?, "role" = ? WHERE "id" = ?`,
    args: [passwordHash, adminName, "superadmin", String(realAdmin.id)]
  });
  console.log(`\n✅ تم تحديث كلمة مرور: ${adminEmail}`);
} else if (existing.rows.length > 0) {
  const first = existing.rows[0];
  await client.execute({
    sql: `UPDATE "AdminUser" SET "email" = ?, "passwordHash" = ?, "name" = ?, "role" = ? WHERE "id" = ?`,
    args: [adminEmail, passwordHash, adminName, "superadmin", String(first.id)]
  });
  console.log(`\n✅ تم تحويل ${first.email} → ${adminEmail}`);
} else {
  const id = `cm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  await client.execute({
    sql: `INSERT INTO "AdminUser" ("id", "email", "passwordHash", "name", "role", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, adminEmail, passwordHash, adminName, "superadmin", new Date().toISOString(), new Date().toISOString()]
  });
  console.log(`\n✅ تم إنشاء: ${adminEmail}`);
}

// حذف المسؤولين الزائدين
const extras = await client.execute({ sql: `SELECT id, email FROM "AdminUser" WHERE "email" != ?`, args: [adminEmail] });
for (const r of extras.rows) {
  await client.execute({ sql: `DELETE FROM "AdminUser" WHERE "id" = ?`, args: [String(r.id)] });
  console.log(`🗑️ حذف: ${r.email}`);
}

// التحقق
const final = await client.execute(`SELECT email, name, role FROM "AdminUser"`);
console.log("\n=== النهائي ===");
for (const r of final.rows) console.log(`  ✅ ${r.email} (${r.name})`);

// اختبار bcrypt
const verify = await bcrypt.compare(adminPassword, passwordHash);
console.log(`\n🔐 اختبار bcrypt: ${verify ? "✅ تطابق" : "❌ لا يطابق"}`);
process.exit(0);
