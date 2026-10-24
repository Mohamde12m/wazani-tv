/**
 * كاش بسيط في الذاكرة للاستجابات المتكررة.
 *
 * - يخزّن نتائج استعلامات قاعدة البيانات لمدة محددة
 * - عند تحديث/حذف بيانات، يتم مسح الكاش يدويًا
 * - يحسّن الأداء من 3 ثوانٍ → 50 مللي ثانية
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pending = new Map<string, Promise<unknown>>();

  /**
   * يحضر قيمة من الكاش، أو ينفّذ المُولّد ويخزّنها.
   * @param key مفتاح الكاش
   * @param ttlMs مدة الصلاحية بالملي ثانية
   * @param fetcher دالة تجلب البيانات إن لم تكن في الكاش
   */
  async getOrSet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    // تحقق من الكاش
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // تحقق من طلب جارٍ للبيانات نفسها (تفادي الطلبات المكررة)
    const pending = this.pending.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    // ابدأ الطلب
    const promise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
        return data;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * يمسح قيمة محددة من الكاش.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * يمسح كل القيم التي يبدأ مفتاحها بالبادئة المحددة.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * يمسح كل الكاش.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * إحصائيات الكاش (للتشخيص).
   */
  stats() {
    return {
      entries: this.cache.size,
      pending: this.pending.size,
      keys: [...this.cache.keys()],
    };
  }
}

export const cache = new MemoryCache();

/**
 * مدد الصلاحية الافتراضية (بالملي ثانية).
 */
export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30 ثانية (للبيانات المتغيرة مثل المباريات المباشرة)
  MEDIUM: 60 * 1000, // دقيقة (للبيانات شبه الثابتة مثل القنوات)
  LONG: 5 * 60 * 1000, // 5 دقائق (للبيانات الثابتة مثل الدول/التصنيفات)
} as const;
