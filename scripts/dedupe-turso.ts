/**
 * تنظيف التكرارات في قاعدة Turso الناتجة عن seed قديم
 *
 * الاستراتيجية:
 *  - لكل جدول (Tournament, Team, Match): اجمع السجلات حسب المفتاح المنطقي
 *  - احتفظ بأقدم سجل (لأنه قد يحمل روابط البث التي ضبطها المسؤول)
 *  - انقل أي روابط بث من النسخ المكررة إلى النسخة المحفوظة (لو كانت فارغة)
 *  - احذف النسخ المكررة الأحدث
 *
 * Usage: bun run scripts/dedupe-turso.ts
 */
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "";
const token = process.env.TURSO_AUTH_TOKEN ?? "";

if (!url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL يجب أن يشير إلى Turso");
  process.exit(1);
}

const client = createClient({ url, authToken: token });

async function dedupeTournaments() {
  console.log("\n=== تنظيف تكرارات البطولات ===");
  const rows = await client.execute(
    `SELECT id, name, createdAt FROM "Tournament" ORDER BY createdAt ASC`,
  );
  const seen = new Map<string, string>();
  let deleted = 0;
  for (const r of rows.rows) {
    const name = String(r.name);
    const id = String(r.id);
    if (seen.has(name)) {
      // مكرر — احذفه (انقل علاقاته للأول)
      const keepId = seen.get(name)!;
      await client.execute(
        {
          sql: `UPDATE "Team" SET "tournamentId" = ? WHERE "tournamentId" = ?`,
          args: [keepId, id],
        },
      );
      await client.execute(
        {
          sql: `UPDATE "Match" SET "tournamentId" = ? WHERE "tournamentId" = ?`,
          args: [keepId, id],
        },
      );
      await client.execute({
        sql: `DELETE FROM "Tournament" WHERE id = ?`,
        args: [id],
      });
      deleted++;
      console.log(`   🗑️ حذف بطولة مكررة: ${name}`);
    } else {
      seen.set(name, id);
    }
  }
  console.log(`✅ حُذف ${deleted} بطولة مكررة`);
}

async function dedupeTeams() {
  console.log("\n=== تنظيف تكرارات الفرق ===");
  const rows = await client.execute(
    `SELECT id, name, tournamentId, createdAt FROM "Team" ORDER BY createdAt ASC`,
  );
  const seen = new Map<string, string>();
  let deleted = 0;
  for (const r of rows.rows) {
    const name = String(r.name);
    const tid = r.tournamentId ? String(r.tournamentId) : "none";
    const key = `${name}__${tid}`;
    const id = String(r.id);
    if (seen.has(key)) {
      const keepId = seen.get(key)!;
      // انقل علاقات المباريات للفريق المحفوظ
      await client.execute({
        sql: `UPDATE "Match" SET "homeTeamId" = ? WHERE "homeTeamId" = ?`,
        args: [keepId, id],
      });
      await client.execute({
        sql: `UPDATE "Match" SET "awayTeamId" = ? WHERE "awayTeamId" = ?`,
        args: [keepId, id],
      });
      await client.execute({ sql: `DELETE FROM "Team" WHERE id = ?`, args: [id] });
      deleted++;
      console.log(`   🗑️ حذف فريق مكرر: ${name}`);
    } else {
      seen.set(key, id);
    }
  }
  console.log(`✅ حُذف ${deleted} فريق مكرر`);
}

async function dedupeMatches() {
  console.log("\n=== تنظيف تكرارات المباريات (مع دمج روابط البث) ===");
  const rows = await client.execute(
    `SELECT * FROM "Match" ORDER BY createdAt ASC`,
  );
  type MRow = Record<string, unknown>;
  const seen = new Map<string, MRow>();
  let deleted = 0;
  for (const r of rows.rows as unknown as MRow[]) {
    const homeName = String(r.homeName);
    const awayName = String(r.awayName);
    const key = `${homeName}__${awayName}`;
    const id = String(r.id);

    if (seen.has(key)) {
      const keep = seen.get(key)!;
      const keepId = String(keep.id);
      // دمج روابط البث: انقل أي رابط من المكرر إلى المحفوظ لو فارغ
      for (const n of [1, 2, 3]) {
        const urlKey = `stream${n}Url`;
        const typeKey = `stream${n}Type`;
        const labelKey = `stream${n}Label`;
        const keepUrl = keep[urlKey];
        const dupUrl = r[urlKey];
        if (!keepUrl && dupUrl) {
          keep[urlKey] = dupUrl;
          keep[typeKey] = r[typeKey];
          keep[labelKey] = r[labelKey];
          await client.execute({
            sql: `UPDATE "Match" SET "${urlKey}" = ?, "${typeKey}" = ?, "${labelKey}" = ? WHERE id = ?`,
            args: [String(dupUrl), String(r[typeKey] ?? "none"), r[labelKey] ? String(r[labelKey]) : null, keepId],
          });
          console.log(`   📦 نُقل ${urlKey} إلى المباراة المحفوظة (${homeName} × ${awayName})`);
        }
      }
      // انقل المفضلة المرتبطة بالمكرر
      await client.execute({
        sql: `UPDATE "Favorite" SET "matchId" = ? WHERE "matchId" = ?`,
        args: [keepId, id],
      });
      await client.execute({ sql: `DELETE FROM "Match" WHERE id = ?`, args: [id] });
      deleted++;
      console.log(`   🗑️ حذف مباراة مكررة: ${homeName} × ${awayName}`);
    } else {
      seen.set(key, r);
    }
  }
  console.log(`✅ حُذفت ${deleted} مباراة مكررة`);
}

async function dedupeChannels() {
  console.log("\n=== تنظيف تكرارات القنوات ===");
  const rows = await client.execute(
    `SELECT id, name, createdAt FROM "Channel" ORDER BY createdAt ASC`,
  );
  const seen = new Map<string, string>();
  let deleted = 0;
  for (const r of rows.rows) {
    const name = String(r.name);
    const id = String(r.id);
    if (seen.has(name)) {
      const keepId = seen.get(name)!;
      await client.execute({
        sql: `UPDATE "Match" SET "channelId" = ? WHERE "channelId" = ?`,
        args: [keepId, id],
      });
      await client.execute({
        sql: `DELETE FROM "Favorite" WHERE "channelId" = ? AND id NOT IN (SELECT id FROM "Favorite" WHERE "channelId" = ? LIMIT 1)`,
        args: [id, id],
      });
      await client.execute({ sql: `DELETE FROM "Channel" WHERE id = ?`, args: [id] });
      deleted++;
      console.log(`   🗑️ حذف قناة مكررة: ${name}`);
    } else {
      seen.set(name, id);
    }
  }
  console.log(`✅ حُذفت ${deleted} قناة مكررة`);
}

// ─── التشغيل ───
await dedupeTournaments();
await dedupeTeams();
await dedupeMatches();
await dedupeChannels();

console.log("\n📊 الإحصاءات النهائية:");
const tables = ["Channel", "Tournament", "Team", "Match"];
for (const t of tables) {
  const r = await client.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
  console.log(`   ${t}: ${r.rows[0]?.n}`);
}
console.log("\n✅ اكتمل التنظيف!");
