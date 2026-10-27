#!/usr/bin/env bash
# ============================================================
# WazaNI TV — Switch the database to Supabase (PostgreSQL)
#
# Usage:
#   bash scripts/switch-supabase.sh "postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres"
#
# This script:
#   1. Writes the Supabase URL into .env as DATABASE_URL
#   2. Swaps prisma/schema.prisma to the postgresql provider
#   3. Regenerates the Prisma Client
#   4. Pushes the schema to Supabase (creates all tables)
#   5. Seeds all demo data (channels, matches, tournaments…)
# ============================================================
set -e

if [ -z "$1" ]; then
  echo "❌ الاستخدام: bash scripts/switch-supabase.sh \"postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres\""
  echo ""
  echo "💡 كيفية الحصول على الرابط — انظر SUPABASE.md"
  exit 1
fi

DB_URL="$1"

# Basic validation
if [[ "$DB_URL" != postgresql://* && "$DB_URL" != postgres://* ]]; then
  echo "❌ الرابط يجب أن يبدأ بـ postgresql:// أو postgres://"
  exit 1
fi

echo "→ الخطوة 1/5: كتابة DATABASE_URL في .env"
cat > .env << EOF
DATABASE_URL="$DB_URL"
EOF

echo "→ الخطوة 2/5: التبديل إلى مخطط PostgreSQL"
cp prisma/schema.postgres.prisma prisma/schema.prisma

echo "→ الخطوة 3/5: توليد Prisma Client"
bun run db:generate

echo "→ الخطوة 4/5: إنشاء الجداول في Supabase (db push)"
bun run db:push

echo "→ الخطوة 5/5: تهيئة البيانات (93 قناة، 19 مباراة، 15 بطولة…)"
bun run db:seed

echo ""
echo "✅ تم ربط التطبيق بـ Supabase بنجاح!"
echo "   كل البيانات أصبحت في قاعدة بياناتك السحابية الحقيقية."
echo "   شغّل التطبيق: bun run dev"
echo ""
echo "🔐 بيانات دخول المسؤول: admin@wazani.tv / admin12345"
