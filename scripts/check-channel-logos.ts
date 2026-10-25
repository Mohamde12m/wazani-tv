import { createClient } from "@libsql/client";
const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";
const client = createClient({ url, authToken: token });

const res = await client.execute(`SELECT name, nameAr, substr(logo, 1, 80) as logo_preview, length(logo) as logo_len FROM "Channel" ORDER BY name LIMIT 20`);
console.log("=== أول 20 قناة: الشعارات ===");
for (const r of res.rows) {
  const preview = r.logo_preview ? String(r.logo_preview) : "(فارغ)";
  const len = r.logo_len ?? 0;
  const type = preview.startsWith("data:image") ? "📊 data URL" : 
               preview.startsWith("http") ? "🔗 رابط خارجي" :
               preview.startsWith("<svg") ? "🎨 SVG" : "❓ غير معروف";
  console.log(`  ${r.nameAr ?? r.name}: ${type} (${len} بايت)`);
}

const withDataUrl = await client.execute(`SELECT COUNT(*) as n FROM "Channel" WHERE logo LIKE 'data:image%'`);
console.log(`\nقنوات بشعارات data URL (مرفوعة من الجهاز): ${withDataUrl.rows[0]?.n}`);
const withHttp = await client.execute(`SELECT COUNT(*) as n FROM "Channel" WHERE logo LIKE 'http%'`);
console.log(`قنوات بشعارات روابط خارجية: ${withHttp.rows[0]?.n}`);
const withSvg = await client.execute(`SELECT COUNT(*) as n FROM "Channel" WHERE logo LIKE '<svg%'`);
console.log(`قنوات بشعارات SVG مولّدة: ${withSvg.rows[0]?.n}`);
const empty = await client.execute(`SELECT COUNT(*) as n FROM "Channel" WHERE (logo IS NULL OR logo = '')`);
console.log(`قنوات بدون شعار: ${empty.rows[0]?.n}`);
process.exit(0);
