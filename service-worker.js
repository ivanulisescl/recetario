const CACHE='recetario-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./js/app.js','./data/recipes.json','https://cdn.tailwindcss.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res;}).catch(()=>{if(e.request.mode==='navigate')return caches.match('./index.html');return new Response('Offline',{status:503});})));});
