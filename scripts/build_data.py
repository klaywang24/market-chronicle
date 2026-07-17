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
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
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


# 许可标记：文件被单独拷走/热链时声明跟着走；改这句必须同步重写存量文件，否则新旧不一致
NOTICE = "PolyForm Noncommercial 1.0.0 · © Klay Wang · https://chronicle.klay-wang.com · free for noncommercial use; commercial use requires a license (klaywang24+marketchronicle@gmail.com)"


def write_json(name: str, obj):
    path = DATA / name
    # 拉失败时上游函数会抛异常走到不了这里，留旧文件不覆盖
    if isinstance(obj, dict):
        obj = {"_notice": NOTICE, **{k: v for k, v in obj.items() if k != "_notice"}}
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    print(f"  wrote {name} ({path.stat().st_size/1024:.0f} KB)")


def fetch_history(ticker: str, retries: int = 3) -> pd.DataFrame:
    # 美股含点代码（BRK.B）Yahoo 用连字符，欧股（MC.PA）保留点：原样优先、连字符兜底
    candidates = [ticker] + ([ticker.replace(".", "-")] if "." in ticker else [])
    for i in range(retries):
        for sym in candidates:
            try:
                df = yf.Ticker(sym).history(period="max", auto_adjust=True)
                if len(df) > 100:
                    df.index = df.index.tz_localize(None)
                    return df
            except Exception as e:
                print(f"  {sym} attempt {i+1} failed: {e}")
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


def build_kindex(ndx_close: pd.Series, spx_close: pd.Series, vix_close: pd.Series):
    print("== K 指数")
    fng, live_note = fetch_fng()
    df = pd.DataFrame({"cnn": fng, "vix": vix_close, "ndx": ndx_close, "spx": spx_close}).dropna()
    df = df[df.index >= "2011-01-01"]  # 恐贪存档 2011 起 → KAPX 回溯至此（历史回填，非事前记录）
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

    # 收益视界在「纯价格日历」上取（价格序列无缺日），而不是合并框行数——
    # CNN 存档 2021 年前有缺日（wayback 重建），按合并框行数取 +N 行会让视界悄悄变长。
    # 双锚对账：纳指（fwd*，策略实际交易标的）+ 标普（spx_fwd*，主流市场锚）
    ndx_full = ndx_close.dropna()
    spx_full = spx_close.dropna()
    sig_rows = []
    for ep in episodes:
        if ep["start"] < pd.Timestamp("2011-01-01"):
            continue
        p0 = int(ndx_full.index.get_indexer([ep["start"]], method="backfill")[0])
        entry = ndx_full.iloc[p0]
        row = {
            "start": ep["start"].strftime("%Y-%m-%d"),
            "end": ep["end"].strftime("%Y-%m-%d"),
            "days_below": int(((df.index >= ep["start"]) & (df.index <= ep["end"]) & below).sum()),
            "min_k": round(float(ep["min_k"]), 3),
            "ndx_entry": round(float(entry), 2),
        }
        for horizon in (20, 40, 60, 120, 250):
            p = p0 + horizon
            row[f"fwd{horizon}"] = round(float(ndx_full.iloc[p] / entry - 1) * 100, 2) if p < len(ndx_full) else None
        row["fwd_to_date"] = round(float(ndx_full.iloc[-1] / entry - 1) * 100, 2)
        # K 页净值曲线用：60 个交易日持有的离场日（纳指价格日历）
        row["exit60"] = ndx_full.index[min(p0 + 60, len(ndx_full) - 1)].strftime("%Y-%m-%d")
        ps = int(spx_full.index.get_indexer([ep["start"]], method="backfill")[0])
        s_entry = spx_full.iloc[ps]
        for horizon in (20, 40, 60, 120, 250):
            p = ps + horizon
            row[f"spx_fwd{horizon}"] = round(float(spx_full.iloc[p] / s_entry - 1) * 100, 2) if p < len(spx_full) else None
        row["spx_to_date"] = round(float(spx_full.iloc[-1] / s_entry - 1) * 100, 2)
        sig_rows.append(row)

    write_json("kindex.json", {
        "dates": dates(df.index),
        "cnn": rnd(df["cnn"], 1),
        "vix": rnd(df["vix"], 2),
        "ndx": rnd(df["ndx"], 2),
        "spx": rnd(df["spx"], 2),
        "k": rnd(df["k"], 3),
        "current": {
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "cnn": round(float(df["cnn"].iloc[-1]), 1),
            "vix": round(float(df["vix"].iloc[-1]), 2),
            "k": round(float(df["k"].iloc[-1]), 3),
            "rating": live_note,
        },
    })
    write_json("kindex_signals.json", {"signals": sig_rows, "since": "2011-01-01"})
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

    # 世纪图：日频（2020/1987 这类快速崩盘的尖 V 自然显出真实深度；月末收盘会把它抹平）
    daily_c = close.dropna()
    write_json(f"{prefix}_century.json", {"dates": dates(daily_c.index), "close": rnd(daily_c, 2)})

    # 月频序列：世纪图已改日频不再用它，但下面的「滚动 5 年年化」与「月度季节性」仍依赖。
    # ⚠️ bd24343 把世纪图改日频时连这行定义一起删了，导致本函数抛
    #    NameError: name 'monthly' is not defined —— daily-update 自 2026-07-12 起连续失败，
    #    站上数据一直冻结在 2026-07-10。改动本行前先确认 :239/:258/:267 是否还在用。
    monthly = close.resample("ME").last()

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


