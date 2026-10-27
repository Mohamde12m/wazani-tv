#!/usr/bin/env bash
# ============================================================
# WazaNI TV — Switch the database to Turso (libSQL / SQLite)
#
# 🏆 Turso = 9 GB مجاني (18 ضعف Supabase!) + متوافق مع SQLite الحالي
#
# Usage:
#   bash scripts/switch-turso.sh "libsql://your-db.turso.io" "your-auth-token"
#
# كيفية الحصول على البيانات (من الموقع app.turso.tech):
#   1. أنشئ قاعدة بيانات: Create Database → الاسم + الموقع
#   2. انسخ Database URL من قسم Connect
#   3. اضغط Create Token → Expires: Never → Read & Write → انسخ التوكن
#
# هذا السكربت (الطريقة المجرّبة):
#   1. يكتب DATABASE_URL + TURSO_AUTH_TOKEN في .env (مع نسخة احتياطية)
#   2. يختبر الاتصال بـ Turso
#   3. يولّد SQL الجداول من prisma/schema.prisma
#      (لأن `prisma db push` لا يدعم libsql:// — قيد معروف في Prisma CLI)
#   4. ينشئ الجداول في Turso مباشرة عبر @libsql/client
#   5. يهيّئ البيانات (قنوات، مباريات، بطولات…) عبر Prisma + محوّل libSQL
#   6. حساب المسؤول يُنشأ تلقائيًا عند أول تشغيل للتطبيق
# ============================================================
set -e
cd "$(dirname "$0")/.."

DB_URL="$1"
DB_TOKEN="$2"

if [ -z "$DB_URL" ] || [ -z "$DB_TOKEN" ]; then
  echo "❌ الاستخدام: bash scripts/switch-turso.sh \"libsql://your-db.turso.io\" \"your-token\""
  echo ""
  echo "💡 احصل عليهما من: https://app.turso.tech → قاعدة بياناتك → Connect"
  echo "   - Database URL  (libsql://...)"
  echo "   - Create Token  (eyJ...)"
  exit 1
fi

if [[ "$DB_URL" != libsql://* ]]; then
  echo "❌ رابط Turso يجب أن يبدأ بـ libsql://"
  exit 1
fi

echo "→ الخطوة 1/6: نسخة احتياطية من .env وكتابة بيانات Turso"
[ -f .env ] && cp .env .env.backup-$(date +%s)
cat > .env << EOF
DATABASE_URL="$DB_URL"
TURSO_AUTH_TOKEN="$DB_TOKEN"
EOF

echo "→ الخطوة 2/6: التأكد من تثبيت الحزم المطلوبة"
bun add @prisma/adapter-libsql@^6.11 @libsql/client 2>/dev/null || npm install @prisma/adapter-libsql@^6.11 @libsql/client

echo "→ الخطوة 3/6: اختبار الاتصال بـ Turso"
bun run scripts/test-turso.ts

echo "→ الخطوة 4/6: توليد SQL الجداول من المخطط"
bunx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > /tmp/wazani-turso-ddl.sql
echo "   تم توليد DDL ($(wc -c < /tmp/wazani-turso-ddl.sql) بايت)"

echo "→ الخطوة 5/6: تنفيذ الجداول على Turso"
bun run scripts/apply-turso-schema.ts /tmp/wazani-turso-ddl.sql

echo "→ الخطوة 6/6: تهيئة البيانات (قنوات، مباريات، بطولات…)"
bun run db:seed

echo ""
echo "✅ تم ربط التطبيق بـ Turso بنجاح!"
echo "   📦 المساحة المجانية: 9 جيجابايت"
echo "   🔄 شغّل التطبيق: bun run dev"
echo "   🔐 حساب المسؤول يُنشأ تلقائيًا عند أول طلب: admin@wazani.tv / admin12345"
echo ""
echo "   للتحقق من المحتوى: bun run scripts/verify-turso.ts"
echo "   للعودة إلى SQLite المحلي: bun run db:sqlite"
