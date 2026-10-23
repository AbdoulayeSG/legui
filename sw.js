const C='legui-v5',F=['./','index.html','css/style.css','js/app.js','js/audioReminderService.js','manifest.webmanifest','assets/sun.jpg','assets/logo.png','assets/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.allSettled(F.map(f=>c.add(f)))));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/sonds/'))return;
e.respondWith(caches.match(e.request).then(r=>{const n=fetch(e.request).then(x=>{if(x.ok)caches.open(C).then(c=>c.put(e.request,x.clone()));return x}).catch(()=>r);return r||n}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const id=e.notification.data&&e.notification.data.id;
e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{if(l[0]){l[0].postMessage({open:id});return l[0].focus()}return clients.openWindow('./index.html?task='+id)}))});