# ---------------------------------------------------------------- 今日头版

SECTOR_ETFS = [
    ("XLK", "科技"), ("XLF", "金融"), ("XLV", "医疗保健"), ("XLY", "可选消费"),
    ("XLP", "必需消费"), ("XLE", "能源"), ("XLI", "工业"), ("XLB", "原材料"),
    ("XLU", "公用事业"), ("XLRE", "房地产"), ("XLC", "通信服务"),
]


def build_pulse():
    """今日头版：市场温度（估值百分位+情绪百分位）/2、涨跌家数分布、板块当日涨跌。
    情绪 = 上涨家数占比 (涨 + 平/2)/总数 在近一年中的百分位；
    估值 = 标普 500 PE(TTM) 在 1871 年以来全历史中的百分位。"""
    print("== 今日头版")
    ticks = [r["ticker"].replace(".", "-")
             for r in json.loads((DATA / "sp500_constituents.json").read_text())["rows"]]
    frames = []
    for i in range(0, len(ticks), 110):
        chunk = ticks[i:i + 110]
        # 2y：多出的一年只为算 200 日均线广度；温度的情绪百分位仍显式取近一年
        df = yf.download(" ".join(chunk), period="2y", interval="1d",
                         progress=False, auto_adjust=True)["Close"]
        frames.append(df)
        time.sleep(2)
    px = pd.concat(frames, axis=1).dropna(how="all")
    ret = px.pct_change().iloc[1:]
    FLAT = 0.0001  # |涨跌| < 0.01% 记为持平
    up = (ret > FLAT).sum(axis=1)
    flat = (ret.abs() <= FLAT).sum(axis=1)
    total = ret.notna().sum(axis=1)
    ratio = ((up + flat / 2) / total).iloc[-252:]  # 温度口径：近一年，勿随下载窗口变

    # 广度：% 成分股收于 200 日均线上（只留均线覆盖足够的交易日），与旧 breadth.json 合并累积
    try:
        ma200 = px.rolling(200).mean()
        valid = px.notna() & ma200.notna()
        above = ((px > ma200) & valid).sum(axis=1)
        cover = valid.sum(axis=1)
        b = (above / cover * 100)[cover >= 400].round(1)
        merged = {}
        old_b = DATA / "breadth.json"
        if old_b.exists():
            try:
                prev = json.loads(old_b.read_text())
                merged = dict(zip(prev.get("dates", []), prev.get("pct", [])))
            except Exception:
                pass
        merged.update({d.strftime("%Y-%m-%d"): float(v) for d, v in b.items()})
        b_dates = sorted(merged)
        b_vals = [merged[d] for d in b_dates]
        b_cur = b_vals[-1]
        b_pct = round(sum(1 for v in b_vals if v <= b_cur) / len(b_vals) * 100, 1)
        write_json("breadth.json", {
            "dates": b_dates, "pct": b_vals,
            "current": b_cur, "pctile": b_pct,
            "since": b_dates[0] if b_dates else None,
        })
    except Exception as e:
        print(f"  广度计算失败（留旧文件）: {e}")
    today = ratio.index[-1]
    adv, fl, tot = int(up.iloc[-1]), int(flat.iloc[-1]), int(total.iloc[-1])
    dec = tot - adv - fl
    sent_pct = round(float((ratio <= ratio.iloc[-1]).mean() * 100), 1)

    pe = json.loads((DATA / "sp500_pe_ttm.json").read_text())
    val_pct = round(sum(1 for v in pe["values"] if v <= pe["values"][-1]) / len(pe["values"]) * 100, 1)
    temp = round((val_pct + sent_pct) / 2, 1)

    # 板块当日涨跌（11 只 SPDR 行业 ETF）
    etf_px = yf.download(" ".join(e for e, _ in SECTOR_ETFS), period="5d",
                         interval="1d", progress=False, auto_adjust=True)["Close"]
    etf_chg = (etf_px.iloc[-1] / etf_px.iloc[-2] - 1) * 100
    sectors = [{"etf": e, "name": n, "chg": round(float(etf_chg[e]), 2)}
               for e, n in SECTOR_ETFS if e in etf_chg and pd.notna(etf_chg[e])]
    sectors.sort(key=lambda x: -x["chg"])

    # 指数当日行情 + 现有信号
    idx_px = yf.download("^GSPC ^NDX ^DJI ^RUT ^VIX", period="5d", interval="1d",
                         progress=False, auto_adjust=True)["Close"]
    quotes = {}
    for sym, key in (("^GSPC", "spx"), ("^NDX", "ndx"), ("^DJI", "dji"),
                     ("^RUT", "rut"), ("^VIX", "vix")):
        s = idx_px[sym].dropna()
        quotes[key] = {"close": round(float(s.iloc[-1]), 2),
                       "chg": round(float(s.iloc[-1] / s.iloc[-2] - 1) * 100, 2)}
    fng = k = None
    try:
        kd = json.loads((DATA / "kindex.json").read_text())["current"]
        fng, k = kd["cnn"], kd["k"]
    except Exception:
        pass

    # 全成分股热力图：面积=市值、颜色=当日涨跌、按 GICS 行业分组（Finviz 式 treemap）
    sec_of = {r["ticker"].replace(".", "-"): r["sector"]
              for r in json.loads((DATA / "sp500_constituents.json").read_text())["rows"]}
    last_ret = ret.iloc[-1]
    heat = []
    for t in px.columns:
        c = last_ret.get(t)
        if pd.isna(c):
            continue
        try:
            mc = yf.Ticker(t).fast_info["market_cap"]
        except Exception:
            mc = None
        if not mc:
            continue
        heat.append([t.replace("-", "."), sec_of.get(t, "Other"),
                     round(float(c) * 100, 2), round(mc / 1e9, 1)])
        time.sleep(0.15)
    write_json("pulse_heatmap.json", {"date": today.strftime("%Y-%m-%d"), "rows": heat})

    write_json("pulse.json", {
        "date": today.strftime("%Y-%m-%d"),
        "temp": temp, "val_pct": val_pct, "sent_pct": sent_pct,
        "adv": adv, "flat": fl, "dec": dec, "total": tot,
        "adv_ratio": round(float(ratio.iloc[-1]) * 100, 1),
        "sectors": sectors, "quotes": quotes, "fng": fng, "k": k,
        "sent_window": f"{ratio.index[0].strftime('%Y-%m')}→",
    })


