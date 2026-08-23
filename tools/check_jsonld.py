#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JSON-LD 结构化数据闸（2026-08-23 建 · Klay 令）。

## 为什么有这道闸
2026-08-20 的 `c25a51e`「去掉可见文本里的直引号（32 对 · 5 页）」是**全文替换**，
把 JSON-LD 里的**结构性引号**也一并吃掉了：
    "name":"Market Chronicle 美股编年史"  →  "name":Market Chronicle 美股编年史
那些引号**根本不是可见文本**，但实现里「可见文本」这个限定词丢了。
index.html 一处坏 ⇒ 16 个路由页由它生成 ⇒ **全站 19 页 JSON-LD 全部非法**，
而 **没有任何闸发现**，一直到 3 天后 Google Search Console 发邮件
（「值类型不正确」·「严重问题会导致您的网页无法显示在 Google 搜索结果中」）才暴露。
⇒ 那三天里 §63 花大力气做的判重/canonical/Dataset 标注，Google 一个字都没读进去。

## 判据
每个 `<script type="application/ld+json">` 块必须 `json.loads` 通过。
🔑 **扫到 0 个块必须是红的**（§88：尺子没上膛 ≠ 仓里没结构化数据）。

用法：`python3 tools/check_jsonld.py` → 退出码 0=全绿、1=有非法块
自检：`python3 tools/check_jsonld.py --selftest`（一正两负三样本，零文件写入）
"""
import glob, json, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAT = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)


def scan(html):
    """返回 (块数, [错误串])。"""
    errs = []
    blocks = PAT.findall(html)
    for i, b in enumerate(blocks, 1):
        try:
            json.loads(b)
        except Exception as e:
            errs.append(f"块{i}: {type(e).__name__}: {e}")
    return len(blocks), errs


def selftest():
    ok = '<script type="application/ld+json">{"@type":"WebSite","name":"X"}</script>'
    bad = '<script type="application/ld+json">{"@type":"WebSite","name":X}</script>'   # 复刻 c25a51e 的伤
    cases = [
        ("正向 合法 JSON-LD 应放行", ok, 1, 0),
        ("负向1 值缺引号(c25a51e 原样) 应报红", bad, 1, 1),
        ("负向2 一个块都没有 应报红", "<html>无结构化数据</html>", 0, None),
    ]
    bad_case = False
    for name, html, want_n, want_err in cases:
        n, errs = scan(html)
        if want_err is None:                      # 零块由主流程判红，这里只验计数
            got = (n == 0)
            verdict = "✅" if got else "❌"
        else:
            got = (n == want_n and len(errs) == want_err)
            verdict = "✅" if got else "❌"
        if verdict == "❌":
            bad_case = True
        print(f"  {verdict} {name} → 块数 {n} · 非法 {len(errs)}")
    return 1 if bad_case else 0


def main():
    if "--selftest" in sys.argv:
        print("JSON-LD 闸自检（一正两负）：")
        return selftest()
    files = sorted(glob.glob(os.path.join(BASE, "*.html")))
    total_blocks, bad = 0, []
    for f in files:
        n, errs = scan(open(f, encoding="utf-8").read())
        total_blocks += n
        for e in errs:
            bad.append(f"{os.path.basename(f)} {e}")
    if total_blocks == 0:                          # §88：扫到 0 个必须红
        print("❌ 全仓一个 JSON-LD 块都没扫到 —— 尺子没上膛，不是仓里没有结构化数据")
        return 1
    if bad:
        print(f"❌ JSON-LD 非法 {len(bad)} 处（共扫 {len(files)} 页 / {total_blocks} 块）：")
        for b in bad[:20]:
            print("   " + b)
        print("   修法：JSON 字符串必须带双引号；改完重跑 scripts/build_route_pages.py 同步路由页")
        return 1
    print(f"✅ JSON-LD 全绿：{len(files)} 页 / {total_blocks} 块全部可解析")
    return 0


if __name__ == "__main__":
    sys.exit(main())
