/**
 * Market Chronicle · 付费 API 网关（Cloudflare Worker）
 * ─────────────────────────────────────────────────────
 * 定位：给「另一扇带锁的门」。免费门（chronicle.klay-wang.com/data/*.json + GitHub 仓库）
 *       永远敞开——那是站本身、GEO 引用和「网站永远免费」承诺的地基，锁它=自毁。
 *       这扇门卖的是：带 SLA 的稳定端点 + key 管理 + 用量计费 —— Pro 档「API（远期）」的实体。
 *
 * 部署（约 10 分钟，见 api/README.md）：
 *   1. npx wrangler kv namespace create API_KEYS
 *   2. 把返回的 id 填进 wrangler.toml
 *   3. npx wrangler deploy
 *   4. 发 key：npx wrangler kv key put --binding=API_KEYS "mck_<随机串>" '{"plan":"pro","note":"客户名"}'
 *
 * 用法：GET https://api.<域名>/v1/leaps_gauge?key=mck_xxx
 */

const ALLOWED = new Set(["leaps_gauge", "kindex", "sentiment", "pulse", "kindex_signals"]);
const ORIGIN = "https://chronicle.klay-wang.com/data/";
const DAILY_LIMIT = 1000; // 每 key 每日调用上限（Pro 档口径，改这里）

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/v1\/([a-z_]+)$/);
    if (!m) return json({ error: "unknown endpoint", hint: "GET /v1/{" + [...ALLOWED].join("|") + "}" }, 404);
    const name = m[1];
    if (!ALLOWED.has(name)) return json({ error: "unknown dataset" }, 404);

    // ── 锁：key 校验 ──
    const key = url.searchParams.get("key") || req.headers.get("x-api-key") || "";
    if (!key.startsWith("mck_")) return json({ error: "missing api key", docs: "email for access" }, 401);
    const rec = await env.API_KEYS.get(key, { type: "json" });
    if (!rec) return json({ error: "invalid api key" }, 403);

    // ── 计量：每 key 每日用量（KV 计数，UTC 日切）──
    const day = new Date().toISOString().slice(0, 10);
    const ctrKey = `usage:${key}:${day}`;
    const used = parseInt((await env.API_KEYS.get(ctrKey)) || "0", 10);
    if (used >= (rec.limit || DAILY_LIMIT)) return json({ error: "daily limit reached", used }, 429);
    await env.API_KEYS.put(ctrKey, String(used + 1), { expirationTtl: 172800 });

    // ── 取数：回源免费端点（单一真相源，永不复制数据）──
    const upstream = await fetch(ORIGIN + name + ".json", { cf: { cacheTtl: 300 } });
    if (!upstream.ok) return json({ error: "upstream unavailable" }, 502);
    const body = await upstream.text();
    return new Response(body, { status: 200, headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "x-usage-today": String(used + 1),
      "x-plan": rec.plan || "pro",
    }});
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
}