# ---------------------------------------------------------------- 宏观（FRED）

def _fred(series_id: str, start: str = "2000-01-01") -> pd.Series:
    """FRED 数据。首选官方 API（需免费 key，环境变量 FRED_API_KEY，Actions 里从 Secrets 注入）；
    无 key 时回退 fredgraph.csv（注意：该端点对数据中心/代理 IP 常不可达）。"""
    import os
    from io import StringIO
    key = os.environ.get("FRED_API_KEY")
    if key:
        url = ("https://api.stlouisfed.org/fred/series/observations"
               f"?series_id={series_id}&api_key={key}&file_type=json&observation_start={start}")
        for attempt in range(3):
            try:
                r = requests.get(url, headers=UA, timeout=60)
                r.raise_for_status()
                obs = r.json()["observations"]
                pairs = [(o["date"], float(o["value"])) for o in obs if o["value"] not in (".", "")]
                return pd.Series([v for _, v in pairs], index=pd.to_datetime([d for d, _ in pairs]))
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    r = requests.get(url, headers=UA, timeout=60)
    r.raise_for_status()
    df = pd.read_csv(StringIO(r.text))
    df.columns = ["d", "v"]
    df["v"] = pd.to_numeric(df["v"], errors="coerce")
    df = df.dropna()
    df = df[df["d"] >= start]
    return pd.Series(df["v"].values, index=pd.to_datetime(df["d"]))


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

def build_leaps(spx_close: pd.Series, ndx_close: pd.Series, vix_close: pd.Series = None, threshold: float = 25.0):
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

    # 同 build_kindex：收益视界在纯价格日历上取，避免恐贪存档缺日拉长视界
    full = {"spx": spx_close.dropna(), "ndx": ndx_close.dropna()}
    rows = []
    for ep in episodes:
        row = {
            "start": ep["start"].strftime("%Y-%m-%d"),
            "end": ep["end"].strftime("%Y-%m-%d"),
            "days_below": int(((df.index >= ep["start"]) & (df.index <= ep["end"]) & below).sum()),
            "min_fng": round(ep["min"], 1),
        }
        for idx in ("spx", "ndx"):
            s = full[idx]
            p0 = int(s.index.get_indexer([ep["start"]], method="backfill")[0])
            entry = s.iloc[p0]
            for label, horizon in (("m6", 126), ("m12", 252), ("m18", 378)):
                p = p0 + horizon
                row[f"{idx}_{label}"] = round(float(s.iloc[p] / entry - 1) * 100, 1) if p < len(s) else None
            row[f"{idx}_to_date"] = round(float(s.iloc[-1] / entry - 1) * 100, 1)
        # 头版净值曲线用：12 个月持有的离场日（纳指价格日历 +252 交易日）
        pn = int(full["ndx"].index.get_indexer([ep["start"]], method="backfill")[0])
        pe = min(pn + 252, len(full["ndx"]) - 1)
        row["m12_exit"] = full["ndx"].index[pe].strftime("%Y-%m-%d")
        # 「恐惧的标价」：窗口开启当天的 VIX（保费水位）
        if vix_close is not None:
            vf = vix_close.dropna()
            pv = int(vf.index.get_indexer([ep["start"]], method="backfill")[0])
            row["vix_start"] = round(float(vf.iloc[pv]), 2)
        rows.append(row)

    write_json("leaps.json", {
        "threshold": threshold,
        "dates": dates(df.index),
        "fng": rnd(df["fng"], 1),
        "ndx": rnd(df["ndx"], 2),
        "spx": rnd(df["spx"], 2),
        "current": {
            "date": df.index[-1].strftime("%Y-%m-%d"),
            "fng": round(float(df["fng"].iloc[-1]), 1),
            "rating": live_note,
            "window_open": bool(df["fng"].iloc[-1] < threshold),
        },
        "episodes": rows,
    })


# --------------------------------------------------------- 仓位层：NAAIM 经理人敞口
NAAIM_PAGE = "https://naaim.org/programs/naaim-exposure-index/"


