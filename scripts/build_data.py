#!/usr/bin/env python3
"""美股编年史 · 数据管线
拉取公开数据 → 计算指标 → 写出 data/*.json（前端只读这些静态文件）。

数据源：
- 价格/指数：yfinance（^GSPC ^IXIC ^NDX ^VIX ^VXN）
- CNN 恐贪指数：whit3rabbit/fear-greed-data 每日存档（2011→）+ CNN 官方接口（当天值）
- 席勒 CAPE：multpl.com 月度表
"""
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}

FNG_ARCHIVE = "https://raw.githubusercontent.com/whit3rabbit/fear-greed-data/main/fear-greed.csv"
FNG_LIVE = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
MULTPL_CAPE = "https://www.multpl.com/shiller-pe/table/by-month"


def write_json(name: str, obj):
    path = DATA / name
    # 拉失败时上游函数会抛异常走到不了这里，留旧文件不覆盖
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    print(f"  wrote {name} ({path.stat().st_size/1024:.0f} KB)")


def fetch_history(ticker: str, retries: int = 3) -> pd.DataFrame:
    for i in range(retries):
        try:
            df = yf.Ticker(ticker).history(period="max", auto_adjust=True)
            if len(df) > 100:
                df.index = df.index.tz_localize(None)
                return df
        except Exception as e:
            print(f"  {ticker} attempt {i+1} failed: {e}")
        time.sleep(3 * (i + 1))
    raise RuntimeError(f"failed to fetch {ticker}")


def dates(idx) -> list:
    return [d.strftime("%Y-%m-%d") for d in idx]


def rnd(s, n=2) -> list:
    return [None if pd.isna(v) else round(float(v), n) for v in s]


# ---------------------------------------------------------------- K 指数

def fetch_fng():
    """CNN 恐贪：whit3rabbit 存档（2011→）+ 官方接口当天值。返回 (Series, rating)。"""
    csv = requests.get(FNG_ARCHIVE, headers=UA, timeout=30)
    csv.raise_for_status()
    from io import StringIO
    fng = pd.read_csv(StringIO(csv.text), parse_dates=["Date"]).set_index("Date")["Fear Greed"]
    live_note = ""
    try:
        live = requests.get(FNG_LIVE, headers=UA, timeout=30).json()["fear_and_greed"]
        ts = pd.Timestamp(live["timestamp"][:10])
        fng.loc[ts] = float(live["score"])
        live_note = live["rating"]
    except Exception as e:
        print(f"  CNN live endpoint unavailable, archive only: {e}")
    return fng[~fng.index.duplicated(keep="last")].sort_index(), live_note


def build_kindex(ndx_close: pd.Series, vix_close: pd.Series):
    print("== K 指数")
    fng, live_note = fetch_fng()
    df = pd.DataFrame({"cnn": fng, "vix": vix_close, "ndx": ndx_close}).dropna()
    df = df[df.index >= "2019-06-01"]  # 多留半年做图表前置缓冲
    df["k"] = df["cnn"] / df["vix"]

    # K<1 信号分段：连续 K<1 的交易日聚成一个 episode，间隔 >10 个交易日算新信号
    below = df["k"] < 1
    episodes = []
    cur = None
    last_below_pos = None
    for pos, (dt, b) in enumerate(zip(df.index, below)):
        if b:
            if cur is None or (last_below_pos is not None and pos - last_below_pos > 10):
                if cur:
                    episodes.append(cur)
                cur = {"start": dt, "end": dt, "start_pos": pos, "min_k": df["k"].iloc[pos]}
            cur["end"] = dt
            cur["min_k"] = min(cur["min_k"], df["k"].iloc[pos])
            last_below_pos = pos
    if cur:
        episodes.append(cur)

    closes = df["ndx"]
    sig_rows = []
    for ep in episodes:
        if ep["start"] < pd.Timestamp("2020-01-01"):
            continue
        p0 = ep["start_pos"]
        entry = closes.iloc[p0]
        row = {
            "start": ep["start"].strftime("%Y-%m-%d"),
            "end": ep["end"].strftime("%Y-%m-%d"),
            "days_below": int(((df.index >= ep["start"]) & (df.index <= ep["end"]) & below).sum()),
            "min_k": round(float(ep["min_k"]), 3),
            "ndx_entry": round(float(entry), 2),
        }
        for horizon in (20, 40, 60):
            p = p0 + horizon
            row[f"fwd{horizon}"] = round(float(closes.iloc[p] / entry - 1) * 100, 2) if p < len(closes) else None
        # 至今收益（最后一个信号用）
        row["fwd_to_date"] = round(float(closes.iloc[-1] / entry - 1) * 100, 2)
        sig_rows.append(row)

    write_json("kindex.json", {
        "dates": dates(df.index),
        "cnn": rnd(df["cnn"], 1),
        "vix": rnd(df["vix"], 2),
        "ndx": rnd(df["ndx"], 2),
        "k": rnd(df["k"], 3),
        "current": {
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "cnn": round(float(df["cnn"].iloc[-1]), 1),
            "vix": round(float(df["vix"].iloc[-1]), 2),
            "k": round(float(df["k"].iloc[-1]), 3),
            "rating": live_note,
        },
    })
    write_json("kindex_signals.json", {"signals": sig_rows, "since": "2020-01-01"})
    return sig_rows


