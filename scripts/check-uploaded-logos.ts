import { createClient } from "@libsql/client";
const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";
const client = createClient({ url, authToken: token });

// ابحث عن أي قناة فيها data URL أكبر من 2KB (صورة حقيقية مرفوعة)
const res = await client.execute(`SELECT name, nameAr, length(logo) as logo_len, substr(logo, 1, 30) as preview FROM "Channel" WHERE length(logo) > 2000 ORDER BY length(logo) DESC`);
console.log("=== قنوات بصور حقيقية مرفوعة (data URL > 2KB) ===");
if (res.rows.length === 0) {
  console.log("❌ لا توجد أي قناة بصورة مرفوعة حقيقية!");
  console.log("كل الشعارات الحالية هي SVG مولّدة (858 بايت)");
} else {
  for (const r of res.rows) {
    console.log(`  ✅ ${r.nameAr ?? r.name}: ${r.logo_len} بايت — ${r.preview}...`);
  }
}

console.log("\n=== التوزيع الكامل ===");
const all = await client.execute(`SELECT 
  SUM(CASE WHEN logo IS NULL OR logo = '' THEN 1 ELSE 0 END) as empty,
  SUM(CASE WHEN logo LIKE 'data:image/svg%' THEN 1 ELSE 0 END) as svg,
  SUM(CASE WHEN logo LIKE 'data:image/jpeg%' THEN 1 ELSE 0 END) as jpeg,
  SUM(CASE WHEN logo LIKE 'data:image/png%' THEN 1 ELSE 0 END) as png,
  SUM(CASE WHEN logo LIKE 'http%' THEN 1 ELSE 0 END) as http
FROM "Channel"`);
const r = all.rows[0];
console.log(`  فارغ: ${r.empty}`);
console.log(`  SVG مولّد: ${r.svg}`);
console.log(`  JPEG مرفوع: ${r.jpeg}`);
console.log(`  PNG مرفوع: ${r.png}`);
console.log(`  رابط خارجي: ${r.http}`);

// تحقق من آخر قناة أُنشئت
console.log("\n=== آخر 5 قنوات أُنشئت ===");
const recent = await client.execute(`SELECT name, nameAr, length(logo) as logo_len, createdAt FROM "Channel" ORDER BY createdAt DESC LIMIT 5`);
for (const r of recent.rows) {
  console.log(`  ${r.nameAr ?? r.name}: logo=${r.logo_len} بايت, أُنشئت ${r.createdAt}`);
}
process.exit(0);
