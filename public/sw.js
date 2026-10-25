// WazaNI TV Service Worker
// يجعل التطبيق PWA: قابل للتثبيت + يعمل بلا اتصال (آخر بيانات)

const CACHE_NAME = "wazani-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// تثبيت: خزّن الأصول الثابتة
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// تفعيل: امسح الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// استراتيجية:
// - navigation requests (HTML): Network First مع fallback للكاش
// - static assets (JS/CSS/fonts): Cache First
// - API requests: Network First مع fallback للكاش (للطابع الزمني)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // تجاهل الطلبات غير GET
  if (req.method !== "GET") return;

  // تجاهل طلبات streaming/proxy (تتطلب اتصال حي)
  if (url.pathname.startsWith("/api/stream") || url.pathname.startsWith("/api/img")) {
    return;
  }

  // طلبات التنقل (HTML pages) — Network First
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/")))
    );
    return;
  }

  // طلبات API — Network First مع fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // الأصول الثابتة — Cache First
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
