import { createClient } from "@libsql/client";
const client = createClient({ 
  url: "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA"
});

// ابحث عن كل القنوات التي لها روابط خارجية
const res = await client.execute(`SELECT id, name, nameAr, logo FROM "Channel" WHERE logo LIKE 'http%'`);
console.log(`قنوات بروابط خارجية: ${res.rows.length}`);
for (const r of res.rows) {
  console.log(`  ${r.nameAr ?? r.name}: ${String(r.logo).substring(0, 80)}...`);
  // أنشئ SVG placeholder بسيط بدلًا من الرابط المعطل
  const name = String(r.nameAr ?? r.name ?? "؟");
  const firstChar = name.trim().slice(0, 1);
  const colors = ["#0b6e4f", "#0f9b6e", "#b8860b", "#1b7a5a", "#9c6b1f"];
  const colorIdx = name.charCodeAt(0) % colors.length;
  const c1 = colors[colorIdx];
  const c2 = colors[(colorIdx + 1) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs><circle cx="64" cy="64" r="62" fill="url(#g)"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="56" fill="#fff">${firstChar}</text></svg>`;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  await client.execute({
    sql: `UPDATE "Channel" SET logo = ? WHERE id = ?`,
    args: [dataUrl, String(r.id)],
  });
  console.log(`   ✅ استُبدل بـ SVG placeholder`);
}

// إحصاء نهائي
const final = await client.execute(`SELECT 
  SUM(CASE WHEN logo LIKE 'data:image%' THEN 1 ELSE 0 END) as dataUrl,
  SUM(CASE WHEN logo LIKE 'http%' THEN 1 ELSE 0 END) as external
FROM "Channel"`);
console.log(`\nالنهائي: ${final.rows[0]?.dataUrl} data URL | ${final.rows[0]?.external} رابط خارجي`);
process.exit(0);
