"use client";

import * as React from "react";
import {
  Download,
  Star,
  Play,
  Tv,
  Calendar,
  Heart,
  Search,
  Bell,
  Moon,
  ChevronDown,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Mail,
  MessageCircle,
  ExternalLink,
  X,
} from "lucide-react";

/**
 * WazaNI TV — Landing Page
 * صفحة هبوط احترافية لتحميل تطبيق WazaNI TV
 */
export default function LandingPage() {
  const [activeScreenshot, setActiveScreenshot] = React.useState<number | null>(null);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const screenshots = [
    { src: "/screenshots/home-mobile.jpg", title: "الصفحة الرئيسية" },
    { src: "/screenshots/channels-mobile.jpg", title: "القنوات" },
    { src: "/screenshots/matches-mobile.jpg", title: "المباريات" },
    { src: "/screenshots/player-mobile.jpg", title: "مشغل الفيديو" },
    { src: "/screenshots/favorites-mobile.jpg", title: "المفضلة" },
    { src: "/screenshots/dark-mode-mobile.jpg", title: "الوضع الداكن" },
  ];

  const features = [
    {
      icon: Tv,
      title: "قنوات عربية متنوعة",
      desc: "أكثر من 130 قناة عربية من المغرب، الخليج، مصر، الشام وأخرى",
    },
    {
      icon: Play,
      title: "مشغل فيديو احترافي",
      desc: "مشغل hls.js بأيقونات Lucide + تدوير تلقائي + ملء الشاشة",
    },
    {
      icon: Calendar,
      title: "جدول المباريات",
      desc: "مباريات اليوم والأسبوع مع تحويل تلقائي للحالة (مباشر/انتهت)",
    },
    {
      icon: Heart,
      title: "المفضلة وسجل المشاهدة",
      desc: "احفظ قنواتك المفضلة وتابع آخر ما شاهدته بسهولة",
    },
    {
      icon: Bell,
      title: "تذكير بالمباريات",
      desc: "إشعارات قبل المباراة بـ5 دقائق حتى لا تفوتك",
    },
    {
      icon: Moon,
      title: "الوضع الداكن",
      desc: "مظهر داكن أنيق يحمي عينيك في المشاهدة الليلية",
    },
  ];

  const faqs = [
    {
      q: "كيف أثبّت تطبيق WazaNI TV؟",
      a: "افتح موقع wazani-tv-live.vercel.app على متصفح Chrome في هاتفك الأندرويد، اضغط زر «تثبيت التطبيق» الأخضر في الأعلى، ثم اضغط «تثبيت». ستظهر أيقونة التطبيق على شاشتك الرئيسية.",
    },
    {
      q: "هل التطبيق متاح على Google Play؟",
      a: "لا، التطبيق غير متاح حاليًا على Google Play. يتم تثبيته مباشرة من الموقع كتطبيق ويب تقدمي (PWA) — وهو يعمل كتطبيق أصلي بالكامل.",
    },
    {
      q: "لماذا يطلب الأندرويد إذن «تثبيت من مصادر خارجية»؟",
      a: "لأن التطبيق لا يُثبّت من Google Play، يطلب الأندرويد إذنًا إضافيًا للتثبيت. هذا إجراء أمان عادي من نظام أندرويد — وافق عليه لإكمال التثبيت.",
    },
    {
      q: "هل التطبيق مجاني؟",
      a: "نعم، التطبيق مجاني بالكامل. لا توجد رسوم أو اشتراكات.",
    },
    {
      q: "هل يعمل التطبيق بدون إنترنت؟",
      a: "التطبيق يحتاج إنترنت لتحميل القنوات والمباريات. لكنه يخزن آخر محتوى شاهدته ليعمل جزئيًا بدون اتصال.",
    },
    {
      q: "هل يدعم التطبيق iPhone؟",
      a: "نعم، على iPhone افتح الموقع في Safari، اضغط زر المشاركة، اختر «إضافة إلى الشاشة الرئيسية» — سيعمل كتطبيق أصلي.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#06140f] text-white" dir="rtl">
      {/* ===== Background gradient effects ===== */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      {/* ===== Navbar ===== */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#06140f]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="WazaNI TV" className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-bold">WazaNI TV</span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white">المميزات</a>
            <a href="#screenshots" className="hover:text-white">اللقطات</a>
            <a href="#download" className="hover:text-white">التحميل</a>
            <a href="#faq" className="hover:text-white">الأسئلة</a>
          </div>
          <a
            href="#download"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            تنزيل التطبيق
          </a>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Text content */}
          <div className="text-center md:text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <Sparkles className="h-3 w-3" />
              تطبيق القنوات العربية الأول
            </div>
            <h1 className="mb-3 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Your Entertainment,
              <br />
              <span className="bg-gradient-to-l from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h1>
            <p className="mb-4 text-xl text-white/80 md:text-2xl">
              اكتشف تجربة مشاهدة منظمة وسهلة مع WazaNI TV
            </p>
            <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-white/60 md:mx-0 md:text-base">
              منصة عربية متكاملة لمتابعة القنوات التلفزيونية ومباريات كرة القدم.
              أكثر من 130 قناة، مشغل احترافي، جدول مباريات، وإشعارات ذكية — كل ذلك
              في تطبيق واحد أنيق.
            </p>

            {/* Buttons */}
            <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
              <a
                href="#download"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-emerald-500/50 sm:w-auto"
              >
                <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                تنزيل التطبيق للأندرويد
              </a>
              <a
                href="#features"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-base font-bold text-white backdrop-blur transition-all hover:bg-white/10 sm:w-auto"
              >
                اكتشف المميزات
                <ChevronDown className="h-5 w-5" />
              </a>
            </div>

            {/* Stats */}
            <div className="mt-8 flex items-center justify-center gap-6 md:justify-start">
              <div>
                <div className="text-2xl font-bold text-emerald-400">+130</div>
                <div className="text-xs text-white/50">قناة عربية</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-emerald-400">+20</div>
                <div className="text-xs text-white/50">بطولة</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-amber-400">4.9</span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-xs text-white/50">تقييم المستخدمين</div>
              </div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center md:justify-start">
            <PhoneMockup screenshot="/screenshots/home-mobile.jpg" />
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
            مميزات تجعلك تعشق التطبيق
          </h2>
          <p className="text-white/60">كل ما تحتاجه لمتابعة قنواتك ومبارياتك المفضلة</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all hover:border-emerald-500/30 hover:bg-white/10"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Screenshots Section ===== */}
      <section id="screenshots" className="relative z-10 mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
            شاهد التطبيق بنفسك
          </h2>
          <p className="text-white/60">لقطات حقيقية من داخل التطبيق</p>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
          {screenshots.map((shot, i) => (
            <button
              key={i}
              onClick={() => setActiveScreenshot(i)}
              className="group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <img
                src={shot.src}
                alt={shot.title}
                className="h-[500px] w-[240px] object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 right-0 left-0 p-4 text-right">
                <p className="text-sm font-bold text-white">{shot.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ===== Download Section ===== */}
      <section id="download" className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-[#06140f] p-8 md:p-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-500/30">
              <Download className="h-10 w-10 text-white" />
            </div>
            <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
              ابدأ المشاهدة الآن
            </h2>
            <p className="mx-auto mb-8 max-w-md text-white/60">
              ثبّت التطبيق على هاتفك الأندرويد واستمتع بتجربة مشاهدة فاخرة
            </p>

            {/* App info */}
            <div className="mx-auto mb-8 flex max-w-md items-center justify-center gap-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div>
                <div className="text-xs text-white/50">الإصدار</div>
                <div className="font-bold text-emerald-400">1.0.0</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xs text-white/50">الحجم</div>
                <div className="font-bold text-emerald-400">~5 MB</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xs text-white/50">آخر تحديث</div>
                <div className="font-bold text-emerald-400">اليوم</div>
              </div>
            </div>

            {/* Download button */}
            <a
              href="https://wazani-tv-live.vercel.app"
              className="group mx-auto flex max-w-md items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105"
            >
              <Download className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
              تنزيل التطبيق للأندرويد
            </a>

            <a
              href="https://wazani-tv-live.vercel.app"
              className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              فتح الموقع في المتصفح
            </a>

            {/* Installation instructions */}
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-right">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                تعليمات التثبيت
              </h3>
              <ol className="space-y-3 text-sm text-white/70">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">1</span>
                  <span>افتح الرابط على متصفح Chrome في هاتفك الأندرويد</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">2</span>
                  <span>اضغط زر «تثبيت التطبيق» الأخضر في الأعلى</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">3</span>
                  <span>اضغط «تثبيت» في النافذة المنبثقة</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">4</span>
                  <span>ستظهر أيقونة WazaNI TV على شاشتك الرئيسية!</span>
                </li>
              </ol>
            </div>

            {/* Security note */}
            <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-right text-sm text-amber-200">
              <Shield className="h-5 w-5 shrink-0 text-amber-400" />
              <p>
                قد يطلب أندرويد إذن «تثبيت من مصادر خارجية» — هذا إجراء أمان عادي
                من النظام. وافق عليه لإكمال التثبيت.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ Section ===== */}
      <section id="faq" className="relative z-10 mx-auto max-w-3xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
            الأسئلة الشائعة
          </h2>
          <p className="text-white/60">كل ما تريد معرفته عن التطبيق</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-right"
              >
                <span className="font-bold">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-emerald-400 transition-transform ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-white/70">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== Contact Section ===== */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur md:p-12">
          <h2 className="mb-3 text-3xl font-extrabold md:text-4xl">
            تواصل معنا
          </h2>
          <p className="mb-8 text-white/60">
            هل لديك سؤال أو اقتراح؟ نحن هنا لمساعدتك
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:mohamdelwazzani@gmail.com"
              className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-6 py-4 transition hover:bg-white/10"
            >
              <Mail className="h-5 w-5 text-emerald-400" />
              <div className="text-right">
                <div className="text-xs text-white/50">البريد الإلكتروني</div>
                <div className="font-bold">mohamdelwazzani@gmail.com</div>
              </div>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            <a href="/privacy" className="text-white/60 hover:text-white">سياسة الخصوصية</a>
            <span className="text-white/20">•</span>
            <a href="/terms" className="text-white/60 hover:text-white">الشروط والأحكام</a>
            <span className="text-white/20">•</span>
            <a href="/contact" className="text-white/60 hover:text-white">اتصل بنا</a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <img src="/icon-192.png" alt="WazaNI TV" className="h-8 w-8 rounded-lg" />
            <span className="font-bold">WazaNI TV</span>
          </div>
          <p className="text-xs text-white/40">
            © 2026 WazaNI TV. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>

      {/* ===== Screenshot Lightbox ===== */}
      {activeScreenshot !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur"
          onClick={() => setActiveScreenshot(null)}
        >
          <button
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setActiveScreenshot(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={screenshots[activeScreenshot].src}
              alt={screenshots[activeScreenshot].title}
              className="max-h-[85vh] rounded-2xl"
            />
            <p className="mt-4 text-center font-bold">
              {screenshots[activeScreenshot].title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** موكاب هاتف احترافي بـ CSS */
function PhoneMockup({ screenshot }: { screenshot: string }) {
  return (
    <div className="relative">
      {/* توهج خلفي */}
      <div className="absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-gradient-to-br from-emerald-500/30 to-amber-500/20 blur-3xl" />

      {/* إطار الهاتف */}
      <div className="relative h-[600px] w-[300px] rounded-[2.5rem] border-[8px] border-[#1a1a1a] bg-[#000] shadow-2xl">
        {/* الشاشة */}
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#06140f]">
          {/* النتيش (notch) */}
          <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#1a1a1a]" />

          {/* لقطة الشاشة */}
          <img
            src={screenshot}
            alt="WazaNI TV"
            className="h-full w-full object-cover"
          />

          {/* توهج علوي */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" />
        </div>
      </div>

      {/* ظل أسفل */}
      <div className="absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-black/50 blur-xl" />
    </div>
  );
}

/** أيقونة شرارات صغيرة */
function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}
