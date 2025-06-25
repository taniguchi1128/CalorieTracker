const CACHE_NAME = 'calorie-app-v2'; // キャッシュ名。バージョン管理に使う
const urlsToCache = [
  './', // index.html
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  // './js/utils.js', // utils.jsも追加するならコメント解除
  './images/dining_icon-192x192.png',
  './images/dining_icon-512x512.png',
  './images/dining_maskable_icon.png'
];

// インストールイベント: キャッシュにファイルを保存
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベートイベント: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// フェッチイベント: リクエストをインターセプトしてキャッシュから応答
self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML files) might need a network-first strategy for fresh content,
  // but for a simple PWA, cache-first is fine for offline.
  // For most assets (CSS, JS, images), cache-first is good.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Fetched from cache', event.request.url);
          return response;
        }
        console.log('Service Worker: Fetched from network', event.request.url);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('Service Worker: Fetch failed:', event.request.url, error);
        // オフライン時に表示する代替ページなどがあればここで返す
        // return caches.match('/offline.html');
      })
  );
});