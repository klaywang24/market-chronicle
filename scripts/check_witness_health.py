#!/usr/bin/env python3
"""见证链体检（2026-08-04 新建）。一条命令回答：这条证据链现在健康吗？

━━ 为什么必须单独存在 ━━
2026-08-04 查出：链头的 Wayback 快照从 08-01 起断了三天，**而 CI 每天照报成功**。
修完锚定逻辑后我加了 `::warning::` —— 然后意识到自己重建了 7·12 那次管线死 4 天的
同一个失败模式：**告警只 print 进 Actions 日志，而没人每天读日志**。
**没有送达通道的告警等于没有告警。**

∴ 本脚本是「判断」，送达交给两条独立通道：
  ① daily.yml 内：结果进 GITHUB_ENV → notify_discord.py 推 Discord（当天可见）
  ② witness-watchdog.yml：**独立 workflow、独立时刻**，不健康就开/更 GitHub Issue
     （Issue 会自动发邮件、且不会像日志一样被冲掉）

🔑 ② 必须独立，因为 ① 有个致命前提：**daily.yml 自己还活着**。
   7·12 那次正是 daily 整个死掉、于是「失败告警」也一起没了。
   所以体检项里有一条专查「daily 是不是已经不跑了」—— 看守看守人的那一层。

判据分三档（家规 §46：报「测量失败」和报绿一样危险）：
  ok / bad / unknown —— unknown 不算健康也不算故障，但必须说出来。

用法：
    python3 scripts/check_witness_health.py            # 人读
    python3 scripts/check_witness_health.py --json     # 机器读
不健康时非零退出。
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CHAIN = DATA / "ledger_hashes.jsonl"
ANCHOR_LOG = DATA / "anchor_log.jsonl"
SITE_CHAIN_URL = "https://chronicle.klay-wang.com/data/ledger_hashes.jsonl"

# 各项容忍天数。写在一处，别散在判断里。
SLA = {
    "chain_row": 4,      # 链最后一行（容忍周末 + 一个假日）
    "anchor_log": 4,     # 锚定日志最后一条
    "snapshot": 3,       # 链头的 Wayback 快照
    "daily_run": 4,      # daily 最后一次提交数据（看守看守人）
    "options_page": 4,   # 期权页数据（本机 launchd 产、推上来的，见 check_options_page）
}


def days_since(d: str) -> int | None:
    """接受 2026-08-04 与 20260804 两种写法（链用前者，Wayback 时间戳用后者）。"""
    if not d:
        return None
    for cut, fmt in ((10, "%Y-%m-%d"), (8, "%Y%m%d")):
        try:
            t = datetime.strptime(d[:cut], fmt).replace(tzinfo=timezone.utc)
            return (datetime.now(timezone.utc) - t).days
        except ValueError:
            continue
    return None


def last_line_json(p: Path) -> dict | None:
    if not p.exists():
        return None
    lines = [l for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
    return json.loads(lines[-1]) if lines else None


def check_chain_row() -> dict:
    row = last_line_json(CHAIN)
    if not row:
        return {"status": "bad", "detail": "ledger_hashes.jsonl 缺失或为空"}
    age = days_since(row["date"])
    return {"status": "ok" if age is not None and age <= SLA["chain_row"] else "bad",
            "detail": f"链最后一行 {row['date']}（{age} 天前）", "age": age}


def check_anchor_log() -> dict:
    if not ANCHOR_LOG.exists():
        # 🔴 这正是 08-04 之前的状态：文件从未存在过，而没有任何人发现
        return {"status": "bad", "detail": "anchor_log.jsonl 不存在 —— 锚定结果从未被留档"}
    rec = last_line_json(ANCHOR_LOG)
    age = days_since(rec.get("date", "")) if rec else None
    if age is None:
        return {"status": "unknown", "detail": "anchor_log 最后一条无法解析日期"}
    if age > SLA["anchor_log"]:
        return {"status": "bad", "detail": f"锚定日志最后一条 {rec['date']}（{age} 天前）", "age": age}
    head = (rec.get("results") or [{}])[0]
    if head.get("probe") == "unknown":
        return {"status": "unknown", "detail": f"{rec['date']} 那次未能查证链头快照（IA 限流）"}
    if not head.get("within_sla"):
        return {"status": "bad",
                "detail": f"链头快照已 {head.get('confirmed_age_days')} 天前，超 SLA"}
    return {"status": "ok",
            "detail": f"{rec['date']} 锚定正常，链头快照 {head.get('timestamp')}"}


def check_snapshot_live() -> dict:
    """直接问 Internet Archive —— 不信任本地日志，独立复核一次。"""
    q = ("https://web.archive.org/__wb/sparkline?output=json&collection=web&url="
         + urllib.parse.quote(SITE_CHAIN_URL, safe=""))
    try:
        req = urllib.request.Request(q, headers={"User-Agent": "market-chronicle-health/1.0"})
        with urllib.request.urlopen(req, timeout=45) as r:
            d = json.loads(r.read().decode("utf-8", "replace"))
    except Exception as e:
        return {"status": "unknown", "detail": f"查证失败（多半是 IA 限流）：{str(e)[:60]}"}
    last = d.get("last_ts")
    if not last:
        return {"status": "bad", "detail": "Internet Archive 上查不到链头的任何快照"}
    age = days_since(last)
    return {"status": "ok" if age is not None and age <= SLA["snapshot"] else "bad",
            "detail": f"链头最近快照 {last}（{age} 天前）", "age": age}


def check_daily_alive() -> dict:
    """看守看守人：daily 是不是已经不跑了。

    7·12→14 那次是 daily 整个死掉 4 天没人发现 —— 那种情况下，
    任何写在 daily 内部的告警都不会响。所以这一项必须从**产物**倒推，
    而不是从「有没有收到失败通知」倒推。
    """
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cI", "--", "data/kindex.json"],
            cwd=ROOT, capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception as e:
        return {"status": "unknown", "detail": f"读 git 历史失败：{str(e)[:60]}"}
    if not out:
        return {"status": "unknown", "detail": "查不到 data/kindex.json 的提交记录"}
    age = days_since(out[:10])
    return {"status": "ok" if age is not None and age <= SLA["daily_run"] else "bad",
            "detail": f"daily 最后一次更新数据 {out[:10]}（{age} 天前）", "age": age}


def check_archive_match() -> dict:
    """与第三方存档逐字对账 —— 唯一能挡住「全链重造」的一项（2026-08-05 渗透审计后加）。

    其余各项检查的都是「内部自洽」：攻击者拿到写权限后把整条链从创世重算一遍，
    verify_ledger / anchor_hashes / 快照新鲜度三项**全部放行**（实测推演）。
    只有把 Wayback 存的旧内容下下来逐字比，才会现形。
    Wayback 的内容攻击者改不了 —— 这就是「第三方见证」四个字真正兑现的地方。
    """
    try:
        out = subprocess.run([sys.executable, str(ROOT / "scripts" / "verify_against_archive.py")],
                             cwd=ROOT, capture_output=True, text=True, timeout=180)
    except Exception as e:
        return {"status": "unknown", "detail": f"对账脚本执行失败：{str(e)[:60]}"}
    tail = [l for l in out.stdout.strip().splitlines() if l.strip()]
    last = tail[-1] if tail else ""
    if out.returncode != 0:
        return {"status": "bad", "detail": "🔴 已发布的历史与第三方存档不符 —— " + last[:90]}
    if "未能" in out.stdout or "没测到" in out.stdout:
        return {"status": "unknown", "detail": "本次未能取得存档（IA 限流）"}
    return {"status": "ok", "detail": last[:90]}


def check_options_page() -> dict:
    """期权页数据是否还在更新（2026-08-05 接线当天加）。

    ━━ 为什么这一项属于「见证链体检」而不是别处 ━━
    表面上它查的是一个页面的数据新鲜度，实际上它是**整条本机链路的唯一送达通道**。
    这份 JSON 由本机 launchd（`com.klay.eod-scan`）在收盘后生成并 push 上来，
    途中任何一环断掉都会让它停止更新：launchd 挂了 / 生成器抛异常 / 站仓 push
    凭据失效 / rebase 冲突留在本地。**这些全发生在 CI 之外，GitHub 一侧完全看不见。**
    ∴ 唯一能发现它们的办法就是从**产物**倒推 —— 与 `check_daily_alive` 同一手法：
    不问「有没有收到失败通知」（那要求失败方还活着），只问「东西多久没更新了」。
    🔑 家规：没有送达通道的告警等于没有告警。本项就是那条通道。

    判据用 `meta.data_date`（数据对应的交易日）而不是 `generated_at`：
    重跑一次旧数据会刷新 generated_at 却不代表页面变新了 —— **那正是最该被抓住的假绿**。
    """
    p = DATA / "options_page.json"
    if not p.exists():
        return {"status": "bad", "detail": "options_page.json 不存在 —— 期权页无数据可读"}
    try:
        meta = json.loads(p.read_text(encoding="utf-8")).get("meta") or {}
    except Exception as e:
        return {"status": "bad", "detail": f"options_page.json 解析失败：{str(e)[:60]}"}
    d = meta.get("data_date")
    # ⚠️ 这里刻意不用 days_since()：它按 UTC 今天算，而 data_date 是**美东交易日**。
    #    两把尺子不同源 ⇒ 美东傍晚之后 UTC 已跨天，昨天的数据会被读成「2 天前」。
    #    SLA=4 掩得住，不会误报，但读数会让人以为漏了一天 —— 量尺不同源就先对齐再比。
    age = None
    if d:
        try:
            t = datetime.strptime(str(d)[:10], "%Y-%m-%d").date()
            age = (datetime.now(ZoneInfo("America/New_York")).date() - t).days
        except ValueError:
            age = None
    if age is None:
        return {"status": "unknown", "detail": "meta.data_date 缺失或无法解析"}
    prov = "（盘中临时读数）" if meta.get("provisional") else ""
    return {"status": "ok" if age <= SLA["options_page"] else "bad",
            "detail": f"期权页数据 {d}{prov}（{age} 天前）", "age": age}


CHECKS = {
    "链最后一行": check_chain_row,
    "锚定日志": check_anchor_log,
    "链头快照(直接问IA)": check_snapshot_live,
    "与存档逐字对账": check_archive_match,
    "daily是否还活着": check_daily_alive,
    "期权页是否在更新": check_options_page,
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    results = {name: fn() for name, fn in CHECKS.items()}
    bad = [n for n, r in results.items() if r["status"] == "bad"]
    unk = [n for n, r in results.items() if r["status"] == "unknown"]
    overall = "bad" if bad else ("unknown" if unk else "ok")

    if args.json:
        print(json.dumps({"overall": overall, "bad": bad, "unknown": unk,
                          "checks": results}, ensure_ascii=False, indent=1))
    else:
        icon = {"ok": "✅", "bad": "🔴", "unknown": "❔"}
        for n, r in results.items():
            print(f"  {icon[r['status']]} {n:<20} {r['detail']}")
        print(f"\n总体：{icon[overall]} {overall}"
              + (f"（异常：{'、'.join(bad)}）" if bad else "")
              + (f"（未测到：{'、'.join(unk)}）" if unk else ""))
    return 1 if overall == "bad" else 0


if __name__ == "__main__":
    sys.exit(main())
