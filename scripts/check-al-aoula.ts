import { createClient } from "@libsql/client";
const client = createClient({ 
  url: "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA"
});

// كل القنوات التي اسمها يحتوي "الأولى"
const res = await client.execute(`SELECT id, name, nameAr, length(logo) as len, substr(logo, 1, 40) as preview, streamUrl, streamType FROM "Channel" WHERE nameAr LIKE '%الأولى%' OR name LIKE '%Aoula%' OR name LIKE '%Al Oula%'`);
console.log("=== القنوات التي اسمها يحتوي 'الأولى' ===");
for (const r of res.rows) {
  const type = String(r.preview).startsWith("data:image/jpeg") ? "📸 JPEG مرفوع" : 
               String(r.preview).startsWith("data:image/svg") ? "🎨 SVG مولّد" :
               String(r.preview).startsWith("http") ? "🔗 رابط خارجي" :
               r.preview === null ? "❌ فارغ" : "❓";
  console.log(`  ${r.nameAr ?? r.name}:`);
  console.log(`    id: ${r.id}`);
  console.log(`    الشعار: ${type} (${r.len} بايت)`);
  console.log(`    streamUrl: ${r.streamUrl ?? '(فارغ)'}`);
  console.log(`    streamType: ${r.streamType}`);
}

console.log("\n=== كل القنوات التي ليس لها شعار (logo فارغ) ===");
const empty = await client.execute(`SELECT name, nameAr FROM "Channel" WHERE logo IS NULL OR logo = ''`);
for (const r of empty.rows) {
  console.log(`  ❌ ${r.nameAr ?? r.name}`);
}
process.exit(0);
