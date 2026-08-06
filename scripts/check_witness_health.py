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
import importlib.util
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
    # 🔴 2026-08-06 加：「持续测不到」多久算故障。
    # 病因见 check_archive_match 头注 —— unknown 此前永不升级，等于给攻击者
    # 留了一个「弄断探测源就能无声关掉警报」的开关，而 IA 的坏端点已免费替他按下。
    "stale_ok": 5,       # 某项连续 5 天没有成功过 → 由 unknown 升级为 bad
}
HEALTH_LOG = DATA / "health_log.jsonl"   # 每次 --record 追加一行，供「上次成功」判据用


ET = ZoneInfo("America/New_York")


def days_since(d: str, et: bool = False) -> int | None:
    """接受 2026-08-04 与 20260804 两种写法（链用前者，Wayback 时间戳用后者）。

    🔑 `et=True` 用于**日历日期**（交易日、提交日）—— 这些日子是按美东记的，
       而 `datetime.now(utc).date()` 在美东傍晚之后已经跨天，直接相减会把
       「昨天」读成「2 天前」。SLA 有 4 天余量所以从不误报，**但读数会骗人**，
       而「看起来对的错读数」正是家规里最危险的那一种量尺问题。
       2026-08-05 接线当天发现：`期权页` 一项按美东算显示 0 天，
       而同一天的 `链最后一行` 按 UTC 算显示 2 天 —— 同一份事实两个读数。
    `et=False`（默认）留给 Wayback 时间戳：那个本来就是 UTC，换成美东才是错的。
    """
    if not d:
        return None
    tz = ET if et else timezone.utc
    for cut, fmt in ((10, "%Y-%m-%d"), (8, "%Y%m%d")):
        try:
            t = datetime.strptime(d[:cut], fmt).date()
            return (datetime.now(tz).date() - t).days
        except ValueError:
            continue
    return None


