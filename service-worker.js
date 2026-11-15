const CACHE_NAME = "schoolkit-v6";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/SchoolKit Education App Logo.png"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
    );
});

// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            ),
            self.clients.claim()
        ])
    );
});

// ACTIVATE UPDATE WHEN USER CLICKS UPDATE NOW
self.addEventListener("message", event => {
    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// FETCH
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(cachedFile => {
            if (cachedFile) return cachedFile;

            return fetch(event.request).then(response => {
                if (
                    response &&
                    response.status === 200 &&
                    response.type === "basic"
                ) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, copy);
                    });
                }

                return response;
            }).catch(() => caches.match("./index.html"));
        })
    );
});