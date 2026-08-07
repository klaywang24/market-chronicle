#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""i18n 字典重复 key 自检（2026-08-06 建）

## 为什么有这个

js/i18n.js 的词典 D 是一个近千行的 JS 对象字面量。JS 对重复 key 不报错，
后者静默覆盖前者。2026-08-06 深夜审计在 D 里找到 22 处重复 key（14 处两版值不同，
即 14 个静默覆盖 bug：行业暴露图 2026-07-20 写入的 GICS 全名版从写入起就被
更靠后的旧短名版压着，从未生效；月份名 Mar/Jun 压掉了期限档 3m/6m 等）。
本次已全部去重归零，这个脚本是防复发的守门人。

## 判据

D 块内同一 key 出现次数 > 1 即红。逐条报 key 与两处行号。

## 🚨 自检脚本自己也会失明（§55/§56 教训，写进代码防将来的我）

① 必须输出分母（扫到的 key 总数）：报 0 重复之前先证明真的扫到了近千个 key，
   否则解析漂移（比如 D 块定位失败、正则失配）会以全绿的样子出现。
② 测量失败（定位不到 D 块、分母坍塌到 <500）单独 exit 2，绝不落进 exit 0：
   报测量失败和报绿必须是两种不同的声音。
③ 逐 key 正则扫全文本而不是按行取第一个 key：一行多 key 的写法（词典里真实存在）
   曾让首轮审计少数了 3 个重复（30天/6月/1年）。

## 用法

    python tools/check_i18n_dupes.py          # 仓库根或任意目录下均可

exit 0 = 无重复；exit 1 = 有重复；exit 2 = 测量失败（不可当绿处理）。
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "js" / "i18n.js"
MIN_KEYS = 500  # 分母守卫：现存约 841 个 key，掉到一半以下即解析漂移

def main() -> int:
    try:
        src = SRC.read_text(encoding="utf-8")
    except OSError as e:
        print(f"MEASUREMENT FAILED: 读不到 {SRC}: {e}")
        return 2

    start = src.find("const D = {")
    end = src.find("const P = [")
    if start < 0 or end < 0 or end <= start:
        print("MEASUREMENT FAILED: 定位不到 D 块（const D = { … const P = [）——"
              "i18n.js 结构变了，先修本脚本的定位再谈绿。")
        return 2

    block = src[start:end]
    pat = re.compile(r'"((?:[^"\\]|\\.)*)"\s*:\s*\[')
    occ = {}
    for m in pat.finditer(block):
        line = src[: start + m.start()].count("\n") + 1
        occ.setdefault(m.group(1), []).append(line)

    total = len(occ)
    if total < MIN_KEYS:
        print(f"MEASUREMENT FAILED: 只扫到 {total} 个 key（守卫线 {MIN_KEYS}）——"
              "分母坍塌，多半是正则或 D 块定位失配，不可当绿。")
        return 2

    dups = {k: v for k, v in occ.items() if len(v) > 1}
    if dups:
        print(f"RED: D 共 {total} 个 key，重复 {len(dups)} 个（后者静默覆盖前者）：")
        for k, lines in sorted(dups.items(), key=lambda kv: kv[1][0]):
            print(f"  {k}  -> 行 {', '.join(map(str, lines))}")
        return 1

    print(f"OK: D 共 {total} 个 key，重复 0。")
    return 0

if __name__ == "__main__":
    sys.exit(main())
