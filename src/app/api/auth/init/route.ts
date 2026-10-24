import { NextResponse } from "next/server";
import { getCurrentAdmin, ensureDefaultAdmin } from "@/lib/auth";

// Ensures a default admin exists and reports current session status.
export async function GET() {
  await ensureDefaultAdmin();
  const admin = await getCurrentAdmin();
  return NextResponse.json({
    admin: admin ? { name: admin.name, email: admin.email, role: admin.role } : null,
  });
}
