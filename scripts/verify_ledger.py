#!/usr/bin/env python3
"""台账自核：把「当天发布过的值」与「今天重算的值」逐日对账。

为什么需要它：build_data.py 每天把整个序列从源头重算并全量覆盖 data/*.json。
也就是说数据文件本身不是台账——它是一份重算结果。真正的冻结记录是 git：
每天一个 commit 把当日发布的文件钉住。但在此之前从没有人把它读回来核对过，
于是 data/README.md 的「忠实转录·绝不悄悄覆盖历史」是一句无人验证的断言。

本脚本把断言变成每日机器核验：遍历 git 历史 → 建「每个日期首次发布的值」→
与当前文件 diff → 分类 → 写 data/ledger_audit.json。

分类（口径固定，勿随手改）：
  missing          发布过的交易日在今天的文件里整个不见了
  revised_live     该日发布时它就是序列最新点（=当场记的账），事后值被改
  revised_backfill 该日是随回填进来的（发布时不是最新点），事后值被改
「首次发布时是不是最新点」是区分 live 与 backfill 的唯一判据——不依赖任何
写死的 forward_start 常量，因为常量会撒谎，git 不会。

注意：只审计「点值型」字段。像 kindex_signals 的 fwd_to_date 是「信号至今」
收益，本来每天都变，审计它等于天天报假警，故 signals 文件不在审计范围内。
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 审计对象：文件 → 要逐日对账的点值型序列字段
TARGETS = {
    "data/leaps_gauge.json": ["vix1y", "expensiveness_3y", "vrp_main", "vrp_small"],
    "data/kindex.json": ["cnn", "vix", "k", "ndx", "spx"],
}


def git(*args) -> str:
    return subprocess.run(["git", "-C", REPO, *args],
                          capture_output=True, text=True, check=True).stdout


def commits(path: str) -> list[tuple[str, str]]:
    """该文件的全部 commit，最早在前 → [(短哈希, 提交日), ...]"""
    out = git("log", "--format=%h|%ad", "--date=short", "--reverse", "--", path).strip()
    return [tuple(line.split("|", 1)) for line in out.splitlines() if line]


def blob(sha: str, path: str) -> dict | None:
    """取某 commit 里的该文件；解析不了就跳过（早期 schema 可能不同）。"""
    try:
        return json.loads(git("show", f"{sha}:{path}"))
    except Exception:
        return None


def first_published(path: str, keys: list[str]) -> dict:
    """每个日期「首次发布」的值 + 出处。字段各自独立记首发，容忍 schema 后加字段。"""
    seen: dict[str, dict] = {}
    for sha, cdate in commits(path):
        d = blob(sha, path)
        if not d or "dates" not in d:
            continue
        dates, newest = d["dates"], d["dates"][-1]
        for i, dt in enumerate(dates):
            rec = seen.setdefault(dt, {
                "commit": sha, "committed_at": cdate,
                "live": dt == newest,          # 发布时它就是最新点 = 当场记的账
                "values": {},
            })
            for k in keys:
                col = d.get(k)
                if isinstance(col, list) and i < len(col):
                    rec["values"].setdefault(k, col[i])
    return seen


def audit_file(path: str, keys: list[str]) -> dict:
    full = os.path.join(REPO, path)
    cur = json.load(open(full, encoding="utf-8"))
    cols = {k: dict(zip(cur["dates"], cur[k])) for k in keys if k in cur}
    today = set(cur["dates"])

    hist = first_published(path, keys)
    divergences = []
    for dt, rec in sorted(hist.items()):
        if dt not in today:
            divergences.append({"date": dt, "field": "*", "kind": "missing",
                                "first_published": None, "now": None,
                                "commit": rec["commit"], "committed_at": rec["committed_at"]})
            continue
        for k, was in rec["values"].items():
            now = cols.get(k, {}).get(dt)
            if now != was:
                divergences.append({
                    "date": dt, "field": k,
                    "kind": "revised_live" if rec["live"] else "revised_backfill",
                    "first_published": was, "now": now,
                    "commit": rec["commit"], "committed_at": rec["committed_at"],
                })

    live_days = sorted(dt for dt, r in hist.items() if r["live"])
    return {
        "file": path,
        "fields": keys,
        "commits_scanned": len(commits(path)),
        "dates_covered": len(hist),
        "live_recorded_days": len(live_days),
        "live_range": [live_days[0], live_days[-1]] if live_days else None,
        "divergences": divergences,
        "counts": {
            "total": len(divergences),
            "missing": sum(d["kind"] == "missing" for d in divergences),
            "revised_live": sum(d["kind"] == "revised_live" for d in divergences),
            "revised_backfill": sum(d["kind"] == "revised_backfill" for d in divergences),
        },
    }


def previous_total() -> int | None:
    """上一次提交的审计总数。告警按「相比上次有没有新增」响，而不是按绝对数——
    否则存量分歧会每天叫一遍，变成狼来了（阈值由分布定，不由「今天想报警」定）。"""
    try:
        return json.loads(git("show", "HEAD:data/ledger_audit.json"))["total_divergences"]
    except Exception:
        return None


def main() -> int:
    reports = [audit_file(p, k) for p, k in TARGETS.items()]
    total = sum(r["counts"]["total"] for r in reports)
    prev = previous_total()
    delta = None if prev is None else total - prev

    out = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "what": "台账自核：git 里当日发布过的值 vs 今天重算的值。0 分歧=从未悄悄改写历史。",
        "policy": "data/README.md「修订政策」的机器核验；分歧不隐藏，逐条公开在此。",
        "total_divergences": total,
        "previous_total": prev,
        "delta": delta,
        "reports": reports,
    }
    dest = os.path.join(REPO, "data", "ledger_audit.json")
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    for r in reports:
        c = r["counts"]
        rng = f' live {r["live_range"][0]}→{r["live_range"][1]}' if r["live_range"] else ""
        print(f'{r["file"]}: commit={r["commits_scanned"]} 日期={r["dates_covered"]}'
              f' 当场记录={r["live_recorded_days"]}{rng}')
        print(f'   分歧 {c["total"]}（消失 {c["missing"]} / live改写 {c["revised_live"]}'
              f' / 回填段改写 {c["revised_backfill"]}）')
    print(f"→ data/ledger_audit.json  总分歧={total}  上次={prev}  新增={delta}")

    # 供 workflow 读取；告警由 notify_discord.py 发，此处永不 fail 构建
    # （构建失败会让站停更，比出现一处分歧更糟）
    if gh := os.environ.get("GITHUB_OUTPUT"):
        with open(gh, "a") as f:
            f.write(f"divergences={total}\n")
            f.write(f"delta={'' if delta is None else delta}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
