import { db } from "@/lib/db";
import { svgLogo } from "@/lib/logo";

/**
 * Database initialisation logic — mirrors prisma/seed.ts but is callable
 * from the running app (not just the CLI). Used by:
 *  - `/api/setup` (manual one-click setup after deploy)
 *  - the auto-init guard in `/api/channels` (first request after deploy)
 *
 * ✅ SAFE: لا يحذف أي بيانات موجودة. يستخدم upsert لإضافة/تحديث البيانات
 *    التجريبية فقط دون مسح ما أضافه المسؤول من قنوات/مباريات/روابط بث.
 *
 *    إذا كانت القاعدة فارغة فقط، يُنشئ كل البيانات التجريبية.
 *    إذا كانت تحتوي على بيانات، يُضيف فقط ما ينقص (upsert حسب المفتاح الفريد).
 */

// Public, legitimately-available test HLS streams used only for clearly-labeled
// "بث تجريبي" demo channels so the player actually demonstrates HLS playback.
const TEST_STREAMS = {
  bigBuckBunny: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  appleBipbop:
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
  muxTears:
    "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8",
};

function now() {
  return new Date();
}
function at(daysOffset: number, hour: number, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d;
}

/** Returns true if the database appears empty (no countries yet). */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const count = await db.country.count();
    return count === 0;
  } catch {
    // If the table doesn't exist yet, treat as empty.
    return true;
  }
}

/**
 * Run the full seed. Wipes existing seed-managed rows first so it can be
 * re-run safely. Returns a summary of what was created.
 */
