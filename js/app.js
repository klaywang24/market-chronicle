/* 美股编年史 — 前端逻辑：tab 切换、日夜主题、ECharts 渲染 */
(function () {
  "use strict";

  // ---------------- 主题 ----------------
  const rootEl = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");

  function isDark() { return rootEl.classList.contains("dark-mode"); }
  function syncToggleIcon() { toggleBtn.textContent = isDark() ? "☾" : "☀"; }

  toggleBtn.addEventListener("click", () => {
    rootEl.classList.toggle("dark-mode");
    localStorage.setItem("mc-theme", isDark() ? "dark" : "light");
    syncToggleIcon();
    rebuildAll();
  });
  syncToggleIcon();

  function pal() {
    const s = getComputedStyle(rootEl);
    const v = (name) => s.getPropertyValue(name).trim();
    return {
      ink: v("--ink"), inkSoft: v("--ink-soft"), muted: v("--ink-muted"),
      accent: v("--accent"), accentDeep: v("--accent-deep"),
      gold: v("--gold"), moss: v("--moss"), blue: v("--blue"),
      teal: v("--teal"), danger: v("--danger"),
      grid: v("--grid"), gridStrong: v("--grid-strong"),
      card: v("--bg-card"), border: v("--border"),
    };
  }

  // ---------------- 数据 ----------------
  const cache = {};
  async function load(name) {
    if (!cache[name]) {
      cache[name] = fetch("data/" + name + ".json").then((r) => {
        if (!r.ok) throw new Error(name + " " + r.status);
        return r.json();
      });
    }
    return cache[name];
  }

  // ---------------- 图表注册表 ----------------
  // panel -> [{el, build}]；懒加载：首次进入 tab 才渲染
  const registry = { kindex: [], spy: [], qqq: [], fin: [], consumer: [], luxury: [] };
  const built = new Map(); // el id -> echarts instance

  function chart(panel, elId, build) {
    registry[panel].push({ elId, build });
  }

  async function buildOne(elId, build) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (built.has(elId)) { built.get(elId).dispose(); }
    const inst = echarts.init(el, null, { renderer: "canvas" });
    built.set(elId, inst);
    inst.setOption(await build(pal()));
  }

  const panelDone = new Set();
  async function activatePanel(name) {
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    document.getElementById("panel-" + name).classList.add("active");
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.panel === name));
    if (!panelDone.has(name)) {
      panelDone.add(name);
      for (const { elId, build } of registry[name]) await buildOne(elId, build);
    }
    // 切换显示后需要 resize（display:none 时初始化的尺寸不对）
    registry[name].forEach(({ elId }) => built.get(elId) && built.get(elId).resize());
  }

  async function rebuildAll() {
    for (const name of panelDone) {
      for (const { elId, build } of registry[name]) await buildOne(elId, build);
    }
    if (currentStock) showStock(currentStock.basket, currentStock.safe);
  }

  document.getElementById("tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (tab) location.hash = "#" + tab.dataset.panel;
  });
  window.addEventListener("resize", () => built.forEach((c) => c.resize()));

  // ---------------- 篮子板块配置（与 build_data.py 的 BASKETS 保持一致） ----------------
  const BASKET_CFG = {
    fin: {
      anchorLabel: "XLF 总览",
      members: [["JPM", "摩根大通"], ["BAC", "美国银行"], ["V", "Visa"], ["MA", "万事达"],
                ["AXP", "美国运通"], ["GS", "高盛"], ["MS", "摩根士丹利"], ["BLK", "贝莱德"],
                ["SCHW", "嘉信理财"], ["IBKR", "盈透证券"]],
    },
    consumer: {
      anchorLabel: "XLP·XLY 总览",
      members: [["KO", "可口可乐"], ["WMT", "沃尔玛"], ["COST", "好市多"],
                ["HD", "家得宝"], ["TJX", "TJX"], ["MCD", "麦当劳"]],
    },
    luxury: {
      anchorLabel: "组合总览",
      members: [["MC.PA", "LVMH"], ["RMS.PA", "爱马仕"], ["RACE", "法拉利"]],
    },
  };
  const safeTicker = (t) => t.toLowerCase().replace(".", "-");

  let currentStock = null; // {basket, safe}

  function renderSubnav(basket) {
    const cfg = BASKET_CFG[basket];
    const cur = currentStock && currentStock.basket === basket ? currentStock.safe : null;
    document.getElementById("subnav-" + basket).innerHTML =
      `<a class="pill ${cur ? "" : "active"}" href="#${basket}"><span class="zh">${cfg.anchorLabel}</span></a>` +
      cfg.members.map(([t, n]) => {
        const s = safeTicker(t);
        return `<a class="pill ${cur === s ? "active" : ""}" href="#${basket}/${s}">${t.split(".")[0]} <span class="zh">${n}</span></a>`;
      }).join("");
  }

  function showOverview(basket) {
    currentStock = null;
    document.getElementById(basket + "-overview").style.display = "";
    document.getElementById(basket + "-stock").style.display = "none";
    renderSubnav(basket);
    registry[basket].forEach(({ elId }) => built.get(elId) && built.get(elId).resize());
  }

  async function showStock(basket, safe) {
    const cfg = BASKET_CFG[basket];
    const idx = cfg.members.findIndex(([t]) => safeTicker(t) === safe);
    if (idx < 0) return showOverview(basket);
    const [ticker, name] = cfg.members[idx];
    currentStock = { basket, safe };
    renderSubnav(basket);
    document.getElementById(basket + "-overview").style.display = "none";
    const host = document.getElementById(basket + "-stock");
    host.style.display = "";
    const p = "s_" + safe;
    const prev = cfg.members[(idx + cfg.members.length - 1) % cfg.members.length];
    const next = cfg.members[(idx + 1) % cfg.members.length];
    host.innerHTML = `
      <div class="stock-hero">
        <div class="kicker">${basket.toUpperCase()} · ${ticker}</div>
        <h1>${name}<span class="ticker">${ticker}</span></h1>
        <div class="stat-strip" id="${basket}-sd-stats"></div>
      </div>
      <div class="chapter">
        <div class="chapter-head"><span class="chapter-no">第一章</span><h2>上市以来</h2></div>
        <div class="card"><h3>走势（月线 · 对数坐标 · 复权价）</h3><div class="chart" id="${basket}-sd-century"></div></div>
      </div>
      <div class="chapter">
        <div class="chapter-head"><span class="chapter-no">第二章</span><h2>回报的形状</h2></div>
        <div class="grid-2">
          <div class="card"><h3>年度回报</h3><div class="chart short" id="${basket}-sd-annual"></div></div>
          <div class="card"><h3>年内最大回撤 vs 全年收益</h3><div class="chart short" id="${basket}-sd-intra"></div></div>
        </div>
      </div>
      <div class="chapter">
        <div class="chapter-head"><span class="chapter-no">第三章</span><h2>危机的节奏</h2></div>
        <div class="card"><h3>历史回撤曲线</h3><div class="chart short" id="${basket}-sd-dd"></div></div>
        <div class="card"><h3>深度回撤一览（≥10%）</h3><div class="table-wrap"><table id="${basket}-sd-ddtable"></table></div></div>
      </div>
      <div class="chapter">
        <div class="chapter-head"><span class="chapter-no">第四章</span><h2>时间的纹理</h2></div>
        <div class="grid-2">
          <div class="card"><h3>滚动 5 年年化</h3><div class="chart short" id="${basket}-sd-roll"></div></div>
          <div class="card"><h3>月度季节性</h3><div class="chart short" id="${basket}-sd-season"></div></div>
        </div>
        <div class="card"><h3>已实现波动率（20 日年化）</h3><div class="chart short" id="${basket}-sd-vol"></div></div>
      </div>
      <div class="stock-nav">
        <a href="#${basket}/${safeTicker(prev[0])}">← ${prev[1]} ${prev[0]}</a>
        <a href="#${basket}">回到${cfg.anchorLabel}</a>
        <a href="#${basket}/${safeTicker(next[0])}">${next[1]} ${next[0]} →</a>
      </div>`;

    // 关键数据条
    load(basket + "_table").then((d) => {
      const r = d.rows.find((x) => x.ticker === ticker);
      if (!r) return;
      const f = (v) => v == null ? "--" : (v > 0 ? "+" : "") + v.toFixed(1) + "%";
      const cls = (v) => v == null ? "" : v >= 0 ? "pos" : "neg";
      document.getElementById(basket + "-sd-stats").innerHTML = [
        ["上市数据起点", r.start_full.slice(0, 7), ""],
        ["YTD", f(r.ytd), cls(r.ytd)],
        ["5 年年化", f(r.y5), cls(r.y5)],
        ["10 年年化", f(r.y10), cls(r.y10)],
        ["上市以来年化", f(r.since_full), cls(r.since_full)],
        ["历史最大回撤", r.max_dd_full + "%", "neg"],
      ].map(([l, v, c]) =>
        `<div class="stat"><div class="label">${l}</div><div class="value ${c}">${v}</div></div>`
      ).join("");
    });

    await buildOne(basket + "-sd-century", centuryChart(null, [{ ds: p + "_century", name: name }]));
    await buildOne(basket + "-sd-annual", annualChart(p + "_annual"));
    await buildOne(basket + "-sd-intra", intraChart(p + "_intrayear"));
    await buildOne(basket + "-sd-dd", ddChart(p + "_drawdowns"));
    await buildOne(basket + "-sd-roll", rollChart(p + "_rolling5y"));
    await buildOne(basket + "-sd-season", seasonChart(p + "_seasonality"));
    await buildOne(basket + "-sd-vol", volChart(p + "_volatility"));
    renderDDTable(p + "_drawdowns", basket + "-sd-ddtable");
    window.scrollTo(0, 0);
  }

  // ---------------- hash 路由 ----------------
  function route() {
    const h = location.hash.slice(1) || "spy";
    const [panel, stock] = h.split("/");
    const target = registry[panel] ? panel : "spy";
    activatePanel(target).then(() => {
      if (BASKET_CFG[target]) {
        if (stock) showStock(target, stock);
        else showOverview(target);
      }
      buildToc();
    });
  }
  window.addEventListener("hashchange", route);

  // ---------------- 右侧悬浮章节目录 ----------------
  const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ"];
  function buildToc() {
    const toc = document.getElementById("toc");
    const panel = document.querySelector(".panel.active");
    if (!panel) { toc.innerHTML = ""; return; }
    let scope = panel;
    const stockView = panel.querySelector(".basket-stock");
    if (stockView && stockView.style.display !== "none") scope = stockView;
    else {
      const ov = panel.querySelector(".basket-overview");
      if (ov) scope = ov;
    }
    const heads = [...scope.querySelectorAll(".chapter-head h2")];
    toc.innerHTML = heads.map((h, i) => {
      const id = panel.id + "-ch" + i;
      h.closest(".chapter").id = id;
      return `<a data-target="${id}">${ROMAN[i] || i + 1} · ${h.textContent.split("：")[0]}</a>`;
    }).join("");
  }
  document.getElementById("toc").addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) document.getElementById(a.dataset.target).scrollIntoView({ behavior: "smooth" });
  });

  // ---------------- 通用 option 片段 ----------------
  function baseAxis(p) {
    return {
      axisLine: { lineStyle: { color: p.gridStrong } },
      axisLabel: { color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 },
      splitLine: { lineStyle: { color: p.grid } },
    };
  }
  function timeX(p, extra) {
    return Object.assign({ type: "time", splitLine: { show: false } }, baseAxis(p), extra || {});
  }
  function tip(p, extra) {
    return Object.assign({
      trigger: "axis",
      backgroundColor: p.card,
      borderColor: p.border,
      textStyle: { color: p.ink, fontSize: 12, fontFamily: "JetBrains Mono" },
      axisPointer: { type: "cross", label: { backgroundColor: p.inkSoft } },
    }, extra || {});
  }
  function zip(dates, vals) {
    return dates.map((d, i) => [d, vals[i]]);
  }
  const pct = (v) => (v == null ? "--" : (v > 0 ? "+" : "") + v.toFixed(1) + "%");

  // ================= K 指数 =================
  chart("kindex", "ch-kindex", async (p) => {
    const [kd, sig] = await Promise.all([load("kindex"), load("kindex_signals")]);
    const areas = sig.signals.map((s) => [
      { xAxis: s.start, itemStyle: { color: p.accent, opacity: 0.10 } },
      { xAxis: s.end },
    ]);
    return {
      tooltip: tip(p),
      axisPointer: { link: [{ xAxisIndex: "all" }] },
      grid: [
        { left: 58, right: 64, top: 28, height: "38%" },
        { left: 58, right: 64, top: "56%", height: "30%" },
      ],
      xAxis: [
        Object.assign(timeX(p), { gridIndex: 0, axisLabel: { show: false } }),
        Object.assign(timeX(p), { gridIndex: 1 }),
      ],
      yAxis: [
        Object.assign({ type: "value", name: "CNN / VIX", min: 0, max: 100, gridIndex: 0 }, baseAxis(p)),
        Object.assign({ type: "log", name: "NDX", gridIndex: 0, position: "right", splitLine: { show: false } }, baseAxis(p)),
        Object.assign({ type: "value", name: "K 指数", min: 0, max: 10, interval: 1, gridIndex: 1 }, baseAxis(p)),
      ],
      dataZoom: [
        { type: "inside", xAxisIndex: [0, 1] },
        { type: "slider", xAxisIndex: [0, 1], bottom: 6, height: 18,
          borderColor: p.border, backgroundColor: "transparent",
          fillerColor: "rgba(160,57,47,0.08)", handleStyle: { color: p.accent },
          textStyle: { color: p.muted, fontSize: 10 } },
      ],
      series: [
        { name: "CNN 恐贪", type: "line", xAxisIndex: 0, yAxisIndex: 0, showSymbol: false,
          data: zip(kd.dates, kd.cnn), lineStyle: { color: p.gold, width: 1.4 }, itemStyle: { color: p.gold } },
        { name: "VIX", type: "line", xAxisIndex: 0, yAxisIndex: 0, showSymbol: false,
          data: zip(kd.dates, kd.vix), lineStyle: { color: p.accent, width: 1.4 }, itemStyle: { color: p.accent },
          markArea: { silent: true, data: areas } },
        { name: "纳指 100", type: "line", xAxisIndex: 0, yAxisIndex: 1, showSymbol: false,
          data: zip(kd.dates, kd.ndx), lineStyle: { color: p.blue, width: 1.6 }, itemStyle: { color: p.blue } },
        { name: "K 指数", type: "line", xAxisIndex: 1, yAxisIndex: 2, showSymbol: false,
          data: zip(kd.dates, kd.k), lineStyle: { color: p.accent, width: 1.6 }, itemStyle: { color: p.accent },
          markLine: { silent: true, symbol: "none",
            lineStyle: { color: p.ink, type: "dashed", width: 1.2 },
            label: { color: p.ink, formatter: "K = 1", fontFamily: "JetBrains Mono" },
            data: [{ yAxis: 1 }] },
          markArea: { silent: true, data: areas } },
      ],
    };
  });

  async function renderKStatus() {
    const [kd, sig] = await Promise.all([load("kindex"), load("kindex_signals")]);
    const cur = kd.current;
    const on = cur.k < 1;
    const last = sig.signals[sig.signals.length - 1];
    const el = document.getElementById("k-status");
    el.innerHTML = `
      <div class="stat ${on ? "signal-on" : ""}">
        <div class="label">今日 K 指数（${cur.date}）</div>
        <div class="value">${cur.k.toFixed(2)}</div>
        <div class="note">${on ? "★ 金风玉露相逢 — 信号触发" : "未触发（K ≥ 1）"}</div>
      </div>
      <div class="stat"><div class="label">CNN 恐惧贪婪</div><div class="value">${cur.cnn.toFixed(0)}</div><div class="note">${cur.rating || ""}</div></div>
      <div class="stat"><div class="label">VIX</div><div class="value">${cur.vix.toFixed(1)}</div><div class="note">K = CNN ÷ VIX</div></div>
      <div class="stat"><div class="label">最近一次信号</div><div class="value" style="font-size:18px">${last.start}</div><div class="note">至今 ${pct(last.fwd_to_date)}</div></div>`;

    const tbl = document.getElementById("k-table");
    const cell = (v) => v == null ? "<td>--</td>" :
      `<td class="${v >= 0 ? "pos" : "neg"}">${pct(v)}</td>`;
    tbl.innerHTML =
      "<tr><th>#</th><th>信号首日</th><th>持续(日)</th><th>最低 K</th><th>+20d</th><th>+40d</th><th>+60d</th><th>至今</th></tr>" +
      sig.signals.map((s, i) =>
        `<tr><td>${i + 1}</td><td>${s.start}</td><td>${s.days_below}</td>` +
        `<td class="k-min">${s.min_k.toFixed(2)}</td>` +
        cell(s.fwd20) + cell(s.fwd40) + cell(s.fwd60) + cell(s.fwd_to_date) + "</tr>"
      ).join("");

    const n = sig.signals.length;
    const win60 = sig.signals.filter((s) => s.fwd60 != null && s.fwd60 > 0).length;
    const has60 = sig.signals.filter((s) => s.fwd60 != null).length;
    document.getElementById("k-verdict").textContent =
      `实证结论：2020 年以来共 ${n} 次信号。60 个交易日窗口胜率 ${win60}/${has60}` +
      `（V 形回调中几乎必胜；2021 末—2022 的持续熊市中信号会连续触发、短期窗口为负）。` +
      `所有信号持有至今全部为正。历史规律不保证未来。`;
  }

  // ================= 通用面板构建 =================
  function centuryChart(dsName, seriesDefs) {
    return async (p) => {
      const colors = [p.blue, p.accent, p.gold];
      const datasets = await Promise.all(seriesDefs.map((s) => load(s.ds)));
      return {
        tooltip: tip(p),
        legend: seriesDefs.length > 1 ? { textStyle: { color: p.muted, fontSize: 11 }, top: 0 } : undefined,
        grid: { left: 70, right: 24, top: 30, bottom: 60 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "log", splitLine: { lineStyle: { color: pal().grid } } }, baseAxis(p)),
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
          borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
          handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
        series: datasets.map((d, i) => ({
          name: seriesDefs[i].name, type: "line", showSymbol: false,
          data: zip(d.dates, d.close),
          lineStyle: { color: colors[i], width: 1.5 }, itemStyle: { color: colors[i] },
        })),
      };
    };
  }

  function annualChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      return {
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        grid: { left: 54, right: 20, top: 24, bottom: 28 },
        xAxis: Object.assign({ type: "category", data: d.years, splitLine: { show: false } }, baseAxis(p)),
        yAxis: Object.assign({ type: "value", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        series: [{
          type: "bar", data: d.returns.map((v) => ({
            value: v, itemStyle: { color: v >= 0 ? p.moss : p.danger },
          })),
          barCategoryGap: "25%",
        }],
      };
    };
  }

  function ddChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      return {
        tooltip: tip(p),
        grid: { left: 54, right: 20, top: 20, bottom: 28 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "value", max: 0, axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        series: [{
          name: "距前高", type: "line", showSymbol: false, data: zip(d.dates, d.dd),
          lineStyle: { color: p.accent, width: 1 },
          areaStyle: { color: p.accent, opacity: 0.25 }, itemStyle: { color: p.accent },
        }],
      };
    };
  }

  async function renderDDTable(dsName, tableId) {
    const d = await load(dsName);
    const top = d.episodes.slice(0, 10);
    document.getElementById(tableId).innerHTML =
      "<tr><th>峰值</th><th>谷底</th><th>深度</th><th>下跌(天)</th><th>修复(天)</th></tr>" +
      top.map((e) =>
        `<tr><td>${e.peak}</td><td>${e.trough}</td><td class="neg">${e.depth}%</td>` +
        `<td>${e.days_down}</td><td>${e.days_recover == null ? "未修复" : e.days_recover}</td></tr>`
      ).join("");
  }

  function intraChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      const years = d.rows.map((r) => r.year);
      return {
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
        grid: { left: 54, right: 20, top: 30, bottom: 28 },
        xAxis: Object.assign({ type: "category", data: years, splitLine: { show: false } }, baseAxis(p)),
        yAxis: Object.assign({ type: "value", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        series: [
          { name: "全年收益", type: "bar", color: p.moss,
            data: d.rows.map((r) => ({ value: r.ret, itemStyle: { color: r.ret >= 0 ? p.moss : p.danger, opacity: 0.85 } })) },
          { name: "年内最大回撤", type: "scatter", symbolSize: 5,
            data: d.rows.map((r) => r.intra_dd), itemStyle: { color: p.accentDeep } },
        ],
      };
    };
  }

  function volChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      const series = [{
        name: "已实现波动率(20d)", type: "line", showSymbol: false,
        data: zip(d.dates, d.vol20), lineStyle: { color: p.teal, width: 1 }, itemStyle: { color: p.teal },
      }];
      if (d.vol_index) series.push({
        name: d.vol_index_name, type: "line", showSymbol: false,
        data: zip(d.dates, d.vol_index), lineStyle: { color: p.accent, width: 1 }, itemStyle: { color: p.accent },
      });
      return {
        tooltip: tip(p),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
        grid: { left: 54, right: 20, top: 30, bottom: 28 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "value" }, baseAxis(p)),
        series,
      };
    };
  }

  function rollChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      return {
        tooltip: tip(p),
        grid: { left: 54, right: 20, top: 20, bottom: 28 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "value", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        series: [{
          name: "滚动5年年化", type: "line", showSymbol: false, data: zip(d.dates, d.cagr),
          lineStyle: { color: p.blue, width: 1.3 }, itemStyle: { color: p.blue },
          markLine: { silent: true, symbol: "none", lineStyle: { color: p.ink, type: "dashed" },
            label: { color: p.muted, formatter: "0%" }, data: [{ yAxis: 0 }] },
        }],
      };
    };
  }

  function seasonChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      const months = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
      return {
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
        grid: { left: 54, right: 50, top: 30, bottom: 28 },
        xAxis: Object.assign({ type: "category", data: months, splitLine: { show: false } }, baseAxis(p)),
        yAxis: [
          Object.assign({ type: "value", name: "平均涨跌", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
          Object.assign({ type: "value", name: "上涨概率", min: 0, max: 100, position: "right", splitLine: { show: false },
            axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        ],
        series: [
          { name: "平均涨跌", type: "bar", color: p.moss,
            data: d.rows.map((r) => ({ value: r.avg, itemStyle: { color: r.avg >= 0 ? p.moss : p.danger } })) },
          { name: "上涨概率", type: "line", yAxisIndex: 1, symbolSize: 5,
            data: d.rows.map((r) => r.win), lineStyle: { color: p.gold, width: 1.4 }, itemStyle: { color: p.gold } },
        ],
      };
    };
  }

  function capeChart() {
    return async (p) => {
      const d = await load("sp500_cape");
      const avg = d.cape.reduce((a, b) => a + b, 0) / d.cape.length;
      return {
        tooltip: tip(p),
        grid: { left: 54, right: 20, top: 20, bottom: 28 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "value" }, baseAxis(p)),
        series: [{
          name: "CAPE", type: "line", showSymbol: false, data: zip(d.dates, d.cape),
          lineStyle: { color: p.gold, width: 1.3 }, itemStyle: { color: p.gold },
          markLine: { silent: true, symbol: "none",
            lineStyle: { color: p.ink, type: "dashed" },
            label: { color: p.muted, formatter: "历史均值 " + avg.toFixed(1), fontFamily: "JetBrains Mono" },
            data: [{ yAxis: avg }] },
        }],
      };
    };
  }

  // ---------------- 个股篮子 ----------------
  function basketPalette(p) {
    return [p.blue, p.accent, p.gold, p.moss, p.teal, p.danger,
            "#7D6A9E", "#5E7C8A", "#A8783C", p.accentDeep];
  }

  function basketGrowthChart(prefix) {
    return async (p) => {
      const d = await load(prefix + "_growth");
      const colors = basketPalette(p);
      const series = d.series.map((s, i) => ({
        name: s.name, type: "line", showSymbol: false,
        data: zip(d.dates, s.values),
        lineStyle: { color: colors[i % colors.length], width: 1.1 },
        itemStyle: { color: colors[i % colors.length] },
      }));
      series.push({
        name: "等权组合", type: "line", showSymbol: false,
        data: zip(d.ew.dates, d.ew.values),
        lineStyle: { color: p.ink, width: 2.4 }, itemStyle: { color: p.ink },
        z: 10,
      });
      return {
        tooltip: tip(p),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0, type: "scroll" },
        grid: { left: 64, right: 24, top: 36, bottom: 60 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "log" }, baseAxis(p)),
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
          borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
          handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
        series,
      };
    };
  }

  async function renderBasketTable(prefix, tableId) {
    const d = await load(prefix + "_table");
    const c = (v, suffix) => v == null ? "<td>--</td>" :
      `<td class="${v >= 0 ? "pos" : "neg"}">${(v > 0 ? "+" : "") + v.toFixed(1)}${suffix}</td>`;
    const tbl = document.getElementById(tableId);
    tbl.innerHTML =
      "<tr><th>代码</th><th>名称</th><th>YTD</th><th>1年</th><th>3年年化</th><th>5年年化</th><th>10年年化</th><th>共同起点年化</th><th>最大回撤</th></tr>" +
      d.rows.map((r) =>
        `<tr class="clickable" data-hash="#${prefix}/${r.safe}"><td>${r.ticker}</td><td>${r.name}</td>` +
        c(r.ytd, "%") + c(r.y1, "%") + c(r.y3, "%") + c(r.y5, "%") + c(r.y10, "%") + c(r.since, "%") +
        `<td class="neg">${r.max_dd}%</td></tr>`
      ).join("");
    tbl.addEventListener("click", (e) => {
      const tr = e.target.closest("tr.clickable");
      if (tr) location.hash = tr.dataset.hash;
    });
  }

  // ---------------- 注册 SPY / QQQ ----------------
  chart("spy", "ch-spy-century", centuryChart("sp500_century", [{ ds: "sp500_century", name: "标普 500" }]));
  chart("spy", "ch-spy-annual", annualChart("sp500_annual"));
  chart("spy", "ch-spy-dd", ddChart("sp500_drawdowns"));
  chart("spy", "ch-spy-intra", intraChart("sp500_intrayear"));
  chart("spy", "ch-spy-cape", capeChart());
  chart("spy", "ch-spy-vol", volChart("sp500_volatility"));
  chart("spy", "ch-spy-roll", rollChart("sp500_rolling5y"));
  chart("spy", "ch-spy-season", seasonChart("sp500_seasonality"));

  chart("qqq", "ch-qqq-century", centuryChart(null, [
    { ds: "ixic_century", name: "纳指综指" }, { ds: "ndx_century", name: "纳指 100" },
  ]));
  chart("qqq", "ch-qqq-annual", annualChart("ndx_annual"));
  chart("qqq", "ch-qqq-dd", ddChart("ndx_drawdowns"));
  chart("qqq", "ch-qqq-intra", intraChart("ndx_intrayear"));
  chart("qqq", "ch-qqq-vol", volChart("ndx_volatility"));
  chart("qqq", "ch-qqq-roll", rollChart("ndx_rolling5y"));
  chart("qqq", "ch-qqq-season", seasonChart("ndx_seasonality"));

  ["fin", "consumer", "luxury"].forEach((b) => {
    chart(b, "ch-" + b + "-growth", basketGrowthChart(b));
    chart(b, "ch-" + b + "-annual", annualChart(b + "_annual"));
    chart(b, "ch-" + b + "-dd", ddChart(b + "_drawdowns"));
  });
  chart("fin", "ch-fin-etf", centuryChart(null, [{ ds: "s_xlf_century", name: "XLF" }]));
  chart("fin", "ch-fin-etf-annual", annualChart("s_xlf_annual"));
  chart("fin", "ch-fin-etf-dd", ddChart("s_xlf_drawdowns"));
  chart("consumer", "ch-consumer-etf", centuryChart(null, [
    { ds: "s_xlp_century", name: "XLP 必需消费" }, { ds: "s_xly_century", name: "XLY 可选消费" },
  ]));
  chart("consumer", "ch-consumer-etf-annual", annualChart("s_xlp_annual"));
  chart("consumer", "ch-consumer-etf2-annual", annualChart("s_xly_annual"));

  // ---------------- 启动 ----------------
  renderKStatus();
  renderDDTable("sp500_drawdowns", "spy-dd-table");
  renderDDTable("ndx_drawdowns", "qqq-dd-table");
  renderBasketTable("fin", "fin-table");
  renderBasketTable("consumer", "consumer-table");
  renderBasketTable("luxury", "luxury-table");
  load("meta").then((m) => {
    document.getElementById("meta-line").textContent =
      "美股编年史 · 自用版 · 数据更新于 " + m.updated.slice(0, 10);
  }).catch(() => {});
  route();
})();
