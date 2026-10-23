import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie, ensureDefaultAdmin } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Make sure a default admin exists (idempotent)
    await ensureDefaultAdmin();
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);
    const admin = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!admin) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }
    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }
    const token = await createSessionToken(admin.id, admin.email);
    await setSessionCookie(token);
    return NextResponse.json({ admin: { name: admin.name, email: admin.email, role: admin.role } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "خطأ في تسجيل الدخول";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
