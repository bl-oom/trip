// 香港マカオ旅アプリ：電波があるときは最新版を出し、電波がないときは保存した版を出す
const C='hk-trip-v3';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  const isPage=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html');
  e.respondWith(caches.open(C).then(async c=>{
    if(isPage){
      // ページ本体は最新版を優先（4秒たっても取れなければ保存版）
      const net=fetch(e.request,{cache:'no-store'}).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r});
      const timeout=new Promise(res=>setTimeout(res,4000,null));
      try{const r=await Promise.race([net,timeout]);if(r)return r}catch(err){}
      return (await c.match(e.request,{ignoreSearch:true}))||(await c.match('./index.html'))||net;
    }
    const hit=await c.match(e.request,{ignoreSearch:true});
    const net=fetch(e.request).then(r=>{if(r&&r.ok)c.put(e.request,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||c.match('./index.html');
  }));
});
