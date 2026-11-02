/**
 * بيانات الأفلام التجريبية لقسم الأفلام
 *
 * يمكن استبدالها لاحقًا بـ API حقيقي أو إدارتها من لوحة التحكم.
 * كل فيلم له: عنوان، وصف، تقييم، مدة، نوع، سنة، وجراديانت لوني للبوستر.
 */

export interface Movie {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  rating: number; // /10
  duration: string; // "2س 15د"
  year: number;
  genres: string[];
  gradient: string; // CSS gradient for poster
  featured?: boolean;
}

export const MOVIES: Movie[] = [
  {
    id: "m1",
    title: "الحفرة",
    titleEn: "The Pit",
    description: "مسلسل تركي ملحمي يدور حول عائلة تواجه مؤامرات سياسية واقتصادية في إسطنبول.",
    rating: 8.7,
    duration: "2س 30د",
    year: 2024,
    genres: ["دراما", "أكشن"],
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    featured: true,
  },
  {
    id: "m2",
    title: "المؤسس",
    titleEn: "The Founder",
    description: "قصة حقيقية عن كيف بنى راي كروك إمبراطورية ماكدونالدز العالمية.",
    rating: 7.8,
    duration: "1س 55د",
    year: 2023,
    genres: ["دراما", "سيرة ذاتية"],
    gradient: "linear-gradient(135deg, #2c1810 0%, #5c3a1e 50%, #8b5a2b 100%)",
    featured: true,
  },
  {
    id: "m3",
    title: "الفارس الأسود",
    titleEn: "Dark Knight",
    description: "باتمان يواجه أكبر تحدياته النفسية والجسدية ضد الجوكر في غوثام سيتي.",
    rating: 9.0,
    duration: "2س 32د",
    year: 2022,
    genres: ["أكشن", "جريمة"],
    gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)",
    featured: true,
  },
  {
    id: "m4",
    title: "صندوق الطائر",
    titleEn: "Bird Box",
    description: "في فيلم إثارة ما بعد الكارثة، تحاول أم حماية طفليها من كيان خارق يدفع الناس للانتحار.",
    rating: 7.2,
    duration: "2س 4د",
    year: 2023,
    genres: ["إثارة", "خيال علمي"],
    gradient: "linear-gradient(135deg, #1c1c1c 0%, #2e2e2e 50%, #3d3d3d 100%)",
    featured: true,
  },
  {
    id: "m5",
    title: "البداية",
    titleEn: "Inception",
    description: "لص محترف يسرق الأسرار من اللاوعي يُكلَّف بمهمة عكسية: زرع فكرة في عقل هدف.",
    rating: 8.8,
    duration: "2س 28د",
    year: 2021,
    genres: ["خيال علمي", "أكشن"],
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #533483 100%)",
    featured: true,
  },
  {
    id: "m6",
    title: "الفهد",
    titleEn: "The Leopard",
    description: "ملحمة تاريخية عن نبلاء صقلية في زمن التوحيد الإيطالي وتغير العالم من حولهم.",
    rating: 8.1,
    duration: "3س 5د",
    year: 2020,
    genres: ["دراما", "تاريخي"],
    gradient: "linear-gradient(135deg, #3e1f0f 0%, #7d4426 50%, #c2884a 100%)",
  },
  {
    id: "m7",
    title: "الزمالك",
    titleEn: "The Knot",
    description: "دراما عربية عن عائلة ممزقة بين الماضي والحاضر في القاهرة القديمة.",
    rating: 7.5,
    duration: "1س 48د",
    year: 2024,
    genres: ["دراما", "رومانسي"],
    gradient: "linear-gradient(135deg, #1b3a2c 0%, #2d6a4f 50%, #52b788 100%)",
  },
  {
    id: "m8",
    title: "الرمي الأخير",
    titleEn: "Last Shot",
    description: "جندي سابق يخوض مهمة أخيرة لإنقاذ ابنه من عصابة خطيرة.",
    rating: 6.9,
    duration: "1س 42د",
    year: 2023,
    genres: ["أكشن", "إثارة"],
    gradient: "linear-gradient(135deg, #1a0a0a 0%, #3d1010 50%, #6b2020 100%)",
  },
  {
    id: "m9",
    title: "نجمة الصحراء",
    titleEn: "Desert Star",
    description: "قصة فتاة بدوية تكافح لحماية قطيعها في الصحراء المغربية القاسية.",
    rating: 8.3,
    duration: "2س 10د",
    year: 2024,
    genres: ["دراما", "مغامرة"],
    gradient: "linear-gradient(135deg, #3d2b1f 0%, #c2884a 50%, #f5deb3 100%)",
  },
  {
    id: "m10",
    title: "المدينة المظلمة",
    titleEn: "Dark City",
    description: "رجل يستيقظ بدون ذاكرة في مدينة لا تنام فيها الشمس ويكتشف حقيقة مرعبة.",
    rating: 7.7,
    duration: "1س 40د",
    year: 2022,
    genres: ["خيال علمي", "إثارة"],
    gradient: "linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #16213e 100%)",
  },
  {
    id: "m11",
    title: "قلب الذهب",
    titleEn: "Heart of Gold",
    description: "مغامرة بحث عن كنز مفقود في أعماق غابات الأمازون.",
    rating: 7.0,
    duration: "2س 15د",
    year: 2023,
    genres: ["مغامرة", "أكشن"],
    gradient: "linear-gradient(135deg, #1a3c1a 0%, #2d5a27 50%, #4caf50 100%)",
  },
  {
    id: "m12",
    title: "همس الريح",
    titleEn: "Whisper of the Wind",
    description: "قصة حب رومانسية تدور في قرية جبلية لبنانية بين الحرب والأمل.",
    rating: 8.0,
    duration: "1س 55د",
    year: 2024,
    genres: ["رومانسي", "دراما"],
    gradient: "linear-gradient(135deg, #2c1b3d 0%, #6a4c93 50%, #c5a5cf 100%)",
  },
];

/** الأفلام المميزة للشريط المنزلق العلوي */
export const FEATURED_MOVIES = MOVIES.filter((m) => m.featured);

/** تجميع الأفلام حسب النوع */
export function getMoviesByGenre(genre: string): Movie[] {
  return MOVIES.filter((m) => m.genres.includes(genre));
}

/** كل الأنواع المتاحة */
export const ALL_GENRES = Array.from(
  new Set(MOVIES.flatMap((m) => m.genres))
).sort();
