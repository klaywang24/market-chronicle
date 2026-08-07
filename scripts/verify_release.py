#!/usr/bin/env python3
"""发版前独立复算（2026-08-04 新建，Klay 定为发版必过闸；2026-08-07 大修）。

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

━━ 2026-08-07 大修：三个实测漏洞（另一会话用负向样本抓到的，全部复现属实）━━
旧版只验「链末行登记的文件」，而 7 月链末行只覆盖 7 个文件、MANIFEST 列了 10 个：
  负① 篡改 leaps.json（不在链里）      → 旧版照样 ✅
  负② MANIFEST.cut_at_commit 改成别的  → 旧版只查「有没有」不查「是不是」，照样 ✅
  负③ 塞一个 manifest 之外的成员        → 旧版根本不看成员表，照样 ✅
∴ 新增四类检查：MANIFEST.files 逐个验哈希；zip 成员集与声明集精确相等（含重名走私检测）；
  链末行 ⊆ MANIFEST 且哈希一致；可选 --expect-month / --expect-cut 把包钉死在
  「这个月、这个 commit」上（CI 必传；人工验包可不传）。
🔑 原则：**链保护的是历史，MANIFEST 保护的是这个包** —— 两层缺一不可，
   不在链里的文件（如当时未入链的 leaps.json）由 MANIFEST 这层兜住。

用法：
    python3 scripts/verify_release.py dist/kapx-ledger-2026-07.zip
    python3 scripts/verify_release.py <zip> --expect-month 2026-07 --expect-cut <sha>
失败即非零退出，monthly-release.yml 在 publish 之前跑它。
"""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

GENESIS = "0" * 64
# 包里除 data/* 之外允许且必须存在的顶层成员（多一个少一个都算异常）
TOP_MEMBERS = {"VERIFY.md", "MANIFEST.json", "LICENSE"}


def chain_value(prev: str, files: dict) -> str:
    """完全照 VERIFY.md 印出来的那段，从零手写。不 import 项目代码。"""
    canon = json.dumps(files, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256((prev + canon).encode("utf-8")).hexdigest()


def main(argv: list[str]) -> int:
    args = argv[1:]
    expect_month = expect_cut = None
    pos: list[str] = []
    i = 0
    while i < len(args):
        if args[i] == "--expect-month":
            expect_month = args[i + 1]; i += 2
        elif args[i] == "--expect-cut":
            expect_cut = args[i + 1]; i += 2
        else:
            pos.append(args[i]); i += 1
    if len(pos) != 1:
        print("用法: verify_release.py <bundle.zip> [--expect-month M] [--expect-cut SHA]")
        return 2
    zp = Path(pos[0])
    if not zp.exists():
        print(f"🔴 找不到 {zp}")
        return 1

    z = zipfile.ZipFile(zp)
    names = [n for n in z.namelist() if not n.endswith("/")]
    root = z.namelist()[0].split("/")[0] + "/"
    fails: list[str] = []

    # -1) 重名走私检测：zip 允许同名成员并存，读取时后者遮蔽前者 ——
    #     负向样本正是用「追加同名成员」伪造的。重名 = 必然有诈，直接拒。
    if len(names) != len(set(names)):
        dupes = sorted({n for n in names if names.count(n) > 1})
        fails.append(f"zip 内有重名成员（走私特征）：{dupes}")

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

    # 2) MANIFEST：这个包的完整契约。逐文件验哈希 —— 链没覆盖的文件靠这层兜住
    mf = json.loads(z.read(root + "MANIFEST.json"))
    mf_files: dict = mf.get("files", {})
    if not mf_files:
        fails.append("MANIFEST.files 为空 —— 包内容完全不受约束")
    for name, want in sorted(mf_files.items()):
        try:
            got = hashlib.sha256(z.read(root + "data/" + name)).hexdigest()
        except KeyError:
            fails.append(f"MANIFEST 声明了 {name} 但包里没有")
            continue
        if got != want:
            fails.append(f"{name} 字节与 MANIFEST 登记的哈希不符")

    # 3) 成员集精确相等：声明的都在（上面查了），包里的都被声明 —— 拒绝任何偷塞
    declared = {root + "data/" + n for n in mf_files} | {root + t for t in TOP_MEMBERS}
    extra = sorted(set(names) - declared)
    if extra:
        fails.append(f"包里有 MANIFEST 未声明的成员：{extra}")

    # 4) 链末行 ⊆ MANIFEST 且哈希一致：两层证据必须说同一件事
    last = rows[-1] if rows else {"files": {}}
    for name, want in last["files"].items():
        if name not in mf_files:
            fails.append(f"链末行登记了 {name} 但 MANIFEST 没有")
        elif mf_files[name] != want:
            fails.append(f"{name} 在链末行与 MANIFEST 里哈希不一致")

    # 5) MANIFEST 自洽 + 与调用方期望绑定（月份、月末 commit）
    if rows and mf.get("chain_head") != rows[-1]["chain"]:
        fails.append("MANIFEST.chain_head 与链末行不一致")
    cut = mf.get("cut_at_commit") or ""
    if not cut:
        fails.append("MANIFEST 缺 cut_at_commit（无法证明这是月末那一刻的字节）")
    if expect_month and mf.get("month") != expect_month:
        fails.append(f"MANIFEST.month={mf.get('month')}，但本次发布的是 {expect_month}")
    if expect_cut and not (cut.startswith(expect_cut) or expect_cut.startswith(cut)):
        fails.append(f"MANIFEST.cut_at_commit={cut[:10]}，但本次算出的月末 commit 是 {expect_cut[:10]}")

    print(f"独立复算 {zp.name}：链 {len(rows)} 行"
          + (f"（{rows[0]['date']} → {rows[-1]['date']}）" if rows else ""))
    if fails:
        for f in fails:
            print(f"  🔴 {f}")
        print(f"\n🔴 {len(fails)} 项不符，拒绝发版")
        return 1
    bound = (f"、且已钉死在 {expect_month} @ {expect_cut[:10]}" if expect_month and expect_cut else
             "（⚠️ 未传 --expect-*，未与具体月份/commit 绑定）")
    print(f"  ✅ 链自洽、MANIFEST 全部 {len(mf_files)} 个文件哈希吻合、成员集精确相等、"
          f"链⊆MANIFEST 一致、VERIFY.md 公式与独立实现一致{bound}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