def build_naaim():
    """NAAIM Exposure Index：主动管理人平均股票敞口（周频，2006→）。
    官网 Excel 文件名带日期每周变，先抓页面找当前链接再下载。"""
    print("== NAAIM 经理人敞口")
    page = requests.get(NAAIM_PAGE, headers=UA, timeout=30)
    page.raise_for_status()
    m = re.search(r'href="(https://naaim\.org/wp-content/uploads/[^"]+\.xlsx?)"', page.text)
    if not m:
        raise RuntimeError("NAAIM xlsx link not found on page")
    r = requests.get(m.group(1), headers=UA, timeout=60)
    r.raise_for_status()
    df = pd.read_excel(pd.io.common.BytesIO(r.content))
    col = "NAAIM Number" if "NAAIM Number" in df.columns else "Mean/Average"
    s = df.set_index("Date")[col].dropna().sort_index()
    cur = round(float(s.iloc[-1]), 1)
    pct = round(float((s <= s.iloc[-1]).mean() * 100), 1)
    write_json("naaim.json", {
        "dates": dates(s.index), "values": rnd(s, 1),
        "current": cur, "pctile": pct,
        "date": s.index[-1].strftime("%Y-%m-%d"), "since": s.index[0].strftime("%Y-%m-%d"),
    })


# --------------------------------------------------------- 情绪仪表盘
CBOE_HIST = "https://cdn.cboe.com/api/global/us_indices/daily_prices/{}_History.csv"


def build_sentiment(vix_close: pd.Series, vxn_close: pd.Series = None):
    """情绪仪表盘：CNN 恐贪七子指标快照 + Put/Call 比（CNN 原始 5 日均值，滚动累积自建历史）
    + VIX 期限结构（Cboe 官方历史 CSV：VIX9D/VIX3M/VIX6M + yfinance VIX）
    + SKEW（黑天鹅保险价格，Cboe 官方 CSV）+ VXN/VIX 比值（纳指恐慌溢价）。"""
    print("== 情绪仪表盘")
    live = requests.get(FNG_LIVE, headers=UA, timeout=30).json()

    # --- 七个子指标当日快照（CNN 官方口径，score 0-100）
    SUB_KEYS = ["market_momentum_sp500", "stock_price_strength", "stock_price_breadth",
                "put_call_options", "market_volatility_vix", "junk_bond_demand", "safe_haven_demand"]
    subs = {}
    for k in SUB_KEYS:
        v = live.get(k) or {}
        if "score" in v:
            subs[k] = {"score": round(float(v["score"]), 1), "rating": v.get("rating", "")}

    # --- Put/Call 比：CNN put_call_options.data 的 y 就是原始 5 日均值比率（滚动一年窗口）
    #     每日运行时与已有 sentiment.json 合并，历史随管线逐日累积（超出一年后仍保留）
    pc_new = {}
    for pt in (live.get("put_call_options") or {}).get("data", []):
        d = pd.Timestamp(pt["x"], unit="ms").strftime("%Y-%m-%d")
        pc_new[d] = round(float(pt["y"]), 4)
    old_path = DATA / "sentiment.json"
    if old_path.exists():
        try:
            old_pc = json.loads(old_path.read_text()).get("pc", {})
            merged = dict(zip(old_pc.get("dates", []), old_pc.get("ratio", [])))
            merged.update(pc_new)  # 新值（含 CNN 修订）覆盖旧值
            pc_new = merged
        except Exception as e:
            print(f"  旧 sentiment.json 读取失败，仅用当次数据: {e}")
    pc_dates = sorted(pc_new)
    pc_vals = [pc_new[d] for d in pc_dates]
    pc_cur = pc_vals[-1] if pc_vals else None
    pc_pct = round(sum(1 for v in pc_vals if v <= pc_cur) / len(pc_vals) * 100, 1) if pc_vals else None

    # --- VIX 期限结构：Cboe 官方历史 CSV（开高低收，取 CLOSE）+ 管线自有 VIX
    def cboe_hist(name):
        r = requests.get(CBOE_HIST.format(name), headers=UA, timeout=30)
        r.raise_for_status()
        df = pd.read_csv(pd.io.common.StringIO(r.text), parse_dates=["DATE"]).set_index("DATE")
        # VIX 系列是 OHLC（取 CLOSE）；SKEW 等单值序列只有一列
        col = "CLOSE" if "CLOSE" in df.columns else df.columns[-1]
        return df[col]

    term = pd.DataFrame({
        "vix9d": cboe_hist("VIX9D"),
        "vix": vix_close,
        "vix3m": cboe_hist("VIX3M"),
        "vix6m": cboe_hist("VIX6M"),
    }).dropna()
    term = term[term.index >= "2011-01-01"]
    ratio = term["vix"] / term["vix3m"]  # >1 = 倒挂（近端恐慌），<1 = 正常升水
    cur_ratio = round(float(ratio.iloc[-1]), 3)
    ratio_pct = round(float((ratio <= ratio.iloc[-1]).mean() * 100), 1)

    # --- SKEW：黑天鹅保险的价格（Cboe 官方全史，百分位按全史算，序列存 2011→）
    skew_obj = None
    try:
        skew = cboe_hist("SKEW").dropna()
        s_cur = round(float(skew.iloc[-1]), 1)
        s_pct = round(float((skew <= skew.iloc[-1]).mean() * 100), 1)
        sk = skew[skew.index >= "2011-01-01"]
        skew_obj = {"dates": dates(sk.index), "values": rnd(sk, 1),
                    "current": s_cur, "pctile": s_pct}
    except Exception as e:
        print(f"  SKEW 拉取失败（跳过该卡）: {e}")

    # --- VXN/VIX 比值：纳指恐慌溢价（>1 = 市场为纳指波动付更高保费）
    vxn_obj = None
    if vxn_close is not None:
        try:
            pair = pd.DataFrame({"vxn": vxn_close, "vix": vix_close}).dropna()
            nr = pair["vxn"] / pair["vix"]
            n_cur = round(float(nr.iloc[-1]), 3)
            n_pct = round(float((nr <= nr.iloc[-1]).mean() * 100), 1)
            nrs = nr[nr.index >= "2011-01-01"]
            vxn_obj = {"dates": dates(nrs.index), "ratio": rnd(nrs, 3),
                       "current": n_cur, "pctile": n_pct,
                       "vxn": round(float(pair["vxn"].iloc[-1]), 2)}
        except Exception as e:
            print(f"  VXN 比值失败（跳过该卡）: {e}")

    write_json("sentiment.json", {
        "date": term.index[-1].strftime("%Y-%m-%d"),
        "subs": subs,
        "skew": skew_obj,
        "vxn": vxn_obj,
        "pc": {"dates": pc_dates, "ratio": pc_vals, "current": pc_cur, "pctile": pc_pct},
        "term": {
            "dates": dates(term.index),
            "vix9d": rnd(term["vix9d"], 2), "vix": rnd(term["vix"], 2),
            "vix3m": rnd(term["vix3m"], 2), "vix6m": rnd(term["vix6m"], 2),
            "current": {"vix9d": round(float(term["vix9d"].iloc[-1]), 2),
                        "vix": round(float(term["vix"].iloc[-1]), 2),
                        "vix3m": round(float(term["vix3m"].iloc[-1]), 2),
                        "vix6m": round(float(term["vix6m"].iloc[-1]), 2),
                        "ratio_3m": cur_ratio, "pctile": ratio_pct,
                        "state": "backwardation" if cur_ratio > 1 else "contango"},
        },
    })


