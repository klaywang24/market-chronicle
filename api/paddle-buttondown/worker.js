/**
 * Paddle → Buttondown 履约管道（Cloudflare Worker，2026-07-31 建）
 *
 * 为什么存在：Paddle（收钱）与 Buttondown（发信）互不知情。2026-07-31 复盘实证：
 * 付款成功后没有任何东西把订户加进收件列表 ——「收钱没发货」在伤害真实客户之前
 * 被抓住了，本 Worker 就是那根管道。
 *
 * 职责：
 *   POST /paddle-webhook   Paddle 通知入口（验签后处理）：
 *     subscription.created / subscription.activated → Buttondown 加订户 + 打 paid 标签
 *     subscription.canceled                          → paid 标签换成 churned（不删订户）
 *   GET  /health           探活
 *   scheduled（每周一 13:00 UTC）：对账闸 —— Paddle 活跃订阅集合 vs Buttondown paid
 *     标签集合，双向差集报警。覆盖 ≠ 在场：管道会再断，闸不能没有。
 *
 * 需要的 Secrets（CF 后台 Settings → Variables and Secrets，全部 Secret 类型）：
 *   PADDLE_WEBHOOK_SECRET  Paddle Notifications destination 的 endpoint secret（pdl_ntfset_…）
 *   PADDLE_API_KEY         Paddle Developer Tools → Authentication 的 live API key
 *   BUTTONDOWN_API_KEY     Buttondown Settings → API
 *   DISCORD_WEBHOOK_URL    （可选）动作与对账结果播报；不填则只写日志
 *
 * 无任何密钥写死在代码里；本文件可安全公开。
 */

const BD = "https://api.buttondown.com/v1";
const PD = "https://api.paddle.com";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (url.pathname !== "/paddle-webhook" || req.method !== "POST")
      return new Response("not found", { status: 404 });

    const raw = await req.text();
    if (!(await verifyPaddle(req.headers.get("Paddle-Signature"), raw, env.PADDLE_WEBHOOK_SECRET)))
      return new Response("bad signature", { status: 401 });

    const evt = JSON.parse(raw);
    const type = evt.event_type || "";
    try {
      if (type === "subscription.created" || type === "subscription.activated") {
        const email = await paddleCustomerEmail(evt.data?.customer_id, env);
        await bdEnsureTag(email, "paid", env);
        await notify(env, `✅ 付费开通：${mask(email)}（${type}）→ Buttondown 已打 paid`);
      } else if (type === "subscription.canceled") {
        const email = await paddleCustomerEmail(evt.data?.customer_id, env);
        await bdSwapTag(email, "paid", "churned", env);
        await notify(env, `⚠️ 订阅取消：${mask(email)} → paid 换 churned（订户保留）`);
      }
      // 其余事件（transaction.* 等）确认收到即可，Paddle 只要求 2xx
      return new Response("ok");
    } catch (e) {
      // 返回 5xx 让 Paddle 自动重试（最多约 60 次、指数退避），比静默吞掉安全
      await notify(env, `🔴 管道处理失败：${type}：${e.message}`);
      return new Response("error: " + e.message, { status: 500 });
    }
  },

  async scheduled(_ctrl, env) {
    // 每周对账闸：两侧集合必须一致，不一致就喊
    const paddleSet = await paddleActiveEmails(env);
    const bdSet = await bdTagEmails("paid", env);
    const missing = [...paddleSet].filter((e) => !bdSet.has(e));   // 付了钱没进收件列表 = 最严重
    const stale = [...bdSet].filter((e) => !paddleSet.has(e));     // 没在付钱却挂着 paid
    if (missing.length || stale.length) {
      await notify(env,
        `🔴 Paddle↔Buttondown 对账不一致\n` +
        `付费但缺 paid 标签（收钱没发货）：${missing.map(mask).join(", ") || "无"}\n` +
        `挂 paid 但无活跃订阅：${stale.map(mask).join(", ") || "无"}`);
    } else {
      await notify(env, `✅ 周对账：Paddle 活跃 ${paddleSet.size} = Buttondown paid ${bdSet.size}，两侧一致`);
    }
  },
};

