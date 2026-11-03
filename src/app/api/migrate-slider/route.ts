import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS SliderItem (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        imageUrl TEXT,
        gradient TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #022B1C 0%, #00875A 50%, #022B1C 100%)',
        linkType TEXT NOT NULL DEFAULT 'none',
        linkId TEXT,
        buttonText TEXT NOT NULL DEFAULT 'شاهد الآن',
        active BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL
      )
    `);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" });
  }
}
