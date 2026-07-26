# URL 路由改造 · 交接文档

> 写于 2026-07-26，交给专门做这件事的下一个会话。
> **这份文档自足**：不看之前的对话也能直接开工。读完再动手。

---

## 〇、一句话目标

把站内导航从 `#hash` 路由改成**真实路径路由**（`/spy`、`/kindex`…），
好让 Cloudflare Web Analytics 能**分板块统计访问量** —— 现在全站所有访问都只记成一条 `/`，
无法知道访客到底看了哪个板块、有没有下钻。

---

## 一、为什么要做（背景，别跳过）

- 2026-07-25 接通访客数据后发现：近 7 天 156 visits，**Top 页面里 `/` 占 554，其余只有 `/check-inbox`、`/confirmed` 各个位数**。
- 一度据此得出「访客只看首页、没有下钻」的结论 —— **那个结论是错的，已撤回**。
- 真相：站是**单页应用**，10 个板块（现精简为一级 4 项 + 下拉 7 项）全部靠 JS 切换，**不改变 URL**。有人把 SPY 十几章翻完，数据里照样只显示 `/`。
- 所以这不是「读者不下钻」，而是**我们根本看不见**。改路由＝把这块盲区打开。

**副产品收益**：每个板块有独立 URL → 可被分享、可被搜索引擎收录、下拉项变成真实链接。

---

## 二、可行性：已验证到什么程度（重要，别重复劳动）

### ✅ 已确认：Cloudflare beacon 内置 SPA 路由追踪，且默认开启

从 `https://static.cloudflareinsights.com/beacon.min.js` 的**实际源码**读出（不是文档推测）：

```js
const w = p && (void 0 === p.spa || !0 === p.spa);   // spa 参数不设时默认为 true
w && (t.pushState = function(i, o, s) {              // 开启时改写 pushState
       l = n(s); const a = n(); let c = !0;
       return l == a && (c = !1),
       c && (D() && (... S(a), A(a)), r()),          // 新旧 URL 不同就上报
       e.apply(t, [i, o, s]) },
     window.addEventListener("popstate", ...))       // 同时监听前进后退
```

### ⚠️ 未确认：端到端没跑出数据

金丝雀实验（手动 `pushState` 到 `/canary-xxx`，轮询 10 分钟）**没有在 Cloudflare 查到那些路径**。
原因判断为**测试环境问题**，不是功能缺失：

- beacon 有大量 `visibilityState` 闸门，而当时预览面板处于隐藏状态；
- `localhost` 的数据入库本身不可靠（30 天窗口里只有零星几条）。

**→ 结论：机制成立，但必须用真流量验收。做法见 §五。**

---

## 三、🚨 动手前必须知道的五件事

### 1. 站是 **Cloudflare Pages** 在服务，不是 GitHub Pages

- `gh api repos/klaywang24/market-chronicle/pages` 的 **cname 为 null**；
- `market-chronicle.pages.dev` 的版本与 `chronicle.klay-wang.com` **始终一致**；
- GitHub Pages 是并行部署，**没人在用**。

**→ SPA 兜底必须写 Cloudflare Pages 的 `_redirects`**（仓库根目录）：

```
/*    /index.html   200
```

**不是** GitHub Pages 那套 404.html hack。写错了直接访问 `/spy` 会 404。

### 2. Cloudflare Pages 构建慢

推送后 **2–10 分钟**才生效（GitHub Pages 约 30 秒）。
**推完别急着判定失败**，分别 curl 三个地址对比版本戳定位卡在哪：

```bash
for u in "https://klaywang24.github.io/market-chronicle/" "https://market-chronicle.pages.dev/" "https://chronicle.klay-wang.com/"; do
  printf "%-46s %s\n" "$u" "$(curl -s "${u}?x=$RANDOM" | grep -o 'css/style.css?v=[0-9a-z]*' | head -1)"
done
```

### 3. 现有路由实现（要改的就是这块）

