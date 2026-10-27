import { db } from '../src/lib/db';

async function main() {
  // استعلم عن الـ schema عبر Prisma raw
  try {
    const cols = await db.$queryRaw`SELECT name, type FROM pragma_table_info('Match') ORDER BY cid`;
    console.log("=== أعمدة Match عبر Prisma raw ===");
    for (const c of cols as any[]) {
      console.log(`  ${c.name} (${c.type})`);
    }
  } catch (e: any) {
    console.log("❌ فشل pragma_table_info:", e.message);
  }
  
  // محاولة $executeRaw لإضافة قيمة
  try {
    const matches = await db.match.findMany({ select: { id: true, homeName: true }, take: 1 });
    if (matches.length > 0) {
      const id = matches[0].id;
      await db.$executeRaw`UPDATE "Match" SET "stream1Url" = ${'https://test.com'} WHERE id = ${id}`;
      console.log("✅ raw UPDATE نجح");
      const check = await db.$queryRaw`SELECT "stream1Url" FROM "Match" WHERE id = ${id}` as any[];
      console.log("   stream1Url بعد:", check[0]?.stream1Url);
    }
  } catch (e: any) {
    console.log("❌ raw UPDATE فشل:", e.message);
  }
}
main().catch(e => { console.error("خطأ:", e.message); process.exit(1); }).finally(() => process.exit(0));
