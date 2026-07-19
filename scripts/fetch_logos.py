#!/usr/bin/env python3
"""下载全站用到的公司 logo 到 logos/ 自托管（64px PNG，来源 parqet）。

动机：前端直连 assets.parqet.com 在部分设备上被整体拦截（iPad 实测全站无
logo，无广告扩展仍失败）；自托管后 logo 与站点同源，客户端环境不再影响显示，
且省掉每页数百个外域请求。

与 build_data.py 分离，跟 weekly.yml 一起每周跑（成分股变动不频繁；新增
ticker 在下次运行前由前端回退 parqet 直连兜底）。已存在的文件默认跳过，
--refresh 全量重下。
"""
import json
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "logos"

# ticker 来源：两份成分股全表 + 一份前二十大 + 四个篮子表
# （sp500_top.json 已于 2026-07-19 随 SPY 前二十大卡片一并下线）
SOURCES = [
    "sp500_constituents.json", "ndx_constituents.json",
    "ndx_top.json",
    "tech_table.json", "fin_table.json", "consumer_table.json", "luxury_table.json",
]

safe = lambda t: t.lower().replace(".", "-")

def collect():
    tickers = set()
    for name in SOURCES:
        p = DATA / name
        if not p.exists():
            continue
        rows = json.load(open(p)).get("rows", [])
        tickers.update(r["ticker"] for r in rows if r.get("ticker"))
    return sorted(tickers)

def fetch_one(sym):
    url = f"https://assets.parqet.com/logos/symbol/{urllib.parse.quote(sym)}?format=png&size=64"
    req = urllib.request.Request(url, headers={"User-Agent": "market-chronicle-logo-sync"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

def fetch(ticker):
    """404 时试 `.`→`-` 变体（parqet 与 yfinance 同款口味：BRK.B 要写成 BRK-B）。"""
    try:
        return fetch_one(ticker)
    except urllib.error.HTTPError as e:
        if e.code == 404 and "." in ticker:
            return fetch_one(ticker.replace(".", "-"))
        raise

def main():
    refresh = "--refresh" in sys.argv
    OUT.mkdir(exist_ok=True)
    tickers = collect()
    ok = skip = fail = 0
    for t in tickers:
        dest = OUT / f"{safe(t)}.png"
        if dest.exists() and not refresh:
            skip += 1
            continue
        try:
            data = fetch(t)
            if len(data) > 100:  # 空图/错误页不落盘
                dest.write_bytes(data)
                ok += 1
            else:
                fail += 1
        except Exception as e:
            fail += 1
            print(f"  ✗ {t}: {e}", file=sys.stderr)
        time.sleep(0.15)  # 礼貌限速
    print(f"logos: {ok} downloaded, {skip} skipped, {fail} failed, total {len(tickers)} tickers")

if __name__ == "__main__":
    main()
