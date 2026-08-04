#!/usr/bin/env python3
"""月度台账快照包（2026-08-03 新建）：给哈希链再加一层「第三方登记的版本记录」。

━━ 为什么在已有哈希链 + Wayback 之后还要这个 ━━
现有三层各自回答一个问题：
  ① 哈希链（anchor_hashes.py）  「内容没被改、也没被偷偷删掉某几天」
  ② Wayback 每日锚（daily.yml） 「链头在那一天确实被外人看见过」
  ③ 本脚本 + GitHub Release     「某月的台账，被冻结成一个带外部时间戳的版本」

③ 补的是 ①② 都不给的东西：**一个可引用的版本号**。
链是流水，Wayback 是散点快照，两者都不方便别人写进论文/研报里的参考文献。
Release 的发布时间由 GitHub 服务端记录（本地 `git commit --date=` 伪造不了），
接上 Zenodo 后再换一个 DOI —— 到那一步，「十年后的买家尽调」才有个能落笔的东西。

🔑 本脚本只打包与描述，**不重算任何数值**。它对台账是只读的。
   任何「顺手修一下数据」的念头都不该写进这里：那会让版本包与链不一致，
   而版本包存在的全部意义就是与链一致。

用法：
    python3 scripts/make_release_bundle.py              # 上一个自然月
    python3 scripts/make_release_bundle.py --month 2026-07
产物：dist/kapx-ledger-<YYYY-MM>.zip + dist/RELEASE_NOTES-<YYYY-MM>.md
"""
from __future__ import annotations

import argparse
import hashlib
import json
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DIST = ROOT / "dist"

# 与 anchor_hashes.TRACKED 保持一致；此处独立列出而非 import，是因为两边的语义不同：
# 那边是「从今天起进链保护」，这边是「本月末的内容快照」。真要同步时人工对一次即可，
# 不一致也不会毁掉证据（链才是证据，包只是副本）。
LEDGER_FILES = [
    "kindex.json", "kindex_signals.json", "leaps.json", "leaps_gauge.json",
    "vol_family.json", "short_flow.json", "short_interest.json",
    "ledger_audit.json", "gauge_math.json",
]
CHAIN_FILES = ["ledger_hashes.jsonl", "anchor_log.jsonl"]


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for blk in iter(lambda: f.read(1 << 20), b""):
            h.update(blk)
    return h.hexdigest()


def prev_month(today: date) -> str:
    y, m = (today.year, today.month - 1) if today.month > 1 else (today.year - 1, 12)
    return f"{y:04d}-{m:02d}"


def read_chain() -> list[dict]:
    p = DATA / "ledger_hashes.jsonl"
    if not p.exists():
        return []
    return [json.loads(ln) for ln in p.read_text(encoding="utf-8").splitlines() if ln.strip()]