# ------------------------------------------------- 恐惧的标价指数（LEAPS 温度计）
# 头条 = VIX1Y 在过去 3 年的百分位，高=贵（0-100）；4 项 context 只算不平均进头条。
# 设计锁定见 KAPX-恐惧标价指数/REGISTRATION.md（v2）——改动=另立新兄弟，绝不追溯改。
# 云原生：VIX 家族取自 CBOE 官方 CSV，实际利率取自 FRED，SPX 用管线已有 ^GSPC。零本地依赖。
LEAPS_FORWARD_START = "2026-07-13"  # 首次上线日：此日(含)起=前向台账，之前=可复现回测。锁定常量，勿随每日运行改动。


def _cboe_close(name: str) -> pd.Series:
    """CBOE 官方历史 CSV → 日频收盘 Series（VIX 家族取 CLOSE，SKEW 取末列）。"""
    from io import StringIO
    r = requests.get(CBOE_HIST.format(name), headers=UA, timeout=30)
    r.raise_for_status()
    df = pd.read_csv(StringIO(r.text))
    df["DATE"] = pd.to_datetime(df["DATE"])
    col = "CLOSE" if "CLOSE" in df.columns else df.columns[-1]
    return pd.Series(pd.to_numeric(df[col], errors="coerce").values,
                     index=df["DATE"]).dropna().sort_index()


def _roll_pctile(s: pd.Series, window: int, min_periods: int = 250) -> pd.Series:
    """滚动百分位：当前值在过去 window 交易日内的分位（0-1，高值=高分位=贵）。"""
    return s.rolling(window, min_periods=min_periods).apply(
        lambda x: (x <= x[-1]).mean(), raw=True)


def _pctile_now(s: pd.Series, window: int | None = None):
    """当前值在（全史或末 window 观测）中的百分位 ×100。空序列返回 None。"""
    w = s.dropna()
    if window:
        w = w.iloc[-window:]
    if len(w) == 0:
        return None
    return round(float((w <= w.iloc[-1]).mean() * 100), 1)


