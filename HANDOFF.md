# 美股编年史 · 项目总结与交接文档

> 本文档面向未来的维护者（包括未来的我和任何 AI 助手）。
> 读完本文即可独立维护、修改、扩展本站的一切。
> **最后更新：2026-07-16 08:5x EDT｜线上现行 `v=20260716p`｜最新章节：第二十二节（§22.1–22.13 全，07-16 三次收口：卡片一卡两版+水印+skill / 短端vs长端双线图 / 人话钩子层 / API 网关脚手架 / 创始席位 50）**
> ⚠️ **本文按时间追加，越靠后越新。与前文冲突处，一律以编号最大的那节为准。**

- **线上地址**：<https://chronicle.klay-wang.com/>（自有域名，现行入口；<https://klaywang24.github.io/market-chronicle/> 是 Pages 源站，仍可访问）
- **仓库**：<https://github.com/klaywang24/market-chronicle>（public）
- **本地目录**：`~/Documents/个人 Agent/美股编年史：market-chronicle/KAPX/market-chronicle 公开 git 仓库/`
  ⚠️ **路径含全角冒号「：」+ 空格 + 中文，bash 里整条必须加引号。** 旧的 `~/Desktop/可视化学习汇总/…` 早在 2026-07-11 就失效了。
- **一页速查**：`~/Desktop/每日验收/美股编年史推送-交付验收卡.html`（文档地图 + 每日流程 + 验收清单，浏览器打开；2026-07-15 用户将三张卡移入 `每日验收/` 子夹）

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
| **K 指数** | 用户原创：K=CNN恐贪÷VIX，K<1="金风玉露一相逢"=加仓信号。上下联动双图+**2011 以来 39 次信号** 20/40/60 日对账表（实证：60日 26/13，持有至今全正；V 形回调近乎全胜，2011/2015/2018Q4/2022 压力期连败——如实展示） | kindex.json, kindex_signals.json | whit3rabbit/fear-greed-data 存档(2011→) + CNN 官方接口当天值 + yfinance | 每日 |
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
- **About/topics/双语 README/LICENSE** 已配齐（license 已于 2026-07-09 从 Apache 2.0 换为 PolyForm Noncommercial 1.0.0，见第十一节）。

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

## 十一、2026-07-09/10 更新：License 换 PolyForm Noncommercial（与前文冲突处以本节为准）

- **LICENSE 已从 Apache 2.0 替换为 PolyForm Noncommercial 1.0.0**（commit `55839e8`，2026-07-09 深夜 EDT）。
  非商业用途（个人使用/研究/教育）可自由使用、fork、修改；**商业用途需另行获得作者授权**。
- 双语 README 的徽章与 License 段已同步更新，并新增一行随代码分发的必带声明：
  `Required Notice: Copyright Klay Wang (https://chronicle.klay-wang.com)`。
- **注意事项**：①license 文本是官方原文，逐字保留，不要改动其中任何字句；②GitHub 仓库页 license
  标签显示 "View license" 而非具体名称属正常现象（PolyForm 非 OSI 认证清单成员）；③变更无追溯力——
  更换前 clone/fork 的历史版本仍受 Apache 2.0 约束，新提交起适用新 license。

—— 第十一节追加于 2026-07-10 ——

## 十二、2026-07-10 更新：联系页图标行定稿（与前文冲突处以本节为准）

- **联系页（#contact）联系方式 = 纯图标行**（`.contact-icons`，5 枚：个人网站/邮箱/X/GitHub/Discord），
  右下角不再单独文字陈列 Discord/GitHub/X；页脚左下的「免费 · 代码公开」字样已删。
- **视觉配方 = 逐项照抄 klay-wang.com 页脚（用户拍板，勿改回）**：
  半透明白圆底（亮 `rgba(255,255,255,.6)` / 暗 `rgba(255,255,255,.1)`）+ **品牌色 glyph**
  （globe `#1878BF`、邮件=蓝信封 rect+白折线、X `#0f1419`、GitHub `#181717`、Discord `#5865F2`；
  暗夜下 X/GitHub 转暖白 `#e8e6e1`）。**不要改成"实色圆底+白 glyph"——试过，被否**。
  尺寸 44px 圆 / 22px glyph / 20px gap，hover 上浮 3px。
- 相关 commit：`5f507e4`（图标化+footer 精简）→ `c4502f8`（定稿配方+放大），版本 `?v=20260710f`。
- 图标 SVG 在 index.html 联系区块与 `js/docs-i18n.js` 的 `ICON` 两处，改任何一处必须同步另一处。

—— 第十二节追加于 2026-07-10 ——

## 十三、2026-07-10 大改版：台账化转身（本节最新，与前文冲突处以本节为准）

> 单日 19 次发布（版本 `?v=20260710a` → `?v=20260710u`，commits `63a5850` → `1370e65`）。
> 定位从「编年史阅读站」转为「**信号台账 + 情绪与仓位地图**」：首页即台账，编年史章节转为信任纵深。

### 13.1 信息架构与首页
- **Tab 顺序定稿**：今日 / K 指数 / LEAPS 窗口 / 宏观 / 标普 500 / 纳斯达克 / 科技 / 金融 / 消费 / 奢侈品 / 行情（信号前置，宏观随后）。
- **首页「信号台账」区块**（renderPulse 内 `ledgerHTML`）：三状态卡（K 值 / LEAPS 恐贪 / 最近战报，主数字居中 48px，胜负双锚且标普在前）→ 落点图（纳指对数线 + 45 个 LEAPS 绿点 + 20 个 K 猩红菱形）→ 净值三线图（策略 ×9.5 居中于纳指满仓 ×13.0 与标普满仓 ×5.8，对比四色系）→ 诚实口径注脚 → CTA 三等分按钮（主按钮带创始价数字）→ 轻量订阅框（Buttondown `klay24`）。
- **首页「情绪仪表盘」六卡**：Put/Call 比（CNN 原始 5 日均值，自建累积史）、VIX 期限结构（四值网格）、恐贪七分量横条、纳指恐慌溢价 VXN/VIX、SKEW、市场广度 %>200DMA（自建累积史 `breadth.json`）。
- **顶栏终版（两轮返工后定案）**：≥1280px 品牌绝对定位贴视口左缘 24px（住进左留白），**tab 文字与正文卡片左缘像素对齐**（margin 公式镜像 `.container` 的语言条件偏移再减 tab 自身 padding）；EN 全部 11 个 tab 零截断（12px 压缩）；<1280 回退容器对齐。**教训：改顶栏对齐先确认对齐的是哪两个元素。**
- 行情芯片重构为「标签可截断、数字与涨跌幅永不截断」的 flex 结构（`.pq-l`），EN 标签缩短（VIX / Fear & Greed / LEAPS Window）。
- 页脚：© 右对齐（footer-left/footer-copy flex）；标语宽屏单行；「开源」表述全站改「代码公开」（PolyForm 后的诚实措辞）。

### 13.2 K 指数与 LEAPS 页扩容
- K 页新增：第三章「落点与净值」（落点图 + 60 交易日持有净值三线，均带拖拽缩放）、第四章「入场与离场」（**持有期矩阵**：20/40/60/120/250 五视界 × 双锚的胜率与中位收益，管线自动更新，未到期信号自动不计入）。
- LEAPS 页新增：第三章「落点与净值」、第四章「**恐惧的标价**」（开窗日 VIX × 12 个月后纳指散点——发现：亏损点聚集在 VIX 20–31 中价位恐慌区，VIX>32 全绿）、第五章「滚动年化」（滚动三年年化三线）。
- 对账表：K 表加标普 +60d / 至今两列（表头拆 `<span>` 保证可翻译）；判词双锚且入 i18n 动态正则。

### 13.3 数据管线（build_data.py）
- **口径修复（重要）**：K 的 fwd 与 LEAPS 的 m6/m12/m18 原按「恐贪×价格合并框行数」取，恐贪存档 2021 前缺日会悄悄拉长视界（2020-02-25 的"12 个月"实际落在 13 个月后）——**已改为在无缺日价格日历上按交易日精确取**；胜负计数不变，单笔数字与独立重算逐位一致。每信号新增 `exit60`、每窗口新增 `m12_exit`（前端净值曲线按此离场）。
- **双锚**：`build_kindex(ndx, spx, vix)` 签名变更；kindex.json 加 `spx` 序列；kindex_signals 加 `spx_fwd20/40/60/120/250`+`spx_to_date`；leaps.json 加 `spx` 序列与 `vix_start`。
- **新增 `build_sentiment(vix, vxn)`** → `sentiment.json`：CNN 七分量快照、P/C 原始比值累积史、VIX 期限结构（Cboe 官方 CSV：`cdn.cboe.com/api/global/us_indices/daily_prices/{VIX9D,VIX3M,VIX6M,SKEW}_History.csv`，`cboe_hist()` 列自适应——SKEW 单列，VIX 系列 OHLC）、VXN/VIX 比值、SKEW；失败留旧文件。
- **广度**：build_pulse 成分股窗口 1y→2y（只为算 200DMA），**温度的情绪百分位显式 `iloc[-252:]` 锁一年口径**；`breadth.json` 合并累积。
- **新增 `build_naaim()`** → `naaim.json`：从 naaim.org 页面正则抓当周 xlsx（文件名带日期每周变）、解析 2006→ 全史、算全史百分位；宏观页第五章「仓位与杠杆」上线（周频线 + 满仓 100 虚线 + 缩放）。
- 已确认弃用：Cboe totalpc.csv（2019-10 停更）；AAII sentiment.xls（403 付费墙，暂缓）。

### 13.4 方法论 / GEO / 定价
- 新增 `#methodology` hash 页（zh/en）：两信号定义与聚类口径、「净值就是 1 元变几元」的人话解释、**如实披露**（策略不宣称跑赢同标的满仓）、双锚基准说明、数据修订说明（恐贪存档对最近数日 ±1–2 点事后修订）、可验证性（Git 提交历史=事前记录）、引用规范。
- GEO：根目录 `llms.txt`（指向公开 data JSON）；head 加 canonical（chronicle.klay-wang.com）、meta description、OG 标签、JSON-LD（WebSite + K-Index/LEAPS 两个 Dataset）。
- 定价页：**Chronicle Pro $29/月 + 创始价 $9.9 锁价前 100 名**（产品由 LEAPS Pro 更名；terms/refunds 同步）；About/Terms 中过期的 "Apache-2.0" 表述改为 PolyForm。
- 台账/口径文案：破折号改冒号（zh/en 同步）；所有净值图副标题带「净值 = 1 元照规则操作后变成几元」。

### 13.5 工程注意事项（新增坑）
- 预览工具桌面模式滚动也被钉死：截取非首屏内容要隐藏兄弟节点。
- 本地 http.server 下同版本号 CSS 会吃 Chrome 启发式缓存：**连续两次改 CSS 中间必须 bump `?v=`**。
- 芯片/小组件设计准则：标签可截断、数值不可截断（拆独立 span）。
- i18n 新增中文 UI 后跑 TreeWalker CJK 扫描器（en 模式遍历文本节点）再逐条补词条，勿肉眼找。
- 新数据源接入六步 SOP 与许可红线见私密文件夹数据路线图（本仓库不存业务文档）。

—— 第十三节追加于 2026-07-10 ——

—— 2026-07-11 微改动（原「编年史网站」session 已关闭，由调研 session 代执行）——
- **联系页 GitHub 图标改指个人主页** `https://github.com/klaywang24`（原指仓库；用户指令）。
  两处同步改（§12 双处纪律）：index.html 联系区块 + js/docs-i18n.js contactBody。
  「Git 公证」类链接（方法论页提交历史等指向仓库/commits）用途不同，未动。
  docs-i18n.js 属版本化资产 → 全站版本号 bump `?v=20260710u` → `?v=20260711a`。

—— 2026-07-11 KAPX 命名部署（调研 session 执行，命名依据见桌面《K指数英文命名决策白皮书》v1.1）——
- **K 指数英文官方名定为 KAPX Index**（中文名不变）。canonical 定义句（中英两版，逐字统一）已上五个面：
  方法论页（index.html + docs-i18n.js EN 版）、首页台账区块（app.js + i18n.js 新词条）、llms.txt、README.md、README.zh.md。
- 英文侧 K-Index → KAPX Index 全库统一（i18n 四语词条/JSON-LD/llms.txt/README；tab 短标签 KAPX）；
  各首提处保留 "(formerly cited as the K-Index)" 桥接；JSON-LD Dataset alternateName 增列旧名以保检索连续性。
- 口播纪律：永远 "the KAPX Index"（与 capex 同音，靠 Index 后缀消歧）。数据 JSON 文件名（kindex.json 等）不改（URL 不可变）。
- 版本 `?v=20260711b`。

—— 2026-07-11 KAPX 公开数据集 + 站点回链 ——
- KAPX 历史读数已发布为公开数据集（CC BY 4.0，季度刷新）：
  Kaggle `klaywong/kapx-index-daily-fear-pricing-gauge` + Hugging Face `klay24/kapx-index`。
- 站点回链已加：方法论页「数据源」段（中 index.html + 英 docs-i18n.js）、llms.txt 新增 ## Datasets 段。版本 `?v=20260711c`。
- 刷新工具在 ~/Desktop/kapx-dataset/（脚本 refresh.sh + build_csv.py + 独立 .venv + dataset-metadata.json）。
  季度更新一条命令：`bash ~/Desktop/kapx-dataset/refresh.sh`（HF/Kaggle token 已装本地，端到端验证通过）。

—— 2026-07-11 KAPX 数据集流水线路径修正 ——
- kapx-dataset 操作文件夹已从桌面根目录移入「美股编年史/未来演进准备/kapx-dataset/」（用户归档）。
- refresh.sh 改为自愈版：venv 失效（文件夹被移动导致 console 脚本 shebang 失效）时自动重建，无需手动。
- 季度刷新命令（⚠️ 已随两次迁移变更，**以第十七节末尾的当前真值为准**，本行仅存历史）
- 该文件夹含《KAPX数据集-使用与观察手册》(md+docx)：两平台观察指标/刷新/排障全在其中。
- 提醒：本仓库不存业务研究文档（竞品逆向/命名白皮书等在「未来演进准备」文件夹 + 记忆，既定纪律）。

—— 2026-07-11 文件夹迁移 + GitHub 身份统一 ——
- 整个「美股编年史」文件夹已从 ~/Desktop/可视化学习汇总/ 移入 ~/Documents/个人 Agent/美股编年史：market-chronicle/
  （用户新建「个人 Agent」总工作区归拢三项目：个人网站/美股编年史/大盘期权学习）。git 仓库位置无关照常工作；
  kapx-dataset 刷新命令（⚠️ 此处仍漏了 2026-07-12 重构加的 `KAPX/` 一层，**当前真值见第十七节末尾**）
- GitHub 身份统一：klay-stock-agent / klay-wang-site / paperclip 三仓库里的 klay@klay-wang.com 与
  personal@Klays-MacBook-Pro.local 杂项提交，已 filter-branch 改写为 Klay <klaywang24@gmail.com> 并 force-push（各已 gh api 验证）。
  全 9 仓库历史核查：无 DarrenWBL / outlook。Nexar 的 .local 亦已清（保留协作者 ziw224 <zihanw0228@gmail.com> 原样，不冒名占用他人提交）。
  **9 仓库全部完成**：用户所有提交统一为 Klay <klaywang24@gmail.com>；余下仅合法身份（Actions bot / GitHub noreply / Nexar 协作者 ziw224）。

