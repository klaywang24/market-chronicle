#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""站上图表溢出自检（2026-08-02 建）· 无新依赖，用本机 Chrome headless

## 为什么有这个

Klay 截图点名：恐惧的标价台账那张，猩红的前向段**整条 15 个点全画在绘图区外**，末点溢出
219px；杠杆基金净头寸、短端 vs 长端等多张同病，几乎整个面板都在溢出。

**根因不是样式，是 ECharts 记的容器宽度是旧的**：实测 `inst.getWidth()` = 1086 而
`el.clientWidth` = 867，坐标系按 1086 算，画出来自然冲出右边界（1086 / 867 ≈ 1.25）。
站上原本有两处 resize（切面板后 app.js、window.resize），但两处都是**在某个时刻主动调一次**，
而容器宽度是在那之后才稳定的（tab 从 display:none 切出来、字体加载、目录栏出现都会改宽度）。
**时点式的 resize 治不了时点之后发生的布局变化。** 已改为 ResizeObserver 由尺寸变化驱动，
外加 visibilitychange 兜底。这个脚本是那条修复的守门人。

## 判据（①是因，②是果，两条都查）

① `inst.getWidth()` == `el.clientWidth`（容差 1px）—— 不等即坐标系用了旧尺寸。
② 每条 series 的最后一个非空点，像素 x 必须 ≤ grid 右边界（容差 2px）。
   万一将来出现别的成因，②仍然拦得住。

## 🚨 为什么必须用 headless 而不是预览标签

在 Claude 的预览标签里跑，`document.visibilityState` 是 **hidden**，
`requestAnimationFrame` 与 `ResizeObserver` 回调被浏览器**整体暂停**（实测 rAF 触发 0 次）。
拿它测会得到「修复没生效」的假结论 —— 我第一次就是这么误判的。
headless Chrome 里页面是 visible 的，才测得准。

## 用法
    python3 tools/check_chart_overflow.py                       # 默认本地 8123
    python3 tools/check_chart_overflow.py https://chronicle.klay-wang.com/
"""
import json, os, re, subprocess, sys

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8123/"

PROBE = r"""
<script>
(function(){
  function scan(){
    var out=[];
    document.querySelectorAll('[id^="ch-"]').forEach(function(el){
      if(!el.clientWidth) return;
      var ins = window.echarts && echarts.getInstanceByDom(el);
      if(!ins || ins.isDisposed()) return;
      var r={id:el.id, elW:el.clientWidth, insW:ins.getWidth(), over:[]};
      r.stale = Math.abs(r.insW-r.elW) > 1;
      var o; try{ o=ins.getOption(); }catch(e){ return; }
      var g = (o.grid && o.grid[0]) || null;
      if(g && typeof g.right === 'number'){
        var gr = r.elW - g.right;
        (o.series||[]).forEach(function(se,i){
          if(!Array.isArray(se.data)) return;
          var pts = se.data.filter(function(d){ return Array.isArray(d) && d[1]!=null; });
          if(!pts.length) return;
          var px; try{ px=ins.convertToPixel({seriesIndex:i}, pts[pts.length-1]); }catch(e){ return; }
          if(px && px[0] > gr+2)
            r.over.push({s:(se.name||i), x:Math.round(px[0]), gr:Math.round(gr)});
        });
      }
      out.push(r);
    });
    return out;
  }
  var panels=[].map.call(document.querySelectorAll('.tab'), function(t){return t.dataset.panel;})
              .filter(Boolean);
  var res={}, i=0;
  function step(){
    if(i>=panels.length){
      var d=document.createElement('div'); d.id='OV';
      d.textContent='@@'+JSON.stringify(res)+'@@'; document.body.appendChild(d);
      return;
    }
    var p=panels[i++];
    var t=[].find.call(document.querySelectorAll('.tab'), function(x){return x.dataset.panel===p;});
    if(t) t.click();
    setTimeout(function(){ res[p]=scan(); step(); }, 2600);
  }
  setTimeout(step, 2500);
})();
</script>
"""


def main():
    # 🔴 探针必须**注入进页面**才能跑。直接 `--dump-dom <url>` 是拿不到探针结果的
    #    （首版就这么写的，报「探针没回话」）。做法：把 index.html 复制一份、把探针塞进
    #    </body> 之前，再用同源的 http 地址打开 —— 同源才能正常加载 js/ 与 data/。
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(here, "index.html"), encoding="utf-8").read()
    i = src.rfind("</body>")
    tmp_name = "index.__overflowprobe.html"
    tmp = os.path.join(here, tmp_name)
    open(tmp, "w", encoding="utf-8").write(src[:i] + PROBE + src[i:])
    url = BASE.rstrip("/") + "/" + tmp_name
    try:
        html = subprocess.run(
            [CHROME, "--headless=new", "--window-size=1440,1000", "--hide-scrollbars",
             "--virtual-time-budget=120000", "--dump-dom", url],
            capture_output=True, text=True, timeout=240).stdout
    finally:
        os.remove(tmp)
    m = re.search(r'id="OV">@@(.*?)@@', html, re.S)
    if not m:
        print("🔴 探针没回话 —— 页面没加载起来或 .tab 结构变了。这不等于合格。")
        sys.exit(1)
    res = json.loads(m.group(1))

    fails, checked = 0, 0
    for panel, items in res.items():
        checked += len(items)
        bad = [r for r in items if r["stale"] or r["over"]]
        if not bad:
            print(f"✅ {panel}（{len(items)} 张图）")
            continue
        fails += len(bad)
        print(f"🔴 {panel}（{len(items)} 张图，{len(bad)} 张有问题）")
        for r in bad:
            if r["stale"]:
                print(f"     {r['id']}: ECharts 记的宽 {r['insW']}，容器实际 {r['elW']}（坐标系用了旧尺寸）")
            for o in r["over"]:
                print(f"     {r['id']}: series「{o['s']}」末点 x={o['x']}，绘图区右界 {o['gr']}，溢出 {o['x'] - o['gr']}px")
    print()
    if fails:
        print(f"🔴 {fails} 张图溢出。修法：容器尺寸变化必须**驱动** inst.resize()，")
        print("   不能只在切面板 / window.resize 那两个时点各调一次（见 app.js observeSize）。")
        sys.exit(1)
    print(f"✅ 共 {checked} 张图：ECharts 尺寸与容器一致，各 series 末点全部在绘图区内")


if __name__ == "__main__":
    main()