def compute_leaps_index(vix1y, gspc, vix, vix9d, vix3m, vix6m, skew, dfii):
    """把已取好的各序列合成「恐惧的标价指数」台账 dict。纯函数（无网络），便于 dry-run。
    头条 = VIX1Y 3 年滚动百分位（高=贵）；4 context（VRP/期限阶梯/SKEW/实际利率）只算不平均进头条。"""
    idx = vix1y.dropna().index                        # 主日历 = VIX1Y 交易日（2007+）
    v = vix1y.reindex(idx).ffill()

    exp3y = _roll_pctile(v, 756) * 100                # 头条序列：高=贵（0-100）

    # VRP（波动税）：VIX1Y − SPX 已实现波动率（同标的、期限对齐）。主=252日(1年)，小字=63日(3月)。
    logret = np.log(gspc / gspc.shift(1))
    rv = lambda n: (logret.rolling(n).std() * np.sqrt(252) * 100).reindex(idx).ffill()
    rv252, rv63 = rv(252), rv(63)
    vrp_main, vrp_small = v - rv252, v - rv63

    def last(s):
        s = s.dropna()
        return None if s.empty else round(float(s.iloc[-1]), 2)

    cur_v = round(float(v.iloc[-1]), 2)
    cur_date = idx[-1].strftime("%Y-%m-%d")
    return {
        "meta": {
            "name": "恐惧的标价指数",
            "question": "今天买长期期权（LEAPS）在历史上算贵还是便宜？",
            "headline": "VIX1Y 在过去 3 年的百分位，高=贵（0=历史最便宜，100=历史最贵）",
            "nature": "描述性温度计，非交易信号/非预测；仅为数据，非投资建议。",
            "design": "描述性成本刻度 v2；方法论与口径详见本站 LEAPS 页",
            "forward_start": LEAPS_FORWARD_START,
            "segment_note": "dates < forward_start = 可复现回测(backtest)；>= forward_start = 前向台账(forward)，逐日 commit 记录。",
            "windows": {  # 各项口径分别标清——头条与 context 不是同一把尺，口径透明=诚实的一部分
                "headline_expensiveness": "VIX1Y 百分位；主看=近 3 年(756td)，小字坐标=近 5 年(1260td) / 全史(2007+)",
                "vrp": "值(非百分位)：VIX1Y − SPX 已实现波动率；主=252td(1 年) / 小字=63td(3 月)",
                "term_ladder": "当前值快照 + VIX/VIX1Y 比（非百分位）",
                "call_skew": "SKEW 的全史百分位",
                "real_rate": "DFII10(10 年期实际利率) 的全史百分位（慢变量，故用全史）",
            },
            "caveats": {
                "warmup": "早期(2007–2009)百分位在不足 756 交易日的窗口上计算(min_periods=250)，随历史积累趋于满 3 年基数。",
                "context_asof": "context 各值 as-of 其数据源各自最新印次；FRED 实际利率(DFII10)可能比头条日期滞后约 1 交易日。",
            },
        },
        "dates": dates(idx),
        "vix1y": rnd(v, 2),
        "expensiveness_3y": rnd(exp3y, 1),            # 头条：高=贵
        "vrp_main": rnd(vrp_main, 2),                 # VIX1Y − 252 日已实现
        "vrp_small": rnd(vrp_small, 2),               # VIX1Y − 63 日已实现
        "current": {
            "date": cur_date,
            "segment": "forward" if cur_date >= LEAPS_FORWARD_START else "backtest",
            "vix1y": cur_v,
            "expensiveness": {                        # 头条读数 + 三窗口坐标（主看 3 年，小字 5 年/全史）
                "p3y": _pctile_now(v, 756),
                "p5y": _pctile_now(v, 1260),
                "pfull": _pctile_now(v),
            },
            "context": {                              # 4 项，展示不平均进头条（每项独立经济论点）
                "vrp": {"main": last(vrp_main), "small": last(vrp_small),
                        "rv252": last(rv252), "rv63": last(rv63)},
                "term_ladder": {"vix9d": last(vix9d), "vix": last(vix), "vix3m": last(vix3m),
                                "vix6m": last(vix6m), "vix1y": cur_v,
                                "ratio_vix_vix1y": round(float(vix.dropna().iloc[-1] / cur_v), 3)},
                "call_skew": {"value": last(skew), "pctile_full": _pctile_now(skew)},
                "real_rate": {"value": last(dfii), "pctile_full": _pctile_now(dfii)},
            },
        },
    }


def build_leaps_index(gspc_close: pd.Series, vix_close: pd.Series):
    """恐惧的标价指数旗舰台账 → data/leaps_index.json（kindex.json 隔壁）。拉失败抛异常，留旧文件不覆盖。"""
    print("== 恐惧的标价指数（LEAPS 温度计）")
    out = compute_leaps_index(
        _cboe_close("VIX1Y"), gspc_close.dropna(), vix_close.dropna(),
        _cboe_close("VIX9D"), _cboe_close("VIX3M"), _cboe_close("VIX6M"),
        _cboe_close("SKEW"), _fred("DFII10", start="2003-01-01"),
    )
    write_json("leaps_gauge.json", out)


# ---------------- 期货维度两源（2026-07-17）：VX 期限结构 + CFTC COT ----------------
# 官方免费源、不依赖任何券商（期权侧的断粮备份）。拉挂了只留旧文件，绝不拖死主管线。

VX_SETTLE = "https://www.cboe.com/us/futures/market_statistics/settlement/csv"


def _vx_curve_on(day) -> list:
    """该日 VX 标准月结算曲线 [[到期日, 结算价], ...]；无数据（周末/未发布）返回 []。"""
    r = requests.get(VX_SETTLE, params={"dt": day.strftime("%Y-%m-%d")}, headers=UA, timeout=30)
    if r.status_code != 200:
        return []
    rows = []
    for line in r.text.strip().splitlines()[1:]:
        p = line.split(",")
        # 只取标准月（符号形如 VX/N6）；周链（VX30/N6）与父月同值，画曲线只会重复
        if len(p) >= 4 and p[0] == "VX" and p[1].startswith("VX/"):
            try:
                rows.append([p[2], round(float(p[3]), 4)])
            except ValueError:
                pass
    rows.sort()
    return rows


