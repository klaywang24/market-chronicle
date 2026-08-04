#!/usr/bin/env python3
"""Wayback 锚定（2026-08-04 重写，取代 daily.yml 里的内联 bash）。

━━ 为什么重写：内联版有三个叠加的 bug，一起把「效力来源」这层悄悄漏空了 ━━
2026-08-04 全盘扫描时实测发现，`ledger_hashes.jsonl`（链头）的 Wayback 快照
**8 次全在 7 月，最后一次 07-31 23:15**，而链已写到 08-03 —— 断了三天，
CI 却每天照报「锚定结果：成功 5/5」。三个原因缺一不可：

  A. `curl -sS URL -o /dev/null` **不带 -f**：HTTP 429/503 时 curl 退出码仍是 0
     （已实测），于是被限流计成成功。Internet Archive 对 SPN2 限流很凶。
  B. 锚定步排在 `commit data` **之后**，写完 `data/anchor_log.jsonl` runner 就销毁 ——
     注释里写的「随下次 commit 提交」永远不会发生，**该文件从未存在过一次**。
  C. 只记 ok/fail 计数，不记快照 URL 与时间戳 —— 十年后只能说「我调用过」，
     不能一秒证明「它存下来了」。

∴ 本脚本三条设计：
  1. **判据是「查得到快照」，不是「调用没报错」**。save 之后再查 availability API，
     记下真实的 archived_url + timestamp。调用成功但没存下来 = 失败。
     ⚠️ **但 SPN2 是异步的**（2026-08-04 实测：save 回 200，availability 仍是上一张快照）——
     存完立刻查几乎永远查到旧的。∴ 本步「保存今天、确认的是此前已完成的」，
     告警阈值按 STALE_DAYS 天算，**不按「今天有没有」算**：
     每天都响的告警等于没有告警（家规）。
  2. **链头排第一**。限流总是从循环后段开始咬，最重要的锚不能排在最后。
  3. **逐 URL 记录结构化结果**，且 daily.yml 里本步骤**自己提交自己的日志**
     （不能指望别人的 commit 带上它 —— 那正是 B 的成因）。

🔑 与 anchor_hashes.py 的分工：那边证明「没被改、也没被偷删」（自洽），
   这边证明「那天它确实被外人看见过」（他证）。**自洽可以整体重造，他证不能。**

用法：
    python3 scripts/anchor_wayback.py --sha <commit>     # CI
    python3 scripts/anchor_wayback.py --check-only       # 只查现状，不发起存档
"""
from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "data" / "anchor_log.jsonl"
SITE = "https://chronicle.klay-wang.com"
UA = "market-chronicle-anchor/1.0 (+https://chronicle.klay-wang.com)"

# 🔴 顺序即优先级：限流从后段开始咬，链头必须排第一。
#    改这个列表前先想清楚「如果今天只存得下一个，应该是哪个」。
def targets(sha: str | None) -> list[str]:
    t = [
        f"{SITE}/data/ledger_hashes.jsonl",   # 链头 —— 最重要，永远排第一
        f"{SITE}/data/kindex.json",
        f"{SITE}/",
        f"{SITE}/data/leaps_gauge.json",
    ]
    if sha:
        t.insert(1, f"https://github.com/klaywang24/market-chronicle/commit/{sha}")
    return t


def _get(url: str, timeout: int = 60) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:                      # 网络层失败也要能分辨，不能吞成 0
        return -1, str(e)[:120]


def save(url: str, retries: int = 3) -> int:
    """发起存档。返回 HTTP 状态码；429 退避重试。"""
    for i in range(retries):
        code, _ = _get("https://web.archive.org/save/" + url, timeout=90)
        if code != 429:
            return code
        time.sleep(20 * (i + 1))                # 20s / 40s / 60s
    return 429


def _probe_sparkline(url: str) -> tuple[str, dict | None]:
    """主探针：web.archive.org 的 sparkline。

    🔑 为什么用它而不是 archive.org/wayback/available（2026-08-04 实证换掉）：
    整晚交叉验证下来，**sparkline 每次都给出正确的 first_ts/last_ts**，
    而 availability 对同一个 URL 时而返回空（首页明明有 08-03 的快照却报「无」）、
    时而返回限流页。判据不是「哪个看起来更官方」，是**哪个每次都答对**。
    """
    q = ("https://web.archive.org/__wb/sparkline?output=json&collection=web&url="
         + urllib.parse.quote(url, safe=""))
    code, body = _get(q, timeout=45)
    if code != 200 or not body:
        return "unknown", None
    try:
        d = json.loads(body)
    except json.JSONDecodeError:
        return "unknown", None
    last = d.get("last_ts")
    if not last:
        return "none", None
    return "ok", {"archived_url": f"https://web.archive.org/web/{last}/{url}",
                  "timestamp": last, "first_ts": d.get("first_ts")}


