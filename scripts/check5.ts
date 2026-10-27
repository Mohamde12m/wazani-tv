// تحقق من DATABASE_URL الذي يراه Prisma
console.log("DATABASE_URL from env:", process.env.DATABASE_URL);
console.log("TURSO_AUTH_TOKEN from env:", process.env.TURSO_AUTH_TOKEN ? "(set, length=" + process.env.TURSO_AUTH_TOKEN.length + ")" : "(not set)");

import { db } from '../src/lib/db';

// Prisma count
const count = await db.match.count();
console.log("Prisma count:", count);

// Prisma raw query على نفس الاتصال
const cols = await db.$queryRaw`SELECT COUNT(*) as n FROM pragma_table_info('Match')`;
console.log("Prisma raw pragma_table_info count:", (cols as any)[0]?.n);

// Prisma raw query لإحضار كل أسماء الأعمدة
const colNames = await db.$queryRaw`SELECT name FROM pragma_table_info('Match') ORDER BY cid`;
console.log("Prisma sees columns:");
for (const c of colNames as any[]) {
  console.log("  -", c.name);
}
process.exit(0);