def build_vx_curve(vix_close: pd.Series):
    """VIX 期货逐月结算曲线（真钱轨，与指数轨互证）→ data/vx_curve.json。历史逐日累积。"""
    print("== VX 期货期限结构")
    today = datetime.now(timezone.utc).date()
    asof, curve = None, []
    for back in range(6):  # 当晚结算未发布/周末则回退到最近有数的交易日
        d = today - timedelta(days=back)
        curve = _vx_curve_on(d)
        if curve:
            asof = d
            break
    if not curve:
        raise RuntimeError("Cboe VX settlement 连续 6 日无数据")
    wk_asof, wk_curve = None, []
    for back in range(7, 13):
        d = today - timedelta(days=back)
        wk_curve = _vx_curve_on(d)
        if wk_curve:
            wk_asof = d
            break
    hist = {}
    try:
        hist = json.loads((DATA / "vx_curve.json").read_text()).get("history", {})
    except Exception:
        pass
    hist[asof.isoformat()] = curve
    write_json("vx_curve.json", {
        "asof": asof.isoformat(),
        "spot_vix": round(float(vix_close.dropna().iloc[-1]), 2),
        "curve": curve,
        "week_ago": {"asof": wk_asof.isoformat() if wk_asof else None, "curve": wk_curve},
        "history": hist,
    })


COT_TFF = "https://publicreporting.cftc.gov/resource/gpe5-46if.json"


