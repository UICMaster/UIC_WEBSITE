const CACHE_NAME = 'UIC-System-v21';


const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    '/js/mediaplayer.js',
    '/js/twitch_embed.js',
    '/manifest.json',
    '/favicon.ico',
    // Lokale Fonts (Sehr wichtig für dein HUD-Design!)
    '/fonts/orbitron/orbitron-v35-latin-regular.woff2',
    '/fonts/rajdhani/rajdhani-v17-latin-regular.woff2',
    // Icons
    '/icon512_maskable.png',
    '/android-chrome-512x512.png'
];

const RUNTIME_CDN_HOSTS = [
    'player.twitch.tv',
    'embed.twitch.tv'
];

// 1. INSTALLATION: Alles in den Cache schaufeln
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('UIC-System: Pre-Caching initialisiert');
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

// 2. AKTIVIERUNG: Alte Caches löschen, damit Platz für Neues ist
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME, 'cdn-cache'];
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (!cacheWhitelist.includes(key)) {
                        return caches.delete(key);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

// 3. FETCH: Die "Strategie"
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Nur GET-Anfragen cachen
    if (event.request.method !== 'GET') return;

    // SPEZIAL-STRATEGIE für CDNs/Twitch: Stale-While-Revalidate
    // (Zeige altes Bild/Skript sofort, lade im Hintergrund das neue)
    if (RUNTIME_CDN_HOSTS.some(host => url.hostname.includes(host))) {
        event.respondWith(
            caches.open('cdn-cache').then(cache => {
                return cache.match(event.request).then(response => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return response || fetchPromise;
                });
            })
        );
        return;
    }

    // STANDARD-STRATEGIE für UIC-Dateien: Cache First
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});