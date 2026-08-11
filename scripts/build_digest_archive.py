#!/usr/bin/env python3
"""往期 digest 归档页生成器（兑现定价页承诺：往期归档公开可查 · 逐日归档）

用法：
    python3 scripts/build_digest_archive.py --only 2026-08-07   # 出一页样张
    python3 scripts/build_digest_archive.py                     # 全量

时间墙（§45 定案，印在定价页上的承诺）：
    当日判读全文只进订户邮箱；**往期**归档公开可查。
    ⇒ 本脚本只处理「今天之前」的期数，当日那期永不由本脚本上站。

图：正文里的 buttondown 外链一律换成站内 webp。
    对应关系优先走 markdown alt 里的原文件名（精确）；
    `<img>` 形式无文件名，按卡号顺序推，并在 stdout 标 [推] 供人工核。
"""
import argparse, datetime, glob, html, os, re, shutil, subprocess, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIZ = os.path.abspath(os.path.join(REPO, "..", "..", "生意与起号"))
SRC = os.path.join(BIZ, "04-Buttondown抢救备份", "邮件正文")
CARDS = os.path.join(BIZ, "01-起号引流", "每日 digest")
OUT = os.path.join(REPO, "digest")
IMGOUT = os.path.join(OUT, "img")
SITE = "https://chronicle.klay-wang.com"
WEBP_W, WEBP_Q = 1200, 92          # 1200 宽 / q92：注脚与水印肉眼可辨（2026-08-11 实测确认）

# ── 卡片目录候选：发稿日 ≠ 产出日，周末回顾产在周五且在子目录（见纪律 §61）
# 两条路必须分开取材（2026-08-11 实测踩出来）：
#   ① 按 alt 里的原文件名精确找 → 跨目录搜没有风险，且必须跨（发稿日 ≠ 产出日：
#      08-07 那封用的卡在 2026-08-06，而 2026-08-07 目录里放的是给 08-08 用的卡）
#   ② 按出现顺序推 → **必须锁定单个目录**，混池会把别天的卡排进本期
#      （实测：07-21 被混进 07-20 的「卡2_三轨互证」，凭空多出一个「卡2」）
def search_dirs(date_str):
    base = datetime.date.fromisoformat(date_str)
    out = []
    for off in range(0, 4):
        p = os.path.join(CARDS, (base - datetime.timedelta(days=off)).isoformat())
        if os.path.isdir(p):
            out.append(p)
            out += [d.rstrip("/") for d in glob.glob(p + "/*/")]
    return out

def infer_dir(date_str):
    """给顺序推断用：只返回一个目录。周末回顾走周五的 `本周回顾/` 子目录。"""
    base = datetime.date.fromisoformat(date_str)
    for off in range(0, 4):
        p = os.path.join(CARDS, (base - datetime.timedelta(days=off)).isoformat())
        if not os.path.isdir(p):
            continue
        subs = [d.rstrip("/") for d in glob.glob(p + "/*/") if "本周回顾" in d]
        if subs:
            return subs[0]
        if any(f.lower().endswith(".png") for f in os.listdir(p)):
            return p
    return None

def find_card(name, dirs):
    for d in dirs:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    stem = os.path.splitext(name)[0].lower()
    for d in dirs:
        for f in sorted(os.listdir(d)):
            if f.lower().startswith(stem) and f.lower().endswith(".png"):
                return os.path.join(d, f)
    return None


