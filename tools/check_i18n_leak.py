#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""EN 态中文残留全站扫描（2026-08-07 建 · §49.18 那轮的量具）。

用法：
    python3 tools/check_i18n_leak.py                 # index.html 的 EN 态
    python3 tools/check_i18n_leak.py index.html zh   # 🔑 负向自验，见下

扫两层：DOM 文本节点 + ECharts option 里的字符串（图表内文字不在 DOM 里，只扫 DOM 会漏）。
遍历全部 tab，每切一个等容器宽度签名连续两次不变才扫（等布局稳，不是等固定时长）。

🔑 **报「零残留」之前先跑 zh 态**：中文态本该扫出成百上千条，若也接近零，说明探针/选择器
   失效，此时 en 态的干净是假的。本脚本对 zh 态硬判：<100 条即 exit 2 报测量失败（§55/§56）。

⚠️ **本尺够不到的两个地方**（2026-08-07 实证，别以为它全绿就是全对）：
   ① **hover 层**：tooltip 由 formatter 运行时生成，DOM 里根本不存在 ⇒ 只能去 js/app.js
      审计 formatter 里的中文串，逐条对 i18n.js 的 D/P 验覆盖。那轮 7 条漏翻全是这么抓的。
   ② **数据分支**：当前数据没走到的分支渲染不出来（如恐贪窗口开启态的文案）⇒ 同样靠代码审计。

✅ **有意保留、不是漏译的 5 条**（下个会话别再报它们）：
   digest 存档两条标题（数据契约＝邮件标题原样照录，且链接指向中文内容）、语言按钮的「简」
   （显示的是切过去会变成的语言）、KAPX/Fear-Price 官方定义段里的中文名（命名台账的双语身份）。
"""
import functools, http.server, json, os, re, socketserver, subprocess, sys, threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # 仓根 = 本文件的上一级
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGE = sys.argv[1] if len(sys.argv) > 1 else "index.html"
LANG = sys.argv[2] if len(sys.argv) > 2 else "en"   # zh = 负向自验：中文态必须扫出成百上千条

PROBE = r"""
<script>localStorage.setItem('mc-lang','__LANG__');</script>
<script>
window.addEventListener('load', function(){
  var CJK=/[㐀-鿿豈-﫿]/;
  function scanDOM(res){
    var w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while((n=w.nextNode())){
      var t=(n.nodeValue||'').trim();
      if(!t || !CJK.test(t)) continue;
      var el=n.parentElement; if(!el) continue;
      var tag=el.tagName;
      if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT') continue;
      // 跳过隐藏元素
      var vis=true, p=el;
      while(p && p!==document.body){ var cs=getComputedStyle(p);
        if(cs.display==='none'||cs.visibility==='hidden'){vis=false;break;} p=p.parentElement; }
      var key=t.slice(0,90);
      var ctx=el.closest('[id]'); var where=(ctx?ctx.id:'')+'<'+tag.toLowerCase()+'>';
      if(!res[key]) res[key]={where:where, vis:vis, n:0};
      res[key].n++; if(vis) res[key].vis=true;
    }
  }
  function scanCharts(res){
    if(!window.echarts) return;
    document.querySelectorAll('[id^="ch-"],[id$="-fd-pe"],.chart').forEach(function(el){
      var ins=echarts.getInstanceByDom(el); if(!ins||ins.isDisposed()) return;
      var o; try{ o=JSON.stringify(ins.getOption()); }catch(e){ return; }
      var m=o.match(/"[^"]*[㐀-鿿][^"]*"/g)||[];
      m.forEach(function(s){
        var t;
        try{ t=JSON.parse(s); }catch(e){ return; }
        t=t.trim().slice(0,90);
        var key='[chart:'+el.id+'] '+t;
        if(!res[key]) res[key]={where:el.id,vis:true,n:0};
        res[key].n++;
      });
    });
  }
  var tabs=[].map.call(document.querySelectorAll('.tab'),function(t){return t.dataset.panel;}).filter(Boolean);
  var i=0, res={};
  function sig(){ return [].map.call(document.querySelectorAll('[id^="ch-"]'),function(e){return e.clientWidth+':'+(e.querySelector('canvas')?1:0);}).join(','); }
  function stable(cb,tries,last){
    var s=sig();
    if(s===last||tries<=0){ setTimeout(cb,600); return; }
    setTimeout(function(){ stable(cb,tries-1,s); },500);
  }
  function step(){
    if(i>=tabs.length){
      scanDOM(res); scanCharts(res);
      var d=document.createElement('div'); d.id='LEAK';
      d.textContent='@@'+JSON.stringify(res)+'@@';
      document.body.appendChild(d); document.title='LEAKDONE';
      return;
    }
    var p=tabs[i++];
    var t=[].find.call(document.querySelectorAll('.tab'),function(x){return x.dataset.panel===p;});
    if(t) t.click();
    stable(function(){ scanDOM(res); scanCharts(res); step(); }, 24, null);
  }
  setTimeout(step, 1200);
});
</script>
"""

src = open(os.path.join(ROOT, PAGE), encoding='utf-8').read()
tmp_name = "__leak_scan_tmp.html"
open(os.path.join(ROOT, tmp_name), 'w', encoding='utf-8').write(
    src.replace('<head>', '<head>'+PROBE.replace('__LANG__', LANG), 1))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k): pass
handler = functools.partial(Quiet, directory=ROOT)
httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
port = httpd.server_address[1]

try:
    r = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--window-size=1440,1000",
        "--virtual-time-budget=90000", "--dump-dom",
        f"http://127.0.0.1:{port}/{tmp_name}"], capture_output=True, text=True, timeout=300)
    m = re.search(r'@@(\{.*\})@@', r.stdout, re.S)
    if not m:
        print("MEASUREMENT FAILED: 探针没产出结果标记"); sys.exit(2)
    res = json.loads(m.group(1))
finally:
    httpd.shutdown()
    os.remove(os.path.join(ROOT, tmp_name))

vis = {k: v for k, v in res.items() if v.get('vis')}
hid = {k: v for k, v in res.items() if not v.get('vis')}
print(f"== {PAGE} [{LANG} 态]: 可见残留 {len(vis)} 条, 仅隐藏态 {len(hid)} 条")
if LANG == "zh" and len(vis) < 100:
    print("🔴 测量失败：中文态本该扫出成百上千条，只有 %d 条 —— 探针或选择器失效，"
          "此时 en 态的「零残留」不可信。" % len(vis)); sys.exit(2)
for k, v in sorted(vis.items(), key=lambda kv: -kv[1]['n']):
    print(f"  [{v['n']}x @ {v['where']}] {k}")
if hid:
    print("-- hidden only --")
    for k, v in sorted(hid.items(), key=lambda kv: -kv[1]['n'])[:40]:
        print(f"  [{v['n']}x @ {v['where']}] {k}")
