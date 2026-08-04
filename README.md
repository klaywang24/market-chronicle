# Market Chronicle · 美股编年史

> A self-updating chronicle of the U.S. stock market: a century of the S&P 500,
> half a century of the Nasdaq, full dossiers on 22 sector leaders, and two
> home-grown market indicators (KAPX Index & LEAPS Window) — packaged as an
> editorial-style static site. **No server, no build step, zero running cost.**

[![daily-update](https://github.com/klaywang24/market-chronicle/actions/workflows/daily.yml/badge.svg)](https://github.com/klaywang24/market-chronicle/actions/workflows/daily.yml)
[![weekly-fundamentals](https://github.com/klaywang24/market-chronicle/actions/workflows/weekly.yml/badge.svg)](https://github.com/klaywang24/market-chronicle/actions/workflows/weekly.yml)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21783004.svg)](https://doi.org/10.5281/zenodo.21783004)
[![License](https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-4a5d3a)](LICENSE)
[![Live](https://img.shields.io/badge/live-klaywang24.github.io-a0392f)](https://klaywang24.github.io/market-chronicle/)
[![中文](https://img.shields.io/badge/%E4%B8%AD%E6%96%87-README-2b5f8f)](README.zh.md)

**Live: <https://klaywang24.github.io/market-chronicle/>**

> **Canonical definition:** The KAPX Index is a daily U.S. equity fear-pricing gauge published by Market Chronicle, computed as the CNN Fear & Greed reading divided by the VIX. The K stands for kǒng (恐), the Chinese character for fear; readings, methodology, and the complete signal ledger are permanently free: an ex-ante daily record since launch (July 2026), reproducible public-data backfill before that; each day's ledger hash chain is pushed publicly and witnessed by independent archives. *(Formerly cited in English as the K-Index; the Chinese name K 指数 is unchanged.)*

## What it is

Seven tabs, each organized as numbered chapters with a floating table of contents:

| Tab | Contents |
|---|---|
| **S&P 500** | 14 chapters: century chart · annual returns & distribution · holding-period win rates · rolling 5/10/20y · bull/bear cycles · left-tail lens · drawdown anatomy · CAPE (1871→) & PE(TTM) · **valuation elasticity** (three historical median anchors + current percentile) · EPS · VIX as an insurance ledger · seasonality · sector structure · all 503 constituents |
| **Nasdaq** | 12 chapters: Composite 1971→ × NDX 1985→, same system + VXN |
| **Financials** | XLF anchor + 13 leaders (banks / card networks / i-banks / asset mgmt / brokers / crypto & stablecoins), drill-down per stock |
| **Consumer** | XLP × XLY dual anchor + 6 cycle-proof leaders |
| **Luxury** | LVMH · Hermès · Ferrari |
| **KAPX Index** | K = CNN Fear&Greed ÷ VIX; K < 1 marks extreme-fear signals — 39 signals since 2011, each audited at 20/40/60-day horizons (26/13 at 60 days; all positive held to date) |
| **LEAPS Window** | CNN F&G < 25 = extreme fear = LEAPS-call entry watch window; all 45 windows since 2011 audited at 6/12/18-month horizons |

Each of the 22 stock pages carries up to 11 chapters — price history, returns,
drawdowns, a key-metrics dashboard, 20 years of quarterly EPS / PE / ROE / ROIC,
valuation-vs-EPS return decomposition, dividend history since 1984, and peer
comparison. **Chapters self-prune when data is unavailable — no empty charts,
no fabricated numbers.**

## Architecture

```
GitHub Actions (daily 22:00 UTC / weekly Sat 08:00 UTC)
      │
      ▼
Python pipelines → fetch public data → compute → write data/*.json → commit
      │
      ▼
Static frontend (vanilla JS + ECharts 5 CDN, no framework, no build)
      │
      ▼
GitHub Pages auto-deploy
```

Hash-routed deep links (`#fin/jpm`), day/night themes, parchment-editorial
design system (Fraunces × Noto Serif SC × JetBrains Mono).

## Data sources

Yahoo Finance (prices, statements, dividends) · CNN Fear & Greed via the
[whit3rabbit archive](https://github.com/whit3rabbit/fear-greed-data) ·
multpl.com (CAPE / PE / EPS since 1871) · macrotrends.net (20y quarterly stock
fundamentals; ADRs for EU names) · Wikipedia (constituents) · parqet (logos).
Metrics without a reliable free source are left blank and labeled — never faked.

## Run locally

```bash
git clone https://github.com/klaywang24/market-chronicle.git
cd market-chronicle
python3 -m venv .venv && source .venv/bin/activate
pip install yfinance pandas requests lxml
python scripts/build_data.py          # daily datasets (~3 min)
python scripts/build_fundamentals.py  # fundamentals (~1 h, rate-limited)
python3 -m http.server 8137           # open http://localhost:8137
```

## Credits

Static-JSON architecture inspired by [Big Picture](https://laoqianritan-create.github.io/us-market/).

## Disclaimer

Personal research tool. All data from public sources, may contain errors or
delays. Signal back-tests are reported faithfully, including failures.
**Past patterns do not guarantee future results. Nothing here is investment advice.**

## License

[PolyForm Noncommercial 1.0.0](LICENSE). You are free to use, fork, and modify
this project for any **noncommercial** purpose — personal use, research,
education. Commercial use (selling it, bundling it into a paid product or
service, running it as a commercial offering) is not permitted without a
separate license from the author. Data remains the property of its respective
sources.

> Required Notice: Copyright Klay Wang (https://chronicle.klay-wang.com)

## 🔴 改 js/app.js 或图表配置后必跑（2026-08-02 起）

```bash
python3 tools/check_chart_overflow.py
```

自带临时 http server，直接跑即可。它遍历首页十个面板 84 张图，查两件事：
① `inst.getWidth()` 是否等于容器 `clientWidth`（因）② 各 series 末点是否落在绘图区内（果）。

**已挂进 `daily.yml`**（在 `commit data` 之前），所以每天自动跑一次；本地改动时手动跑一次能更早发现。

**背景**：2026-08-02 全站图表画到绘图区外面，根因是 ECharts 记的容器宽度是旧的
（`getWidth()`=1086 而 `clientWidth`=867）。站上原有的两处 resize（切面板后、`window.resize`）
都是**在某个时刻主动调一次**，治不了那个时刻之后发生的布局变化。已改为 `ResizeObserver`
由尺寸变化驱动（见 `app.js` 的 `observeSize`），外加 `visibilitychange` 兜底。

⚠️ **别在 Claude 预览标签里验证这类问题**：那里 `visibilityState` 是 `hidden`，
`requestAnimationFrame` 与 `ResizeObserver` 回调被浏览器整体暂停，会得到「修复没生效」的假结论。