// ── Paddle 验签：签名串 = `${ts}:${rawBody}`，HMAC-SHA256，比对 h1 ──
async function verifyPaddle(header, raw, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(";").map((k) => k.split("=")));
  if (!parts.ts || !parts.h1) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.ts}:${raw}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEq(hex, parts.h1);
}

function timingSafeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ── Paddle 侧 ──
async function pd(path, env) {
  const r = await fetch(PD + path, { headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}` } });
  if (!r.ok) throw new Error(`Paddle ${path} → ${r.status}`);
  return r.json();
}

async function paddleCustomerEmail(customerId, env) {
  if (!customerId) throw new Error("事件里没有 customer_id");
  const j = await pd(`/customers/${customerId}`, env);
  const email = j.data?.email?.trim().toLowerCase();
  if (!email) throw new Error(`customer ${customerId} 无邮箱`);
  return email;
}

async function paddleActiveEmails(env) {
  const emails = new Set();
  let path = "/subscriptions?status=active&per_page=200";
  while (path) {
    const j = await pd(path, env);
    for (const sub of j.data || []) {
      try { emails.add(await paddleCustomerEmail(sub.customer_id, env)); } catch {}
    }
    const next = j.meta?.pagination?.next;
    path = j.meta?.pagination?.has_more && next ? next.replace(PD, "") : null;
  }
  return emails;
}

// ── Buttondown 侧 ──
async function bd(path, opts, env) {
  const r = await fetch(BD + path, {
    ...opts,
    headers: { Authorization: `Token ${env.BUTTONDOWN_API_KEY}`, "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  return r;
}

async function bdEnsureTag(email, tag, env) {
  const g = await bd(`/subscribers/${encodeURIComponent(email)}`, {}, env);
  if (g.status === 404) {
    const c = await bd("/subscribers", { method: "POST", body: JSON.stringify({ email_address: email, tags: [tag] }) }, env);
    if (!c.ok) throw new Error(`Buttondown 创建 ${mask(email)} → ${c.status} ${await c.text()}`);
    return;
  }
  if (!g.ok) throw new Error(`Buttondown 查询 → ${g.status}`);
  const sub = await g.json();
  const tags = new Set(sub.tags || []);
  if (tags.has(tag)) return;                      // 幂等：重复事件无副作用
  tags.add(tag); tags.delete("churned");
  const u = await bd(`/subscribers/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ tags: [...tags] }) }, env);
  if (!u.ok) throw new Error(`Buttondown 打标签 → ${u.status}`);
}

async function bdSwapTag(email, from, to, env) {
  const g = await bd(`/subscribers/${encodeURIComponent(email)}`, {}, env);
  if (g.status === 404) return;                   // 从未进过列表，无需处理
  if (!g.ok) throw new Error(`Buttondown 查询 → ${g.status}`);
  const sub = await g.json();
  const tags = new Set(sub.tags || []);
  if (!tags.has(from) && tags.has(to)) return;    // 幂等
  tags.delete(from); tags.add(to);
  const u = await bd(`/subscribers/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify({ tags: [...tags] }) }, env);
  if (!u.ok) throw new Error(`Buttondown 换标签 → ${u.status}`);
}

async function bdTagEmails(tag, env) {
  const out = new Set();
  let path = `/subscribers?tag=${tag}`;
  while (path) {
    const r = await bd(path, {}, env);
    if (!r.ok) throw new Error(`Buttondown 列表 → ${r.status}`);
    const j = await r.json();
    for (const s of j.results || []) out.add((s.email_address || s.email || "").toLowerCase());
    path = j.next ? j.next.replace(BD, "") : null;
  }
  out.delete("");
  return out;
}

// ── 播报（可选）──
async function notify(env, content) {
  console.log(content);
  if (!env.DISCORD_WEBHOOK_URL) return;
  await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "chronicle-pipeline/1.0" },
    body: JSON.stringify({ content }),
  }).catch(() => {});
}

function mask(email) {
  const [u, d] = String(email).split("@");
  return u ? `${u.slice(0, 3)}***@${d}` : String(email);
}
