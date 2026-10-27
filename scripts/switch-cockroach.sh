#!/usr/bin/env bash
# ============================================================
# WazaNI TV — Switch the database to CockroachDB Serverless
#
# 🌍 CockroachDB = 10 GB مجاني! (أكبر مساحة PostgreSQL مجانية)
#   + موزّع عالميًا + متوافق مع PostgreSQL
#
# Usage:
#   bash scripts/switch-cockroach.sh "postgresql://user:pass@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"
#
# كيفية الحصول على الرابط:
#   1. اذهب إلى: https://cockroachlabs.cloud
#   2. سجّل حساب مجاني
#   3. أنشئ Cluster جديد (Serverless — Free)
#   4. من Connect → SQL → اختر General connection string
#   5. انسخ الرابط (تأكد من استبدال كلمة المرور)
#
# هذا السكربت:
#   1. يكتب DATABASE_URL في .env
#   2. يبدّل إلى مخطط PostgreSQL
#   3. يولّد Prisma Client
#   4. ينشئ الجداول في CockroachDB (db push)
#   5. يهيّئ البيانات (93 قناة، 19 مباراة، 15 بطولة…)
# ============================================================
set -e

DB_URL="$1"

if [ -z "$DB_URL" ]; then
  echo "❌ الاستخدام: bash scripts/switch-cockroach.sh \"postgresql://user:pass@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full\""
  echo ""
  echo "💡 احصل على الرابط من: https://cockroachlabs.cloud → Cluster → Connect"
  exit 1
fi

# Basic validation
if [[ "$DB_URL" != postgresql://* && "$DB_URL" != postgres://* ]]; then
  echo "❌ رابط CockroachDB يجب أن يبدأ بـ postgresql://"
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

echo "→ الخطوة 4/5: إنشاء الجداول في CockroachDB (db push)"
echo "   (قد يستغرق هذا وقتًا أطول بسبب التوزيع الجغرافي)"
bun run db:push

echo "→ الخطوة 5/5: تهيئة البيانات (93 قناة، 19 مباراة، 15 بطولة…)"
bun run db:seed

echo ""
echo "✅ تم ربط التطبيق بـ CockroachDB بنجاح!"
echo "   📦 المساحة المجانية: 10 جيجابايت (أكبر PostgreSQL مجاني!)"
echo "   🌍 التوزيع: متعدد المناطق عالميًا (high availability)"
echo "   🔒 التوافق: PostgreSQL كامل"
echo ""
echo "   شغّل التطبيق: bun run dev"
echo "🔐 بيانات دخول المسؤول: admin@wazani.tv / admin12345"
