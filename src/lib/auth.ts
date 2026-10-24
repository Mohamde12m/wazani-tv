import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const SESSION_COOKIE = "avt_admin";
// جلسة قصيرة (4 ساعات) — تنتهي عند إغلاق المتصفح أو بعد 4 ساعات
// المسؤول يجب أن يسجّل الدخول في كل مرة يفتح فيها المتصفح
const SESSION_MAX_AGE = 60 * 60 * 4; // 4 hours

// Simple signed token: base64(payload).base64(hmac)
// We avoid extra deps; this is for admin sessions only.
function getKey(): string {
  const k = process.env.AVT_SESSION_SECRET;
  if (!k) {
    // Fallback for dev — admin auth still works but is less secure.
    return "wazani-tv-dev-secret-change-me";
  }
  return k;
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(new Uint8Array(sig)).toString("base64url");
}

export async function createSessionToken(adminId: string, email: string): Promise<string> {
  const payload = { sub: adminId, email, iat: Date.now(), exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

export async function verifySessionToken(token?: string): Promise<{ sub: string; email: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = await hmac(body);
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // لا نضع maxAge → كوكي جلسة يُمسح عند إغلاق المتصفح
    // (التوكن داخله ينتهي بعد 4 ساعات كحماية إضافية)
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getCurrentAdmin() {
  const token = await getSessionCookie();
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const admin = await db.adminUser.findUnique({ where: { id: payload.sub } });
  return admin;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Response(JSON.stringify({ error: "غير مصرح" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return admin;
}

/** Seed a default admin if none exists. Safe to call repeatedly. */
export async function ensureDefaultAdmin() {
  const count = await db.adminUser.count();
  if (count > 0) return null;
  // استخدم بيانات المسؤول من متغيرات البيئة (لا تظهر للمستخدم أبدًا)
  const email = process.env.ADMIN_EMAIL ?? "admin@wazani.tv";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";
  const name = process.env.ADMIN_NAME ?? "مدير WazaNI";
  const passwordHash = await hashPassword(password);
  const admin = await db.adminUser.create({
    data: {
      email,
      passwordHash,
      name,
      role: "superadmin",
    },
  });
  return admin;
}
