import { createClient } from "@libsql/client";
const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";
const client = createClient({ url, authToken: token });

// احذف قنوات الاختبار
const testChannels = await client.execute(`SELECT id, name FROM "Channel" WHERE name LIKE 'TestChannel%' OR name LIKE '%test%' OR nameAr = 'قناة اختبار بصورة'`);
console.log(`قنوات اختبار للتنظيف: ${testChannels.rows.length}`);
for (const r of testChannels.rows) {
  await client.execute({ sql: `DELETE FROM "Channel" WHERE id = ?`, args: [String(r.id)] });
  console.log(`  🗑️ حذف: ${r.name}`);
}

// إحصاء نهائي
const count = await client.execute(`SELECT COUNT(*) as n FROM "Channel"`);
console.log(`\nإجمالي القنوات: ${count.rows[0]?.n}`);
process.exit(0);
