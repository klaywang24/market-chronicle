#!/usr/bin/env python3
"""上游序列回改警报器 · 云端侧（2026-08-25 建 · 08-11 设计的「站仓 CI 侧」落地）。

━━ 它证明什么 ━━
本站引用的上游指数序列（Cboe CDN 每日史）若被**回头修改历史**，本地采集器会发现——
但本地那台笔记本合盖/死机时，它的警报也跟着死。本 workflow 住在云端：
笔记本消失一个月，它每天照样对账，历史被改当天就开 Issue 发邮件。

━━ 它怎么做到「对账但不存数据」━━
公开仓里只存**指纹**（data/upstream_fp.json）：
  {"series": {"VIXHY": {"through": "<日期>", "rows": N, "sha": "<前缀哈希>"}}}
前缀哈希 = 从文件头到 through 那一行（含）的**逐字节** SHA256。
每天：拉全史 → 重算「截至上次 through」的前缀哈希 → 与指纹比对：
  · 一致 ⇒ 历史未动，把 through 推进到今天最后一行，指纹随 CI 提交（append-only 的正常步进）
  · 不一致 / through 行消失 ⇒ **上游改了已发布的历史** ⇒ 退出码 1，workflow 开 Issue
数据本身一个字节不进公开仓（上游条款；同 anchor_wayback「公开指纹不公开内容」的哈希承诺路线）。

━━ 与本地采集器的分工（不是重复建设）━━
本地（每日 18:35）：逐字节比对 + 记回改台账 + **跟随**（转录者条款）——它是**账房**。
本云端：只回答一个是非题「历史动没动」——它是**哨兵**，在账房断电时兜底。
两边判据独立实现但语义一致；哨兵响了而账房没记账 ⇒ 说明本地线已死，双倍警报正确。

退出码：0=历史未动（或首建基线）· 1=检出回改（workflow 据此开 Issue）· 3=拉取失败（无法验证，
不算回改；连续多天 3 会在 Actions 历史里肉眼可见，v1 不为它单独开 Issue）。
自检：--selftest（篡改/删行必须报，纯追加必须过）。
"""
import hashlib, json, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FP = ROOT / "data" / "upstream_fp.json"
SERIES = {s: f"https://cdn.cboe.com/api/global/us_indices/daily_prices/{s}_History.csv"
          for s in ("VIXHY", "VIXIG")}
UA = "market-chronicle-integrity/1.0 (+https://chronicle.klay-wang.com)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8-sig")


def parse(text):
    """返回 (数据行列表[bytes], 逐行日期列表)。首行表头排除；逐字节保留（转录者视角）。"""
    lines = [l for l in text.split("\n") if l.strip()]
    rows = lines[1:]
    dates = [l.split(",", 1)[0].strip() for l in rows]
    return [l.encode("utf-8") for l in rows], dates


def prefix_sha(rows_bytes, upto_idx):
    h = hashlib.sha256()
    for b in rows_bytes[: upto_idx + 1]:
        h.update(b); h.update(b"\n")
    return h.hexdigest()


def check_series(name, rows, dates, fp_entry):
    """核心判定，纯函数可测。返回 (verdict, new_entry, msg)；verdict ∈ ok/revised/bootstrap"""
    if not fp_entry:
        e = {"through": dates[-1], "rows": len(rows), "sha": prefix_sha(rows, len(rows) - 1)}
        return "bootstrap", e, f"{name}: 首建基线（{len(rows)} 行，through {dates[-1]}）"
    thr = fp_entry["through"]
    if thr not in dates:
        return "revised", None, f"{name}: 🔴 基线行 {thr} 在上游消失 ⇒ 历史被删改"
    i = dates.index(thr)
    got = prefix_sha(rows, i)
    if got != fp_entry["sha"]:
        return "revised", None, (f"{name}: 🔴 截至 {thr} 的前缀哈希不符 "
                                 f"⇒ 上游改了已发布的历史（记录 {fp_entry['sha'][:12]}… 现 {got[:12]}…）")
    e = {"through": dates[-1], "rows": len(rows), "sha": prefix_sha(rows, len(rows) - 1)}
    grew = len(rows) - fp_entry.get("rows", 0)
    return "ok", e, f"{name}: ✅ 历史未动（+{grew} 新行，through {dates[-1]}）"


def selftest():
    rows = [f"0{i}/01/2020,{100+i}.5".encode() for i in range(1, 8)]
    dates = [r.decode().split(",")[0] for r in rows]
    _, base, _ = check_series("T", rows, dates, None)
    # ① 纯追加 → ok
    rows2 = rows + [b"08/01/2020,200.0"]; dates2 = dates + ["08/01/2020"]
    v, _, m = check_series("T", rows2, dates2, base); assert v == "ok", m
    # ② 改历史一行 → revised
    rows3 = list(rows2); rows3[2] = b"03/01/2020,999.9"
    v, _, m = check_series("T", rows3, dates2, base); assert v == "revised", m
    # ③ 删基线行 → revised
    rows4 = rows2[:3] + rows2[4:]; dates4 = dates2[:3] + dates2[4:]
    # 删的是中间行，through(07/01)还在但前缀变了
    v, _, m = check_series("T", rows4, dates4, base); assert v == "revised", m
    # ④ 删掉 through 行本身 → revised
    rows5 = rows2[:-2]; dates5 = dates2[:-2]
    v, _, m = check_series("T", rows5, dates5, base); assert v == "revised", m
    print("selftest: 4/4 通过（追加放行·改行/删行/删基线全报）")
    return 0


def main():
    if "--selftest" in sys.argv:
        return selftest()
    fp = json.loads(FP.read_text()) if FP.exists() else {"series": {}}
    revised, fetched = [], 0
    for name, url in SERIES.items():
        try:
            text = fetch(url)
        except Exception as e:
            print(f"{name}: ⚠️ 拉取失败（无法验证，不算回改）：{type(e).__name__}")
            continue
        rows, dates = parse(text)
        if len(rows) < 3000:
            print(f"{name}: ⚠️ 仅 {len(rows)} 行，疑半截页，跳过（不算回改）")
            continue
        fetched += 1
        verdict, entry, msg = check_series(name, rows, dates, fp["series"].get(name))
        print(msg)
        if verdict == "revised":
            revised.append(msg)
        else:
            fp["series"][name] = entry
    if revised:
        return 1
    if fetched == 0:
        return 3
    from datetime import datetime, timezone
    fp["updated"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    FP.write_text(json.dumps(fp, ensure_ascii=False, indent=1) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
