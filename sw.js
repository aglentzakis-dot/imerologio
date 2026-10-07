/* Ημερολόγιο — © 2026 Ανδρέας Μ. Γλεντζάκης. Άλλαξε το VER σε κάθε νέα έκδοση. */
const VER="imerologio-1.24";
const FILES=["./","index.html","epaggelmata.js","imerologio.js","app.js","manifest.json","icon-192.png","icon-512.png","icon-512-maskable.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("imerologio-")&&k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// πρώτα το δίκτυο (για να έρχονται οι αναβαθμίσεις), αλλιώς από την αποθήκη· το version.json πάντα από το δίκτυο
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin||u.pathname.endsWith("version.json"))return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const c=r.clone();caches.open(VER).then(x=>x.put(e.request,c));}return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