export async function seedDatabase(): Promise<{
  countries: number;
  categories: number;
  channels: number;
  tournaments: number;
  teams: number;
  matches: number;
}> {
  console.log("Seeding WazaNI TV database...");

  // ---------- Countries (upsert — لا يحذف الموجود) ----------
  const countries = [
    { name: "المغرب", code: "MA", flag: "🇲🇦", order: 1 },
    { name: "الجزائر", code: "DZ", flag: "🇩🇿", order: 2 },
    { name: "تونس", code: "TN", flag: "🇹🇳", order: 3 },
    { name: "مصر", code: "EG", flag: "🇪🇬", order: 4 },
    { name: "السعودية", code: "SA", flag: "🇸🇦", order: 5 },
    { name: "الإمارات", code: "AE", flag: "🇦🇪", order: 6 },
    { name: "قطر", code: "QA", flag: "🇶🇦", order: 7 },
    { name: "الكويت", code: "KW", flag: "🇰🇼", order: 8 },
    { name: "العراق", code: "IQ", flag: "🇮🇶", order: 9 },
    { name: "الأردن", code: "JO", flag: "🇯🇴", order: 10 },
    { name: "لبنان", code: "LB", flag: "🇱🇧", order: 11 },
    { name: "فلسطين", code: "PS", flag: "🇵🇸", order: 12 },
    { name: "سوريا", code: "SY", flag: "🇸🇾", order: 13 },
    { name: "السودان", code: "SD", flag: "🇸🇩", order: 14 },
    { name: "ليبيا", code: "LY", flag: "🇱🇾", order: 15 },
    { name: "اليمن", code: "YE", flag: "🇾🇪", order: 16 },
    { name: "عربية عامة", code: "AR", flag: "🌐", order: 17 },
  ];
  for (const c of countries) {
    await db.country.upsert({
      where: { code: c.code },
      create: c,
      update: { name: c.name, flag: c.flag, order: c.order },
    });
  }

  // ---------- Categories (upsert — لا يحذف الموجود) ----------
  const categories = [
    { name: "عامة", slug: "general", icon: "Tv", order: 1, isSports: false },
    { name: "رياضية", slug: "sports", icon: "Trophy", order: 2, isSports: true },
    { name: "إخبارية", slug: "news", icon: "Newspaper", order: 3, isSports: false },
    { name: "أفلام", slug: "movies", icon: "Film", order: 4, isSports: false },
    { name: "ترفيهية", slug: "entertainment", icon: "Sparkles", order: 5, isSports: false },
    { name: "وثائقية", slug: "documentary", icon: "Globe", order: 6, isSports: false },
    { name: "دينية", slug: "religious", icon: "Moon", order: 7, isSports: false },
    { name: "للأطفال", slug: "kids", icon: "Star", order: 8, isSports: false },
    { name: "موسيقى", slug: "music", icon: "Radio", order: 9, isSports: false },
  ];
  for (const c of categories) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, icon: c.icon, order: c.order, isSports: c.isSports },
    });
  }

  // ---------- Channels (upsert حسب الاسم — لا يحذف ما أضافه المسؤول) ----------
  // (Shortened channel list — full list mirrored from prisma/seed.ts)
  const chanSeeds: {
    name: string; nameAr?: string; country: string; cat: string;
    stream?: string; streamType?: string; verified?: boolean; featured?: boolean; order: number;
  }[] = [
    { name: "WazaNI Demo Sport", nameAr: "بث تجريبي - رياضة", country: "AR", cat: "sports", stream: TEST_STREAMS.bigBuckBunny, streamType: "hls", verified: true, featured: true, order: 1 },
    { name: "WazaNI Demo Cinema", nameAr: "بث تجريبي - سينما", country: "AR", cat: "movies", stream: TEST_STREAMS.appleBipbop, streamType: "hls", verified: true, featured: true, order: 2 },
    { name: "WazaNI Demo News", nameAr: "بث تجريبي - أخبار", country: "AR", cat: "news", stream: TEST_STREAMS.muxTears, streamType: "hls", verified: true, order: 3 },
    { name: "2M Maroc", nameAr: "دوزيم", country: "MA", cat: "general", order: 10, featured: true },
    { name: "Al Aoula", nameAr: "الأولى", country: "MA", cat: "general", order: 11 },
    { name: "Arryadia", nameAr: "الرياضية", country: "MA", cat: "sports", order: 12 },
    { name: "Arrabia", nameAr: "الرابعة", country: "MA", cat: "documentary", order: 13 },
    { name: "Al Maghribia", nameAr: "المغربية", country: "MA", cat: "general", order: 14 },
    { name: "Tamazight", nameAr: "تمازيغت", country: "MA", cat: "general", order: 15 },
    { name: "Assadissa", nameAr: "السادسة", country: "MA", cat: "religious", order: 16 },
    { name: "Athaqafia", nameAr: "الثقافية", country: "MA", cat: "documentary", order: 17 },
    { name: "Canal Algérie", nameAr: "القناة الجزائرية", country: "DZ", cat: "general", order: 20 },
    { name: "Entv", nameAr: "الأرضية", country: "DZ", cat: "general", order: 21 },
    { name: "Watania 1", nameAr: "الوطنية 1", country: "TN", cat: "general", order: 30 },
    { name: "Watania 2", nameAr: "الوطنية 2", country: "TN", cat: "general", order: 31 },
    { name: "Nessma", nameAr: "نسمة", country: "TN", cat: "general", order: 32 },
    { name: "Hannibal", nameAr: "حنبعل", country: "TN", cat: "entertainment", order: 33 },
    { name: "MBC 1", nameAr: "إم بي سي 1", country: "AR", cat: "general", order: 40, featured: true },
    { name: "MBC 2", nameAr: "إم بي سي 2", country: "AR", cat: "movies", order: 41 },
    { name: "MBC 3", nameAr: "إم بي سي 3", country: "AR", cat: "kids", order: 42 },
    { name: "MBC 4", nameAr: "إم بي سي 4", country: "AR", cat: "entertainment", order: 43 },
    { name: "MBC Action", nameAr: "إم بي سي أكشن", country: "AR", cat: "movies", order: 44 },
    { name: "MBC Masr", nameAr: "إم بي سي مصر", country: "EG", cat: "general", order: 45 },
    { name: "MBC5", nameAr: "إم بي سي 5", country: "MA", cat: "general", order: 46 },
    { name: "Rotana", nameAr: "روتانا", country: "SA", cat: "entertainment", order: 50, featured: true },
    { name: "Rotana Cinema", nameAr: "روتانا سينما", country: "SA", cat: "movies", order: 51 },
    { name: "Rotana Khalijia", nameAr: "روتانا خليجية", country: "SA", cat: "entertainment", order: 52 },
    { name: "Rotana Clip", nameAr: "روتانا كليب", country: "SA", cat: "music", order: 53 },
    { name: "Saudi TV 1", nameAr: "السعودية 1", country: "SA", cat: "general", order: 60 },
    { name: "Saudi TV 2", nameAr: "السعودية 2", country: "SA", cat: "general", order: 61 },
    { name: "SBC", nameAr: "إس بي سي", country: "SA", cat: "entertainment", order: 62 },
    { name: "Al Quran Al Kareem", nameAr: "القرآن الكريم", country: "SA", cat: "religious", order: 63 },
    { name: "Al Sunnah", nameAr: "السنة النبوية", country: "SA", cat: "religious", order: 64 },
    { name: "Abu Dhabi TV", nameAr: "أبوظبي", country: "AE", cat: "general", order: 70, featured: true },
    { name: "Dubai TV", nameAr: "دبي", country: "AE", cat: "general", order: 71 },
    { name: "Sama Dubai", nameAr: "سما دبي", country: "AE", cat: "general", order: 72 },
    { name: "Abu Dhabi Sports", nameAr: "أبوظبي الرياضية", country: "AE", cat: "sports", order: 73 },
    { name: "Dubai Sports", nameAr: "دبي الرياضية", country: "AE", cat: "sports", order: 74 },
    { name: "National Geographic Abu Dhabi", nameAr: "ناشيونال جيوغرافيك", country: "AE", cat: "documentary", order: 75 },
    { name: "Al Jazeera", nameAr: "الجزيرة", country: "QA", cat: "news", order: 80, featured: true },
    { name: "Al Jazeera Documentary", nameAr: "الجزيرة الوثائقية", country: "QA", cat: "documentary", order: 81 },
    { name: "beIN Sports 1", nameAr: "بي إن سبورتس 1", country: "QA", cat: "sports", order: 82, featured: true },
    { name: "beIN Sports 2", nameAr: "بي إن سبورتس 2", country: "QA", cat: "sports", order: 83 },
    { name: "Al Kass Sports", nameAr: "الكأس", country: "QA", cat: "sports", order: 84 },
    { name: "Kuwait TV 1", nameAr: "الكويت 1", country: "KW", cat: "general", order: 90 },
    { name: "Kuwait TV 2", nameAr: "الكويت 2", country: "KW", cat: "entertainment", order: 91 },
    { name: "Al Iraqiya", nameAr: "العراقية", country: "IQ", cat: "general", order: 100 },
    { name: "Al Sharqiya", nameAr: "الشرقية", country: "IQ", cat: "entertainment", order: 101 },
    { name: "Jordan TV", nameAr: "الأردن", country: "JO", cat: "general", order: 110 },
    { name: "LBC", nameAr: "إل بي سي", country: "LB", cat: "general", order: 120, featured: true },
    { name: "Future TV", nameAr: "المستقبل", country: "LB", cat: "general", order: 121 },
    { name: "Palestine TV", nameAr: "فلسطين", country: "PS", cat: "general", order: 130 },
    { name: "Syria TV", nameAr: "سوريا", country: "SY", cat: "general", order: 140 },
    { name: "Sudan TV", nameAr: "السودان", country: "SD", cat: "general", order: 150 },
    { name: "Libya TV", nameAr: "ليبيا", country: "LY", cat: "general", order: 160 },
    { name: "Yemen TV", nameAr: "اليمن", country: "YE", cat: "general", order: 170 },
    { name: "Al Arabiya", nameAr: "العربية", country: "AR", cat: "news", order: 180, featured: true },
    { name: "Sky News Arabia", nameAr: "سكاي نيوز عربية", country: "AR", cat: "news", order: 181 },
    { name: "Al Hadath", nameAr: "الحادثة", country: "AR", cat: "news", order: 182 },
    { name: "Al Mayadeen", nameAr: "الميادين", country: "AR", cat: "news", order: 183 },
    { name: "Al Manar", nameAr: "المنار", country: "AR", cat: "news", order: 184 },
    { name: "TRT Arabic", nameAr: "تي آر تي عربي", country: "AR", cat: "news", order: 185 },
    { name: "Al Hayat", nameAr: "الحياة", country: "EG", cat: "general", order: 190 },
    { name: "ON TV", nameAr: "أون", country: "EG", cat: "general", order: 191 },
    { name: "CBC", nameAr: "سي بي سي", country: "EG", cat: "general", order: 192 },
    { name: "Nile Sports", nameAr: "نايل سبورت", country: "EG", cat: "sports", order: 193 },
    { name: "Spacetoon", nameAr: "سبيستون", country: "AR", cat: "kids", order: 200 },
    { name: "Baraem", nameAr: "براعم", country: "AR", cat: "kids", order: 201 },
    { name: "Majd", nameAr: "مجدة", country: "AR", cat: "religious", order: 210 },
    { name: "Al Resalah", nameAr: "الرسالة", country: "SA", cat: "religious", order: 211 },
    { name: "Wanasah", nameAr: "وناسة", country: "SA", cat: "music", order: 220 },
    { name: "Mazzika", nameAr: "مزيكا", country: "AR", cat: "music", order: 221 },
    { name: "Almajd Quran", nameAr: "المجد للقرآن", country: "SA", cat: "religious", order: 230 },
    { name: "Al Quds", nameAr: "القدس", country: "PS", cat: "religious", order: 231 },
    { name: "Mekameleen", nameAr: "مكملين", country: "EG", cat: "news", order: 240 },
    { name: "Al Araby", nameAr: "العربي", country: "AR", cat: "news", order: 241 },
    { name: "Al Jazeera English", nameAr: "الجزيرة الإنجليزية", country: "QA", cat: "news", order: 250 },
    { name: "Al Magharibia", nameAr: "المغاربية", country: "DZ", cat: "news", order: 260 },
    { name: "Al Aoula Maroc HD", nameAr: "الأولى HD", country: "MA", cat: "general", order: 270 },
    { name: "2M HD", nameAr: "دوزيم HD", country: "MA", cat: "general", order: 271 },
    { name: "Medi 1 TV", nameAr: "ميدي 1", country: "MA", cat: "news", order: 272, featured: true },
    { name: "Télé Maroc", nameAr: "تيلي ماروك", country: "MA", cat: "general", order: 273 },
    { name: "Tamazight HD", nameAr: "تمازيغت HD", country: "MA", cat: "general", order: 274 },
    { name: "Alnahar", nameAr: "النهار", country: "EG", cat: "general", order: 280 },
    { name: "Alnahar Drama", nameAr: "النهار دراما", country: "EG", cat: "entertainment", order: 281 },
    { name: "Alnahar Sport", nameAr: "النهار رياضة", country: "EG", cat: "sports", order: 282 },
    { name: "TeN", nameAr: "تين", country: "EG", cat: "general", order: 283 },
    { name: "Dmc", nameAr: "دي إم سي", country: "EG", cat: "general", order: 284 },
    { name: "Dmc Drama", nameAr: "دي إم سي دراما", country: "EG", cat: "entertainment", order: 285 },
    { name: "Dmc Sports", nameAr: "دي إم سي رياضة", country: "EG", cat: "sports", order: 286 },
    { name: "Extra News", nameAr: "إكسترا نيوز", country: "EG", cat: "news", order: 287 },
    { name: "Sada Elbalad", nameAr: "صدى البلد", country: "EG", cat: "general", order: 288 },
    { name: "Sada Elbalad Drama", nameAr: "صدى البلد دراما", country: "EG", cat: "entertainment", order: 289 },
  ];
  for (const c of chanSeeds) {
    // ✅ تحقق أولاً لو القناة موجودة بالاسم — لا تنشئ مكرر، لا تحذف موجود
    const existing = await db.channel.findFirst({ where: { name: c.name } });
    if (existing) {
      // القناة موجودة — حدّث بياناتها التجريبية فقط (لا تمسح streamUrl لو ضبطها المسؤول)
      await db.channel.update({
        where: { id: existing.id },
        data: {
          nameAr: c.nameAr ?? existing.nameAr,
          order: c.order,
          demo: !!(c.stream) || existing.demo,
        },
      });
      continue;
    }
    // قناة جديدة — أنشئها
    const country = await db.country.findFirst({ where: { code: c.country } });
    const category = await db.category.findFirst({ where: { slug: c.cat } });
    await db.channel.create({
      data: {
        name: c.name,
        nameAr: c.nameAr ?? null,
        logo: svgLogo(c.nameAr ?? c.name, { shape: "circle" }),
        countryId: country?.id,
        categoryId: category?.id,
        streamUrl: c.stream ?? null,
        streamType: c.streamType ?? "none",
        verified: c.verified ?? false,
        featured: c.featured ?? false,
        demo: !!(c.stream),
        active: true,
        order: c.order,
      },
    });
  }

  // ---------- Tournaments (findFirst + update/create — لا يحذف الموجود) ----------
  const tournaments = [
    { name: "Botola Pro", nameAr: "الدوري المغربي", country: "المغرب", type: "league", order: 1 },
    { name: "Ligue 1 Algeria", nameAr: "الدوري الجزائري", country: "الجزائر", type: "league", order: 2 },
    { name: "Ligue Professionnelle 1", nameAr: "الدوري التونسي", country: "تونس", type: "league", order: 3 },
    { name: "Egyptian Premier League", nameAr: "الدوري المصري", country: "مصر", type: "league", order: 4 },
    { name: "Saudi Pro League", nameAr: "دوري روشن السعودي", country: "السعودية", type: "league", order: 5 },
    { name: "UAE Pro League", nameAr: "الدوري الإماراتي", country: "الإمارات", type: "league", order: 6 },
    { name: "Premier League", nameAr: "الدوري الإنجليزي", country: "إنجلترا", type: "league", order: 7 },
    { name: "La Liga", nameAr: "الدوري الإسباني", country: "إسبانيا", type: "league", order: 8 },
    { name: "Serie A", nameAr: "الدوري الإيطالي", country: "إيطاليا", type: "league", order: 9 },
    { name: "Bundesliga", nameAr: "الدوري الألماني", country: "ألمانيا", type: "league", order: 10 },
    { name: "Ligue 1", nameAr: "الدوري الفرنسي", country: "فرنسا", type: "league", order: 11 },
    { name: "UEFA Champions League", nameAr: "دوري أبطال أوروبا", country: "أوروبا", type: "cup", order: 12 },
    { name: "CAF Champions League", nameAr: "دوري أبطال إفريقيا", country: "إفريقيا", type: "cup", order: 13 },
    { name: "Africa Cup of Nations", nameAr: "كأس أمم إفريقيا", country: "إفريقيا", type: "international", order: 14 },
    { name: "FIFA World Cup", nameAr: "كأس العالم", country: "دولي", type: "international", order: 15 },
  ];
  for (const t of tournaments) {
    const existing = await db.tournament.findFirst({ where: { name: t.name } });
    if (existing) {
      await db.tournament.update({
        where: { id: existing.id },
        data: { nameAr: t.nameAr, country: t.country, type: t.type, order: t.order },
      });
      continue;
    }
    await db.tournament.create({
      data: {
        name: t.name,
        nameAr: t.nameAr,
        logo: svgLogo(t.nameAr, { shape: "shield" }),
        country: t.country,
        type: t.type,
        order: t.order,
        visible: true,
      },
    });
  }

  // ---------- Teams (findFirst + update/create — لا يحذف الموجود) ----------
  const teamsByLeague: Record<string, string[]> = {
    "Botola Pro": ["الوداد", "الرجاء", "الجيش الملكي", "المغرب الفاسي", " FAR الرباط"],
    "Egyptian Premier League": ["الأهلي المصري", "الزمالك", "بيراميدز", "المصري البورسعيدي"],
    "Saudi Pro League": ["الهلال", "النصر", "الاتحاد", "الأهلي السعودي"],
    "Premier League": ["مانشستر سيتي", "أرسنال", "ليفربول", "تشيلسي", "مانشستر يونايتد", "توتنهام"],
    "La Liga": ["ريال مدريد", "برشلونة", "أتلتيكو مدريد", "إشبيلية", "فالنسيا"],
    "Serie A": ["يوفنتوس", "إنتر ميلان", "ميلان", "نابولي", "روما", "لاتسيو"],
    "Bundesliga": ["بايرن ميونخ", "بوروسيا دورتموند", "لايبزيغ", "فرانكفورت"],
    "Ligue 1": ["باريس سان جيرمان", "مارسيليا", "موناكو", "ليون"],
    "UEFA Champions League": ["ريال مدريد", "مانشستر سيتي", "بايرن ميونخ", "برشلونة"],
    "CAF Champions League": ["الأهلي المصري", "الوداد", "الترجي", "مازيمبي"],
    "Africa Cup of Nations": ["المغرب", "الجزائر", "تونس", "مصر", "السنغال", "نيجيريا", "الكاميرون"],
    "FIFA World Cup": ["البرازيل", "الأرجنتين", "فرنسا", "ألمانيا", "إسبانيا", "إنجلترا", "المغرب"],
  };
  for (const [leagueName, teamNames] of Object.entries(teamsByLeague)) {
    const tournament = await db.tournament.findFirst({ where: { name: leagueName } });
    for (const name of teamNames) {
      // ✅ تحقق أولاً — لا تنشئ مكرر، لا تحذف موجود
      const existing = await db.team.findFirst({ where: { name, tournamentId: tournament?.id } });
      if (existing) continue;
      await db.team.create({
        data: {
          name,
          nameAr: name,
          logo: svgLogo(name, { shape: "circle" }),
          tournamentId: tournament?.id,
        },
      });
    }
  }

  // ---------- Matches (demo schedule — لا يحذف الموجود) ----------
  const bein = await db.channel.findFirst({ where: { name: "beIN Sports 1" } });
  const adSports = await db.channel.findFirst({ where: { name: "Abu Dhabi Sports" } });
  const arryadia = await db.channel.findFirst({ where: { name: "Arryadia" } });
  const demoSport = await db.channel.findFirst({ where: { name: "WazaNI Demo Sport" } });

  const matchSeeds: {
    home: string; away: string; league: string; day: number; hour: number; min?: number;
    status: string; hs?: number; as?: number; stadium?: string; chanId?: string; featured?: boolean;
  }[] = [
    { home: "الأهلي المصري", away: "الزمالك", league: "Egyptian Premier League", day: 0, hour: 20, status: "live", hs: 2, as: 0, stadium: "القاهرة", chanId: bein?.id, featured: true },
    { home: "الهلال", away: "النصر", league: "Saudi Pro League", day: 0, hour: 21, status: "live", hs: 1, as: 1, stadium: "الملك فهد", chanId: adSports?.id },
    { home: "الوداد", away: "الرجاء", league: "Botola Pro", day: 0, hour: 19, status: "scheduled", stadium: "محمد الخامس", chanId: arryadia?.id, featured: true },
    { home: "ريال مدريد", away: "برشلونة", league: "La Liga", day: 0, hour: 22, status: "scheduled", stadium: "سانتياغو برنابيو", chanId: bein?.id },
    { home: "مانشستر سيتي", away: "ليفربول", league: "Premier League", day: 0, hour: 23, status: "scheduled", stadium: "الاتحاد", chanId: bein?.id },
    { home: "بايرن ميونخ", away: "بوروسيا دورتموند", league: "Bundesliga", day: 1, hour: 20, status: "scheduled", stadium: "أليانز أرينا", chanId: bein?.id },
    { home: "باريس سان جيرمان", away: "مارسيليا", league: "Ligue 1", day: 1, hour: 21, status: "scheduled", stadium: "حديقة الأمراء", chanId: bein?.id },
    { home: "يوفنتوس", away: "إنتر ميلان", league: "Serie A", day: 1, hour: 22, status: "scheduled", stadium: "أليانز ستاديوم", chanId: bein?.id },
    { home: "الترجي الرياضي", away: "النجم الساحلي", league: "Ligue Professionnelle 1", day: 0, hour: 16, status: "scheduled", stadium: "رادس", chanId: arryadia?.id },
    { home: "شباب بلوزداد", away: "مولودية الجزائر", league: "Ligue 1 Algeria", day: 0, hour: 17, status: "scheduled", stadium: "5 جويلية", chanId: arryadia?.id },
    { home: "الأهلي المصري", away: "بيراميدز", league: "Egyptian Premier League", day: -1, hour: 20, status: "finished", hs: 3, as: 1, stadium: "القاهرة", chanId: bein?.id },
    { home: "ريال مدريد", away: "أتلتيكو مدريد", league: "La Liga", day: -1, hour: 22, status: "finished", hs: 2, as: 2, stadium: "برنابيو", chanId: bein?.id },
    { home: "بايرن ميونخ", away: "لايبزيغ", league: "Bundesliga", day: -2, hour: 18, status: "finished", hs: 4, as: 0, stadium: "أليانز أرينا", chanId: bein?.id },
    { home: "مانشستر سيتي", away: "تشيلسي", league: "Premier League", day: -2, hour: 17, status: "finished", hs: 2, as: 1, stadium: "الاتحاد", chanId: bein?.id },
    { home: "المغرب", away: "الجزائر", league: "Africa Cup of Nations", day: 2, hour: 20, status: "scheduled", stadium: "أواسلا", chanId: adSports?.id, featured: true },
    { home: "السنغال", away: "نيجيريا", league: "Africa Cup of Nations", day: 2, hour: 22, status: "scheduled", stadium: "أواسلا", chanId: adSports?.id },
    { home: "ريال مدريد", away: "مانشستر سيتي", league: "UEFA Champions League", day: 3, hour: 21, status: "scheduled", stadium: "برنابيو", chanId: bein?.id, featured: true },
    { home: "الأهلي المصري", away: "الوداد", league: "CAF Champions League", day: 3, hour: 19, status: "scheduled", stadium: "القاهرة", chanId: arryadia?.id },
    { home: "الأرجنتين", away: "البرازيل", league: "FIFA World Cup", day: 5, hour: 20, status: "scheduled", stadium: "لوسيل", chanId: bein?.id, featured: true },
  ];
  for (const m of matchSeeds) {
    const homeTeam = await db.team.findFirst({ where: { name: m.home } });
    const awayTeam = await db.team.findFirst({ where: { name: m.away } });
    const tournament = await db.tournament.findFirst({ where: { name: m.league } });
    const kickoff = at(m.day, m.hour, m.min ?? 0);

    // ✅ تحقق أولاً لو المباراة موجودة (نفس الفريقين فقط — بدون kickoff
    // لأن at() تستخدم التاريخ الحالي فتتغير كل يوم وتسبب تكرارات)
    // لا تنشئ مكرر، لا تحذف موجود، لا تمسح روابط البث التي ضبطها المسؤول
    const existing = await db.match.findFirst({
      where: {
        homeName: m.home,
        awayName: m.away,
      },
    });
    if (existing) {
      // حدّث الحقول التجريبية + وقت المباراة ليوم اليوم
      // (لا تمسح stream1Url/stream2Url/stream3Url — روابط المسؤول محفوظة)
      await db.match.update({
        where: { id: existing.id },
        data: {
          tournamentId: tournament?.id ?? existing.tournamentId,
          tournamentName: tournament?.nameAr ?? m.league,
          kickoff, // حدّث الوقت ليوم اليوم
          status: m.status,
          homeScore: m.hs ?? existing.homeScore,
          awayScore: m.as ?? existing.awayScore,
          stadium: m.stadium ?? existing.stadium,
          channelId: m.chanId ?? existing.channelId,
          featured: m.featured ?? existing.featured,
          demo: true,
        },
      });
      continue;
    }

    // مباراة جديدة — أنشئها
    await db.match.create({
      data: {
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        homeName: m.home,
        awayName: m.away,
        homeLogo: homeTeam?.logo ?? svgLogo(m.home, { shape: "circle" }),
        awayLogo: awayTeam?.logo ?? svgLogo(m.away, { shape: "circle" }),
        tournamentId: tournament?.id,
        tournamentName: tournament?.nameAr ?? m.league,
        kickoff,
        status: m.status,
        homeScore: m.hs ?? null,
        awayScore: m.as ?? null,
        stadium: m.stadium ?? null,
        channelId: m.chanId ?? demoSport?.id,
        featured: m.featured ?? false,
        demo: true,
      },
    });
  }

  // ---------- Settings ----------
  await db.setting.upsert({
    where: { key: "app.name" },
    update: {},
    create: { key: "app.name", value: "WazaNI TV" },
  });
  await db.setting.upsert({
    where: { key: "app.tagline" },
    update: {},
    create: { key: "app.tagline", value: "القنوات العربية ومباريات كرة القدم" },
  });

  console.log("Seed complete.");

  return {
    countries: await db.country.count(),
    categories: await db.category.count(),
    channels: await db.channel.count(),
    tournaments: await db.tournament.count(),
    teams: await db.team.count(),
    matches: await db.match.count(),
  };
}
