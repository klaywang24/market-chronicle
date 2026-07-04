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
  const registry = { kindex: [], spy: [], qqq: [] };
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
  }

  document.getElementById("tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (tab) activatePanel(tab.dataset.panel);
  });
  window.addEventListener("resize", () => built.forEach((c) => c.resize()));

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

  // ---------------- 启动 ----------------
  renderKStatus();
  renderDDTable("sp500_drawdowns", "spy-dd-table");
  renderDDTable("ndx_drawdowns", "qqq-dd-table");
  load("meta").then((m) => {
    document.getElementById("meta-line").textContent =
      "美股编年史 · 自用版 · 数据更新于 " + m.updated.slice(0, 10);
  }).catch(() => {});
  activatePanel("kindex");
})();
