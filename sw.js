// Capstone Vehicles — Job Card: offline app-shell cache
var CACHE = 'jobcard-shell-v2';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', function(evt){
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE).then(function(cache){
      return Promise.all(SHELL.map(function(url){
        return cache.add(url).catch(function(){ /* ignore a single failed asset */ });
      }));
    })
  );
});

self.addEventListener('activate', function(evt){
  evt.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Cache-first for the app shell and anything already cached (fonts, scripts);
// network-first for everything else, falling back to cache when offline.
// Firestore's own SDK handles its data traffic — this only covers the page itself.
self.addEventListener('fetch', function(evt){
  if(evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(function(cached){
      if(cached) return cached;
      return fetch(evt.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(evt.request, copy); });
        return res;
      }).catch(function(){
        if(evt.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
