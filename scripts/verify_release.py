#!/usr/bin/env python3
"""发版前独立复算（2026-08-04 新建，Klay 定为发版必过闸）。

━━ 为什么必须是「独立实现」 ━━
2026-08-03 出第一个包时，我给 VERIFY.md 写的链公式是
`sha256(prev + concat(sorted file hashes))` —— 而真实是
`sha256(prev + 按键排序的紧凑 JSON)`。**照那份说明去验，任何人都会得出「链断了」。**
发布一份错的验证方法，比不发验证方法更糟：它把可信度变成自证的反面。

∴ 本脚本**刻意不 import 项目里的任何模块**（不用 anchor_hashes、不用 make_release_bundle），
只照着 VERIFY.md 里印给外人看的那段公式，从零重写一遍。
🔑 判据：如果 VERIFY.md 写错了，本脚本就会**和项目代码算出不同的结果** —— 这正是它的价值。
   两边都用同一份实现就发现不了任何东西，那样的「自检」只是回声。

⚠️ 改本文件时，绝不允许「为了让它过就去 import 项目函数」。那一刻这道闸就死了。

用法：
    python3 scripts/verify_release.py dist/kapx-ledger-2026-07.zip
失败即非零退出，monthly-release.yml 在 publish 之前跑它。
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

GENESIS = "0" * 64


def chain_value(prev: str, files: dict) -> str:
    """完全照 VERIFY.md 印出来的那段，从零手写。不 import 项目代码。"""
    canon = json.dumps(files, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256((prev + canon).encode("utf-8")).hexdigest()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("用法: verify_release.py <bundle.zip>")
        return 2
    zp = Path(argv[1])
    if not zp.exists():
        print(f"🔴 找不到 {zp}")
        return 1

    z = zipfile.ZipFile(zp)
    root = z.namelist()[0].split("/")[0] + "/"
    fails: list[str] = []

    # 0) VERIFY.md 里那段公式必须与本脚本一致 —— 防的是「说明和实现漂移」
    verify_md = z.read(root + "VERIFY.md").decode("utf-8")
    for must in ['json.dumps(files, sort_keys=True, separators=(",", ":")',
                 'sha256((prev + canon)']:
        if must not in verify_md:
            fails.append(f"VERIFY.md 里找不到公式片段：{must}")

    # 1) 逐行重算链
    rows = [json.loads(l) for l in
            z.read(root + "data/ledger_hashes.jsonl").decode("utf-8").splitlines() if l.strip()]
    prev = GENESIS
    for i, r in enumerate(rows):
        if r.get("prev") != prev:
            fails.append(f"第 {i+1} 行（{r.get('date')}）prev 对不上，链在此断裂")
        want = chain_value(prev, r["files"])
        if r.get("chain") != want:
            fails.append(f"第 {i+1} 行（{r.get('date')}）chain 重算不符")
        prev = r.get("chain") or want

    # 2) 包内文件字节 == 链末行登记的哈希
    last = rows[-1] if rows else {"files": {}}
    for name, want in last["files"].items():
        try:
            got = hashlib.sha256(z.read(root + "data/" + name)).hexdigest()
        except KeyError:
            fails.append(f"链登记了 {name} 但包里没有")
            continue
        if got != want:
            fails.append(f"{name} 字节与链登记的哈希不符")

    # 3) MANIFEST 自洽
    mf = json.loads(z.read(root + "MANIFEST.json"))
    if rows and mf.get("chain_head") != rows[-1]["chain"]:
        fails.append("MANIFEST.chain_head 与链末行不一致")
    if not mf.get("cut_at_commit"):
        fails.append("MANIFEST 缺 cut_at_commit（无法证明这是月末那一刻的字节）")

    print(f"独立复算 {zp.name}：链 {len(rows)} 行"
          + (f"（{rows[0]['date']} → {rows[-1]['date']}）" if rows else ""))
    if fails:
        for f in fails:
            print(f"  🔴 {f}")
        print(f"\n🔴 {len(fails)} 项不符，拒绝发版")
        return 1
    print(f"  ✅ 链自洽、{len(last['files'])} 个文件哈希吻合、MANIFEST 自洽、VERIFY.md 公式与独立实现一致")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
