// BUMP CACHE_VERSION ON ANY CHANGE TO THE APP SHELL OR CONTENT.
// Skipping this leaves players on a stale cached game.
const CACHE_VERSION = "bz-v1";

// Everything the game needs to play fully offline after the first visit.
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./styles/tokens.css",
  "./styles/base.css",
  "./fonts/baloo2-latin.woff2",
  "./fonts/atkinson-400.woff2",
  "./fonts/atkinson-700.woff2",
  "./src/app.js",
  "./src/i18n.js",
  "./src/content/loader.js",
  "./src/store/db.js",
  "./src/engine/ledger.js",
  "./src/engine/rules.js",
  "./src/engine/game.js",
  "./src/engine/nickname.js",
  "./src/engine/rng.js",
  "./src/ui/h.js",
  "./src/ui/icons.js",
  "./src/ui/components.js",
  "./src/screens/welcome.js",
  "./content/version.json",
  "./content/targets.json",
  "./content/economy.json",
  "./content/shop.json",
  "./content/levels.json",
  "./content/badges.json",
  "./content/missions.json",
  "./content/flags.json",
  "./content/nickname-blocklist.json",
  "./content/strings/en.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for our own files (the game must play offline);
// anything not yet cached is fetched and stored for next time.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