def last_line_json(p: Path) -> dict | None:
    if not p.exists():
        return None
    lines = [l for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
    return json.loads(lines[-1]) if lines else None


def days_since_last_ok(name: str) -> int | None:
    """该体检项上次报 ok 距今几天（美东日历日）。查不到返回 None。

    数据来自 `data/health_log.jsonl`：daily 每天用 `--record` 追加一行并自提交
    （与 `anchor_wayback.py` 自提交锚定日志同一范式 —— 家规 §26 先用现成做法）。
    看门狗只读不写（它的权限就是 contents: read）。
    """
    if not HEALTH_LOG.exists():
        return None
    for line in reversed(HEALTH_LOG.read_text(encoding="utf-8").splitlines()):
        if not line.strip():
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if (rec.get("checks") or {}).get(name) == "ok":
            return days_since(rec.get("date", ""), et=True)
    return None


def escalate_if_stale(name: str, res: dict) -> dict:
    """unknown 可以短暂容忍，不能无限期 —— 超期即升 bad（2026-08-06 新规）。

    🔑 家规 §46 说「报测量失败和报绿一样危险」。此前**展示层**遵守了（显示 ❔），
       **升级层**没有：unknown 不管持续多久都不开 Issue、不发邮件，
       而看门狗的关闭判据是 `!= bad`，于是 unknown 还会把真告警自动关掉。
       实证：08-05 15:15 那次看门狗日志原文写着「✅ 体检已无异常项，自动关闭」，
       而当时「与存档逐字对账」从建成起一次都没成功过。
    ⇒ 只要某项连续 STALE 天没有 ok 过，就当故障处理。ok 会重置计数。
    """
    if res.get("status") != "unknown":
        return res
    age = days_since_last_ok(name)
    lim = SLA["stale_ok"]
    if age is None:
        # 没有任何成功记录：给日志本身留出建立期，按日志首行年龄判
        first = None
        if HEALTH_LOG.exists():
            for line in HEALTH_LOG.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    try:
                        first = days_since(json.loads(line).get("date", ""), et=True)
                    except json.JSONDecodeError:
                        pass
                    break
        if first is not None and first > lim:
            res = dict(res, status="bad",
                       detail=res["detail"] + f" · 🔴 建档 {first} 天以来从未成功过一次，按故障处理")
        return res
    if age > lim:
        res = dict(res, status="bad",
                   detail=res["detail"] + f" · 🔴 已连续 {age} 天没有成功过（上限 {lim}），按故障处理")
    return res


def check_chain_row() -> dict:
    row = last_line_json(CHAIN)
    if not row:
        return {"status": "bad", "detail": "ledger_hashes.jsonl 缺失或为空"}
    age = days_since(row["date"], et=True)      # 交易日按美东记
    return {"status": "ok" if age is not None and age <= SLA["chain_row"] else "bad",
            "detail": f"链最后一行 {row['date']}（{age} 天前）", "age": age}


def check_anchor_log() -> dict:
    if not ANCHOR_LOG.exists():
        # 🔴 这正是 08-04 之前的状态：文件从未存在过，而没有任何人发现
        return {"status": "bad", "detail": "anchor_log.jsonl 不存在 —— 锚定结果从未被留档"}
    rec = last_line_json(ANCHOR_LOG)
    age = days_since(rec.get("date", ""), et=True) if rec else None   # 同链，交易日
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
    """直接问 Internet Archive —— 不信任本地日志，独立复核一次。

    🔴 2026-08-06 重写（此项从建成起从未成功过一次，而没人发现）
    ━━ 病根：单探针，没有兜底 ━━
    旧实现只打 `__wb/sparkline`，而该端点已返回 498（实测多次确认）。
    `anchor_wayback.latest_snapshot` 早就有**两级探针**（sparkline → availability），
    所以它一直正常、每天记下真时间戳；本项自己另写了一份单级查询，就此永久失明。
    🔑 家规「一处判据只能有一个实现」—— 两份实现迟早分叉，这次分叉的代价是
       一个永远 unknown 的探测器，而 unknown 此前从不升级（见 escalate_if_stale）。
    ∴ 本项不再自己写查询，**直接复用那个已经带兜底的函数**（§26 先用现成做法）。

    ⚠️ 顺带记一次我自己的量尺错误：我曾用 `curl http://archive.org/wayback/available`
       实测得 HTTP 000，据此宣布「三个发现端点全死」。**协议错了** —— 同一端点走
       https 返回 200。判据：报「端点死了」之前，先确认自己用的 scheme 与代码里一致。
    """
    try:
        spec = importlib.util.spec_from_file_location(
            "_aw", str(ROOT / "scripts" / "anchor_wayback.py"))
        aw = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(aw)
        st, snap = aw.latest_snapshot(SITE_CHAIN_URL, retries=2)
    except Exception as e:
        return {"status": "unknown", "detail": f"探针执行失败：{str(e)[:60]}"}
    if st == "unknown":
        return {"status": "unknown", "detail": "两级探针都没答上来（IA 限流或端点变动）"}
    if st == "none" or not snap:
        return {"status": "bad", "detail": "Internet Archive 上查不到链头的任何快照"}
    last = snap.get("timestamp")
    age = days_since(last)          # Wayback 时间戳本就是 UTC，这里刻意不换美东
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
        # %cI 带时区偏移（CI 里是 +00:00）。**先换算到美东再取日期**：
        # 21:00 ET 的提交在 UTC 已是次日，直接切 [:10] 会让 age 变成负数。
        out = datetime.fromisoformat(out).astimezone(ET).strftime("%Y-%m-%d") if out else out
    except Exception as e:
        return {"status": "unknown", "detail": f"读 git 历史失败：{str(e)[:60]}"}
    if not out:
        return {"status": "unknown", "detail": "查不到 data/kindex.json 的提交记录"}
    age = days_since(out, et=True)
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
    age = days_since(str(d), et=True) if d else None    # data_date 是美东交易日
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
    ap.add_argument("--record", action="store_true",
                    help="把本次各项状态追加进 data/health_log.jsonl（只在 daily 用，供「上次成功」判据）")
    args = ap.parse_args()

    results = {name: escalate_if_stale(name, fn()) for name, fn in CHECKS.items()}
    bad = [n for n, r in results.items() if r["status"] == "bad"]
    unk = [n for n, r in results.items() if r["status"] == "unknown"]
    overall = "bad" if bad else ("unknown" if unk else "ok")

    if args.record:
        # 只记状态、不记 detail：detail 每天都不同，会让这份日志变成噪音
        rec = {"date": datetime.now(ET).strftime("%Y-%m-%d"),
               "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
               "overall": overall,
               "checks": {k: v["status"] for k, v in results.items()}}
        with open(HEALTH_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")

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