# ── 早期 7 封（2026-07-15～07-23）的图位映射：**实测得来，不是推断**
# 那几封在 Buttondown 里用 <img src="UUID"> 写的，正文没留文件名。
# 2026-08-11 把图床原图抓下来跟本地卡片做 dHash+aHash 比对，逐位定出下表。
# 实测推翻了「按卡号顺序」这个想当然：07-22/07-23 的「恐惧的标价」在**末尾**不在开头，
# 07-21 前两张是颠倒的，且实际发的多为 _英文主/_纯英文 而非 _纯中文。
# ⚠️ 恐惧的标价卡各语言版仅文字不同、版式相同，16×16 感知哈希分不出语言版
#    （次优距离只差 0.004~0.008）⇒ 卡的身份可信，语言版取最佳命中 _英文主。
VERIFIED = {
  "2026-07-15": ["卡1_恐惧的标价_双语.png"],
  "2026-07-16": ["卡1_恐惧的标价_英文主.png"],
  "2026-07-17": ["卡1_恐惧的标价_英文主.png", "卡2_短端vs长端_解读卡_纯中文.png"],
  "2026-07-20": ["卡1_恐惧的标价_英文主.png", "卡2_恐惧梯_解读卡_纯中文.png",
                 "卡3_SNDK一侧空了_解读卡_纯中文.png"],
  "2026-07-21": ["卡2_崩盘险_解读卡_纯中文.png", "卡1_恐惧的标价_英文主.png",
                 "卡3_SPCX两边下注_解读卡_纯中文.png"],
  "2026-07-22": ["卡4_MU七倍_流量卡_纯中文.png", "卡2_买翅膀_解读卡_纯中文.png",
                 "卡3_105P对账_解读卡_纯中文.png", "卡1_恐惧的标价_英文主.png"],
  "2026-07-23": ["卡2_存储剧本_节目一_纯英文.png", "卡4_财报日空城_解读卡_纯英文.png",
                 "卡3_TSLA四翼落点_节目二_纯英文.png", "卡1_恐惧的标价_英文主.png"],
}

# 早期命名不统一：07-15 只有 `_双语`，后期才分 `_纯中文`/`_EN`/`_英文主`
VARIANT_PREF = ("_纯中文", "_双语", "_英文主", "_EN", "_纯英文")

def ordered_cards(d):
    """单目录内按卡号排序，同一张卡的多个语言版本只取一个（按 VARIANT_PREF）。
    返回 (列表, 是否存在歧义)：候选数与实际用图数不等时由调用方判定。"""
    if not d:
        return [], True
    groups = {}
    for f in sorted(os.listdir(d)):
        if not f.lower().endswith(".png"):
            continue
        if any(k in f for k in ("小红书封面", "雪球封面", "_备选", "_分发存档")):
            continue                                    # 非正文用图
        m = re.match(r"(?:周)?卡_?(\d+)", f)
        num = int(m.group(1)) if m else 99
        stem = f
        for v in VARIANT_PREF:
            stem = stem.replace(v, "")
        groups.setdefault((num, stem), []).append(f)
    out = []
    for key in sorted(groups):
        cands = groups[key]
        pick = next((c for v in VARIANT_PREF for c in cands if v in c), cands[0])
        out.append(os.path.join(d, pick))
    return out, False

