'use strict';
/* 고등어디 서비스워커: 한 번 열어 본 뒤에는 인터넷이 약해도 열려요. 인터넷이 되면 최신 파일을 먼저 받고, 안 될 때만 저장본을 보여 줘요.
   새 버전을 올릴 때는 VERSION 숫자를 바꿔요. */
const VERSION = 'gdd-v3';
const CORE = ['./', 'index.html', '브랜드/디자인시스템/tokens.css', 'style.css', '브랜드/로고/svg/godeungeodi-horizontal-white.svg', 'manifest.webmanifest', 'fonts/PretendardVariable.woff2',
  'assets/favicon.svg', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/icon-512.png',
  'data/map.js', 'data/config.js', 'data/counts.js', 'data/submap.js', 'data/schools.js', 'data/leveling.js', 'data/regions.js', 'data/classify.js', 'data/groups.js', 'data/special.js', 'data/kinds.js', 'data/select.js', 'data/schedule.js', 'data/region_schedule.js', 'data/questions.js',
  'js/store.js', 'js/score.js', 'js/ui.js', 'js/screens.js', 'js/pwa.js', 'js/app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const same = new URL(r.url).origin === self.location.origin;
  e.respondWith(fetch(r).then(res => {
    if (same && res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
