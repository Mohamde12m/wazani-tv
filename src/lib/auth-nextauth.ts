import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";

/**
 * إعدادات NextAuth لـ WazaNI TV
 *
 * الميزات:
 *  - تسجيل دخول عبر Google فقط (عند توفّر GOOGLE_CLIENT_ID/SECRET)
 *  - Prisma Adapter يخزّن المستخدمين في Turso
 *  - أول مستخدم يسجّل بجوجل يصبح "admin" تلقائيًا (الباقي "user")
 *  - JWT strategy (بدون جدول Session — أسرع مع Turso السحابي)
 *  - role يُحقن في الـ JWT و session.callback
 *
 * ملاحظة: أول مستخدم = المسؤول. لذلك احرص على أن تكون أول من يسجّل
 * بعد تفعيل Google OAuth، لكي تحصل على صلاحية admin.
 */

// قائمة المزودين النشطة — تُبنى ديناميكيًا حسب المتغيرات المتوفرة
function buildProviders() {
  const providers: NextAuthOptions["providers"] = [];
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleId && googleSecret && googleId.length > 0 && googleSecret.length > 0) {
    providers.push(
      GoogleProvider({
        clientId: googleId,
        clientSecret: googleSecret,
        authorization: {
          params: {
            prompt: "select_account",
          },
        },
      }),
    );
  }
  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: buildProviders(),
  callbacks: {
    // 1) عند تسجيل الدخول: اسمح دائمًا (لا حاجة لتحقق إضافي)
    async signIn() {
      return true;
    },
    // 2) حقن role + id في الـ JWT
    async jwt({ token, user, trigger }) {
      // أول تسجيل دخول: user موجود → اقرأ role من قاعدة البيانات
      if (user) {
        token.id = user.id;
        // اقرأ role من User (قد يكون admin إذا كان أول مستخدم)
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "user";
      }
      // عند تحديث الجلسة (update session) أعد قراءة role
      if (trigger === "update") {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "user";
      }
      return token;
    },
    // 3) حقن role + id في session.client
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    // 🌟 المنطق السحري: أول مستخدم يسجّل يصبح admin
    async createUser(message) {
      const userCount = await db.user.count();
      if (userCount === 1) {
        // أول مستخدم على الإطلاق → مسؤول
        await db.user.update({
          where: { id: message.user.id },
          data: { role: "admin" },
        });
        console.log(
          `[auth] أول مستخدم سجّل (${message.user.email}) → تم تعيينه مسؤولًا`,
        );
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AVT_SESSION_SECRET ?? "wazani-tv-dev-secret-change-me",
};
