/* 美股编年史 — Service Worker
 * 策略（为"每天盘后更新"的静态站设计）：
 *  - data/*.json：网络优先（每日数据永远新鲜），断网回退缓存
 *  - 页面导航与其余同源静态资源：缓存优先 + 后台刷新（秒开外壳；改动下次启动生效。
 *    页面外壳只在部署时变、且资源带 ?v= 版本号，旧壳引用旧资源自洽，不会错配）
 *  - 静态 CDN（jsdelivr 的 ECharts/opencc、Google Fonts）：同样缓存优先 + 后台刷新——
 *    这些在部分网络极慢/不可达，是冷启动白屏主因；opaque 响应也落缓存
 *  - 其余跨域（TradingView 行情、parqet 直连兜底）：不拦截，交给浏览器
 * 改缓存策略时 bump CACHE 版本号即可让旧缓存整体作废。 */
const CACHE = "mc-v3";
const CDN_HOSTS = new Set(["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    if (CDN_HOSTS.has(url.hostname)) e.respondWith(staleWhileRevalidate(req));
    return; // 其余跨域不碰
  }

  const networkFirst = url.pathname.includes("/data/");
  e.respondWith(networkFirst ? fromNetwork(req) : staleWhileRevalidate(req));
});

// no-cors 拿到的跨域脚本/字体是 opaque（status 0，res.ok=false）但内容有效，同样落缓存
const cacheable = (res) => res && (res.ok || res.type === "opaque");

async function fromNetwork(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (cacheable(res)) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw new Error("offline & uncached: " + req.url);
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const refresh = fetch(req)
    .then((res) => { if (cacheable(res)) cache.put(req, res.clone()); return res; })
    .catch(() => hit);
  return hit || refresh;
}
