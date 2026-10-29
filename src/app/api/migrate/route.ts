import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/migrate
 *
 * يضيف الأعمدة الجديدة إلى جدول Match في Turso (production).
 * آمن للاستخدام المتكرر — يتجاهل الأخطاء "duplicate column".
 *
 * يُستدعى مرة واحدة بعد نشر تحديث schema جديد.
 */
export async function GET(_req: NextRequest) {
  const results: Array<{ sql: string; ok: boolean; error?: string }> = [];

  const statements = [
    "ALTER TABLE Match ADD COLUMN streamUrl TEXT",
    "ALTER TABLE Match ADD COLUMN streamType TEXT DEFAULT 'none'",
    "ALTER TABLE Match ADD COLUMN externalId TEXT",
    "ALTER TABLE Match ADD COLUMN broadcaster TEXT",
  ];

  for (const sql of statements) {
    try {
      await db.$executeRawUnsafe(sql);
      results.push({ sql, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        results.push({ sql, ok: true, error: "already exists" });
      } else {
        results.push({ sql, ok: false, error: msg });
      }
    }
  }

  // Create unique index on externalId
  try {
    await db.$executeRawUnsafe(
      "CREATE UNIQUE INDEX IF NOT EXISTS Match_externalId_key ON Match(externalId)"
    );
    results.push({
      sql: "CREATE UNIQUE INDEX Match_externalId_key",
      ok: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    results.push({
      sql: "CREATE UNIQUE INDEX Match_externalId_key",
      ok: false,
      error: msg,
    });
  }

  return NextResponse.json({
    ok: true,
    results,
  });
}
