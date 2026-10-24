import { createClient } from "@libsql/client";
const client = createClient({ 
  url: "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA"
});

const res = await client.execute(`SELECT name, nameAr, length(logo) as len, substr(logo, 1, 30) as preview FROM "Channel" WHERE nameAr = 'بث تجريبي - رياضة'`);
const r = res.rows[0];
console.log(`القناة: ${r.nameAr}`);
console.log(`حجم الشعار: ${r.len} بايت`);
console.log(`النوع: ${String(r.preview).startsWith("data:image/jpeg") ? "JPEG مرفوع ✅" : String(r.preview).startsWith("data:image/svg") ? "SVG مولّد" : "غير معروف"}`);

// إحصاء
const jpeg = await client.execute(`SELECT COUNT(*) as n FROM "Channel" WHERE logo LIKE 'data:image/jpeg%'`);
const svg = await client.execute(`SELECT COUNT(*) as n FROM "Channel" WHERE logo LIKE 'data:image/svg%'`);
console.log(`\nإجمالي القنوات بصور JPEG مرفوعة: ${jpeg.rows[0]?.n}`);
console.log(`إجمالي القنوات بشعارات SVG مولّدة: ${svg.rows[0]?.n}`);
process.exit(0);
