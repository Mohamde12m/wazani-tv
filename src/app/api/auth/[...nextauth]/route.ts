import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-nextauth";

/**
 * NextAuth Route Handler — يعالج:
 *  /api/auth/signin        — صفحة تسجيل الدخول
 *  /api/auth/signin/google — بدء تدفق Google OAuth
 *  /api/auth/callback/*    — استقبال رد Google
 *  /api/auth/signout       — تسجيل الخروج
 *  /api/auth/session       — JSON بالجلسة الحالية
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
