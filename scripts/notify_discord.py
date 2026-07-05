#!/usr/bin/env python3
"""每交易日收盘后，把「今日头版」数据卡片推送到 Discord #每日头版。
Webhook URL 从环境变量 DISCORD_WEBHOOK_URL 读取（GitHub Actions secret）；
未配置则静默跳过，不影响主管线。"""
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


def main():
    url = os.environ.get("DISCORD_WEBHOOK_URL")
    if not url:
        print("DISCORD_WEBHOOK_URL 未配置，跳过 Discord 推送")
        return

    d = load("pulse")
    if not d:
        print("pulse.json 缺失，跳过")
        return
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
