export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#06140f] px-4 py-12 text-white" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-extrabold">اتصل بنا</h1>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="mb-6 text-white/70">
            نحن هنا لمساعدتك. تواصل معنا عبر الوسائل التالية:
          </p>

          <div className="space-y-4">
            <a
              href="mailto:mohamdelwazzani@gmail.com"
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-white/50">البريد الإلكتروني</div>
                <div className="font-bold">mohamdelwazzani@gmail.com</div>
              </div>
            </a>
          </div>

          <div className="mt-8 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p className="font-bold mb-1">ساعات الرد:</p>
            <p>نرد على رسائلك خلال 24-48 ساعة</p>
          </div>
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
