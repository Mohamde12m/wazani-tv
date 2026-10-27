# 🗄️ قواعد البيانات المجانية المتاحة لـ WazaNI TV

دليل شامل لكل خيارات قواعد البيانات السحابية المجانية التي يمكنك ربطها بتطبيق WazaNI TV.
التطبيق يدعم **3 أنواع** تلقائيًا حسب شكل الرابط في `DATABASE_URL`.

---

## 📊 المقارنة السريعة

| # | الخدمة | المساحة المجانية | النوع | التبديل | التوصية |
|---|--------|------------------|------|---------|---------|
| 🥇 | **Turso** | **9 جيجابايت** | SQLite (libSQL) | `switch-turso.sh` | ⭐ الأفضل لمشروعك |
| 🥈 | **CockroachDB** | **10 جيجابايت** | PostgreSQL | `switch-cockroach.sh` | أكبر مساحة PG |
| 🥉 | **Neon** | **0.5 جيجابايت** | PostgreSQL | `switch-neon.sh` | branching ممتاز |
| 4 | **Supabase** | **0.5 جيجابايت** | PostgreSQL | `switch-supabase.sh` | ميزات إضافية |
| 5 | **Aiven** | **5 جيجابايت** | PostgreSQL/MySQL | يدوي | تجربة سنة |
| 6 | **TiDB Cloud** | **5 جيجابايت** | MySQL | يدوي | Serverless |
| 7 | **Vercel Postgres** | **256 ميجابايت** | PostgreSQL (Neon) | يدوي | محدود |

---

## 🥇 الخيار الأول الموصى به: Turso (9 جيجابايت)

### لماذا Turso هو الأفضل لمشروعك؟

1. **9 جيجابايت مجانية** — 18 ضعف Supabase و Neon
2. **متوافق 100% مع SQLite** — مشروعك الحالي يستخدم SQLite، فلا تحتاج تغيير أي schema
3. **سريع جدًا** — موزّع على Edge عالميًا (أقرب منطقة للمستخدم)
4. **يدعم الـ branching** — أنشئ نسخة قاعدة للتطوير بسهولة
5. **Prisma يدعمه رسميًا** عبر `@prisma/adapter-libsql`

### الخطوات

#### 1) أنشئ حساب Turso
- اذهب إلى: **https://turso.tech/app**
- سجّل حساب مجاني (GitHub / Google / Email)

#### 2) أنشئ قاعدة بيانات
عبر الموقع (زر "New Database") أو عبر CLI:

```bash
# ثبّت CLI
curl -sSfL https://get.tur.so/install.sh | bash

# سجّل الدخول
turso auth login

# أنشئ قاعدة باسم wazani-tv
turso db create wazani-tv

# احصل على رابط الاتصال
turso db show wazani-tv --url
# المخرجات: libsql://wazani-tv-yourname.turso.io

# أنشئ توكن المصادقة
turso db tokens create wazani-tv
# المخرجات: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

#### 3) شغّل سكربت التبديل

```bash
bash scripts/switch-turso.sh "libsql://wazani-tv-yourname.turso.io" "eyJhbGciOiJF..."
```

**انتهى!** السكربت سيفعل كل شيء تلقائيًا:
- ✅ يثبّت `@prisma/adapter-libsql` و `@libsql/client`
- ✅ يكتب `DATABASE_URL` و `TURSO_AUTH_TOKEN` في `.env`
- ✅ يُبقي schema SQLite كما هو (لا تغيير!)
- ✅ ينشئ الجداول في Turso
- ✅ يهيّئ البيانات (93 قناة، 19 مباراة، 15 بطولة…)

#### 4) شغّل التطبيق
```bash
bun run dev
```

---

## 🥈 الخيار الثاني: CockroachDB Serverless (10 جيجابايت)

أكبر مساحة PostgreSQL مجانية على الإطلاق + موزّع عالميًا.

### الخطوات

#### 1) أنشئ حساب
- اذهب إلى: **https://cockroachlabs.cloud**
- سجّل حساب مجاني

#### 2) أنشئ Cluster
- اضغط **Create Cluster**
- اختر **Serverless** (المجاني)
- اختر المنطقة (مثلاً `gcp-us-central1`)

#### 3) احصل على رابط الاتصال
- من Cluster → **Connect**
- اختر **SQL** → **General connection string**
- انسخ الرابط وتأكد من استبدال `<password>` بكلمة المرور التي عيّنتها

الرابط سيكون بالشكل:
```
postgresql://user:PASSWORD@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
```

#### 4) شغّل سكربت التبديل
```bash
bash scripts/switch-cockroach.sh "postgresql://user:PASSWORD@free-tier.gcp-us-central1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full"
```

---

## 🥉 الخيار الثالث: Neon (500 ميجابايت + Branching)

مميزاته: الـ branching (نسخ القاعدة للتطوير مثل Git)، serverless (يتوقف عند عدم النشاط).

### الخطوات

#### 1) أنشئ حساب
- اذهب إلى: **https://neon.tech**
- سجّل حساب مجاني (GitHub / Google)

#### 2) أنشئ مشروع
- اضغط **New Project**
- أعطِه اسمًا (مثلاً `wazani-tv`)
- اختر المنطقة

#### 3) احصل على رابط الاتصال
- من Dashboard → **Connection Details**
- انسخ **Connection string**

الرابط سيكون بالشكل:
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

#### 4) شغّل سكربت التبديل
```bash
bash scripts/switch-neon.sh "postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

