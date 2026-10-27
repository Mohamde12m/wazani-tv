import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultAdmin } from "@/lib/auth";
import { isDatabaseEmpty, seedDatabase } from "@/lib/seed-db";

/**
 * One-click database setup for deployment.
 *
 * Call `GET /api/setup` (or POST) after deploying to:
 *  1. Ensure the default admin exists (from .env: ADMIN_EMAIL / ADMIN_PASSWORD).
 *  2. Seed all demo data (countries, categories, channels, tournaments,
 *     teams, matches, settings) if the database is empty.
 *
 * This is safe to call repeatedly — it's idempotent (only seeds when empty,
 * and `ensureDefaultAdmin` only creates an admin if none exists).
 *
 * No auth required so it can be run right after deploy before any admin
 * has logged in. Once the app is live and seeded, calling it again is a
 * no-op.
 */
export async function GET(_req: NextRequest) {
  try {
    // 1. Ensure default admin
    const admin = await ensureDefaultAdmin();

    // 2. Seed demo data if the DB is empty
    const empty = await isDatabaseEmpty();
    let seedResult: null | {
      countries: number;
      categories: number;
      channels: number;
      tournaments: number;
      teams: number;
      matches: number;
    } = null;
    if (empty) {
      seedResult = await seedDatabase();
    }

    // 3. Report current state
    const stats = {
      admin: admin ? { email: admin.email, name: admin.name } : null,
      adminExists: !admin, // admin already existed
      wasSeeded: empty,
      seed: seedResult,
      current: {
        countries: await db.country.count(),
        categories: await db.category.count(),
        channels: await db.channel.count(),
        tournaments: await db.tournament.count(),
        teams: await db.team.count(),
        matches: await db.match.count(),
        admins: await db.adminUser.count(),
      },
    };

    return NextResponse.json({
      ok: true,
      message: empty
        ? "تم تهيئة قاعدة البيانات بنجاح. التطبيق جاهز للاستخدام."
        : "قاعدة البيانات تحتوي بالفعل على بيانات. لا حاجة للتهيئة.",
      ...stats,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ في التهيئة";
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        hint: "If the database tables don't exist yet, run `bun run db:push` first.",
      },
      { status: 500 },
    );
  }
}

// POST alias (some deploy hooks use POST)
export const POST = GET;