# ------------------------------------------------------- 指数通用面板

def drawdown_episodes(close: pd.Series, threshold=-0.10):
    """从日线收盘价提取回撤 episode（峰值→谷底→修复）。"""
    cummax = close.cummax()
    dd = close / cummax - 1
    episodes = []
    in_dd = False
    peak_date = trough_date = None
    trough = 0.0
    for dt, v in dd.items():
        if not in_dd and v < 0:
            in_dd = True
            peak_date = close.loc[:dt].idxmax() if False else None  # set below
            # 峰值 = 此刻 cummax 对应的最近日期
            peak_date = close[close == cummax.loc[dt]].index[-1]
            trough, trough_date = v, dt
        elif in_dd:
            if v < trough:
                trough, trough_date = v, dt
            if v == 0:
                if trough <= threshold:
                    episodes.append({
                        "peak": peak_date.strftime("%Y-%m-%d"),
                        "trough": trough_date.strftime("%Y-%m-%d"),
                        "recovery": dt.strftime("%Y-%m-%d"),
                        "depth": round(trough * 100, 1),
                        "days_down": int((trough_date - peak_date).days),
                        "days_recover": int((dt - trough_date).days),
                    })
                in_dd = False
    if in_dd and trough <= threshold:
        episodes.append({
            "peak": peak_date.strftime("%Y-%m-%d"),
            "trough": trough_date.strftime("%Y-%m-%d"),
            "recovery": None,
            "depth": round(trough * 100, 1),
            "days_down": int((trough_date - peak_date).days),
            "days_recover": None,
        })
    return dd, episodes


