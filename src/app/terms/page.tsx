export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06140f] px-4 py-12 text-white" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-extrabold">الشروط والأحكام</h1>
        <div className="space-y-4 text-sm leading-relaxed text-white/70">
          <p>آخر تحديث: أكتوبر 2026</p>

          <h2 className="mt-6 text-xl font-bold text-white">1. قبول الشروط</h2>
          <p>
            باستخدامك لتطبيق WazaNI TV، فإنك توافق على هذه الشروط والأحكام.
            إذا لم توافق، يرجى عدم استخدام التطبيق.
          </p>

          <h2 className="mt-6 text-xl font-bold text-white">2. استخدام التطبيق</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>التطبيق للاستخدام الشخصي فقط</li>
            <li>لا يجوز إعادة توزيع التطبيق أو بيعه</li>
            <li>لا تسيء استخدام التطبيق أو تحاول اختراقه</li>
          </ul>

          <h2 className="mt-6 text-xl font-bold text-white">3. المحتوى</h2>
          <p>
            التطبيق يعرض روابط قنوات ومباريات من مصادر عامة. WazaNI TV لا يستضيف
            أي محتوى بنفسه. المسؤولية عن المحتوى تقع على مالكي القنوات الأصليين.
          </p>

          <h2 className="mt-6 text-xl font-bold text-white">4. حدود المسؤولية</h2>
          <p>
            التطبيق يقدم "كما هو" دون ضمانات. لا نتحمل مسؤولية أي أضرار ناتجة عن
            استخدام التطبيق.
          </p>

          <h2 className="mt-6 text-xl font-bold text-white">5. التعديلات</h2>
          <p>
            نحتفظ بحق تعديل هذه الشروط في أي وقت. استمرارك في استخدام التطبيق
            يعني موافقتك على الشروط المعدّلة.
          </p>

          <h2 className="mt-6 text-xl font-bold text-white">6. التواصل</h2>
          <p>لأي استفسار: mohamdelwazzani@gmail.com</p>
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
