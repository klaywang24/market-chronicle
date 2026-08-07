#!/usr/bin/env python3
"""验收闸的自测：用负向样本证明 verify_release.py 真的会报红（2026-08-07 新建）。

━━ 为什么存在 ━━
2026-08-07 外部审计实测：旧验证器对「篡改包内文件」「改 cut_at_commit」「偷塞成员」
三种攻击**全部错误报绿** —— 闸存在了四天，闭环为零。人工负向测试只留在 commit
message 里，下一个改验证器的人不会重跑（§50②：全仓 grep 零处 run 的脚本是死的）。
∴ 本脚本进 CI：monthly-release 在发版前先跑它 —— **闸每次都要先证明自己没瞎**。

判据（§46 家规）：一个检查器被信任的前提，是它对已知的坏样本报红。
本脚本对着刚构建的真实包，现场制造 6 类坏样本，逐个喂给 verify_release.py：
任何一个被放行 ⇒ 本脚本非零退出 ⇒ 发版中止。

用法：
    python3 scripts/test_release_gate.py dist/kapx-ledger-<月>.zip <月> <CUT_SHA>
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERIFIER = ROOT / "scripts" / "verify_release.py"


def run_verifier(zp: Path, month: str | None, cut: str | None) -> int:
    cmd = [sys.executable, str(VERIFIER), str(zp)]
    if month:
        cmd += ["--expect-month", month]
    if cut:
        cmd += ["--expect-cut", cut]
    return subprocess.run(cmd, capture_output=True).returncode


def main(argv: list[str]) -> int:
    if len(argv) != 4:
        print("用法: test_release_gate.py <bundle.zip> <month> <cut_sha>")
        return 2
    src, month, cut = Path(argv[1]), argv[2], argv[3]
    if not src.exists():
        print(f"🔴 找不到 {src}")
        return 1

    with zipfile.ZipFile(src) as z:
        root = z.namelist()[0].split("/")[0]
        mf = json.loads(z.read(f"{root}/MANIFEST.json"))
    # 挑一个「链末行没登记、只有 MANIFEST 登记」的文件当靶子 —— 正是历史上溜过去的那类；
    # 若如今全部文件都已入链，退而取 MANIFEST 里任意一个（两层都该拦住）。
    with zipfile.ZipFile(src) as z:
        rows = [json.loads(l) for l in
                z.read(f"{root}/data/ledger_hashes.jsonl").decode().splitlines() if l.strip()]
    chain_files = set(rows[-1]["files"]) if rows else set()
    manifest_only = sorted(set(mf["files"]) - chain_files)
    target = (manifest_only or sorted(mf["files"]))[0]

    tmp = Path(tempfile.mkdtemp(prefix="gate_selftest_"))
    fails: list[str] = []
    try:
        # 正向：干净包 + 正确绑定，必须绿（会误拦的闸比没闸更糟，§50①）
        if run_verifier(src, month, cut) != 0:
            fails.append("正向：干净包被误拦")

        def variant(name: str, mutate) -> Path:
            dst = tmp / f"{name}.zip"
            shutil.copy(src, dst)
            mutate(dst)
            return dst

        def add_member(dst: Path, arcname: str, data: bytes) -> None:
            with zipfile.ZipFile(dst, "a") as z:
                z.writestr(arcname, data)

        # 负①：篡改包内文件（重名成员遮蔽原件 —— zip 走私的标准手法）
        neg = variant("tamper_file", lambda d: add_member(
            d, f"{root}/data/{target}", b'{"tampered": true}'))
        if run_verifier(neg, month, cut) == 0:
            fails.append(f"负①：篡改 {target} 被放行")

        # 负②：MANIFEST.cut_at_commit 指向别的提交
        mf2 = dict(mf, cut_at_commit="deadbeef" * 5)
        neg = variant("tamper_cut", lambda d: add_member(
            d, f"{root}/MANIFEST.json", json.dumps(mf2).encode()))
        if run_verifier(neg, month, cut) == 0:
            fails.append("负②：改 cut_at_commit 被放行")

        # 负③：偷塞 MANIFEST 之外的成员
        neg = variant("extra_member", lambda d: add_member(
            d, f"{root}/data/backdoor.json", b'{"evil": 1}'))
        if run_verifier(neg, month, cut) == 0:
            fails.append("负③：塞未声明成员被放行")

        # 负④：错月份　负⑤：错 commit（绑定参数这层）
        if run_verifier(src, "1999-01", cut) == 0:
            fails.append("负④：错月份被放行")
        if run_verifier(src, month, "0" * 40) == 0:
            fails.append("负⑤：错 cut_sha 被放行")

        # 负⑥：不传绑定参数时，篡改类照样得拦（MANIFEST 层不依赖参数）
        neg = tmp / "tamper_file.zip"
        if run_verifier(neg, None, None) == 0:
            fails.append("负⑥：无绑定参数时篡改被放行（MANIFEST 层失效）")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    n_ok = 7 - len(fails)
    if fails:
        for f in fails:
            print(f"  🔴 {f}")
        print(f"\n🔴 闸自测 {len(fails)}/7 失败 —— 验收闸自己瞎了，拒绝发版")
        return 1
    print(f"  ✅ 闸自测 {n_ok}/7：正向通过 + 六类坏样本全部报红（靶子={target}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
