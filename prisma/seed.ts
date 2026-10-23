 
import { PrismaClient } from "@prisma/client";
import { svgLogo } from "../src/lib/logo";

const db = new PrismaClient();

// Public, legitimately-available test HLS streams used only for clearly-labeled
// "بث تجريبي" demo channels so the player actually demonstrates HLS playback.
const TEST_STREAMS = {
  bigBuckBunny: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  appleBipbop: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
  muxTears: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8",
};

function now() { return new Date(); }
function at(daysOffset: number, hour: number, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding WazaNI TV...");

  // ---------- Countries ----------
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
    await db.country.upsert({ where: { code: c.code }, update: c, create: c });
  }

  // ---------- Categories ----------
  const categories = [
    { name: "رياضية", slug: "sports", icon: "Trophy", order: 1, isSports: true },
    { name: "إخبارية", slug: "news", icon: "Newspaper", order: 2 },
    { name: "ترفيهية", slug: "entertainment", icon: "Clapperboard", order: 3 },
    { name: "دينية", slug: "religious", icon: "Moon", order: 4 },
    { name: "وثائقية", slug: "documentary", icon: "Globe", order: 5 },
    { name: "أفلام", slug: "movies", icon: "Film", order: 6 },
    { name: "للأطفال", slug: "kids", icon: "Baby", order: 7 },
    { name: "موسيقى", slug: "music", icon: "Music", order: 8 },
    { name: "عامة", slug: "general", icon: "Tv", order: 9 },
  ];
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const cat = async (slug: string) => (await db.category.findUnique({ where: { slug } }))!;

  // ---------- Channels ----------
  // Helper to create a channel. streamType "none" means honestly unavailable.
  type ChanSeed = {
    name: string; nameAr?: string; country: string; cat: string;
    stream?: string; streamType?: string; verified?: boolean; featured?: boolean; order: number;
  };
  const chanSeeds: ChanSeed[] = [
    // Demo channels with real working public test streams (clearly labeled بث تجريبي)
    { name: "WazaNI Demo Sport", nameAr: "بث تجريبي - رياضة", country: "AR", cat: "sports", stream: TEST_STREAMS.bigBuckBunny, streamType: "hls", verified: true, featured: true, order: 1 },
    { name: "WazaNI Demo Cinema", nameAr: "بث تجريبي - سينما", country: "AR", cat: "movies", stream: TEST_STREAMS.appleBipbop, streamType: "hls", verified: true, featured: true, order: 2 },
    { name: "WazaNI Demo News", nameAr: "بث تجريبي - أخبار", country: "AR", cat: "news", stream: TEST_STREAMS.muxTears, streamType: "hls", verified: true, order: 3 },

    // Moroccan
    { name: "2M Maroc", nameAr: "دوزيم", country: "MA", cat: "general", order: 10, featured: true },
    { name: "Al Aoula", nameAr: "الأولى", country: "MA", cat: "general", order: 11 },
    { name: "Arryadia", nameAr: "الرياضية", country: "MA", cat: "sports", order: 12, featured: true },
    { name: "Arrabiaa", nameAr: "الرابعة", country: "MA", cat: "documentary", order: 13 },
    { name: "Al Maghribia", nameAr: "المغربية", country: "MA", cat: "general", order: 14 },
    { name: "Assadissa", nameAr: "السادسة", country: "MA", cat: "religious", order: 15 },
    { name: "Tamazight", nameAr: "تمازيغت", country: "MA", cat: "general", order: 16 },
    { name: "Medi1 TV", nameAr: "ميدي 1", country: "MA", cat: "news", order: 17, featured: true },
    { name: "Chada TV", nameAr: "شذا", country: "MA", cat: "music", order: 18 },
    // Algerian
    { name: "ENTV", nameAr: "التلفزيون الجزائري", country: "DZ", cat: "general", order: 20 },
    { name: "Canal Algérie", nameAr: "قناة الجزائر", country: "DZ", cat: "general", order: 21 },
    { name: "A3", nameAr: "القناة الثالثة", country: "DZ", cat: "general", order: 22 },
    { name: "Echorouk TV", nameAr: "الشروق", country: "DZ", cat: "news", order: 23 },
    { name: "Ennahar TV", nameAr: "النهار", country: "DZ", cat: "news", order: 24 },
    { name: "El Bilad", nameAr: "البلاد", country: "DZ", cat: "news", order: 25 },
    { name: "Dzair TV", nameAr: "الجزائرية", country: "DZ", cat: "general", order: 26 },
    // Tunisian
    { name: "Watania 1", nameAr: "الوطنية 1", country: "TN", cat: "general", order: 30 },
    { name: "Watania 2", nameAr: "الوطنية 2", country: "TN", cat: "general", order: 31 },
    { name: "Nessma", nameAr: "نسمة", country: "TN", cat: "entertainment", order: 32 },
    { name: "Hannibal TV", nameAr: "حنبعل", country: "TN", cat: "entertainment", order: 33 },
    { name: "El Hiwar Ettounsi", nameAr: "الحوار التونسي", country: "TN", cat: "general", order: 34 },
    // Egyptian
    { name: "Al Hayat", nameAr: "الحياة", country: "EG", cat: "general", order: 40, featured: true },
    { name: "Al Nahar", nameAr: "النهار", country: "EG", cat: "general", order: 41 },
    { name: "ON E", nameAr: "أون", country: "EG", cat: "general", order: 42, featured: true },
    { name: "CBC", nameAr: "سي بي سي", country: "EG", cat: "entertainment", order: 43 },
    { name: "DMC", nameAr: "دي إم سي", country: "EG", cat: "general", order: 44 },
    { name: "Ten", nameAr: "تين", country: "EG", cat: "entertainment", order: 45 },
    { name: "Sada El Balad", nameAr: "صدى البلد", country: "EG", cat: "news", order: 46 },
    // Saudi
    { name: "SBC", nameAr: "إس بي سي", country: "SA", cat: "general", order: 50 },
    { name: "Saudi TV", nameAr: "القناة السعودية", country: "SA", cat: "general", order: 51 },
    { name: "Saudi 24", nameAr: "سعودي 24", country: "SA", cat: "news", order: 52 },
    // UAE
    { name: "Abu Dhabi TV", nameAr: "أبوظبي", country: "AE", cat: "general", order: 60, featured: true },
    { name: "Dubai TV", nameAr: "دبي", country: "AE", cat: "general", order: 61, featured: true },
    { name: "Sama Dubai", nameAr: "سما دبي", country: "AE", cat: "entertainment", order: 62 },
    { name: "Abu Dhabi Sports", nameAr: "أبوظبي الرياضية", country: "AE", cat: "sports", order: 63, featured: true },
    // Qatar
    { name: "Al Jazeera", nameAr: "الجزيرة", country: "QA", cat: "news", order: 70, featured: true },
    { name: "Al Jazeera Mubasher", nameAr: "الجزيرة مباشر", country: "QA", cat: "news", order: 71 },
    { name: "beIN Sports 1", nameAr: "بي إن سبورتس 1", country: "QA", cat: "sports", order: 72, featured: true },
    { name: "beIN Sports 2", nameAr: "بي إن سبورتس 2", country: "QA", cat: "sports", order: 73 },
    // Kuwait
    { name: "KTV1", nameAr: "الكويت 1", country: "KW", cat: "general", order: 80 },
    { name: "KTV2", nameAr: "الكويت 2", country: "KW", cat: "entertainment", order: 81 },
    { name: "KTV Sport", nameAr: "الكويت الرياضية", country: "KW", cat: "sports", order: 82 },
    // Iraq
    { name: "Al Iraqiya", nameAr: "العراقية", country: "IQ", cat: "general", order: 90 },
    { name: "Al Sharqiya", nameAr: "الشرقية", country: "IQ", cat: "general", order: 91 },
    { name: "Al Rasheed", nameAr: "الرشيد", country: "IQ", cat: "entertainment", order: 92 },
    // Jordan
    { name: "JRTV", nameAr: "التلفزيون الأردني", country: "JO", cat: "general", order: 100 },
    { name: "Jordan Sport", nameAr: "الأردن الرياضية", country: "JO", cat: "sports", order: 101 },
    // Lebanon
    { name: "LBCI", nameAr: "إل بي سي", country: "LB", cat: "general", order: 110, featured: true },
    { name: "MTV Lebanon", nameAr: "إم تي في", country: "LB", cat: "general", order: 111 },
    { name: "Al Jadeed", nameAr: "الجديد", country: "LB", cat: "news", order: 112 },
    { name: "NBN", nameAr: "إن بي إن", country: "LB", cat: "general", order: 113 },
    // Palestine
    { name: "Palestine TV", nameAr: "فلسطين", country: "PS", cat: "general", order: 120 },
    { name: "Maan TV", nameAr: "معا", country: "PS", cat: "news", order: 121 },
    // Syria
    { name: "Syria TV", nameAr: "سوريا", country: "SY", cat: "general", order: 130 },
    { name: "Sama TV", nameAr: "سما", country: "SY", cat: "general", order: 131 },
    // Sudan
    { name: "Sudan TV", nameAr: "السودان", country: "SD", cat: "general", order: 140 },
    { name: "Blue Nile", nameAr: "النيل الأزرق", country: "SD", cat: "news", order: 141 },
    // Libya
    { name: "Libya TV", nameAr: "ليبيا", country: "LY", cat: "general", order: 150 },
    { name: "Libya Al Ahrar", nameAr: "ليبيا الأحرار", country: "LY", cat: "news", order: 151 },
    // Yemen
    { name: "Yemen TV", nameAr: "اليمن", country: "YE", cat: "general", order: 160 },
    { name: "Suhail TV", nameAr: "سهيل", country: "YE", cat: "general", order: 161 },
    // Arab general / pan-Arab
    { name: "Al Arabiya", nameAr: "العربية", country: "AR", cat: "news", order: 170, featured: true },
    { name: "Al Mayadeen", nameAr: "الميادين", country: "AR", cat: "news", order: 171 },
    { name: "Al Hadath", nameAr: "الحدث", country: "AR", cat: "news", order: 172 },
    { name: "Sky News Arabia", nameAr: "سكاي نيوز عربية", country: "AR", cat: "news", order: 173, featured: true },
    { name: "Rotana Cinema", nameAr: "روتانا سينما", country: "AR", cat: "movies", order: 180, featured: true },
    { name: "Rotana Khalijia", nameAr: "روتانا خليجية", country: "AR", cat: "entertainment", order: 181 },
    { name: "MBC1", nameAr: "إم بي سي 1", country: "AR", cat: "general", order: 190, featured: true },
    { name: "MBC2", nameAr: "إم بي سي 2", country: "AR", cat: "movies", order: 191 },
    { name: "MBC3", nameAr: "إم بي سي 3", country: "AR", cat: "kids", order: 192 },
    { name: "MBC4", nameAr: "إم بي سي 4", country: "AR", cat: "entertainment", order: 193 },
    { name: "MBC Action", nameAr: "إم بي سي أكشن", country: "AR", cat: "entertainment", order: 194 },
    { name: "MBC Drama", nameAr: "إم بي سي دراما", country: "AR", cat: "entertainment", order: 195 },
    { name: "MBC Masr", nameAr: "إم بي سي مصر", country: "EG", cat: "general", order: 196 },
    // Religious & documentary
    { name: "Al Quran Al Kareem", nameAr: "القرآن الكريم", country: "SA", cat: "religious", order: 200, featured: true },
    { name: "Al Resalah", nameAr: "الرسالة", country: "SA", cat: "religious", order: 201 },
    { name: "Iqraa", nameAr: "اقرأ", country: "SA", cat: "religious", order: 202 },
    { name: "Al Majd", nameAr: "المجد", country: "SA", cat: "religious", order: 203 },
    { name: "Huda TV", nameAr: "هدى", country: "AR", cat: "religious", order: 204 },
    { name: "Al Jazeera Documentary", nameAr: "الجزيرة الوثائقية", country: "QA", cat: "documentary", order: 210 },
    { name: "Nat Geo Abu Dhabi", nameAr: "ناشيونال جيوغرافيك", country: "AE", cat: "documentary", order: 211 },
  ];

  await db.channel.deleteMany({});
  for (const s of chanSeeds) {
    const c = await db.country.findUnique({ where: { code: s.country } });
    const catg = await db.category.findUnique({ where: { slug: s.cat } });
    const isDemo = !!s.stream;
    await db.channel.create({
      data: {
        name: s.name,
        nameAr: s.nameAr ?? s.name,
        logo: svgLogo(s.nameAr ?? s.name, { shape: "square" }),
        countryId: c?.id,
        categoryId: catg?.id,
        streamUrl: s.stream ?? null,
        streamType: s.streamType ?? "none",
        verified: s.verified ?? false,
        featured: s.featured ?? false,
        active: true,
        demo: isDemo,
        order: s.order,
      },
    });
  }
  console.log(`Channels: ${await db.channel.count()}`);

  // ---------- Tournaments ----------
  const tourneys = [
    { name: "Botola Pro", nameAr: "الدوري المغربي", country: "المغرب", type: "league", order: 1 },
    { name: "Ligue 1 Algérie", nameAr: "الدوري الجزائري", country: "الجزائر", type: "league", order: 2 },
    { name: "Ligue Pro Tunisienne", nameAr: "الدوري التونسي", country: "تونس", type: "league", order: 3 },
    { name: "Saudi Pro League", nameAr: "دوري روشن السعودي", country: "السعودية", type: "league", order: 4 },
    { name: "Egyptian Premier League", nameAr: "الدوري المصري", country: "مصر", type: "league", order: 5 },
    { name: "Premier League", nameAr: "الدوري الإنجليزي", country: "إنجلترا", type: "league", order: 6 },
    { name: "La Liga", nameAr: "الدوري الإسباني", country: "إسبانيا", type: "league", order: 7 },
    { name: "Serie A", nameAr: "الدوري الإيطالي", country: "إيطاليا", type: "league", order: 8 },
    { name: "Bundesliga", nameAr: "الدوري الألماني", country: "ألمانيا", type: "league", order: 9 },
    { name: "Ligue 1", nameAr: "الدوري الفرنسي", country: "فرنسا", type: "league", order: 10 },
    { name: "UEFA Champions League", nameAr: "دوري أبطال أوروبا", country: "أوروبا", type: "cup", order: 11 },
    { name: "CAF Champions League", nameAr: "دوري أبطال إفريقيا", country: "إفريقيا", type: "cup", order: 12 },
    { name: "AFCON", nameAr: "كأس أمم إفريقيا", country: "إفريقيا", type: "international", order: 13 },
    { name: "FIFA World Cup", nameAr: "كأس العالم", country: "دولي", type: "international", order: 14 },
  ];
  await db.tournament.deleteMany({});
  await db.team.deleteMany({});
  const tMap: Record<string, string> = {};
  for (const t of tourneys) {
    const created = await db.tournament.create({
      data: { ...t, logo: svgLogo(t.nameAr, { shape: "shield" }), visible: true },
    });
    tMap[t.name] = created.id;
  }

  // ---------- Teams ----------
  const teamsByLeague: Record<string, string[]> = {
    "Botola Pro": ["الوداد الرياضي", "الرجاء الرياضي", "المغرب الفاسي", "نهامة تطوان", "الجيش الملكي", "المغرب التطواني"],
    "Ligue 1 Algérie": ["شباب بلوزداد", "مولودية الجزائر", "وفاق سطيف", "اتحاد العاصمة", "شباب قسنطينة"],
    "Ligue Pro Tunisienne": ["الترجي الرياضي", "النجم الساحلي", "الصفاقسي", "الاتحاد المنستيري", "النادي الإفريقي"],
    "Saudi Pro League": ["الهلال", "النصر", "الاتحاد", "الأهلي", "الشباب", "التعاون"],
    "Egyptian Premier League": ["الأهلي المصري", "الزمالك", "المصري البورسعيدي", "بيراميدز", "إيسترن كومباني"],
    "Premier League": ["ليفربول", "مانشستر سيتي", "آرسنال", "تشيلسي", "مانشستر يونايتد", "توتنهام"],
    "La Liga": ["ريال مدريد", "برشلونة", "أتلتيكو مدريد", "إشبيلية", "ريال سوسيداد", "فياريال"],
    "Serie A": ["إنتر ميلان", "يوفنتوس", "ميلان", "نابولي", "روما", "لاتسيو"],
    "Bundesliga": ["بايرن ميونخ", "بوروسيا دورتموند", "لايبزيغ", "فولفسبورغ", "فرايبورغ"],
    "Ligue 1": ["باريس سان جيرمان", "مارسيليا", "موناكو", "ليل", "ليون"],
    "UEFA Champions League": ["ريال مدريد", "مانشستر سيتي", "بايرن ميونخ", "باريس سان جيرمان", "برشلونة"],
    "CAF Champions League": ["الأهلي المصري", "الوداد الرياضي", "التجاني الموري", "مازيمبي", "الترجي الرياضي"],
    "AFCON": ["المغرب", "السنغال", "الجزائر", "مصر", "نيجيريا", "تونس"],
    "FIFA World Cup": ["الأرجنتين", "فرنسا", "المغرب", "كرواتيا", "البرازيل", "إسبانيا"],
  };
  const teamIdByName: Record<string, string> = {};
  for (const [leagueName, teamNames] of Object.entries(teamsByLeague)) {
    const tid = tMap[leagueName];
    for (const tn of teamNames) {
      const team = await db.team.create({
        data: { name: tn, nameAr: tn, logo: svgLogo(tn, { shape: "circle" }), tournamentId: tid },
      });
      teamIdByName[tn] = team.id;
    }
  }

  // ---------- Matches (demo) ----------
  await db.match.deleteMany({});
  const bein = await db.channel.findFirst({ where: { name: "beIN Sports 1" } });
  const adSports = await db.channel.findFirst({ where: { name: "Abu Dhabi Sports" } });
  const arryadia = await db.channel.findFirst({ where: { name: "Arryadia" } });
  const demoSport = await db.channel.findFirst({ where: { name: "WazaNI Demo Sport" } });

  type M = {
    home: string; away: string; league: string; day: number; hour: number; min?: number;
    status: string; hs?: number; as?: number; stadium?: string; chanId?: string; featured?: boolean;
  };
  const matches: M[] = [
    // Live now
    { home: "الهلال", away: "النصر", league: "Saudi Pro League", day: 0, hour: now().getHours(), min: 30, status: "live", hs: 1, as: 1, stadium: "المملكة أرينا", chanId: bein?.id, featured: true },
    { home: "الأهلي المصري", away: "الزمالك", league: "Egyptian Premier League", day: 0, hour: now().getHours() - 1, status: "live", hs: 2, as: 0, stadium: "القاهرة", chanId: adSports?.id, featured: true },
    // Today scheduled
    { home: "الوداد الرياضي", away: "الرجاء الرياضي", league: "Botola Pro", day: 0, hour: 20, min: 0, status: "scheduled", stadium: "محمد الخامس", chanId: arryadia?.id, featured: true },
    { home: "ليفربول", away: "مانشستر سيتي", league: "Premier League", day: 0, hour: 21, min: 0, status: "scheduled", stadium: "أنفيلد", chanId: bein?.id, featured: true },
    { home: "ريال مدريد", away: "برشلونة", league: "La Liga", day: 0, hour: 22, min: 0, status: "scheduled", stadium: "سانتياغو برنابيو", chanId: bein?.id, featured: true },
    { home: "إنتر ميلان", away: "يوفنتوس", league: "Serie A", day: 0, hour: 19, min: 30, status: "scheduled", stadium: "سان سيرو", chanId: bein?.id },
    { home: "المغرب", away: "السنغال", league: "AFCON", day: 0, hour: 18, min: 0, status: "scheduled", stadium: "أمادو غون كوليبالي", chanId: demoSport?.id, featured: true },
    // Tomorrow
    { home: "بايرن ميونخ", away: "بوروسيا دورتموند", league: "Bundesliga", day: 1, hour: 18, min: 30, status: "scheduled", stadium: "أليانز أرينا", chanId: bein?.id },
    { home: "باريس سان جيرمان", away: "مارسيليا", league: "Ligue 1", day: 1, hour: 21, min: 45, status: "scheduled", stadium: "حديقة الأمراء", chanId: bein?.id, featured: true },
    { home: "شباب بلوزداد", away: "مولودية الجزائر", league: "Ligue 1 Algérie", day: 1, hour: 17, min: 0, status: "scheduled", stadium: "5 جويلية", chanId: arryadia?.id },
    { home: "الترجي الرياضي", away: "النجم الساحلي", league: "Ligue Pro Tunisienne", day: 1, hour: 16, min: 0, status: "scheduled", stadium: "رادس", chanId: arryadia?.id },
    { home: "الأهلي المصري", away: "الوداد الرياضي", league: "CAF Champions League", day: 1, hour: 20, min: 0, status: "scheduled", stadium: "القاهرة", chanId: adSports?.id },
    // Upcoming (day 2-3)
    { home: "ريال مدريد", away: "مانشستر سيتي", league: "UEFA Champions League", day: 2, hour: 22, min: 0, status: "scheduled", stadium: "برنابيو", chanId: bein?.id, featured: true },
    { home: "الأرجنتين", away: "فرنسا", league: "FIFA World Cup", day: 3, hour: 21, min: 0, status: "scheduled", stadium: "لوسيل", chanId: bein?.id, featured: true },
    // Finished (yesterday)
    { home: "مانشستر يونايتد", away: "تشيلسي", league: "Premier League", day: -1, hour: 18, min: 30, status: "finished", hs: 2, as: 1, stadium: "أولد ترافورد", chanId: bein?.id },
    { home: "ميلان", away: "نابولي", league: "Serie A", day: -1, hour: 20, min: 45, status: "finished", hs: 0, as: 0, stadium: "سان سيرو", chanId: bein?.id },
    { home: "الاتحاد", away: "الأهلي", league: "Saudi Pro League", day: -1, hour: 19, min: 0, status: "finished", hs: 3, as: 2, stadium: "الإنماء", chanId: bein?.id },
    { home: "النجم الساحلي", away: "الصفاقسي", league: "Ligue Pro Tunisienne", day: -2, hour: 16, min: 0, status: "finished", hs: 1, as: 0, stadium: "رادس", chanId: arryadia?.id },
    { home: "نيجيريا", away: "تونس", league: "AFCON", day: -2, hour: 18, min: 0, status: "finished", hs: 2, as: 1, stadium: "أملاخو", chanId: demoSport?.id },
  ];

  let order = 0;
  for (const m of matches) {
    const homeTeam = await db.team.findFirst({ where: { name: m.home } });
    const awayTeam = await db.team.findFirst({ where: { name: m.away } });
    const tourn = await db.tournament.findFirst({ where: { name: m.league } });
    await db.match.create({
      data: {
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        homeName: m.home,
        awayName: m.away,
        homeLogo: homeTeam?.logo ?? svgLogo(m.home, { shape: "circle" }),
        awayLogo: awayTeam?.logo ?? svgLogo(m.away, { shape: "circle" }),
        tournamentId: tourn?.id ?? null,
        tournamentName: tourn?.nameAr ?? m.league,
        kickoff: at(m.day, m.hour, m.min ?? 0),
        status: m.status,
        homeScore: m.hs ?? null,
        awayScore: m.as ?? null,
        stadium: m.stadium ?? null,
        channelId: m.chanId ?? null,
        featured: m.featured ?? false,
        demo: true,
      },
    });
    order++;
  }
  console.log(`Matches: ${await db.match.count()}`);

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