def verify_md(month: str, rows: list[dict], present: list[str]) -> str:
    head = rows[-1] if rows else {}
    first = rows[0] if rows else {}
    # ⚠️ 下面这段公式必须与 anchor_hashes.chain_value 逐字一致。
    # 2026-08-03 初稿写成 "concat(sorted file hashes)" 是错的（真实是「整张表的紧凑 JSON」），
    # 照那个算法验会得出「链断了」——发布一份错的验证方法，比不发验证方法更糟。
    # 改这里之前先 `sed -n '71,76p' scripts/anchor_hashes.py`。
    anchor_line = (
        "- `anchor_log.jsonl` records, per day, how many of that day's URLs were successfully saved\n"
        "  to the Internet Archive, and how many failed. Failures are logged on purpose: a missing\n"
        "  anchor should be knowable, not invisible.\n"
        if "anchor_log.jsonl" in present else
        "- Per-day anchoring results are logged in the repository as `data/anchor_log.jsonl`\n"
        "  (not included in this bundle if it had not yet been committed when this snapshot was cut).\n"
    )
    return f"""# How to verify this bundle

This archive is **evidence, not a data product**. Nothing here asks you to trust us.

## 1. The chain

`ledger_hashes.jsonl` has one append-only row per publication day:

```
{{"date": ..., "generated_at": ..., "files": {{"<name>": "<sha256>", ...}}, "prev": "<chain-1>", "chain": "<chain>"}}
```

The chain value is, exactly:

```python
canon = json.dumps(files, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
chain = sha256((prev + canon).encode("utf-8")).hexdigest()
```

starting from a genesis `prev` of 64 zeros. Note it hashes the **compact JSON of the whole
{{name: sha256}} map with keys sorted** — not a concatenation of the hash strings.

Recompute it yourself:

- For any row, sha256 the matching file in this bundle and compare with `files[<name>]`.
- Walk the file top to bottom and recompute every `chain` from its `prev`.
- **Deleting or editing any single day breaks every later `chain`.** That is the whole reason this
  is a chain rather than independent per-day hashes: independent hashes still validate perfectly
  after you quietly drop the days that look bad.

Chain state at the time of packaging ({month}):

- rows: **{len(rows)}**
- covers: **{first.get('date', 'n/a')} → {head.get('date', 'n/a')}**
- chain head: `{head.get('chain', 'n/a')}`

## 2. The external witnesses

A hash chain alone only proves internal consistency, and a chain can be fabricated in one sitting.
What makes it hard to backdate is that its head was **seen by someone else at the time**:

{anchor_line}- The daily commits are in the public GitHub history. A local git author date is forgeable
  (`git commit --date=`); the push time recorded by GitHub, and the Internet Archive snapshot,
  are not under our control. Prefer those two over the commit date.
- This release's publication timestamp is recorded by GitHub server-side.

## 3. What this does not prove

Two boundaries we would rather state than have someone find:

- **The chain starts {first.get('date', 'n/a')}, which is later than the site's launch.** Rows in the
  ledger dated before that are covered by the public commit history, but not by this chain.
- **Readings before the site's launch (July 2026) are backfill**, computed from public data with the
  published formula. They are independently reproducible by anyone, and they are *not* an ex-ante
  record. The chain keeps them from being silently edited; it does not age them.

## Files in this bundle

{chr(10).join(f'- `{n}`' for n in present)}
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--month", help="YYYY-MM，默认上一个自然月")
    ap.add_argument("--today", help="覆盖今天（测试用，YYYY-MM-DD）")
    args = ap.parse_args()

    today = date.fromisoformat(args.today) if args.today else date.today()
    month = args.month or prev_month(today)

    rows = read_chain()
    DIST.mkdir(exist_ok=True)

    present: list[str] = []
    for name in CHAIN_FILES + LEDGER_FILES:
        if (DATA / name).exists():
            present.append(name)
        else:
            # 缺文件不是致命错，但必须说出来：静默少打一个文件＝包与链对不上而没人知道
            print(f"  ⚠️ 缺 {name}，本包不含它")

    zip_path = DIST / f"kapx-ledger-{month}.zip"
    manifest = {"month": month, "packaged_from_chain_rows": len(rows),
                "chain_head": rows[-1]["chain"] if rows else None,
                "last_ledger_date": rows[-1]["date"] if rows else None,
                "files": {}}
    for name in present:
        manifest["files"][name] = sha256_file(DATA / name)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for name in present:
            z.write(DATA / name, f"kapx-ledger-{month}/data/{name}")
        z.writestr(f"kapx-ledger-{month}/VERIFY.md", verify_md(month, rows, present))
        z.writestr(f"kapx-ledger-{month}/MANIFEST.json", json.dumps(manifest, indent=2))
        z.write(ROOT / "LICENSE", f"kapx-ledger-{month}/LICENSE")

    head = rows[-1] if rows else {}
    first = rows[0] if rows else {}
    notes = f"""KAPX ledger snapshot — {month}

A frozen, citable copy of the public ledger, with the hash chain that makes silent edits and
silent deletions detectable. **Evidence, not a data product** — see `VERIFY.md` inside the zip
for how to check it yourself without trusting us.

| | |
|---|---|
| chain rows | {len(rows)} |
| chain covers | {first.get('date', 'n/a')} → {head.get('date', 'n/a')} |
| chain head | `{head.get('chain', 'n/a')}` |

**What this proves**: the packaged files hash to the values recorded in the chain, and no day can
be removed or altered without breaking every later `chain` value.

**What it does not prove**: the chain begins {first.get('date', 'n/a')}, later than the site's launch;
and readings before launch (July 2026) are reproducible backfill from public data, not an ex-ante
record. The chain keeps them from being silently edited; it does not age them.

Licensing follows the repository: the compilation, derived metrics and ledger structure are under
PolyForm Noncommercial 1.0.0; the underlying values are facts transcribed from public sources and
carry no ownership claim from us. The quarterly extracts on Kaggle / Hugging Face are separately
released under CC BY 4.0.
"""
    (DIST / f"RELEASE_NOTES-{month}.md").write_text(notes, encoding="utf-8")

    print(f"✅ {zip_path.relative_to(ROOT)}  （链 {len(rows)} 行，末日 {head.get('date','n/a')}）")
    print(f"✅ {(DIST / f'RELEASE_NOTES-{month}.md').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
