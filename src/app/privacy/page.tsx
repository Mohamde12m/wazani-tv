export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#06140f] px-4 py-12 text-white" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-extrabold">سياسة الخصوصية</h1>
        <div className="space-y-4 text-sm leading-relaxed text-white/70">
          <p>آخر تحديث: أكتوبر 2026</p>

          <h2 className="mt-6 text-xl font-bold text-white">1. مقدمة</h2>
          <p>
            تطبيق WazaNI TV يحترم خصوصيتك. هذه السياسة توضح كيف نجمع ونستخدم
            بياناتك عند استخدام تطبيقنا.
          </p>

          <h2 className="mt-6 text-xl font-bold text-white">2. البيانات التي نجمعها</h2>
          <p>التطبيق لا يجمع بيانات شخصية حساسة. البيانات المخزنة محليًا:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li>قائمة المفضلة (قنوات ومباريات)</li>
            <li>سجل المشاهدة (آخر القنوات)</li>
            <li>إعدادات التطبيق (الوضع الداكن/الفاتح)</li>
            <li>معرّف جلسة عشوائي (للمفضلة السحابية)</li>
          </ul>

          <h2 className="mt-6 text-xl font-bold text-white">3. كيف نستخدم البيانات</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>تحسين تجربة المستخدم</li>
            <li>حفظ تفضيلاتك بين الجلسات</li>
            <li>عرض المحتوى المناسب لك</li>
          </ul>

          <h2 className="mt-6 text-xl font-bold text-white">4. ملفات تعريف الارتباط</h2>
          <p>
            التطبيق يستخدم localStorage فقط لحفظ تفضيلاتك. لا نستخدم ملفات
            تعريف ارتباط للتبع.
          </p>

          <h2 className="mt-6 text-xl font-bold text-white">5. حقوقك</h2>
          <p>يمكنك في أي وقت:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li>مسح بياناتك المحلية من إعدادات المتصفح</li>
            <li>إلغاء تثبيت التطبيق لحذف كل البيانات</li>
            <li>تعطيل الإشعارات من إعدادات الهاتف</li>
          </ul>

          <h2 className="mt-6 text-xl font-bold text-white">6. التواصل</h2>
          <p>
            لأي استفسار حول الخصوصية: mohamdelwazzani@gmail.com
          </p>
        </div>

        <div className="mt-8">
          <a
            href="/landing"
            className="inline-block rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
