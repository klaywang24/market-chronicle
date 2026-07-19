# 数据 · Market Chronicle

这个目录是 [chronicle.klay-wang.com](https://chronicle.klay-wang.com) 的全部数据。每个交易日由管线自动提交，带 GitHub 时间戳，事后不可改写。

**Data for [chronicle.klay-wang.com](https://chronicle.klay-wang.com). Committed automatically every trading day with a GitHub timestamp; nothing is rewritten after the fact.**

---

## 许可 · License

**先说清楚哪些是我们的、哪些不是**——这个区分比许可证本身重要。

| | 是什么 | 归谁 |
|---|---|---|
| **编排、衍生计算、台账结构** | 百分位怎么算、窗口怎么定、逐日怎么记、修订怎么标 | 我们的 → **[PolyForm Noncommercial 1.0.0](../LICENSE)** |
| **原始数值** | VIX 的收盘价、股价、做空成交量…… | **不是我们的**，是各源发布的事实，各自条款照旧 |

**我们不对任何一个原始数字主张所有权**，也无权授权别人使用它们——需要商用上游数据的，请直接找上游。
能授权的只有上面第一行：[klaywang24+marketchronicle@gmail.com](mailto:klaywang24+marketchronicle@gmail.com)

- ✅ **随便用**：自己看、研究、复算、教学、写文章引用
- ❌ **不可以**：把这本账的编排与衍生计算用于商业目的（拿它做付费产品、再分发、训练用于商业变现的模型）
- 每个 JSON 文件顶部带 `_notice` 标记（管线写库时自动注入）——文件被单独拷走或热链时，这个区分跟着文件走

**The compilation, derived metrics and ledger structure are ours (PolyForm Noncommercial 1.0.0). The underlying values are facts published by the sources below, remain subject to their own terms, and we claim no ownership over them.**

---

## 这些数据从哪来 · Sources

全部来自公开免费源。**这里没有任何一个数字是私有的** —— 你完全可以从这些源头自己重算一遍，我们鼓励你这么做。

**修订政策 · Revision policy**：本站对数字只做忠实转录——按官方源当日发布的值原样入账，绝不修改。官方源日后修订数据时，台账既有行保持原样（它如实记录了「当时官方说什么」），修订以新行或备注标注，绝不悄悄覆盖历史。*Numbers enter the ledger as the sources published them that day. If a source later revises, the original row stays as recorded and the revision is annotated separately — history is never silently overwritten.*

| 来源 | 用途 |
|---|---|
| [Cboe](https://www.cboe.com/tradable_products/vix/vix_historical_data/) | VIX9D / VIX / VIX3M / VIX6M / VIX1Y / VXN / SKEW（官方日收盘）；VX 期货结算曲线；个股与板块波动率指数 |
| [FINRA](https://www.finra.org/finra-data/browse-catalog/short-sale-volume-data) | RegSHO 逐日做空成交占比；双月合并短仓 |
| [CFTC](https://publicreporting.cftc.gov/) | COT 持仓报告（Traders in Financial Futures，VIX 期货） |
| [FRED](https://fred.stlouisfed.org/) | 10 年期实际利率（DFII10）、信用利差（DBAA/DAAA） |
| CNN Fear & Greed（含第三方存档回填） | 恐贪指数与七个分量 |
| Yahoo Finance | 指数与个股价格、基本面快照 |
| [multpl.com](https://www.multpl.com/) / Robert Shiller | 标普 500 PE(TTM)、CAPE 长史 |
| [Wikipedia](https://en.wikipedia.org/wiki/List_of_S%26P_500_companies) | 标普 500 / 纳斯达克 100 成分股名单 |
| macrotrends | 个股基本面长史 |
| NAAIM | 主动管理人仓位（周频） |

各源对自己数据的条款不尽相同（有的明确限制再分发）。我们的做法是：**只发衍生统计与位置读数，不做原始文件的整表镜像，并逐图署名出处**——站上每张图下方那行「数据截至 X · 来源 · 更新频率」就是这条规矩的执行。发现我们哪里越界了，写信来，我们改。

## 那护城河是什么 · Then what's the moat

**不是数据。是这本账。**

- 你今天可以把这个目录整个下载走 —— 拿到的是**一张快照**。明天还得再下一次。
- 而你**无法证明自己没有编** —— 因为证明在这个仓库的 [commit 历史](https://github.com/klaywang24/market-chronicle/commits/main)里。
- **一份被复制的时间戳台账，没有时间戳。**

我们卖的从来不是数字，是「这个数字是那天记下的，公开可查」。

**A copy of a timestamped ledger has no timestamps. That's the whole point.**

---

## 引用 · Citation

```
Market Chronicle (美股编年史), KAPX Index / Fear's Price Tag.
https://chronicle.klay-wang.com · retrieved YYYY-MM-DD
```

镜像数据集：Kaggle · Hugging Face（同源，随本仓库刷新）。

## 主要文件 · Key files

| 文件 | 内容 |
|---|---|
| `kindex.json` | K 指数（KAPX = CNN 恐贪 ÷ VIX）逐日读数 |
| `kindex_signals.json` | K < 1 的逐次信号台账（2011 至今，含赢的和输的） |
| `leaps_gauge.json` | 恐惧的标价指数（VIX1Y 三年滚动百分位）+ 四项 context |
| `sentiment.json` | 情绪仪表盘：Put/Call、VXN 溢价、SKEW、期限结构、恐贪七分量 |
| `pulse.json` | 头版当日读数（市场温度等） |
| `breadth.json` | 市场广度（标普成分股在 200 日均线上的占比） |
| `meta.json` | 数据 as-of 日期与数据源署名 |

其余按面板命名（`spy_*` / `qqq_*` / `tech_*` / `fin_*` / `consumer_*` / `luxury_*`）。

---

## 口径与如实披露 · Method & disclosures

完整口径、每个指标的定义、以及**已知的局限与失效**，全在站上的[方法论页](https://chronicle.klay-wang.com/#methodology)。包括：

- **两段式诚实分段**：上线（2026 年 7 月）起的读数是 Git 事前记录；2011→2026-06 的历史台账是公开数据回填、可独立复现、**非事前**。
- **KAPX 对前向收益无预测力** —— 我们自己测的，结果公开发表在方法论页上。K 策略 15 年净值 ×3.96，同期一直持有纳指 ×13.02。**本站不宣称信号能跑赢买入持有。**
- 管线偶尔会因技术故障漏跑：发生时读数于修复后补录，Git 历史里能清楚看到哪天是当日提交、哪天是补录，**我们不抹平这个差别**。

**描述性数据，非投资建议，不预测方向。**

---

## 出处与验证 · Provenance & verification

本目录的数据每交易日重算并提交。**「它确实是那天记的」这件事，不要求你相信我们——它可以被你自己验证。**

### 三层证据

| 层 | 机制 | 它证明什么 | 它不证明什么 |
|---|---|---|---|
| ① 每日自核 | `scripts/verify_ledger.py` → `ledger_audit.json` | 已发布过的值没有被悄悄改写；分歧逐条公开 | 不证明数据当时就存在 |
| ② 哈希链 | `scripts/anchor_hashes.py` → `ledger_hashes.jsonl` | **删掉或改动任何一天，其后所有链值全部对不上** | 链自洽 ≠ 那天就存在（链本身也可整体重造） |
| ③ 第三方存档 | 每日把 commit 页与本链文件存入 Wayback Machine | **「那天就存在」——独立于我们的见证** | — |

**三层必须一起看。** 单独任何一层都有绕过的方式：自核可以只审自己想审的、哈希链可以整体重造、
git 提交日期本地可伪造（`git commit --date=` 一行的事）。**真正改不了的是第三层：公开推送后被第三方存档下来的社会事实。**

### 为什么是「链」，不是每天存一个哈希

独立的每日哈希挡不住**事后偷偷删掉难看的那几天**——删完之后，剩下的哈希照样全部验证通过。

哈希链把每天绑在前一天上：

```
chain_n = sha256( chain_{n-1} + 当日各文件 sha256 的规范化 JSON )
```

于是**删除变成可检测的**：少任何一天，其后每一行的 `chain` 都对不上。

### 你可以怎么验（三步，不需要信任我们）

```bash
# ① 全链自洽
python3 scripts/anchor_hashes.py --verify

# ② 任一天的数据 → 算哈希 → 应能在该日那行的 files 里找到
shasum -a 256 data/leaps_gauge.json

# ③ 独立见证：把链文件的历史快照从 Wayback 取出，与仓库里的逐行比对
#    https://web.archive.org/web/*/chronicle.klay-wang.com/data/ledger_hashes.jsonl
```

第 ③ 步是关键：**Wayback 的快照不在我们控制之下。** 若某天的链值在 Wayback 的旧快照里已经存在，
就说明那一天的数据在那时已经定型。

### 口径与边界（写在前面，免得你事后才发现）

- **链始于 2026-07-19**，并在同日做了一次**创世快照**（`kind:"genesis_snapshot"`，覆盖当时全部 384 个 JSON）。
  该记录自带两栏说明：它 **证明**「自本记录被公开锚定之时起，对这些文件的任何改动都可被检测」；
  它 **不证明**「这些值在此日之前是什么」——事后生成的哈希无法回溯证明历史。
  早于本记录的数据，其可信度依赖 git 历史与 Wayback，不依赖本快照。
- **⚠️ 证据分层，别把 git 日期当第三方见证**：`git commit --date=` 与 `GIT_COMMITTER_DATE` 本地皆可伪造；
  GitHub 的 **push 事件**时间戳由服务端记录、仓库主人改不了，但 **Events API 分页硬上限约 300 条**——
  按本仓库的提交频率**只够回溯约 20 天**（2026-07-19 实测：247 条事件仅覆盖 16 天，第 4 页返回 HTTP 422）。
  ∴ push 事件「强但短命」，做不了十年尺度的证据；**长期效力仍只能靠 Wayback 这类独立存档**。
- **锚定可能失败且不阻塞管线**（`continue-on-error` 是故意的）。为免「锚丢了没人知道」，
  每日锚定结果逐条记入 `data/anchor_log.jsonl`；全部失败时 workflow 发 warning。
  **要回答「哪些天有独立见证」，查那个文件，不要假定每天都有。**
- 链覆盖的文件见 `anchor_hashes.py` 的 `TRACKED`。**加新文件只往后加，绝不改既有条目口径**——
  改口径 = 另起新链。
- **本机制证明的是「没被改过」，不是「数字是对的」。** 上游源自身的修订、我们取数当时的错误，
  都由 ①自核 与公开勘误负责，不由哈希链负责。