def build_index_panels(prefix: str, close: pd.Series, vol_index: pd.Series | None = None,
                       vol_name: str = ""):
    """一个指数板块的全部面板数据。close 为日线收盘。"""
    print(f"== {prefix}")
    close = close.dropna()

    # 月线（世纪图）
    monthly = close.resample("ME").last()
    write_json(f"{prefix}_century.json", {"dates": dates(monthly.index), "close": rnd(monthly, 2)})

    # 年度回报 + 分桶
    annual = close.resample("YE").last().pct_change().dropna() * 100
    # 首年用年内首尾补（yfinance 首年不完整就跳过）
    write_json(f"{prefix}_annual.json", {
        "years": [d.year for d in annual.index],
        "returns": rnd(annual, 2),
    })

    # 回撤
    dd, episodes = drawdown_episodes(close)
    weekly_dd = dd.resample("W").min()
    write_json(f"{prefix}_drawdowns.json", {
        "dates": dates(weekly_dd.index),
        "dd": rnd(weekly_dd * 100, 2),
        "episodes": sorted(episodes, key=lambda e: e["depth"])[:25],
    })

    # 年内最大回撤 vs 年度收益
    rows = []
    for year, grp in close.groupby(close.index.year):
        if len(grp) < 60:
            continue
        intra = (grp / grp.cummax() - 1).min() * 100
        ret = (grp.iloc[-1] / grp.iloc[0] - 1) * 100
        rows.append({"year": int(year), "intra_dd": round(float(intra), 1), "ret": round(float(ret), 1)})
    write_json(f"{prefix}_intrayear.json", {"rows": rows})

    # 滚动 5 年年化（月频）
    m = monthly.dropna()
    roll5 = (m / m.shift(60)) ** (1 / 5) - 1
    roll5 = (roll5.dropna()) * 100
    write_json(f"{prefix}_rolling5y.json", {"dates": dates(roll5.index), "cagr": rnd(roll5, 2)})

    # 波动率（20 日 / 60 日年化）+ 恐慌指数
    ret_d = close.pct_change()
    vol20 = ret_d.rolling(20).std() * (252 ** 0.5) * 100
    vol60 = ret_d.rolling(60).std() * (252 ** 0.5) * 100
    vol_m = vol20.resample("W").last().dropna()
    out = {"dates": dates(vol_m.index), "vol20": rnd(vol_m, 2),
           "vol60": rnd(vol60.resample("W").last().reindex(vol_m.index), 2),
           "vol_index_name": vol_name}
    if vol_index is not None:
        vi = vol_index.resample("W").last().reindex(vol_m.index)
        out["vol_index"] = rnd(vi, 2)
    write_json(f"{prefix}_volatility.json", out)

    # 月度季节性
    mret = monthly.pct_change().dropna() * 100
    season = []
    for month in range(1, 13):
        sub = mret[mret.index.month == month]
        season.append({
            "month": month,
            "avg": round(float(sub.mean()), 2),
            "win": round(float((sub > 0).mean() * 100), 1),
        })
    write_json(f"{prefix}_seasonality.json", {"rows": season, "years": f"{monthly.index[0].year}–{monthly.index[-1].year}"})


# ---------------------------------------------------------------- 宏观（FRED）

def _fred(series_id: str, start: str = "2000-01-01") -> pd.Series:
    """FRED fredgraph.csv 免费接口，无需 API key。
    注意：部分地区/代理网络无法直连 FRED，本函数在 GitHub Actions（美国机房）稳定可用。"""
    from io import StringIO
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    r = None
    for attempt in range(3):
        try:
            r = requests.get(url, headers=UA, timeout=60)
            r.raise_for_status()
            break
        except Exception:
            if attempt == 2:
                raise
            time.sleep(5 * (attempt + 1))
    df = pd.read_csv(StringIO(r.text))
    df.columns = ["d", "v"]
    df["v"] = pd.to_numeric(df["v"], errors="coerce")
    df = df.dropna()
    df = df[df["d"] >= start]
    s = pd.Series(df["v"].values, index=pd.to_datetime(df["d"]))
    return s


def _weekly(s: pd.Series, nd: int = 2):
    w = s.resample("W").last().dropna()
    return {"dates": dates(w.index), "values": rnd(w, nd)}


def _yoy(s: pd.Series, nd: int = 2):
    y = (s.pct_change(12).dropna()) * 100
    return {"dates": dates(y.index), "values": rnd(y, nd)}


