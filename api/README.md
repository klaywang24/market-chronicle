# Market Chronicle · 付费 API 网关（未部署，随时可装）

**这是什么**：Pro 档「API（远期）」的实体——一扇带锁的门。锁 = API key（KV 存储），计费 = 每 key 每日用量计数。

**免费门为什么不锁**（2026-07-16 定，别再议）：
1. 站自己的 JS 就吃 `data/*.json`，锁了站就白屏；
2. GEO/LLM 引用靠公开抓取，锁了 = 自断「成为默认引用」的路；
3. 数据本来就在公开 GitHub 仓库里，锁 URL 是锁了个寂寞；
4. 定价页白纸黑字「网站永远免费开放 · 无墙」。
**付费 API 卖的不是数据本身，是稳定端点 + key 管理 + 用量保障 + 将来的增值序列。**

## 部署（约 10 分钟，需要一次 wrangler 登录）
```bash
cd api
npx wrangler login                       # 一次性，浏览器授权
npx wrangler kv namespace create API_KEYS   # 把返回的 id 填进 wrangler.toml
npx wrangler deploy
```

## 发 key / 停 key
```bash
npx wrangler kv key put --binding=API_KEYS "mck_$(openssl rand -hex 12)" '{"plan":"pro","note":"客户名","limit":1000}'
npx wrangler kv key delete --binding=API_KEYS "mck_xxx"   # 停用
```

## 客户用法
```
GET https://mc-api.<你的workers子域>.workers.dev/v1/leaps_gauge?key=mck_xxx
端点：/v1/{leaps_gauge|kindex|sentiment|pulse|kindex_signals}
响应头 x-usage-today = 今日已用次数；超每日上限返回 429。
```
