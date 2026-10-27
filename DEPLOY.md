# دليل النشر — WazaNI TV

هذا الدليل يشرح كيفية نشر التطبيق بحيث تعمل قاعدة البيانات الحقيقية وتظهر كل البيانات للمستخدمين.

## الخطوات السريعة للنشر

### 1. إعداد متغيرات البيئة

في بيئة النشر، تأكد من وجود متغير `DATABASE_URL`:

```bash
# لـ SQLite (افتراضي — يعمل على VPS والحاويات):
DATABASE_URL=file:./db/custom.db
```

### 2. تثبيت الحزم (يقوم بـ prisma generate تلقائياً)

```bash
bun install
# postinstall سيشغل: prisma generate
```

### 3. بناء التطبيق

```bash
bun run build
# يقوم بـ: prisma generate + next build + نسخ الأصول
```

### 4. تشغيل التطبيق

```bash
bun run start
# أو: NODE_ENV=production bun .next/standalone/server.js
```

### 5. تهيئة قاعدة البيانات (تلقائية!)

قاعدة البيانات **تُهيّأ تلقائياً** عند أول طلب — لا حاجة لأي إجراء يدوي:

- عند أول زيارة لأي صفحة، يستدعي `/api/channels` أو `/api/matches` دالة `ensureDatabaseReady()`
- إذا كانت قاعدة البيانات فارغة، يتم تشغيل الـseed تلقائياً
- يتم إنشاء حساب المسؤول الافتراضي تلقائياً
- كل البيانات (93 قناة، 19 مباراة، 15 بطولة، 60 فريق، 17 دولة) تصبح متاحة فوراً

#### تهيئة يدوية (اختياري):

إذا أردت تهيئة قاعدة البيانية يدوياً بعد النشر:

```bash
# الطريقة 1: عبر API (لا تحتاج صلاحيات)
curl https://your-domain.com/api/setup

# الطريقة 2: عبر سكريبت
bun run setup   # = db:push + db:seed
```

## بيانات الدخول الافتراضية للمسؤول

- **البريد**: admin@wazani.tv
- **كلمة المرور**: admin12345
- ⚠️ **مهم**: غيّر كلمة المرور فور تسجيل الدخول الأول من لوحة الإدارة

## ما يتم إنشاؤه تلقائياً

| العنصر | العدد |
|--------|---------|
| 🌍 الدول | 17 دولة عربية |
| 📂 التصنيفات | 9 (عامة، رياضية، إخبارية، أفلام، ترفيهية، وثائقية، دينية، أطفال، موسيقى) |
| 📺 القنوات | 93 قناة عربية حقيقية |
| 🏆 البطولات | 15 بطولة (دوريات عربية وأوروبية + كؤوس) |
| ⚽ الفرق | 60 فريق |
| 🎯 المباريات | 19 مباراة تجريبية (مباشرة/اليوم/الغد/قادمة/منتهية) |
| 🔐 المسؤولون | 1 (admin@wazani.tv) |

## ملاحظات مهمة

### SQLite (الإعداد الافتراضي)
- ✅ يعمل على VPS والحاويات و Docker
- ✅ لا يحتاج خادم قاعدة بيانات خارجي
- ✅ البيانات محفوظة في ملف `db/custom.db`
- ⚠️ مناسب للتطبيقات متوسطة الحجم

### PostgreSQL (للإنتاج الكبير — اختياري)
إذا أردت استخدام PostgreSQL بدل SQLite:

1. ثبّت PostgreSQL على خادمك
2. غيّر `datasource db` في `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. اضبط `DATABASE_URL`:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/wazani
   ```
4. شغّل:
   ```bash
   bun run db:push
   bun run build && bun run start
   ```
5. استدعِ `https://your-domain.com/api/setup` لتهيئة البيانات

## استكشاف الأخطاء

### "Database connection error"
- تأكد أن `DATABASE_URL` مضبوط بشكل صحيح
- تأكد أن مجلد `db/` قابل للكتابة (لـ SQLite)

### "Tables don't exist"
- شغّل: `bun run db:push` لإنشاء الجداول
- ثم استدعِ `/api/setup` لتهيئة البيانات

### "No data showing"
- استدعِ `/api/setup` يدوياً
- تحقق من `/api/channels` — يجب أن يرجع القنوات
