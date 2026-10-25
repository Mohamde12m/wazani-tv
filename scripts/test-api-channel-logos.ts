// محاكاة طلب /api/channels من المتصفح
const res = await fetch("http://localhost:3000/api/channels");
const data = await res.json();
console.log(`عدد القنوات: ${data.channels?.length ?? 0}`);

// ابحث عن قنوات لها شعارات JPEG (مرفوعة)
const withJpeg = data.channels?.filter((c: any) => c.logo?.startsWith("data:image/jpeg"));
console.log(`قنوات بصور JPEG مرفوعة: ${withJpeg?.length ?? 0}`);
for (const c of withJpeg ?? []) {
  console.log(`  ✅ ${c.nameAr ?? c.name}: logo length = ${c.logo?.length} بايت`);
}

// ابحث عن قناة "الأولى"
const first = data.channels?.find((c: any) => c.nameAr === "الأولى");
if (first) {
  console.log(`\nقناة "الأولى":`);
  console.log(`  id: ${first.id}`);
  console.log(`  logo length: ${first.logo?.length ?? 0} بايت`);
  console.log(`  logo starts with: ${first.logo?.substring(0, 30)}`);
}
process.exit(0);
