# -*- coding: utf-8 -*-
"""从 index.html 生成各板块的平铺路由页（pricing.html 等）。

为什么存在：站是单页应用，服务端对所有路径回同一份 index.html，
其 canonical 硬写死指向首页 —— 于是 /pricing、/kindex 等 16 个路由在
Google 眼里全是首页的复本，除首页外任何路由都进不了索引
（2026-07-27 Search Console 邮件实锤，/pricing 上线以来搜索零可见）。

方案：每个路由生成一份 index.html 的完整拷贝，只替换头部身份
（title / description / canonical / og）。Cloudflare Pages 对平铺文件
foo.html 服务在 /foo（无尾斜杠），与 _redirects 现有规则同向；
🚨 绝不能用 foo/index.html 目录形式 —— Pages 会把 /foo 308 到 /foo/，
与 _redirects 里 /foo/ → /foo 的 301 对撞成无限循环（/welcome 线上实测
Pages 目录页就是强制加斜杠的）。相对资源路径在 /foo 下解析回根，无需改动。

用法：
    python3 scripts/build_route_pages.py            # 生成全部路由页
    python3 scripts/build_route_pages.py pricing    # 只生成指定路由

⚠️ index.html 每次改动后必须重跑本脚本，否则路由页与首页漂移。
⚠️ /pulse 故意不生成：它是首页别名（app.js 里 canonical 归到 /），
   生成了反而制造首页复本。
"""
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://chronicle.klay-wang.com"

# 每个路由：页面标题（title / og:title 共用）+ 描述（description / og:description 共用）。
# 文案对齐站内各 panel 的实际内容；旗舰两页（kindex / leaps）写得最满。
ROUTES = {
    "kindex": (
        "K 指数台账 · CNN 恐贪 ÷ VIX",
        "K 指数（KAPX Index）：CNN 恐惧贪婪指数除以 VIX 的反向情绪指标，K < 1 标记极端恐惧。"
        "每个交易日更新读数，2011 年以来每次信号对照纳指前向收益逐笔公开对账，赢的亏的都在。"
        "The KAPX Index: CNN Fear & Greed / VIX, reconciled daily.",
    ),
    "leaps": (
        "恐惧的标价指数 · LEAPS 成本刻度",
        "长期期权（LEAPS）现在贵不贵：以一年期隐含波动率 VIX1Y 的三年分位为主读数，"
        "辅以波动率风险溢价、期限阶梯、SKEW 与实际利率，回填至 2007 年，每个交易日留痕。"
        "纯描述性刻度，不构成交易信号。Fear-Price Index: a cost gauge for LEAPS, formerly Fear's Price Tag.",
    ),
    "spy": (
        "标普 500 · 一个世纪的形状",
        "标普 500 百年图表档案：长期走势、历次回撤与估值刻度，每个交易日自动更新。"
        "A century of S&P 500 history in self-updating charts.",
    ),
    "qqq": (
        "纳斯达克 · 成长与代价",
        "纳斯达克与纳指 100 图表档案：成长的长坡与换来它的深回撤，每个交易日自动更新。"
        "Nasdaq's growth and its drawdowns, charted daily.",
    ),
    "tech": (
        "科技板块 · 增长的引擎",
        "美股科技板块图表档案：龙头公司的长期走势与估值水位，每个交易日自动更新。"
        "US tech sector charts, updated every trading day.",
    ),
    "fin": (
        "金融板块 · 钱的生意",
        "美股金融板块图表档案：银行、券商与支付公司的长期走势，每个交易日自动更新。"
        "US financials sector charts, updated every trading day.",
    ),
    "consumer": (
        "消费板块 · 慢变量的复利",
        "美股消费板块图表档案：消费公司的长期复利曲线，每个交易日自动更新。"
        "US consumer sector charts, updated every trading day.",
    ),
    "luxury": (
        "奢侈品板块 · 定价权的溢价",
        "奢侈品公司图表档案：定价权带来的长期溢价与周期波动，每个交易日自动更新。"
        "Luxury sector charts, updated every trading day.",
    ),
    "macro": (
        "宏观 · 市场的水位",
        "宏观图表档案：利率、流动性与市场水位的长期序列，每个交易日自动更新。"
        "Macro charts: rates, liquidity, and market context, updated daily.",
    ),
    "methodology": (
        "方法论 · 两把刻度，一本结果账",
        "K 指数与恐惧的标价指数的完整方法论：口径定义、数据来源、对账规则，"
        "以及为什么每条读数都要留下可验证的时间戳。Methodology of the KAPX Index and the Fear-Price Index.",
    ),
    "pricing": (
        "定价与订阅",
        "美股编年史订阅方案：读数与台账永久免费公开，付费订阅每日 digest 解读。"
        "月付与年付价格、创始价与退款政策入口都在这一页。Market Chronicle pricing and subscription.",
    ),
    "about": (
        "关于美股编年史",
        "美股编年史是什么、为谁而做、指标为什么全部公开对账：站点定位与作者介绍。"
        "About Market Chronicle and its author.",
    ),
    "contact": (
        "联系我",
        "联系美股编年史作者：邮箱与社交账号入口。Contact Market Chronicle.",
    ),
    "privacy": (
        "隐私政策",
        "美股编年史隐私政策：收集什么、不收集什么、数据如何使用。Market Chronicle privacy policy.",
    ),
    "terms": (
        "服务条款",
        "美股编年史服务条款：内容授权、订阅规则与免责声明。Market Chronicle terms of service.",
    ),
    "refunds": (
        "退款政策",
        "美股编年史付费订阅的退款政策与申请方式。Market Chronicle refund policy.",
    ),
}