def _probe_availability(url: str) -> tuple[str, dict | None]:
    """备用探针。保留它只是为了「两个都说没有」时更有把握，不作主判据。"""
    q = "https://archive.org/wayback/available?url=" + urllib.parse.quote(url, safe="")
    code, body = _get(q, timeout=45)
    if code != 200 or not body:
        return "unknown", None
    try:
        snap = json.loads(body).get("archived_snapshots", {}).get("closest")
    except json.JSONDecodeError:
        return "unknown", None
    if snap and snap.get("available"):
        return "ok", {"archived_url": snap.get("url"), "timestamp": snap.get("timestamp")}
    return "none", None


def latest_snapshot(url: str, retries: int = 3) -> tuple[str, dict | None]:
    """查真实快照，返回 (probe_status, snap)。

    🔴 **三档，不是两档**（2026-08-04 修）：初版把「查不到」和「没有」混成同一个 None，
    availability 被限流时会误报「无快照」。这是家规 §46「报『测量失败』和报绿一样危险」
    的同一形状：输出必须能分 **ok / none / unknown**。
    unknown 不算失败也不算成功 —— 它只说明这次没量到，不触发断供告警。
    """
    for i in range(retries):
        for probe in (_probe_sparkline, _probe_availability):
            st, snap = probe(url)
            if st == "ok":
                return st, snap
        if i < retries - 1:
            time.sleep(12 * (i + 1))
    # 两个探针都没给出 ok：再判一次到底是「都说没有」还是「都没测到」
    st1, _ = _probe_sparkline(url)
    return ("none", None) if st1 == "none" else ("unknown", None)


# 链头允许的最大失联天数。设 3 不设 1：SPN2 异步 + IA 时常限流，
# 按「今天有没有」判会天天误报，而**每周都响的警报等于没有警报**。
# 连续 3 天没有新快照才是真的断供 —— 这是要有人去看的信号。
STALE_DAYS = 3


def snapshot_age_days(snap: dict | None) -> int | None:
    if not snap or not snap.get("timestamp"):
        return None
    t = datetime.strptime(snap["timestamp"][:8], "%Y%m%d").replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - t).days


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sha", help="当日 commit SHA（同时锚定其 commit 页）")
    ap.add_argument("--check-only", action="store_true", help="只查现状不发起存档")
    args = ap.parse_args()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    results, fresh, stale, unknown = [], 0, 0, 0

    for u in targets(args.sha):
        code = None
        if not args.check_only:
            code = save(u)
            time.sleep(6)
        probe, snap = latest_snapshot(u)
        age = snapshot_age_days(snap)
        ok = age is not None and age <= STALE_DAYS
        if probe == "unknown":
            unknown += 1
        elif ok:
            fresh += 1
        else:
            stale += 1
        results.append({"url": u, "save_http": code, "probe": probe,
                        "confirmed_age_days": age, "within_sla": ok, **(snap or {})})
        mark = {"unknown": "❔", "none": "🔴"}.get(probe, "✅" if ok else "🟡")
        ts = (f"{snap['timestamp']}（{age} 天前）" if snap
              else ("这次没测到" if probe == "unknown" else "确实无快照"))
        print(f"  {mark} {u[-52:]:<52} save={code} 已确认快照={ts}")

    # ⚠️ 字段语义：save_http = 今天这次调用；confirmed_* = 此刻已完成并可查的快照，
    #    因 SPN2 异步，今天的那张通常要到下一次运行才会被确认。审计读 confirmed_*。
    rec = {"date": today, "sha": args.sha, "stale_days_sla": STALE_DAYS,
           "within_sla": fresh, "out_of_sla": stale, "not_probed": unknown,
           "results": results}
    if not args.check_only:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    head = results[0] if results else {}
    # 🔑 只有「测到了且超期」才算断供；「这次没测到」单独报，不冒充断供也不冒充正常。
    chain_bad = head and head.get("probe") != "unknown" and not head.get("within_sla")
    print(f"\n锚定：{fresh} 在 {STALE_DAYS} 天 SLA 内 / {stale} 超期 / {unknown} 未测到"
          f"（共 {len(results)}）")
    if unknown:
        print(f"::warning::{unknown} 个 URL 本次未能查证（Internet Archive 限流），"
              f"非断供、但本次结果不完整")
    if chain_bad:
        # 🔴 链头连续 STALE_DAYS 天没有新快照 = 独立见证真的断了。这条必须响。
        age = head.get("confirmed_age_days")
        print(f"::warning::链头 ledger_hashes.jsonl 最近快照已 {age} 天前"
              f"（SLA {STALE_DAYS} 天），独立见证断供")
    return 0                                     # 锚定失败不阻塞管线，但绝不静默


if __name__ == "__main__":
    raise SystemExit(main())
