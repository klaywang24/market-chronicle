# 美股编年史 · 项目总结与交接文档

> 本文档面向未来的维护者（包括未来的我和任何 AI 助手）。
> 读完本文即可独立维护、修改、扩展本站的一切。
> 最后更新：2026-07-04。

- **线上地址**：<https://klaywang24.github.io/market-chronicle/>
- **仓库**：<https://github.com/klaywang24/market-chronicle>（public）
- **本地目录**：`/Users/klay/Desktop/market-chronicle/`

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