def patch(html: str, route: str, title: str, desc: str) -> str:
    """替换头部六处身份标记；任何一处找不到或不唯一都直接炸，绝不静默产出错页。"""
    full_title = f"{title} · 美股编年史 Market Chronicle"
    subs = [
        # (旧串, 新串) —— 旧串必须与 index.html 逐字一致且全文唯一
        ("<title>美股编年史 · Market Chronicle</title>",
         f"<title>{full_title}</title>"),
        ('<link rel="canonical" href="https://chronicle.klay-wang.com/">',
         f'<link rel="canonical" href="{BASE}/{route}">'),
        ('<meta property="og:url" content="https://chronicle.klay-wang.com/">',
         f'<meta property="og:url" content="{BASE}/{route}">'),
        ('<meta property="og:title" content="美股编年史 · Market Chronicle">',
         f'<meta property="og:title" content="{full_title}">'),
    ]
    # description 与 og:description 整行替换（行内容随首页文案变化，锚定行首标记）
    out_lines = []
    seen = {"desc": 0, "ogdesc": 0}
    for line in html.split("\n"):
        if line.startswith('<meta name="description" content="'):
            out_lines.append(f'<meta name="description" content="{desc}">')
            seen["desc"] += 1
        elif line.startswith('<meta property="og:description" content="'):
            out_lines.append(f'<meta property="og:description" content="{desc}">')
            seen["ogdesc"] += 1
        else:
            out_lines.append(line)
    assert seen["desc"] == 1 and seen["ogdesc"] == 1, f"{route}: description 行未命中 {seen}"
    html = "\n".join(out_lines)
    for old, new in subs:
        n = html.count(old)
        assert n == 1, f"{route}: 锚串命中 {n} 次（应为 1）：{old[:60]}"
        html = html.replace(old, new, 1)
    return html


def main():
    only = set(sys.argv[1:])
    if only - set(ROUTES):
        sys.exit(f"未知路由：{only - set(ROUTES)}")
    src = (ROOT / "index.html").read_text(encoding="utf-8")
    targets = {r: v for r, v in ROUTES.items() if not only or r in only}
    for route, (title, desc) in targets.items():
        out = ROOT / f"{route}.html"
        out.write_text(patch(src, route, title, desc), encoding="utf-8")
        print(f"生成 {out.name}")
    print(f"共 {len(targets)} 页")


if __name__ == "__main__":
    main()
