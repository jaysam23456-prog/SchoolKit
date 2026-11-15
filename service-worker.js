const CACHE_NAME = "schoolkit-v7";

const APP_FILES = [
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            for (const file of APP_FILES) {
                try {
                    await cache.add(file);
                } catch (error) {
                    console.error("Could not cache:", file, error);
                }
            }
        })
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

// UPDATE ACTIVATION
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

            return fetch(event.request).catch(() => {
                return caches.match("./index.html");
            });
        })
    );
});