—— 2026-07-11 待办登记：KAPX 回溯 2011 + 事前/回填诚实分段（交「美股编年史数据更新」session）——
- 决定把 KAPX 从 2020 回溯到 2011（样本 ~20→~40；CNN 恐贪存档 2011 是硬天花板）。
  改 scripts/build_data.py 第 ~86 行(>=2019-06-01)、~113 行(<2020-01-01 跳过)、~153 行("since":"2020-01-01") 的阈值→2011；重算走 GitHub Actions（本机代理限流 yfinance/FRED）。
- ⚠️ 命门铁律——可验证性表述必须按时段拆分：
  · 2020 至今 = 逐日事前提交、Git 时间戳可证的真实记录（独门资产，纯度不可稀释）；
  · 2011–2019 = 公开公式+公开历史数据回填、可独立复现，但属回测/历史回填、非事前记录。
  绝不能让"带 Git 时间戳、事后不可改写"盖住回填段。方法论页可验证性节 + llms.txt + 四语 docs-i18n.js 同步分段。
- 改数据必与全站四语招牌数字（20次/13涨7跌/2.6x/since 2020）同批改，grep 旧数字确认 0 残留；
  Kaggle/HF 数据集描述"20 signals since 2020"也要一并改。
- 与既有铁律一脉相承：台账规则永不静默改、扩样本必须诚实标注 track record vs backtest。

—— 2026-07-11 重大更正（前一条 HANDOFF 说反了，核实 git 历史后修正）——
- 铁证：仓库首提交 2026-07-03、每日实时提交自 2026-07-04 起。
- 所以建站前整段（含现有"2020 起 20 次信号"）全是建站时一次性回填，与 2011–2019 同质；
  真正逐日事前提交只有 2026-07-04→今约一周。真正分界=建站日 2026-07-03，不是 2020。
- 前一条"2020=事前 / 2011–2019=回填"的分界作废。回溯 2011 与现有数据同质，放心做。
- ⚠️ 连带必修（与扩 2011 无关）：方法论"可验证性"节"任何一次信号都可验证是事前记录而非事后补写"
  是过度声称（git log 见仓库才 8 天即戳穿）。改为诚实双段：
  ① 历史台账(2011→建站)=公开数据可复现的回测（透明非杜撰）；
  ② 建站(2026-07)起逐日实时提交带 Git 时间戳=真正的事前记录，从第一天公开累积、随时间增值。

—— 2026-07-11 追加：LEAPS 裁量组合决定 + 2011 回溯完工验收清单 ——
- 个股 LEAPS call 模拟组合：用户提过"信号出现开我看好的个股 LEAPS call 做模拟产品验证"，已决定先不做。
  因 a)是策略非指数勿混 b)裁量选股污染信号验证 c)LEAPS 有杠杆会归零→回撤更深打脸低回撤卖点
  d)发具体合约=Paddle 投资建议红线+既有定案(0DTE 只模拟验证/不晒实盘)。心智：验证信号≠交易信号。
- 完工验收清单（18 项，回溯+措辞做完后逐项 confirm，全绿才算完）：
  A 数据完整(起点 2011/信号~40/抽查 2011-08·2015-08·2018-12·2020-03 恐惧事件/独立复算 CNN÷VIX)
  B 措辞真实(grep 旧数字"20次/2.6x/since2020"=0；grep 过度声称"任何一次信号事前记录"=0；
    诚实分段 present；VIX 双重计重披露 present；动态台账卡 vs 写死散文数字一致)
  C 页面完整(四语×日夜零报错；K 页对账/落点/净值图 x 轴回 2011)
  D GitHub+数据集(README/llms.txt/Kaggle+HF 描述+跑 refresh.sh 重推 CSV 全同步)
  E 最终(curl 线上+SW 双刷+灵魂拷问：任何公开面还暗示 2026-07 前有前瞻记录=没改净)
- 红线：只回溯数据+改措辞/加披露，不动公式、不调参数、不为跑赢/降回撤优化。

## 十四、KAPX 回溯 2011 已完成（2026-07-11，v=20260711d）

上节的回溯任务已执行落地。要点与实际结果：

- **数据**：build_data.py 三处阈值 2019/2020→2011（第 86/113/154 行）；本地外科式重算（复用 build_kindex，仅拉 ^NDX/^GSPC/^VIX，未走 CI，未被限流）。**信号 20→39**（2011-03-14→2026-03-06）；60 日胜率 **纳指 26/39、标普 25/39**；**持有至今 39/39 全正**。K 策略净值 **×3.96** vs 一直持有纳指 **×13.02** / 标普 **×5.84**（旧 ×2.6 vs ×3.4——新口径策略明显跑输买入持有，强化"不宣称跑赢"诚实定位）。
- **数据完整度已核实**：早年极低/零恐贪（2011-08 美债降级 / 2014-10 埃博拉恐慌 cnn=0 / 2015-08 / 2018-12 / 2020-03 / 2025-04）均为**真实历史恐慌读数**，非缺失占位；K=0 合法（value 轴非 log，不崩）。K 轴 max 10→12（2017-10-05 K=10.34 曾截顶），图注"1–10"→"0–12"。
- **诚实分段（关键）**：真实事前边界=**本站上线 2026-07-03**（git 首提交），之前全部为回填——比交接原设的"2020"更准，与 HANDOFF 验收清单 E 项一致，用户已拍板"诚实分段"。全站四语的"事前记录/never backfilled/ex-ante"均改为两段：上线起=Git 时间戳事前记录；2011→2026-06=公开数据回填、可独立复现、非事前。改动面：index.html 方法论"可验证性"节 + dek + JSON-LD、docs-i18n.js(EN)、llms.txt 三处。
- **招牌数字四语同步**：index.html(dek/章节问/表头/实证/如实披露/脚注)、js/i18n.js(图例"2020年起"→2011 / dek / h3 / 两条 k-verdict 动态正则 pattern+译文 / 图表起点脚注 / K轴描述)、js/app.js(k-verdict 字面/表头/图例/注释/轴)、js/docs-i18n.js(EN 方法论)、README.md/zh。**胜负计数与信号数为动态读 JSON、自动更新**，仅年份字面与净值倍数手改。
- **验证**：grep 旧数字(since 2020/20次/2.6/13次7跌/2019-06)=**0 残留**；本地 http.server 双语渲染——EN 动态 verdict 正确翻译"39 signals since 2011...26/39"零 CJK 泄漏、ZH 源文"实证结论：2011 年以来共 39 次信号...26/39"、方法论两段式双语 present、K 图渲染正常、**控制台零报错**。
- **待办**：Kaggle/HF 数据集**描述文字**"20 signals since 2020"需手改（canonical 句不含信号数，refresh.sh 只更 CSV/不动描述）。
- **坑记**：`.claude/launch.json` 的 --directory 原指向已失效旧桌面路径（已修为 Documents 新路径）；但 preview 工具把 previewId 缓存死、无视 launch.json 改动，最终用后台 http.server(8139) 直连验证。
- **VIX 双重计重披露已加（2026-07-11，commit `fa22d73`，v=20260711e）**：方法论页新增「已知特性与局限」节——CNN 恐贪 7 分量含"市场波动"(基于 VIX)，K=恐贪÷VIX 故 VIX 双通道影响 K(分母 + 分子约1/7)、波动率部分双重计重；KAPX 宜理解为"偏重波动率应激的恐惧指标"，约 6/7 恐贪独立于 VIX。如实披露不剔除、不改公式(干净版留作将来 KAPX 2.0)。中(index.html)+英(docs-i18n.js)+llms.txt 三处 present。
- **Kaggle/HF 数据集已同步**：refresh.sh 重推 CSV(2011→/39行)、HF README 数据卡单独 hf upload、Kaggle dataset-metadata.json 描述随版本更新(honesty 句也两段化)；HF 已 curl 验证 39/2011，Kaggle 新版本异步处理。
- **18 项验收清单全绿**：数据(起点2011/3879行/39信号/0 NaN/独立复算3日期吻合)、措辞(旧数字0残留/过度声称0残留/两段式×3面 present/VIX披露×3面 present)、页面(zh+en 方法论渲染+零控制台报错)、GitHub(repo描述/topics无旧数字)、线上(github.io 源站 v=e+中文VIX+39信号确认;chronicle 域名 Cloudflare max-age=600 缓存内跟上)。灵魂拷问 E.18：线上无一面残留"2026-07 前有前瞻记录"。
- **并发已解决**：另一 agent 已确认彻底停手、仓库独占归本 session；收尾三提交 `0ac83db`(K轴图注+HANDOFF)、`fa22d73`(VIX披露+v=e)均由本 session pull --rebase 后推送，无冲突。

## 十五、关键发现 + P3 远期矩阵路线（2026-07-11）

- **🔬 KAPX 对前向收益无预测力（实证）**：K<1 信号后进场 vs 无条件基线(随便哪天进)的纳指前向收益，**两窗口(2011→/2020→)都是信号≈或劣于基线**（60日 信号+4.1%/67% vs 基线+4.4%/75%；250日 +13.0% vs +19.4%）。→ KAPX 是**描述性"恐惧刻度"(canonical 即 fear-pricing gauge)、非产生 alpha 的交易信号**；净值垫底(×3.96)=约42%在场吃长牛的必然、非 bug；回撤更浅(-26.7% vs 纳指-35.6%/标普-33.9%)=半仓机械结果非技巧。诚实价值只有"历史定位+更浅回撤"两条，绝不宣传预测/超额。**这印证红线：底层无 edge 可优化，调参=39点上过拟合。**
- **🗂️ P3 远期：KAPX 指数矩阵（⚠️现在不做、备查）**：旗舰 KAPX 极简不动；平行风险变体成家族——激进版(信号上杠杆/LEAPS)、温和版(削现金拖累)。四护栏：①规则从经济论点定非"跑赢历史"定；②每变体=全新前向台账、回测标"可复现回测"；③永远展示含输的、绝不埋输家(幸存者偏差骗局)；④别过度建。**命名并列兄弟名 KAPX / KAPX-Aggressive / KAPX-Balanced，绝不用 2.0/3.0**(那特指旧版作废继任版)。原料=情绪仪表盘六卡。
- **✅ 诚实呈现重构已上线（2026-07-12，commit `1cde425`，v=20260712a）**：①K 净值图注+方法论新段——"净值垫底与回撤最浅是同一枚硬币的两面：约六成时间空仓"（K MaxDD -26.7% vs 纳指 -35.6%/标普 -33.9%，低暴露机械结果非技巧；总收益低是暴露差异非信号失效）；②K 页第四章「入场与离场」→**「恐慌中的买点」**：持有期矩阵加平均收益行（胜率/平均/中位×双锚，前端动态算），sub 明示"不是跑赢满仓的证据"；③中英同步、双语零报错验证。"信号≈基线"的 baseline 对照**未上站**（保留在 HANDOFF/记忆，用户未要求 radical 版）。
- **P3 命名用户拍板（2026-07-12）**：**KAPX（旗舰，对标指数、提供恐慌买点）+ KAPX-alpha（激进）+ KAPX-beta（温和）**；六卡"市场状态刻度家族"提案已获同意，提案文档在 `未来演进准备/`（不入本仓库）。

## 十六、2026-07-13/14 大更新：恐惧的标价指数上线 + Paddle 结账接入（本节最新，与前文冲突处以本节为准）

> 当日四次 push：`44f8a8f`(00:59 台账 seed) → `adfde08`(07:40 · v=20260714p UI) → `dcb7919`(08:47 · v=20260714q 合规措辞) → `e26ce5f`(12:26 · v=20260714r Paddle 结账)。**站上现行版本 = `v=20260714r`。**

### 16.1 恐惧的标价指数（KAPX 家族 2 号）已接管 LEAPS 页

- **它是什么**：描述性成本温度计，回答「今天买 12–18 个月的 LEAPS 在历史上算贵还是便宜」。头条 = **VIX1Y 在过去 3 年的百分位，高 = 贵**（0–100），并排 5 年 / 全历史小字。4 项 context 只展示、**不平均进头条**：VRP / 期限阶梯 VIX9D→VIX1Y / SKEW 百分位 / DFII10 实际利率百分位。**排除**回撤、信用利差、K —— 那是择时不是成本（K 本身就是 KAPX）。
- **管线**：`build_leaps_index()` 在 `scripts/build_data.py`，**云原生**（复用 write_json/_fred/CBOE_HIST，零新密钥、零本地依赖），产出 `data/leaps_gauge.json`（在 kindex.json 隔壁），随 `daily.yml` 每工作日自动 commit。
- **设计已锁定，改 = 另立新兄弟**（设计文档不在本仓库）。红线：**绝不拿它测收益/择时**；措辞永远「贵/便宜」，绝不「买/卖/加仓」。
- 旧「LEAPS 窗口」（F&G<25 → 前向收益）降为同页「历史参照」子块并体温计化，净值图保留。

### 16.2 Paddle 自助结账（`e26ce5f`）——站点第一次能真收钱

- **形态：两扇门两个价**。陌生人走 `#pay-btn` 自助付 **$29/月** 或 **$290/年**；创始价 **$9.9**（前 100 名，永久锁定）走邮件预约，是次级 CTA `.ptier-alt`。
- **新增 `pay/index.html`** = Paddle 的 default payment link 落地页（`noindex`）。
- **同批诚实性改动**：删掉 Standard 卡的「网页平台全指标当日值 + 完整历史百分位图表」这条付费权益（**站上没有任何门禁，这些免费层已经全有，列成付费权益名不副实**）；Watchlist → 「覆盖标的」并注明随 digest 送达；加首期声明（首期 digest 2026-07-15 发出，此前订阅 = 预付、可全额退款）；fineprint 收缩到只覆盖未售的 Pro/API（**不能一边收钱一边声明「非最终承诺」**）。

### 16.3 🔴 改本站前必读的三条铁律（均为 `e26ce5f` 当日实测得来，别凭直觉推翻）

1. **定价面板在 EN 下是被整块换掉的 → 任何要绑事件的元素必须用事件委托。**
   `js/docs-i18n.js` 存着 pricing / methodology 等面板的**整块 EN HTML**，切 EN 时整个 `#panel-pricing` 被 replace。而 Paddle.js **只在 `Initialize()` 的 DOM-ready 扫一次 DOM，且没有任何重扫方法**（`Initialize` 只能调一次；`Update()` 只吃 pwCustomer/eventCallback；12 个方法里无 rescan；bundle 里 MutationObserver / setInterval 各出现 0 次）。
   → **若用 `class="paddle_button"` + `data-items`，英文版的按钮会直接点了没反应。** 必须：
   ```js
   document.addEventListener("click", (e) => { if (!e.target.closest("#pay-btn")) return; ... });
   ```
   同理**也别用 `data-items`**：其读取时机**官方文档零表述**，而 CDN 路径 `/paddle/v2/paddle.js` 不带版本号、会静默升级——万一改成 init 时快照，症状是「用户选年付却被按月付收款」，静默且本站无 webhook 可发现。用**官方文档化**的 `Paddle.Checkout.open()`（Paddle 自己的 quickstart / build-overlay-checkout 两篇教程里 `paddle_button` 出现 0 次）。

