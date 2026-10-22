import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ admin: null });
  return NextResponse.json({ admin: { name: admin.name, email: admin.email, role: admin.role } });
}