def build_macro():
    """资金面 / 信用 / 物价 / 增长与就业。全部 FRED 公开序列，2000 年起。"""
    print("== 宏观（FRED）")
    out = {}
    fetch_plan = {
        # 资金面
        "sofr": ("SOFR", lambda s: _weekly(s)),
        "effr": ("EFFR", lambda s: _weekly(s)),
        "target": ("DFEDTARU", lambda s: _weekly(s)),
        "rrp": ("RRPONTSYD", lambda s: _weekly(s, 1)),          # 十亿美元
        "walcl": ("WALCL", lambda s: _weekly(s / 1e6, 3)),      # 百万→万亿美元
        # 信用 / 利率
        "dgs2": ("DGS2", lambda s: _weekly(s)),
        "dgs10": ("DGS10", lambda s: _weekly(s)),
        "dgs20": ("DGS20", lambda s: _weekly(s)),
        "dgs30": ("DGS30", lambda s: _weekly(s)),
        "t10y2y": ("T10Y2Y", lambda s: _weekly(s)),
        "hy_oas": ("BAMLH0A0HYM2", lambda s: _weekly(s)),
        "ig_oas": ("BAMLC0A0CM", lambda s: _weekly(s)),
        # 物价（同比）
        "cpi_yoy": ("CPIAUCSL", _yoy),
        "core_pce_yoy": ("PCEPILFE", _yoy),
        "ppi_yoy": ("PPIACO", _yoy),
        # 增长与就业
        "unrate": ("UNRATE", lambda s: {"dates": dates(s.index), "values": rnd(s, 1)}),
        "nfp": ("PAYEMS", lambda s: (lambda d: {"dates": dates(d.index), "values": rnd(d, 0)})(s.diff().dropna())),  # 千人/月
        "gdp_qoq": ("GDPC1", lambda s: (lambda g: {"dates": dates(g.index), "values": rnd(g, 1)})(((s / s.shift(1)) ** 4 - 1).dropna() * 100)),
        "cp_yoy": ("CP", lambda s: (lambda y: {"dates": dates(y.index), "values": rnd(y, 1)})((s.pct_change(4).dropna()) * 100)),  # 季频
    }
    for key, (sid, f) in fetch_plan.items():
        try:
            out[key] = f(_fred(sid))
        except Exception as e:
            print(f"  {sid} failed (kept old if any): {e}")
        time.sleep(0.6)
    if out:
        write_json("macro.json", out)


# ---------------------------------------------------------------- LEAPS 窗口

def build_leaps(spx_close: pd.Series, ndx_close: pd.Series, threshold: float = 25.0):
    """CNN 恐贪 < 25 = 极端恐惧 = LEAPS call 开仓观察窗口。
    对 2011 年以来每个窗口计算 SPX/NDX 之后 6/12/18 个月（126/252/378 交易日）收益。"""
    print("== LEAPS 窗口")
    fng, live_note = fetch_fng()
    df = pd.DataFrame({"fng": fng, "spx": spx_close, "ndx": ndx_close}).dropna()

    below = df["fng"] < threshold
    episodes = []
    cur = None
    last_pos = None
    for pos, (dt, b) in enumerate(zip(df.index, below)):
        if b:
            if cur is None or pos - last_pos > 10:
                if cur:
                    episodes.append(cur)
                cur = {"start": dt, "start_pos": pos, "end": dt, "min": df["fng"].iloc[pos]}
            cur["end"] = dt
            cur["min"] = min(cur["min"], float(df["fng"].iloc[pos]))
            last_pos = pos
    if cur:
        episodes.append(cur)

    rows = []
    for ep in episodes:
        p0 = ep["start_pos"]
        row = {
            "start": ep["start"].strftime("%Y-%m-%d"),
            "end": ep["end"].strftime("%Y-%m-%d"),
            "days_below": int(((df.index >= ep["start"]) & (df.index <= ep["end"]) & below).sum()),
            "min_fng": round(ep["min"], 1),
        }
        for label, horizon in (("m6", 126), ("m12", 252), ("m18", 378)):
            p = p0 + horizon
            for idx in ("spx", "ndx"):
                entry = df[idx].iloc[p0]
                row[f"{idx}_{label}"] = round(float(df[idx].iloc[p] / entry - 1) * 100, 1) if p < len(df) else None
        row["spx_to_date"] = round(float(df["spx"].iloc[-1] / df["spx"].iloc[p0] - 1) * 100, 1)
        row["ndx_to_date"] = round(float(df["ndx"].iloc[-1] / df["ndx"].iloc[p0] - 1) * 100, 1)
        rows.append(row)

    write_json("leaps.json", {
        "threshold": threshold,
        "dates": dates(df.index),
        "fng": rnd(df["fng"], 1),
        "ndx": rnd(df["ndx"], 2),
        "current": {
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "fng": round(float(df["fng"].iloc[-1]), 1),
            "rating": live_note,
            "window_open": bool(df["fng"].iloc[-1] < threshold),
        },
        "episodes": rows,
    })


