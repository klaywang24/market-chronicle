# 美股编年史 · 项目总结与交接文档

> 本文档面向未来的维护者（包括未来的我和任何 AI 助手）。
> 读完本文即可独立维护、修改、扩展本站的一切。
> 最后更新：2026-07-04。

- **线上地址**：<https://klaywang24.github.io/market-chronicle/>
- **仓库**：<https://github.com/klaywang24/market-chronicle>（public）
- **本地目录**：`/Users/klay/Desktop/可视化学习汇总/美股编年史/market-chronicle 公开 git 仓库/`

---

## 一、项目由来与全程演进

### 起点

用户看到 [historyofmarket.com](https://historyofmarket.com/)（美股编年史原站，Vite+React+ECharts 的闭源个人项目），
想做一个**自用的、每天自动更新的同类站**。经调研确定方案：

- **目录/章节体系**：借鉴 historyofmarket 的"章节式编年史"结构；
- **技术架构**：借鉴老钱日日谈 [Big Picture](https://laoqianritan-create.github.io/us-market/) 的
  "纯静态 HTML + 预生成 JSON + ECharts CDN"（无框架、无构建、零成本）；
- **视觉设计**：完整复用用户自己的三份 field guide（0DTE / 支付体系 / web3）的羊皮纸设计系统；
- **托管**：GitHub Pages + GitHub Actions 定时管线（明确不用 Vercel/Netlify）。

### 演进时间线（一天之内的全部迭代）

1. **v1 三 tab**：K 指数（用户原创信号）/ 标普 500 / 纳斯达克，上线 GitHub Pages；
2. **板块扩容**：金融/消费/奢侈品三个个股篮子 tab，tab 定序为 标普→纳指→金融→消费→奢侈品→K指数；
3. **个股钻取**：二级胶囊导航（板块总览 ↔ 个股页），hash 路由，22 只个股各自完整历史；
4. **章节大扩容**：标普 14 章 / 纳指 12 章（分布/持有期/滚动矩阵/牛熊/左尾/成分股/估值/EPS…）；
5. **左侧悬浮目录**：常驻左栏 + 滚动高亮 + 点击跳章（≥1280px；窄屏 ☰ 浮层）；
6. **个股基本面**：macrotrends 20 年季频 PE/PS/PB/ROE/ROIC/FCF + 驱动分解 + 分红史 + 同业对比（每周更新）；
7. **估值弹性 / 波动率升级 / LEAPS 窗口 tab / 宏观 tab（FRED）**；
8. **六语言**（简/繁/EN/FR/DE/ES）+ 全站零中文残留（西语系）；
9. **今日·头版**（默认落地页）：市场温度、涨跌分布、板块热力图、世纪带+危机红点、Lithos 聚光灯；
10. **全站出处标注系统** + 前二十大持仓 + 数十轮细节打磨（详见 git log，每条提交信息即变更记录）。

### 用户的核心偏好（改动时必须尊重）

- **数字必须真实**：所有统计（信号胜率、百分位、市值）都要从真数据计算，不可编造；
  信号的失效案例（如 2022 熊市中 K<1 连败）**必须如实展示**；拿不到可靠数据的指标留空注明，不伪造；
- **打开即数据**：不要营销式 landing page；今日头版就是数据封面；
- **对比要一眼可辨**：图表用高饱和对比色（见设计一节）；表格数字格式统一（整数千分位），不许产生歧义；
- **出处无处不在**：每张图/表下都有"数据截至 · 来源 · 更新频率"小字；
- **中文界面可中英混排；EN/FR/DE/ES 界面零中文残留**。

---

## 二、板块结构与数据来源全景

九个 tab（顺序用户定死）：**今日 → 标普 500 → 纳斯达克 → 金融 → 消费 → 奢侈品 → 宏观 → K 指数 → LEAPS 窗口**

| Tab | 章节/内容 | 数据集（data/） | 来源 | 频率 |
|---|---|---|---|---|
| **今日**（默认页） | 市场温度环=（估值百分位+情绪百分位）/2；四大指数+VIX/恐贪/K/LEAPS 八芯片；涨跌分布带；11 行业 ETF 热力图；顶部世纪带+六大危机红点；聚光灯揭示夜层 | pulse.json | yfinance（503 成分股批量+指数+11 ETF）、复用 pe_ttm/kindex/leaps | 每日 |
| **标普 500** | 14 章：头版世纪尺度/年度结账+收益分布/入场离场(持有期胜率)/滚动 5·10·20 年/牛熊周期(zigzag±20/25%)/左尾放大镜/回撤谱系/估值两曲线(CAPE+PE)/估值弹性(三中位锚+百分位)/EPS/VIX 保费账本/季节性/行业结构+前二十持仓/五百家一览 | sp500_*.json, sp500_pe_ttm, sp500_cape, sp500_eps_hist, sp500_constituents, sp500_top | yfinance ^GSPC、multpl.com（CAPE/PE/EPS 1871→）、Wikipedia、SSGA 官方持仓 XLSX | 每日 |
| **纳斯达克** | 12 章（同体系）：综指 1971→ × 纳指100 1985→、VXN、ICB 行业(维基用 ICB 非 GICS!)、纳指百家、前二十持仓 | ixic_*, ndx_*, ndx_constituents, ndx_top | yfinance ^IXIC/^NDX/^VXN、Wikipedia、stockanalysis(QQQ 持仓) | 每日 |
| **金融** | XLF 锚一章 + 成长对照(2008 共同起跑) + 组合脾气；13 只：银行 JPM/BAC·卡组织 V/MA/AXP·投行 GS/MS·资管 BLK·券商 SCHW/IBKR·加密稳定币 COIN/HOOD/CRCL(卫星成员不入组合) | fin_*.json, s_{tick}_* | yfinance | 每日 |
| **消费** | XLP×XLY 双锚 + 六只（必需 KO/WMT/COST，可选 HD/TJX/MCD，1987 起跑） | consumer_* | yfinance | 每日 |
| **奢侈品** | 等权组合锚（无合适 ETF）+ LVMH/爱马仕/法拉利（2015 起跑；欧股欧元计价已注明） | luxury_* | yfinance（欧股市值经汇率转 USD） | 每日 |
| **宏观** | 四章：资金面(SOFR/EFFR/目标利率/RRP/Fed资产负债表)、信用(2-30Y 收益率/10Y-2Y/HY·IG OAS)、物价(CPI/核心PCE/PPI 同比+2%线)、增长与就业(GDP/非农×失业率/企业利润) | macro.json（19 序列） | **FRED 官方 API**（repo secret `FRED_API_KEY`） | 每日 |
| **K 指数** | 用户原创：K=CNN恐贪÷VIX，K<1="金风玉露一相逢"=加仓信号。上下联动双图+2020 以来 20 次信号 20/40/60 日对账表（实证：V 形回调近乎全胜，2022 熊市连败——如实展示） | kindex.json, kindex_signals.json | whit3rabbit/fear-greed-data 存档(2011→) + CNN 官方接口当天值 + yfinance | 每日 |
| **LEAPS 窗口** | CNN恐贪<25=极端恐惧=LEAPS call 开仓观察窗（不买3个月内期权）。2011 以来 45 窗口×6/12/18 月对账（NDX 12月胜率 34/41；2021 末窗口为负——情绪极值≠估值底） | leaps.json | 同上 | 每日 |
| **个股页**（22 只） | 最多 11 章：上市以来(可叠加对比标普/纳指/行业ETF，共同起点归一化100)/回报形状/危机节奏/时间纹理/关键指标仪表盘/利润基本面(EPS 20年季频)/资本效率(ROE×ROIC)/估值锚(PE百分位，银行自动换PB)/估值驱动vsEPS驱动/股东回报(1984→分红史)/同业对比。**章节按数据可用性自动裁剪，无空图** | s_{tick}_*.json, s_{tick}_fund.json, {basket}_peers.json | yfinance + **macrotrends**（欧股用 ADR：MC.PA→LVMUY、RMS.PA→HESAY） | 行情每日 / 基本面每周六 |

### 已知数据边界（诚实声明，别试图"修复"）

- 指数级**远期 PE** 无免费长史（原站用 Bloomberg 手动维护）→ 只展示 ETF 口径当前值并注明；
- **HY/IG 信用利差**：ICE 美银授权限制，FRED API 只给最近 3 年；
- **行业运营指标**（银行 NIM、卡组织支付量）与**板块资金流**：无可靠免费源，未做；
- 情绪百分位口径为**近一年**（随运行自然变长），页面已注明。

---

## 三、设计系统（改样式先读这节）

### 配色（css/style.css 顶部 CSS 变量，:root=日间 / .dark-mode=夜间）

| 变量 | 日间 | 夜间 | 用途 |
|---|---|---|---|
| --bg / --bg-card / --bg-deep | #F1ECDF / #EBE5D6 / #E0D8C2 | #1A1410 / #241C16 / #20180F | 羊皮纸底/卡片 |
| --ink / --ink-muted | #1A1410 / #6B5D4F | #F1ECDF / #9B8E7C | 墨色文字 |
| --accent / --accent-deep | #A0392F / #7E2A22 | #D45D4F / #B8421E | 铁锈红（主题色/激活态） |
| --gold | #B8893E | #E0B05A | 金（CNN 线/CAPE/夜层世纪线） |
| **--moss** | **#14A63E** | **#34D96C** | **苹果绿=一切涨幅/正值**（用户点名要鲜艳，勿改回灰橄榄） |
| --danger | #B8421E | #E06F4A | 跌幅/负值 |
| --blue / --purple / --teal | #2B5F8F / #6A4E9E / #2D4A48 | 提亮版 | 图表辅助色 |
| --cmp-red/blue/purple/green | #B01212 / #117ACA(Chase蓝) / #6A3FB5 / #00A93E(凯尔特绿) | 提亮版 | **个股对比四色**：个股红/标普蓝/纳指紫/行业ETF绿 |

字体：Fraunces（英文衬线）+ Noto Serif SC（中文标题）/ IBM Plex Sans + Noto Sans SC（正文）/ JetBrains Mono（数字），Google Fonts 加载。

### 关键交互与实现要点

- **日夜切换**：documentElement 加 .dark-mode 类，localStorage `mc-theme`；图表颜色来自 pal() 读 CSS 变量，切换时 rebuildAll() 重建全部图表；
- **hash 路由**：`#fin/jpm` 深链；⚠️ 默认页在 route() 有**两处** "pulse"（hash 空默认 + registry 回退），改默认页两处都要改；
- **左侧目录**：≥1280px 常驻（正文 margin-left 让位），西语系自动加宽到 216px+单行省略号；滚动高亮用 scroll 监听+500ms interval 兜底（**勿用 rAF**，后台标签会停）；buildToc **不得改写已有章节 id**（fd-* 裁剪靠 id 定位）；
- **聚光灯**（今日页）：纯 CSS radial-gradient mask 跟随 mousemove（比 canvas toDataURL 轻一个量级），当前半径 **R=80**（app.js 搜 `const R =`）；触屏自动巡游；世纪带高 340px（css .pulse-chartband），y 映射在 drawCentury 的 xy()（`96 - norm*92`）；**语言切换必须 renderPulse() 重建**（揭示层克隆自当时语言，否则跨语言残影）；
- **图表兜底**：buildOne try/catch，数据缺失显示"数据更新中"占位，绝不无声空白；
- **出处标注**：stampSources() 自动给每张含图/表的卡片补小字；来源映射 SRC_BY_PANEL/SRC_OVERRIDES（app.js），来源名**只用拉丁字母**（i18n 正则直传）；
- **i18n**（js/i18n.js）：简体为源；繁体=opencc-js CDN 运行时转换（全覆盖）；EN/FR/DE/ES=词典 D（400+ 条，key 必须与 HTML/JS 原文**逐字符一致**，⚠️ 直引号要 `\"` 转义）+ 动态句式正则 P + ECharts 配置深度翻译 i18nOption()；新增界面文案后跑一遍 CJK 残留扫描（遍历可见文本节点匹配 /[一-鿿]/）。

### 常见修改的路径

- **加一个篮子板块**：build_data.py 的 BASKETS 加条目（上市太晚的放 BASKET_SATELLITES）→ index.html 加 section（抄金融的结构）→ app.js BASKET_CFG 加配置（rows=胶囊分组）→ i18n 词条 → 跑管线；
- **加个股到金融加密组**（如 Stripe 上市后）：BASKETS['fin'] + BASKET_CFG.fin.members/rows 各加一行；
- **改颜色**：只改 CSS 变量（日夜两套都要），图表自动跟随；
- **改章节**：HTML 的 .chapter 块可任意插拔，章节编号和目录自动重排（renumberChapters/buildToc）。

---

## 四、GitHub / 自动化全配置

### 仓库设置

- **Pages**：main 分支根目录直出（legacy build），`.nojekyll` 跳过 Jekyll；部署偶发 "try again later" 临时失败，重推或 `gh api -X POST repos/klaywang24/market-chronicle/pages/builds` 手动重建即可；
- **Secrets**：`FRED_API_KEY`（宏观数据必需；更换：`gh secret set FRED_API_KEY --body "新key"`）；
- **About/topics/双语 README/Apache-2.0 LICENSE** 已配齐。

### 两条自动管线（.github/workflows/）

| workflow | cron | 干什么 | 时长 |
|---|---|---|---|
| daily.yml | 工作日 22:00 UTC（美东收盘后） | `scripts/build_data.py`：全部行情/指标/信号/成分股/持仓/宏观 → commit data/ | CI 里 20-60 分钟（Yahoo 对机房限速，属正常） |
| weekly.yml | 周六 08:00 UTC | `scripts/build_fundamentals.py`：22 只个股基本面（macrotrends 限流需 20s+ 退避，约 1 小时） | ~1h |

- 提交身份 `klaywang24 <klaywang24@users.noreply.github.com>`（**计入 contributions 热力图**：每交易日 +1、周六 +1）；
- 推送前 `git pull --rebase origin main` 防撞车（手动改码与机器人更新并发安全）；
- 管线健康看 README 顶部两枚徽章，红了就 `gh run view <id> --log-failed` 查因。

### 本地开发流

```bash
cd /Users/klay/Desktop/market-chronicle
source .venv/bin/activate            # 依赖：yfinance pandas requests lxml openpyxl
python scripts/build_data.py         # 重刷每日数据（本地约 3-5 分钟）
python3 -m http.server 8137          # 本地预览
git add -A && git commit -m "..." && git pull --rebase && git push   # push 即上线
```

⚠️ 本地网络注意：**FRED 与本机代理不合**（fredgraph 超时；官方 API 走代理可通，需 `FRED_API_KEY=xxx` 环境变量）；macrotrends/SSGA/stockanalysis 本地可通但注意限流。

### 数据管线源码地图（scripts/build_data.py）

`fetch_history`(yfinance 带重试) → `build_kindex` / `build_leaps` / `build_index_val` / `build_macro`(FRED) /
`build_index_panels`(任意价格序列→7 个面板 JSON，指数与个股共用) / `build_index_extras`(分布/持有期/滚动矩阵/牛熊zigzag/左尾) /
`build_constituents`(Wikipedia) / `build_top_holdings`(SSGA XLSX + stockanalysis) / `build_valuation_extras`(multpl) /
`build_basket`(篮子：成长曲线/等权组合/对照表/逐股面板) / `build_pulse`(今日头版) / `mcap_usd_b`(市值通用函数，⚠️ 先试原代码再试 .→-，非美元自动汇率转换)。

---

## 五、遗留事项与后续想法池

1. **Stripe 上市后**加入金融"加密·稳定币"组（一行配置的事）；
2. **信号触发通知**：K<1 或恐贪<25 时 Actions 发邮件/推送（未做，用户曾表兴趣）；
3. **西语系图表 tooltip 内的零散中文**（hover 才出现的动态拼接文本）——主界面已零残留，tooltip 覆盖属下一阶段；
4. 个股**行业运营指标**（NIM/支付量等）——等可靠免费数据源；
5. 危机红点 2000/2008 标签在窄屏下略挤——可按需微调 .crisis-dot 定位。

## 六、给下一位维护者的三句话

1. **一切数字必须可溯源**——这个站的灵魂是"每个数字都是真的"，宁缺毋假；
2. **改前先跑本地预览，改后必做线上验证**（curl 比对文件 + 数据可达性），用户要求线上与最新代码严格一致；
3. 用户的审美：编辑部的克制 + 数据的密度 + 一点点仪式感（描线动画、聚光灯、金风玉露）——加功能时守住这个调性。

---

## 七、商业化路线图（2026-07 定稿 · 脱敏版）

> 完整商业计划（含收款路线与个人背景分析）存于本地私人文档，**不在本仓库**。此处只记产品方向，供未来维护者理解架构决策。

- **付费产品**：LEAPS Call 每日盘前情报（LEAP 比、均笔大小、最热合约、个股 Top25/ETF Top10、C/P 比，覆盖 4000+ 标的，盘前约 30 分钟送达）。定价锚 $9/月 · $79/年，14 天无理由退款；
- **形态**：本质是付费 newsletter——**付费数据走私有 repo 管线 + 邮件分发，本公开站永远是免费获客漏斗**（付费内容绝不入本仓库）；付费墙如需上网页，用 Cloudflare Workers 轻量鉴权，静态站主体不动；
- **收款**：MoR（Paddle/Lemon Squeezy）起步，规模化后迁 Stripe；可选 USDC 年付通道；
- **数据上游**（关键依赖）：期权逐合约数据需付费源（Polygon/Databento/ThetaData 择一），产品只输出衍生指标（排名/比率），不转发原始行情——derived data 合规红线；
- **社群**：只做 Discord（Whop 门禁：#每日情报付费频道由管线 bot 自动推送），不做 Slack；邮件列表为第一资产；
- **推广飞轮**：管线新增每日自动截图（Playwright）→ X/Reddit(r/options, r/thetagang, r/LEAPS)/LinkedIn/小红书日更 → 网站 → 邮件 → 付费 → Discord。里程碑打 Product Hunt + Show HN；
- **GEO 待办**：llms.txt、每章静态文字摘要（AI 读不了 canvas 图）、JSON-LD、methodology 独立页——让本站成为 AI 回答"标普贵不贵"时的引用源；
- **护城河认知**：代码可被复制（本站一天建成即证明），真正积累的是①公开带时间戳的信号对账历史（K 指数/LEAPS 表格，不可追溯伪造）②邮件列表与每日准时的习惯③编辑品味。按媒体公司经营，不按 SaaS 经营。

—— HANDOFF.md 定稿于 2026-07-04 ——

---

## 八、今日页热力图 + 待办清单（2026-07-04 深夜追加）

### 已上线：Finviz 式全成分股 treemap

今日页的 11 格 ETF 色块已升级为 **ECharts treemap**（灵感参照 [OpenStock](https://github.com/Open-Dev-Society/OpenStock) 的 Stock Heatmap）：
- 数据：`data/pulse_heatmap.json`，由 `build_pulse()` 生成——502 只标普成分股，`rows=[[ticker, sector, chg%, mcap$B]]`；
  市值逐只取自 yfinance fast_info（给每日管线增加约 5–8 分钟）；
- 前端：`initHeatTree(el, key)`（app.js）——面积=市值、颜色=当日涨跌七档色阶（`heatColor()`）、
  11 个 GICS 行业分组（upperLabel 标题条）、悬停 tooltip（名称/行业/涨跌/市值）；
- ⚠️ **canvas 不能随 innerHTML 克隆**：日间层与夜间揭示层各自 `echarts.init` 一份实例（key 入 built map 以响应 resize）；
- 行业名保留英文（canvas 内做 i18n 成本高，Finviz/OpenStock 惯例也是英文）——有意决策。

### 用户已提出、尚未处理的今日页待办（下个会话优先处理）

1. **整体布局重审**：用户觉得"今日"页现在不协调——考虑打开直接是市场体温（温度环+芯片），
   百年世纪带移到页面最下方（未定稿，先出 2 个布局方案给用户选）；
2. **热力图配色**：绿色未使用全站统一的苹果绿（--moss #14A63E / 夜 #34D96C）——把 `heatColor()`
   的绿色档改为苹果绿色系渐变；
3. **行业标题被截断**：GICS 行业名（upperLabel）在方框边界处截断——调 upperLabel 高度/字号/overflow 或缩短显示名；
4. **个股方块无 logo**：期望像 OpenStock 那样在大方块内显示公司 logo——ECharts treemap 的
   label rich text 支持 image（`{logo|}` + backgroundColor.image 指向 parqet logo URL），只对面积大的块启用；
5. **显示不完整**：目前 `visibleMin: 120` 隐藏了小块导致"只显示了一部分"——调低 visibleMin（如 10）
   或去掉，让 502 只全部可见（小块无字只有色）。

—— 第八节追加于 2026-07-04 ——

---

## 九、2026-07-05 大更新（本节最新，与前文冲突处以本节为准）

> 这一天做了大量改动：热力图换供应商、上线合规页面与页脚、接入 Discord、统一跌红配色、移动端适配。新会话读到此节即掌握**当前真实状态**。

### 9.1 板块热力图：自绘 ECharts treemap → TradingView 官方 widget（重大变更）

**第八节的自绘 treemap 已废弃删除**（`heatColor()`/`initHeatTree()`/logo 预加载/`pulse_heatmap.json` 前端渲染全部移除）。今日页热力图改为**嵌入 TradingView 免费 stock-heatmap widget**：

- 加载 `s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js`；config：`dataSource: SPX500`、`blockSize: market_cap_basic`、`blockColor: change`、`grouping: sector`、`locale`（随界面语言）、`isZoomEnabled: true`（点板块下钻）；
- 数据是 **TradingView 实时源**（盘中更新），不再依赖每日管线的 `pulse_heatmap.json`（该 JSON 仍由 `build_pulse()` 生成但**前端已弃用**，可日后从管线清理）；
- **关键限制**：该 widget **不支持 isTransparent/自定义背景**（参数被丢弃，实测确认），亮色主题是刺眼白底——故**固定 `colorTheme: "dark"`**，`.heat-tree` 做成深色数据面板（bg `#0e0e0e`），在羊皮纸下像"嵌入式暗屏"；widget 高度必须传**固定像素**（传 `"100%"` 会取父高塌成 0）；
- 挂载逻辑在 `mountHeatmap()`（app.js），只挂日间层 base，reveal 层留空；语言切换时 renderPulse → 重挂；
- 想改回自绘热图（可完全套羊皮纸但没下钻/logo），去 git 历史找 `initHeatTree`（commit b26f366 之前）。

### 9.2 页脚 + 六个静态合规页面（6 语言）

- **页脚** `.site-footer`（index.html `</main>` 后）：品牌 + 链接区（关于/联系/定价/隐私/条款/退款/Discord/GitHub/X）+ 数据源与免责 + `#meta-line` 更新日期。**全站每页可见**。链接区 `justify-content:flex-end`，法/德长标签也稳在右侧（品牌标语换行让位）；
- **六个 hash 页面**：`#about / #contact / #privacy / #terms / #refunds / #pricing`，在 index.html `<main>` 内，`.doc-page` 样式；已注册进 app.js 的 `registry`（空数组）+ route() 里静态页 `scrollTo(0,0)`；**不占顶栏 tab**，只从页脚进；
- **合规内容**：隐私页按 GDPR/CCPA 写（数据控制者 / 法律依据 / cookie / 第三方与跨境传输 / 不出售个人信息 / 用户权利 / 儿童）；条款含 **Paddle 作 Merchant of Record 结算 + 18 岁购买 + 适用法律与可分割性**；退款 14 天无理由（现免费暂不涉及）；定价页 LEAPS Pro 标"筹备中"；这四页正是 Paddle 域名审核要的**合规四件套**；
- **六语翻译机制（重要，改文案必读）**：长段落文档页**不走短词条字典**，而是 `js/docs-i18n.js` 里的 `DOC_TR` 对象（按 `about/contact/...` × `en/fr/de/es` 存整段 HTML）；`apply()` 在页面加载与语言切换时，把各 doc 页的 `.doc-page` innerHTML 换成对应语言（zh/tw 用静态原文，tw 由 opencc 转繁）。**新增/改动文档页文案 = 改 index.html 静态中文 + 同步 DOC_TR 四语**；页脚短标签走 i18n.js 字典。
- **联系页**四平台品牌图标（Email/X/GitHub/Discord，inline SVG 单色）：静态中文页与 `docs-i18n` 的 `contactBody` 模板**两处**都要同步（`.c-icon`/`.c-ic` 样式）。

### 9.3 Discord 社群 + 每日自动播报 bot

- **Discord 服务器已建**，5 频道：`welcome-读我 / 每日头版 / 大盘闲聊 / leaps-讨论 / 网站更新日志`；站点公开入口用 welcome 频道邀请 `discord.gg/MnMEZg7Kx2`（页脚 + 联系页）；
- **bot 每日播报**：`scripts/notify_discord.py` 读 `pulse.json`/`leaps.json`，组装含市场温度/四大指数/恐贪·VIX·K/LEAPS 窗口/涨跌分布的 embed，POST 到 webhook；`daily.yml` 加了 `notify Discord` 步骤，webhook 走 **repo secret `DISCORD_WEBHOOK_URL`**（URL 不入库）；⚠️ **必须带正常 User-Agent**，否则 Discord/Cloudflare 会 403 掉默认 python-urllib UA。

### 9.4 配色更新：跌红 → 猩红 #FF2400

- `--danger` 日/夜/force-dark 三处均从铁锈橙（#B8421E/#E06F4A）改为**猩红 `#FF2400`**，与苹果绿 `--moss` 形成鲜明对比（用户点名要 TradingView META 跌幅那种亮红）；
- 全站跌幅/负值随之统一：今日涨跌带、各 tab 红柱/红线、`.neg` 文字、图表负值柱与阈值线（都读 `pal().danger`）；
- **品牌铁锈红 `--accent`（#A0392F）不动**——那是主题色（标题/激活态/kicker），非涨跌语义。

### 9.5 其它

- **聚光灯**：改为**只在悬停/点击世纪时间线的六个危机点时亮起**（不再跟随光标），半径 **R=30**（第三节写的 R=80 已过时）；`CRISES` 数组第 4/5/6 项 = 标签上下 / 水平 dx / 垂直 dy 微调；世纪带高度 340→280px；
- **移动端适配**：窄屏顶栏 tab 独占次行横滚（否则被挤成 0 宽）；章节目录改"抽屉 + 遮罩"；温度环西语系缩字号避免溢出圆环；涨跌带窄段不截断；
- **缓存治理**：css/js 引用统一加 **`?v=YYYYMMDD` 版本号**（治老访客缓存；每次上线 bump index.html 里 4 处）；新增 `js/docs-i18n.js`、`scripts/notify_discord.py`；
- **部署提醒**：`pages build and deployment` 频繁报 `Deployment failed, try again later` = **GitHub Pages 侧临时故障，非代码问题**；补救 `gh run rerun <失败 id>` 或再 push；线上核对：`curl 线上 index.html | grep 版本号/site-footer`。

### 9.6 更新后的待办池（替代第五、第八节的旧待办）

**已完成**：第八节今日页待办 1–5（后被 TradingView widget 取代）、六语翻译、合规四件套页面、Discord + webhook、跌红改猩红、移动端适配、危机标签微调。

**下一步（用户已排优先级）**：
1. **Cloudflare 自定义域名**（买域名 + Cloudflare CDN，改善大陆访问 + 品牌 + SEO/GEO，投入最小，优先）→ 让 AI 配 Pages 自定义域（CNAME + DNS）；
2. **Reddit 冷启动**（素材/发帖模板；养号 2–4 周再发，走《实操手册》三）；
3. **Paddle 接入**（等要收钱时；合规四件套页面已就绪，走《实操手册》一）；收款用 MoR，**Wise 只是提现终点不是收款前台**（Paddle 批量结算后一次性打给 Wise，不会有大量小额入账触发风控）；
4. GEO：llms.txt、每章静态文字摘要、JSON-LD、methodology 页；
5. LEAPS Pro 付费产品（私有 repo 管线 + 邮件分发，付费数据绝不入本公开仓库）。

—— 第九节追加于 2026-07-05 ——

## 十、2026-07-06 更新：科技板块上线（与前文冲突处以本节为准）

### 10.1 新增「科技」板块（第 4 个 tab，纳斯达克与金融之间）

- **成员 9 只，三组展示**（subnav 三行，样式同金融）：
  半导体 NVDA/AVGO/TSM · 平台·软件 MSFT/GOOGL/META/AMZN · 硬件·终端 AAPL/TSLA。
  Google 用 **GOOGL**（A 类）。共同起点 2012-05-18（Meta IPO，最晚上市者）。
- **总览锚 = QQQ，复用 `ndx_*` 面板**（ch-tech-etf/-annual/-dd 直接指向 ndx_century/ndx_annual/ndx_drawdowns，不生成新锚数据）。
- **个股对比芯片 = 标普 500 / 纳指 100 / XLK 科技**（XLK 已入 `ETF_ANCHORS`，生成 s_xlk_* 全套面板）。
- 板块结构与金融/消费完全同构：总览三章（板块的锚 / 成长的对照 / 组合的脾气）+ 个股页 11 章。

### 10.2 BRK.B 挪入金融（伯克希尔本质保险+控股）

- 金融篮 13→**14 只**，新增「保险」分组；BRK.B 数据起点 1996-05，入等权组合核心（核心 10→**11 只**，共同起点仍 2008-03 Visa 上市）。
- 金融 subnav 改**四行**：银行·卡组织 / 券商·投行 / 资管·保险 / 加密·稳定币（BASKETS 与 members 顺序同步 = 翻页顺序）。
- 消费 subnav 改**两行**：必需 / 可选。

### 10.3 关键技术点（改成员必读）

- **含点代码双源写法不同**：Yahoo（yfinance）要 `BRK-B`（连字符），macrotrends 要 `BRK.B`（带点）。
  `fetch_history` 与 `build_fundamentals` 的 yf.info 都已加「原样优先、`.`→`-` 兜底」，欧股 MC.PA 不受影响。
- **改篮子成员数 = 至少改两个文件**：index.html 里的 dek/sub/chapter-q 写了成员数（"九只巨头/十四只龙头/十一只核心"），
  而 **i18n.js 的 zh key 必须与 HTML 原文逐字一致**——只改 HTML 不改词典 key，西语系就会出中文残留（本次实测踩过，靠 CJK 扫描器抓回）。
- **重排已有成员顺序不必重新取数**：tech/fin 的 table/peers/growth 三类 JSON 纯排序即可（按 BASKETS 顺序 resort rows/series）。
- **本地预览的数据缓存坑**：`python http.server` 无 Cache-Control，Chrome 对 `data/*.json` 走启发式缓存
  （旧文件 Last-Modified 越老缓存越久，普通刷新都不回源）——本地验证数据变更用 `fetch(url, {cache:'reload'})` 强刷；
  线上 GitHub Pages 有 max-age=600，不受影响。
- macrotrends 的 `ps-ratio` 页对所有股票 404（历史即如此），个股页估值章自动以 PB 替代 PS，非 bug。

### 10.4 数据管线

- **每日**（daily.yml，工作日 UTC 22:00）：tech 已随 BASKETS 自动进入 build_data 全量——9 只价格面板 + tech_growth/annual/drawdowns/table 每日刷新；
- **每周六**（weekly.yml）：build_fundamentals 自动覆盖 tech 9 只 + BRK.B 的基本面（首轮已手动跑过，个股页 11 章目录当天即齐）。
- 六语已全覆盖并跑过 CJK 残留扫描（EN/FR/DE/ES 零残留，繁体 OpenCC 正确转出「半導體/平臺·軟體/硬體·終端」）。
- 缓存版本号当前 `?v=20260706d`（上线改动记得 bump index.html 4 处）。

—— 第十节追加于 2026-07-06 ——