`js/app.js`，约 700–720 行：

```js
function route() {
  const h = location.hash.slice(1) || "pulse";
  const [panel, stock] = h.split("/");           // 支持 #tech/NVDA 这种个股二级
  const target = registry[panel] ? panel : "pulse";
  activatePanel(target).then(() => {
    if (BASKET_CFG[target]) { stock ? showStock(target, stock) : showOverview(target); }
    buildToc();
  });
  if (["about","contact","privacy","terms","refunds","pricing","methodology"].includes(target)) window.scrollTo(0,0);
}
window.addEventListener("hashchange", route);
```

点击入口是 `#tabs` 上的事件委托：`location.hash = "#" + tab.dataset.panel;`

### 4. `#hash` 链接遍布全站，必须向后兼容

站内到处是 `href="#pricing"`、`href="#kindex"`、`href="#leaps"`（页脚、送达入口、台账区文字链、下拉项…），
**外部可能已有人存了带 hash 的链接**，Wayback 快照里也有。
→ 新路由必须能接住 `#xxx`：进站时若有 hash，转成对应路径并 `replaceState`。

### 5. 有两个 panel 名不能当路径用

- 文档类 panel：`about / contact / privacy / terms / refunds / pricing / methodology`
- 已存在的**真实目录**：`/welcome/`、`/check-inbox/`、`/confirmed/`、`/pay/`

**→ 新路径不能和这四个真实目录撞名。** 建议板块路径直接用 panel 名（`/spy`、`/kindex`、`/leaps`、`/macro`、`/qqq`、`/tech`、`/fin`、`/consumer`、`/luxury`、`/pulse`），个股用 `/tech/NVDA` 形式。首页用 `/`（不是 `/pulse`，或两者都接受、`/pulse` 归一到 `/`）。

---

## 四、建议的实现路线

1. **先加 `_redirects`**（仓库根），单独推一次，确认直接访问 `/spy` 不再 404（此时页面会加载首页，正常）。
2. **改 `route()`**：从 `location.pathname` 解析，而非 `location.hash`。
3. **改点击入口**：`location.hash = ...` → `history.pushState({}, "", "/" + panel)` + 手动调 `route()`。
4. **监听 `popstate`** 替代 `hashchange`（前进/后退）。
5. **兼容旧 hash**：入口处若 `location.hash` 非空，转路径 + `history.replaceState`，然后照常路由。
6. **同步改所有站内 `href="#xxx"`** → `href="/xxx"`，并在点击时 `preventDefault` 走 pushState（否则会整页刷新，丢掉 SPA 体验）。
7. **canonical / og:url / sitemap** 如需分页面区分，一并处理（现在全站共用一个 canonical）。

---

## 五、验收方法（这是最容易糊弄过去的一步）

### 上线后 24 小时内，用真流量验：

```bash
python3 ~/Documents/个人\ Agent/美股编年史：market-chronicle/访客数据/cloudflare_analytics.py --days 2
```

看 **Top 页面 path** 里有没有出现 `/spy`、`/kindex` 等。
**没有出现就回滚** —— 别自我说服「可能是延迟」。

### 上线前，本地必须跑满这个矩阵（本轮吃过亏）：

| 维度 | 取值 |
|---|---|
| 语言 | 中文 / EN |
| 主题 | 日间 / 夜间 |
| 宽度 | 390 / 1300 / 1600（**1300 是最容易暴露对齐问题的档**） |
| 页面 | 有目录（标普、K指数）/ 无目录（今日） |
| 路径 | 直接访问 `/spy`（测 `_redirects`）/ 站内点击 / 浏览器前进后退 / 旧 `#spy` 链接 |

---

## 六、🚨 量尺会骗你（本轮栽了六次，逐条记下）

