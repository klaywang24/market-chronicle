#!/usr/bin/env python3
"""生成「见证链看板」HTML（2026-08-04 新建，对标 访客数据/访客看板.html 的用法）。

Klay 的用法：跑一次生成，之后**每天双击打开就行** —— 页面在打开时自己去
GitHub raw 拉最新数据（raw.githubusercontent.com 回 Access-Control-Allow-Origin: *，
已实测），所以不需要再跑脚本、也不依赖本地仓库是不是最新。

🔑 三条设计（都从今晚的教训来）：
  1. **三档显示 ok / bad / unknown**。拉不到数据显示「没查到」，
     绝不显示成「正常」—— 家规 §46：报「测量失败」和报绿一样危险。
  2. **不信任任何单一来源**。链头快照那项给的是「去 Wayback 自己看」的直达链接，
     因为浏览器跨域查不了 IA，而**假装查过比不查更糟**。
  3. 页面上写死「现在该做什么」，红了不用回来问。

输出：见证链看板.html（已进 .gitignore，是本地工具不是站上内容 ——
      运维状态公开挂着，红的时候会变成别人的弹药）。
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# 默认写到**项目文件夹**（仓库外，和 访客数据/访客看板.html 同一层级的用法）：
#   …/美股编年史：market-chronicle/见证链看板.html
# 放仓外而不是仓内，是因为它是本地运维工具 —— 运维状态公开挂着，
# 红的时候会变成别人的弹药。仓内那份的 .gitignore 条目保留作兜底。
PROJECT = ROOT.parent.parent                     # KAPX/ 的上一层
OUT = (PROJECT / "见证链看板.html") if PROJECT.is_dir() else (ROOT / "见证链看板.html")
RAW = "https://raw.githubusercontent.com/klaywang24/market-chronicle/main"
REPO = "https://github.com/klaywang24/market-chronicle"

HTML = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>见证链看板 · 美股编年史</title>
<style>
:root{--bg:#FAF8F3;--card:#fff;--ink:#1a1a1a;--soft:#5a5a5a;--muted:#8a8a8a;
      --line:#e5e0d8;--ok:#00A86B;--bad:#FF2400;--unk:#B8893E}
*{box-sizing:border-box}
body{margin:0;padding:28px 20px 60px;background:var(--bg);color:var(--ink);
     font:15px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC",sans-serif}
.wrap{max-width:860px;margin:0 auto}
h1{font-size:26px;margin:0 0 6px;letter-spacing:-.3px}
.sub{color:var(--soft);font-size:13.5px;margin:0 0 4px}
.ts{color:var(--muted);font-size:12px;margin:0 0 24px}
.big{background:var(--card);border:1px solid var(--line);border-radius:14px;
     padding:22px;margin-bottom:18px;display:flex;align-items:center;gap:18px}
.dot{width:46px;height:46px;border-radius:50%;flex:0 0 46px;display:flex;
     align-items:center;justify-content:center;font-size:24px;color:#fff}
.big h2{margin:0 0 3px;font-size:19px}.big p{margin:0;color:var(--soft);font-size:13.5px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:22px}
@media(max-width:660px){.grid{grid-template-columns:1fr}}
.c{background:var(--card);border:1px solid var(--line);border-left-width:4px;
   border-radius:10px;padding:14px 16px}
.c h3{margin:0 0 4px;font-size:14px;display:flex;justify-content:space-between;gap:8px}
.c .d{color:var(--soft);font-size:12.5px;word-break:break-all}
.c .w{color:var(--muted);font-size:11.5px;margin-top:6px;font-style:normal}
h4{font-size:15px;margin:26px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--ink)}
table{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--card);
      border:1px solid var(--line);border-radius:10px;overflow:hidden}
th,td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--line)}
th{background:#f3efe7;font-weight:600;font-size:11.5px;color:var(--soft)}
tr:last-child td{border-bottom:none}
code{background:#f3efe7;padding:1.5px 5px;border-radius:4px;font-size:12px;
     font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:#2b2b2b;color:#eee;padding:12px 14px;border-radius:8px;overflow-x:auto;
    font-size:12px;line-height:1.5}
.steps{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:4px 18px}
.steps li{margin:11px 0;font-size:13.5px}.steps b{color:var(--ink)}
a{color:var(--bad)}
.note{font-size:12.5px;color:var(--muted);margin-top:10px}
</style></head><body><div class="wrap">

<h1>见证链看板</h1>
<p class="sub">这一页只回答一件事：<b>「证明台账没被改过」的那套机制，现在还在正常工作吗。</b>
它坏了不会影响读者看到的任何东西，所以只能靠主动看。</p>
<p class="ts">页面打开时自动拉取最新数据 · 本次加载 <span id="now"></span></p>

<div class="big" id="big">
  <div class="dot" style="background:var(--muted)">…</div>
  <div><h2 id="bigT">正在检查…</h2><p id="bigD">从 GitHub 拉取台账与锚定记录</p></div>
</div>

<div class="grid" id="cards"></div>

<h4>最近的锚定记录</h4>
<div id="hist"><p class="note">读取中…</p></div>

<h4>红了怎么办</h4>
<ol class="steps">
  <li><b>先本地复现一次</b>，看到底哪一项坏了：
    <pre>cd "/Users/klay/Documents/个人 Agent/美股编年史：market-chronicle/KAPX/market-chronicle 公开 git 仓库" \\
  &amp;&amp; git pull -q &amp;&amp; python3 scripts/check_witness_health.py</pre></li>
  <li><b>「锚定日志」红</b> = 存档结果没被留档。看
    <a href="REPO_URL/actions/workflows/daily.yml" target="_blank">daily 的运行记录</a>，
    锚定那步是不是失败了。</li>
  <li><b>「链头快照」红</b> = Internet Archive 上没有近期快照。手动补一次：
    <pre>python3 scripts/anchor_wayback.py --sha "$(git rev-parse HEAD)"</pre></li>
  <li><b>「daily 是否还活着」红</b> = 自动任务本身停了（<b>最严重</b>，2026-07-12 那次就是它，
    死了 4 天没人发现）。去
    <a href="REPO_URL/actions" target="_blank">Actions 页</a> 看是不是被禁用了
    ——GitHub 会在仓库长期无活动后自动停掉定时任务。</li>
  <li><b>全是 ❔</b> = 没查到，不是坏了。多半是网络或 GitHub raw 抽风，过一会儿再刷新。</li>
</ol>

<h4>三层报警是怎么跑的</h4>
<table>
<tr><th>层</th><th>什么时候跑</th><th>怎么通知你</th><th>管什么</th></tr>
<tr><td><b>①本页</b></td><td>你打开时</td><td>你自己看</td><td>随时想查就查</td></tr>
<tr><td><b>②daily 内</b></td><td>每交易日 18:00 美东</td><td>Discord 推送</td><td>当天出问题当天知道</td></tr>
<tr><td><b>③看门狗</b></td><td>每天 09:00 美东<br>（独立任务）</td><td><b>开 GitHub Issue<br>→ 自动发邮件</b></td>
    <td><b>连 daily 自己死了也能报</b><br>②在 daily 里面，daily 死了它也没了</td></tr>
</table>
<p class="note">③ 恢复后会自动关闭 Issue，免得旧告警一直挂着让人麻木。
三样通知一个都没有、本页又是绿的，才叫真的正常。</p>

<script>
const RAW="RAW_URL", REPO="REPO_URL";
const ICON={ok:"✓",bad:"!",unknown:"?"}, COLOR={ok:"var(--ok)",bad:"var(--bad)",unknown:"var(--unk)"};
const SLA={chain:4, anchor:4, snap:3, daily:4};
const days=s=>{if(!s)return null;const t=s.length>8?Date.parse(s.slice(0,10)):
  Date.parse(s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8));
  return isNaN(t)?null:Math.floor((Date.now()-t)/864e5)};

async function txt(u){const r=await fetch(u,{cache:"no-store"});if(!r.ok)throw 0;return r.text()}
async function lastJsonl(u){const t=await txt(u);const L=t.trim().split("\\n").filter(Boolean);
  return {last:JSON.parse(L[L.length-1]), all:L.map(x=>JSON.parse(x))}}

function card(name,st,detail,why){
  return `<div class="c" style="border-left-color:${COLOR[st]}">
    <h3><span>${name}</span><span style="color:${COLOR[st]}">${ICON[st]}</span></h3>
    <div class="d">${detail}</div><div class="w">${why}</div></div>`}

(async()=>{
  document.getElementById("now").textContent=new Date().toLocaleString("zh-CN");
  const out=[];

  // ① 链最后一行
  try{const {last}=await lastJsonl(RAW+"/data/ledger_hashes.jsonl");const a=days(last.date);
    out.push({n:"链最后一行",s:a<=SLA.chain?"ok":"bad",
      d:`${last.date}（${a} 天前）· 链头 <code>${last.chain.slice(0,16)}…</code>`,
      w:"数据本身还在不在逐日入链"});
  }catch(e){out.push({n:"链最后一行",s:"unknown",d:"拉取失败",w:"没查到 ≠ 没问题"})}

  // ② 锚定日志
  try{const {last,all}=await lastJsonl(RAW+"/data/anchor_log.jsonl");const a=days(last.date);
    const h=(last.results||[])[0]||{};
    let s="ok",d=`${last.date}（${a} 天前）`;
    if(a>SLA.anchor){s="bad";d+=" · 超过 "+SLA.anchor+" 天没有新记录"}
    else if(h.probe==="unknown"){s="unknown";d+=" · 那次未能查证（IA 限流）"}
    else if(!h.within_sla){s="bad";d+=` · 链头快照已 ${h.confirmed_age_days} 天前`}
    else{d+=` · 链头快照 <code>${h.timestamp||"?"}</code>`}
    out.push({n:"锚定日志",s,d,w:"存档结果有没有被留档（2026-08-04 之前它从未存在过）"});
    window.__hist=all;
  }catch(e){out.push({n:"锚定日志",s:"bad",
      d:"<b>anchor_log.jsonl 还不存在</b>",
      w:"第一条记录由 daily 生成；若长期不出现说明自我提交那步没生效"})}

  // ③ 链头快照 —— 浏览器跨域查不了 IA，给直达链接，不假装查过
  out.push({n:"链头快照（去 Wayback 自己看）",s:"unknown",
    d:`<a href="https://web.archive.org/web/2026*/chronicle.klay-wang.com/data/ledger_hashes.jsonl" target="_blank">点这里看日历 →</a> 最近一格应在 3 天内`,
    w:"浏览器跨域查不了 Internet Archive；假装查过比不查更糟。CI 每天替你查并记进②"});

  // ④ daily 是否还活着
  try{const r=await fetch("https://api.github.com/repos/klaywang24/market-chronicle/commits?path=data/kindex.json&per_page=1",{cache:"no-store"});
    const j=await r.json();const dt=j[0].commit.committer.date;const a=days(dt);
    out.push({n:"daily 是否还活着",s:a<=SLA.daily?"ok":"bad",
      d:`最后一次更新数据 ${dt.slice(0,10)}（${a} 天前）`,
      w:"最严重的一项：2026-07-12 那次 daily 整个死掉 4 天没人发现"});
  }catch(e){out.push({n:"daily 是否还活着",s:"unknown",d:"GitHub API 拉取失败",w:"没查到 ≠ 没问题"})}

  document.getElementById("cards").innerHTML=out.map(o=>card(o.n,o.s,o.d,o.w)).join("");

  const bad=out.filter(o=>o.s==="bad"), unk=out.filter(o=>o.s==="unknown");
  const st=bad.length?"bad":(unk.length?"unknown":"ok");
  const T={ok:["一切正常","四项体检全绿，见证链在正常工作。"],
           bad:[`${bad.length} 项异常`,"见证链有问题，往下看「红了怎么办」。异常："+bad.map(b=>b.n).join("、")],
           unknown:["部分未查到","不是故障，但本次结果不完整："+unk.map(b=>b.n).join("、")]}[st];
  const big=document.getElementById("big");
  big.querySelector(".dot").style.background=COLOR[st];
  big.querySelector(".dot").textContent=ICON[st];
  document.getElementById("bigT").textContent=T[0];
  document.getElementById("bigD").textContent=T[1];

  const H=window.__hist;
  document.getElementById("hist").innerHTML = H&&H.length
    ? `<table><tr><th>日期</th><th>SLA 内</th><th>超期</th><th>没测到</th><th>链头快照</th></tr>`
      + H.slice(-10).reverse().map(r=>{const h=(r.results||[])[0]||{};
          return `<tr><td>${r.date}</td><td>${r.within_sla??"-"}</td><td>${r.out_of_sla??"-"}</td>
          <td>${r.not_probed??"-"}</td><td><code>${h.timestamp||"-"}</code></td></tr>`}).join("")
      + `</table>`
    : `<p class="note">还没有锚定记录。第一条由 daily 生成（每交易日 18:00 美东）。</p>`;
})();
</script>
</div></body></html>
"""


def main() -> None:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="输出路径（默认写到项目文件夹）")
    out = Path(ap.parse_args().out) if ap.parse_args().out else OUT
    html = HTML.replace("RAW_URL", RAW).replace("REPO_URL", REPO)
    out.write_text(html, encoding="utf-8")
    globals()["OUT"] = out
    print(f"✅ 已生成 {OUT}")
    print(f"   {datetime.now(timezone.utc).astimezone():%Y-%m-%d %H:%M %Z}")
    print("   双击打开即可；页面每次打开自动拉最新数据，不必重跑本脚本。")


if __name__ == "__main__":
    main()