def build_cot_vix():
    """CFTC TFF（金融期货持仓）里 VIX 期货的机构站位，全史一次回填（2006→）→ data/cot_vix.json。
    ⚠️ 该数据集列名没有 _all 后缀（lev_money_positions_long，不是 …_long_all）。
    周五 15:30 ET 发布周二数据：每日拉最新即可（幂等），周五自动出新。"""
    print("== CFTC COT（VIX 期货站位）")
    r = requests.get(COT_TFF, params={
        "$where": "starts_with(market_and_exchange_names,'VIX')",
        "$order": "report_date_as_yyyy_mm_dd ASC",
        "$limit": "5000",
        "$select": ("report_date_as_yyyy_mm_dd,lev_money_positions_long,lev_money_positions_short,"
                    "asset_mgr_positions_long,asset_mgr_positions_short,open_interest_all"),
    }, headers=UA, timeout=60)
    r.raise_for_status()
    series = []
    for row in r.json():
        try:
            ll, ls = int(row["lev_money_positions_long"]), int(row["lev_money_positions_short"])
            al, am = int(row["asset_mgr_positions_long"]), int(row["asset_mgr_positions_short"])
            # 四条腿原样保留（2026-07-17 落库线提出：净额看不出「空头平了还是多头加了」）
            series.append({
                "date": row["report_date_as_yyyy_mm_dd"][:10],
                "lev_long": ll, "lev_short": ls, "lev_net": ll - ls,
                "am_long": al, "am_short": am, "am_net": al - am,
                "oi": int(row["open_interest_all"]),
            })
        except (KeyError, ValueError):
            pass
    if not series:
        raise RuntimeError("CFTC TFF 返回空")
    series.sort(key=lambda x: x["date"])
    write_json("cot_vix.json", {
        "latest": series[-1],
        "short_weeks_52": sum(1 for s in series[-52:] if s["lev_net"] < 0),
        "series": series,
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
        # 维基的纳指 100 表用 ICB 分类（"ICB Industry"），此处泛匹配 Sector/Industry
        sec_col = next((c for c in found.columns
                        if "Sector" in str(c) or "Industry" in str(c)), None)
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


def build_top_holdings(top_n: int = 20):
    """前 N 大持仓（每日刷新，调仓自动反映）。
    SPY：道富官方 holdings XLSX；QQQ：stockanalysis 页面内嵌数据。
    市值来自 yfinance 快照，行业与我们的成分股数据集拼接。"""
    print("== 前二十大持仓")
    from io import BytesIO
    sector_of = {}
    for fname in ("sp500_constituents.json", "ndx_constituents.json"):
        try:
            for r in json.loads((DATA / fname).read_text())["rows"]:
                sector_of.setdefault(r["ticker"], r.get("sector", ""))
        except Exception:
            pass

    def mcap(t):
        try:
            v = yf.Ticker(t.replace(".", "-")).fast_info["market_cap"]  # BRK.B → BRK-B
            return round(v / 1e9, 1) if v else None
        except Exception:
            return None

    # ---- SPY（SSGA 官方 XLSX）----
    try:
        import openpyxl
        r = requests.get("https://www.ssga.com/us/en/intermediary/library-content/"
                         "products/fund-data/etfs/us/holdings-daily-us-en-spy.xlsx",
                         headers=UA, timeout=60, allow_redirects=True)
        r.raise_for_status()
        ws = openpyxl.load_workbook(BytesIO(r.content)).active
        rows_iter = ws.iter_rows(values_only=True)
        asof = ""
        header_seen = False
        rows = []
        for row in rows_iter:
            if row[0] == "Holdings:":
                asof = str(row[1]).replace("As of ", "")
            if row[0] == "Name":
                header_seen = True
                continue
            if header_seen and row[1] and row[4] is not None:
                tick = str(row[1])
                if not re.match(r"^[A-Z][A-Z.]{0,6}$", tick):
                    continue  # 跳过现金/衍生品等非股票行（如 2670549D）
                rows.append({"ticker": tick, "name": str(row[0]).title(),
                             "weight": round(float(row[4]), 2)})
                if len(rows) >= top_n:
                    break
        for x in rows:
            x["sector"] = sector_of.get(x["ticker"], "")
            x["mcap"] = mcap(x["ticker"])
            time.sleep(0.4)
        write_json("sp500_top.json", {"rows": rows, "asof": asof, "source": "SSGA SPY"})
    except Exception as e:
        print(f"  SPY holdings failed (kept old): {e}")

    # ---- QQQ（stockanalysis 内嵌 JSON）----
    try:
        html = requests.get("https://stockanalysis.com/etf/qqq/holdings/",
                            headers=UA, timeout=60).text
        recs = re.findall(r'no:(\d+),n:"([^"]+)",s:"([^"]+)",as:"([\d.]+)%"', html)
        rows = []
        for no, name, sym, w in recs[:top_n]:
            sym = sym.lstrip("$")
            rows.append({"ticker": sym, "name": name, "weight": round(float(w), 2),
                         "sector": sector_of.get(sym, "")})
        for x in rows:
            x["mcap"] = mcap(x["ticker"])
            time.sleep(0.4)
        m = re.search(r'"?asOf"?\s*[:=]\s*"([^"]+)"', html)
        write_json("ndx_top.json", {"rows": rows, "asof": m.group(1) if m else "",
                                    "source": "stockanalysis/QQQ"})
    except Exception as e:
        print(f"  QQQ holdings failed (kept old): {e}")


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
    # 科技：半导体 → 存储 → 平台/软件 → 硬件/终端（总览锚用 QQQ，复用 ndx 面板）
    # ⚠️ 顺序必须与 js/app.js 的 BASKET_CFG.tech 一致（rows 决定版面、members 决定翻页顺序）
    "tech": [
        ("NVDA", "英伟达"), ("AVGO", "博通"), ("TSM", "台积电"), ("AMD", "AMD"),
        ("MU", "美光"), ("SNDK", "闪迪"),
        ("MSFT", "微软"), ("GOOGL", "谷歌"), ("META", "Meta"), ("AMZN", "亚马逊"),
        ("AAPL", "苹果"), ("TSLA", "特斯拉"),
    ],
    # 顺序即页面展示顺序：银行 → 卡组织 → 券商 → 投行 → 资管 → 保险 → 加密/稳定币
    "fin": [
        ("JPM", "摩根大通"), ("BAC", "美国银行"), ("V", "Visa"), ("MA", "万事达"),
        ("AXP", "美国运通"), ("SCHW", "嘉信理财"), ("IBKR", "盈透证券"),
        ("GS", "高盛"), ("MS", "摩根士丹利"), ("BLK", "贝莱德"), ("BRK.B", "伯克希尔"),
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

# 板块锚 ETF（个股钻取页之上的"总览"层；奢侈品无合适 ETF，用等权组合当锚；XLK 只作个股对比线）
ETF_ANCHORS = ["XLF", "XLP", "XLY", "XLK"]

# 卫星成员：上市太晚，不进"共同起点"的成长曲线与等权组合，但有个股页和对照表
# 卫星成员 = 上市太晚，进不了「共同起点」分析（build_basket 的共同起点 = 核心成员里最晚上市那只）。
# ⚠️ 加新成员前先查上市日：把上市晚的当核心加进来，会把整个篮子的归一化成长曲线与等权组合
#    年度回报/回撤一路截断到它的上市日——站还在、图还画，只是历史悄悄没了。
#    SNDK 2025-02-13 才从西数分拆（实测 355 根），当核心会把科技篮从 2012 截到 2025。
BASKET_SATELLITES = {"fin": {"COIN", "HOOD", "CRCL"}, "tech": {"SNDK"}}


def safe_ticker(t: str) -> str:
    return t.lower().replace(".", "-")


_FX_CACHE = {}

def mcap_usd_b(ticker: str):
    """市值（十亿美元）。先按原代码试（欧股 MC.PA），再试 . → - （美股 BRK.B）；非美元按汇率换算。"""
    for sym in (ticker, ticker.replace(".", "-")):
        try:
            fi = yf.Ticker(sym).fast_info
            v = fi["market_cap"]
            if not v:
                continue
            cur = (fi.get("currency") or "USD").upper()
            if cur != "USD":
                if cur not in _FX_CACHE:
                    _FX_CACHE[cur] = float(yf.Ticker(f"{cur}USD=X").fast_info["last_price"])
                v *= _FX_CACHE[cur]
            return round(v / 1e9, 1)
        except Exception:
            continue
    return None


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
        mc = mcap_usd_b(t)
        rows.append({
            "ticker": t, "name": n, "safe": safe_ticker(t), "mcap": mc,
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

    build_kindex(ndx, gspc, vix)
    build_leaps(gspc, ndx, vix)
    try:
        build_sentiment(vix, vxn)
    except Exception as e:
        print(f"  情绪仪表盘失败（留旧文件）: {e}")
    try:
        build_naaim()
    except Exception as e:
        print(f"  NAAIM 失败（留旧文件）: {e}")
    try:
        build_leaps_index(gspc, vix)
    except Exception as e:
        print(f"  恐惧的标价指数失败（留旧文件）: {e}")
    try:
        build_vx_curve(vix)
    except Exception as e:
        print(f"  VX 期限结构失败（留旧文件）: {e}")
    try:
        build_cot_vix()
    except Exception as e:
        print(f"  COT 持仓失败（留旧文件）: {e}")
    build_index_val()
    build_macro()
    build_index_panels("sp500", gspc, vix, "VIX")
    build_index_panels("ixic", ixic)
    build_index_panels("ndx", ndx, vxn, "VXN")
    build_index_extras("sp500", gspc)
    build_index_extras("ndx", ndx)
    build_constituents()
    build_top_holdings()
    build_valuation_extras()
    build_pulse()  # 依赖 constituents 与 pe_ttm，放在其后
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