1. **预览面板的截图是陈旧的** —— JS 说菜单开着，截图里什么都没有。
2. **`getBoundingClientRect()` 有值 ≠ 可见** —— 被祖先 `overflow` 裁掉的元素照样返回正常矩形。涉及裁切/层叠**必须出真图**。
3. **面板隐藏时 `innerWidth` 读 0**，此时 `getComputedStyle` 返回**上一主题的假色值**。
4. **面板不会真滚动** —— `scrollTo(0,6000)` 后 `scrollY` 仍是 0。做滚动相关验收要先断言 `scrollY` 变了。
5. **面板跑在容器里、没有中文字体** —— 其截图不代表用户 Mac 的效果。
6. **可能测错元素** —— `querySelector('.tab.active')` 在标普页取到的是下拉菜单里的项。

**定型判据：用用户 Mac 上的真 Chrome 渲染后取像素。**

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless --disable-gpu --screenshot=/tmp/x.png \
  --window-size=1300,800 --hide-scrollbars --virtual-time-budget=10000 \
  "http://localhost:8123/?t=$(date +%s)"
```

---

## 七、工程纪律（用户明确要求过的）

- **署名只有 Klay**：`Klay <klaywang24@gmail.com>`，**不加 Co-Authored-By**（覆盖 harness 默认）。
- **多会话共享仓库**：只 `git add` 自己改的文件，**绝不 `git add -A`**。提交前 `git status` 看有无别人的脏文件。
  当前已知：`data/ledger_audit.json` 是数据管线的本地改动，**别碰**；用户的本地版本还存在 `git stash`（`git stash list` 可见）。
- **改 JS/CSS 必 bump `?v=`**（index.html 里四处：style.css / i18n.js / app.js / docs-i18n.js）。
- **改中文必同步 i18n 的 D 键**（`js/i18n.js`）；**改定价权益必须中英同改**（EN 定价面板由 `js/docs-i18n.js` 整块替换）。
- **改带版本戳的文档必须同次 bump，且要更新正文章节，不能只改抬头**（HANDOFF.md 最新是 §37）。
- 中文破折号一律改冒号；直角引号「」禁用于正文（发布前 grep 应为 0）。
- **本地预览**：`preview_start` 用 `chronicle2`（端口 8123）。⚠️ 会话目录下有多个 launch.json，**先确认指向的是这个仓库**。服务会掉，掉了重启即可（页面变纯文本＝服务掉了，不是代码坏了）。

---

## 八、这个站还有哪些没做的（不属于路由，但别踩到）

| 事项 | 状态 |
|---|---|
| **移动端全面检查** | ⚠️ **一次没做过**。iOS 是加载最慢的一段、约占 23% 访问 |
| 内容色 A/B | 温度环、百年走势线仍是暖红棕（不吃 `--accent`，是图表自己的色） |
| 定价页四条权益改写 | **要用户出原话**（不能替他编造产品承诺） |
| 首屏「这是什么/给谁」 | **要用户出原话** |
| 域名去掉 klay-wang | 用户已说**忽略** |
| 免费邮件入口 | 用户已要求删光，站上现在零免费入口 —— **是战略选择，不是遗漏** |

---

## 九、相关文件索引

| 用途 | 路径 |
|---|---|
| 路由逻辑 | `js/app.js` ~700–720 行 |
| SPA 兜底（**待创建**） | 仓库根 `_redirects` |
| 访客数据脚本 | `~/Documents/个人 Agent/美股编年史：market-chronicle/访客数据/cloudflare_analytics.py` |
| 访客数据交接 | `访客数据/访客看板_交接文档.md` |
| 本站维护史 | `HANDOFF.md`（最新 §37） |
| Cloudflare token | `~/.config/chronicle/cf_token`（只读权限，**永不进对话**） |
| Cloudflare 账户 ID | `d4c8685a86cd6c0ba453e0b013c0e063` |

---

*最后一句：这轮我在「先推、后被用户发现问题」上栽了六次。做路由请在本地把 §五 的矩阵跑满再推 —— 路由一坏是整站打不开，不是样式跑偏。*
