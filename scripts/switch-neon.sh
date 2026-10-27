#!/usr/bin/env bash
# ============================================================
# WazaNI TV — Switch the database to Neon (PostgreSQL)
#
# 🚀 Neon = 500 MB مجاني + Branching (نسخ للتطوير مثل Git)
#
# Usage:
#   bash scripts/switch-neon.sh "postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
#
# كيفية الحصول على الرابط:
#   1. اذهب إلى: https://neon.tech
#   2. سجّل حساب مجاني (GitHub/Google)
#   3. أنشئ مشروع جديد
#   4. من Dashboard → Connection string → انسخ الرابط
#   5. تأكد أنه يحتوي ?sslmode=require في النهاية
#
# هذا السكربت:
#   1. يكتب DATABASE_URL في .env
#   2. يبدّل إلى مخطط PostgreSQL
#   3. يولّد Prisma Client
#   4. ينشئ الجداول في Neon (db push)
#   5. يهيّئ البيانات (93 قناة، 19 مباراة، 15 بطولة…)
# ============================================================
set -e

DB_URL="$1"

if [ -z "$DB_URL" ]; then
  echo "❌ الاستخدام: bash scripts/switch-neon.sh \"postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require\""
  echo ""
  echo "💡 احصل على الرابط من: https://neon.tech → New Project → Connection string"
  exit 1
fi

# Basic validation
if [[ "$DB_URL" != postgresql://* && "$DB_URL" != postgres://* ]]; then
  echo "❌ رابط Neon يجب أن يبدأ بـ postgresql://"
  exit 1
fi

# تأكد وجود sslmode (Neon يتطلبه)
if [[ "$DB_URL" != *"sslmode="* ]]; then
  echo "⚠️  الرابط لا يحتوي sslmode — نضيفه تلقائيًا"
  DB_URL="${DB_URL}?sslmode=require"
fi

echo "→ الخطوة 1/5: كتابة DATABASE_URL في .env"
cat > .env << EOF
DATABASE_URL="$DB_URL"
EOF

echo "→ الخطوة 2/5: التبديل إلى مخطط PostgreSQL"
cp prisma/schema.postgres.prisma prisma/schema.prisma

echo "→ الخطوة 3/5: توليد Prisma Client"
bun run db:generate

echo "→ الخطوة 4/5: إنشاء الجداول في Neon (db push)"
bun run db:push

echo "→ الخطوة 5/5: تهيئة البيانات (93 قناة، 19 مباراة، 15 بطولة…)"
bun run db:seed

echo ""
echo "✅ تم ربط التطبيق بـ Neon بنجاح!"
echo "   📦 المساحة المجانية: 500 ميجابايت"
echo "   🌿 الميزة: Branching (أنشئ نسخة قاعدة للتطوير بسهولة)"
echo "   ⚡ Serverless: يُوقَف عند عدم النشاط (cold start)"
echo ""
echo "   شغّل التطبيق: bun run dev"
echo "🔐 بيانات دخول المسؤول: admin@wazani.tv / admin12345"
