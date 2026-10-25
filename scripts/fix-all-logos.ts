/**
 * إصلاح كل الشعارات المكسورة في قاعدة Turso.
 *
 * المشكلة: بعض القنوات لها روابط شعارات خارجية (http://...) تفشل
 * بسبب حماية الخوادم من الروابط الخارجية (502).
 *
 * الحل: حمل كل رابط خارجي → حوّله إلى data URL (base64) → خزّنه في Turso.
 * النتيجة: كل الشعارات تصبح مضمنة في قاعدة البيانات ولا تفشل أبدًا.
 *
 * Usage: bun scripts/fix-all-logos.ts
 */
import { createClient } from "@libsql/client";

const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";
const client = createClient({ url, authToken: token });

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
];

async function fetchImageAsDataUrl(imageUrl: string): Promise<string | null> {
  for (const ua of USER_AGENTS) {
    try {
      const res = await fetch(imageUrl, {
        headers: {
          "User-Agent": ua,
          "Accept": "image/*,*/*;q=0.8",
          "Referer": new URL(imageUrl).origin,
        },
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/") && !contentType.startsWith("application/")) {
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // تخطّي الصور الكبيرة جدًا (> 200KB قبل التحويل)
      if (buf.length > 200_000) continue;
      // حدّد النوع الفعلي من البايتات الأولى
      const type = detectType(buf);
      if (!type) continue;
      const base64 = buf.toString("base64");
      return `data:${type};base64,${base64}`;
    } catch {
      continue;
    }
  }
  return null;
}

function detectType(buf: Buffer): string | null {
  // Magic bytes للصور الشائعة
  if (buf.length < 4) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  // SVG (نص)
  if (buf.length > 5 && buf.slice(0, 5).toString("utf-8") === "<?xml" || buf.slice(0, 4).toString("utf-8") === "<svg") {
    return "image/svg+xml";
  }
  return null;
}

async function processTable(table: "Channel" | "Team" | "Tournament", logoCol = "logo", nameCol = "name", nameArCol: string | null = "nameAr") {
  console.log(`\n=== معالجة جدول ${table} ===`);
  const res = await client.execute(
    `SELECT id, ${nameCol}${nameArCol ? `, ${nameArCol}` : ""}, ${logoCol} FROM "${table}" WHERE ${logoCol} LIKE 'http%'`
  );
  console.log(`   ${res.rows.length} سجل بشعار رابط خارجي`);

  let fixed = 0;
  let failed = 0;
  for (const row of res.rows) {
    const id = String(row.id);
    const name = String(row[nameCol] ?? row[nameArCol ?? nameCol] ?? id);
    const oldLogo = String(row[logoCol] ?? "");

    const dataUrl = await fetchImageAsDataUrl(oldLogo);
    if (dataUrl) {
      await client.execute({
        sql: `UPDATE "${table}" SET "${logoCol}" = ? WHERE id = ?`,
        args: [dataUrl, id],
      });
      fixed++;
      console.log(`   ✅ ${name}: ${dataUrl.length} بايت`);
    } else {
      failed++;
      console.log(`   ❌ ${name}: فشل تحميل ${oldLogo.substring(0, 60)}...`);
    }
    // تأخير قصير لتفادي حظر الخادم
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`   النتيجة: ${fixed} أُصلحت، ${failed} فشلت`);
  return { fixed, failed };
}

// ─── التشغيل ───
console.log("🚀 بدء إصلاح الشعارات المكسورة...");

const channelResults = await processTable("Channel");
const teamResults = await processTable("Team");
const tournamentResults = await processTable("Tournament");

// شعارات المباريات (homeLogo, awayLogo)
console.log("\n=== معالجة شعارات المباريات ===");
const matchRes = await client.execute(
  `SELECT id, "homeName", "awayName", "homeLogo", "awayLogo" FROM "Match" WHERE "homeLogo" LIKE 'http%' OR "awayLogo" LIKE 'http%'`
);
console.log(`   ${matchRes.rows.length} مباراة بشعار رابط خارجي`);
let matchFixed = 0;
let matchFailed = 0;
for (const row of matchRes.rows) {
  const id = String(row.id);
  let updated = false;
  const updates: Record<string, string | null> = {};

  if (row.homeLogo && String(row.homeLogo).startsWith("http")) {
    const dataUrl = await fetchImageAsDataUrl(String(row.homeLogo));
    if (dataUrl) { updates.homeLogo = dataUrl; updated = true; matchFixed++; }
    else matchFailed++;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (row.awayLogo && String(row.awayLogo).startsWith("http")) {
    const dataUrl = await fetchImageAsDataUrl(String(row.awayLogo));
    if (dataUrl) { updates.awayLogo = dataUrl; updated = true; matchFixed++; }
    else matchFailed++;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (updated) {
    const setParts: string[] = [];
    const args: (string | null)[] = [];
    if (updates.homeLogo) { setParts.push('"homeLogo" = ?'); args.push(updates.homeLogo); }
    if (updates.awayLogo) { setParts.push('"awayLogo" = ?'); args.push(updates.awayLogo); }
    args.push(id);
    await client.execute({
      sql: `UPDATE "Match" SET ${setParts.join(", ")} WHERE id = ?`,
      args,
    });
    console.log(`   ✅ ${row.homeName} × ${row.awayName}`);
  }
}

console.log("\n" + "═".repeat(60));
console.log("📊 الإحصاءات النهائية:");
console.log(`   القنوات: ${channelResults.fixed} أُصلحت، ${channelResults.failed} فشلت`);
console.log(`   الفرق: ${teamResults.fixed} أُصلحت، ${teamResults.failed} فشلت`);
console.log(`   البطولات: ${tournamentResults.fixed} أُصلحت، ${tournamentResults.failed} فشلت`);
console.log(`   المباريات: ${matchFixed} أُصلحت، ${matchFailed} فشلت`);

// إحصاء نهائي لكل الجداول
console.log("\n=== التوزيع النهائي للشعارات ===");
const finalChannels = await client.execute(`SELECT 
  SUM(CASE WHEN logo LIKE 'data:image%' THEN 1 ELSE 0 END) as dataUrl,
  SUM(CASE WHEN logo LIKE 'http%' THEN 1 ELSE 0 END) as external,
  SUM(CASE WHEN logo LIKE '<svg%' THEN 1 ELSE 0 END) as svg,
  SUM(CASE WHEN logo IS NULL OR logo = '' THEN 1 ELSE 0 END) as empty
FROM "Channel"`);
const r = finalChannels.rows[0];
console.log(`القنوات: ${r.dataUrl} data URL | ${r.external} رابط خارجي | ${r.svg} SVG | ${r.empty} فارغ`);

process.exit(0);
