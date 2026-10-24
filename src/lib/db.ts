import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

/**
 * WazaNI TV — Prisma client singleton
 *
 * يدعم 3 أوضاع:
 *  1. Turso (libSQL) → TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (الإنتاج)
 *  2. SQLite محلي   → DATABASE_URL=file:./db/custom.db (تطوير محلي)
 *  3. PostgreSQL     → DATABASE_URL=postgresql://...
 *
 * ملاحظة: DATABASE_URL في .env يجب أن يكون "file:./db/dummy.db" لاجتياز
 * تحقق Prisma من الـ schema (provider=sqlite يتطلب بروتوكول file:).
 * الاتصال الفعلي بـ Turso يتم عبر الـ adapter الذي يقرأ TURSO_DATABASE_URL.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isTursoUrl(url: string): boolean {
  return (
    url.startsWith('libsql://') ||
    url.startsWith('libsql+ws://') ||
    url.startsWith('libsql+wss://')
  )
}

function createPrismaClient(): PrismaClient {
  // Turso URL الفعلي (للاتصال عبر adapter)
  const tursoUrl = process.env.TURSO_DATABASE_URL ?? ''
  // DATABASE_URL المستخدم لتحقق Prisma من الـ schema
  const dbUrl = process.env.DATABASE_URL ?? ''

  // ── Turso (libSQL) — adapter يتولى الاتصال ──
  if (tursoUrl && isTursoUrl(tursoUrl)) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return new PrismaClient({ adapter, log: ['error', 'warn'] })
  }

  // ── Turso عبر DATABASE_URL مباشرة (للتوافق مع الإصدارات السابقة) ──
  if (isTursoUrl(dbUrl)) {
    const adapter = new PrismaLibSQL({
      url: dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return new PrismaClient({ adapter, log: ['error', 'warn'] })
  }

  // ── SQLite محلي أو PostgreSQL — Prisma يتعامل معها مباشرة ──
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