> ملاحظة: لو نسيت `?sslmode=require` سيضيفه السكربت تلقائيًا.

---

## 4️⃣ الخيار الرابع: Supabase (500 ميجابايت)

عرفته سابقًا. راجع `SUPABASE.md` أو:

```bash
bash scripts/switch-supabase.sh "postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres"
```

---

## 🔄 العودة إلى SQLite المحلي

لو أردت العودة للتطوير المحلي بـ SQLite:

```bash
# 1) استعد schema SQLite الأصلي
cp prisma/schema.prisma prisma/schema.sqlite.backup.prisma 2>/dev/null

# 2) أنشئ ملف schema.sqlite.prisma بـ provider = "sqlite" أو استعد النسخة الأصلية

# 3) حدّث .env
echo 'DATABASE_URL="file:./db/custom.db"' > .env

# 4) أعد توليد وإنشاء الجداول
bun run db:generate
bun run db:push
bun run db:seed
```

> نصيحة: احتفظ بنسختين من schema:
> - `prisma/schema.sqlite.prisma` (provider = "sqlite")
> - `prisma/schema.postgres.prisma` (provider = "postgresql") — موجود بالفعل

---

## ⚙️ كيف يعمل التبديل تلقائيًا؟

ملف `src/lib/db.ts` يكتشف نوع القاعدة من شكل `DATABASE_URL`:

| شكل DATABASE_URL | النوع | المعالجة |
|------------------|------|----------|
| `file:./...` | SQLite محلي | Prisma مباشرة |
| `libsql://...` | **Turso** | `@prisma/adapter-libsql` + auth token |
| `postgresql://...` | PostgreSQL (Supabase/Neon/CockroachDB) | Prisma مباشرة |

لذلك لا تحتاج تعديل أي كود إضافي — فقط شغّل السكربت المناسب.

---

## 📝 ملخص الأوامر

```bash
# Turso (9GB — موصى به)
bash scripts/switch-turso.sh "libsql://..." "auth-token"

# CockroachDB (10GB PostgreSQL)
bash scripts/switch-cockroach.sh "postgresql://..."

# Neon (500MB + branching)
bash scripts/switch-neon.sh "postgresql://..."

# Supabase (500MB)
bash scripts/switch-supabase.sh "postgresql://..."

# العودة للـ SQLite المحلي (يدوي)
echo 'DATABASE_URL="file:./db/custom.db"' > .env
bun run db:generate && bun run db:push && bun run db:seed
```

---

## 🎯 التوصية النهائية

| حالتك | الخيار الأمثل |
|-------|---------------|
| تريد أسهل تبديل + أكبر مساحة | **Turso** (9GB، لا تغيير schema) |
| تريد PostgreSQL + أكبر مساحة | **CockroachDB** (10GB) |
| تريد branching للتطوير | **Neon** (500MB) |
| تريد ميزات إضافية (Auth, Storage) | **Supabase** (500MB) |
| تطوير محلي سريع | SQLite (`file:./db/custom.db`) |

**لـ WazaNI TV ننصح بـ Turso** لأن مشروعك مبني على SQLite أصلاً، فالانتقال لحظي وبدون أي تعديل في schema، وتحصل على 9 جيجابايت مجانية!

---

🔐 بيانات دخول المسؤول (في كل الخيارات): `admin@wazani.tv` / `admin12345`
