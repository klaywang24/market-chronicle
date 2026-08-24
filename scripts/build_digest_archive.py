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

# ── 双源取材（2026-08-11 修死管线）：
#   冻结源 SRC＝Buttondown 抢救快照，覆盖 ≤2026-08-09，**永不再长**；
#   活源＝每日 digest/<日夹>[/子夹]/文案_final.md，≥ LIVE_CUTOVER 起由这里进。
#   没有这条活源，档案永远停在 08-09（前会话验尸结论，勿删活源再犯）。
LIVE_CUTOVER = "2026-08-10"
# 活源对外正文的结束边界：这些内部节起，往后全是流程与判据，绝不外泄
INTERNAL_HEADS = ("## 图槽", "## 回访清单", "## 🛑", "## 🔴")
# 分发物是「跳过节」不是「结束边界」（2026-08-24 修）：08-21 把 下周要回访的 / LinkedIn /
# 小红书 排在英文段两侧，若当结束边界，英文段会连同它们一起被截掉，双语页就永远出不来。
SKIP_SECTIONS = ("LinkedIn", "小红书", "下周要回访的")
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

    md = re.sub(r"!\[([^\]]*)\]\((https://assets\.buttondown\.email/images/[^)]+|local://card)\)", md_img, md)
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
<html lang="{htmllang}">
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
{alt}
<script>{themejs}</script>
<style>{ctlcss}</style>
</head>
<body>
{ctl}
<div class="dg-wrap">
<a class="dg-back" href="{backhref}">{backtext}</a>
<div class="dg-date">{date}</div>
<h1 class="dg-title">{title}</h1>
<div class="dg-wall">{walltext}</div>
<div class="dg-body">
<!--BODY-->{body}<!--/BODY-->
</div>
<div class="dg-foot">{foottext}</div>
</div>
<script>{togglejs}</script>
</body>
</html>
"""

# ── 右上角控件（2026-08-24 Klay 令：照个人网站 klay-wang.com 的样子）
#   机制与那边一致：<html data-theme> + localStorage 的 "theme" / "lang" 两个键，
#   aria-label 也沿用 Switch language / Toggle dark mode。
#   站上暗色靠 css/style.css 的 `.dark-mode` 类切 token，所以 data-theme 之外还要挂类。
THEME_JS = ('(function(){var t=localStorage.getItem("theme")||'
            '(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");'
            'var r=document.documentElement;r.setAttribute("data-theme",t);'
            'if(t==="dark")r.classList.add("dark-mode");})();')

TOGGLE_JS = ('(function(){var b=document.getElementById("dgTheme");if(!b)return;'
             'var r=document.documentElement;function paint(){var d=r.getAttribute("data-theme")==="dark";'
             'b.textContent=d?"\u2600":"\u263e";}paint();'
             'b.addEventListener("click",function(){var d=r.getAttribute("data-theme")==="dark";'
             'var t=d?"light":"dark";r.setAttribute("data-theme",t);r.classList.toggle("dark-mode",!d);'
             'localStorage.setItem("theme",t);paint();});})();')

CTL_CSS = """
.dg-ctl{position:fixed;top:16px;right:18px;display:flex;gap:8px;z-index:50}
.dg-ctl a,.dg-ctl button{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1;
  padding:7px 10px;border:1px solid var(--border,rgba(128,128,128,.35));border-radius:999px;
  background:var(--bg,#fff);color:var(--ink,#111);text-decoration:none;cursor:pointer;
  opacity:.72;transition:opacity .15s,border-color .15s}
.dg-ctl a:hover,.dg-ctl button:hover{opacity:1;border-color:var(--accent)}
@media(max-width:560px){.dg-ctl{top:10px;right:10px}.dg-ctl a,.dg-ctl button{padding:6px 9px;font-size:11px}}
.dg-wrap{max-width:760px;margin:0 auto;padding:48px 20px 96px}
.dg-back{font-size:13px;opacity:.7;text-decoration:none;display:inline-block;margin-bottom:28px}
.dg-date{font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.04em;opacity:.6}
.dg-title{font-family:'Fraunces',serif;font-size:clamp(26px,4.4vw,38px);line-height:1.28;margin:10px 0 6px}
.dg-wall{font-size:12.5px;opacity:.62;border-left:2px solid var(--accent);padding-left:10px;margin:18px 0 34px}
.dg-body{font-size:16.5px;line-height:1.86}
.dg-body p{margin:0 0 1.15em}
.dg-body h2{font-family:'Fraunces',serif;font-size:22px;margin:2.1em 0 .7em}
.dg-body h3{font-family:'Fraunces',serif;font-size:18px;margin:1.7em 0 .6em;opacity:.92}
.dg-body img{width:100%;height:auto;border-radius:10px;margin:1.5em 0;display:block}
.dg-body blockquote{border-left:2px solid var(--accent);padding-left:14px;margin:1.5em 0;opacity:.9}
.dg-body a{color:var(--accent)}
.dg-foot{margin-top:56px;padding-top:22px;border-top:1px solid var(--border,rgba(128,128,128,.25));font-size:13px;opacity:.72}
/* 墙/页脚/返回 里的链接此前没给颜色，吃浏览器默认蓝 rgb(0,0,238)：
   暗色下压在 #111 上对比度约 2:1 近乎隐形，亮色下也跟铁锈红设计系统冲突。 */
.dg-wall a,.dg-foot a,.dg-back{color:var(--accent);text-decoration:none}
.dg-wall a:hover,.dg-foot a:hover,.dg-back:hover{text-decoration:underline}
"""

def controls(other_href, other_label):
    lang = (f'<a href="{other_href}" aria-label="Switch language">{other_label}</a>'
            if other_href else "")
    return ('<div class="dg-ctl">' + lang +
            '<button id="dgTheme" type="button" aria-label="Toggle dark mode">\u263e</button></div>')




IDX_HEAD = """<!DOCTYPE html>
<html lang="{htmllang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{h1} · 美股编年史 Market Chronicle</title>
<link rel="canonical" href="{site}/digest/{canon}">
<meta name="description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="{h1} · 美股编年史">
<meta property="og:url" content="{site}/digest/{canon}">
<link rel="stylesheet" href="../css/style.css">
<link rel="alternate" type="application/rss+xml" title="美股编年史 · 判读档案" href="{site}/feed.xml">
<link rel="alternate" hreflang="{otherlang}" href="{site}/digest/{othercanon}">
<script>{themejs}</script>
<style>{ctlcss}
.dg-wrap{{max-width:820px}}
.dg-h1{{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,42px);margin:0 0 10px}}
.dg-lede{{font-size:15px;line-height:1.8;opacity:.75;max-width:62ch;margin:0 0 8px}}
.dg-yr{{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.1em;opacity:.5;margin:34px 0 12px}}
.dg-item{{display:flex;gap:16px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--border,rgba(128,128,128,.2));text-decoration:none;color:inherit}}
.dg-item:hover .dg-it{{color:var(--accent)}}
.dg-thumb{{width:104px;height:78px;object-fit:cover;border-radius:6px;flex:0 0 auto;background:rgba(128,128,128,.1)}}
.dg-meta{{font-family:'JetBrains Mono',monospace;font-size:11.5px;opacity:.55;letter-spacing:.03em}}
.dg-it{{font-size:16.5px;line-height:1.5;margin-top:4px;font-weight:500}}
.dg-tag{{font-size:10.5px;border:1px solid var(--accent);color:var(--accent);border-radius:3px;padding:1px 5px;margin-left:8px;vertical-align:1px}}
@media(max-width:560px){{.dg-thumb{{width:74px;height:56px}}.dg-it{{font-size:15px}}}}
</style>
</head>
<body>
{ctl}
<div class="dg-wrap">
<h1 class="dg-h1">{h1}</h1>
<p class="dg-lede">{lede}</p>
<div class="dg-wall">{walltext}</div>
{items}
</div>
<script>{togglejs}</script>
</body>
</html>
"""

def write_index(done, kind="cn"):
    """中英各出一份索引。英文索引只列有英文版的期数。"""
    cn = kind == "cn"
    items, cur_ym = [], None
    for slug, date, title, first_img, en_title in sorted(done, key=lambda x: x[1], reverse=True):
        if not cn and not en_title:
            continue
        ym = date[:7]
        if ym != cur_ym:
            cur_ym = ym
            items.append('<div class="dg-yr">' + ym.replace("-", " / ") + '</div>')
        lab = "回顾" if cn else "Weekly"
        tag = '<span class="dg-tag">' + lab + '</span>' if slug.endswith("-weekly") else ""
        thumb = ('<img class="dg-thumb" src="' + first_img + '" alt="" loading="lazy">'
                 if first_img else '<div class="dg-thumb"></div>')
        href = "./" + slug if cn else "./" + slug + ".en.html"
        shown = title if cn else en_title
        items.append('<a class="dg-item" href="' + href + '">' + thumb +
                     '<div><div class="dg-meta">' + date + '</div>'
                     '<div class="dg-it">' + html.escape(shown) + tag + '</div></div></a>')
    name = "index.html" if cn else "index.en.html"
    open(os.path.join(OUT, name), "w", encoding="utf-8").write(
        IDX_HEAD.format(
            site=SITE, items="\n".join(items),
            htmllang="zh-CN" if cn else "en",
            canon="" if cn else "index.en.html",
            othercanon="index.en.html" if cn else "",
            otherlang="en" if cn else "zh-CN",
            h1="判读档案" if cn else "The Archive",
            desc=("美股编年史每日判读的往期归档，逐日累积。当日判读只进订户邮箱，往期公开可查。"
                  if cn else
                  "Archived issues of Market Chronicle's daily reading. The current issue goes to "
                  "subscribers only; past issues are public."),
            lede=("每个交易日盘前一封，只做一件事：把当天的市场状态用可验证的数字讲清楚。"
                  "贵不贵、怕不怕、极端不极端。不预测方向，不做择时。"
                  if cn else
                  "One email before every open, doing one thing: stating the day's market condition "
                  "in numbers you can check. Expensive or not, afraid or not, extreme or not. "
                  "No direction calls, no market timing."),
            walltext=("当日判读全文只在盘前送进订户邮箱："
                      '<a href="' + SITE + '/subscribe">订阅</a>后每个交易日开盘前送达。往期在此公开可查，逐日累积。'
                      if cn else
                      "The full current issue goes to subscribers before the open: "
                      '<a href="' + SITE + '/subscribe">subscribe</a>. Past issues are public here.'),
            themejs=THEME_JS, togglejs=TOGGLE_JS, ctlcss=CTL_CSS,
            ctl=controls("./index.en.html" if cn else "./", "EN" if cn else "中文")))
    return sum(1 for d in done if cn or d[4])


def write_feed(done):
    """Substack 的 Import posts 吃「website with an RSS feed」，所以全文进 feed。
    图用绝对地址（相对路径导过去会断）。"""
    import xml.sax.saxutils as su
    entries = []
    for slug, date, title, *_ in sorted(done, key=lambda x: x[1], reverse=True):
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
              "kind": "weekly" if s.endswith("-weekly") else "daily",
              "title_en": en, "url_en": (f"{SITE}/digest/{s}.en.html" if en else None)}
             for s, d, t, _, en in sorted(done, key=lambda x: x[1], reverse=True)]
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
    return date, title, body.strip(), s


def live_files(cutover):
    """活源清单：<日夹>/文案_final.md 与 <日夹>/<子夹>/文案_final.md（周回顾在子夹）。
    只收日夹日期 ≥ cutover 的——冻结快照覆盖 ≤2026-08-09，重叠会撞 slug 守卫。"""
    out = []
    for p in sorted(glob.glob(os.path.join(CARDS, "20*", "文案_final.md")) +
                    glob.glob(os.path.join(CARDS, "20*", "*", "文案_final.md"))):
        m = re.search(r"/(\d{4}-\d{2}-\d{2})/", p.replace(os.sep, "/"))
        if m and m.group(1) >= cutover:
            out.append(p)
    return out


def parse_live(path):
    """活源解析：从工作稿抽**对外正文**，内部段绝不外泄。
    ⚠️ 三条判据与 `每日 digest/tools/to_substack.py` 保持一致（那边改了这边必须跟）：
       ①起点 = 「## ⚡」 ②剔除 = `>` 行 / `### ` 行 / LinkedIn 节 ③图位 = 〖图N：卡名〗
    与邮件出口的两处已知差异（故意的，不是漏）：
       · 不注入换平台开场白/结尾 footer——档案页模板自带 dg-wall/dg-foot；
       · 英文节不自动配 _EN 卡（那条配对判据只活在出口里，不复制第二份）。
    日期口径 = 日夹名（数据日）。冻结段用的是邮件发送日，两段口径差一并记录在案：
    周回顾产在周五日夹（发送在其后 1-3 天），§七「日期=数据的美东交易日」下周五更合理。"""
    raw = open(path, encoding="utf-8").read()
    m = re.search(r"/(\d{4}-\d{2}-\d{2})/", path.replace(os.sep, "/"))
    date = m.group(1)
    # 标题块两种格式并存（2026-08-24 实测：08-18/19/21 是新式，08-20 又是旧式，
    # 不是一次性切换⇒两种都必须收，只认一种会在新式那天整条管线抛异常打死，
    # 后面所有期数（含 08-21 周报）全部进不了站——这正是 08-18 起档案停更的真因）。
    #   ①旧式：`## 邮件标题` → `**推荐**` → ``` 代码块
    #   ②新式：`## 邮件标题` → 空行 → 标题正文一行
    # 「不许猜标题」的红线保留：两种都取不到仍然抛，绝不退回文件名或正文首句。
    tm = re.search(r"##\s*邮件标题.*?\*\*推荐\*\*\s*```\s*\n(.+?)\n\s*```", raw, re.S)
    if tm:
        title = tm.group(1).strip()
    else:
        blk = re.search(r"##\s*邮件标题[^\n]*\n(.*?)(?=\n##\s|\Z)", raw, re.S)
        title = ""
        if blk:
            for ln in blk.group(1).split("\n"):
                t = ln.strip()
                if t and not t.startswith((">", "#", "```", "**", "-", "备选")):
                    title = t
                    break
        if not title:
            raise RuntimeError(f"{path}: 「邮件标题」下两种格式都取不到，不许猜标题")
    # 正文起点：08-21 起稿子把 `## ⚡ 三行干货` 的 emoji 去掉了，只认 "## ⚡" 会整篇取不到正文
    #（2026-08-24 实测：08-21 周报因此进不了站）。两种写法都收，仍然只认「三行干货」这一节做起点。
    start = -1
    for mark in ("## ⚡", "## 三行干货"):
        if mark in raw:
            start = raw.index(mark)
            break
    if start < 0:
        raise RuntimeError(f"{path}: 没有「## ⚡ / ## 三行干货」起点，格式变了先对齐 to_substack 再说")
    ends = [i for i in (raw.find("\n" + h, start) for h in INTERNAL_HEADS) if i > 0]
    body = raw[start:min(ends)] if ends else raw[start:]
    out, skip = [], False
    for ln in body.split("\n"):
        st = ln.strip()
        if st.startswith("## "):
            skip = st[3:].strip().startswith(SKIP_SECTIONS)
            if skip:
                continue
        if skip or st.startswith(">"):
            continue
        out.append(ln)
    body = "\n".join(out)
    # 图标记原样留着，语言变体（_纯中文 / _EN）由 main 按出哪一版决定
    return date, title, body.strip(), raw


LEDGER = os.path.abspath(os.path.join(REPO, "..", "..", "期权数据管线", "data", "发布台账.csv"))

def ledger_special(folder_date):
    """特刊（周报/月报）的**发布证明**与**实发标题**，都取自发布台账。
    为什么必须走台账（2026-08-11 正向样本抓出来的，别退回草稿标题）：
      ① 草稿推荐块标题 ≠ 实发标题（8.3-8.7 周回顾：草稿「你惦记的存储…」，
         实发「你的票…· 8.3-8.7 本周回顾」——按草稿判「回顾」会静默漏掉整个特刊）；
      ② 档案＝发出去的东西。台账行是「发出去了」的唯一证明——没有行就不上站，
         防止「周五写好、周一才发，周末先上了站」的时间墙泄漏。
    匹配窗＝日夹日期起 7 天内的 回顾/收官 行；标题优先邮件平台（substack/buttondown）。"""
    import csv as _csv
    end = (datetime.date.fromisoformat(folder_date) + datetime.timedelta(days=7)).isoformat()
    try:
        rows = list(_csv.DictReader(open(LEDGER, encoding="utf-8")))
    except FileNotFoundError:
        return None
    hits = [r for r in rows
            if folder_date <= (r.get("date") or "") <= end
            and re.search(r"回顾|收官", (r.get("content_type") or "") + (r.get("title") or ""))
            and (r.get("title") or "").strip()]
    if not hits:
        return None
    pref = next((r for r in hits if r.get("platform") in ("substack", "buttondown")), hits[0])
    return pref["title"].strip(), pref["date"]

# ── 周区间后缀（2026-08-24 Klay 令：标题要带日期区间）
#   只补**缺**的：实发标题已含区间就原样不动（08-21「…8.17-8.21 本周回顾」就是实发带的）。
#   只作用于**周报**：月报走「收官」，套周一到周五会把「7月收官」标成 7.27-7.31＝事实错误。
#   ⚠️ 补出来的区间是**展示层**，台账里的实发标题不动——档案标题因此可能与实发差一个后缀，
#      这是 Klay 明令要的，不是脚本擅自改写实发（§45/§46 的「取实发」仍由 ledger_special 保证）。
RANGE_RE = re.compile(r"\d{1,2}\s*[.\-/]\s*\d{1,2}\s*[-–—~]\s*\d{1,2}\s*[.\-/]\s*\d{1,2}|\d{4}\s*[-–—~]\s*\d{4}")

def with_week_range(title, date):
    """周报标题缺日期区间时，按该期所在周的周一到周五补一个。"""
    if "收官" in title or RANGE_RE.search(title):
        return title
    d = datetime.date.fromisoformat(date)
    mon = d - datetime.timedelta(days=d.weekday())
    fri = mon + datetime.timedelta(days=4)
    return f"{title} \u00b7 {mon.month}.{mon.day}-{fri.month}.{fri.day}"

# ── 中英拆分（2026-08-24 Klay 令：站上一页只有一种语言，切换靠跳转不靠拼接）
# 英文段起点三种写法都见过，按优先级找**正文起点之后**最早的一个：
#   ①冻结源（Buttondown）：内联 HTML 里的 "English edition" 字面量（07-26/08-02 是 <div>，08-09 是 <h2>）
#   ②活源 08-21：`## English edition · title + subtitle`
#   ③活源 08-14：`## ⚡ Three-Line Summary`——它不含 "English edition" 字样
# ⇒ 通用判据＝正文起点后第一个「整行不含中日韩字符的 ## 标题」，冻结源退回字面量。
CJK_RE = re.compile(r"[一-鿿぀-ヿ가-힯]")

def split_cn_en(body):
    """把正文切成（中文正文, 英文正文）。没有英文段则英文为空串。"""
    cut = -1
    for m in re.finditer(r"^##\s+(.+)$", body, re.M):     # ②③：第一个无中日韩字符的二级标题
        if not CJK_RE.search(m.group(1)):
            cut = m.start()
            break
    if cut < 0:                                            # ①：冻结源没有 ## 结构，退回字面量
        m = re.search(r"^.*English edition.*$", body, re.M)
        if m:
            cut = m.start()
    if cut < 0:
        return body, ""
    return trim_cn_tail(body[:cut]), strip_en_scaffold(body[cut:].strip())


# 中文段尾部常挂着「换语言」的分隔块：`---` / 🌍 **English edition** / `---`。
# 它排在英文段起点**之前**，所以拆分时留在中文侧——08-14 中文页因此在末尾多出一条
# 「🌍 English edition」横幅（Klay 08-24 报）。从尾往回剪掉分隔线与该字样，剪到真正的正文为止。
CN_TAIL_JUNK = re.compile(r"^\s*(-{3,}|\*{3,}|_{3,}|<hr\s*/?>|.*English edition.*)\s*$", re.I)

def trim_cn_tail(cn):
    lines = cn.rstrip().split("\n")
    while lines and (not lines[-1].strip() or CN_TAIL_JUNK.match(lines[-1])):
        lines.pop()
    return "\n".join(lines).rstrip()


# 英文段开头常是标题脚手架（`## English edition · title + subtitle` 下面挂 Title:/Subtitle:/
# 备选/**推荐标题** 代码块）。它是**给编辑看的**，不是正文——H1 已经是标题，正文里再来一遍
# 就成了「文章开头先把自己的标题念一遍」。整块丢到下一个 ## 为止。
# 只丢**含 English edition 字样**的那一节；08-14 的英文正文直接从 `## ⚡ Three-Line Summary`
# 起，不含这类脚手架，判据不会误伤。
def strip_en_scaffold(en):
    # ①活源：`## English edition · title + subtitle` 整节（Title:/Subtitle:/备选）丢到下一个 ##
    m = re.match(r"^##\s*[^\n]*English edition[^\n]*\n", en)
    if m:
        rest = en[m.end():]
        nxt = re.search(r"^##\s", rest, re.M)
        return rest[nxt.start():].strip() if nxt else rest.strip()
    # ②冻结源：分界是内联 HTML（<div>🌍 English edition</div> 或 <h2>English edition</h2>），
    #   不是 markdown 标题 ⇒ 上面那条吃不到。先丢掉这一行本身。
    lines = en.split("\n")
    if lines and "English edition" in lines[0]:
        lines = lines[1:]
    en = "\n".join(lines).lstrip("\n")
    # ③冻结源 08-09 紧跟一个 <h3>Subject line</h3> + ``` 代码块＝英文主标题，
    #   已经渲染成 H1 了，正文里不再重复一遍。
    m = re.match(r"^[^\n]*Subject line[^\n]*\n\s*```[^\n]*\n.*?\n\s*```\s*\n", en, re.S)
    return (en[m.end():] if m else en).strip()

# 英文标题：显式写了就用显式的；三种写法都没有就退回中文标题（07-26/08-02 属此类，
# 它们的英文段直接从 TL;DR 开始，源里根本没有英文主标题——不许自己编一个）。
EN_TITLE_PATS = (
    r"Subject line</h3>\s*```\s*\n(.+?)\n",                 # 冻结源 08-09
    r"^\s*Title:\s*(.+?)\s*$",                              # 活源 08-21
    r"\*\*推荐标题\*\*\s*```\s*\n(.+?)\n",                  # 活源 08-14
)

def en_title_of(en_body, cn_title):
    for pat in EN_TITLE_PATS:
        m = re.search(pat, en_body, re.M | re.S)
        if m and m.group(1).strip():
            return m.group(1).strip(), True
    return cn_title, False

# ── 英文页配图（2026-08-24 Klay 令：英文版不能只有文字）
# 判据不是我发明的，照抄 `每日 digest/tools/to_substack.py:196` 那条既有规则：
#   「中文段的 〖图N：文件名〗 顺序＝这一期真正的配图顺序，英文段照它走」，
#   英文段源稿本来就不放图位，配图在出口按**节序**注入，用同一张卡的 _EN / _纯英文 版本。
# 与那边保持一致的两点：①图排在小节标题**之前** ②英文 alt 不碰中文文件名（读屏/抓取会读到）。
EN_VARIANTS = ("_EN", "_纯英文", "_英文主", "_双语")

def en_sibling(cn_name, dirs):
    """把中文页用的那张卡换成同一张卡的英文版；找不到返回 None（不硬凑、不拿中文卡冒充）。"""
    stem = os.path.splitext(cn_name)[0]
    for v in VARIANT_PREF:
        if stem.endswith(v):
            stem = stem[:-len(v)]
            break
    for suf in EN_VARIANTS:
        hit = find_card(stem + suf + ".png", dirs)
        if hit:
            return os.path.basename(hit)
    return None

def inject_en_figures(en, names):
    """按节序把图插进英文正文：第 k 张排在第 k 个小节标题之前。
    锚点三选一（活源/冻结源体例不同）：优先 `## [Category]`（与 to_substack 同口径），
    没有就退回全部 `## ` 标题，再没有就用内联 <h3>（冻结源就是这种）。多出来的图补在文末。"""
    if not names:
        return en
    lines = en.split("\n")
    for pat in (r"^##\s+\[", r"^##\s+\S", r"^\s*<h3\b"):
        rx = re.compile(pat)
        if sum(1 for l in lines if rx.search(l)) >= len(names):
            break
    out, k = [], 0
    for ln in lines:
        if k < len(names) and rx.search(ln):
            out += [f"![{names[k]}](local://card)", ""]
            k += 1
        out.append(ln)
    for nm in names[k:]:                       # 锚点不够用，剩下的补在文末，绝不丢图
        out += ["", f"![{nm}](local://card)"]
    return "\n".join(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="只出这一天，用于样张")
    ap.add_argument("--live-cutover", default=LIVE_CUTOVER,
                    help="活源起始日。默认=冻结快照终点次日；改小仅用于测试样张，生产别动")
    a = ap.parse_args()
    today = datetime.date.today().isoformat()
    os.makedirs(OUT, exist_ok=True)
    entries = ([(f, parse) for f in sorted(glob.glob(os.path.join(SRC, "*.md")))] +
               [(f, parse_live) for f in live_files(a.live_cutover)])
    done, seen_slugs = [], {}
    for f, parser in entries:
        # 日更的解析失败不许打死整条管线（2026-08-24 实测两次：08-18 标题块换式、
        # 08-19 缺「## ⚡」⇒ 全量跑在中途抛异常，后面所有期数含 08-21 周报全部进不了站，
        # 而日更按 §46 本来就不进站＝为一个不上站的文件牺牲掉所有上站的文件）。
        # 周报/月报（住日夹子夹）解析失败仍然硬抛：那是真要上站的东西，不许静默漏。
        _sub = os.path.basename(os.path.dirname(f)).strip()
        _is_special_path = parser is parse_live and not re.match(r"\d{4}-\d{2}-\d{2}$", _sub)
        try:
            date, title, body, raw = parser(f)
        except RuntimeError as e:
            if _is_special_path:
                raise
            print(f"  ⚠️  日更解析失败，按 §46 反正不进站，跳过不阻断：{e}")
            continue
        special = False
        if parser is parse_live:
            # 活源的特刊按**目录结构**识别（周报/月报住日夹的子夹，日更住日夹根）。
            # 特刊须有发布台账行才放行，且标题以台账（实发）为准——理由见 ledger_special。
            sub = os.path.basename(os.path.dirname(f)).strip()
            if not re.match(r"\d{4}-\d{2}-\d{2}$", sub):
                led = ledger_special(date)
                if not led:
                    print(f"  ⏳ {date} 特刊未见发布台账回顾/收官行，待发布后自动进站：{title[:22]}")
                    continue
                title, pub = led
                special = True
                print(f"  [台账] {date} 特刊按实发标题进站（发布于 {pub}）：{title[:30]}")
        if a.only and date != a.only:
            continue
        if date >= today:                      # 时间墙：当日永不上站
            print(f"  ⏭  {date} 是当日/未来，按时间墙跳过")
            continue
        # §46 口径（2026-08-11 Klay 复核后维持）：**站上档案只收周报/月报**。
        # 日更正文不上本站——它们公开在 Substack 归档里（2026-08-11 经 RSS 导入）。
        # 判据只有这一处实现，别在别处另写一份（活源特刊由台账放行，等价于同一判据）。
        if not special and not re.search(r"回顾|收官", title):
            print(f"  ⏭  {date} 日更，按 §46 不进站（公开在 Substack）：{title[:22]}")
            continue
        title = with_week_range(title, date)
        # 🚨 一天可能发两封（2026-07-26：日更 + 本周回顾）。同名会静默覆盖，
        #    而两封都照样打 ✅ ——日志会骗人，所以这里必须显式撞车守卫。
        slug = date + ("-weekly" if special or re.search(r"回顾|收官", title) else "")
        if slug in seen_slugs:
            raise RuntimeError(f"输出撞车：{slug} 已被 {seen_slugs[slug]} 占用，"
                               f"当前 {os.path.basename(f)}。加后缀区分，绝不覆盖。")
        seen_slugs[slug] = os.path.basename(f)

        # 中英各出一页：一页只有一种语言，右上角切换是**跳转**，不是同页拼接。
        cn_body, en_body = split_cn_en(body)
        en_title, en_explicit = en_title_of(raw, title)     # 标题去 raw 里找：08-14 的英文标题写在正文起点之前
        has_en = bool(en_body.strip())
        variants = [("cn", slug, cn_body, title)]
        if has_en:
            variants.append(("en", slug + ".en", en_body, en_title))
        else:
            print(f"  ⚠️  {date} 没有英文段，只出中文页")

        first, cn_cards = None, []
        for kind, vslug, vbody, vtitle in variants:
            log = []
            if kind == "cn":
                vbody = re.sub(r"〖图\d+：([^〗]+)〗", r"![\1_纯中文.png](local://card)", vbody)
            else:
                dirs = search_dirs(date)
                sibs = [(c, en_sibling(c, dirs)) for c in cn_cards]
                miss = [c for c, e in sibs if not e]
                if miss:
                    print(f"       ⚠️ {date} 英文版缺卡 {len(miss)}/{len(sibs)}：" +
                          "、".join(m[:24] for m in miss[:3]))
                vbody = inject_en_figures(vbody, [e for _, e in sibs if e])
            body_html = build_body(vbody, date, vslug, log)
            desc = re.sub(r"<[^>]+>", "", body_html)[:110].replace('"', "'").strip()
            other = (slug + ".en.html") if kind == "cn" else (slug + ".html")
            open(os.path.join(OUT, f"{vslug}.html"), "w", encoding="utf-8").write(
                HEAD.format(
                    htmllang="zh-CN" if kind == "cn" else "en",
                    title=html.escape(vtitle), date=date, slug=vslug,
                    desc=html.escape(desc), site=SITE, body=body_html,
                    alt=(f'<link rel="alternate" hreflang="{"en" if kind=="cn" else "zh-CN"}" '
                         f'href="{SITE}/digest/{other[:-5]}">' if has_en else ""),
                    themejs=THEME_JS, togglejs=TOGGLE_JS, ctlcss=CTL_CSS,
                    ctl=controls(other if has_en else "", "EN" if kind == "cn" else "中文"),
                    backhref="./" if kind == "cn" else "./index.en.html",
                    backtext="← 判读档案" if kind == "cn" else "← Archive",
                    walltext=("这是往期归档。当日判读全文只在盘前送进订户邮箱："
                              f'<a href="{SITE}/subscribe">订阅</a>后每个交易日开盘前送达。'
                              if kind == "cn" else
                              "This is an archived issue. The full daily reading goes to subscribers "
                              f'before the open: <a href="{SITE}/subscribe">subscribe</a>.'),
                    foottext=("美股编年史 Market Chronicle · 本文为历史归档，数字与判断均为当日口径，事后不回改。<br>"
                              "本站不提供投资建议，不预测方向，不做择时。"
                              if kind == "cn" else
                              "Market Chronicle · Archived issue. Figures and judgments are as of that day "
                              "and are never revised after the fact.<br>"
                              "No investment advice. No direction calls. No market timing.")))
            imgs = [r for r in log if r[0] in ("精", "推")]
            inf = sum(1 for k, _, _ in imgs if k == "推")
            tag = "中" if kind == "cn" else "EN"
            note = "" if (kind == "cn" or en_explicit) else "  ⚠️英文标题源里没有，退回中文标题"
            print(f"  ✅ {date} [{tag}]  图 {len(imgs)} 张（精确 {len(imgs)-inf} · 推 {inf}）  {vtitle[:26]}{note}")
            for k, src, rel in log:
                if k == "推":
                    print(f"       [推] {rel} ← {src}")
            if kind == "cn":
                first = next((r for k, _, r in log if k in ("精", "推")), None)
                cn_cards = [src for k, src, _ in log if k in ("精", "推")]
        done.append((slug, date, title, first, en_title if has_en else None))
    print(f"\n  共出 {len(done)} 页 → {OUT}")
    if not a.only:
        ncn, nen = write_index(done, "cn"), write_index(done, "en")
        print(f"  索引页 中 {ncn} 条 / EN {nen} 条 · feed {write_feed(done)} 条 · 台账 {write_ledger(done)} 条")
    return done

if __name__ == "__main__":
    main()
