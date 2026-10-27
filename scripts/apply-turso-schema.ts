/**
 * إنشاء جداول WazaNI TV في قاعدة Turso من ملف DDL
 * Usage: bun run scripts/apply-turso-schema.ts [path-to-sql]
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const sqlPath = process.argv[2] ?? "/tmp/turso-ddl.sql";
const url = process.env.DATABASE_URL ?? "";
const token = process.env.TURSO_AUTH_TOKEN ?? "";

if (!url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL يجب أن يشير إلى Turso");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf-8");
console.log(`📄 قراءة ${sqlPath} (${sql.length} بايت)`);

const client = createClient({ url, authToken: token });
await client.executeMultiple(sql);
console.log("✅ تم تنفيذ جميع عبارات إنشاء الجداول");

// التحقق: قائمة الجداول
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name"
);
console.log(`📋 عدد الجداول المنشأة: ${tables.rows.length}`);
for (const row of tables.rows) {
  const count = await client.execute(`SELECT COUNT(*) AS n FROM "${row.name}"`);
  console.log(`   • ${row.name} (${count.rows[0]?.n} صف)`);
}
