self.addEventListener('install', event => {
    console.log('Service worker install event!');
    event.waitUntil(
        caches.open(cacheName).then(cache => {
                cache.addAll(resourcesToPrecache);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Activate event!');
    event.waitUntil(
        caches.keys().then(keys =>{
            //console.log(keys);
            return Promise.all(keys
                .filter(key => key !== cacheName)
                .map(key => caches.delete(key))
            )
        })
    )
});

self.addEventListener('fetch', event => {
    console.log('Fetch event!');
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request);
    })
    );
});

const cacheName = 'cache-v0.00'; //cache version to modify to load
const resourcesToPrecache = [
    '/',
    'index.html',
    'scripts.js',    
    'manifest.json', 
    'icons/192.ico',
    'style2.css',
    'ita.json'
];