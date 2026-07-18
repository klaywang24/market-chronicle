#!/usr/bin/env python3
"""每交易日收盘后，把「今日头版」数据卡片推送到 Discord #每日头版。
Webhook URL 从环境变量 DISCORD_WEBHOOK_URL 读取（GitHub Actions secret）；
未配置则静默跳过，不影响主管线。"""
import datetime as dt
import json
import os
import sys
import urllib.request

SITE = "https://klaywang24.github.io/market-chronicle/"


def load(name):
    try:
        with open(f"data/{name}.json", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def pct(v):
    return ("+" if v > 0 else "") + f"{v:.2f}%"


def post(url, payload):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json",
                 # Cloudflare 会 403 掉默认的 python-urllib UA
                 "User-Agent": "Mozilla/5.0 (market-chronicle daily bot)"})
    urllib.request.urlopen(req, timeout=20)


def alert(url, title, desc):
    """管线出事时发红色告警。宁可吵，也不要静默——2026-07-12→14 就是被静默掉的。"""
    post(url, {"embeds": [{"title": title, "description": desc, "color": 0xD93025}]})
    print(f"已发告警: {title}")


def main():
    url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not url:
        print("DISCORD_WEBHOOK_URL 未配置，跳过 Discord 推送")
        return

    run_url = os.environ.get("RUN_URL", "")
    status = (os.environ.get("JOB_STATUS") or "").lower()

    # ① job 本身失败 → 立刻红色告警，绝不发正常播报（旧 JSON 会让它看起来一切正常）
    if status and status != "success":
        alert(url, f"🔴 daily-update 失败（{status}）",
              f"站上数据**没有更新**，仍是上一次成功时的值。\n请查日志：{run_url}")
        sys.exit(0)

    d = load("pulse")
    if not d:
        alert(url, "🔴 daily-update 异常：pulse.json 缺失", f"日志：{run_url}")
        return

    # ② job 成功但数据没动（上游静默返回旧值/被限流）→ 同样告警
    asof = d.get("date")
    if asof:
        try:
            age = (dt.date.today() - dt.date.fromisoformat(asof)).days
            if age > 4:   # 容忍周末 + 假日；超过就不正常
                alert(url, f"🟠 数据陈旧：pulse.json 停在 {asof}（{age} 天前）",
                      f"job 报成功但数据没前进，检查上游取数。\n日志：{run_url}")
        except Exception:
            pass

    # ③ 台账自核：已发布过的值被改写、或交易日消失 → 告警。
    #    ⚠️ 触发判据取自 verify_ledger 步骤的 env 输出，不取磁盘文件——文件可能是上一次的，
    #    「读旧文件发平安播报」正是 2026-07-12 那次故障被静默掉的形态。
    #    按「相比上次的新增」响，不按绝对数：存量分歧天天叫 = 狼来了。
    delta_raw = os.environ.get("LEDGER_DELTA", "")
    if delta_raw not in ("", "0"):
        au = load("ledger_audit") or {}
        total = au.get("total_divergences", "?")
        lines = []
        for r in au.get("reports", []):
            c = r.get("counts") or {}
            if c.get("total"):
                lines.append(f'· {r.get("file")}：消失 {c.get("missing", 0)} / '
                             f'当场记录被改 {c.get("revised_live", 0)} / '
                             f'回填段被改 {c.get("revised_backfill", 0)}')
        alert(url, f"🔴 台账自核：分歧数较上次变化 {delta_raw}（现共 {total} 处）",
              "**已发布过的数值被改写，或有交易日消失。**\n" + "\n".join(lines)
              + f"\n\n逐条明细：data/ledger_audit.json\n日志：{run_url}")

    leaps = load("leaps") or {}
    q = d.get("quotes", {})

    temp = d.get("temp", 0)
    word = "炙热" if temp >= 75 else "偏暖" if temp >= 50 else "温和" if temp >= 25 else "冰点"
    color = 0xB8421E if temp >= 75 else 0xC9882E if temp >= 50 else 0x14A63E if temp >= 25 else 0x2B5F8F
    win_open = (leaps.get("current") or {}).get("window_open")

    def quote(label, key):
        v = q.get(key)
        return f"{label} **{round(v['close']):,}** {pct(v['chg'])}" if v else ""

    indices = " · ".join(filter(None, [
        quote("标普500", "spx"), quote("纳指100", "ndx"),
        quote("道指", "dji"), quote("罗素2000", "rut"),
    ]))
    fields = [
        {"name": "🌡️ 市场温度", "value": f"**{temp:.1f}°** · {word}（估值 {d.get('val_pct')} 百分位 / 情绪 {d.get('sent_pct')} 百分位）", "inline": False},
        {"name": "📈 四大指数", "value": indices or "—", "inline": False},
        {"name": "😱 情绪", "value": f"恐惧贪婪 **{round(d.get('fng', 0))}** · VIX **{q.get('vix', {}).get('close', '—')}** · K 指数 **{d.get('k', 0):.2f}**", "inline": False},
        {"name": "🎯 LEAPS Call 窗口", "value": ("**开启** 🟢" if win_open else "关闭"), "inline": True},
        {"name": "📊 涨跌", "value": f"{d.get('adv')} 涨 / {d.get('flat')} 平 / {d.get('dec')} 跌", "inline": True},
    ]
    payload = {
        "username": "美股编年史",
        "embeds": [{
            "title": f"今日头版 · {d.get('date')}",
            "url": SITE,
            "color": color,
            "fields": fields,
            "footer": {"text": "数据仅供参考，非投资建议 · Market Chronicle"},
        }],
    }
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            # Discord/Cloudflare 会 403 掉默认的 python-urllib UA，需带正常 UA
            "User-Agent": "MarketChronicle-Bot/1.0 (+https://klaywang24.github.io/market-chronicle/)",
        }, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            print("Discord 推送成功", r.status)
    except Exception as e:
        print("Discord 推送失败：", e, file=sys.stderr)
        # 不让主管线失败
        return


if __name__ == "__main__":
    main()
