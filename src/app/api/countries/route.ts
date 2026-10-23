import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const countries = await db.country.findMany({ where: { visible: true }, orderBy: { order: "asc" } });
  return NextResponse.json({ countries });
}

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  flag: z.string().optional(),
  order: z.number().default(0),
  visible: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = createSchema.parse(body);
    const country = await db.country.create({ data });
    return NextResponse.json({ country });
  } catch (e: unknown) {
    const status = e instanceof Response ? 401 : 400;
    const msg = e instanceof Error ? e.message : "خطأ في الإنشاء";
    return NextResponse.json({ error: msg }, { status });
  }
}
