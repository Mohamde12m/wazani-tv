import { createClient } from "@libsql/client";
const client = createClient({ 
  url: "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA"
});

console.log("=== فحص شعارات القنوات في Turso ===\n");
const channels = await client.execute(`SELECT name, nameAr, length(logo) as len, substr(logo, 1, 20) as preview FROM "Channel" ORDER BY name LIMIT 10`);
console.log("أول 10 قنوات:");
for (const r of channels.rows) {
  const type = String(r.preview).startsWith("data:image/jpeg") ? "📸 JPEG" : 
               String(r.preview).startsWith("data:image/svg") ? "🎨 SVG" :
               String(r.preview).startsWith("data:image/png") ? "📸 PNG" :
               String(r.preview).startsWith("http") ? "🔗 رابط" :
               r.preview === null ? "❌ فارغ" : "❓";
  console.log(`  ${r.nameAr ?? r.name}: ${type} (${r.len} بايت)`);
}

console.log("\n=== شعارات الفرق (Team) ===");
const teams = await client.execute(`SELECT name, length(logo) as len, substr(logo, 1, 20) as preview FROM "Team" ORDER BY name LIMIT 10`);
for (const r of teams.rows) {
  const type = String(r.preview).startsWith("data:image/jpeg") ? "📸 JPEG" : 
               String(r.preview).startsWith("data:image/svg") ? "🎨 SVG" :
               r.preview === null ? "❌ فارغ" : "❓";
  console.log(`  ${r.name}: ${type} (${r.len} بايت)`);
}

console.log("\n=== شعارات المباريات (Match) ===");
const matches = await client.execute(`SELECT "homeName", "awayName", length("homeLogo") as homeLen, length("awayLogo") as awayLen, substr("homeLogo", 1, 20) as homePreview FROM "Match" LIMIT 5`);
for (const r of matches.rows) {
  const type = String(r.homePreview).startsWith("data:image/jpeg") ? "📸 JPEG" : 
               String(r.homePreview).startsWith("data:image/svg") ? "🎨 SVG" :
               r.homePreview === null ? "❌ فارغ" : "❓";
  console.log(`  ${r.homeName} × ${r.awayName}: home=${type} (${r.homeLen}بايت), away=${r.awayLen}بايت`);
}
process.exit(0);
