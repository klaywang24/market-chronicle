# -*- coding: utf-8 -*-
"""禁词闸：「恐慌指数」只允许归属性用法（前面紧跟 VIX）。

为什么存在（2026-08-07 命名线定案，见 HANDOFF §58 / RULES.md）：
「恐慌指数」是 VIX 在中文世界的俗名。本站自称恐慌指数 = 把检索流量捐给 Cboe，
且与自家「恐惧的标价指数」撞名。裁定：**禁止用它指称本站的任何指数，
但允许归属性提及 VIX 本身**（例：行情条标签「VIX 恐慌指数」）——
后者反而与「恐惧的标价指数」并列形成消歧，是资产不是负债。

判据（机器可判，不靠自觉）：
    「恐慌指数」之前紧邻的 4 个字符里必须出现 "VIX"，否则报红。
    窗口取 4 是为了只放行紧邻修饰（"VIX "/"VIX（"/"VIX的"），
    而挡住「VIX 很高，恐慌指数也……」这类真违规。

用法：
    python3 tools/check_banned_terms.py        # 退出码 0=过 1=报红
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TERM = "恐慌指数"
ALLOW_WITHIN = 4      # 紧邻窗口（字符数）
ALLOW_ANCHOR = "VIX"  # 窗口内必须出现它


def targets():
    """对外可见的文本面：页面、脚本里的字符串、机器可读入口、仓库门面。"""
    for p in sorted(ROOT.glob("*.html")):
        yield p
    for p in sorted((ROOT / "js").glob("*.js")):
        yield p
    for name in ("llms.txt", "README.md", "README.zh.md"):
        p = ROOT / name
        if p.exists():
            yield p


def main():
    files = 0
    hits = 0
    ok = 0
    bad = []

    for path in targets():
        files += 1
        text = path.read_text(encoding="utf-8", errors="replace")
        for m in re.finditer(TERM, text):
            hits += 1
            window = text[max(0, m.start() - ALLOW_WITHIN):m.start()]
            if ALLOW_ANCHOR in window:
                ok += 1
                continue
            line = text.count("\n", 0, m.start()) + 1
            ctx = text[max(0, m.start() - 24):m.start() + len(TERM) + 12]
            ctx = ctx.replace("\n", " ")
            bad.append((path.relative_to(ROOT), line, ctx))

    if bad:
        print(f"RED: 扫 {files} 个文件，「{TERM}」共 {hits} 处，"
              f"归属性合法 {ok} 处，**违规 {len(bad)} 处**：")
        for rel, line, ctx in bad:
            print(f"  {rel}:{line}  …{ctx}…")
        print(f"  修法：指本站指数时改用其正式名（K 指数 / 恐惧的标价指数）；"
              f"确实在说 VIX 就把 VIX 紧挨着写在前面。")
        return 1

    print(f"OK: 扫 {files} 个文件，「{TERM}」共 {hits} 处，"
          f"全部为归属性用法（前 {ALLOW_WITHIN} 字内有 {ALLOW_ANCHOR}），违规 0。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
