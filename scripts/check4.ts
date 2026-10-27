import { createClient } from "@libsql/client";

const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";

// نفس الإعدادات مثل Prisma adapter
const client = createClient({ url, authToken: token });

console.log("=== عبر libsql client مباشرة ===");
const cols = await client.execute(`PRAGMA table_info("Match")`);
console.log(`عدد الأعمدة: ${cols.rows.length}`);
for (const r of cols.rows) {
  console.log(`  ${r.name} (${r.type})`);
}

console.log("\n=== محاولة UPDATE stream1Url ===");
const matches = await client.execute(`SELECT id FROM "Match" LIMIT 1`);
const id = matches.rows[0]?.id;
console.log(`first match id: ${id}`);

try {
  await client.execute({
    sql: `UPDATE "Match" SET "stream1Url" = ?, "stream1Type" = ?, "stream1Label" = ? WHERE id = ?`,
    args: ["https://test.example.com/test.m3u8", "hls", "اختبار", String(id)]
  });
  console.log("✅ UPDATE نجح");
  
  const check = await client.execute({
    sql: `SELECT "stream1Url", "stream1Type", "stream1Label" FROM "Match" WHERE id = ?`,
    args: [String(id)]
  });
  console.log("بعد:", check.rows[0]);
} catch (e: any) {
  console.log("❌ فشل:", e.message);
}
process.exit(0);
