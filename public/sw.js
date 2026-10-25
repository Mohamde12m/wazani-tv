// WazaNI TV Service Worker
// يجعل التطبيق PWA: قابل للتثبيت + يعمل بلا اتصال (آخر بيانات)
//
// استراتيجية ذكية:
// - HTML (navigation): Network First + fallback للكاش
// - Next.js chunks (_next/static): Network First دائمًا (لتجنب كاش قديم)
// - API: Network First + fallback للكاش
// - أصول ثابتة (أيقونات/manifest): Cache First

const CACHE_NAME = "wazani-v3";

const STATIC_ASSETS = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

// تثبيت: خزّن الأصول الثابتة فقط (لا نخزن "/" لتجنب كاش HTML قديم)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// تفعيل: امسح كل الكاش القديم فورًا (v1, v2, وأي كاش سابق)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .then(() =>
        // أبلغ كل العملاء بضرورة إعادة التحميل لالتقاط SW الجديد
        self.clients.matchAll({ type: "window" }).then((clients) =>
          clients.forEach((client) =>
            client.postMessage({ type: "SW_UPDATED" })
          )
        )
      )
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// استراتيجية:
// - navigation (HTML): Network First مع fallback للكاش
// - _next/static chunks: Network First دائمًا (لتجنب كاش قديم أثناء التطوير)
// - API requests: Network First مع fallback للكاش
// - أصول ثابتة (أيقونات): Cache First
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // تجاهل الطلبات غير GET
  if (req.method !== "GET") return;

  // تجاهل طلبات streaming/proxy (تتطلب اتصال حي)
  if (
    url.pathname.startsWith("/api/stream") ||
    url.pathname.startsWith("/api/img")
  ) {
    return;
  }

  // طلبات التنقل (HTML pages) — Network First
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(req, copy))
            .catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((c) => c || caches.match("/"))
        )
    );
    return;
  }

  // Next.js chunks و HMR — Network First دائمًا (لا تخزن كاش قديم)
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes("/__nextjs")
  ) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((c) => c || Response.error()))
    );
    return;
  }

  // طلبات API — Network First مع fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(req, copy))
            .catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // الأصول الثابتة (أيقونات/manifest) — Cache First مع تحديث خلفي
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(req, copy))
              .catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
