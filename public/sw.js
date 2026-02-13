// SENSE-GUARD Service Worker
// PWA 오프라인 지원 + Push Notification

const CACHE_NAME = 'sense-guard-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/favicon.svg',
    '/manifest.json',
];

// 설치 시 기본 리소스 캐시
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 활성화 시 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 사용
self.addEventListener('fetch', (event) => {
    // API 요청은 캐시하지 않음
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 성공 시 캐시에 저장
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // 오프라인 시 캐시에서 반환
                return caches.match(event.request);
            })
    );
});

// Push Notification 수신
self.addEventListener('push', (event) => {
    let data = { title: 'SENSE-GUARD', body: '알림이 도착했습니다.' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [500, 200, 500, 200, 500],
        tag: 'sense-guard-alert',
        renotify: true,
        requireInteraction: true,
        actions: [
            { action: 'open', title: '앱 열기' },
            { action: 'dismiss', title: '닫기' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // 이미 열려있는 창이 있으면 포커스
            for (const client of clients) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // 없으면 새 창 열기
            return self.clients.openWindow('/');
        })
    );
});
