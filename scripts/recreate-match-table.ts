/**
 * إعادة إنشاء جدول Match في Turso لحل مشكلة schema cache
 *
 * المشكلة: Prisma engine يرى الـ schema القديم (بدون stream1Url) رغم أن
 * الأعمدة موجودة في Turso. هذا بسبب schema cache في libSQL HTTP API.
 *
 * الحل: 
 *  1. إنشاء جدول Match_new بكل الأعمدة المطلوبة
 *  2. نسخ البيانات من Match القديم
 *  3. حذف Match القديم
 *  4. إعادة تسمية Match_new إلى Match
 *
 * هذا يُجبر Turso على تحديث schema cache.
 */
import { createClient } from "@libsql/client";

const url = "libsql://wazani-tv-mohamde12.aws-eu-west-1.turso.io";
const token = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NjY0MzUsImlkIjoiMDFhMTY5MzAtNGMwMS03NzAxLTg4YjMtNGVjODEwZDUxY2EwIiwia2lkIjoiZktMVC1kZU1VNUJnVWxycXhua01kRWZfWlJkZ1kyMGdON19RdEpTYlFaSSIsInJpZCI6IjZkODRiYWMyLWQ0MzctNGM1NS1hMjgyLTEzY2ZiYjRmOTk3MCJ9.WHuRQTGHxuc6oyYC6Xx7BBvQhp8BZFN2oPUeIGuIRCxdoPaiiGbAVBli4LSBzSY2qdePJ7xmZCABpSeLSJ3qBA";

const client = createClient({ url, authToken: token });

console.log("=== إعادة إنشاء جدول Match ===\n");

// 1. احفظ البيانات الحالية
console.log("1️⃣ قراءة المباريات الحالية...");
const existing = await client.execute(`SELECT * FROM "Match"`);
console.log(`   ${existing.rows.length} مباراة\n`);

// 2. أنشئ Match_new بكل الأعمدة
console.log("2️⃣ إنشاء Match_new...");
await client.execute(`DROP TABLE IF EXISTS "Match_new"`);
await client.execute(`
  CREATE TABLE "Match_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeName" TEXT NOT NULL,
    "awayName" TEXT NOT NULL,
    "homeLogo" TEXT,
    "awayLogo" TEXT,
    "tournamentId" TEXT,
    "tournamentName" TEXT,
    "kickoff" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "stadium" TEXT,
    "channelId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "demo" BOOLEAN NOT NULL DEFAULT true,
    "reminder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stream1Url" TEXT,
    "stream1Type" TEXT NOT NULL DEFAULT 'none',
    "stream1Label" TEXT,
    "stream2Url" TEXT,
    "stream2Type" TEXT NOT NULL DEFAULT 'none',
    "stream2Label" TEXT,
    "stream3Url" TEXT,
    "stream3Type" TEXT NOT NULL DEFAULT 'none',
    "stream3Label" TEXT,
    FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL,
    FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL,
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL,
    FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL
  )
`);
console.log("   ✅ Match_new أُنشئ\n");

// 3. انسخ البيانات
console.log("3️⃣ نسخ البيانات إلى Match_new...");
const cols = ["id", "homeTeamId", "awayTeamId", "homeName", "awayName", "homeLogo", "awayLogo", 
              "tournamentId", "tournamentName", "kickoff", "status", "homeScore", "awayScore", 
              "stadium", "channelId", "featured", "demo", "reminder", "createdAt", "updatedAt",
              "stream1Url", "stream1Type", "stream1Label",
              "stream2Url", "stream2Type", "stream2Label",
              "stream3Url", "stream3Type", "stream3Label"];

let copied = 0;
for (const row of existing.rows) {
  const values = cols.map(c => {
    const v = (row as any)[c];
    return v === undefined || v === null ? null : String(v);
  });
  const placeholders = cols.map(() => '?').join(', ');
  await client.execute({
    sql: `INSERT INTO "Match_new" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
    args: values
  });
  copied++;
}
console.log(`   ✅ ${copied} مباراة نُسخت\n`);

// 4. احفظ foreign keys المرجعية
console.log("4️⃣ تحديث علاقات Favorite...");
try {
  await client.execute(`UPDATE "Favorite" SET "matchId" = NULL WHERE "matchId" NOT IN (SELECT "id" FROM "Match_new")`);
  console.log("   ✅ تم\n");
} catch (e: any) {
  console.log(`   ⚠️ ${e.message}\n`);
}

// 5. احذف Match القديم
console.log("5️⃣ حذف Match القديم...");
await client.execute(`DROP TABLE "Match"`);
console.log("   ✅ تم\n");

// 6. أعد التسمية
console.log("6️⃣ إعادة تسمية Match_new إلى Match...");
await client.execute(`ALTER TABLE "Match_new" RENAME TO "Match"`);
console.log("   ✅ تم\n");

// 7. أنشئ الفهارس
console.log("7️⃣ إنشاء الفهارس...");
try {
  await client.execute(`CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId")`);
  await client.execute(`CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId")`);
  await client.execute(`CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId")`);
  await client.execute(`CREATE INDEX "Match_channelId_idx" ON "Match"("channelId")`);
  await client.execute(`CREATE INDEX "Match_kickoff_idx" ON "Match"("kickoff")`);
  console.log("   ✅ تم\n");
} catch (e: any) {
  console.log(`   ⚠️ ${e.message}\n`);
}

// 8. التحقق النهائي
console.log("8️⃣ التحقق النهائي...");
const finalCols = await client.execute(`PRAGMA table_info("Match")`);
console.log(`   عدد الأعمدة: ${finalCols.rows.length}`);
const hasStream1 = finalCols.rows.some(r => r.name === 'stream1Url');
console.log(`   stream1Url موجود: ${hasStream1 ? '✅' : '❌'}`);

const finalCount = await client.execute(`SELECT COUNT(*) as n FROM "Match"`);
console.log(`   عدد المباريات: ${finalCount.rows[0]?.n}`);

const withStreams = await client.execute(`SELECT COUNT(*) as n FROM "Match" WHERE "stream1Url" IS NOT NULL`);
console.log(`   مباريات بروابط بث: ${withStreams.rows[0]?.n}`);

console.log("\n✅ اكتمل!");
process.exit(0);
