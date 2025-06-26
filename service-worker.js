const CACHE_NAME = 'calorie-app-v2'; // キャッシュ名。サイトを更新するたびにこのバージョン番号を変更してください。
const urlsToCache = [ // 初回インストール時にキャッシュしたいファイルリスト
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/db.js',
    // './images/icon-192x192.png',
    // './images/icon-512x512.png',
    // './images/maskable_icon.png'
];

// インストールイベント: Service Workerが初めてインストールされるときに発生
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME) // 新しいキャッシュを開く
            .then((cache) => {
                console.log('Service Worker: Caching App Shell');
                // urlsToCacheで指定されたすべてのファイルをキャッシュに追加
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // インストールが完了したら、すぐに新しいService Workerをアクティブ化
                // これにより、ページの再読み込みを待たずに新しいService Workerが制御を奪取できる
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Caching failed', error);
            })
    );
});

// アクティベートイベント: 新しいService Workerがアクティブ化されるときに発生
// ここで古いキャッシュをクリーンアップします
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 現在のキャッシュ名（CACHE_NAME）と異なるキャッシュを削除
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => {
                // 現在開いているクライアント（ページ）が、すぐに新しいService Workerの制御下に入るようにする
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Service Worker: Activation failed', error);
            })
    );
});

// フェッチイベント: Service Workerがネットワークリクエストをインターセプトするときに発生
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request) // リクエストがキャッシュにあるか確認
            .then((cachedResponse) => {
                // キャッシュにレスポンスがあればそれを返す
                if (cachedResponse) {
                    return cachedResponse;
                }
                // キャッシュになければネットワークから取得
                return fetch(event.request)
                    .then((response) => {
                        // レスポンスが有効な場合（成功した場合）のみキャッシュに保存
                        // レスポンスのタイプが 'basic' (通常のリクエスト) または 'cors' の場合のみキャッシュ
                        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                            return response;
                        }

                        // ネットワークから取得したレスポンスをキャッシュに保存する（複製を作成）
                        // レスポンスストリームは一度しか消費できないため、clone()が必要
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch((error) => {
                        // ネットワークエラーの場合のフォールバック
                        console.error('Service Worker: Fetch failed', error);
                        // オフラインページやエラーページを返すなど、より高度な処理をここに追加できます
                        // 例: return caches.match('/offline.html');
                        // ここでは単にエラーをログに出力し、何も返さないことでブラウザがデフォルトの動作をするようにする
                        throw error;
                    });
            })
    );
});