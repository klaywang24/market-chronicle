#!/usr/bin/env python3
"""与第三方存档逐字对账（2026-08-05 新建，堵住渗透审计发现的最后一个洞）。

━━ 为什么必须有它：一次攻击者视角审计的产物 ━━
2026-08-05 以「我是拿到你 GitHub 凭据的攻击者」的角度全面推演，发现一条能穿透
全部四道自动防线的路径：

  攻击 A（改一天、重算那一行的 chain）：后续行 prev 断裂 → anchor_hashes --verify 报红 ✅挡住
  攻击 B（**全链重造**：改数据后把整条链从创世重新算一遍）：
     · verify_ledger  过 ✅ —— 它比对的是 git 历史，而历史同样被强推改写了
     · anchor_hashes --verify 过 ✅ —— 链内部完全自洽，它只检查自洽
     · check_witness_health 过 ✅ —— 它只问 Wayback「有没有近期快照」，
       **从不下载快照内容与本地链头比对**
     · 看门狗全绿、Discord 平安播报、Issue 不开
  ⇒ 四道防线全部放行。唯一能戳穿攻击 B 的动作，此前只存在于「人想起来手动去查」。

**而 Wayback 快照恰恰是解药**：它存的是当天那份 ledger_hashes.jsonl 的**真实内容**，
攻击者改不了 Internet Archive。把它下下来逐字比对，攻击 B 立刻现形。
本脚本就是把「人想起来手动做」变成一道每天自动跑的闸。

🔑 家规印证：`anchor_hashes.py` 头注早写过「**第三方见证才是效力来源**」——
   但此前只做到了「让它被见证」，没做到「**回头核对见证的内容**」。
   见证若从不被回读，它就只是一次仪式。

判据分三档（家规 §46）：
  ok      —— 存档里的历史行与本地逐字一致（本地可以更长，那是正常追加）
  bad     —— **存档里存在、本地却不同或消失** = 历史被改写，这是最高级别告警
  unknown —— IA 限流/网络失败，本次没测到（不算通过也不算故障）

用法：
    python3 scripts/verify_against_archive.py            # 取最近一份存档比对
    python3 scripts/verify_against_archive.py --all      # 比对全部存档快照（慢，做深度审计时用）
    python3 scripts/verify_against_archive.py --file /tmp/x.jsonl   # 拿本地某文件当「本地版」测试
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHAIN = ROOT / "data" / "ledger_hashes.jsonl"
TARGET_URL = "https://chronicle.klay-wang.com/data/ledger_hashes.jsonl"
UA = "market-chronicle-archive-verify/1.0 (+https://chronicle.klay-wang.com)"


def _get(url: str, timeout: int = 60) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return -1, str(e)[:120]


def snapshot_timestamps(limit: int) -> list[str]:
    """列出该 URL 的存档时间戳（新→旧）。sparkline 端点实测比 availability 可靠。"""
    q = ("https://web.archive.org/__wb/sparkline?output=json&collection=web&url="
         + urllib.parse.quote(TARGET_URL, safe=""))
    code, body = _get(q, timeout=45)
    if code != 200 or not body:
        return []
    try:
        d = json.loads(body)
    except json.JSONDecodeError:
        return []
    # sparkline 只给 first/last；要全部时间戳走 CDX（限流更凶，故仅 --all 时才用）
    ts = [t for t in (d.get("last_ts"), d.get("first_ts")) if t]
    if limit <= len(ts):
        return ts[:limit]
    cdx = ("http://web.archive.org/cdx/search/cdx?output=json&fl=timestamp&limit=-40&url="
           + urllib.parse.quote(TARGET_URL, safe=""))
    code, body = _get(cdx, timeout=60)
    if code == 200 and body.strip().startswith("["):
        try:
            rows = json.loads(body)[1:]
            return sorted({r[0] for r in rows}, reverse=True)[:limit]
        except Exception:
            pass
    return ts


def fetch_archived(ts: str) -> list[dict] | None:
    """取该时间戳的存档内容。id_ 后缀 = 拿原始字节，不带 Wayback 注入的工具条。"""
    url = f"https://web.archive.org/web/{ts}id_/{TARGET_URL}"
    code, body = _get(url, timeout=60)
    if code != 200 or not body.strip():
        return None
    try:
        return [json.loads(l) for l in body.splitlines() if l.strip()]
    except json.JSONDecodeError:
        return None


def compare(archived: list[dict], local: list[dict]) -> tuple[str, list[str]]:
    """存档是历史的一个前缀快照：本地必须**逐字包含**它。

    本地更长 = 正常追加；本地更短或某行不同 = 历史被改写或被删。
    """
    problems: list[str] = []
    by_date = {r.get("date"): r for r in local}
    for a in archived:
        d = a.get("date")
        l = by_date.get(d)
        if l is None:
            problems.append(f"{d}：存档里有、**本地已消失**（删除历史）")
            continue
        for k in ("chain", "prev", "files"):
            if a.get(k) != l.get(k):
                problems.append(f"{d}：字段 `{k}` 与存档不符（历史被改写）")
                break
    return ("bad" if problems else "ok"), problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="比对全部存档快照（深度审计）")
    ap.add_argument("--file", help="用指定文件当本地版（测试用）")
    args = ap.parse_args()

    src = Path(args.file) if args.file else CHAIN
    if not src.exists():
        print(f"🔴 本地链文件不存在：{src}")
        return 1
    local = [json.loads(l) for l in src.read_text(encoding="utf-8").splitlines() if l.strip()]

    tss = snapshot_timestamps(40 if args.all else 1)
    if not tss:
        print("❔ 未能取得存档时间戳（多半是 Internet Archive 限流）——本次没测到，不代表通过")
        return 0                       # unknown 不算失败：量不到 ≠ 出事（与体检同一家规）

    checked = 0
    all_problems: list[str] = []
    for ts in tss:
        arch = fetch_archived(ts)
        if arch is None:
            print(f"  ❔ {ts} 存档取不到内容，跳过")
            time.sleep(2)
            continue
        st, probs = compare(arch, local)
        checked += 1
        mark = "✅" if st == "ok" else "🔴"
        print(f"  {mark} {ts} 存档 {len(arch)} 行 vs 本地 {len(local)} 行"
              + ("" if st == "ok" else f" —— {len(probs)} 处不符"))
        for p in probs[:6]:
            print(f"       · {p}")
        all_problems += probs
        time.sleep(2)

    if checked == 0:
        print("❔ 所有存档均取不到内容，本次未能核对")
        return 0
    if all_problems:
        print(f"\n🔴 与第三方存档对账失败：{len(all_problems)} 处不符。"
              "\n   这意味着**已公开发布过的历史被改写或删除** —— 最高级别告警，立即人工介入。")
        return 1
    print(f"\n✅ 与 {checked} 份第三方存档逐字一致；本地 {len(local)} 行（更长属正常追加）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
