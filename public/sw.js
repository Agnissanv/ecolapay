// Service worker minimal pour EcolaPay : rend l'app installable (PWA) SANS
// mettre en cache les pages ou les données. Un caissier ou un directeur ne
// doit jamais voir un solde, un statut de paiement ou un dashboard périmé
// à cause d'un cache — donc seuls les fichiers vraiment statiques (icônes,
// manifest) passent par le cache. Tout le reste (pages, actions serveur,
// webhook) va toujours directement au réseau.
const CACHE_NAME = "ecolapay-static-v1";
const STATIC_ASSETS = [
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Pas de "else" : toute autre requête n'est pas interceptée du tout et
  // suit son chemin réseau normal.
});
