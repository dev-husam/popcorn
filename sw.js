'use strict';
/* Service worker: offline-first app shell, runtime cache for fonts. Bump VERSION on every release. */
const VERSION = 'popcorn-v3';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/base.css', './css/machine.css', './css/components.css', './css/winner.css', './css/responsive.css',
  './js/util.js', './js/store.js', './js/sound.js', './js/fx.js', './js/chamber.js', './js/ui.js',
  './js/students.js', './js/teams.js', './js/game.js', './js/extras.js', './js/pwa.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/icon.svg'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {                       // network first for the page, fall back to cache
    e.respondWith(fetch(req).then(r => { caches.open(VERSION).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin === location.origin || font) {        // cache first, refresh in background
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) caches.open(VERSION).then(c => c.put(req, r.clone())); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
