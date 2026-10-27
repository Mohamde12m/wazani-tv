// WazaNI TV Service Worker — نسخة احترافية للتطبيق
// يجعل التطبيق PWA: قابل للتثبيت + يعمل بلا اتصال (آخر بيانات)

const CACHE_NAME = "wazani-tv-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-1024.png",
  "/wazani-logo.png",
];

// تثبيت: خزّن الأصول الثابتة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// تفعيل: امسح كل الكاش القديم فورًا
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

// استراتيجية ذكية:
// - navigation (HTML): Network First مع fallback للكاش
// - _next/static chunks: Network First دائمًا
// - API requests: Network First مع fallback للكاش
// - أصول ثابتة (أيقونات): Cache First مع تحديث خلفي
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // تجاهل الطلبات غير GET
  if (req.method !== "GET") return;

  // تجاهل طلبات streaming/proxy
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

  // Next.js chunks و HMR — Network First
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes("/__nextjs")
  ) {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((c) => c || Response.error())
      )
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

  // الأصول الثابتة — Cache First مع تحديث خلفي
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

// دعم الإشعارات المحلية (Local Notifications)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
