import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// Re-run-safe: triggers re-seed by clearing and recreating demo data.
// Admin only.
export async function POST() {
  try {
    await requireAdmin();
    await db.match.deleteMany({});
    // Re-run the seed module
    const { exec } = await import("child_process");
    await new Promise<void>((resolve, reject) => {
      exec("bun run prisma/seed.ts", { cwd: process.cwd() }, (err) => (err ? reject(err) : resolve()));
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
