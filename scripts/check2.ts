import { db } from '../src/lib/db';

async function main() {
  // استعلم عن المباريات بدون stream
  const matches = await db.match.findMany({
    select: { id: true, homeName: true, awayName: true, demo: true, status: true }
  });
  console.log(`عدد المباريات: ${matches.length}`);
  
  // محاولة تحديث stream1Url على مباراة واحدة
  if (matches.length > 0) {
    const first = matches[0];
    try {
      const updated = await db.match.update({
        where: { id: first.id },
        data: { stream1Url: "https://test.example.com/test.m3u8", stream1Type: "hls", stream1Label: "اختبار" },
        select: { id: true, stream1Url: true, stream1Type: true }
      });
      console.log("✅ التحديث نجح:", updated);
    } catch (e: any) {
      console.log("❌ التحديث فشل:", e.message);
    }
  }
}
main().catch(e => { console.error("خطأ:", e.message); process.exit(1); }).finally(() => process.exit(0));
