/* ネコねこハック ジェネレーター service worker
   - Core files are precached so the app can be installed and opened offline.
   - Page navigations are network-first so updates arrive when online.
   - Other same-origin files (images, audio, video) are cached on first use.
   Bump CACHE_VERSION whenever the app is updated. */
var CACHE_VERSION = "nnh-v1";
var CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(CORE);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (cache) { cache.put("./index.html", copy); });
        return res;
      }).catch(function () {
        return caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      });
    })
  );
});