2. **往 index.html 加任何中文短词前，先 `grep` 一下 `js/i18n.js` 的 D 字典有没有同名 key。**
   `i18n.js` 的 `applyTo()`（约 919 行）给每个文本节点打 `__zh` 快照，并**按整节点精确匹配** D 字典。而 `i18n.js:49` 早就有 `"订阅": ["Subscribe", ...]`。
   → 给按钮写 `订阅 <span class="p-m">$29 / 月</span>` 时，裸文本节点 `"订阅 "` 命中该 key，在「**以 EN 加载（回访者 localStorage['mc-lang']='en'）→ 切回 ZH**」这条路径上显示成 **「Subscribe $29 / 月」中英混搭**（已实测复现）。
   → **修法：把标签整串塞进 `.p-m` / `.p-y`**（`"订阅 $29 / 月"` 整串不是 D 的 key），不留裸文本节点。

3. **自测要刷三层缓存，不是两层。**
   ① `sw.js` 对页面用 stale-while-revalidate → 第一次拿到旧壳，而**旧壳引用旧 `?v=`**；② **浏览器自身 HTTP 缓存** → 即使注销 sw、清了 caches，index.html 仍可能从磁盘缓存来；③ `?v=` 不 bump 则用户永远拿旧的。
   最稳姿势：先 `navigator.serviceWorker.getRegistrations()` 逐个 `unregister()` + `caches.keys()` 逐个 `caches.delete()`，**再用 `?nocache=N` 绕过浏览器 HTTP 缓存**。
   **诊断口诀：先 `curl` 看服务器发的是什么、再 `grep` 看磁盘文件的真身**——本次就是靠这一步定位到「服务器发的是新的、磁盘是新的 → 那就是浏览器在扣」。
   ⚠️ **有两个 `launch.json`**：本仓库 `.claude/launch.json`（name `chronicle`，port 8137）+ 桌面工作目录那份（name **`chronicle2`**，port **8123**）。两者都 `--directory` 指向本仓库，所以不影响正确性，但 `preview_start({name:"chronicle"})` 实际启的是后者，**看到名字/端口对不上别慌**。

### 16.4 其它当日约定

- **语言**：`js/i18n.js` 的 `LANG_META` **只有 `zh` / `en` 两个键** —— `docs-i18n.js` 里残留的 fr/de/es 整块译文是**够不着的死代码**（其定价页仍写着早已作废的「LEAPS Pro $9.9」）。要么哪天重新开语言时一并重写，要么删；**现在不必管**。
- **`?v=` 只 bump `index.html` 里的四处**（css/style.css、js/i18n.js、js/app.js、js/docs-i18n.js）。**`data/*.json` 绝不加 `?v=`**（sw 对 /data/ 走网络优先，加了反而破坏每日更新）；**`sw.js` 的 `CACHE` 常量不动**（现 `mc-v3`）。
- **语言切换会把「按年」重置回「按月」**（`.annual` class 在被换掉的面板里）。**显示价与按钮是一起重置的、始终一致，不是收错钱**，属既有行为，未修。

### 16.5 ✅ 已做一半：全站 `signal` 措辞（`1776102` · v=20260714s）｜🚨 未做：净值曲线与 CTA 的相邻性（需决策）

站点开始收钱之后，这一条从"文案洁癖"变成了**活的合规风险**（支付服务商的 AUP 明文禁止 "trading signals and strategies"，且其审核读的是整站、尤其会读退款政策页）。

已知分布：`index.html:763`（**退款政策页的产品名**「…每日盘前**信号**与数据简报」，最高危）、`:9` meta description、`:23` JSON-LD、`:107` 章节头「信号面板」（+ `i18n.js:341` 的 D key）、`:777` 方法论 H1（+ `docs-i18n.js:329` EN "Two Signals, One Ledger"）、`:142-143 / :153 / :791-793`（**净值曲线 + 胜率表 + 买入/离场/加仓**）。

**最扎的矛盾**：`index.html:786` 是本站自己写的——「它是描述性温度计，**不是交易信号**、不是预测……**永不以择时/入场工具名义营销、永不测收益**」。**同一个站对恐惧标价指数守住了这条，对 K 指数破得干干净净。**

⚠️ **净值曲线别粗暴删**：它表面是策略回测，**实质是本站最核心的可信度资产**——它证明 K 策略跑输买入持有（×4.0 vs 纳指 ×13.0），是"诚实/自我证伪"的证据本身。删掉它 = 删掉护城河。方向应是「零损失诚实性的措辞改写」（如主语从隐含的"你"改成"规则"、交易动词"买入/离场/加仓"改成会计动词"计入/计出"）；但也要诚实面对一种可能：措辞改完，reviewer 仍会看到一条策略回测净值曲线。**这是品牌级决策，留给维护者本人拍板，勿代劳。**

**✅ 已改（`1776102`，全部是「没有判断空间」的错误）**：

1. **🔴 最要紧的一条，不是 §10 而是事实错误**：`e26ce5f` 让站点开始收 $29，**但退款政策与服务条款还停在收款上线之前**——`index.html:761` / `docs-i18n.js:284` 白纸黑字写着「本站目前完全免费，**没有任何收费项目**」/ "entirely free with **nothing for sale**"，`:745` / `:763` / `:769` / `llms.txt:34` 全是未来时。**这是 Paddle 域名审核明文要求的那一条（站上须有覆盖在售产品的退款政策，且他们会读）**——reviewer 打开 `#pricing` 看到 Subscribe $29、再打开 `#refunds` 看到「没有任何收费项目」，措辞洗得再干净也没用。**四条已一次性改成现在时**（只改一半会留下更明显的自相矛盾），产品名统一到定价页已在用的「盘前数据简报 / pre-market data digest」。
   > **📌 教训：接入收款不是「加个按钮」，是让站上每一处关于「我们卖不卖东西」的陈述同时变成现在时。**