def to_webp(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    r = subprocess.run(["cwebp", "-q", str(WEBP_Q), "-resize", str(WEBP_W), "0",
                        src, "-o", dst], capture_output=True)
    if r.returncode != 0 or not os.path.exists(dst):
        raise RuntimeError(f"cwebp 失败：{src}\n{r.stderr.decode()[:200]}")
    return dst

# ── 正文：只做「换图 + markdown→html」，一个字不改（旧文不回改）
def build_body(md, date_str, slug, log):
    dirs = search_dirs(date_str)                       # 精确匹配用：跨目录
    fallback, _ = ordered_cards(infer_dir(date_str))   # 顺序推断用：锁单目录
    n = [0]

    def emit(local, inferred):
        n[0] += 1
        rel = f"img/{slug}/{n[0]:02d}.webp"
        to_webp(local, os.path.join(OUT, rel))
        log.append(("推" if inferred else "精", os.path.basename(local), rel))
        return rel

    def md_img(m):
        alt, _ = m.group(1), m.group(2)
        local = find_card(alt, dirs) if alt.endswith(".png") else None
        inferred = local is None
        if local is None:
            local = fallback[n[0]] if n[0] < len(fallback) else None
        if local is None:
            raise RuntimeError(f"{date_str} 第 {n[0]+1} 张图找不到本地卡片（alt={alt}）")
        return f"![{html.escape(os.path.splitext(os.path.basename(local))[0])}]({emit(local, inferred)})"

    def html_img(m):
        vlist = VERIFIED.get(date_str)
        local = None
        if vlist and n[0] < len(vlist):
            local = find_card(vlist[n[0]], dirs)      # 实测表命中＝不是推断
            if local is None:
                raise RuntimeError(f"{date_str} 实测表里的 {vlist[n[0]]} 在本地找不到")
            return f'<img src="{emit(local, False)}" alt="" loading="lazy">'
        raise RuntimeError(f"{date_str} 第 {n[0]+1} 张图无实测映射，"
                           f"不许靠顺序猜（跑 scratchpad/verify_images.py 补表）")

    md = re.sub(r"!\[([^\]]*)\]\((https://assets\.buttondown\.email/images/[^)]+)\)", md_img, md)
    md = re.sub(r'<img src="https://assets\.buttondown\.email/images/[^"]+"[^>]*>', html_img, md)
    md = re.sub(r"<!--\s*buttondown-editor-mode[^>]*-->", "", md)
    # 死平台残留：snippet 占位标签 + 自指存档链接（后者含用户名，§61 禁止进公开仓）
    md = re.sub(r"<buttondown-snippet[^>]*>\s*</buttondown-snippet>", "", md)
    md = re.sub(r"<buttondown-snippet[^>]*/?>", "", md)
    md = re.sub(r"^.*https?://buttondown\.com/\S*.*$", "", md, flags=re.M)
    md = re.sub(r"<figcaption>.*?</figcaption>", "", md, flags=re.S)  # 空占位符
    md = strip_cjk_dash(md, log)
    import markdown
    return markdown.markdown(md, extensions=["extra", "sane_lists", "nl2br"])

def strip_cjk_dash(md, log):
    """站规 §二：中文破折号一律改冒号；**英文侧单破折号不动**。
    判据＝该破折号左右 24 字符内有没有中日韩字符（2026-08-11 实测：
    中文语境 14 处 / 英文语境 101 处，一刀切会毁掉英文版正文）。"""
    n = [0]
    def rep(m):
        l, r = md[max(0, m.start() - 24):m.start()], md[m.end():m.end() + 24]
        if re.search(r"[一-鿿]", l + r):
            n[0] += 1
            return "："
        return m.group()          # 英文侧原样留
    out = re.sub("—+", rep, md)
    if n[0]:
        log.append(("破折号", f"中文语境 {n[0]} 处 → 「：」", ""))
    return out

HEAD = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} · 美股编年史 Market Chronicle</title>
<link rel="canonical" href="{site}/digest/{slug}">
<meta name="description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title} · 美股编年史">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{site}/digest/{slug}">
<meta property="article:published_time" content="{date}">
<link rel="stylesheet" href="../css/style.css">
<link rel="alternate" type="application/rss+xml" title="美股编年史 · 判读档案" href="{site}/feed.xml">
<style>
/* 归档页专属：站上 SPA 外壳不适用，这里只借调色板与字体 */
.dg-wrap{{max-width:760px;margin:0 auto;padding:48px 20px 96px}}
.dg-back{{font-size:13px;opacity:.7;text-decoration:none;display:inline-block;margin-bottom:28px}}
.dg-date{{font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.04em;opacity:.6}}
.dg-title{{font-family:'Fraunces',serif;font-size:clamp(26px,4.4vw,38px);line-height:1.28;margin:10px 0 6px}}
.dg-wall{{font-size:12.5px;opacity:.62;border-left:2px solid var(--accent);padding-left:10px;margin:18px 0 34px}}
.dg-body{{font-size:16.5px;line-height:1.86}}
.dg-body p{{margin:0 0 1.15em}}
.dg-body h2{{font-family:'Fraunces',serif;font-size:22px;margin:2.1em 0 .7em}}
.dg-body img{{width:100%;height:auto;border-radius:10px;margin:1.5em 0;display:block}}
.dg-body blockquote{{border-left:2px solid var(--accent);padding-left:14px;margin:1.5em 0;opacity:.9}}
.dg-body a{{color:var(--accent)}}
.dg-foot{{margin-top:56px;padding-top:22px;border-top:1px solid var(--border,rgba(128,128,128,.25));font-size:13px;opacity:.72}}
</style>
</head>
<body>
<div class="dg-wrap">
<a class="dg-back" href="./">← 判读档案</a>
<div class="dg-date">{date}</div>
<h1 class="dg-title">{title}</h1>
<div class="dg-wall">这是往期归档。当日判读全文只在盘前送进订户邮箱：<a href="{site}/subscribe">订阅</a>后每个交易日开盘前送达。</div>
<div class="dg-body">
<!--BODY-->{body}<!--/BODY-->
</div>
<div class="dg-foot">
美股编年史 Market Chronicle · 本文为历史归档，数字与判断均为当日口径，事后不回改。<br>
本站不提供投资建议，不预测方向，不做择时。
</div>
</div>
</body>
</html>
"""


IDX_HEAD = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>判读档案 · 美股编年史 Market Chronicle</title>
<link rel="canonical" href="{site}/digest/">
<meta name="description" content="美股编年史每日判读的往期归档，逐日累积。当日判读只进订户邮箱，往期公开可查。">
<meta property="og:type" content="website">
<meta property="og:title" content="判读档案 · 美股编年史">
<meta property="og:url" content="{site}/digest/">
<link rel="stylesheet" href="../css/style.css">
<link rel="alternate" type="application/rss+xml" title="美股编年史 · 判读档案" href="{site}/feed.xml">
<style>
.dg-wrap{{max-width:820px;margin:0 auto;padding:48px 20px 96px}}
.dg-h1{{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,42px);margin:0 0 10px}}
.dg-lede{{font-size:15px;line-height:1.8;opacity:.75;max-width:62ch;margin:0 0 8px}}
.dg-wall{{font-size:12.5px;opacity:.62;border-left:2px solid var(--accent);padding-left:10px;margin:20px 0 40px}}
.dg-yr{{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.1em;opacity:.5;margin:34px 0 12px}}
.dg-item{{display:flex;gap:16px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--border,rgba(128,128,128,.2));text-decoration:none}}
.dg-item:hover .dg-it{{color:var(--accent)}}
.dg-thumb{{width:104px;height:78px;object-fit:cover;border-radius:6px;flex:0 0 auto;background:rgba(128,128,128,.1)}}
.dg-meta{{font-family:'JetBrains Mono',monospace;font-size:11.5px;opacity:.55;letter-spacing:.03em}}
.dg-it{{font-size:16.5px;line-height:1.5;margin-top:4px;font-weight:500}}
.dg-tag{{font-size:10.5px;border:1px solid var(--accent);color:var(--accent);border-radius:3px;padding:1px 5px;margin-left:8px;vertical-align:1px}}
@media(max-width:560px){{.dg-thumb{{width:74px;height:56px}}.dg-it{{font-size:15px}}}}
</style>
</head>
<body>
<div class="dg-wrap">
<h1 class="dg-h1">判读档案</h1>
<p class="dg-lede">每个交易日盘前一封，只做一件事：把当天的市场状态用可验证的数字讲清楚。贵不贵、怕不怕、极端不极端。不预测方向，不做择时。</p>
<div class="dg-wall">当日判读全文只在盘前送进订户邮箱：<a href="{site}/subscribe">订阅</a>后每个交易日开盘前送达。往期在此公开可查，逐日累积。</div>
{items}
</div>
</body>
</html>
"""