def build_index_val():
    """SPY/QQQ ETF 口径的估值快照（yfinance；指数级 Forward PE 无免费长史，只取当前值）。"""
    print("== 指数估值快照")
    out = {}
    for etf in ("SPY", "QQQ"):
        try:
            info = yf.Ticker(etf).info
            out[etf] = {"trailing_pe": info.get("trailingPE"), "forward_pe": info.get("forwardPE")}
        except Exception as e:
            print(f"  {etf} info: {e}")
    write_json("index_val.json", out)


# ------------------------------------------------- 指数扩容章节（SPY/QQQ 专用）

def build_index_extras(prefix: str, close: pd.Series):
    """收益分布 / 持有期胜率 / 滚动年化矩阵 / 牛熊周期 / 左尾放大镜。"""
    print(f"== extras {prefix}")
    close = close.dropna()

    # 收益分布：年度回报分桶（每桶列出年份，前端 tooltip 展示）
    annual = close.resample("YE").last().pct_change().dropna() * 100
    buckets = [(-100, -30), (-30, -20), (-20, -10), (-10, 0),
               (0, 10), (10, 20), (20, 30), (30, 200)]
    dist = []
    for lo, hi in buckets:
        yrs = sorted(int(d.year) for d, v in annual.items() if lo <= v < hi)
        label = (f"<{-30}%" if lo == -100 else f">{30}%" if hi == 200 else f"{lo}~{hi}%")
        dist.append({"label": label, "count": len(yrs), "years": yrs})
    write_json(f"{prefix}_distribution.json", {"buckets": dist, "years_total": len(annual)})

    # 入场与离场：持有 1/3/5/10/20 年（月频滚动）的胜率与年化分位
    m = close.resample("ME").last().dropna()
    hp = []
    for y in (1, 3, 5, 10, 20):
        r = ((m / m.shift(12 * y)) ** (1 / y) - 1).dropna() * 100
        if len(r) < 24:
            continue
        hp.append({
            "years": y,
            "win": round(float((r > 0).mean() * 100), 1),
            "median": round(float(r.median()), 1),
            "worst": round(float(r.min()), 1),
            "best": round(float(r.max()), 1),
            "samples": int(len(r)),
        })
    write_json(f"{prefix}_holding.json", {"rows": hp})

    # 滚动年化矩阵：5 / 10 / 20 年（月频）
    out = {"dates": dates(m.index)}
    for y in (5, 10, 20):
        r = ((m / m.shift(12 * y)) ** (1 / y) - 1) * 100
        out[f"cagr{y}"] = rnd(r, 2)
    write_json(f"{prefix}_rollmatrix.json", out)

    # 牛熊周期：标准 zigzag，跌 20% 确认熊、涨 25% 确认牛（对称：跌20%需涨25%回本）
    pivots = []  # 相邻牛熊阶段之间的极值点 (日期, 价格)
    hi, hi_d = float(close.iloc[0]), close.index[0]
    lo, lo_d = float(close.iloc[0]), close.index[0]
    direction = 0  # 1 牛 / -1 熊 / 0 未定
    for dt, v in close.items():
        v = float(v)
        if direction >= 0 and v > hi:
            hi, hi_d = v, dt
        if direction <= 0 and v < lo:
            lo, lo_d = v, dt
        if direction >= 0 and v < hi * 0.8:
            pivots.append((hi_d, hi))
            direction, lo, lo_d = -1, v, dt
        elif direction <= 0 and v > lo * 1.25:
            pivots.append((lo_d, lo))
            direction, hi, hi_d = 1, v, dt
    cycles = []
    prev_d, prev_p = close.index[0], float(close.iloc[0])
    for d, px in pivots:
        if d <= prev_d:
            continue
        ret = (px / prev_p - 1) * 100
        cycles.append({"kind": "bull" if ret > 0 else "bear",
                       "start": prev_d.strftime("%Y-%m-%d"), "end": d.strftime("%Y-%m-%d"),
                       "ret": round(ret, 1), "days": int((d - prev_d).days)})
        prev_d, prev_p = d, px
    ret = (float(close.iloc[-1]) / prev_p - 1) * 100
    cycles.append({"kind": "bull" if ret > 0 else "bear",
                   "start": prev_d.strftime("%Y-%m-%d"), "end": None,
                   "ret": round(ret, 1), "days": int((close.index[-1] - prev_d).days)})
    write_json(f"{prefix}_bullbear.json", {"cycles": cycles})

    # 左尾放大镜：最差/最好单日 + 日收益分布
    d = close.pct_change().dropna() * 100
    def top(series, n=12):
        return [{"date": dt.strftime("%Y-%m-%d"), "ret": round(float(v), 2)}
                for dt, v in series.items()]
    hist_edges = [(-100, -5), (-5, -3), (-3, -2), (-2, -1), (-1, 0),
                  (0, 1), (1, 2), (2, 3), (3, 5), (5, 100)]
    hist = [{"label": (f"<-5%" if lo == -100 else f">5%" if hi == 100 else f"{lo}~{hi}%"),
             "count": int(((d >= lo) & (d < hi)).sum())} for lo, hi in hist_edges]
    write_json(f"{prefix}_extremes.json", {
        "worst": top(d.nsmallest(12)), "best": top(d.nlargest(12)),
        "hist": hist, "days_total": int(len(d)),
    })


