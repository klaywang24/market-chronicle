# 数据 · Market Chronicle

这个目录是 [chronicle.klay-wang.com](https://chronicle.klay-wang.com) 的全部数据。每个交易日由管线自动提交，带 GitHub 时间戳，事后不可改写。

**Data for [chronicle.klay-wang.com](https://chronicle.klay-wang.com). Committed automatically every trading day with a GitHub timestamp; nothing is rewritten after the fact.**

---

## 许可 · License

**[PolyForm Noncommercial 1.0.0](../LICENSE)**

- ✅ **随便用**：自己看、研究、复算、教学、写文章引用
- ❌ **不可以**：用于任何商业目的（包括拿它做付费产品、再分发、训练用于商业变现的模型）
- 商业授权：[klaywang24+marketchronicle@gmail.com](mailto:klaywang24+marketchronicle@gmail.com)
- 每个 JSON 文件顶部带 `_notice` 许可标记（管线写库时自动注入）——文件被单独拷走或热链时，声明跟着文件走

**Noncommercial use is free. Commercial use requires a license — contact the address above.**

---

## 这些数据从哪来 · Sources

全部来自公开免费源。**这里没有任何一个数字是私有的** —— 你完全可以从这些源头自己重算一遍，我们鼓励你这么做。

**修订政策 · Revision policy**：本站对数字只做忠实转录——按官方源当日发布的值原样入账，绝不修改。官方源日后修订数据时，台账既有行保持原样（它如实记录了「当时官方说什么」），修订以新行或备注标注，绝不悄悄覆盖历史。*Numbers enter the ledger as the sources published them that day. If a source later revises, the original row stays as recorded and the revision is annotated separately — history is never silently overwritten.*

| 来源 | 用途 |
|---|---|
| [Cboe](https://www.cboe.com/tradable_products/vix/vix_historical_data/) | VIX9D / VIX / VIX3M / VIX6M / VIX1Y / VXN / SKEW（官方日收盘） |
| CNN Fear & Greed（第三方存档） | 恐贪指数与七个分量 |
| [FRED](https://fred.stlouisfed.org/) | 10 年期实际利率（DFII10）、信用利差（DBAA/DAAA） |
| Yahoo Finance | 指数与个股价格 |
| [multpl.com](https://www.multpl.com/) | 标普 500 PE(TTM) 长史 |
| NAAIM | 主动管理人仓位（周频） |

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