2. **英文祈使句 = 交易指令**：`:149`「恐慌中的买点」/"Buying into Panic"→「恐慌之后的市场」/"What Followed Panic"；`:150` / `:153`「买入或加仓」/**"Buy or add …"**（英文是祈使句）→ 主语改回市场 / 「以每次信号首日为起点」；`app.js:1904` 主 CTA「盘前**信号**简报」→「盘前数据简报」。
3. **自打脸**：方法论 H1「两个信号」→「两个刻度」/"Two Gauges"；「定位加仓窗口」/"locating add-to-position windows"→「定位历史坐标」；`README` 「择时信号」/"timing signals"→「市场指标」/"market indicators"（`llms.txt:3` 早就写对了，README 是漏网）；`:107`「信号面板」/"Signal Panel"→「今日读数」；meta "sentiment signal ledger"→"sentiment reading ledger"；删两条零引用的 dead i18n key（内容为 "Never buy options under 3 months" / "LEAPS-call entry watch window"）。

**⚠️ 改中文必须同步改 i18n 的 D key**：D 的 key **就是中文原文**。改 `app.js` / `index.html` 的中文而不改 key → 该串在 EN 下翻译失效、**fallback 成中文 → 反而把「信号」二字直接暴露给英文 reviewer，比不改更糟**。本轮所有改动都成对改了 key（`i18n.js:46/70/71/73/341`）并逐条验证 EN 下零 CJK 泄漏。

**🚨 仍未做（判断题，留给维护者本人）**：

- **头版把净值曲线与付费 CTA 渲染在同一区块、上下相邻**（`app.js:1898-1904`）。审计的反方观点很硬：**「曲线形状 + ×4.0 尾标 + 胜率表」是个视觉格式塔，动词换成会计词，图一个像素都不变**——所以措辞改写基本是自欺欺人。但「留着 vs 删掉」也是假二选一，**第三条路是改相邻性与框架、不改一个字数据**：把头版 CTA 挪出净值卡片，把第三章标题改成证伪框架。反方那句话值得记：**「现在标题说的是『跟着做能得到什么』，内容说的是『跟着做跑输』——标题和内容不一致，本来就是个诚实性 bug」**，所以这条路**让站点更诚实，不是更少诚实**。
- **第三章数据一字未动**（×4.0 / ×13.0 / ×9.5 / −26.7% 全在）；「胜率」未改名（牵动 i18n 多处 + `app.js` 表头，且它是描述性统计）。
- **「信号」的分层裁决**（本轮采纳）：**免费的、描述性的、不带价格的「信号」全部保留**（方法论正文、逐次对账表、39 次信号）；**只在它被贴上价格标签的地方改**（CTA、退款政策里的产品名）。
- **JSON-LD 的 Dataset 描述保留「signals」**：数据入口本身就叫 `kindex_signals.json`，**改 UI 而不改 URL 反而更像心虚**。

**🔒 护身符 —— 任何批量替换必须加排除名单**（机械正则会把「不是**策略**」改成「不是**规则口径**」，语义崩坏、护身符变废话）：「本站不宣称这些信号能跑赢同标的的买入持有」/「它是描述性温度计，不是交易信号、不是预测」/「永不以择时/入场工具名义营销、永不测收益」/「仅为数据与信息，不构成投资建议，不含任何买卖推荐」/ EN "This is not evidence of beating buy-and-hold"。本轮已逐句核验全部原样保留。

⚠️ `data/kindex_signals.json` 的**文件名与数据 URL 绝不能改** —— 它是公开数据入口，且 Kaggle / Hugging Face 数据集与方法论页都回链到它。

## 十七、2026-07-15：管线曾静默死 4 天 + 监控体检（本节最新，与前文冲突处以本节为准）

> 当日 push：`f59e9c8`(v=t) → **`82f5822`（修管线）** → `a5c07dd`(v=u) → **`32f494f`（修监控 + 诚实披露，v=v）** → `569e047`(data) → `4a3ca0f`(v=**20260715a**)
> **站上现行 = `v=20260715a`**

### 17.1 🔴 管线死因：一行代码，四天

`bd24343`（07-12「世纪图改日频」）删掉了 `monthly = close.resample("ME").last()` —— 世纪图确实不再用它，
**但 `build_index_panels` 下游三处还在用**（`:239` 滚动5年年化 / `:258` 月度季节性 / `:267` 季节性年份范围）
→ 整函数抛 **`NameError: name 'monthly' is not defined`** → workflow exit 1。

**07-13、07-14 两次 daily-update 全 failure**（07-12 周日无运行），最后一次成功落数据是 `f405899`「daily update 2026-07-10」。
**线上 `pulse.json` 冻结在 07-10 整整四天**，而 07-14 站点刚开始卖「每个交易日盘前送达」的付费简报。

> **📌 教训：删「看起来没人用」的变量前，先 grep 下游。**

**排查口诀**：
```bash
gh run list --workflow=daily.yml --limit 6 --json createdAt,conclusion   # 先看有没有 failure
gh run view <id> --log-failed | grep -iE "error|traceback"               # 再看错在哪
git log -S'<变量名> =' -- scripts/build_data.py                          # 最后找谁删的
gh workflow run daily.yml                                               # 手动重跑，约 8 分钟
```
**预防**：用 AST 扫全文件「用了但没定义」的名字（⚠️ lambda 参数与嵌套函数参数会误报）。

**数据本身没洞**（重跑从 Yahoo/CNN 重算整条序列，07-13/07-14 都补齐）。
**但 Git 台账有洞**：那两个交易日**没有当日提交**，读数于 07-15 01:05 一次性补录 —— 按本站两段式标准，属「补录」非「事前」。
**已在方法论页「已知特性与局限」逐条披露**（中英同步），台账声明也改成了容错版：
> 管线偶尔会因技术故障漏跑：发生时读数于修复后补录，**Git 历史里能清楚看到哪天是当日提交、哪天是补录，我们不抹平这个差别**。

### 17.2 🚨 上次为什么没人发现：监控一直有，但它响的是假话

`daily.yml` 早有 `notify Discord / if: always()`。**但 `notify_discord.py` 只读磁盘上的 `pulse.json`** ——
`build_data.py` 失败时那是**上一次成功的旧数据**，于是脚本发出一条**「看起来完全正常」的每日播报**，把故障静默掉。

> **📌 这条值得所有做告警的人记住：`if: always()` 只保证告警器会跑，不保证它说真话。
> 告警器必须知道 job 的状态，否则它会用陈旧数据编出一条平安无事的播报。
> 通知不是没响 —— 是响了假的。这比不响更危险，因为它制造了「我有监控」的错觉。**

**已修（`32f494f`）**：`daily.yml` 传 `JOB_STATUS: ${{ job.status }}` + `RUN_URL`；`notify_discord.py` 三分支：

| 条件 | 行为 |
|---|---|
| `JOB_STATUS != success` | 🔴 告警「站上数据**没有更新**」+ 日志链接，**`sys.exit(0)` 绝不发正常播报** |
| `pulse.json` 缺失 | 🔴 告警 |
| job 成功但 `pulse.json` 的 `date` **> 4 天前** | 🟠 告警「job 报成功但数据没前进」← 覆盖「上游静默返回旧值/限流」这类**无声失败** |

**✅ 已实测**（2026-07-15，mock 掉 `urlopen`，未真发）：failure → 🔴；9 天陈旧 → 🟠；正常 → 琥珀播报。**三条路径全通。**

### 17.3 ⚠️ 监控仍会失灵的场景（已知盲区）

1. **`DISCORD_WEBHOOK_URL` secret 被删/失效** → 脚本第一行 `if not url: return` → **完全静默，告警器自己死了没人知道**
2. **告警发送本身失败**（Discord 挂/webhook 被撤）→ 无人告警「告警器坏了」
3. **workflow 根本没触发** → GitHub 会在**仓库 60 天无活动后自动禁用 scheduled workflow**。
   ⚠️ **二阶陷阱**：管线死了 = 没有 daily commit = 仓库「无活动」= 60 天后 cron 被禁 = **更彻底的静默**
4. runner 崩 / job 被强杀 → notify 步骤跑不到
5. **维护者不看 Discord** ← 最大的洞

**建议加固（未做，按性价比）**：
- **【5 分钟，零代码，最高性价比】** GitHub → Settings → Notifications → Actions → 勾 **"Send notifications for failed workflows only"**。
  **第二道闸，不依赖 Discord、不依赖任何自己写的代码，覆盖场景 1/2。**
- **【最诚实，也最贴品牌】** 站上自曝陈旧：若 `pulse.json` 的 `date` 距今超过 N 个交易日，头版顶部显示「数据陈旧，管线可能故障」。
  **读者与维护者同时看见**，且这正是「台账出问题时也必须可验证」的落地。覆盖场景 1–4。

### 17.4 🎨 CSS 特异性坑（`a5c07dd`）—— 既有 bug，不是新引入的

`css/style.css:796` 的 **`.doc-body a { color: var(--accent-deep) }` 特异性 (0,1,1)，压过裸 `.ptier-cta` (0,1,0)**。
定价面板在 `.doc-body` 内、CTA 是 `<a>` → `color:#fff` 被盖成深砖红压砖红＝几乎不可读，还被强加 `border-bottom`。
**原「邮件 Founding 预约」CTA 一直如此**，只是它此前不是主 CTA，没人注意。

**修法**：选择器加 `.doc-body` 前缀提到 **(0,2,1)**，并显式 `border-bottom:none`。**别用 `!important`。**
> **📌 往 `.doc-body` 里加任何 `<a>` 型按钮，先想 `:796` 会不会把你的 color 盖掉。**

### 17.5 其它（`f59e9c8`）

- **`.ptier-alt` 的 `margin-top:-2px`（`e26ce5f` 引入）导致 mailto 盖住主按钮底边 2px**，两个 CTA 粘连、点低一点就误触邮件 → 改 `margin-top:10px + padding:4px 0`
- **站上曾有两个都叫「订阅」但行为完全不同的按钮**（头版 = Buttondown 免费名单；定价页 = Paddle 付款）→ 头版改「**免费订阅**」，文案区分
- **新增 `welcome/index.html` + `Checkout.open` 的 `settings.successUrl`** —— 此前买家付完钱只看到 Paddle 自带成功页，而本站是**一个人手动**把付费者加进邮件列表的；不设这个，买家付完钱会以为没下文
- **删掉 D 字典里裸的 `"订阅" → "Subscribe"` key** —— 那正是 `e26ce5f` 时「Subscribe $29 / 月」中英混搭的污染源。现在污染源与「整串不是 D 的 key」双保险


### 17.6 📍 当前路径真值表（2026-07-15 实测，以本表为准；前文任何路径与本表冲突，一律作废）

> 本项目 2026-07-11 从桌面迁入 `Documents/个人 Agent/`，2026-07-12 又重构出 `KAPX/` 一层。
> **前文各节写于迁移之前，里面的绝对路径大多已失效。以下为逐条 `find` 实测的当前真值。**

| 是什么 | 当前真实路径 |
|---|---|
| **本仓库（公开）** | `~/Documents/个人 Agent/美股编年史：market-chronicle/KAPX/market-chronicle 公开 git 仓库/` |
| 交接手册镜像（只读快照） | `…/美股编年史：market-chronicle/KAPX/交接使用手册指南/HANDOFF.md` |
| kapx-dataset（数据集刷新） | `…/美股编年史：market-chronicle/KAPX/未来演进准备/kapx-dataset/` |
| 恐惧的标价指数（设计三件套，独立 git 库） | `…/美股编年史：market-chronicle/KAPX-恐惧标价指数/` |
| KAPX-alpha（证伪档案，独立 git 库） | `…/美股编年史：market-chronicle/KAPX-alpha/` |
| 期权数据管线（每日落库） | `…/美股编年史：market-chronicle/期权数据管线/` |
| 生意与起号（策略/定价/日更 digest） | `…/美股编年史：market-chronicle/生意与起号/` |

**季度刷新命令（当前真值）**：
```bash
bash "/Users/klay/Documents/个人 Agent/美股编年史：market-chronicle/KAPX/未来演进准备/kapx-dataset/refresh.sh"
```

⚠️ **路径含全角冒号「：」+ 空格 + 中文——bash 里整条必须加引号。**
⚠️ **写任何绝对路径进文档前，先 `find` 一遍。** 本文档在 `:398` 与 `:405` 各留过一条失效命令，
且 `:403` 就写着「文件夹已移走」——**同一份文档自己打自己，这是"文档里的路径会腐烂"的活标本。**


### 17.7 卡片模板独立 + 头条猩红（2026-07-15 补）

- **`每日 digest/_卡片模板_恐惧的标价.html`** = 母版。每天 `cp` 成 `YYYY-MM-DD/卡1_xxx_双语.html`，**只换数字不改结构**；
  要改结构 → 改母版。`YYYY-MM-DD/` 里的是**那天实际发出去的档案，事后不回改**（回改就跟收件箱对不上了）。
- **头条大数字 = `#FF2400`（--danger 猩红）**，不是 `#A0392F`（--accent 砖红）。砖红在 84px 下发闷、不醒目。
  正文与次要红仍用 `#A0392F`。取色依据：站上 `#panel-leaps .lg-big` 的实测计算色 `rgb(255,36,0)`。
- ⚠️ **教训**：这个改色用户在 07-14 就明确要求过，我查出了正确色值**却没落地**，
  首期卡带着砖红发了出去，直到 07-15 量 PNG 像素（`rgb(160,57,47)`）才发现。
  **查清楚 ≠ 改完了。一行就能完的活最容易在长对话里被"讲过就算数"。改完必须回到产物上量一次。**

### 17.8 一页速查卡

`~/Desktop/每日验收/美股编年史推送-交付验收卡.html` —— 浏览器打开。含：每天三个动作、**文档地图（在哪/何时读/谁改）**、
六层验收标准、改站 7 条通用检查、五条血泪、监控已知盲区。**本文档（HANDOFF）是全史，那张是一页速查。**
（同款还有 `~/Desktop/每日验收/每日期权落库-交付验收卡.html` 与 `每日期权落库-操作卡.html`，是期权管线那条线的。）

### 17.9 卡1 一键化 make_card.sh + 首期卡锚点段勘误（2026-07-15 补，与 §17.7 冲突处以本节为准）

- **`每日 digest/make_card.sh`**：`./make_card.sh [YYYY-MM-DD]` 一条命令 = curl 拉 4 个 JSON → 算派生值 →
  填母版 `_卡片模板_恐惧的标价.html`（**已参数化**，双花括号占位符）→ Chrome headless 渲染 1200×1500 PNG → `cp -n` 文案骨架。
  `--rerender` 只重截图。§17.7 的「每天 cp 母版、手换数字」升级为**脚本自动填充**；「档案不回改」不变。
- 头条大数字与判语章颜色 = 站上 app.js 同款数据驱动（≥60 猩红 `#FF2400` / ≤40 绿 `#14A63E` / 中间金 `#B8893E`，永不砖红）；
  次要红（阶梯高亮柱等）仍砖红 `#A0392F`。新鲜度闸：数据 as-of 距发送日 >4 天 → 红色警告（防管线死了还发陈旧卡）。
- 🔴 **首期卡（2026-07-15）锚点段勘误，根因已精确复现**：卡上「近端÷3月=0.855，第 57.6 百分位，正向结构占 86.4%」
  三个数来自三个序列——0.855 抄了 `sentiment.term.current.ratio_3m`（= VIX÷VIX3M），百分位与占比却算在 VIX9D÷VIX3M 序列上；
  把 0.855 塞进 9d 序列排名恰得 57.6（数学成立、口径无意义）。两套真值：VIX÷VIX3M = 0.855／33.2 分位／92.3% 占比；
  VIX9D÷VIX3M = 0.697／12.1 分位／86.4% 占比。**对外喊的 86.4% 本身正确（它一直就是 9d 口径）。**
  脚本起锚点段统一 VIX9D 口径整套自洽。**教训：当日值与历史序列必须同一个分子，别贪 JSON 现成字段。**
  第 1 期收件人只有作者本人、外部曝光≈0；按「档案不回改」留原样，Buttondown 存档换图 / X 回帖勘误与否由作者裁决。
- 文案那两三句与点发送**永不自动化**（AI 味源头 + 人工闸），已写死进脚本注释与 `每日 digest/README.md`。

### 17.10 监控复核：GitHub 失败邮件一直开着，事故当时就响了（2026-07-15 补）

- 查实 GitHub 账号级设置 **Actions = Notify me: on GitHub, Email (Failed workflows only) 一直就是开启状态**——
  §17 里「建议去开启」这条建议过时。铁证：07-13 22:59 与 07-14 23:00 两封
  《Run failed: daily-update》**都送达了 Gmail 收件箱**（from:notifications@github.com，被 Gmail 标 IMPORTANT）。
- **结论：管线静默死 4 天期间，第二道闸响了两次，没被读到。五个盲区里真正致命的是⑤「人不看」，不是告警渠道不够。**
  修法不是再加渠道，是让这封邮件不可能被错过：Gmail 过滤器
  （`from:notifications@github.com "Run failed"` → 星标 + 标签「管线告警」+ 永不进垃圾邮件），手机 Gmail app 对该标签开推送。
- 📌 通用教训：**盘点监控时先查「已有的闸响过没有」，再谈加新闸。** 加固清单详见
  `生意与起号/02-商业演进与定价/2026-07-15 数据管线监控体检与 digest 首发全记录.md` §1.5/1.6（复核实录已随文更新）。

## 十八、2026-07-15：定位与定价重构——付费对象从「送达」移到「判读」（本节最新，与前文冲突处以本节为准）

> 本节时间窗：2026-07-15 02:30–07:55 EDT。触发 = 用户五问（$29 值不值 / 比免费多什么 / ChatGPT $20 对比 / 维生素还是止痛片 / 大 V 卖什么）。方法 = 10-agent 查证与对抗（6 路研究 84 条 findings + bear/bull/reframe 三方辩论 + 独立复算）。

- **定论：$29/$290 一分不动。** 8 家独立发行人中位 $34.50/$355（读自其 Stripe/Ghost 对象）；beehiiv 投资类中位 $27；Bespoke 同品（盘前简报）$995/yr。问题从来不是价格，是付费对象：**18 家竞品无一家用「送达」当付费墙**（送达是读者一个 cron 能自替的东西）；且「盘前送达」在本站是**负时效**——daily.yml UTC22:00 意味着站上前一晚 ≈19:00 EDT 已更新，付费邮件反而晚 12 小时。付费墙六门（商用权/B2B/工具/时效/深度/净新增判读）前五扇已被红线或架构关死，只剩「净新增判读」。
- **定位定稿（丙版，用户亲改两处）**：「不荐股、不预测、不晒收益、错了不删。只做一件事：把市场今天的『天气』——贵不贵、怕不怕、在历史第几——在每个开盘前读成三分钟人话」+ 四权益 + 「**数字，随处可见，永远免费**。档案真正的用处在**之后每次大跌**的那天」收尾（加粗两处 = 用户的改进：把「谁都能看 VIX1Y」的质疑收编成卖点；「每次」把一次性变复利）。关键机关：**全程不用「预报」二字**——预报=报明天=预测，只报今天=描述，一个字眼同时保住天气比喻与「不预测」红线。10 版辩论过程稿 = 桌面 `一句话产品陈述-10版辩论.md/docx`。
- **四组件（Standard 的付费对象）**：①每日判读正文（**站上永不公开——自第 2 期起是铁律**）②判读档案（逐日归档）③每周一期传说处决（**付费先看、30 天后公开** = 同一件作品喂订阅与引用两条路；选题两硬规则 = 只杀有人信到会照做的 + 死刑必须用自己台账执行且结尾落回仪表盘）④期权结构数据表（**站上表述为不变量：「覆盖美股期权成交量前列的十余只标的，清单随流动性调整」**——`1464a7d` 于 07-15 把硬编码清单「SPY/QQQ/M7/AVGO」改掉，因为 MU/SNDK 当天就进了宇宙、清单当场过期；**权益表里永不写会变的清单**。SPCX 同理不单列——流动性未验，权益=每日承诺，没货就不写；digest 正文当不定期加菜）。
- **档案交付**：Google Drive 私享文件夹（`判读档案/` + `期权数据/`）。**链接不写进本文档——本仓库是公开的，写进来=付费档案链接全员可见（写这条时差点犯，引以为戒）**；链接存于仓库外的全记录文档（生意与起号/02）与 AI 记忆。**⚠️ 链接只进邮件（Buttondown footer snippet），绝不上站、绝不进 welcome 页、绝不进本仓库任何文件。****订户到 20 → 换 Cloudflare Worker 魔法链接**（输邮箱→查 Paddle API→发 24h 签名链接，无密码无数据库，退订自动失效）。
- **创始价改制**：$9.9/月 → **$99/年**（=$9.9×10，与 Standard 年付=10 个月价同一惯例；Piano 数据：年付四年留存 18.0% vs 月付 4.4%——月付是把最差留存结构给最忠诚的 100 人）。discount = `dsc_01kxjqmtb40e8bsy2zqtkqxk0e`（flat $191 off、限 $290/Yearly、**Recurring=Until further notice**（=dashboard 里的「永久」，对应 API 的 maximum_recurring_intervals:null——UI 可建永久折扣，此前存疑已解）、limit 100、无 checkout code=预约制）。发放 = dashboard 建 transaction 挂 discount 发付款链接。站上 tag 已同步补「按年 $99」（卡上写的=实际收的）。
- **🔴 86.4% 定义缺陷（已双路复核，待发布）**：第 1 期 digest 的「流传 90% → 实际 86.4%」只在 VIX9D<VIX3M 一个口径下成立且未声明口径——换 VIX9D<VIX6M（89.26%）或 <VIX1Y（89.80%）传说的 90% 基本是对的。六个数（N=3,903，2011-01-04→2026-07-14，Cboe CDN，两路独立计算逐位吻合）：86.40 / 89.26 / 89.80 / 92.54（VIX<VIX1Y）/ 73.12（VIX9D<VIX，最松一环）/ **完全单调 67.28%**（没人引用过的数）。修法=升级不撤退：发全部六个、命名每对、领念 67.28。成品在 `生意与起号/01-起号引流(Reddit+X)/每日 digest/传说处决01_期限结构六个数_草稿.md`（🅐X 帖 🅑digest 版，数字锁定文字可改）。
- **当日 commits**：`98dbb67`（六处「首期 2026-07-15」时态修复——手写快照必腐烂，改常青；v=20260715b）→ `0815b67`（定价页丙版四组件 + llms.txt 同步；v=20260715c，线上已验）。
- **§17.10 Gmail 过滤器已落地（升级版）**：红标签「美股编年史」已建；**过滤条件升级为收件人 `market-chronicle@noreply.github.com`**（GitHub 给每仓库的专属通知地址，只抓本仓库、零误伤——比 §17.10 原配方 from+主题匹配更准，以本节为准）；07-13/14 两封失败信已标签+星标；用户已建过滤器+标记重要。
- **教义沉淀**：①付费墙永远不能是送达。②本品类维生素/止痛片**实证倒置**（beehiiv：Money 16.67% 月流失最差、Food 5.06% 最佳）——**止痛片时刻获客，维生素节奏留存**。③Trigger 不在话术在时刻（下次大跌的早上 + 有人下单 LEAPS 之前）；平时唯一正经工作=养免费名单（**当前基线=1 人**，每周五记一次）。④订阅=12 个月的桥（逼出日更节奏 + 产出 100 个具名 reference customer），授权才是目的地——「被引用」与「拿订阅」是相反的结果（AI 转介≈流量 1%），别用一个 KPI 考核两条路。
- **全记录**：`生意与起号/02-商业演进与定价/2026-07-15 定位与定价拆解全记录.md`（+docx，桌面另有 docx 副本）。

## 十九、2026-07-15 下半场：读数状态分类法 + 分发双渠道 + 配图铁律（本节最新，与前文冲突处以本节为准）

> 时间窗：2026-07-15 08:00–12:2x EDT。承接第十八节（定位定价重构）。站上唯一改动 = `1464a7d`+`1b74c93`（v=20260715d）。

### 19.1 定价页标的清单改为不变量（`1464a7d`，v=20260715d，线上已验）
权益行从硬编码「SPY / QQQ / M7 / AVGO」改为「**期权结构数据表——覆盖美股期权成交量前列的十余只标的，清单随流动性调整**」（EN 同步）。触发：落库线当天把 MU/SNDK 纳入宇宙（MU 期权日均量 832k 排第 4、SNDK 216k 高于已在册的 AVGO），**硬编码清单当场过期**。这是「手写快照必腐烂」的第五次复发。📌 **权益表里永不写会变的清单。**
- ⚠️ **`1b74c93` 的教训（比改动本身重要）**：首轮用带空格的 `grep "SPY / QQQ / M7 / AVGO"` 扫残留，报「零残留」——而 `llms.txt` 写的是**无空格版** `SPY/QQQ/M7/AVGO`，漏网。**精确 grep 会给你一个假的零残留**；核残留必须用宽松模式（`grep -nE "AVGO|M7"`）。另：线上 index.html 一度 grep 到 1 处残留，实为**边缘缓存的旧副本**，`?nc=` 换个值即消失——线上核查要用变化的 cache-buster，且以 `curl .../index.html` 为准。

### 19.2 读数状态分类法（`每日 digest/`，全史实证标定）
「今天该写多长」由**四个新闻信号**决定，不由心情或日历决定。经 2014-01-08 → 2026-07-14 **3,146 个交易日**标定（脚本 `_标定_读数状态分类.py`，Cboe CDN，可复算）：

| 信号 | 频率 |
|---|---|
| ① 水平跨档（VIX1Y 3年百分位跨 10/33/67/90） | 12.5% · 32 天/年 |
| ② 形态切换（期限结构形态与昨日不同） | 18.5% · 47 天/年 |
| ③ 创 3 年新高/新低 | 1.7% · 4 天/年 |
| ④ 百分位跳动（\|Δp\| ≥ **7.80** = 其自身分布前 10%） | 10.0% · 25 天/年 |

**三档模板**：A 静默日（0 信号）**64.3% · 162 天/年 · 三行**；B 变化日（1 信号）21.3% · 54 天/年；C 跳动日（≥2 信号 **或** 深度倒挂 VIX>VIX3M）14.5% · **36 天/年 · 完整判读**。
- **🔑 阈值 7.80 是数据定的不是拍的**：\|Δ百分位\| 中位数仅 **1.98**、P75=4.37、P90=7.80、P99=17.72。我初版拍「3 点算变化」→ 53% 的日子被归为「变化日」= **把噪音当新闻，分类器零区分力**。📌 **定阈值前先问分布，别问直觉。**
- **逐年负担**：C 跳动日最少 **2021 年 9 天**、最多 **2018 年 85 天**、中位 39 天（2020 年 59）。→ 平静年一年十来次长文，危机年三个月抵平时一年。**反周期是这门生意的属性，要备货不要否认。**
- **状态空间穷尽**：水平(5) × 形态(4) = 20 种全部发生过，但分布极不均——**恐惧越贵，曲线越乱**（极便宜的日子 86% 完全单调；极贵的日子只有 21% 还单调，79% 已倒挂或乱序）。这是自己序列里的原创发现，是传说处决的现成选题。
- 工具：`today_state.py [日期]` 一跑就知道今天写多长 + 一周日程（已回测：2020-03-16 判 C、2021-07-15 判 A）。模板 `_模板A/B/C_*.md` 各带「判读那句怎么写」与红线自查。
- 📌 **模板只定长度，不定内容。判读那句永远现写**——两期文字雷同 = 读者 diff 一下就知道是机器灌的，$29 的全部理由当场消失。
- 📌 **分类由读数定，不由日历定**：2018-02-05 无任何数据发布，VIX 自己炸了。**日历决定你几点起床，读数决定你写多长。**

### 19.3 宏观日历（`_日历_2026.csv`，39 条，全部官方确定日期）
CPI×12（BLS）· PPI×6（BLS）· PCE×5（BEA "Personal Income and Outlays"）· FOMC×8+8（Fed 官网，含 SEP 场标注）。
- 🚧 **BLS 全站挡 curl，连 `.ics` 都返回 403 HTML** → 刷新必须走浏览器工具读 `bls.gov/schedule/news_release/bls.ics`（313 事件，机器可读）。一年一次的活。BEA 走 `bea.gov/news/schedule`。
- ⚠️ **M7 财报日期不固定**（公司提前 2–4 周才确认），不可预先写死，需从 IBKR/长桥定期刷新。

### 19.4 分发双渠道（新夹 `每日文案分发/`）
结构：`YYYY-MM-DD/{卡片(共用)} + X/文案.md + 券商/文案.md`。**图 100% 复用永不做第二版，文案必须分渠道。**

| | X | 券商（富途/长桥） |
|---|---|---|
| 明文网址 | ✅ 可带 | ❌ **一个字都不许**（图里地址=唯一入口；文字网址=导流的字面定义） |
| 长度 | 长文 OK | **≤200 字**（真实可见字符，不含 markdown 语法），超了移动端折叠=没人看 |
| 「上一期」指代 | ✅ | ❌ 那儿没人知道你的上一期 |
| 冷启动 | 手动 reply-guy 挑大 V | **天然 reply-guy**——出现在标的页的既有流量下，不需要粉丝 |
| GEO | 🟢 | 🔴 **零** |
| 内容 | 传说处决主场 | **每日读数卡天生该发这儿**（挂 SPY/QQQ）；传说处决要发得用短版且挂大盘页 |

- **🔬 实测（推翻了两轮猜测）**：富途 `/hans/feed` 与 `/hans/community` 均为 **10,769 字节 JS 空壳**（而 `/quote/us/AAPL` 是 **1.34MB 服务端渲染**）→ 社区内容爬虫读不到；`sitemap-ugc.xml` 里那 **183 条全是富途自己的 SEO 内容农场**（`how-to-buy-nvidia-stocks-shares` 之类），**不是用户内容**。robots.txt 并没挡 AI 爬虫——**挡住 GEO 的不是规则，是"不在 sitemap + JS 渲染"**。📌 **券商渠道值得做的唯一理由是客群密度（最高），不是 GEO（零）。别为爬虫优化那里的文字。**
- **🔴 雪球是 GEO 死路**：robots.txt 明文 `Disallow: /` 挡 GPTBot / ChatGPT-User / Meta-ExternalAgent / Applebot，ToS 顶头禁止内容用于 AI 训练与 RAG、禁止创建含其内容的存档数据集。→ 对 S3（被 LLM 引用）贡献恒等于零。起号研究原给雪球「观察不主攻」理由偏软，**以本条为准**。
- **⚠️ 账号分离（待用户确认）**：moomoo 账号是**生产资料**（V2 GEX 批量源 + 每日合约观察截图来源）。营销与生产资料同号，出事的下限是管线塌一块，不只是掉粉。

### 19.5 配图铁律 —— **一张图如果需要读者先懂术语才能看懂，它就不是图，是表**
传说处决 01 第一版做成六根横条（86.40/89.26/89.80/92.54/73.12/67.28），用户一句打回：「感觉很 normal，不知道的人一头雾水」。**他是对的**——四根条几乎一样长、视觉上什么都没发生，且 VIX9D/VIX3M 对外行是乱码。
**修法不是换配色，是换问题**：同一批数据按「年 × 每个交易日」摊开（16 行 × ~252 格，砖红=那天期限结构没排好队）→ **2020 年那 116 天连续失序是一整块猩红横贯全行，2017 年几乎全空**。不需任何术语，一眼即结论。
- **故事自己升级了**：**15 年里只有 2017 年真的达到过「九成」**（91.2%，次高 2025 年 78.8%；2020 年仅 37.9%、连续 116 天失序；2011 年 42.6%、54 天）。所谓"期限结构九成时间向上"，**是在描述 2017 那一种年份**——这比「86.4 vs 67.28」狠得多，且一直躺在自己数据里没人看。
- **🚨 `gap:1px` 毁掉了整张图**：格子只有 ~2.5px 宽，1px 缝隙几乎和格子一样宽 → 连续失序期被切成条形码。`gap:0` + 容器 `overflow:hidden` 才能让连续期连成实块。**这个 1px 是成败的全部。**
- **📌「按时间摊开」是这个品牌的天然图式**：你卖的就是连续序列，把它按天铺出来，危机年份自己会显形。以后任何「占比 X%」的结论，先想能不能摊成日历。
- 渲染：Chrome **`--headless=new`**（⚠️ 旧 `--headless` flag 会静默失败不产图）+ `--force-device-scale-factor=2 --window-size=1200,1500` → `sips -Z 1500`；**验收必须 Read 打开 PNG 亲眼看，永不靠尺寸推测**。

### 19.6 一致性审计（当日全项过）
四个仓库（公开 / KAPX-alpha / KAPX-恐惧标价指数 / 期权数据管线）**全部干净且与远程同步**。当日修掉：期权数据管线**落后 3 个提交未推**（含当天盘前落库数据）；KAPX-恐惧标价指数 `.DS_Store` 被跟踪且无 .gitignore 条目（`ce45fbc` 已修）。公开仓库零密钥、零隐私词、**Drive 链接全历史零命中**。记忆里三处过时事实已加权威时间戳声明（`v=20260715a` 旧值 / Events=3 旧值 / 「Paddle 侧全部完工」——该句指支付管道完工，**付费对象当时并不存在**）。

## 二十、2026-07-15 深夜：二级导航对齐 + 科技篮扩容（本节最新，与前文冲突处以本节为准）

### 20.1 二级导航对齐（`71e8cf0` · v=20260715e）

`css/style.css`：`.pill-group:only-child .pill-group-label { min-width: 5.4em; flex-shrink: 0; }`

- 病因：单组行的标签字数不等（半导体 3 字 = 38.88px vs 平台·软件 5 字 = 64.8px），胶囊紧跟标签排，
  于是 NVDA 比 MSFT/AAPL **左移 25.92px**。三行标签左边缘本来就对齐，错的是标签宽度。
- `:only-child` 精确限定单组行：金融前三行是双组（第二组本就无法对齐，加了只是白填空隙），
  第四行「加密·稳定币」77.77px 已超阈值、自动无效。
- ⚠️ **`flex-shrink: 0` 不可删**：flex 项默认 `min-width: auto`（= 不小于内容）本来在防压缩，
  一旦写死 `min-width` 就顶掉了这层保护——手机端「加密·稳定币」实测被压到 `clientW 59 < scrollW 71`、
  字挤出去了，加 `flex-shrink:0` 才修好。**教训：写死 min-width 前先想清楚它顶掉了什么默认值。**
- 📏 **分组标签保持 ≤5 字**（5.4em 是按 5 字量的）。改字数前先在浏览器量一次宽度，别凭感觉。

### 20.2 科技篮扩容：半导体 +AMD，新开「存储」行（`62220c8` · v=20260715f）

**为什么加**（IBKR 实测 90 日均成交额，2026-07-15）：

| 标的 | 日均成交额 | 此前在不在篮子 |
|---|---|---|
| **美光 MU** | **$458 亿** | ❌ |
| NVDA 英伟达 | $333 亿 | ✅ |
| **闪迪 SNDK** | **$207 亿** | ❌ |
| **AMD** | **$192 亿** | ❌ |
| AVGO 博通 | $103 亿 | ✅ |
| TSM 台积电 | $59 亿 | ✅ |

**美光的成交额比英伟达还大，而半导体行里没有它**——对一个卖「市场状态」的站，这不是打磨问题，是内容正确性问题。

- **闪迪必须进 `BASKET_SATELLITES["tech"]`**：2025-02-13 才从西数分拆（yfinance 实测 355 根）。
  `build_basket` 的**共同起点 = 核心成员里最晚上市那只**，把它当核心加会把科技篮从 2012 一路截到 2025——
  **站还在、图还画，只是历史悄悄没了**。美光(1984)/AMD(1980) 历史够长，进核心零副作用（共同起点仍由 META 2012 决定）。
- 副标题去掉「扛起纳指」：**台积电是 NYSE 上市、本就不在纳斯达克 100**，旧文案口径站不住，改这句时顺手改掉。
- 改 `BASKETS` 必须同步 `js/app.js` 的 `BASKET_CFG`（rows 决定版面、members 决定翻页顺序）
  + `js/i18n.js` 的 D key（中文名与分组标签，key 就是中文原文）。

### 20.3 🔴 新股（SpaceX / 海力士）为什么暂缓——三个实测地雷

用户 2026-07-15 提议加 SpaceX 与海力士，「只展示数据、不渲染年度回报、不和 QQQ 比较」。核实后**暂缓**，理由不是品牌是**没有历史**。

**两条与旧认知相反的事实（将来加没有品牌障碍）**：**SpaceX 已在 NASDAQ 上市**（`SPCX`，2026-06-12，日均 $196 亿）；
**SK 海力士已有美股正股**（`SKHY`，NASDAQ，2026-07-10，日均 $110 亿）——台积电本就是 ADR，外国公司美股上市有先例。

**但现在加会炸三处（全部实测复现）**：

1. **管线当场死**：`fetch_history` 的 `if len(df) > 100` 哨兵取不到就 `raise RuntimeError`。
   yfinance 实测 **SPCX 22 根 / SKHY 4 根** → daily-update 直接失败 = **原样复现 §17 那次静默死 4 天**。
2. **个股页当场白屏**：月度季节性在 1 个月度数据上算出 `NaN`，`json.dump` 写出的 `{"avg": NaN}` 是**非法 JSON**，
   前端 `JSON.parse` 直接抛。
3. **凭空捏造年化**：`build_basket` 里 `full_years = max(..., 0.25)` 这个**地板**会把 SPCX 一个月的 −10%
   开 4 次方，渲染成「上市以来年化 **−33.5%**」——纯属虚构，正踩「能算的绝不引用传说」。

**🔑 反讽（也是决策依据）**：`>100 根` 那个哨兵**本身就是「等历史够了再跟进」这条策略**。
现在加 = 为了绕过正在执行该策略的机制而削弱它，换来一张 22 点和一张 4 点的折线图。

**触发时点（越过 100 根后加，零特殊代码）**：**SPCX 约 2026-11-03；SKHY 约 2026-11-27**（按 21 交易日/月估，实际略晚）。
届时动作 = `BASKETS["tech"]` + `BASKET_CFG` 各加一行、i18n 加中文名（海力士 / SpaceX）、分组归位
（海力士进「存储」行；SPCX 需单开「航天」组——金融篮的 `资管:[BLK]` / `保险:[BRK.B]` 就是单成员组，house style 允许）。
**若要提前加，必须先写「新股模式」**：`fetch_history` 加 `min_bars` 参数（默认 100 不动，只对卫星放宽）
+ 新股只出走势面板、跳过会产 NaN 的季节性/年度 + `since_full` 不足 1 年不年化 + 前端标注「上市 N 日，长期面板待历史积累」。

### 20.4 🪤 验证线上：必须 curl `/`，不能 curl `/index.html`（2026-07-15 实测，已咬两次）

```
curl -s https://chronicle.klay-wang.com/index.html   → HTTP 308 · 0 bytes   ❌ 静默空
curl -s https://chronicle.klay-wang.com/             → HTTP 200 · 78699     ✅
curl -sL https://chronicle.klay-wang.com/index.html  → HTTP 200             ✅（-L 跟随跳转）
```

- **自定义域名把 `/index.html` 308 永久重定向到 `/`**（规范化 URL）。`curl -s` **不带 `-L` 不跟随** →
  拿到 0 字节 → `grep` 永远不匹配。⚠️ **github.io 源站的 `/index.html` 是 200**，所以这是自定义域名独有的行为，
  拿源站测会得出相反结论。
- **今晚它咬了两次**：①一个 `until curl .../index.html | grep -q v=...` 的后台轮询**永远等不到、一直空转**，
  直到用户看见「有个 task 在跑」才发现；②同款写法的前台命令**卡满 5 分钟超时**（exit 143）。
- **ship 五步的第 5 步（线上 curl 验证版本号）一律写 `curl -s https://chronicle.klay-wang.com/`**，
  别写 `/index.html`。**教训：轮询的退出条件必须先手验一次能匹配，否则「一直在等」和「永远等不到」长得一模一样**
  ——跟 §17「监控响了假的」是同一类病：**没有信号 ≠ 一切正常**。

## 二十一、2026-07-16 凌晨：一夜八推 UI/文案 + 「量尺骗我九次」纠错记录（本节最新，与前文冲突处以本节为准）

> 时间窗：2026-07-16 00:00–03:4x EDT。承接 §18/§19（定位定价重构）。**线上现行 `v=20260716f`。**

### 21.1 八次推送逐条（全部 ZH+EN 双语实测 + 零控制台报错 + 收钱不变量核过）

| commit | v= | 改了什么 |
|---|---|---|
| `a5358eb` | 20260716a | 顶栏改名「K 指数 · 台账」「恐惧的标价 · 台账」+ **删掉净值曲线旁的付费 CTA** |
| `26c1444` | b | 墨色加深一档 + 「QQQ 总览」→「科技总览」+ 指路句跟随 tab 改名 |
| `9056983` | c | 情绪卡标题居中 + 消除 grid 拉伸空白 + 页脚提到 `--ink-soft` |
| `0844847` | d | 表头 has-logo 缩进 + 页脚加字重 + **新建 `data/README.md`** + 数据&API 挪 Get Started |
| `f2bdd69` | e | 台账区收尾改「订阅框 + 验证框」两框并排 + 修 VIX 卡孤字 |
| `850b6a4` | **f** | **ledger-card 补居中**（上轮漏了）+ lc-meta 短语防折断 + 验证框文案定稿 |

### 21.2 三个「不是设计是产品」的决定（别当成美化改动回滚）
1. **删净值曲线旁的付费 CTA（原「盘前数据简报 · 创始价 $9.9」）**：①$9.9 是邮件预约制（两扇门），头版对所有人喊 = 那扇门不存在；且数字已过期（创始码是 **$99/年**）。②净值曲线正上方挂付费 CTA = 观感「看我多准→掏钱」，而台账写着 K 跑输纳指——**改动词治不了，是相邻性问题**。这是长期挂着的未决项，本次解决。
   → **付费入口现仅存页脚「定价与套餐」**（顶栏 11 个 tab 全是内容面板，无定价）。**先证明后开口；等免费名单到两位数再评估是否加回。此条待用户最终拍板。**
2. **「在 GitHub 验证台账」留在原位、不进页脚**：它是净值曲线的解药——上面刚说完「本站不宣称信号能跑赢买入持有」，紧接着把可验证链接摆这儿，**本身就是可信度；它的价值不是被点击，是它存在**。挪页脚 = 从「我请你查」变成「你想查自己找」。
3. **顶栏改名「· 台账」**：对外一直说「台账」，站上却没一处入口用这个词（全站含「台账」的可点元素只有 2 个且都指 GitHub）——**命名不一致，而命名一致是被引用路径的核武器**。

### 21.3 `data/README.md`（新）—— 回答「数据都能下载走，那不是直接抄袭就可以吗」
- **法律层**：仓库根 `LICENSE` 早就是 **PolyForm Noncommercial**（自己看随便／拿去卖违约），但 `/data` 底下 375 个裸 JSON **一个字没提**。已补：来源、许可、引用格式、文件索引、两段式诚实分段、KAPX 无预测力披露。
- **根本层**：**数据从来不是护城河**——全部来自 Cboe/FRED/CNN/Yahoo 免费公开源，任何人一下午能重算；且 Kaggle/HF 数据集是**故意**发的（GEO 漏斗的 S0），藏起来 = 亲手掐掉那条路。
- 写进 README 的那句：**「抄走 /data = 抄走一张快照。抄不走的是那本账 —— 一份被复制的时间戳台账，没有时间戳。」**
- 页脚「数据 & API」从 About 挪到 **Get Started**（它是「拿去用」不是「了解我们」），并从裸文件树改指向这份 README：**先给上下文再给文件**；该 README 同时是 GEO 资产。

### 21.4 🚨 纠错与踩坑：「量尺骗我九次，站零次」
**今晚每一次「发现问题」，最后都证明是我的检测方法坏了，不是站坏了。** 九次全记在这，因为它们会重犯：

| # | 我量出的「问题」 | 真相 | 通用教训 |
|---|---|---|---|
| 1 | grep 报「清单零残留」 | 我用带空格的 `SPY / QQQ / M7 / AVGO`，而 llms.txt 是**无空格版** | **精确 grep 会给你一个假的零残留**；核残留必须宽松模式（`grep -nE "AVGO\|M7"`） |
| 2 | 券商文案「204 字超标」 | **把 markdown 的 `**` 也算进字数**，真实 192 | 量「用户看到的字数」要先剥语法 |
| 3 | 「EN 下有汉字残留」 | 是 `The K stands for kǒng (恐)` —— **KAPX 词源，那是特征** | 「EN 页不许有汉字」这条规则本身是错的 |
| 4 | 「浅色暗色对比度一模一样」 | **我塞了个 `data-theme` 属性，而站靠 `html.dark-mode` 切**，量了两次暗色 | 改状态前先确认站真的读那个开关（`#theme-toggle`） |
| 5 | 「暗色页脚 2.0:1 🔴」 | 我的 `bgOf` 往上找背景**找到 body 就停**（读到浅色纸底）；真实底色在 `html` 上，实为 8.9:1 | 暗色下背景可能只挂在 `html`，别在 body 停手 |
| 6 | 「#panel-tech 有 QQQ 残留」 | 那是**真的 QQQ 图表**（板块的锚/走势/年度回报/回撤） | 关键词命中 ≠ 错误 |
| 7 | 「两框不等宽 400 vs 653」 | **浏览器读的是缓存的旧 CSS**；清 sw+caches+`?bust=` 后当场等宽 | **改 CSS 后必须先清三层缓存再量**（这条早已在铁律里，我仍然栽了） |
| 8-9 | 「.nw 短语全断了」（连报两次） | `.nw` 内嵌 `<span>`+`<b>`，**`getClientRects()` 天然多矩形，与折行无关** | 判折行要**比矩形的 `top`**（差 >3px 才是真换行），不能数矩形个数 |

**📌 元教训：验收失败时，先怀疑量尺，再怀疑被测物。** 今晚九次全是量尺。而九次里有七次是用户说「这不对」才回头查的 —— **人眼比我的正则可靠。**

### 21.5 CSS 坑（本轮新增两条）
- **`.ledger-sub` 在 `:1093` 被第二次定义**（"订阅框轻量化：去卡片感"，是刻意设计不该推翻）→ 新规则必须写在它**之后**，同特异性下后者胜，写前面会被**静默盖掉**。（本项目 CSS 特异性坑第三次：前两次是 `.doc-body a` 压 `.ptier-cta`。）
- **`@media` 断点撞测试窗口**：断点 900px 而浏览器视口只有 716px → 落成单列，**那是断点生效不是布局坏**。量布局前先 `resize_window` 到桌面宽度并**核对 `innerWidth` 真值**（`preset:desktop` 不一定生效）。

### 21.6 ⚠️ 待办（用户报告但未确证，需下一手复核）
1. **用户报「标题没居中」「标普&纳指公司列没对齐」仍在**。而本地实测（清缓存后、1440px 视口）：**九张卡标题偏离中轴全部 0px；持仓表「公司」列错位 0px（has-logo 已生效）**；线上 `curl` 核实四条规则全部就位（`has-logo` ×2 / `th.left.has-logo` / `senti-card, .ledger-card` / `lc-meta .nw`），版本 `v=20260716f` 正确。
   → **最可能是用户端浏览器缓存**（今晚我自己栽过两次）。**请下一手：让用户用无痕窗口确认；若无痕下仍未居中/未对齐，则是真 bug，从 `.ledger-card`/`th.left.has-logo` 的特异性与 media 断点查起。**
2. **付费入口只剩页脚**（见 21.2）——待用户拍板是否在顶栏加第 12 个 tab。
3. **验证框文案「GitHub」出现三次**（标题 1 + 副文案 2），「每个交易日」与「每日」也重复 —— 已按用户原文实装，**未擅自精简（那是他的声音）**，待他自己定。


## 二十二、2026-07-16 上午：12 文件夹六条 + 需求三轮校准 + 免费档改读数驱动（本节最新，与前文冲突处以本节为准）

四个提交：`a93ad98`(v=g) → `3436ace`(v=h) → `9f522df`(v=i) → `d2514d2`(v=j)。**线上现行 `v=20260716j`，逐条 curl 核实。**

### 22.1 §21.6 待办第 1 条结案：不是缓存，是修错了对象 + 读错了需求

用户交来 `~/Desktop/12/` 六张圈图截图，真相大白：
- **「标题没居中」圈的是 `.stat` 卡**（今日 K 指数四张）——§21 修的是 `.senti-card`/`.ledger-card`，**量尺量对了、对象量错了**。两轮实测 0px 都是真的，只是量的不是用户圈的东西。
- **「公司列没对齐」要的是「居中」**——§21 把需求读成「表头与内容错位」修了 padding。表头与内容的对齐**本来就是一致的**（实测 left/left），用户不满的是整列贴左。
- 📌 **教训：用户说「还是没解决」时，第一步是让他圈出具体元素，而不是再量一遍自己修过的东西。** 两轮「实测 0px」都对，但都没回答他的问题。

### 22.2 12 文件夹六条（`a93ad98` v=g，其中②后来又改了两轮见 22.3）

① `.lv-note` 加 `word-break: keep-all`——「GitHub 精确可查」曾被拆成「…精确可/查」。
   **不能包 `<span class="nw">`**：applyTo 按整文本节点精确匹配 i18n 的 D key，插标签即失配、EN fallback 成中文。
② K 跌破 1 的破折号 → 冒号（index.html + i18n D key 同步；`:780` 那处本就无破折号，未动）。
③ `.stat` 加 `text-align: center`——与 `.senti-card`/`.ledger-card` 统一，此前同页两套轴。
④ VRP 四格读数由浅到深猩红（`#E8735A→#E04E2E→#C8341A→#A0392F`，暗色另四档）。
   ⚠️ CSS 注释已写死：**纯视觉层级，不编码含义**——四项单位不同、方向不同向（相关 −0.47），深浅不可被读成「越右越危险」。
⑤ `.stat.compact`（20px + nowrap）——「15 / 19 / 22.4」在 26px 下折成两行把读数劈成两半；app.js 值超 8 字符自动加。
⑥ 持仓表公司/行业列居中（一并治了同类漏网：篮子对照表「名称」列带 logo 却连 has-logo 缩进都没有）。

另修（`3436ace` v=h）：**EN 下「KAPX Index today (2026-07-15)」在 148px 窄卡把日期劈成「(2026-07-/15)」**——
nowrap 会溢出、插 span 打断 i18n 正则（i18n.js:798 按整节点匹配），**解法 = 日期用不换行连字符 U+2011**（三种卡宽实测无豆腐块）。
**Pro 档「重度个人 · 数据自主」→「面向专业用户 · 数据自主」/「For professionals · data autonomy」**（用户定，装下 PA/机构/一切有需要的）。
⚠️ 定价面板 EN 由 docs-i18n.js 整块替换，两处必须同改。
📌 提醒：「professional」在实时期权行情授权里是收费分类（OPRA professional subscriber）；本站 EOD 描述性数据不受约束（这正是相对 UW/SpotGamma 的结构红利），但哪天接实时数据别忘了这层。

### 22.3 公司列的三轮校准——最终形态「块居中、块内左对齐」（`d2514d2` v=j）

用户三轮反馈的翻译史，照录以防再犯：
1. 「没对齐」→ 修了表头 padding 对齐名字（错：他要的是居中）
2. 「居中了但上下乱」→ 改整列居中（错：名字长短不一，logo 上下参差）
3. 「logo 左对齐、左边要齐」→ 改回左对齐共线（错一半：竖线齐了但整块贴左，大片空白堆右边）
4. **终态：每行 logo+名字包进同宽 `.co-wrap`（inline-block 21em，按最长名 Meta Platforms Inc Class A 量的），
   td 居中、盒内左对齐——整块坐在列中间，logo 仍一条竖线。**
仅用于公司列很宽的两张表（前二十大持仓/五百家一览）；篮子对照表列窄，保持 `th.left.has-logo`/`td.left-col` 各 18px 左对齐。
📌 **教训：视觉需求别按字面翻译成 CSS。先渲一张 mockup 给用户确认，比连改四版便宜。**

### 22.4 免费档从日历驱动改成读数驱动（用户拍板，`9f522df` v=i）

- 旧：「每周一封：台账读数与市场状态」= **日历承诺，忘发即失信**——而付费日更都还没开始，多背一个会塌的承诺。
- 新：「**极端读数那天：台账读数与市场状态**」+「免费 · **由读数触发，不按日历** · 随时退订，不发广告」。
  与铁律同源：**分类由读数定，不由日历定**。i18n D key 同步（"On extreme-reading days…"）。
- 运营含义：按标定 C 跳动日 ≈36 天/年（平静年 9 天、危机年 85 天）；**与付费档共用同一份 C 日判读**（免费=读数卡，付费=判读正文），零新增劳动；安静不发=产品定义而非失信。发送仍手动。
- 首页订阅框 ≠ $29：**免费名单是漏斗的「店面」，$29 是收银台**——0 粉丝阶段删店面只剩收银台，转化=0。用户问过「是不是多余劳动」，结论是改触发方式而非删名单。
- 同批：订阅框加与验证框同款边框（此前一对盒子只有一半有框）。

### 22.5 🚨 量尺继续骗人（接 §21.4 编号，第十～十四条）

10. **Browser 面板的截图不跟随 JS 的 `scrollTo`**——JS 里 `scrollY=9498、表可见`，截图却是页顶或全黑。
    截图坐标系（800×569）与 JS 视口（1280×900）不是一回事。**验收滚动后的区域，用 headless Chrome 渲染真 CSS+真数据，别信面板截图。**
11. **SPY 页能把 Browser 面板渲染进程卡死**（滚到五百家一览时三次超时，控制台零报错）。空转等它=白等，直接换 headless。
12. **`scroll-behavior: smooth` 让 `scrollTo` 后立刻读 `scrollY` 拿到动画前的旧值**——看起来像「页面滚不动」。量之前先 `scrollBehavior='auto'`。
13. **zsh 的 `echo "$VAR" | grep` 会给假 0**——echo 解释内容里的反斜杠转义（app.js 里有 `\u2011` 这类字面量），内容变形后 grep 全 miss。
    一轮「六条全 0」实为管道假象，线上其实全在。**验证文件内容用 `printf '%s' "$VAR"` 或直接 `curl | grep`，别用 echo。**
14. **验证字面字符串用 `grep -F`**——模式里的 `$`/`{` 在正则里是元字符，`grep -c 'center-col">\${tblLogo'` 静默 0。
    另：**部署时间差也会伪装成「没修」**——v=h 的 index.html 先到、style.css 后到（60285→62543 bytes），中间窗口 CSS 六条全 0 是真的旧文件，等 90 秒就好。**先比 bytes 再下结论。**

### 22.7 EN 泄漏全站扫描与清零（`92b39f2` v=k）

**扫法（可复用）**：静态=抠 app.js 模板里的中文文本节点逐一 grep i18n（⚠️ HTML 实体 `&lt;` 会让比对假阴性）；
动态=浏览器逐面板切 EN 后 TreeWalker 走文本节点抓 CJK。**两层都要**——静态抓不到「被 `<strong>` 劈碎的片段」和「带 `${}` 的动态串」。

结果：kindex/macro/tech/fin/consumer/luxury 全干净；**恐惧的标价页 11 条泄漏**，两类病根两种修法：
- **动态数值串**（`vol 点 · 近 3 月 +10.4`）→ P 正则规则 ×6（今日 CNN 恐贪/N 段/vol 点/分位·全史·值/分位·全史·%/历史记录长句）。特殊规则排在通用之前。
- **碎片**（净值那句被 `<strong>` 劈成 5 个文本节点）→ 逐片 D key，各配 EN。
另补 D key：关键数据/数据更新中（§22.2 引入的降级文案自己就是泄漏源）/分钟线。
日期防劈 U+2011 推广到全部四处（今日 K 指数/今日 CNN 恐贪/两张「最近一次」卡——Python replace 全局替换把第四处白捡了）。
破折号普查：正文散文里还有 4 处 `——`（:143/:605/:791/:792），**语境合法未动**；「读数后接判语」句式已无残留。
pulse 页 EN 的 canonical 定义里含「恐」字 = 品牌解释（K 取自恐的拼音），**故意的，不是泄漏**。

### 22.8 Paddle 收款端到端冒烟（2026-07-16，不花钱的实弹）

**线上实测（真点击）**：ZH 点「订阅 $29/月」→ `buy.paddle.com/paddlejs/v2` iframe + `paddle-frame-overlay` 起来 ✅；
**切 EN 后点「Subscribe $29」→ 同样起来 ✅ = 事件委托扛住了 docs-i18n 整块替换（那颗地雷的实弹验证）**。
静态接线：live token（尾号 ee404）· 生产环境（0 处 sandbox）· 月付/年付 priceId 与档案一致 · `pay/` 200 + noindex + 只 Initialize（两处 Checkout.open 都在警示注释里，非调用）。
**结论：技术链路全通，现在有人订阅就能收到钱。** 仍属流程而非故障的三件事：
① **首笔真实交易会触发 Paddle 的 final review**（读整站；合规页 `1776102` 已修齐，退款/条款均现在时）；
② **交付是手动的**（定价页承诺「订阅后 24 小时内开通」，Paddle 通知进 `klaywang24+mcpaid@gmail.com`，需手动把买家加进 Buttondown；付费定向发送要 Tagging add-on $9/月，未购）；
③ **创始价 $9.9 走邮件预约**（折扣码 `dsc_01kxjqmtb40e8bsy2zqtkqxk0e`=$99/年，手动发）。
唯一没法从这里核验的：**Paddle 后台的收款账户/payout 银行信息**——KYC 已过（§18），建议后台点开 Payouts 看一眼状态即可。

### 22.9 页脚整编（`afc3d66` v=l，用户抓的重复项）

- **「上手指南」与「方法论」指向同一个 `#methodology`**——一个页面两个名字，用户一眼抓出。删「上手指南」，
  保留「方法论」（canonical：卡片页脚/README/退款页全用它；「上手指南」这名字还许诺了页面不提供的 onboarding）。i18n 死 key 一并清。
- 分栏整编为 **About(关于/方法论/联系) / Get Started(定价/数据&API) / Legal(条款/隐私/退款)**，8 链接 3/2/3——
  法律三件套原本拆在两栏（条款在 About、隐私退款在 Support&Connect）。
- **不加新项**：GitHub 链接已由「数据 & API」覆盖；社交图标此前已删（与联系我们重复）；
  「在 GitHub 验证台账」按 §21.2 决定留在净值曲线旁、不进页脚。
- 同批合规复扫（全绿）：时态残留 0 / 「每周一封」旧节奏 0（welcome 页只承诺付费档的「每个交易日开盘前」，一致）/
  高曝光面禁词 0（docs-i18n 那处 trading signal 是「not a trading signal」护身符）/ 首期声明已随 §18 定价重构移除。

### 22.10 卡片双语升级 + 页脚签名行 + 创始席位 100→50（2026-07-16 盘前，用户五条）

**卡片（当日两张已改+重渲染；母版与 make_card.sh 同步，脚本兼容已实测）**：
- **EN 可读性升级**：全部 EN 副行字号 +1~1.5px、灰色加深两档（`#a09a94→#857f78` 等三档映射）。
  **层级不变：中文仍是主**（双语铁律「中文主+英文副行」没动，只是副行从"眯眼才能读"提到"正常能读"）。
- **页脚重构（两张卡同款）**：数据源行 → 免责行 → **签名行置底加黑加粗**（`美股编年史 · Market Chronicle ｜ chronicle.klay-wang.com ｜ commit <hash>`，14-16px/800/#1a1a1a）。
  卡1 删掉「4 context 只展示，不平均进头条」句（ZH+EN）——那是给 reviewer 的方法论注记，不是给读者的。
- **锚点段拆三行**（一行太挤）：口径+百分位 / **换个口径答案就变**（9d<1y=89.8%、五点全排=67.3%）/ 「不报口径的百分比不是事实，是修辞」。母版用 {{ANCHOR_9D1Y}}/{{ANCHOR_MONO}}/{{ANCHOR_NJ}} tokens，脚本已在算。
- ⚠️ 当日档案发送前可改；「档案不回改」管的是**已发出**的。

**创始席位 100 → 50（`010c074` v=m，ZH+EN 两处）**，账在 commit message：满产 500 订户=$174k/年；
每创始席位永久让 ~$229/年，100 席=让 13%；**席位只能加不能减（100→50 是打脸，50→100 是慷慨）→ 宁小勿大**；
不取 30：创始群兼访谈池+种子传播，0 粉丝阶段 30 席出不了朋友圈。

### 22.11 一卡三版与渠道映射（2026-07-16 盘前，用户定）

- **make_card.sh 每次自动出三版**：双语（源档案，不外发）/ **纯中文 → 券商评论区** / **英文主 → digest · X · LinkedIn**。
  英文主 = 字号/颜色/上下顺序三样互换（EN 上 CN 下）；纯中文 = EN 副行 display:none + 混排修剪（陡 contango → 陡峭正向）。
- 锚点段「不报口径的百分比不是事实，是修辞」句**已删**（用户定，母版级——三版口径一致）。
- 传说处决系列每期手作，三版手工出（07-16 做法在当日文件夹，英文主标题为 AI 代拟需作者过目）。
- ⚠️ X 渠道给英文主卡与起号研究「X=中文主战场」存在张力（混搭：英文主卡+中文推文），裁决交发布台账 A/B，30 天看数据。
- 📂 **两夹已移居桌面（2026-07-16 用户搬的）**：`~/Desktop/每日 digest/`（原 `生意与起号/01-…/每日 digest/` 已空）+
  `~/Desktop/每日文案分发/`（新格式 `YYYY-MM-DD/{中文,英文}/`，纯中文→券商、英文主→digest·X·LinkedIn，旧双语一律 `_备选/` 防误发）。
  凡本手册前文写「生意与起号/01/每日 digest」的路径，以本条为准。
- 💧 **水印三点位（2026-07-16 定）**：右上角 + 图表区内 + 页脚签名行各一处域名——任何横向截图至少带走一处。
  券商评论区正文禁网址，图上落款=唯一入口。卡1 进母版自动继承；处决系列手作照做。
  分发夹终态：`YYYY-MM-DD/{中文,英文,_备选}/`，中英各自带卡+文案（X/券商两夹已并入语言夹）。
- ⚙️ **已固化为默认（2026-07-16 收口）**：make_card.sh 默认一卡两版（双语不落盘）+ 渲染后自动拷进分发夹；
  水印三点位进母版。**skill 已建 `~/.claude/skills/digest-card/`**（/digest-card · 出卡 · 做今天的卡）。

### 22.12 「短端 vs 长端」双线图上线 + 付费 API 网关脚手架（2026-07-16 盘前追加，`78ebe5b`/`195378e` v=n）

- **新图**：恐惧的标价页第二章，VIX1Y（红）vs VIX9D（灰）双线（2011 至今，3,900+ 天）——把「短端塌长端不动」的斜率故事从文案搬上站，2020 灰线冲 107 红线只到一半，一眼看穿。数据 = 现有 sentiment.term + leaps_gauge 按日期 join，零新数据源。**展示层非指数成分**（斜率进分类器另走注册流程）；图注只写事实。i18n 五 key。
- **API**：`api/`（worker.js + wrangler.toml + README）= Pro 档「API（远期）」的实体，**未部署**——锁(key/KV) + 计量(每 key 每日) + 回源免费端点。部署 10 分钟（wrangler login → kv create → deploy）。
- 🔴 **免费门不锁（定案，别再议）**：站自身 JS 依赖 data/*.json / GEO 引用靠公开抓取 / 数据本在公开 GitHub 仓库锁 URL 无意义 / 定价页承诺「永远免费无墙」。**付费 API 卖的是稳定端点+key 管理+用量保障，不是数据本身。**
- 截图档案定调（口头，未动工）：**事件图鉴非数据集**——不全读（23,000 张≈90+ 批次≈一个月），挑 20-30 个大事件日先读；衍生指标可卖、原始 tape 不可（OPRA）。用户周末研究。

### 22.13 人话钩子层（`2c0820c` v=p）+ 双线图配色（`f850233` v=o）+ 两夹迁回工作区

- **双线图 VIX9D 灰→涨跌绿**（p.moss）：红绿对比一目了然，且与全站色语言自洽（绿=便宜/低、红=贵/高，短端常年低于长端）。
- **人话钩子层（用户定方案 A：术语保留，首现处配类比；不做全面白话化——术语是 GEO 抓手+付费客群信任信号）**：
  百分位→排队（dek + hero 动态句「即：比过去三年 N% 的交易日都贵」，percentile 语义使其在任何读数下字面为真）；
  contango→保险（「越远越贵 · 保得久，保费高」，contango 从 ZH 退场、EN 保留）；期限阶梯→「五根柱=给 5 个期限各开一份保费」；
  实际利率→「资金压在仓里的成本」；K 指数 dek→「**分子是人心，分母是保费**」；VIX 卡注→「恐慌保险的价格」。
  **原则 = 配图铁律移植到文案：一句话若需先懂术语才能看懂，它就不是解释，是复述。** 三个比喻（油价牌/保险/排队）= 全站统一人话词汇表，digest 文案可复用。
  make_card.sh 判语同步同款（卡站一致）。i18n 全套（含 1 条 P 规则），EN 双页动态扫描零泄漏。
- 📂 **两夹又迁回工作区原位**（用户当天第二次搬家）：`生意与起号/01-起号引流(Reddit+X)/{每日 digest,每日文案分发}/`。
  §22.11 的「移居桌面」作废；skill 路径已修并加**路径免疫说明：先 `mdfind -name make_card.sh` 定位，别信文档绝对路径**（一天两搬的教训）。

### 22.6 一条没动的观察（留个记号）

站上「期限阶梯」柱子用的紫是站内四色对照系的 `--purple: #6A4E9E`（`719b231` 引入），**不是**禁用的 chart-style 紫 `#5B43E8`，合规。
但 digest 卡1 的同名「期限阶梯」用灰+砖红，而卡片 README 写着「构成=站上面板的完整复刻」——**两边配色不一致**，哪天统一需用户拍板。

## 二十三、2026-07-16 白天：推送线全链路首日——四渠道首发 + 恐慌日弹药体系（本节最新，与前文冲突处以本节为准）

### 23.1 四渠道首发闭环（发布台账 4 行全带 URL，台账在期权数据管线 data/发布台账.csv，随 17db958 入库）
- 长桥 `longbridge.cn/topics/42720069`（处决01+卡1 纯中文）：4 关注 / 3 回复 / 4 收藏 + 一位大V互动（「盘前买入了一部分」）
- 富途 `q.futunn.com/feed/116929318027668`：4 赞 + 4 主页来访
- X `x.com/_Klay24_/status/2077750395124994474`：thread 5 条（1–4 纯文字分段，第 5 条 = 处决卡英文主 + $SPY + 站链），发布 ~09:41 ET 黄金窗口内
- digest 第 2 期（buttondown archive `…u6050-u60e7-u7684-u6807-u4ef7-07-15-u6536-u76d8/`）：A 静默日 + PPI 斜率故事，配图英文主版 ✓，骨架占位零泄漏 ✓；作废的旧第 1 期已被用户删除
- 📌 X thread 结构教训：**图必须放第 1 条**——时间线/转发/未登录访客只见第 1 条；免费档单条 280 加权字符，处决全文 955 → 被拆成 5 条
- 📌 cashtag 定案：`$SPY`/`$VIX` 大写美元符（金融内容在 X 唯一有用的 tag，= 券商标的页同一逻辑）；# 话题标签不用（算法已语义化，堆 tag = spam 信号）

### 23.2 Profile 与漏斗闭环（当日全部完成）
- X 显示名「Klay · 美股编年史」/ bio 重写（每交易日数据卡定位 + 可复算 + 「只描述贵贱，不预测涨跌」护身符 + ex-IB + WMM）/ **网站栏 = chronicle.klay-wang.com**（此前断链，主页唯一保证可点的位置）/ 生日改私密
- footer snippet 已更新四处：创始席位 100→50、补「按年 $99 收」（防预约者付款时被 $99 年付吓到=「卖不卖东西的陈述必须同步」同款）、删中文块英文尾巴、**Drive 判读档案链接行已加**（位置=台账验证之后、三不做之前；进公开存档=既定「泄漏再换」设计）
- **首个陌生订阅者**：07/16，HK，Gmail，referrer=chronicle.klay-wang.com，Unactivated。SOP：重发确认信一次 → 48h 未确认可从个人邮箱发一句话（**提 Promotions 标签页**——Gmail 卡确认信最常见处不是垃圾箱）→ **永不手动改 Regular**（双重确认=营销同意记录，Paddle 预勾选教训同源）。⚠️ 订阅框 referrer 恒=承载表单的页面，判断真实来路要靠日期与渠道时间线
- 大V回复姿势（定案）：不评价买卖（认可=荐股、否定=预测），只给「下单那一刻的坐标」+「每天记账，涨跌都记」留回访钩子

### 23.3 恐慌日弹药体系（2026-07-17 发送日用，文件在 生意与起号/01-起号引流(Reddit+X)/每日文案分发/2026-07-17/）
- 三件套：`_恐慌FAQ弹药包_盘中草稿.md`（MU/SNDK 坐标表 + 回复模板，盘中数一律作废等明早终版）/ `_文案草稿_恐慌日主体.md`（X+券商主体 + 三情景句槽，情景由今晚 VIX1Y 读数定不由盘面定）/ `_文案10版_每平台_恐慌日.md`（10 心理角度 ×2 平台 + V8–V10 方向扩展 5 版 + 大V回复模板 + 恐慌日加强自检）
- 换框教义：恐慌者要的不是答案是坐标——接框（能/不能）死、拒答冷、**换框（不答「该不该」，答「在哪里」）是唯一姿势**
- 三设计杠杆（不加第四个）：坐标即安慰 / 好奇心来自「感觉的怕 vs 标价的怕」的缺口 / 历史在场即定力（2011·2018-12·2020-03 都有标价）
- 用法铁律：**每平台主帖只发 1 条，其余 14 版全是回复区弹药**（谁带哪种心理来用对应角度接）；影响力杠杆只用在「挑哪个真实事实」上，不在修辞上（稀缺=iv_rank 100 是数据不是话术）
- ⚠️ 名称勘误钉住：大盘「X/100」= **恐惧的标价头条（VIX1Y 过去 3 年百分位）**，落库线交接曾误称「K 指数」——两个不同指标，填数别错源
- ⚠️ 措辞地雷两枚已拆：「恐慌长在科技/AI 基建一条线上」是归因不是读数（改纯分布陈述或删）；「天气预报」的「预报」二字全程禁用（定位定稿）
- 转化度量：四先行指标（免费名单净增 / X 关注 / 主页来访 / digest 打开率），$29 转化周期 = 「下次大跌」，评论区绝不提价格与订阅

### 23.4 IBKR 行情资格预警（管线倒计时，非本线职责但当日发生，详见记忆 option-daily 条）
- 账户净值 $5 < $500 行情最低维持线 → snapshot 资格已停（07-16 邮件）；**流式行情实测仍通**（SPY 快照时间戳 63 秒新鲜）
- 不是风控不是用量惩罚，纯余额规则；**下个账单周期付费行情订阅（OPRA 等）可能被一并取消 = 管线 IBKR 主源整条断**，且按惯例大概率静默降级不报错
- 待办（用户）：注资 $600–1,000（留每月行情费缓冲）→ Client Portal「交易平台 → 市场数据订阅」确认各订阅仍 Active

### 23.5 数据集与平台身份面校正 + 明日方案（2026-07-16 下半场补录）
- **HF 数据卡曾带 `timing-signals` 标签 = `1776102` 自打脸大扫除的漏网面**（当时站与 GitHub profile 都改了、没人查 HF）→ 已删换 `market-indicators`；HF/Kaggle 全部 github.io 链接 → chronicle 正式域名；refresh.sh 跑至 07-15（3,882 行 / 39 信号未变）。⚠️ README 手写「39 signals / 26 涨 13 跌」= 快照类，refresh 只推 CSV 不动数据卡，**第 40 个信号出现时须手更两平台 README**
- Kaggle bio 曾写 KAPX =「a daily U.S.-equity **timing signal**」→ 用户已改「fear-pricing gauge」（meta 已线上验证）；HF profile bio 已贴 canonical 句。**四面（站/Git/HF/Kaggle）首次全对齐**
- 订阅漏斗补完：`/check-inbox/`（538786e）+ `/confirmed/`（09012c8）两页上线并 200 验证；Buttondown Redirects 两框由用户填；双重确认 = Buttondown 平台强制无开关（官方文档核实）；付费侧走 API `type:regular` 直进、无确认信（既定设计）
- **明日（发送日 07-17）方案已定**：主图 = 卡1 一卡两版（处决系列周更、明日不发）；主帖 券商 = V9「问到头了吗」换框版 + 卡1纯中文，X = 恐慌日主体文案（情景句由今晚读数三选一）+ 卡1英文主放第 1 条；⭐坐标句「同一天第一大权重创历史新高、存储双雄两日约 -16%」进 digest 材料区（纯分布陈述零归因）；15 版回复弹药 + MU/SNDK 模板等明早落库终版数填空

### 23.6 数据 JSON 嵌 `_notice` 许可标记 + license 完整性核查（2026-07-16 深夜）
- **核查结论：license 五处齐**（LICENSE 全文 / 双语 README License 段+徽章+Required Notice / data/README 许可+商业授权邮箱 / llms.txt / 站脚声明），口径一致。GitHub API 显示 license=Other/NOASSERTION **属正常**（PolyForm 不在 GitHub 自动识别列表，不影响效力），勿当 bug 修
- 缺口 = 单个 JSON 被拷走/热链时不带任何声明 → `build_data.py::write_json` 注入顶位 `_notice` 键（build_fundamentals 同用此口，一处改动覆盖两条管线）；存量 375 个 data/*.json 已回填（顶层全 dict 已验证）。⚠️ 字符串常量 = build_data.py 的 `NOTICE`，**改这句必须同步重写存量文件，否则新旧不一致**
- 前端安全性验证过：`Object.keys` 遍历只发生在 ECharts option 的 i18n 翻译（app.js:66），没有任何地方把数据 JSON 的键枚举成序列；本地起站首页 + KAPX 面板全渲染、console 零错误
- 认知留痕（用户问"如何防止商用"的答案）：**数字=事实，美国法下不受版权（Feist）**；license 真实作用 = 挡正规玩家（法务不碰 NC 仓库）+ 给 DMCA/索偿依据（护的是代码/文案/编排，不是数字）；真护城河 = 时间戳台账（data/README「抄走=快照」段已写透）。**别用改动数据当反抄袭指纹**——违反事实铁律与「事后不可改写」承诺，字段式声明就够
- 订阅条款去向已定：**合同本体在站上**（Paddle 是 MoR，结账页链接站上条款/退款页，Paddle 后台不用动）；**Buttondown 是送达通道**（welcome 邮件 + footer Snippet 各加一句「仅限订阅者个人非商业使用，不得转发/转售/再分发」，由用户在 Buttondown 后台粘贴，未做）
- 同日顺手：README Credits 修剪至只留 Big Picture（`0aa186f`）

### 23.7 About「怎么建的」重写 + 定价 dek 去 AI 味（v=q，2026-07-17 凌晨）
- About：删「+ AI」；无服务器/无数据库**保留但改写成信任论据**（「站上的数据就是公开仓库里那几百个 JSON 文件，谁都能翻」）而非技术参数；许可句「——」改「：」
- 定价 dek 终版：「本站不荐股、不预测、不晒收益——想要这三样，请出门右转。每个开盘前只回答三个问题：今天贵不贵，市场怕不怕，这个位置在历史上排第几。三分钟人话，错了不删。」去 AI 手法 = 砍「只做一件事：把X读成Y」公式句 + 砍带引号的「天气」比喻 + 把破折号插入列表改成三个直接问句；**「错了不删」是最硬的一句，用户草稿漏了、已捞回收尾**
- EN 同步两处（docs-i18n.js）；zh/EN 双语言实测 + 按年切换回归通过、console 零错误
- 🕳️ 发现：docs-i18n.js 里 fr/de/es 是死代码（LANG_META 只暴露 zh/en，老访客回退简体）——但里面还写着 **Apache-2.0**（现为 PolyForm）和「全站免费」（现已收费），不在线上无合规风险，**待整块删除**

## 二十四、2026-07-17 凌晨：顶栏「订阅」入口上线——付费入口可发现性修复（本节最新，与前文冲突处以本节为准）

- **起因**：付费意愿样本 #2（用户朋友，微信原话）「我要不点，我都没找到付费的地方」——从卡片落地到 #pricing 的路径断裂。趁深夜零流量上线，赶在 07-17 白天流量前。
- **改动（v=20260717a）**：`.top-controls` 首位加 `<a class="topbar-sub" href="#pricing">订阅</a>` 砖红描边胶囊（日夜双套色，暗夜 #D45D4F）；`i18n.js` 新增裸「订阅」→"Subscribe" key（全站预先 grep 确认零裸「订阅」节点，无误伤）；样式全在 style.css 尾部。
- **EN 1280 踩坑与修法**：胶囊 85px 挤爆了 EN 11-tab 在 1280 的「零溢出」定案（真浏览器实测 tabsOverflow:true，live 基线 false）→ 加 `@media (min-width:900px) and (max-width:1379px)` 对非中文隐藏胶囊；≤899 顶栏换行有空间恢复显示。**验证矩阵全绿**：ZH/EN×1440、ZH×1280、ZH×390 显示且零溢出，EN×1280 隐藏且零溢出，点击 → #pricing 渲染 + #pay-btn 在场。
- **📐 量尺教训（新形态）**：headless Chrome 对 sticky+backdrop-filter 顶栏渲染失真（截图里顶栏消失），真浏览器 DOM 实测 rect top=0 完好——**顶栏类验收必须真浏览器 getBoundingClientRect，不认 headless 截图**。本地 http.server 同版本号 CSS 启发式缓存坑再次踩中（测试副本单独 bump ?v= 解决）。
- 明确不做：悬浮球/弹窗/sticky 横幅（打扰+促销感，final review 未过）。辅助入口（恐惧的标价页末尾一行文字链）留白天做。

## 二十五、2026-07-16 深夜～07-17 凌晨：恐慌日三卡 + 一卡三版契约 + 抄袭对抗审（推送线补录，本节最新）

- **图卡自解释铁律**（用户定，已进 digest-card SKILL + 卡1 母版 + make_card.sh 头注）：解释画进图、不放推文——每卡五件：结论式标题（人话）/怎么读（分行）/当日注释（绝对日期锚数据点）/历史坐标（2018-12=98·2020-03=100 冻结锚）/护身符修订版+三点位水印。验收 = 焦虑散户看完带走「怕被量出来了+排第几+不是末日」且想点进站。
- **一卡三版契约 v2**（make_card.sh 已实装实测，备份 .bak_20260717）：纯中文→券商+小红书；英文主→X+digest；纯英文（新，CN 全隐）→Reddit+LinkedIn。分发夹三子夹。发错版本=渠道错配。
- **恐慌日三卡**（07-16 数据日）：卡1 读数卡（人话层进母版：翻译头条/历史坐标/保费句，占位符每日自动）+ 卡2 双线图解读卡（「让人睡不着的尖峰，大多是 9 天的事」106.66 vs 45.86 同一周）+ 卡3 期限分层（「同一天的钱，在时间轴上劈成了两半」，logo 时间轴+四票双向+FAQ 条）。已发长桥/富途（台账 8 行）。**🔬META 双源 2× 差**：barchart UOA 量 ≈ 2× IBKR（OI 却一致，AVGO 同日两源逐字吻合=非普适），公开引用取 IBKR 保守值——发布前对账救场，已入 option-daily 校准记忆。
- **抄袭对抗审定论**（另 session 论证被驳后）：①「Git 时间戳改不了」可被将军（git 日期可伪造；改不了的是公开推送被第三方见证）→ `index.html:589` 一处两改待做（删「买不买还需要…」半句 + 「改不了」→「公开可查」+ i18n 同步）+ daily.yml 加 Wayback/OTS 锚定（机制化）；②真威胁=概念搬运非克隆代码 → IC36 商标评估提优先级；③AI 代写判读成本≈0 → 真护城河=署名人格+勘误史 → 勘误实体化（/errata）backlog 靠前；④对外警戒词：「唯一」「收入只来自订阅」「三百期」类未来时修辞。
- 付费意愿样本两个（支付方式拦一个、找不到入口一个→§24 已修）；首个陌生订阅者 HK；定位句终版=「今天贵不贵，市场怕不怕，这个位置在历史上排第几」（§23.7）。

## 二十六、2026-07-17 凌晨：接力棒四项落地——护身符两改 + 指数页辅助入口 + Wayback 锚定 + fr/de/es 整删（v=20260717b，本节最新，与前文冲突处以本节为准）

### 26.1 护身符段两改（§25 抄袭对抗审定论的落地）
- `index.html` .poem 终版：「这是温度计，不是策略。它只回答"贵还是便宜"，不回答"该不该买"。每个读数带 Git 时间戳，事前记录、公开可查。」（删「买不买还需要你自己对方向的判断」+「改不了」→「公开可查」）
- ⚠️ i18n D key = 整句中文，改原文必换 key——已同步换 key + EN 值（"recorded ex-ante, publicly verifiable"）
- 顺手 grep 全仓同款：data/README:43「而且改不了」→「公开可查」已改；data/README 顶部「事后不可改写」**判定保留**（它描述的是自家实践、与 EN "nothing is rewritten after the fact" 对仗，不是密码学声明）；llms.txt/README 无同款

### 26.2 恐惧的标价页尾辅助入口
- 面板末尾 `.poem` 同款安静样式：「这一页的读数，每个交易日盘前送进邮箱 → 盘前数据简报」链 #pricing；只说送达、不提价格、不做按钮（相邻性定案的形态解法——物理上在滚动年化图之后，靠文案与形态拉开距离）
- i18n 新增两个 D key（正文节点+链接节点分开）；预查过「盘前数据简报」无裸节点碰撞（:767 是「每日盘前数据简报」整节点，不匹配）

### 26.3 daily.yml Wayback 锚定步
- commit 后新增 `anchor to Wayback`：存当日 commit 的 GitHub 页（第三方见证提交历史状态——对「git 日期可伪造」的直接回应）+ 站首页 + kindex.json + leaps_gauge.json
- 铁律：`continue-on-error: true` + 逐条 `|| true` + `-m 60` 超时——Wayback 挂了不许影响管线与 Discord 告警（bd24343 之鉴）；YAML 已 ruby 验证
- OTS（OpenTimestamps）**未做**：proof 文件与 HEAD 的鸡生蛋问题需要设计（stamp 上一日 commit 或独立分支存 proof），且给管线加依赖有稳定性代价——挂 backlog，Wayback 先把「公开可查」做实一层
- ⚠️ 已知反驳原样记着：Wayback 站主可请求除名；所以对外话术只说「公开可查」，永不说「不可篡改」

### 26.4 docs-i18n.js fr/de/es 整删
- 死代码 244 行删净（结构化按行前缀扫描，node --check 通过）：过时的 Apache-2.0 与「全站免费」陈述随之消失；LANG_META 本就只暴露 zh/en，行为零变化
- 验证：ZH/EN 双语言 About/Pricing/恐惧标价全渲染、pay-btn 在场、顶栏订阅胶囊未被波及、console 零错误
- 📐 量尺教训 +1：headless 下懒加载图表区截图为纯空白（滚到 y=6800 一片米色）——DOM 三项证据全过时不要再跟截图较劲，本次以 javascript_exec 读 DOM 为准

### 26.5 未动清单（接力棒余项）
- 勘误实体化 /errata（backlog 靠前——定价 dek「错了不删」在它落地前是半空承诺）
- Buttondown welcome + footer「勿转发」句仍待用户后台粘贴
- IC36 商标评估（用户拍板项，概念搬运是真威胁）

### 26.6 订阅动线唯一化——表单搬家 + /check-inbox/ 快捷键（v=20260717c，2026-07-17 凌晨，接推送线补充 spec 两份）
- **Buttondown 表单从主页台账区搬进 #pricing 免费档**（ZH=index.html + EN=docs-i18n pricing body 各一份——EN 整块替换机制决定必须两份，少一份=英文用户丢免费漏斗）；Free 档补权益 li「极端读数出现的那天，一封免费邮件（由读数触发，不按日历）」（EN 同）
- **`target="_blank"` 已去掉**（券商 App webview 吞新标签→用户提交后无反馈→Unactivated 的最可能路径）；同页跳 Buttondown redirect → /check-inbox/（用户已配）
- 主页 ledger-actions 只剩「在 GitHub 验证台账」框，不补替代 CTA（观感失衡留白=spec 原话）；app.js 内注释同步改（原「订阅框就在下方 145px」已失效）
- 孤儿 CSS 清净：`.ledger-actions .ledger-sub` 两条删，`.sub-title` 两条删（全站已无使用者）；新增 `.ptier .ledger-sub { margin-top:auto }` 吸底对齐相邻卡 CTA
- **/check-inbox/ 加「打开 Gmail / 打开 QQ 邮箱」两按钮**（砖红描边、暗夜适配）——把「去邮箱确认」降为一次点击
- 验收全绿：embed-subscribe 分布 = index.html:1 / docs-i18n:1 / app.js:0；主页表单无、验证框在；ZH/EN 定价页表单+li 双在场、无 target；pay-btn 在场；console 零错误
- 漏斗口径（推送线定）：双重确认=Buttondown 强制无开关，流失属结构损耗；KPI=提交→确认率，周五起记基线；中文确认信（Standard 档）=最大付费杠杆，触发条件=确认率连续一月 <50%