def build_constituents():
    """成分股（Wikipedia）：标普 500 与纳指 100，含 GICS 行业分布。"""
    print("== constituents")
    from io import StringIO
    try:
        html = requests.get("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
                            headers=UA, timeout=30).text
        t = pd.read_html(StringIO(html))[0]
        rows = [{"ticker": r["Symbol"], "name": r["Security"], "sector": r["GICS Sector"],
                 "sub": r["GICS Sub-Industry"], "added": str(r.get("Date added", ""))[:10]}
                for _, r in t.iterrows()]
        sectors = pd.Series([r["sector"] for r in rows]).value_counts()
        write_json("sp500_constituents.json", {
            "rows": rows,
            "sectors": [{"sector": s, "count": int(c)} for s, c in sectors.items()],
        })
    except Exception as e:
        print(f"  sp500 constituents failed (kept old): {e}")
    try:
        html = requests.get("https://en.wikipedia.org/wiki/Nasdaq-100", headers=UA, timeout=30).text
        found = None
        for t in pd.read_html(StringIO(html)):
            cols = [str(c) for c in t.columns]
            if any("Ticker" in c or "Symbol" in c for c in cols) and len(t) > 80:
                found = t
                break
        if found is None:
            raise RuntimeError("ndx table not found")
        tick_col = next(c for c in found.columns if "Ticker" in str(c) or "Symbol" in str(c))
        name_col = next(c for c in found.columns if "Company" in str(c))
        sec_col = next((c for c in found.columns if "GICS Sector" in str(c)), None)
        rows = [{"ticker": r[tick_col], "name": r[name_col],
                 "sector": r[sec_col] if sec_col is not None else ""}
                for _, r in found.iterrows()]
        sectors = pd.Series([r["sector"] for r in rows if r["sector"]]).value_counts()
        write_json("ndx_constituents.json", {
            "rows": rows,
            "sectors": [{"sector": s, "count": int(c)} for s, c in sectors.items()],
        })
    except Exception as e:
        print(f"  ndx constituents failed (kept old): {e}")


def _multpl_series(slug: str):
    html = requests.get(f"https://www.multpl.com/{slug}/table/by-month", headers=UA, timeout=30).text
    rows = re.findall(r'<td>([A-Z][a-z]{2} \d{1,2}, \d{4})</td>\s*<td>\s*(?:&#x2002;)?\s*\$?([\d.,]+)', html)
    recs = sorted((datetime.strptime(d, "%b %d, %Y"), float(v.replace(",", ""))) for d, v in rows)
    return recs


