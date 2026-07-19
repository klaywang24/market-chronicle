#!/usr/bin/env python3
"""哈希链锚定（2026-07-18 新建）：让「这份数据确实是那天记的」十年后仍可被外人验证。

━━ 按买家尽调倒推的设计 ━━
假设十年后有人要买这份数据，他会问四个问题。本文件逐一回答：

  ① 「证明它在 D 日就存在」      → 当日的 sha256 进了当天的公开 commit
  ② 「证明此后没被改过」          → 改任何一天，该日 hash 变 → 链断
  ③ 「证明你没偷偷删掉难看的天」  → **这条是哈希链存在的全部理由**。
       独立的每日哈希挡不住删除：删掉几天，剩下的哈希照样全部验证通过。
       链把每天绑在前一天上（chain_n = sha256(chain_{n-1} + 当日文件哈希)），
       **删任何一天，其后所有 chain 值全部对不上** —— 删除变成可检测的。
  ④ 「我买的到底是什么」          → 每行记了文件名与逐文件哈希，schema 自解释

🔑 **本文件不发布数据，只发布证据。** 私有数据将来也能用同一条链
（把它的 sha256 塞进 files 即可），**数据本身不必公开** —— 买家拿到数据自己算一遍
哈希对上公开记录就完成验证，他不需要信你，他验哈希。

🔑 **第三方见证才是效力来源。** git 日期本地可伪造（`git commit --date=` 一行的事）；
真正改不了的是「公开推送后被 Wayback 存档」这个社会事实。∴ daily.yml 里锚定步
必须把本文件也存进 Wayback，缺了那一步，这条链只是自己给自己盖章。

只追加、绝不重写历史行：JSONL 每天一行，主键 date。改动本文件的口径 = 另起新链，
绝不追溯重算（重算 = 把「证据」变成「说法」）。

用法：python3 scripts/anchor_hashes.py            # 每日：追加一行
      python3 scripts/anchor_hashes.py --verify   # 买家/自己：全链核验
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CHAIN = DATA / "ledger_hashes.jsonl"

# 纳入链的文件 = 构成资产的那些台账。加新文件只能往后加，绝不改既有条目的口径。
TRACKED = ["kindex.json", "leaps_gauge.json", "vol_family.json",
           "short_flow.json", "kindex_signals.json", "ledger_audit.json"]
GENESIS = "0" * 64


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for blk in iter(lambda: f.read(1 << 20), b""):
            h.update(blk)
    return h.hexdigest()


def chain_value(prev: str, files: dict) -> str:
    """链值 = sha256(前一链值 + 规范化的当日文件哈希表)。
    规范化 = 按文件名排序 + 紧凑 JSON，保证任何机器上逐字节可复现。"""
    canon = json.dumps(files, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256((prev + canon).encode("utf-8")).hexdigest()


def read_chain() -> list:
    if not CHAIN.exists():
        return []
    out = []
    for line in CHAIN.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            out.append(json.loads(line))
    return out


def verify() -> int:
    rows = read_chain()
    if not rows:
        print("链为空")
        return 0
    prev, bad = GENESIS, 0
    for i, r in enumerate(rows):
        want = chain_value(prev, r["files"])
        if r.get("prev") != prev:
            print(f"🔴 第 {i+1} 行（{r['date']}）prev 对不上：链在此断裂")
            bad += 1
        if r.get("chain") != want:
            print(f"🔴 第 {i+1} 行（{r['date']}）chain 重算不符：该行或其之前被改过")
            bad += 1
        prev = r.get("chain") or want
    print(f"{'✅' if bad == 0 else '🔴'} 全链 {len(rows)} 行，{'完整无断裂' if bad == 0 else f'{bad} 处异常'}")
    print(f"   起于 {rows[0]['date']} · 止于 {rows[-1]['date']} · 链头 {rows[-1]['chain'][:16]}…")
    if bad == 0:
        print("   ⚠️ 链自洽只证明「没被内部改过」；**证明「那天就存在」要靠 Wayback 的独立快照**")
    return 1 if bad else 0


def main() -> int:
    if "--verify" in sys.argv:
        return verify()

    rows = read_chain()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if rows and rows[-1]["date"] == today:
        print(f"{today} 已在链上，跳过（只追加，绝不重写历史行）")
        return 0

    files = {}
    for name in TRACKED:
        p = DATA / name
        if p.exists():
            files[name] = sha256_file(p)
    if not files:
        print("没有可锚定的文件，放弃（宁可不写，也不写半真的行）")
        return 1

    prev = rows[-1]["chain"] if rows else GENESIS
    rec = {
        "date": today,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "files": files,
        "prev": prev,
        "chain": chain_value(prev, files),
    }
    with open(CHAIN, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"→ ledger_hashes.jsonl 追加 {today}：{len(files)} 个文件，链头 {rec['chain'][:16]}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
