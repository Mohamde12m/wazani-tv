import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/migrate-movies
 * ينشئ جدول Movie في Turso (production).
 * آمن للاستخدام المتكرر — يتجاهل أخطاء "already exists".
 */
export async function GET(_req: NextRequest) {
  const results: Array<{ sql: string; ok: boolean; error?: string }> = [];

  const statements = [
    `CREATE TABLE IF NOT EXISTS Movie (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      titleEn TEXT,
      description TEXT NOT NULL DEFAULT '',
      posterUrl TEXT,
      rating REAL NOT NULL DEFAULT 0,
      duration TEXT NOT NULL DEFAULT '',
      year INTEGER NOT NULL DEFAULT 2024,
      genres TEXT NOT NULL DEFAULT '',
      gradient TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      streamUrl TEXT,
      streamType TEXT NOT NULL DEFAULT 'none',
      featured BOOLEAN NOT NULL DEFAULT false,
      active BOOLEAN NOT NULL DEFAULT true,
      "order" INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL
    )`,
  ];

  for (const sql of statements) {
    try {
      await db.$executeRawUnsafe(sql);
      results.push({ sql: sql.substring(0, 60) + "...", ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      if (msg.includes("already exists")) {
        results.push({ sql: sql.substring(0, 60) + "...", ok: true, error: "already exists" });
      } else {
        results.push({ sql: sql.substring(0, 60) + "...", ok: false, error: msg });
      }
    }
  }

  return NextResponse.json({ ok: true, results });
}
