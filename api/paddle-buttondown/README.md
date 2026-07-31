# Paddle → Buttondown 履约管道 · 开通指南（约 10 分钟，全程 Klay 操作）

> 为什么存在：2026-07-31 复盘实证，Paddle 收钱和 Buttondown 发信之间没有任何管道，
> 付款成功不会自动进收件列表。本 Worker 补上这根管道 + 每周对账闸。
> 代码零密钥、可公开；四把钥匙全部由你在 Cloudflare 后台亲手填。

## 一、部署 Worker（Cloudflare 后台，不需要命令行）

1. Cloudflare 后台 → **计算 → Workers 和 Pages** → **Create** → **Worker**，
   命名 `paddle-buttondown`，先直接 Deploy 默认模板。
2. 进入该 Worker → **Edit code** → 全选删掉，粘贴本目录 `worker.js` 全文 → **Deploy**。
3. **Settings → Variables and Secrets**，添加 4 个（类型全选 **Secret**）：
   | 名称 | 从哪拿 |
   |---|---|
   | `PADDLE_WEBHOOK_SECRET` | 第二步创建 destination 后 Paddle 给的 `pdl_ntfset_…`（见下） |
   | `PADDLE_API_KEY` | Paddle 后台 → Developer Tools → Authentication → API keys（live） |
   | `BUTTONDOWN_API_KEY` | Buttondown → Settings → API |
   | `DISCORD_WEBHOOK_URL` | 可选；站点线已有的 Discord 频道 webhook，播报开通/取消/对账 |
4. **Settings → Triggers → Cron Triggers** → Add：`0 13 * * 1`（每周一 13:00 UTC＝美东周一早上，跑对账闸）。
5. 记下 Worker 的 URL：`https://paddle-buttondown.<你的子域>.workers.dev`。

## 二、在 Paddle 挂上 webhook

1. Paddle 后台 → **Developer Tools → Notifications** → **New destination**。
2. URL 填：`https://paddle-buttondown.<子域>.workers.dev/paddle-webhook`。
3. 事件勾选三个：`subscription.created` / `subscription.activated` / `subscription.canceled`。
4. 保存后 Paddle 显示这个 destination 的 **endpoint secret（pdl_ntfset_…）**，
   复制填进第一步的 `PADDLE_WEBHOOK_SECRET`。

## 三、验收（缺一不算通）

1. 浏览器开 `…workers.dev/health` → 应显示 `ok`。
2. Paddle destination 页有 **Send test event**（simulator）→ 发一个 `subscription.created`
   测试事件 → Buttondown 订户列表应出现该测试邮箱并带 `paid` 标签（测完手动删掉）。
3. Discord 频道（若配了）应收到「✅ 付费开通」播报。
4. ✅ 全过之后：**通知内容线把定价页「订阅后 24 小时内开通（手动）」改成「付款后即时开通」**
   —— 自动化的转化收益就在这句话上。

## 四、边界与纪律

- 取消订阅＝`paid` 换 `churned`，**不删订户**（他可能还是免费读者）。
- Worker 幂等：Paddle 重发同一事件无副作用；处理失败返回 5xx，Paddle 会自动重试。
- 每周对账闸的两个方向：**付了钱没进列表**（收钱没发货，最严重）/ 挂 paid 没在付钱。
  任何一侧不为空都会在 Discord 喊。管道会再断，闸不能没有（覆盖 ≠ 在场）。
- 播报里邮箱一律打码（`abc***@qq.com`），Discord 不落全量 PII。