def build_valuation_extras():
    """标普 PE(TTM) 与 EPS（multpl，格式脆弱，失败保留旧文件）。"""
    print("== 估值/盈利（multpl）")
    for slug, out in (("s-p-500-pe-ratio", "sp500_pe_ttm.json"),
                      ("s-p-500-earnings", "sp500_eps_hist.json")):
        try:
            recs = _multpl_series(slug)
            write_json(out, {"dates": [d.strftime("%Y-%m-%d") for d, _ in recs],
                             "values": [v for _, v in recs]})
        except Exception as e:
            print(f"  {slug} failed (kept old): {e}")


# ------------------------------------------------------- 个股篮子板块

BASKETS = {
    # 顺序即页面展示顺序：银行 → 卡组织 → 投行 → 资管 → 券商 → 加密/稳定币
    "fin": [
        ("JPM", "摩根大通"), ("BAC", "美国银行"), ("V", "Visa"), ("MA", "万事达"),
        ("AXP", "美国运通"), ("GS", "高盛"), ("MS", "摩根士丹利"), ("BLK", "贝莱德"),
        ("SCHW", "嘉信理财"), ("IBKR", "盈透证券"),
        ("COIN", "Coinbase"), ("HOOD", "Robinhood"), ("CRCL", "Circle"),
    ],
    "consumer": [
        ("KO", "可口可乐"), ("WMT", "沃尔玛"), ("COST", "好市多"),
        ("HD", "家得宝"), ("TJX", "TJX"), ("MCD", "麦当劳"),
    ],
    "luxury": [
        ("MC.PA", "LVMH"), ("RMS.PA", "爱马仕"), ("RACE", "法拉利"),
    ],
}

# 板块锚 ETF（个股钻取页之上的"总览"层；奢侈品无合适 ETF，用等权组合当锚）
ETF_ANCHORS = ["XLF", "XLP", "XLY"]

# 卫星成员：上市太晚，不进"共同起点"的成长曲线与等权组合，但有个股页和对照表
BASKET_SATELLITES = {"fin": {"COIN", "HOOD", "CRCL"}}


def safe_ticker(t: str) -> str:
    return t.lower().replace(".", "-")


def build_basket(prefix: str, members: list):
    """个股篮子：归一化成长曲线 + 等权组合面板 + 个股对照表。
    组合与归一化都基于各自币种的百分比回报，跨币种混合仅供比较参考。
    卫星成员（上市太晚）不进共同起点分析，只出对照表行与个股页。"""
    print(f"== basket {prefix}")
    satellites = BASKET_SATELLITES.get(prefix, set())
    core = [(t, n) for t, n in members if t not in satellites]
    closes = {}
    for ticker, label in members:
        closes[ticker] = fetch_history(ticker)["Close"].dropna()
        time.sleep(1)
    df = pd.DataFrame({t: closes[t] for t, _ in core}).dropna()  # 共同起点 = 核心成员最晚上市者
    start = df.index[0]

    # 归一化成长曲线（周频，起点=100）+ 等权组合
    norm = df / df.iloc[0] * 100
    daily_ret = df.pct_change().dropna()
    ew = (1 + daily_ret.mean(axis=1)).cumprod() * 100
    ew = pd.concat([pd.Series([100.0], index=[df.index[0]]), ew])
    weekly = norm.resample("W").last().dropna(how="all")
    ew_w = ew.resample("W").last().dropna()
    write_json(f"{prefix}_growth.json", {
        "start": start.strftime("%Y-%m-%d"),
        "dates": dates(weekly.index),
        "series": [{"ticker": t, "name": n, "values": rnd(weekly[t], 1)} for t, n in core],
        "ew": {"dates": dates(ew_w.index), "values": rnd(ew_w, 1)},
    })

    # 等权组合：年度回报 + 回撤
    annual = ew.resample("YE").last().pct_change().dropna() * 100
    write_json(f"{prefix}_annual.json", {
        "years": [d.year for d in annual.index],
        "returns": rnd(annual, 2),
    })
    dd, episodes = drawdown_episodes(ew)
    weekly_dd = dd.resample("W").min()
    write_json(f"{prefix}_drawdowns.json", {
        "dates": dates(weekly_dd.index),
        "dd": rnd(weekly_dd * 100, 2),
        "episodes": sorted(episodes, key=lambda e: e["depth"])[:15],
    })

    # 个股对照表（共同起点口径）+ 各自全历史统计（个股页 hero 用）
    rows = []
    for t, n in members:
        is_sat = t in satellites
        s = closes[t] if is_sat else df[t]
        years_total = (s.index[-1] - s.index[0]).days / 365.25
        def cagr(y):
            past = s[s.index <= s.index[-1] - pd.Timedelta(days=int(y * 365.25))]
            if past.empty:
                return None
            return round(((s.iloc[-1] / past.iloc[-1]) ** (1 / y) - 1) * 100, 1)
        max_dd = (s / s.cummax() - 1).min() * 100
        full = closes[t]
        full_years = max((full.index[-1] - full.index[0]).days / 365.25, 0.25)
        prev_year = s[s.index.year < s.index[-1].year]
        ytd = round((s.iloc[-1] / prev_year.iloc[-1] - 1) * 100, 1) if len(prev_year) else None
        rows.append({
            "ticker": t, "name": n, "safe": safe_ticker(t),
            "ytd": ytd,
            "y1": cagr(1), "y3": cagr(3), "y5": cagr(5), "y10": cagr(10),
            "since": None if is_sat else round(((s.iloc[-1] / s.iloc[0]) ** (1 / years_total) - 1) * 100, 1),
            "max_dd": round(float(max_dd), 1),
            "start_full": full.index[0].strftime("%Y-%m-%d"),
            "since_full": round(float(((full.iloc[-1] / full.iloc[0]) ** (1 / full_years) - 1) * 100), 1),
            "total_mult": round(float(full.iloc[-1] / full.iloc[0]), 1),
            "max_dd_full": round(float((full / full.cummax() - 1).min() * 100), 1),
        })
    write_json(f"{prefix}_table.json", {"rows": rows, "start": start.strftime("%Y-%m-%d")})

    # 个股钻取页：每只成员生成全套指数面板（各自全历史）
    for t, n in members:
        build_index_panels(f"s_{safe_ticker(t)}", closes[t])