def write_index(done):
    items, cur_ym = [], None
    for slug, date, title, first_img in sorted(done, key=lambda x: x[1], reverse=True):
        ym = date[:7]
        if ym != cur_ym:
            cur_ym = ym
            items.append(f'<div class="dg-yr">{ym.replace("-", " / ")}</div>')
        tag = '<span class="dg-tag">回顾</span>' if slug.endswith("-weekly") else ""
        thumb = f'<img class="dg-thumb" src="{first_img}" alt="" loading="lazy">' if first_img else '<div class="dg-thumb"></div>'
        items.append(
            f'<a class="dg-item" href="./{slug}">{thumb}'
            f'<div><div class="dg-meta">{date}</div>'
            f'<div class="dg-it">{html.escape(title)}{tag}</div></div></a>')
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(
        IDX_HEAD.format(site=SITE, items="\n".join(items)))
    return len(done)

def write_feed(done):
    """Substack 的 Import posts 吃「website with an RSS feed」，所以全文进 feed。
    图用绝对地址（相对路径导过去会断）。"""
    import xml.sax.saxutils as su
    entries = []
    for slug, date, title, _ in sorted(done, key=lambda x: x[1], reverse=True):
        body = open(os.path.join(OUT, f"{slug}.html"), encoding="utf-8").read()
        m = re.search(r"<!--BODY-->(.*?)<!--/BODY-->", body, re.S)
        if not m or len(m.group(1)) < 200:
            raise RuntimeError(f"feed 正文抽取失败或过短：{slug}（{0 if not m else len(m.group(1))} 字节）")
        content = m.group(1)
        content = content.replace('src="img/', f'src="{SITE}/digest/img/')
        pub = datetime.datetime.fromisoformat(date + "T09:30:00-04:00")
        entries.append(f"""  <item>
    <title>{su.escape(title)}</title>
    <link>{SITE}/digest/{slug}</link>
    <guid isPermaLink="true">{SITE}/digest/{slug}</guid>
    <pubDate>{pub.strftime('%a, %d %b %Y %H:%M:%S %z')}</pubDate>
    <content:encoded><![CDATA[{content}]]></content:encoded>
  </item>""")
    feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>美股编年史 · 判读档案</title>
  <link>{SITE}/digest/</link>
  <atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>每个交易日盘前一封，用可验证的数字讲清当天的市场状态。往期归档。</description>
  <language>zh-CN</language>
{chr(10).join(entries)}
</channel>
</rss>
"""
    open(os.path.join(REPO, "feed.xml"), "w", encoding="utf-8").write(feed)
    return len(entries)

def write_ledger(done):
    """§45 那张表原本靠 Buttondown 存档页取标题链接，平台已死 ⇒ 改成本地生成。"""
    import json
    items = [{"date": d, "slug": s, "title": t, "url": f"{SITE}/digest/{s}",
              "kind": "weekly" if s.endswith("-weekly") else "daily"}
             for s, d, t, _ in sorted(done, key=lambda x: x[1], reverse=True)]
    out = {"generated_at": datetime.datetime.now(datetime.timezone.utc)
                              .strftime("%Y-%m-%dT%H:%M:%SZ"),
           "count": len(items), "items": items}
    with open(os.path.join(REPO, "data", "digest_archive.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    return len(items)

def parse(path):
    s = open(path, encoding="utf-8").read()
    date = os.path.basename(path)[:10]
    m = re.match(r"#\s*(.+)", s)
    title = (m.group(1) if m else os.path.basename(path)[11:-3]).strip()
    body = s.split("---", 1)[1] if "\n---" in s else s
    body = re.sub(r"^#\s*.+", "", body, count=1)
    body = re.sub(r"^\s*发布:.*$", "", body, flags=re.M)
    body = re.sub(r"^\s*存档链接.*$", "", body, flags=re.M)
    return date, title, body.strip()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="只出这一天，用于样张")
    a = ap.parse_args()
    today = datetime.date.today().isoformat()
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, "*.md")))
    done, seen_slugs = [], {}
    for f in files:
        date, title, body = parse(f)
        if a.only and date != a.only:
            continue
        if date >= today:                      # 时间墙：当日永不上站
            print(f"  ⏭  {date} 是当日/未来，按时间墙跳过")
            continue
        log = []
        # 🚨 一天可能发两封（2026-07-26：日更 + 本周回顾）。同名会静默覆盖，
        #    而两封都照样打 ✅ ——日志会骗人，所以这里必须显式撞车守卫。
        slug = date + ("-weekly" if re.search(r"回顾|收官", title) else "")
        path = os.path.join(OUT, f"{slug}.html")
        if slug in seen_slugs:
            raise RuntimeError(f"输出撞车：{slug} 已被 {seen_slugs[slug]} 占用，"
                               f"当前 {os.path.basename(f)}。加后缀区分，绝不覆盖。")
        seen_slugs[slug] = os.path.basename(f)
        body_html = build_body(body, date, slug, log)
        desc = re.sub(r"<[^>]+>", "", body_html)[:110].replace('"', "'").strip()
        open(path, "w", encoding="utf-8").write(
            HEAD.format(title=html.escape(title), date=date, slug=slug,
                        desc=html.escape(desc), site=SITE, body=body_html))
        imgs = [r for r in log if r[0] in ("精", "推")]      # log 里还混着破折号记录，别当图数
        inf = sum(1 for k, _, _ in imgs if k == "推")
        print(f"  ✅ {date}  图 {len(imgs)} 张（精确 {len(imgs)-inf} · 推 {inf}）  {title[:26]}")
        for k, src, rel in log:
            if k == "推":
                print(f"       [推] {rel} ← {src}")
        first = next((r for k, _, r in log if k in ("精", "推")), None)  # 首图做索引缩略图
        done.append((slug, date, title, first))
    print(f"\n  共出 {len(done)} 页 → {OUT}")
    if not a.only:
        print(f"  索引页 {write_index(done)} 条 · feed {write_feed(done)} 条 · 台账 {write_ledger(done)} 条")
    return done

if __name__ == "__main__":
    main()
