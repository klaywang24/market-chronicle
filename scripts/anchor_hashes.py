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

只追加、绝不重写历史行：JSONL 每天一行，主键 date。

━━ 🔴 一处已被推翻的旧判断（2026-07-19 改正，别退回去）━━
本文件初版写着「绝不追溯补链，补出来的链是说法不是证据」。**那是把两种不同的保护
混成了一种**：

    向后：证明旧数据在当年是什么   → 补链**确实做不到**，这点没错
    向前：检测**未来**有人改旧数据 → 补链**做得到**，而旧判断把它免费放弃了

一条事后生成的哈希，一旦公开并锚定，**从那一刻起**任何对历史语料的改动都变得可检测。
它证明不了过去，但能**冻结现在**。而站上承诺「旧行不动、绝不悄悄覆盖」——
**承诺了却没有机制能证明它没被覆盖**，这是自相矛盾。

∴ 真正该绝不做的是「**把事后生成的东西当成当时的证据**」，而不是「绝不生成」。
区别在于**有没有标清楚它是什么** → 见 --genesis：记录自带 proves / does_not_prove 两栏。

用法：python3 scripts/anchor_hashes.py            # 每日：追加一行
      python3 scripts/anchor_hashes.py --genesis  # 一次性：冻结既有全部语料
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


def genesis() -> int:
    """一次性创世快照：把**当前 data/ 下全部 JSON** 哈希一次，进链。

    ⚠️ 它 **不证明** 这些值在本日之前是什么——那需要当时就锚定，事后无法补。
    它 **只使此后的任何改动可被检测**。两栏 proves / does_not_prove 随记录一起走，
    因为用的人看得到数据、未必看得到文档（同 --verify 自带局限声明的道理）。
    """
    rows = read_chain()
    if any(r.get("kind") == "genesis_snapshot" for r in rows):
        print("创世快照已存在，不重做（重做 = 重写历史）")
        return 0
    files = {p.name: sha256_file(p) for p in sorted(DATA.glob("*.json"))}
    if not files:
        print("data/ 下没有 JSON")
        return 1
    prev = rows[-1]["chain"] if rows else GENESIS
    rec = {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "kind": "genesis_snapshot",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "proves": "自本记录被公开锚定之时起，对以下任一文件的任何改动都可被检测。",
        "does_not_prove": "不证明这些值在本日之前是什么。事后生成的哈希无法回溯证明历史；"
                          "早于本记录的数据其可信度依赖 git 历史与 Wayback，不依赖本快照。",
        "files": files,
        "prev": prev,
        "chain": chain_value(prev, files),
    }
    with open(CHAIN, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"→ 创世快照：{len(files)} 个文件，链头 {rec['chain'][:16]}…")
    print("  ⚠️ 它冻结现在，不证明过去——两栏 proves/does_not_prove 已随记录落盘")
    return 0


def main() -> int:
    if "--verify" in sys.argv:
        return verify()
    if "--genesis" in sys.argv:
        return genesis()

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
