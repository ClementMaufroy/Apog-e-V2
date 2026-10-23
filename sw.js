// Service worker d'Apogée : rend l'application installable et permet de l'ouvrir hors connexion.
// - Page (index.html) : réseau d'abord, pour toujours avoir la dernière version publiée ;
//   copie locale seulement si le réseau ne répond pas.
// - Icônes et bibliothèques versionnées (Chart.js, Firebase…) : copie locale d'abord.
// - Données Firebase : jamais interceptées (Firestore gère son propre cache).
const CACHE = 'apogee-v2-1';
const COQUILLE = ['./', './manifest.webmanifest', './icons/icone-32.png', './icons/icone-192.png', './icons/icone-512.png', './icons/logo.png', './icons/logo-clair.png'];
const EXTERNES = ['https://cdnjs.cloudflare.com/', 'https://www.gstatic.com/firebasejs/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const garder = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => garder(new Request('./'), res))
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  const local = url.origin === self.location.origin;
  if (local || EXTERNES.some(x => req.url.startsWith(x))) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => garder(req, res))));
  }
});