def build_cape():
    print("== 席勒 CAPE")
    try:
        html = requests.get(MULTPL_CAPE, headers=UA, timeout=30).text
        rows = re.findall(r'<td>([A-Z][a-z]{2} \d{1,2}, \d{4})</td>\s*<td>\s*(?:&#x2002;)?\s*([\d.]+)', html)
        if not rows:
            raise RuntimeError("multpl table parse failed")
        recs = [(datetime.strptime(d, "%b %d, %Y"), float(v)) for d, v in rows]
        recs.sort()
        write_json("sp500_cape.json", {
            "dates": [d.strftime("%Y-%m-%d") for d, _ in recs],
            "cape": [v for _, v in recs],
        })
    except Exception as e:
        print(f"  CAPE unavailable this run (kept old file if any): {e}")


def main():
    print("fetching prices …")
    gspc = fetch_history("^GSPC")["Close"]
    ixic = fetch_history("^IXIC")["Close"]
    ndx = fetch_history("^NDX")["Close"]
    vix = fetch_history("^VIX")["Close"]
    try:
        vxn = fetch_history("^VXN")["Close"]
    except RuntimeError:
        vxn = None

    build_kindex(ndx, vix)
    build_leaps(gspc, ndx)
    build_index_val()
    build_macro()
    build_index_panels("sp500", gspc, vix, "VIX")
    build_index_panels("ixic", ixic)
    build_index_panels("ndx", ndx, vxn, "VXN")
    build_index_extras("sp500", gspc)
    build_index_extras("ndx", ndx)
    build_constituents()
    build_valuation_extras()
    for prefix, members in BASKETS.items():
        build_basket(prefix, members)
    for etf in ETF_ANCHORS:
        build_index_panels(f"s_{safe_ticker(etf)}", fetch_history(etf)["Close"])
        time.sleep(1)
    build_cape()

    write_json("meta.json", {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sources": "Yahoo Finance · CNN Fear & Greed (whit3rabbit archive) · multpl.com",
    })
    print("done.")


if __name__ == "__main__":
    sys.exit(main())
