/* Ημερολόγιο — © 2026 Ανδρέας Μ. Γλεντζάκης. Άλλαξε το VER σε κάθε νέα έκδοση. */
const VER="imerologio-1.78";
const FILES=["./","index.html","metafora-rythmisi.js","metafora-lipsi.js","plaisio.js","en.js","glossa.js","kratisi.html","kratisi.js","qr.js","efarmoges-mas.js","epaggelmata.js","imerologio.js","app.js","manifest.json","icon-192.png","icon-512.png","icon-512-maskable.png","apple-touch-icon.png"];
/* ⚠️ ΜΗΝ αφαιρεθεί — κανόνας GlenApps (10/11/2026): η εφαρμογή ανοίγει ΑΜΕΣΩΣ από το αντίγραφο της συσκευής
   και ελέγχει για νέα έκδοση στο παρασκήνιο· όπου χρειάζεται δίκτυο περιμένει το πολύ 3 δευτερόλεπτα και μετά
   ανοίγει το αποθηκευμένο. Σφάλμα του διακομιστή (5xx) δεν αντικαθιστά ποτέ το αποθηκευμένο. Το version.json πάντα από το δίκτυο. */
const WAIT=3000;
self.addEventListener("install",e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("imerologio-")&&k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{const q=e.request,u=new URL(q.url);
  if(q.method!=="GET"||u.origin!==location.origin||u.pathname.endsWith("version.json"))return;
  const nav=q.mode==="navigate";
  const net=fetch(q,{cache:"no-cache"}).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(VER).then(x=>x.put(q,c)).catch(()=>{});}return r;});
  const fromCache=()=>caches.match(q,{ignoreSearch:true}).then(r=>r||(nav?caches.match("index.html"):undefined));
  e.respondWith(fromCache().then(c=>{
    if(c){e.waitUntil(net.catch(()=>{}));return c;}            /* υπάρχει αποθηκευμένο: αμέσως, ενημέρωση στο παρασκήνιο */
    return new Promise(res=>{let done=false;const ok=r=>{if(!done){done=true;res(r);}};
      const t=setTimeout(()=>fromCache().then(r=>{if(r)ok(r);}),WAIT);
      net.then(r=>{clearTimeout(t);if(r.status>=500)fromCache().then(c2=>ok(c2||r));else ok(r);})
         .catch(()=>{clearTimeout(t);fromCache().then(r=>ok(r||Response.error()));});});
  }));
});
