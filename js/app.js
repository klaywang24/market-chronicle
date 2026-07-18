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
      teal: v("--teal"), purple: v("--purple"), danger: v("--danger"),
      cmpRed: v("--cmp-red"), cmpBlue: v("--cmp-blue"),
      cmpPurple: v("--cmp-purple"), cmpGreen: v("--cmp-green"),
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
  const registry = { pulse: [], kindex: [], spy: [], qqq: [], tech: [], fin: [], consumer: [], luxury: [], macro: [], leaps: [],
    // 页脚静态页（无图表，空数组即可，让路由识别并显示对应 panel）
    about: [], contact: [], privacy: [], terms: [], refunds: [], pricing: [], methodology: [] };
  const built = new Map(); // el id -> echarts instance

  function chart(panel, elId, build) {
    registry[panel].push({ elId, build });
  }

  // ECharts option 内的中文（series 名/轴名/图例/标注）按当前语言翻译
  function i18nOption(o) {
    if (!window.MC_I18N || MC_I18N.lang() === "zh" || o == null) return o;
    if (Array.isArray(o)) { o.forEach(i18nOption); return o; }
    if (typeof o === "object") {
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === "string" && /[一-鿿]/.test(v)) o[k] = MC_I18N.translate(v);
        else if (v && typeof v === "object") i18nOption(v);
      }
    }
    return o;
  }

  async function buildOne(elId, build) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (built.has(elId)) { built.get(elId).dispose(); }
    try {
      const option = i18nOption(await build(pal()));
      const inst = echarts.init(el, null, { renderer: "canvas" });
      built.set(elId, inst);
      inst.setOption(option);
    } catch (e) {
      // 数据尚未生成/拉取失败：给出可见占位，而不是无声空白
      built.delete(elId);
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-muted);font-size:13px">数据更新中，稍后自动出现 · data updating</div>';
    }
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
    tech: {
      anchorLabel: "科技总览",   // 2026-07-16：原「QQQ 总览」名实不符——TSM 挂 NYSE，进不了纳斯达克 100，用站上自己那张 103 只成分股表一对就穿帮。这一栏的用途是「我盯的这些票」不是复刻指数，故改标题、留台积电（AI 硬件链最要紧的一环）。
      // ⚠️ 与 scripts/build_data.py 的 BASKETS["tech"] 必须同步；分组标签保持 ≤5 字
      //（.pill-group:only-child .pill-group-label 的 min-width:5.4em 按 5 字量的，超了就不对齐了）
      rows: [
        [["半导体", ["NVDA", "AVGO", "TSM", "AMD"]]],
        [["存储", ["MU", "SNDK"]]],
        [["平台·软件", ["MSFT", "GOOGL", "META", "AMZN"]]],
        [["硬件·终端", ["AAPL", "TSLA"]]],
      ],
      members: [["NVDA", "英伟达"], ["AVGO", "博通"], ["TSM", "台积电"], ["AMD", "AMD"],
                ["MU", "美光"], ["SNDK", "闪迪"],
                ["MSFT", "微软"], ["GOOGL", "谷歌"], ["META", "Meta"], ["AMZN", "亚马逊"],
                ["AAPL", "苹果"], ["TSLA", "特斯拉"]],
    },
    fin: {
      anchorLabel: "XLF 总览",
      // rows：两行分组布局（左侧锚胶囊纵跨两行）；members 顺序 = 上一只/下一只的翻页顺序
      rows: [
        [["银行", ["JPM", "BAC"]], ["卡组织", ["V", "MA", "AXP"]]],
        [["券商", ["SCHW", "IBKR"]], ["投行", ["GS", "MS"]]],
        [["资管", ["BLK"]], ["保险", ["BRK.B"]]],
        [["加密·稳定币", ["COIN", "HOOD", "CRCL"]]],
      ],
      members: [["JPM", "摩根大通"], ["BAC", "美国银行"], ["V", "Visa"], ["MA", "万事达"],
                ["AXP", "美国运通"], ["SCHW", "嘉信理财"], ["IBKR", "盈透证券"],
                ["GS", "高盛"], ["MS", "摩根士丹利"], ["BLK", "贝莱德"], ["BRK.B", "伯克希尔"],
                ["COIN", "Coinbase"], ["HOOD", "Robinhood"], ["CRCL", "Circle"]],
    },
    consumer: {
      anchorLabel: "XLP·XLY 总览",
      rows: [
        [["必需", ["KO", "WMT", "COST"]]],
        [["可选", ["HD", "TJX", "MCD"]]],
      ],
      members: [["KO", "可口可乐"], ["WMT", "沃尔玛"], ["COST", "好市多"],
                ["HD", "家得宝"], ["TJX", "TJX"], ["MCD", "麦当劳"]],
    },
    luxury: {
      anchorLabel: "组合总览",
      members: [["MC.PA", "LVMH"], ["RMS.PA", "爱马仕"], ["RACE", "法拉利"]],
    },
  };
  const safeTicker = (t) => t.toLowerCase().replace(".", "-");

  // logo 三级加载链：自托管 logos/（scripts/fetch_logos.py 每周同步，与站点同源、
  // 不受客户端拦截影响——iPad 曾整站拦掉 parqet 直连）→ parqet 直连（新 ticker 兜底）→ 首字母圆章
  window.__logoErr = function (img) {
    const t = img.dataset.t || "";
    if (!img.dataset.step) {
      img.dataset.step = "1";
      img.src = "https://assets.parqet.com/logos/symbol/" + encodeURIComponent(t) + "?format=png&size=64";
    } else {
      const s = document.createElement("span");
      s.className = img.className + " logo-mono";
      s.textContent = (t || "?").charAt(0);
      img.replaceWith(s);
    }
  };

  let currentStock = null; // {basket, safe}

  function renderSubnav(basket) {
    const cfg = BASKET_CFG[basket];
    const cur = currentStock && currentStock.basket === basket ? currentStock.safe : null;
    const nameOf = Object.fromEntries(cfg.members);
    const pill = (t) => {
      const s = safeTicker(t);
      const code = t.split(".")[0];
      // 中文名与代码相同时（AMD / TJX 这类没有通行中文名的）不重复渲染，否则胶囊显示成「AMD AMD」
      const zh = nameOf[t] === code ? "" : ` <span class="zh">${nameOf[t]}</span>`;
      return `<a class="pill ${cur === s ? "active" : ""}" href="#${basket}/${s}">${code}${zh}</a>`;
    };
    const group = ([label, ticks]) =>
      `<span class="pill-group"><span class="pill-group-label">${label}</span>${ticks.map(pill).join("")}</span>`;
    let html;
    if (cfg.rows) {
      html = `<a class="pill pill-anchor ${cur ? "" : "active"}" href="#${basket}"><span class="zh">${cfg.anchorLabel}</span></a>` +
        `<div class="pill-rows">` +
        cfg.rows.map((row) => `<div class="pill-row">${row.map(group).join("")}</div>`).join("") +
        `</div>`;
    } else {
      const anchor = `<a class="pill ${cur ? "" : "active"}" href="#${basket}"><span class="zh">${cfg.anchorLabel}</span></a>`;
      html = anchor + (cfg.groups ? cfg.groups.map(group).join("") : cfg.members.map(([t]) => pill(t)).join(""));
    }
    document.getElementById("subnav-" + basket).innerHTML = html;
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
        <h1><img class="stock-logo" data-t="${ticker}" src="logos/${safeTicker(ticker)}.png"
             referrerpolicy="no-referrer" onerror="__logoErr(this)" alt="">${name}${
             name === ticker.split(".")[0] ? "" : `<span class="ticker">${ticker}</span>`}</h1>
        <div class="stat-strip" id="${basket}-sd-stats"></div>
      </div>
      <div class="chapter">
        <div class="chapter-head"><span class="chapter-no">第一章</span><h2>上市以来</h2></div>
        <div class="card">
          <h3>走势（月线 · 对数坐标 · 复权价）</h3>
          <div class="sub">和谁比一比？—— <span class="cmp-chips" id="${basket}-cmp"></span></div>
          <div class="chart" id="${basket}-sd-century"></div>
          <p class="footnote" id="${basket}-cmp-note" style="display:none">对比模式：全部序列在共同起点归一化为 100（对数坐标），跑赢基准 = 长期真正的好公司。</p>
        </div>
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
      <div class="chapter" id="${basket}-fd-dash">
        <div class="chapter-head"><span class="chapter-no"></span><h2>关键指标仪表盘</h2></div>
        <p class="chapter-q">巴菲特们打开报表前先看的一屏。</p>
        <div class="stat-strip" id="${basket}-fd-dash-cards"></div>
      </div>
      <div class="chapter" id="${basket}-fd-profit">
        <div class="chapter-head"><span class="chapter-no"></span><h2>利润基本面</h2></div>
        <p class="chapter-q">股价背后，利润跟上了吗？</p>
        <div class="card"><h3>EPS（TTM · 季频）</h3><div class="chart short" id="${basket}-fd-eps"></div></div>
        <div class="grid-2">
          <div class="card"><h3>营业收入（近四财年 · 十亿美元）</h3><div class="chart short" id="${basket}-fd-rev"></div></div>
          <div class="card"><h3>净利润（近四财年 · 十亿美元）</h3><div class="chart short" id="${basket}-fd-ni"></div></div>
        </div>
      </div>
      <div class="chapter" id="${basket}-fd-capital">
        <div class="chapter-head"><span class="chapter-no"></span><h2>资本效率</h2></div>
        <p class="chapter-q">一块钱资本，赚回多少？（芒格：长期回报趋近 ROIC）</p>
        <div class="grid-2">
          <div class="card"><h3>ROE × ROIC（TTM）</h3><div class="chart short" id="${basket}-fd-roe"></div></div>
          <div class="card"><h3>自由现金流（年度 · 十亿美元）</h3><div class="chart short" id="${basket}-fd-fcf"></div></div>
        </div>
      </div>
      <div class="chapter" id="${basket}-fd-valuation">
        <div class="chapter-head"><span class="chapter-no"></span><h2>估值的锚</h2></div>
        <p class="chapter-q">现在的价格，在自己的历史里算贵吗？</p>
        <div class="k-status" id="${basket}-fd-valstats"></div>
        <div class="grid-2">
          <div class="card"><h3>PE（TTM · 含历史中位数）</h3><div class="chart short" id="${basket}-fd-pe"></div></div>
          <div class="card"><h3 id="${basket}-fd-ps-title">PS（TTM）</h3><div class="chart short" id="${basket}-fd-ps"></div></div>
        </div>
      </div>
      <div class="chapter" id="${basket}-fd-driver">
        <div class="chapter-head"><span class="chapter-no"></span><h2>估值驱动 vs EPS 驱动</h2></div>
        <p class="chapter-q">每年的涨跌，是利润挣来的，还是估值给的？</p>
        <div class="card"><h3>年度回报分解</h3><div class="sub">(1+回报) = (1+EPS变化) × (1+估值变化)，年末对年末</div><div class="chart short" id="${basket}-fd-driver-ch"></div></div>
      </div>
      <div class="chapter" id="${basket}-fd-payout">
        <div class="chapter-head"><span class="chapter-no"></span><h2>股东回报</h2></div>
        <p class="chapter-q">分红有没有年年长大？</p>
        <div class="card"><h3>每股分红（年度合计 · 各自币种）</h3><div class="chart short" id="${basket}-fd-div"></div></div>
      </div>
      <div class="chapter" id="${basket}-fd-peers">
        <div class="chapter-head"><span class="chapter-no"></span><h2>同业对比</h2></div>
        <p class="chapter-q">放回同一个篮子里看，贵还是便宜、强还是弱？</p>
        <div class="card"><h3>估值与质量 vs 同篮子</h3><div class="chart short" id="${basket}-fd-peers-ch"></div></div>
      </div>
      <div class="stock-nav">
        <a href="#${basket}/${safeTicker(prev[0])}">← <span>${prev[1]}</span> ${prev[0]}</a>
        <a href="#${basket}"><span>回到</span><span>${cfg.anchorLabel}</span></a>
        <a href="#${basket}/${safeTicker(next[0])}"><span>${next[1]}</span> ${next[0]} →</a>
      </div>`;

    // 关键数据条
    load(basket + "_table").then((d) => {
      const r = d.rows.find((x) => x.ticker === ticker);
      // 新成员上线当天：app.js 带 ?v= 会立刻更新、data JSON 不带（sw 是 stale-while-revalidate），
      // 于是回访者第一次点新票时表里还没有它的行。别静默留白——说清楚，下次刷新就好了。
      if (!r) {
        document.getElementById(basket + "-sd-stats").innerHTML =
          '<div class="stat"><div class="label">关键数据</div><div class="value" style="font-size:14px">' +
          '数据更新中，刷新后出现 · data updating</div></div>';
        return;
      }
      const f = (v) => v == null ? "--" : (v > 0 ? "+" : "") + v.toFixed(1) + "%";
      const cls = (v) => v == null ? "" : v >= 0 ? "pos" : "neg";
      const totalPct = r.total_mult ? ((r.total_mult - 1) * 100).toLocaleString("en-US", { maximumFractionDigits: 0 }) : null;
      document.getElementById(basket + "-sd-stats").innerHTML = [
        ["上市数据起点", r.start_full.slice(0, 7), ""],
        ["上市以来总回报", r.total_mult ? "×" + r.total_mult.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "--",
         "pos", totalPct ? "+" + totalPct + "%" : ""],
        ["YTD", f(r.ytd), cls(r.ytd)],
        ["5 年年化", f(r.y5), cls(r.y5)],
        ["10 年年化", f(r.y10), cls(r.y10)],
        ["上市以来年化", f(r.since_full), cls(r.since_full)],
        ["历史最大回撤", r.max_dd_full + "%", "neg"],
      ].map(([l, v, c, note]) =>
        `<div class="stat"><div class="label">${l}</div><div class="value ${c}">${v}</div>` +
        (note ? `<div class="note">${note}</div>` : "") + "</div>"
      ).join("");
    });

    setupCmp(basket, safe, ticker, name);
    await buildStockCentury(basket, safe, name);
    await buildOne(basket + "-sd-annual", annualChart(p + "_annual"));
    await buildOne(basket + "-sd-intra", intraChart(p + "_intrayear"));
    await buildOne(basket + "-sd-dd", ddChart(p + "_drawdowns"));
    await buildOne(basket + "-sd-roll", rollChart(p + "_rolling5y"));
    await buildOne(basket + "-sd-season", seasonChart(p + "_seasonality"));
    await buildOne(basket + "-sd-vol", volChart(p + "_volatility"));
    renderDDTable(p + "_drawdowns", basket + "-sd-ddtable");
    await renderFund(basket, safe, ticker);
    stampSources();
    window.scrollTo(0, 0);
  }

  // ---------------- 个股回报对比（vs 标普/纳指/行业ETF） ----------------
  const XLP_MEMBERS = new Set(["KO", "WMT", "COST"]);
  // 对比四色：个股深红 / 标普 Chase 蓝 / 纳指深紫 / 行业ETF 凯尔特人绿
  function cmpDefs(basket, ticker) {
    const defs = [["sp500_century", "标普 500", "cmpBlue"], ["ndx_century", "纳指 100", "cmpPurple"]];
    if (basket === "tech") defs.push(["s_xlk_century", "XLK 科技", "cmpGreen"]);
    else if (basket === "fin") defs.push(["s_xlf_century", "XLF 金融", "cmpGreen"]);
    else if (basket === "consumer") defs.push(XLP_MEMBERS.has(ticker)
      ? ["s_xlp_century", "XLP 必需消费", "cmpGreen"] : ["s_xly_century", "XLY 可选消费", "cmpGreen"]);
    return defs;
  }

  let cmpSel = new Set();
  let cmpStockKey = null; // 换股时重置选择

  function setupCmp(basket, safe, ticker, name) {
    const key = basket + "/" + safe;
    if (key !== cmpStockKey) { cmpSel = new Set(); cmpStockKey = key; }
    const host = document.getElementById(basket + "-cmp");
    const defs = cmpDefs(basket, ticker);
    host.innerHTML = defs.map(([ds, label]) =>
      `<button class="pill cmp-chip ${cmpSel.has(ds) ? "active" : ""}" data-ds="${ds}">${label}</button>`).join("");
    host.onclick = async (e) => {
      const chip = e.target.closest(".cmp-chip");
      if (!chip) return;
      cmpSel.has(chip.dataset.ds) ? cmpSel.delete(chip.dataset.ds) : cmpSel.add(chip.dataset.ds);
      chip.classList.toggle("active");
      await buildStockCentury(basket, safe, name);
    };
  }

  async function buildStockCentury(basket, safe, name) {
    const elId = basket + "-sd-century";
    const note = document.getElementById(basket + "-cmp-note");
    if (cmpSel.size === 0) {
      if (note) note.style.display = "none";
      return buildOne(elId, centuryChart(null, [{ ds: "s_" + safe + "_century", name }]));
    }
    if (note) note.style.display = "";
    const defs = cmpDefs(basket, BASKET_CFG[basket].members.find(([t]) => safeTicker(t) === safe)[0]);
    await buildOne(elId, async (p) => {
      const stock = await load("s_" + safe + "_century");
      const selected = defs.filter(([ds]) => cmpSel.has(ds));
      const comps = await Promise.all(selected.map(([ds]) => load(ds)));
      const all = [
        { name, dates: stock.dates, values: stock.close, color: p.cmpRed, width: 2.2 },
        ...comps.map((c, i) => ({
          name: selected[i][1], dates: c.dates, values: c.close,
          color: p[selected[i][2]], width: 1.2,
        })),
      ];
      // 共同起点 = 最晚起始的序列；全部归一化为 100
      const start = all.map((s) => s.dates[0]).sort().slice(-1)[0];
      const series = all.map((s) => {
        const i0 = s.dates.findIndex((d) => d >= start);
        const base = s.values[i0];
        return {
          name: s.name, type: "line", showSymbol: false,
          data: s.dates.slice(i0).map((d, j) => [d, Math.round(s.values[i0 + j] / base * 1000) / 10]),
          lineStyle: { color: s.color, width: s.width }, itemStyle: { color: s.color },
        };
      });
      return {
        tooltip: tip(p),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
        grid: { left: 64, right: 24, top: 32, bottom: 60 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "log", name: "起点=100" }, baseAxis(p)),
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
          borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
          handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
        series,
      };
    });
  }

  // ---------------- 个股基本面章节（数据可用才显示对应章） ----------------
  const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五"];

  function renumberChapters(scope) {
    [...scope.querySelectorAll(".chapter")].forEach((ch, i) => {
      const no = ch.querySelector(".chapter-no");
      if (no) no.textContent = "第" + (CN_NUM[i] || i + 1) + "章";
    });
  }

  async function renderFund(basket, safe, ticker) {
    let fund = null, peers = null;
    try { fund = await load("s_" + safe + "_fund"); } catch (e) {}
    try { peers = await load(basket + "_peers"); } catch (e) {}
    const host = document.getElementById(basket + "-stock");
    const drop = (key) => { const el = document.getElementById(basket + "-fd-" + key); if (el) el.remove(); };

    const snap = fund && fund.snapshot;
    if (!snap) drop("dash");
    if (!fund || !(fund.eps || fund.income4)) drop("profit");
    if (!fund || !(fund.roe || fund.roic || fund.fcf)) drop("capital");
    if (!fund || !(fund.pe || fund.ps || fund.pb_hist)) drop("valuation");
    if (!fund || !fund.driver || fund.driver.length < 4) drop("driver");
    if (!fund || !fund.dividends) drop("payout");
    if (!peers || !peers.rows || peers.rows.length < 2) drop("peers");
    renumberChapters(host);
    buildToc();
    if (!fund && !peers) return;

    const fmt = (v, d, suffix) => v == null ? "--" : v.toFixed(d) + (suffix || "");
    if (snap) {
      const cards = [
        ["市值", snap.market_cap ? "$" + (snap.market_cap / 1e9).toFixed(0) + "B" : "--"],
        ["PE (TTM)", fmt(snap.pe, 1)], ["远期 PE", fmt(snap.fwd_pe, 1)],
        ["PS", fmt(snap.ps, 1)], ["PB", fmt(snap.pb, 1)],
        ["ROE", fmt(snap.roe, 1, "%")],
        ["毛利率", fmt(snap.gross_margin, 1, "%")], ["净利率", fmt(snap.net_margin, 1, "%")],
        ["股息率", fmt(snap.div_yield, 2, "%")], ["派息率", fmt(snap.payout, 0, "%")],
        ["自由现金流", snap.fcf ? "$" + (snap.fcf / 1e9).toFixed(1) + "B" : "--"],
        ["Beta", fmt(snap.beta, 2)],
      ];
      const el = document.getElementById(basket + "-fd-dash-cards");
      if (el) el.innerHTML = cards.map(([l, v]) =>
        `<div class="stat"><div class="label">${l}</div><div class="value" style="font-size:19px">${v}</div></div>`).join("");
    }

    const line = (data, name, colorKey, opts) => async (p) => {
      const s = {
        name, type: "line", showSymbol: false, data: zip(data.dates, data.values),
        lineStyle: { color: p[colorKey], width: 1.3 }, itemStyle: { color: p[colorKey] },
      };
      if (opts && opts.median) {
        const sorted = data.values.filter((v) => v != null).slice().sort((a, b) => a - b);
        const med = sorted[Math.floor(sorted.length / 2)];
        s.markLine = { silent: true, symbol: "none", lineStyle: { color: p.ink, type: "dashed" },
          label: { color: p.muted, formatter: "中位 " + med.toFixed(1), fontFamily: "JetBrains Mono" },
          data: [{ yAxis: med }] };
      }
      return { tooltip: tip(p), grid: { left: 54, right: 20, top: 20, bottom: 26 },
        xAxis: timeX(p), yAxis: Object.assign({ type: "value" }, baseAxis(p)), series: [s] };
    };
    const bars = (cats, vals, colorKey, signColor) => async (p) => ({
      tooltip: tip(p, { axisPointer: { type: "shadow" } }),
      grid: { left: 54, right: 20, top: 20, bottom: 26 },
      xAxis: Object.assign({ type: "category", data: cats, splitLine: { show: false } }, baseAxis(p)),
      yAxis: Object.assign({ type: "value" }, baseAxis(p)),
      series: [{ type: "bar", barCategoryGap: "30%",
        data: vals.map((v) => ({ value: v, itemStyle: { color: signColor && v < 0 ? p.danger : p[colorKey] } })) }],
    });

    if (fund) {
      if (fund.eps) await buildOne(basket + "-fd-eps", line(fund.eps, "EPS TTM", "moss"));
      else { const c = document.getElementById(basket + "-fd-eps"); if (c) c.closest(".card").remove(); }
      if (fund.income4 && fund.income4.revenue) {
        await buildOne(basket + "-fd-rev", bars(fund.income4.years, fund.income4.revenue, "blue"));
        await buildOne(basket + "-fd-ni", bars(fund.income4.years, fund.income4.net_income, "moss", true));
      }
      if (!fund.roe && !fund.roic) {
        const c = document.getElementById(basket + "-fd-roe");
        if (c) c.closest(".card").remove();
      }
      if (fund.roe || fund.roic) {
        await buildOne(basket + "-fd-roe", async (p) => ({
          tooltip: tip(p), legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
          grid: { left: 54, right: 20, top: 28, bottom: 26 },
          xAxis: timeX(p),
          yAxis: Object.assign({ type: "value", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
          series: [fund.roe && { name: "ROE", type: "line", showSymbol: false, data: zip(fund.roe.dates, fund.roe.values),
              lineStyle: { color: p.accent, width: 1.3 }, itemStyle: { color: p.accent } },
            fund.roic && { name: "ROIC", type: "line", showSymbol: false, data: zip(fund.roic.dates, fund.roic.values),
              lineStyle: { color: p.teal, width: 1.3 }, itemStyle: { color: p.teal } }].filter(Boolean),
        }));
      }
      if (fund.fcf) await buildOne(basket + "-fd-fcf",
        bars(fund.fcf.dates, fund.fcf.values.map((v) => v == null ? null : Math.round(v / 100) / 10), "gold", true));
      else { const c = document.getElementById(basket + "-fd-fcf"); if (c) c.closest(".card").remove(); }
      if (fund.pe) {
        await buildOne(basket + "-fd-pe", line(fund.pe, "PE", "accent", { median: true }));
        const vs = document.getElementById(basket + "-fd-valstats");
        if (vs) {
          const cur = fund.pe.values[fund.pe.values.length - 1];
          const med = median(fund.pe.values);
          const pct = percentile(fund.pe.values, cur);
          const snapFwd = fund.snapshot && fund.snapshot.fwd_pe;
          vs.innerHTML = [
            ["当前 PE (TTM)", cur.toFixed(1), `自身 ${fund.pe.dates[0].slice(0, 4)}→ 第 ${pct} 百分位`, pct > 90],
            ["历史中位数", med.toFixed(1), "约 " + fund.pe.dates[0].slice(0, 4) + " 年以来", false],
            ["远期 PE", snapFwd ? snapFwd.toFixed(1) : "--", "yfinance 快照", false],
            ["相对中位溢价", ((cur / med - 1) * 100).toFixed(0) + "%", cur > med ? "贵于历史中枢" : "低于历史中枢", false],
          ].map(([l, v, n, hot]) =>
            `<div class="stat ${hot ? "signal-on" : ""}"><div class="label">${l}</div><div class="value" style="font-size:19px">${v}</div><div class="note">${n}</div></div>`).join("");
        }
      }
      const psData = fund.ps || fund.pb_hist;
      if (psData) {
        const t = document.getElementById(basket + "-fd-ps-title");
        if (t) t.textContent = fund.ps ? "PS（TTM）" : "PB（银行类更看市净率）";
        await buildOne(basket + "-fd-ps", line(psData, fund.ps ? "PS" : "PB", "gold", { median: true }));
      } else { const c = document.getElementById(basket + "-fd-ps"); if (c) c.closest(".card").remove(); }
      if (fund.driver && fund.driver.length >= 4) {
        await buildOne(basket + "-fd-driver-ch", async (p) => ({
          tooltip: tip(p, { axisPointer: { type: "shadow" } }),
          legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
          grid: { left: 54, right: 20, top: 28, bottom: 26 },
          xAxis: Object.assign({ type: "category", data: fund.driver.map((d) => d.year), splitLine: { show: false } }, baseAxis(p)),
          yAxis: Object.assign({ type: "value", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
          series: [
            { name: "EPS 变化", type: "bar", stack: "drv", data: fund.driver.map((d) => d.eps_chg), itemStyle: { color: p.moss, opacity: 0.85 } },
            { name: "估值变化", type: "bar", stack: "drv", data: fund.driver.map((d) => d.pe_chg), itemStyle: { color: p.gold, opacity: 0.85 } },
            { name: "全年回报", type: "line", symbolSize: 5, data: fund.driver.map((d) => d.price_ret),
              lineStyle: { color: p.ink, width: 1.6 }, itemStyle: { color: p.ink } },
          ],
        }));
      }
      if (fund.dividends) await buildOne(basket + "-fd-div",
        bars(fund.dividends.years, fund.dividends.amounts, "moss"));
    }

    if (peers && peers.rows && peers.rows.length > 1) {
      await buildOne(basket + "-fd-peers-ch", async (p) => ({
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
        grid: { left: 54, right: 20, top: 28, bottom: 26 },
        xAxis: Object.assign({ type: "category", data: peers.rows.map((r) => r.ticker.split(".")[0]), splitLine: { show: false } }, baseAxis(p)),
        yAxis: Object.assign({ type: "value" }, baseAxis(p)),
        series: [
          ["PE (TTM)", "pe", "accent"], ["ROE %", "roe", "teal"], ["净利率 %", "net_margin", "gold"],
        ].map(([n, k, c]) => ({
          name: n, type: "bar",
          data: peers.rows.map((r) => ({
            value: r[k] == null ? null : Math.round(r[k] * 10) / 10,
            itemStyle: { color: p[c], opacity: r.ticker === ticker ? 1 : 0.35 },
          })),
        })),
      }));
    }
  }

  // ---------------- hash 路由 ----------------
  function route() {
    const h = location.hash.slice(1) || "pulse";
    const [panel, stock] = h.split("/");
    const target = registry[panel] ? panel : "pulse";
    activatePanel(target).then(() => {
      if (BASKET_CFG[target]) {
        if (stock) showStock(target, stock);
        else showOverview(target);
      }
      buildToc();
    });
    // 页脚静态页从顶部看起
    if (["about", "contact", "privacy", "terms", "refunds", "pricing", "methodology"].includes(target)) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // 点击站名 = 回首页并滚到顶部（tab 切换不受影响，仍保留各自滚动位置）
  document.querySelector(".brand")?.addEventListener("click", () => {
    if (location.hash === "#pulse") route();      // 已在首页：hashchange 不触发，手动重路由
    window.scrollTo(0, 0);
  });

  // ---------------- 左侧悬浮章节目录 ----------------
  const ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ", "ⅩⅢ", "ⅩⅣ", "ⅩⅤ"];
  const tocEl = document.getElementById("toc");
  let tocChapters = [];

  function highlightToc() {
    if (!tocChapters.length) return;
    let current = tocChapters[0];
    for (const c of tocChapters) {
      if (c.getBoundingClientRect().top <= 150) current = c;
    }
    tocEl.querySelectorAll("a").forEach((a) =>
      a.classList.toggle("active", a.dataset.target === current.id));
  }
  let tocTick = false;
  window.addEventListener("scroll", () => {
    if (tocTick) return;
    tocTick = true;
    setTimeout(() => { highlightToc(); tocTick = false; }, 80);
  }, { passive: true });
  setInterval(highlightToc, 500); // scroll 事件之外的兜底，保证高亮永远跟手

  function buildToc() {
    const panel = document.querySelector(".panel.active");
    tocChapters = [];
    if (!panel) { tocEl.innerHTML = ""; return; }
    let scope = panel;
    const stockView = panel.querySelector(".basket-stock");
    if (stockView && stockView.style.display !== "none") scope = stockView;
    else {
      const ov = panel.querySelector(".basket-overview");
      if (ov) scope = ov;
    }
    const heads = [...scope.querySelectorAll(".chapter-head h2")];
    const chapters = heads.map((h, i) => {
      const ch = h.closest(".chapter");
      if (!ch.id) ch.id = panel.id + "-ch" + i; // 已有 id（如 fd-* 章节）保留，供数据裁剪定位
      return ch;
    });
    // 标题单独包 span，文本节点独立才能命中 i18n 词典
    tocEl.innerHTML = heads.map((h, i) =>
      `<a data-target="${chapters[i].id}" title="${h.textContent}">${ROMAN[i] || i + 1} · <span>${h.textContent.split("：")[0]}</span></a>`
    ).join("");
    renumberChapters(scope); // 插入/裁剪章节后重排"第N章"标签
    tocChapters = chapters;
    highlightToc();
  }
  tocEl.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) { tocEl.classList.remove("open"); return; } // 点遮罩空白处即收起抽屉
    const target = document.getElementById(a.dataset.target);
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    if (window.innerWidth < 1560) tocEl.classList.remove("open");
  });
  document.getElementById("toc-toggle").addEventListener("click", () =>
    tocEl.classList.toggle("open"));

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
        Object.assign({ type: "value", name: "K 指数", min: 0, max: 12, interval: 2, gridIndex: 1 }, baseAxis(p)),
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
        <div class="label">今日 K 指数（${cur.date.replace(/-/g, "\u2011")}）</div>
        <div class="value">${cur.k.toFixed(2)}</div>
        <div class="note">${on ? "★ 金风玉露相逢 — 信号触发" : "未触发（K ≥ 1）"}</div>
      </div>
      <div class="stat"><div class="label">CNN 恐惧贪婪</div><div class="value">${cur.cnn.toFixed(0)}</div><div class="note">${cur.rating || ""}</div></div>
      <div class="stat"><div class="label">VIX</div><div class="value">${cur.vix.toFixed(1)}</div><div class="note">恐慌保险的价格 · K = CNN ÷ VIX</div></div>
      <div class="stat"><div class="label">最近一次信号</div><div class="value" style="font-size:18px">${last.start.replace(/-/g, "\u2011")}</div><div class="note">至今 ${pct(last.fwd_to_date)}</div></div>`;

    const tbl = document.getElementById("k-table");
    const cell = (v) => v == null ? "<td>--</td>" :
      `<td class="${v >= 0 ? "pos" : "neg"}">${pct(v)}</td>`;
    tbl.innerHTML =
      "<tr><th>#</th><th>信号首日</th><th>持续(日)</th><th>最低 K</th>" +
      "<th><span>纳指</span> +20d</th><th><span>纳指</span> +40d</th><th><span>纳指</span> +60d</th>" +
      "<th><span>标普</span> +60d</th><th><span>纳指</span><span>至今</span></th><th><span>标普</span><span>至今</span></th></tr>" +
      sig.signals.map((s, i) =>
        `<tr><td>${i + 1}</td><td>${s.start}</td><td>${s.days_below}</td>` +
        `<td class="k-min">${s.min_k.toFixed(2)}</td>` +
        cell(s.fwd20) + cell(s.fwd40) + cell(s.fwd60) + cell(s.spx_fwd60) + cell(s.fwd_to_date) + cell(s.spx_to_date) + "</tr>"
      ).join("");

    // 持有期矩阵：五个视界 × 双锚的胜率与中位收益（120/250 视界未到期的信号不计入）
    const mtEl = document.getElementById("k-matrix");
    if (mtEl) {
      const HZ = [20, 40, 60, 120, 250];
      const median = (a) => { const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
      const rowFor = (prefix) => {
        const wins = [], avgs = [], meds = [];
        for (const h of HZ) {
          const vals = sig.signals.map((s) => s[`${prefix}fwd${h}`]).filter((v) => v != null);
          wins.push(vals.length ? `${vals.filter((v) => v > 0).length}/${vals.length}` : "--");
          avgs.push(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
          meds.push(vals.length ? median(vals) : null);
        }
        return { wins, avgs, meds };
      };
      const nd = rowFor(""), sp = rowFor("spx_");
      const medCell = (v) => v == null ? "<td>--</td>" : `<td class="${v >= 0 ? "pos" : "neg"}">${pct(v)}</td>`;
      mtEl.innerHTML =
        `<tr><th></th>${HZ.map((h) => `<th>+${h}d</th>`).join("")}</tr>` +
        `<tr><td>纳指 胜率</td>${nd.wins.map((w) => `<td>${w}</td>`).join("")}</tr>` +
        `<tr><td>纳指 平均收益</td>${nd.avgs.map(medCell).join("")}</tr>` +
        `<tr><td>纳指 中位收益</td>${nd.meds.map(medCell).join("")}</tr>` +
        `<tr><td>标普 胜率</td>${sp.wins.map((w) => `<td>${w}</td>`).join("")}</tr>` +
        `<tr><td>标普 平均收益</td>${sp.avgs.map(medCell).join("")}</tr>` +
        `<tr><td>标普 中位收益</td>${sp.meds.map(medCell).join("")}</tr>`;
    }

    const n = sig.signals.length;
    const win60 = sig.signals.filter((s) => s.fwd60 != null && s.fwd60 > 0).length;
    const has60 = sig.signals.filter((s) => s.fwd60 != null).length;
    const winS = sig.signals.filter((s) => s.spx_fwd60 != null && s.spx_fwd60 > 0).length;
    const hasS = sig.signals.filter((s) => s.spx_fwd60 != null).length;
    document.getElementById("k-verdict").textContent =
      `实证结论：2011 年以来共 ${n} 次信号。60 个交易日窗口胜率：标普 ${winS}/${hasS}、纳指 ${win60}/${has60}` +
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
        grid: { left: 54, right: 20, top: 20, bottom: 60 },
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
          borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
          handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
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
      if (d.vol60) series.push({
        name: "已实现波动率(60d)", type: "line", showSymbol: false,
        data: zip(d.dates, d.vol60), lineStyle: { color: p.moss, width: 1.1 }, itemStyle: { color: p.moss },
      });
      if (d.vol_index) series.push({
        name: d.vol_index_name, type: "line", showSymbol: false,
        data: zip(d.dates, d.vol_index), lineStyle: { color: p.accent, width: 1 }, itemStyle: { color: p.accent },
        markLine: { silent: true, symbol: "none",
          lineStyle: { color: p.danger, type: "dashed", width: 1.2 },
          label: { color: p.danger, formatter: d.vol_index_name + " = 30 · 保费警戒线", fontFamily: "JetBrains Mono", fontSize: 10 },
          data: [{ yAxis: 30 }] },
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
      '<tr><th>代码</th><th class="left has-logo">名称</th><th>市值 ($B)</th><th>YTD</th><th>1年</th><th>3年年化</th><th>5年年化</th><th>10年年化</th><th>共同起点年化</th><th>最大回撤</th></tr>' +
      d.rows.map((r) =>
        `<tr class="clickable" data-hash="#${prefix}/${r.safe}"><td>${r.ticker}</td>` +
        `<td class="left-col">${tblLogo(r.ticker)}${r.name}</td>` +
        `<td>${r.mcap ? Math.round(r.mcap).toLocaleString("en-US") : "--"}</td>` +
        c(r.ytd, "%") + c(r.y1, "%") + c(r.y3, "%") + c(r.y5, "%") + c(r.y10, "%") + c(r.since, "%") +
        `<td class="neg">${r.max_dd}%</td></tr>`
      ).join("");
    tbl.addEventListener("click", (e) => {
      const tr = e.target.closest("tr.clickable");
      if (tr) location.hash = tr.dataset.hash;
    });
  }

  // ---------------- 扩容章节构建器 ----------------
  function distChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      return {
        tooltip: tip(p, {
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            const b = d.buckets[params[0].dataIndex];
            const yrs = [];
            for (let i = 0; i < b.years.length; i += 6) yrs.push(b.years.slice(i, i + 6).join(" "));
            return `<b>${b.label}</b> · ${b.count} 年<br/>${yrs.join("<br/>") || "--"}`;
          },
        }),
        grid: { left: 54, right: 20, top: 24, bottom: 28 },
        xAxis: Object.assign({ type: "category", data: d.buckets.map((b) => b.label), splitLine: { show: false } }, baseAxis(p)),
        yAxis: Object.assign({ type: "value", name: "年数" }, baseAxis(p)),
        series: [{
          type: "bar", barCategoryGap: "20%",
          data: d.buckets.map((b, i) => ({ value: b.count, itemStyle: { color: i < 4 ? p.danger : p.moss } })),
        }],
      };
    };
  }

  function holdingChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      return {
        tooltip: tip(p, {
          axisPointer: { type: "shadow" },
          formatter: (params) => {
            const r = d.rows[params[0].dataIndex];
            return `持有 ${r.years} 年<br/>胜率 ${r.win}%<br/>年化中位 ${r.median}% · 最差 ${r.worst}% · 最好 ${r.best}%`;
          },
        }),
        grid: { left: 54, right: 20, top: 24, bottom: 28 },
        xAxis: Object.assign({ type: "category", data: d.rows.map((r) => "持有" + r.years + "年"), splitLine: { show: false } }, baseAxis(p)),
        yAxis: Object.assign({ type: "value", max: 100, axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        series: [{ type: "bar", barCategoryGap: "30%",
          data: d.rows.map((r) => ({ value: r.win, itemStyle: { color: p.moss } })),
          label: { show: true, position: "top", color: p.inkSoft, fontFamily: "JetBrains Mono", fontSize: 11, formatter: "{c}%" } }],
      };
    };
  }

  async function renderHoldingTable(dsName, tableId) {
    const d = await load(dsName);
    const f = (v) => `<td class="${v >= 0 ? "pos" : "neg"}">${(v > 0 ? "+" : "") + v.toFixed(1)}%</td>`;
    document.getElementById(tableId).innerHTML =
      "<tr><th>持有期</th><th>胜率</th><th>年化中位</th><th>最差年化</th><th>最好年化</th><th>样本</th></tr>" +
      d.rows.map((r) =>
        `<tr><td>${r.years} 年</td><td>${r.win}%</td>` + f(r.median) + f(r.worst) + f(r.best) +
        `<td>${r.samples}</td></tr>`).join("");
  }

  function rollMatrixChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      const defs = [["cagr5", "5 年", p.blue], ["cagr10", "10 年", p.gold], ["cagr20", "20 年", p.accent]];
      return {
        tooltip: tip(p),
        legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
        grid: { left: 54, right: 20, top: 30, bottom: 60 },
        dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
          borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
          handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "value", axisLabel: { formatter: "{value}%", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }, baseAxis(p)),
        series: defs.filter(([k]) => d[k]).map(([k, n, c]) => ({
          name: n + "年化", type: "line", showSymbol: false, data: zip(d.dates, d[k]),
          lineStyle: { color: c, width: 1.3 }, itemStyle: { color: c },
        })).concat([{
          name: "零线", type: "line", showSymbol: false, data: [],
          markLine: { silent: true, symbol: "none", lineStyle: { color: p.ink, type: "dashed" },
            label: { show: false }, data: [{ yAxis: 0 }] },
        }]),
      };
    };
  }

  async function renderBullBearTable(dsName, tableId) {
    const d = await load(dsName);
    document.getElementById(tableId).innerHTML =
      "<tr><th>阶段</th><th>起点</th><th>终点</th><th>涨跌</th><th>历时(天)</th></tr>" +
      d.cycles.slice().reverse().map((c) =>
        `<tr><td>${c.kind === "bull" ? "🐂 牛" : "🐻 熊"}</td><td>${c.start}</td><td>${c.end || "进行中"}</td>` +
        `<td class="${c.ret >= 0 ? "pos" : "neg"}">${(c.ret > 0 ? "+" : "") + c.ret}%</td><td>${c.days}</td></tr>`).join("");
  }

  function dailyHistChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      return {
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        grid: { left: 60, right: 20, top: 24, bottom: 28 },
        xAxis: Object.assign({ type: "category", data: d.hist.map((h) => h.label), splitLine: { show: false } }, baseAxis(p)),
        yAxis: Object.assign({ type: "log", name: "天数(log)" }, baseAxis(p)),
        series: [{ type: "bar", barCategoryGap: "20%",
          data: d.hist.map((h, i) => ({ value: h.count || null, itemStyle: { color: i < 5 ? p.danger : p.moss } })) }],
      };
    };
  }

  async function renderExtremesTable(dsName, tableId) {
    const d = await load(dsName);
    document.getElementById(tableId).innerHTML =
      "<tr><th>#</th><th>最差单日</th><th>跌幅</th><th>最好单日</th><th>涨幅</th></tr>" +
      d.worst.map((w, i) => {
        const b = d.best[i];
        return `<tr><td>${i + 1}</td><td>${w.date}</td><td class="neg">${w.ret}%</td>` +
               `<td>${b.date}</td><td class="pos">+${b.ret}%</td></tr>`;
      }).join("");
  }

  function simpleLine(dsName, name, colorKey, opts) {
    opts = opts || {};
    return async (p) => {
      const d = await load(dsName);
      const series = {
        name, type: "line", showSymbol: false, data: zip(d.dates, d.values),
        lineStyle: { color: p[colorKey], width: 1.3 }, itemStyle: { color: p[colorKey] },
      };
      if (opts.avgLine) {
        const avg = d.values.reduce((a, b) => a + b, 0) / d.values.length;
        series.markLine = { silent: true, symbol: "none", lineStyle: { color: p.ink, type: "dashed" },
          label: { color: p.muted, formatter: "均值 " + avg.toFixed(1), fontFamily: "JetBrains Mono" },
          data: [{ yAxis: avg }] };
      }
      return {
        tooltip: tip(p),
        grid: { left: 58, right: 20, top: 20, bottom: 28 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: opts.log ? "log" : "value" }, baseAxis(p)),
        series: [series],
      };
    };
  }

  function sectorChart(dsName) {
    return async (p) => {
      const d = await load(dsName);
      const s = d.sectors.slice().reverse();
      return {
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        grid: { left: 150, right: 40, top: 10, bottom: 28 },
        xAxis: Object.assign({ type: "value", name: "家数" }, baseAxis(p)),
        yAxis: Object.assign({ type: "category", data: s.map((x) => x.sector), splitLine: { show: false },
          axisLabel: { color: p.inkSoft, fontSize: 11 } }, baseAxis(p)),
        series: [{ type: "bar", barCategoryGap: "30%",
          data: s.map((x) => ({ value: x.count, itemStyle: { color: p.teal } })),
          label: { show: true, position: "right", color: p.muted, fontFamily: "JetBrains Mono", fontSize: 11 } }],
      };
    };
  }

  const tblLogo = (ticker) =>
    `<img class="tbl-logo" loading="lazy" data-t="${ticker}" src="logos/${safeTicker(ticker)}.png" referrerpolicy="no-referrer" onerror="__logoErr(this)" alt="">`;

  async function renderTopTable(dsName, tableId) {
    const d = await load(dsName);
    const tbl = document.getElementById(tableId);
    tbl.innerHTML =
      '<tr><th>#</th><th>代码</th><th class="left center-col">公司</th><th class="left center-col">行业</th><th>市值 ($B)</th><th>权重</th></tr>' +
      d.rows.map((r, i) =>
        `<tr><td>${i + 1}</td><td>${r.ticker}</td>` +
        `<td class="center-col"><span class="co-wrap">${tblLogo(r.ticker)}${r.name}</span></td>` +
        `<td class="center-col" style="font-family:'Noto Sans SC',sans-serif">${r.sector || "--"}</td>` +
        `<td>${r.mcap ? Math.round(r.mcap).toLocaleString("en-US") : "--"}</td>` +
        `<td class="k-min">${r.weight.toFixed(2)}%</td></tr>`).join("") +
      (d.asof ? `<tr><td colspan="6" style="text-align:left;color:var(--ink-muted)">数据截至 ${d.asof} · ${d.source}</td></tr>` : "");
  }

  async function renderConstituents(dsName, tableId) {
    const d = await load(dsName);
    const hasAdded = d.rows[0] && d.rows[0].added !== undefined;
    document.getElementById(tableId).innerHTML =
      `<tr><th>#</th><th>代码</th><th class="left center-col">公司</th><th class="left center-col">${hasAdded ? "GICS 行业" : "行业"}</th>${hasAdded ? "<th>纳入日期</th>" : ""}</tr>` +
      d.rows.map((r, i) =>
        `<tr><td>${i + 1}</td><td>${r.ticker}</td><td class="center-col"><span class="co-wrap">${tblLogo(r.ticker)}${r.name}</span></td>` +
        `<td class="center-col" style="font-family:'Noto Sans SC',sans-serif">${r.sector}</td>` +
        (hasAdded ? `<td>${r.added || "--"}</td>` : "") + "</tr>").join("");
  }

  // ---------------- 估值的弹性（SPY） ----------------
  const median = (xs) => {
    const s = xs.filter((v) => v != null).slice().sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const percentile = (xs, cur) => {
    const s = xs.filter((v) => v != null);
    return Math.round(s.filter((v) => v <= cur).length / s.length * 1000) / 10;
  };

  async function spyValStats() {
    const pe = await load("sp500_pe_ttm");
    const now = pe.dates[pe.dates.length - 1];
    const y50 = (parseInt(now.slice(0, 4)) - 50) + now.slice(4);
    const sel = (from) => pe.values.filter((v, i) => pe.dates[i] >= from);
    return {
      cur: pe.values[pe.values.length - 1],
      medAll: median(pe.values), med50: median(sel(y50)), med2010: median(sel("2010")),
      pct: percentile(pe.values, pe.values[pe.values.length - 1]),
      since: pe.dates[0].slice(0, 4), asof: now,
    };
  }

  chart("spy", "ch-spy-val", async (p) => {
    const [pe, st] = await Promise.all([load("sp500_pe_ttm"), spyValStats()]);
    const ml = (v, label, color) => ({
      yAxis: v, lineStyle: { color, type: "dashed", width: 1.2 },
      label: { color, formatter: label + " " + v.toFixed(1), fontFamily: "JetBrains Mono", fontSize: 10 },
    });
    return {
      tooltip: tip(p),
      grid: { left: 54, right: 96, top: 20, bottom: 28 },
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "value" }, baseAxis(p)),
      series: [{
        name: "PE(TTM)", type: "line", showSymbol: false, data: zip(pe.dates, pe.values),
        lineStyle: { color: p.accent, width: 1.2 }, itemStyle: { color: p.accent },
        markLine: { silent: true, symbol: "none", data: [
          ml(st.medAll, "全历史中位", p.ink),
          ml(st.med50, "近50年中位", p.gold),
          ml(st.med2010, "2010→中位", p.moss),
        ] },
      }],
    };
  });

  async function renderValCards() {
    try {
      const [st, cape, iv] = await Promise.all([spyValStats(), load("sp500_cape"), load("index_val")]);
      const curCape = cape.cape[cape.cape.length - 1];
      const capePct = percentile(cape.cape, curCape);
      const fwd = iv.SPY && iv.SPY.forward_pe;
      document.getElementById("spy-val-cards").innerHTML = [
        ["当前 PE (TTM)", st.cur.toFixed(1), `全历史第 ${st.pct} 百分位`, st.pct > 90],
        ["席勒 CAPE", curCape.toFixed(1), `1871 年来第 ${capePct} 百分位`, capePct > 90],
        ["远期 PE (SPY 口径)", fwd ? fwd.toFixed(1) : "--", fwd ? "" : "免费源暂缺，参考 TTM", false],
        ["三条中位数锚", `${st.medAll.toFixed(0)} / ${st.med50.toFixed(0)} / ${st.med2010.toFixed(1)}`, "全历史 / 近50年 / 2010→", false],
      ].map(([l, v, n, hot]) =>
        `<div class="stat ${hot ? "signal-on" : ""} ${String(v).length > 8 ? "compact" : ""}"><div class="label">${l}</div><div class="value">${v}</div><div class="note">${n}</div></div>`).join("");
      document.getElementById("spy-val-note").textContent =
        `口径说明：PE(TTM) 与 CAPE 来自 multpl/席勒月度数据（${st.since} 年起），百分位为当前值在全部历史读数中的位置；` +
        `三条中位数是三个不同时代的"估值重力"——离哪条锚越远，弹性拉得越满。数据截至 ${st.asof}。`;
      const qv = iv.QQQ || {};
      document.getElementById("qqq-val-cards").innerHTML = [
        ["QQQ PE (TTM · ETF 口径)", qv.trailing_pe ? qv.trailing_pe.toFixed(1) : "--", "持仓加权"],
        ["QQQ 远期 PE", qv.forward_pe ? qv.forward_pe.toFixed(1) : "--", qv.forward_pe ? "" : "免费源暂缺"],
        ["SPY PE 对照", iv.SPY && iv.SPY.trailing_pe ? iv.SPY.trailing_pe.toFixed(1) : "--", "同为 ETF 口径"],
      ].map(([l, v, n]) =>
        `<div class="stat"><div class="label">${l}</div><div class="value">${v}</div><div class="note">${n}</div></div>`).join("");
    } catch (e) { /* 数据缺失时留空 */ }
  }

  // ---------------- 宏观（FRED） ----------------
  function macroLines(keys, opts) {
    opts = opts || {};
    return async (p) => {
      const d = await load("macro");
      const colors = [p.cmpBlue, p.cmpRed, p.cmpGreen, p.cmpPurple];
      const series = keys.filter(([k]) => d[k]).map(([k, label], i) => ({
        name: label, type: opts.bar ? "bar" : "line", showSymbol: false,
        data: zip(d[k].dates, d[k].values),
        lineStyle: { color: colors[i % 4], width: 1.3 }, itemStyle: { color: colors[i % 4] },
        yAxisIndex: opts.dualAxis && i === keys.length - 1 ? 1 : 0,
      }));
      if (opts.zeroLine || opts.markValue != null) {
        series[0].markLine = { silent: true, symbol: "none",
          lineStyle: { color: p.danger, type: "dashed", width: 1.2 },
          label: { color: p.danger, formatter: opts.markLabel || "", fontFamily: "JetBrains Mono", fontSize: 10 },
          data: [{ yAxis: opts.markValue != null ? opts.markValue : 0 }] };
      }
      const yAxes = [Object.assign({ type: "value", name: opts.yName || "" }, baseAxis(p))];
      if (opts.dualAxis) yAxes.push(Object.assign({ type: "value", name: opts.y2Name || "", position: "right", splitLine: { show: false } }, baseAxis(p)));
      return {
        tooltip: tip(p),
        legend: keys.length > 1 ? { textStyle: { color: p.muted, fontSize: 11 }, top: 0 } : undefined,
        grid: { left: 56, right: opts.dualAxis ? 56 : 20, top: keys.length > 1 ? 30 : 20, bottom: 28 },
        xAxis: timeX(p),
        yAxis: yAxes,
        series,
      };
    };
  }

  function macroBars(key, label) {
    return async (p) => {
      const d = await load("macro");
      return {
        tooltip: tip(p, { axisPointer: { type: "shadow" } }),
        grid: { left: 56, right: 20, top: 20, bottom: 28 },
        xAxis: timeX(p),
        yAxis: Object.assign({ type: "value" }, baseAxis(p)),
        series: [{
          name: label, type: "bar", barWidth: "60%",
          data: d[key].dates.map((dt, i) => ({
            value: [dt, d[key].values[i]],
            itemStyle: { color: d[key].values[i] >= 0 ? p.moss : p.danger },
          })),
        }],
      };
    };
  }

  chart("macro", "ch-macro-rates", macroLines([["sofr", "SOFR"], ["effr", "EFFR"], ["target", "目标上限"]], { yName: "%" }));
  chart("macro", "ch-macro-rrp", macroLines([["rrp", "ON RRP"]], { yName: "$B" }));
  chart("macro", "ch-macro-walcl", macroLines([["walcl", "Fed 资产负债表"]], { yName: "$T" }));
  chart("macro", "ch-macro-yields", macroLines([["dgs2", "2Y"], ["dgs10", "10Y"], ["dgs20", "20Y"], ["dgs30", "30Y"]], { yName: "%" }));
  chart("macro", "ch-macro-curve", macroLines([["t10y2y", "10Y−2Y"]], { markValue: 0, markLabel: "倒挂线", yName: "%" }));
  chart("macro", "ch-macro-credit", macroLines([["hy_oas", "高收益 OAS"], ["ig_oas", "投资级 OAS"]], { yName: "%" }));
  chart("macro", "ch-macro-inflation", macroLines([["cpi_yoy", "CPI 同比"], ["core_pce_yoy", "核心 PCE 同比"], ["ppi_yoy", "PPI 同比"]], { markValue: 2, markLabel: "2% 目标", yName: "%" }));
  chart("macro", "ch-macro-gdp", macroBars("gdp_qoq", "GDP 环比年化"));
  chart("macro", "ch-macro-jobs", async (p) => {
    const d = await load("macro");
    return {
      tooltip: tip(p),
      legend: { textStyle: { color: p.muted, fontSize: 11 }, top: 0 },
      grid: { left: 56, right: 56, top: 30, bottom: 28 },
      xAxis: timeX(p),
      yAxis: [
        Object.assign({ type: "value", name: "千人" }, baseAxis(p)),
        Object.assign({ type: "value", name: "失业率%", position: "right", splitLine: { show: false } }, baseAxis(p)),
      ],
      series: [
        { name: "非农新增", type: "bar", barWidth: "60%",
          data: d.nfp.dates.map((dt, i) => ({
            value: [dt, d.nfp.values[i]],
            itemStyle: { color: d.nfp.values[i] >= 0 ? p.moss : p.danger },
          })) },
        { name: "失业率", type: "line", yAxisIndex: 1, showSymbol: false,
          data: zip(d.unrate.dates, d.unrate.values),
          lineStyle: { color: p.cmpRed, width: 1.4 }, itemStyle: { color: p.cmpRed } },
      ],
    };
  });
  chart("macro", "ch-macro-profits", macroBars("cp_yoy", "企业利润同比"));

  // ---------------- 今日 · 头版：板块热力图（TradingView 官方免费 widget） ----------------
  // MC 语言码 → TradingView locale
  function tvLocale() {
    const L = document.documentElement.lang;
    return L === "zh-CN" ? "zh_CN" : L === "zh-TW" ? "zh_TW" : (L || "en");
  }
  // 把 TradingView 标普 500 热图挂到 #pulse-base 里的容器；随日夜/语言重新挂载
  function mountHeatmap() {
    const box = document.querySelector("#pulse-base .tv-heatmap");
    if (!box) return;
    // TradingView 组件按配置里的固定像素高度自撑（用 "100%" 会取父高→塌成 0）
    const h = window.innerWidth <= 900 ? 460 : 620;
    const L = tvLocale();
    // 版权署名随语言（TradingView 名字+链接必须保留；后缀本地化避免中文残留）
    const credit = { zh_CN: " 提供热图数据", zh_TW: " 提供熱圖數據", en: " heatmap data",
      fr: " — données heatmap", de: " — Heatmap-Daten", es: " — datos del mapa" }[L] || " heatmap data";
    box.innerHTML =
      '<div class="tradingview-widget-container__widget" style="height:' + (h - 22) + 'px;width:100%"></div>' +
      '<div class="tradingview-widget-copyright">' +
      '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">TradingView</a>' + credit + '</div>';
    // 不注入 TradingView 引导脚本（TV 文档警告动态注入会出问题、Safari 曾因此反复崩溃渲染进程），
    // 直接自己拼 iframe——引导脚本唯一职责就是拼它
    const cfg = {
      dataSource: "SPX500",
      blockSize: "market_cap_basic",
      blockColor: "change",
      grouping: "sector",
      locale: L,
      symbolUrl: "",
      // TradingView 不支持自定义背景/透明（isTransparent 会被丢弃），亮色主题是刺眼白底。
      // 故始终用 dark 主题 + 深色边框，做成「嵌入式数据面板」，在羊皮纸亮色下也像有意为之的暗屏。
      colorTheme: "dark",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: h - 22,
    };
    const ifr = document.createElement("iframe");
    ifr.src = "https://www.tradingview-widget.com/embed-widget/stock-heatmap/?locale=" + L +
      "#" + encodeURIComponent(JSON.stringify(cfg));
    ifr.style.cssText = "width:100%;height:" + (h - 22) + "px;border:0;display:block";
    ifr.setAttribute("frameborder", "0");
    ifr.setAttribute("allowtransparency", "true");
    ifr.setAttribute("scrolling", "no");
    box.querySelector(".tradingview-widget-container__widget").appendChild(ifr);
  }

  // ---------------- 今日 · 头版（聚光灯封面） ----------------
  // ---------------- 信号台账图表（头版紧凑版 + K/LEAPS 页缩放版共用） ----------------
  const ledgerZoom = (p) => [
    { type: "inside" },
    { type: "slider", bottom: 6, height: 18, borderColor: p.border,
      fillerColor: "rgba(160,57,47,0.08)", handleStyle: { color: p.accent },
      textStyle: { color: p.muted, fontSize: 10 } },
  ];

  // 落点图：纳指 100 对数线 + 每一次 LEAPS 窗口 / K<1 信号的入场点
  async function buildLedgerMap(p, opts) {
    const o = opts || {};
    const [lp, ks] = await Promise.all([load("leaps"), load("kindex_signals")]);
    const idx = new Map(lp.dates.map((d, i) => [d, i]));
    const at = (ds) => {
      let i = idx.has(ds) ? idx.get(ds) : lp.dates.findIndex((x) => x >= ds);
      return i == null || i < 0 ? null : [lp.dates[i], lp.ndx[i]];
    };
    const lPts = lp.episodes.map((e) => { const q = at(e.start); return q && { value: q, ep: e }; }).filter(Boolean);
    const kPts = ks.signals.map((s) => { const q = at(s.start); return q && { value: q, sg: s }; }).filter(Boolean);
    return {
      tooltip: tip(p, {
        trigger: "item",
        formatter: (o) => {
          if (o.data && o.data.ep) { const e = o.data.ep; return `${e.start}<br/>LEAPS 窗口 · 最低恐贪 ${e.min_fng}<br/>12 个月后 ${pct(e.ndx_m12)}（纳指 100）`; }
          if (o.data && o.data.sg) { const s = o.data.sg; return `${s.start}<br/>K &lt; 1 信号 · 最低 K ${s.min_k}<br/>60 个交易日后 ${pct(s.fwd60)}（纳指 100）`; }
          return "";
        },
      }),
      legend: { top: 0, left: 0, textStyle: { color: p.muted, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
      grid: { left: 52, right: 18, top: 34, bottom: o.zoom ? 60 : 28 },
      dataZoom: o.zoom ? ledgerZoom(p) : undefined,
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "log", splitLine: { show: false } }, baseAxis(p)),
      series: [
        { name: "纳指 100", type: "line", data: zip(lp.dates, lp.ndx), showSymbol: false, silent: true,
          lineStyle: { color: p.muted, width: 1, opacity: 0.7 }, itemStyle: { color: p.muted } },
        { name: "LEAPS 窗口开启", type: "scatter", data: lPts, symbolSize: 9, itemStyle: { color: p.moss } },
        { name: "K < 1 信号", type: "scatter", data: kPts, symbol: "diamond", symbolSize: 14, itemStyle: { color: p.danger } },
      ],
    };
  }

  // LEAPS 净值序列（净值曲线与滚动年化共用）：每次窗口首日买入纳指 100 持有 12 个月，
  // 持有期内新窗口跳过、空仓期记零、不计成本
  async function leapsEquitySeries() {
    const lp = await load("leaps");
    const dates = lp.dates, px = lp.ndx, HOLD = 252;
    const idx = new Map(dates.map((d, i) => [d, i]));
    const at = (ds) => (idx.has(ds) ? idx.get(ds) : dates.findIndex((x) => x >= ds));
    const segs = [];
    let exit = -1;
    for (const e of lp.episodes) {
      const i = at(e.start);
      if (i == null || i < 0 || i <= exit) continue;
      // 离场日优先用管线在纯价格日历上算好的 m12_exit（恐贪存档缺日会让 +252 行偏长）
      let j = e.m12_exit ? at(e.m12_exit) : -1;
      if (j == null || j < 0) j = Math.min(i + HOLD, px.length - 1);
      segs.push([i, j]); exit = j;
    }
    if (!segs.length) throw new Error("no episodes");
    const first = segs[0][0];
    const spx = lp.spx || null;
    const out = { dates: [], strat: [], hold: [], holdSpx: spx ? [] : null };
    let eq = 1, si = 0;
    for (let t = first; t < dates.length; t++) {
      if (t > first) {
        while (si < segs.length && t > segs[si][1]) si++;
        if (si < segs.length && t > segs[si][0] && t <= segs[si][1]) eq *= px[t] / px[t - 1];
      }
      out.dates.push(dates[t]);
      out.strat.push(eq);
      out.hold.push(px[t] / px[first]);
      if (spx) out.holdSpx.push(spx[t] / spx[first]);
    }
    return out;
  }

  async function buildLedgerEq(p, opts) {
    const o = opts || {};
    const s = await leapsEquitySeries();
    const zip4 = (vals) => vals.map((v, i) => [s.dates[i], +v.toFixed(4)]);
    const strat = zip4(s.strat), hold = zip4(s.hold), holdSpx = s.holdSpx ? zip4(s.holdSpx) : null;
    const spx = holdSpx;
    const endLbl = (color) => ({ show: true, formatter: (o) => "×" + (+o.value[1]).toFixed(1),
      fontFamily: "JetBrains Mono", fontSize: 11, color });
    const series = [
      { name: "每次窗口都跟（持有 12 个月）", type: "line", data: strat, showSymbol: false,
        lineStyle: { color: p.cmpRed, width: 2.6 }, itemStyle: { color: p.cmpRed }, endLabel: endLbl(p.cmpRed) },
      { name: "一直持有纳指 100", type: "line", data: hold, showSymbol: false,
        lineStyle: { color: p.cmpPurple, width: 2, type: "dashed" }, itemStyle: { color: p.cmpPurple }, endLabel: endLbl(p.cmpPurple) },
    ];
    if (spx) series.push(
      { name: "一直持有标普 500", type: "line", data: holdSpx, showSymbol: false,
        lineStyle: { color: p.cmpBlue, width: 2, type: "dashed" }, itemStyle: { color: p.cmpBlue }, endLabel: endLbl(p.cmpBlue) });
    return {
      tooltip: tip(p, { valueFormatter: (v) => "×" + (+v).toFixed(2) }),
      legend: { top: 0, left: 0, textStyle: { color: p.muted, fontSize: 11 } },
      grid: { left: 52, right: 56, top: 56, bottom: o.zoom ? 60 : 28 },
      dataZoom: o.zoom ? ledgerZoom(p) : undefined,
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "log", splitLine: { show: false } }, baseAxis(p)),
      series,
    };
  }

  // K 指数页专属：落点图（2011 起）与 60 个交易日持有净值
  async function buildKMap(p) {
    const [kd, ks] = await Promise.all([load("kindex"), load("kindex_signals")]);
    const idx = new Map(kd.dates.map((d, i) => [d, i]));
    const at = (ds) => (idx.has(ds) ? idx.get(ds) : kd.dates.findIndex((x) => x >= ds));
    const pts = ks.signals.map((s) => {
      const i = at(s.start);
      return i >= 0 ? { value: [kd.dates[i], kd.ndx[i]], sg: s } : null;
    }).filter(Boolean);
    return {
      tooltip: tip(p, {
        trigger: "item",
        formatter: (o2) => {
          const s = o2.data && o2.data.sg;
          if (!s) return "";
          return `${s.start}<br/>K &lt; 1 信号 · 最低 K ${s.min_k}<br/>60 个交易日后：纳指 ${pct(s.fwd60)} · 标普 ${pct(s.spx_fwd60)}`;
        },
      }),
      legend: { top: 0, left: 0, textStyle: { color: p.muted, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
      grid: { left: 52, right: 18, top: 34, bottom: 60 },
      dataZoom: ledgerZoom(p),
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "log", splitLine: { show: false } }, baseAxis(p)),
      series: [
        { name: "纳指 100", type: "line", data: zip(kd.dates, kd.ndx), showSymbol: false, silent: true,
          lineStyle: { color: p.muted, width: 1, opacity: 0.7 }, itemStyle: { color: p.muted } },
        { name: "K < 1 信号", type: "scatter", data: pts, symbol: "diamond", symbolSize: 15, itemStyle: { color: p.danger } },
      ],
    };
  }

  async function buildKEq(p) {
    const [kd, ks] = await Promise.all([load("kindex"), load("kindex_signals")]);
    const dates = kd.dates, px = kd.ndx, spx = kd.spx || null;
    const idx = new Map(dates.map((d, i) => [d, i]));
    const at = (ds) => (idx.has(ds) ? idx.get(ds) : dates.findIndex((x) => x >= ds));
    const segs = [];
    let exit = -1;
    for (const s of ks.signals) {
      const i = at(s.start);
      if (i == null || i < 0 || i <= exit) continue;
      let j = s.exit60 ? at(s.exit60) : -1;
      if (j == null || j < 0) j = Math.min(i + 60, px.length - 1);
      segs.push([i, j]); exit = j;
    }
    if (!segs.length) throw new Error("no signals");
    const first = segs[0][0];
    const strat = [], hold = [], holdSpx = [];
    let eq = 1, si = 0;
    for (let t = first; t < dates.length; t++) {
      if (t > first) {
        while (si < segs.length && t > segs[si][1]) si++;
        if (si < segs.length && t > segs[si][0] && t <= segs[si][1]) eq *= px[t] / px[t - 1];
      }
      strat.push([dates[t], +eq.toFixed(4)]);
      hold.push([dates[t], +(px[t] / px[first]).toFixed(4)]);
      if (spx) holdSpx.push([dates[t], +(spx[t] / spx[first]).toFixed(4)]);
    }
    const endLbl = (color) => ({ show: true, formatter: (o2) => "×" + (+o2.value[1]).toFixed(1),
      fontFamily: "JetBrains Mono", fontSize: 11, color });
    const series = [
      { name: "每次信号都跟（持有 60 个交易日）", type: "line", data: strat, showSymbol: false,
        lineStyle: { color: p.cmpRed, width: 2.6 }, itemStyle: { color: p.cmpRed }, endLabel: endLbl(p.cmpRed) },
      { name: "一直持有纳指 100", type: "line", data: hold, showSymbol: false,
        lineStyle: { color: p.cmpPurple, width: 2, type: "dashed" }, itemStyle: { color: p.cmpPurple }, endLabel: endLbl(p.cmpPurple) },
    ];
    if (spx) series.push(
      { name: "一直持有标普 500", type: "line", data: holdSpx, showSymbol: false,
        lineStyle: { color: p.cmpBlue, width: 2, type: "dashed" }, itemStyle: { color: p.cmpBlue }, endLabel: endLbl(p.cmpBlue) });
    return {
      tooltip: tip(p, { valueFormatter: (v) => "×" + (+v).toFixed(2) }),
      legend: { top: 0, left: 0, textStyle: { color: p.muted, fontSize: 11 } },
      grid: { left: 52, right: 56, top: 56, bottom: 60 },
      dataZoom: ledgerZoom(p),
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "log", splitLine: { show: false } }, baseAxis(p)),
      series,
    };
  }

  // 恐惧的标价：窗口开启日 VIX（保费水位）× 12 个月后纳指涨跌
  async function buildLeapsVix(p) {
    const lp = await load("leaps");
    const pts = lp.episodes
      .filter((e) => e.vix_start != null && e.ndx_m12 != null)
      .map((e) => ({ value: [e.vix_start, e.ndx_m12], ep: e,
        itemStyle: { color: e.ndx_m12 > 0 ? p.moss : p.danger } }));
    return {
      tooltip: tip(p, {
        trigger: "item",
        formatter: (o) => {
          const e = o.data && o.data.ep;
          if (!e) return "";
          return `${e.start}<br/>开窗日 VIX ${e.vix_start} · 最低恐贪 ${e.min_fng}<br/>12 个月后：纳指 ${pct(e.ndx_m12)} · 标普 ${pct(e.spx_m12)}`;
        },
      }),
      grid: { left: 56, right: 24, top: 30, bottom: 44 },
      xAxis: Object.assign({ type: "value", name: "开窗日 VIX", nameLocation: "middle", nameGap: 28,
        nameTextStyle: { color: p.muted, fontSize: 11 } }, baseAxis(p)),
      yAxis: Object.assign({ type: "value", axisLabel: Object.assign({}, baseAxis(p).axisLabel, { formatter: "{value}%" }) }, baseAxis(p)),
      series: [{ type: "scatter", data: pts, symbolSize: 11 }],
    };
  }

  // 滚动三年年化：策略 vs 两个锚（高于虚线的时段 = 跟信号占优）
  async function buildLeapsRoll(p) {
    const s = await leapsEquitySeries();
    const W = 756; // 3 年 ≈ 756 个交易日
    const roll = (vals) => {
      const out = [];
      for (let t = W; t < vals.length; t++)
        out.push([s.dates[t], +((Math.pow(vals[t] / vals[t - W], 252 / W) - 1) * 100).toFixed(2)]);
      return out;
    };
    const series = [
      { name: "每次窗口都跟（持有 12 个月）", type: "line", data: roll(s.strat), showSymbol: false,
        lineStyle: { color: p.cmpRed, width: 2.6 }, itemStyle: { color: p.cmpRed } },
      { name: "一直持有纳指 100", type: "line", data: roll(s.hold), showSymbol: false,
        lineStyle: { color: p.cmpPurple, width: 2, type: "dashed" }, itemStyle: { color: p.cmpPurple } },
    ];
    if (s.holdSpx) series.push(
      { name: "一直持有标普 500", type: "line", data: roll(s.holdSpx), showSymbol: false,
        lineStyle: { color: p.cmpBlue, width: 2, type: "dashed" }, itemStyle: { color: p.cmpBlue } });
    return {
      tooltip: tip(p, { valueFormatter: (v) => (+v).toFixed(1) + "%" }),
      legend: { top: 0, left: 0, textStyle: { color: p.muted, fontSize: 11 } },
      grid: { left: 52, right: 24, top: 56, bottom: 60 },
      dataZoom: ledgerZoom(p),
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "value", axisLabel: Object.assign({}, baseAxis(p).axisLabel, { formatter: "{value}%" }) }, baseAxis(p)),
      series,
    };
  }

  // 宏观 · 仓位与杠杆：NAAIM 经理人敞口（周频，2006→）
  chart("macro", "ch-naaim", async (p) => {
    const d = await load("naaim");
    return {
      tooltip: tip(p, { valueFormatter: (v) => (+v).toFixed(1) }),
      grid: { left: 52, right: 60, top: 24, bottom: 60 },
      dataZoom: ledgerZoom(p),
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "value", min: 0 }, baseAxis(p)),
      series: [{
        name: "NAAIM 经理人敞口", type: "line", data: zip(d.dates, d.values), showSymbol: false,
        lineStyle: { color: p.teal, width: 1.6 }, itemStyle: { color: p.teal },
        endLabel: { show: true, formatter: (o) => (+o.value[1]).toFixed(0),
          fontFamily: "JetBrains Mono", fontSize: 11, color: p.teal },
        markLine: { silent: true, symbol: "none",
          lineStyle: { color: p.muted, type: "dashed", width: 1 },
          label: { color: p.muted, fontFamily: "JetBrains Mono", fontSize: 10, formatter: "满仓 100" },
          data: [{ yAxis: 100 }] },
      }],
    };
  });

  // K / LEAPS 页注册台账图表（带缩放的完整版；头版是紧凑钩子）
  chart("kindex", "ch-k-map", buildKMap);
  chart("kindex", "ch-k-eq", buildKEq);
  chart("leaps", "ch-leaps-map", (p) => buildLedgerMap(p, { zoom: true }));
  chart("leaps", "ch-leaps-eq", (p) => buildLedgerEq(p, { zoom: true }));
  chart("leaps", "ch-leaps-vix", buildLeapsVix);
  chart("leaps", "ch-leaps-roll", buildLeapsRoll);

  async function renderPulse() {
    let d, leaps = null, kd = null, ks = null;
    try { d = await load("pulse"); } catch (e) {
      document.getElementById("pulse-base").innerHTML =
        '<p style="color:var(--ink-muted)">数据更新中，稍后自动出现 · data updating</p>';
      return;
    }
    try { leaps = await load("leaps"); } catch (e) {}
    try { kd = await load("kindex"); ks = await load("kindex_signals"); } catch (e) { kd = ks = null; }

    const chg = (v) => `<span class="${v >= 0 ? "pos" : "neg"}">${(v > 0 ? "+" : "") + v.toFixed(2)}%</span>`;
    const tempColor = d.temp >= 75 ? "#B8421E" : d.temp >= 50 ? "#C9882E" : d.temp >= 25 ? "#14A63E" : "#2B5F8F";
    const tempWord = d.temp >= 75 ? "炙热" : d.temp >= 50 ? "偏暖" : d.temp >= 25 ? "温和" : "冰点";
    const pct = (v) => v.toFixed(1);
    const q = d.quotes || {};
    const windowOpen = leaps && leaps.current && leaps.current.window_open;

    // 信号台账区块（数据不全时整块跳过，不出残缺 UI）
    let ledgerHTML = "";
    if (leaps && kd && ks && kd.current && leaps.current) {
      const fmt = (v) => (v == null ? "--" : (v > 0 ? "+" : "") + v.toFixed(1) + "%");
      const sigs = ks.signals, eps = leaps.episodes;
      const kAll = sigs.length, kW = sigs.filter((s) => s.fwd60 > 0).length,
        kL = sigs.filter((s) => s.fwd60 != null && s.fwd60 <= 0).length;
      const kWs = sigs.filter((s) => s.spx_fwd60 > 0).length,
        kLs = sigs.filter((s) => s.spx_fwd60 != null && s.spx_fwd60 <= 0).length;
      const lAll = eps.length, lW = eps.filter((e) => e.ndx_m12 > 0).length,
        lL = eps.filter((e) => e.ndx_m12 != null && e.ndx_m12 <= 0).length;
      const lWs = eps.filter((e) => e.spx_m12 > 0).length,
        lLs = eps.filter((e) => e.spx_m12 != null && e.spx_m12 <= 0).length;
      const kTrig = kd.current.k < 1, lOpen = leaps.current.window_open;
      const lastK = sigs[sigs.length - 1], lastL = eps[eps.length - 1];
      const lastLRet = lastL.ndx_to_date != null ? lastL.ndx_to_date : lastL.spx_to_date;
      ledgerHTML = `
      <div class="pulse-ledger">
        <div class="pulse-section-label">信号台账 · 逐次公开对账</div>
        <p class="ledger-intro">两个原创指标，一本逐日自动记的账：赢的和输的都在账上。读数由管线每日自动提交，带 GitHub 时间戳，事后不可改写。</p>
        <p class="ledger-intro">官方定义：KAPX 指数（K 取自「恐」字拼音首字母）是 Market Chronicle 每个交易日发布的美股恐惧定价指标：用 CNN 恐贪指数除以 VIX，衡量人群情绪相对波动率价格的偏离。读数、方法论与完整信号台账永久免费公开，Git 时间戳可验证。</p>
        <div class="ledger-cards">
          <a class="ledger-card" href="#kindex">
            <div class="lc-name">K 指数 <span>CNN 恐贪 ÷ VIX</span></div>
            <div class="lc-val">${kd.current.k.toFixed(2)}</div>
            <div class="lc-state ${kTrig ? "neg" : "pos"}">${kTrig ? "触发中" : "未触发"} <span>（K &lt; 1 触发）</span></div>
            <div class="lc-meta"><b>${kAll}</b> <span>次信号（2011 年起）</span> · <span>60 个交易日后</span><br><span>标普</span> <b class="pos">${kWs}</b> <span>涨</span> <b class="neg">${kLs}</b> <span>跌</span> · <span>纳指</span> <b class="pos">${kW}</b> <span>涨</span> <b class="neg">${kL}</b> <span>跌</span></div>
          </a>
          <a class="ledger-card" href="#leaps">
            <div class="lc-name">LEAPS 窗口 <span>恐贪 &lt; 25 · 极端恐惧</span></div>
            <div class="lc-val">${Math.round(leaps.current.fng)}</div>
            <div class="lc-state ${lOpen ? "neg" : "pos"}">${lOpen ? "窗口开启" : "窗口关闭"} <span>（恐贪 &lt; 25 开启）</span></div>
            <div class="lc-meta"><b>${lAll}</b> <span>次窗口（2011 年起）</span> · <span>12 个月后</span><br><span>标普</span> <b class="pos">${lWs}</b> <span>涨</span> <b class="neg">${lLs}</b> <span>跌</span> · <span>纳指</span> <b class="pos">${lW}</b> <span>涨</span> <b class="neg">${lL}</b> <span>跌</span></div>
          </a>
          <div class="ledger-card">
            <div class="lc-name">最近战报 <span>按信号首日纳指 100 收盘价计</span></div>
            <div class="lc-row"><span class="lc-tag">K</span> <span class="lc-date">${lastK.start}</span> <span>至今</span> <b class="${lastK.fwd_to_date >= 0 ? "pos" : "neg"}">${fmt(lastK.fwd_to_date)}</b></div>
            <div class="lc-row"><span class="lc-tag">LEAPS</span> <span class="lc-date">${lastL.start}</span> <span>至今</span> <b class="${lastLRet >= 0 ? "pos" : "neg"}">${fmt(lastLRet)}</b></div>
            <div class="lc-meta"><span>每一次的逐条结果，见上方「K 指数 · 台账」与「恐惧的标价 · 台账」</span></div>
          </div>
        </div>
        <!-- 2026-07-17 头版瘦身（用户裁）：落点图+净值曲线两张 15 年图撤回各自的家（K 页/恐惧的标价页），
             原位只留一行文字链。「净值曲线与付费 CTA 相邻」悬案随撤图自动结案。 -->
        <p class="ledger-note">15 年台账与全部输赢（包括跑输的那部分）→ <a href="#kindex">K 指数</a> · <a href="#leaps">恐惧的标价</a></p>
        <!-- 2026-07-16：删掉这里的付费 primary（原「盘前数据简报 · 创始价 $9.9」）。三个理由：
             ① $9.9 是邮件预约制（方案 C 两扇门：陌生人自助 $29 / 信任者预约），在头版对所有人喊 9.9 = 那扇门不存在了；
                且数字本身已过期（创始码 dsc_01kxjqmtb40e8bsy2zqtkqxk0e 是 $99/年 不是 $9.9/月）。
             ② 净值曲线正上方挂付费 CTA = 观感就是「看我多准→掏钱」，而台账写着 K 策略跑输纳指。
                改动词治不了，那是相邻性的问题（此前一直挂着的未决项，本次解决）。
             ③ 读完台账的自然下一步是「验证」与「继续跟着看」，不是掏钱。掏钱的位置在定价页（页脚有入口）。
             不需要再加锚点（且 #pulse-base 不是面板名，会打乱 hash 路由）。
             2026-07-17：订阅表单从这里搬进 #pricing 免费档——全站订阅动线唯一化（顶栏胶囊→定价页，
             免费/付费并排）；主页不补替代 CTA，观感失衡就留白。 -->
        <!-- 「方法论全文」已删：正上方 .ledger-note 那句已经写着「完整口径与如实披露见方法论」，
             隔 20px 再放个按钮是同一件事说两遍；页脚也有。
             「在 GitHub 验证台账」留下且不进页脚：它是净值曲线的解药——上面那句「本站不宣称信号能跑赢买入持有」
             之后，把可验证的链接就摆在这里，本身就是可信度。它的价值不是被点击，是它存在。
             挪进页脚 = 从「我请你查」变成「你想查自己找」，那是两种人格。 -->
        <div class="ledger-actions">
        <a class="ledger-verify" href="https://github.com/klaywang24/market-chronicle/commits/main" target="_blank" rel="noopener">
          <div class="lv-title">在 GitHub 验证台账</div>
          <div class="lv-note">每个交易日的读数，每日收盘自动更新提交，带 GitHub 时间戳，事后不可改写，GitHub 精确可查</div>
        </a>
        </div>
      </div>`;
    }

    // 情绪仪表盘六卡已于 2026-07-17 迁往「恐惧的标价」页（renderFearDecomp）：
    // 与该页既有 4 context 去重后剩四卡（SKEW/期限结构两张删），头版不再渲染。

    document.getElementById("pulse-base").innerHTML = `
      <div class="pulse-kicker">TODAY'S FRONT PAGE · ${d.date}</div>
      <div class="pulse-chartband"></div>
      <div class="pulse-head">
        <div class="temp-ring" style="--pct:${d.temp};--temp-color:${tempColor}">
          <div class="val">${d.temp.toFixed(1)}<em>°</em></div>
          <div class="lbl"><span>市场温度</span> · <span>${tempWord}</span></div>
        </div>
        <div class="pulse-title">
          <h1>今日，市场的体温</h1>
          <p class="sub">温度 = （估值百分位 ${pct(d.val_pct)} + 情绪百分位 ${pct(d.sent_pct)}）÷ 2。估值取标普 500 PE(TTM) 在 1871 年以来全历史的位置；情绪取今日上涨家数占比在近一年中的位置。</p>
          <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
            <div class="pulse-quotes">
              ${q.spx ? `<span class="pq"><span class="pq-l">标普 500</span> <b>${Math.round(q.spx.close).toLocaleString("en-US")}</b> ${chg(q.spx.chg)}</span>` : ""}
              ${q.ndx ? `<span class="pq"><span class="pq-l">纳指 100</span> <b>${Math.round(q.ndx.close).toLocaleString("en-US")}</b> ${chg(q.ndx.chg)}</span>` : ""}
              ${q.dji ? `<span class="pq"><span class="pq-l">道琼斯</span> <b>${Math.round(q.dji.close).toLocaleString("en-US")}</b> ${chg(q.dji.chg)}</span>` : ""}
              ${q.rut ? `<span class="pq"><span class="pq-l">罗素 2000</span> <b>${Math.round(q.rut.close).toLocaleString("en-US")}</b> ${chg(q.rut.chg)}</span>` : ""}
            </div>
            <div class="pulse-quotes">
              ${q.vix ? `<span class="pq"><span class="pq-l">VIX 恐慌指数</span> <b>${q.vix.close}</b> ${chg(q.vix.chg)}</span>` : ""}
              ${d.fng != null ? `<span class="pq"><span class="pq-l">恐惧贪婪指数</span> <b>${Math.round(d.fng)}</b></span>` : ""}
              ${d.k != null ? `<span class="pq"><span class="pq-l">K 指数</span> <b>${d.k.toFixed(2)}</b></span>` : ""}
              ${leaps ? `<span class="pq"><span class="pq-l">LEAPS Call 窗口</span> <b class="${windowOpen ? "neg" : "pos"}">${windowOpen ? "开启" : "关闭"}</b></span>` : ""}
            </div>
          </div>
        </div>
      </div>
      ${ledgerHTML}
      <div>
        <div class="pulse-section-label">涨跌分布 · 标普 500 成分股</div>
        <div class="breadth-bar">
          <div style="flex:${d.adv};background:var(--moss)">${d.adv} 涨</div>
          <div style="flex:${Math.max(d.flat, 6)};background:var(--ink-muted)">${d.flat} 平</div>
          <div style="flex:${d.dec};background:var(--danger)">${d.dec} 跌</div>
        </div>
        <div class="breadth-note">上涨家数占比 ${d.adv_ratio}%（(涨 + 平÷2) ÷ ${d.total}），处于近一年第 ${pct(d.sent_pct)} 百分位</div>
      </div>
      <div>
        <div class="pulse-section-label">板块热力图 · 标普 500 全成分股（面积 = 市值 · 颜色 = 当日涨跌 · 点任意板块可放大细看）</div>
        <div class="tv-heatmap heat-tree tradingview-widget-container"></div>
      </div>
      <div class="pulse-foot">滑动光标，掀开夜之一角。数据每交易日收盘后自动更新；温度是尺度不是信号——96 度的估值曾经烫了三年。</div>`;

    // 顶部世纪带：真实标普 500 月线（1927→，对数坐标——天然一路向上）。
    // 只做「峰值相对」的温和回撤放大：每个历史新高原样保留（上涨气势不变），
    // 仅把从峰值起的回撤加深一点点，让危机比原始更可辨、又不失向上主线。
    // 第 4 项 = 标签上/下；第 5 项 = 水平微调 px（负=左移）；第 6 项 = 垂直微调 px
    const CRISES = [
      ["1932-06", "1929", "大萧条", "below", 6, 8], ["1974-09", "1974", "滞胀", "below", 0, 0],
      ["1987-11", "1987", "黑色星期一", "above", -48, 0], ["2002-09", "2000", "互联网泡沫", "above", -48, 0],
      ["2009-02", "2008", "金融危机", "below", 0, 16], ["2020-03", "2020", "疫情冲击", "above", -20, 0],
      ["2022-09", "2022", "加息", "below", 44, 22],
    ];
    const DD_K = 1.7; // 回撤放大系数（1 = 真实，越大回撤越深；只影响回撤、不动新高。日频后调高让快速深跌如 2020 更醒目）
    const drawCentury = async (band, stroke, width, glow, opacity, withDots) => {
      try {
        const c = await load("sp500_century");
        const vals = c.close, n = vals.length;
        const L = vals.map((v) => Math.log(v));
        let pk = L[0];
        const adj = L.map((v) => { pk = Math.max(pk, v); return pk - DD_K * (pk - v); });
        const lo = Math.min(...adj), hi = Math.max(...adj);
        const xy = (i) => [i / (n - 1) * 100, 96 - (adj[i] - lo) / (hi - lo) * 92];
        const pts = adj.map((v, i) => xy(i).map((z) => z.toFixed(2)).join(",")).join(" ");
        band.insertAdjacentHTML("afterbegin",
          `<svg class="pulse-chartline" viewBox="0 0 100 100" preserveAspectRatio="none" style="opacity:${opacity}">
             <polyline class="draw-line" points="${pts}" pathLength="1000" fill="none"
               style="stroke:${stroke};stroke-width:${width}${glow ? `;filter:drop-shadow(0 0 ${glow}px ${stroke})` : ""}"/></svg>`);
        if (!withDots) return;
        for (const [ym, year, name, place, dx, dy] of CRISES) {
          const i = c.dates.findIndex((dt) => dt >= ym);
          if (i < 0) continue;
          const [x, y] = xy(i);
          const cls = (place === "below" ? "below " : "") + (x > 90 ? "edge-r" : x < 6 ? "edge-l" : "");
          band.insertAdjacentHTML("beforeend",
            `<div class="crisis-dot ${cls}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%${dx ? `;--dx:${dx}px` : ""}${dy ? `;--dy:${dy}px` : ""}">
               <i></i><span>${year} · <span>${name}</span></span></div>`);
        }
      } catch (e) {}
    };
    const base = document.getElementById("pulse-base");
    await drawCentury(base.querySelector(".pulse-chartband"), "var(--accent)", 0.5, 0, 0.55, true);

    // 揭示层 = 同一内容的夜间克隆 + 金色发光线（红点随克隆保留）
    const reveal = document.getElementById("pulse-reveal");
    reveal.innerHTML = base.innerHTML;
    // 克隆层去掉 id，避免与日间层重复（getElementById/ECharts 挂载只认日间层）
    reveal.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    const rBand = reveal.querySelector(".pulse-chartband");
    const clonedSvg = rBand && rBand.querySelector("svg.pulse-chartline");
    if (clonedSvg) clonedSvg.remove();
    if (rBand) await drawCentury(rBand, "#E0B05A", 0.8, 2, 0.9, false);

    // 板块热力图：挂 TradingView 官方 widget（只挂日间层；揭示层的空容器留着不挂，
    // 聚光灯只掀开顶部时间线，热图区不会被揭示，无需第二个 widget）
    mountHeatmap();

    // 台账两张图已随头版瘦身撤除（buildLedgerMap/Eq 仍服务 K 页与恐惧的标价页）；
    // stampSources 保留：它统一给全站 .card 补数据源行，与头版是否有图无关
    stampSources();

    // 聚光灯：只在悬停/点击世纪时间线上的六个危机点时亮起，定位在该点；离开即熄灭
    const hero = document.getElementById("pulse-hero");
    const R = 30; // 聚光灯半径（比之前缩小约 2/3，只掀开危机点附近一小块）
    const setSpot = (x, y) => {
      const m = `radial-gradient(circle ${R}px at ${x}px ${y}px, #fff 0%, #fff 45%, rgba(255,255,255,.55) 68%, rgba(255,255,255,.15) 86%, transparent 100%)`;
      reveal.style.webkitMaskImage = m;
      reveal.style.maskImage = m;
    };
    const hideSpot = () => setSpot(-99999, -99999);
    const spotAtDot = (dot) => {
      const hr = hero.getBoundingClientRect();
      const ir = (dot.querySelector("i") || dot).getBoundingClientRect();
      setSpot(ir.left + ir.width / 2 - hr.left, ir.top + ir.height / 2 - hr.top);
    };
    hideSpot();
    // 事件绑在日间层的危机点上（揭示层 pointer-events:none，不拦截）
    base.querySelectorAll(".crisis-dot").forEach((dot) => {
      dot.addEventListener("mouseenter", () => spotAtDot(dot));
      dot.addEventListener("mouseleave", hideSpot);
      dot.addEventListener("click", (e) => { e.stopPropagation(); spotAtDot(dot); }); // 触屏点亮
    });
    // 点击时间线以外任意处熄灭（触屏收起）
    hero.addEventListener("click", hideSpot);
  }

  // ---------------- 数据出处标注（每张图/表下方统一小字） ----------------
  const SRC_BY_PANEL = {
    pulse: "Yahoo Finance + CNN Fear & Greed", spy: "Yahoo Finance", qqq: "Yahoo Finance",
    tech: "Yahoo Finance", fin: "Yahoo Finance", consumer: "Yahoo Finance", luxury: "Yahoo Finance",
    macro: "FRED", kindex: "CNN Fear & Greed + Yahoo Finance", leaps: "Cboe (VIX/VIX1Y/SKEW) + FRED + CNN Fear & Greed + Yahoo Finance",
  };
  const SRC_OVERRIDES = [
    ["ch-spy-cape", "multpl / Robert Shiller"], ["ch-spy-pettm", "multpl"],
    ["ch-spy-eps", "multpl"], ["ch-spy-val", "multpl / Shiller"],
    ["spy-constituents", "Wikipedia"], ["qqq-constituents", "Wikipedia"],
    ["ch-spy-sectors", "Wikipedia"], ["ch-qqq-sectors", "Wikipedia"],
    ["spy-top-table", "SSGA (SPDR)"], ["qqq-top-table", "stockanalysis"],
    ["ch-leaps-vx", "Cboe CFE daily settlement"], ["ch-leaps-cot", "CFTC · Traders in Financial Futures"],
  ];
  let metaDate = "";

  function stampSources() {
    if (!metaDate) return;
    document.querySelectorAll(".panel .card").forEach((card) => {
      if (card.querySelector(".src-note")) return;
      const inner = card.querySelector(".chart, table");
      if (!inner) return;
      const panelKey = card.closest(".panel").id.replace("panel-", "");
      let src = SRC_BY_PANEL[panelKey] || "Yahoo Finance";
      for (const [id, s] of SRC_OVERRIDES) {
        if (card.querySelector("#" + id)) { src = s; break; }
      }
      const weekly = /-fd-/.test(inner.id || "");
      const line = weekly
        ? `数据截至 ${metaDate} · macrotrends + Yahoo Finance · 每周六自动更新`
        : `数据截至 ${metaDate} · ${src} · 每交易日收盘后自动更新`;
      card.insertAdjacentHTML("beforeend", `<p class="footnote src-note">${line}</p>`);
    });
  }

  // ---------------- LEAPS 窗口 ----------------
  chart("leaps", "ch-leaps", async (p) => {
    const d = await load("leaps");
    const areas = d.episodes.map((e) => [
      { xAxis: e.start, itemStyle: { color: p.accent, opacity: 0.12 } },
      { xAxis: e.end },
    ]);
    return {
      tooltip: tip(p),
      grid: { left: 58, right: 64, top: 28, bottom: 64 },
      xAxis: timeX(p),
      yAxis: [
        Object.assign({ type: "value", name: "CNN 恐贪", min: 0, max: 100 }, baseAxis(p)),
        Object.assign({ type: "log", name: "NDX", position: "right", splitLine: { show: false } }, baseAxis(p)),
      ],
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
        borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
        handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
      series: [
        { name: "CNN 恐贪", type: "line", yAxisIndex: 0, showSymbol: false,
          data: zip(d.dates, d.fng), lineStyle: { color: p.gold, width: 1.1 }, itemStyle: { color: p.gold },
          markLine: { silent: true, symbol: "none",
            lineStyle: { color: p.danger, type: "dashed", width: 1.2 },
            label: { color: p.danger, formatter: "开仓阈值 25", fontFamily: "JetBrains Mono", fontSize: 10 },
            data: [{ yAxis: d.threshold }] },
          markArea: { silent: true, data: areas } },
        { name: "纳指 100", type: "line", yAxisIndex: 1, showSymbol: false,
          data: zip(d.dates, d.ndx), lineStyle: { color: p.blue, width: 1.4 }, itemStyle: { color: p.blue } },
      ],
    };
  });

  async function renderLeaps() {
    const d = await load("leaps");
    const cur = d.current;
    const last = d.episodes[d.episodes.length - 1];
    document.getElementById("leaps-status").innerHTML = `
      <div class="stat ${cur.window_open ? "signal-on" : ""}">
        <div class="label">今日 CNN 恐贪（${cur.date.replace(/-/g, "\u2011")}）</div>
        <div class="value">${cur.fng.toFixed(0)}</div>
        <div class="note">${cur.window_open ? "极端恐惧区（&lt; 25）" : "常态（≥ 25）"}</div>
      </div>
      <div class="stat"><div class="label">极端恐惧线</div><div class="value">&lt; ${d.threshold}</div><div class="note">${cur.rating || "历史参照"}</div></div>
      <div class="stat"><div class="label">2011 年来极端恐惧</div><div class="value">${d.episodes.length} 段</div><div class="note">连续交易日聚为一段</div></div>
      <div class="stat"><div class="label">最近一次</div><div class="value" style="font-size:18px">${last.start.replace(/-/g, "\u2011")}</div><div class="note">NDX 至今 ${last.ndx_to_date > 0 ? "+" : ""}${last.ndx_to_date}%</div></div>`;

    const cell = (v) => v == null ? "<td>--</td>" :
      `<td class="${v >= 0 ? "pos" : "neg"}">${(v > 0 ? "+" : "") + v.toFixed(1)}%</td>`;
    document.getElementById("leaps-table").innerHTML =
      "<tr><th>#</th><th>窗口首日</th><th>持续(日)</th><th>最低恐贪</th>" +
      "<th>SPX+6m</th><th>SPX+12m</th><th>SPX+18m</th><th>NDX+6m</th><th>NDX+12m</th><th>NDX+18m</th><th>NDX至今</th></tr>" +
      d.episodes.slice().reverse().map((e, i) =>
        `<tr><td>${d.episodes.length - i}</td><td>${e.start}</td><td>${e.days_below}</td>` +
        `<td class="k-min">${e.min_fng}</td>` +
        cell(e.spx_m6) + cell(e.spx_m12) + cell(e.spx_m18) +
        cell(e.ndx_m6) + cell(e.ndx_m12) + cell(e.ndx_m18) + cell(e.ndx_to_date) + "</tr>").join("");

    const done = d.episodes.filter((e) => e.ndx_m12 != null);
    const win = done.filter((e) => e.ndx_m12 > 0).length;
    const spxDone = d.episodes.filter((e) => e.spx_m12 != null);
    const spxWin = spxDone.filter((e) => e.spx_m12 > 0).length;
    document.getElementById("leaps-verdict").textContent =
      `历史记录：${d.episodes.length} 段极端恐惧中，12 个月后 NDX 上行 ${win}/${done.length}、SPX 上行 ${spxWin}/${spxDone.length}。` +
      `注意 2021 年下半年的几段：高位回落途中的"极端恐惧"并非底部，12 个月后仍为负——恐惧标记的是情绪极值，不是估值底。` +
      `与 K 指数（CNN÷VIX）参照观察即可。以上为历史事实记录，非买卖建议，历史规律不保证未来。`;
  }

  // ---------------- 恐惧的标价指数（LEAPS 贵贱温度计） ----------------
  chart("leaps", "ch-leaps-gauge", async (p) => {
    const d = await load("leaps_gauge");
    const fs = d.meta.forward_start;
    const bt = d.dates.map((dt, i) => [dt, dt < fs ? d.expensiveness_3y[i] : null]);
    const fw = d.dates.map((dt, i) => [dt, dt >= fs ? d.expensiveness_3y[i] : null]);
    return {
      tooltip: tip(p, { valueFormatter: (v) => (v == null ? "--" : (+v).toFixed(0)) }),
      grid: { left: 48, right: 24, top: 26, bottom: 64 },
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "value", name: "贵贱百分位", min: 0, max: 100 }, baseAxis(p)),
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
        borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
        handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
      series: [
        // 2026-07-17 统一色调（用户定）：数据色只留猩红(danger)与绿(moss)，灰色退场——回测段绿、前向段猩红
        { name: "回测（可复现）", type: "line", showSymbol: false, connectNulls: false,
          data: bt, lineStyle: { color: p.moss, width: 1.4 }, itemStyle: { color: p.moss },
          markLine: { silent: true, symbol: "none",
            lineStyle: { color: p.ink, type: "dashed", width: 1 },
            label: { color: p.ink, formatter: "50 中性", fontFamily: "JetBrains Mono", fontSize: 10 },
            data: [{ yAxis: 50 }] } },
        { name: "前向台账（发布后逐日）", type: "line", showSymbol: true, symbolSize: 7, connectNulls: false,
          data: fw, lineStyle: { color: p.danger, width: 1.8 }, itemStyle: { color: p.danger } },
      ],
    };
  });

  // 短端 vs 长端（2026-07-16 用户定）：把「斜率故事」从文案搬上站——两条原始序列自己说话。
  // 展示层，非指数成分（斜率进不进分类器走注册流程，见 digest README「分类器的已知盲区」）。图注只写事实。
  chart("leaps", "ch-leaps-ends", async (p) => {
    const [lg, sent] = await Promise.all([load("leaps_gauge"), load("sentiment")]);
    const t = sent.term;
    const v1y = Object.create(null);
    lg.dates.forEach((dt, i) => { v1y[dt] = lg.vix1y[i]; });
    const long = [], front = [];
    t.dates.forEach((dt, i) => {
      if (v1y[dt] != null && t.vix9d[i] != null) {
        long.push([dt, v1y[dt]]);
        front.push([dt, t.vix9d[i]]);
      }
    });
    return {
      tooltip: tip(p, { valueFormatter: (v) => (v == null ? "--" : (+v).toFixed(2)) }),
      legend: { top: 0, textStyle: { color: p.ink, fontSize: 11 }, itemWidth: 18 },
      grid: { left: 48, right: 24, top: 34, bottom: 64 },
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "value", name: "波动率点" }, baseAxis(p)),
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
        borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
        handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
      series: [
        { name: "1 年期 · VIX1Y", type: "line", showSymbol: false, connectNulls: false,
          data: long, lineStyle: { color: p.accent, width: 1.8 }, itemStyle: { color: p.accent } },
        { name: "9 天期 · VIX9D", type: "line", showSymbol: false, connectNulls: false,
          data: front, lineStyle: { color: p.moss, width: 1.2 }, itemStyle: { color: p.moss } },
      ],
    };
  });

  // 恐惧的远期价目表：VX 期货逐月结算曲线（真钱轨，与指数轨互证；2026-07-17 期货双源上线）
  chart("leaps", "ch-leaps-vx", async (p) => {
    const d = await load("vx_curve");
    const cats = ["VIX 现值", ...d.curve.map((c) => c[0].slice(5).replace("-", "/"))];
    const today = [d.spot_vix, ...d.curve.map((c) => c[1])];
    const wkMap = Object.create(null);
    ((d.week_ago && d.week_ago.curve) || []).forEach((w) => { wkMap[w[0]] = w[1]; });
    const wk = [null, ...d.curve.map((c) => (wkMap[c[0]] != null ? wkMap[c[0]] : null))];
    return {
      tooltip: tip(p, { valueFormatter: (v) => (v == null ? "--" : (+v).toFixed(2)) }),
      legend: { top: 0, textStyle: { color: p.ink, fontSize: 11 }, itemWidth: 18 },
      grid: { left: 48, right: 24, top: 34, bottom: 30 },
      xAxis: Object.assign({ type: "category", data: cats }, baseAxis(p)),
      yAxis: Object.assign({ type: "value", name: "波动率点", scale: true }, baseAxis(p)),
      series: [
        // 统一色调：最新=猩红、一周前=绿虚线（数据色只留 danger/moss 两色）
        { name: "最新结算", type: "line", data: today, symbolSize: 5,
          lineStyle: { color: p.danger, width: 2 }, itemStyle: { color: p.danger },
          label: { show: true, position: "top", color: p.muted, fontSize: 10,
            fontFamily: "JetBrains Mono", formatter: (o) => (o.value == null ? "" : (+o.value).toFixed(1)) } },
        { name: "一周前", type: "line", data: wk, symbolSize: 3,
          lineStyle: { color: p.moss, width: 1.2, type: "dashed" }, itemStyle: { color: p.moss } },
      ],
    };
  });

  // 谁在押注恐惧：CFTC TFF 里杠杆基金在 VIX 期货的净头寸（周频，2006→）
  chart("leaps", "ch-leaps-cot", async (p) => {
    const d = await load("cot_vix");
    const lev = d.series.map((s) => [s.date, s.lev_net]);
    const am = d.series.map((s) => [s.date, s.am_net]);
    return {
      tooltip: tip(p, { valueFormatter: (v) => (v == null ? "--" : (+v).toLocaleString("en-US")) }),
      legend: { top: 0, textStyle: { color: p.ink, fontSize: 11 }, itemWidth: 18 },
      grid: { left: 64, right: 24, top: 34, bottom: 64 },
      xAxis: timeX(p),
      yAxis: Object.assign({ type: "value", name: "净头寸（手）" }, baseAxis(p)),
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 6, height: 18,
        borderColor: p.border, fillerColor: "rgba(160,57,47,0.08)",
        handleStyle: { color: p.accent }, textStyle: { color: p.muted, fontSize: 10 } }],
      series: [
        { name: "杠杆基金", type: "line", showSymbol: false, connectNulls: false, data: lev,
          lineStyle: { color: p.accent, width: 1.6 }, itemStyle: { color: p.accent },
          markLine: { silent: true, symbol: "none", label: { show: false },
            lineStyle: { color: p.muted, type: "dashed", width: 1 }, data: [{ yAxis: 0 }] } },
        { name: "资管机构", type: "line", showSymbol: false, connectNulls: false, data: am,
          lineStyle: { color: p.moss, width: 1.1, type: "dashed" }, itemStyle: { color: p.moss } },
      ],
    };
  });

  async function renderLeapsGauge() {
    let d;
    try { d = await load("leaps_gauge"); }
    catch (e) {
      document.getElementById("lg-hero").innerHTML =
        '<div class="card"><p style="color:var(--ink-muted);font-size:13px">数据更新中，稍后自动出现 · data updating</p></div>';
      return;
    }
    const c = d.current, e = c.expensiveness, x = c.context, t = x.term_ladder;
    const p3 = Math.round(e.p3y);
    const col = p3 >= 60 ? "var(--danger)" : p3 <= 40 ? "var(--moss)" : "var(--gold)";
    const verdict = p3 >= 66 ? "偏贵" : p3 >= 55 ? "略偏贵" : p3 >= 45 ? "中性" : p3 >= 34 ? "略偏便宜" : "偏便宜";
    const inv = t.ratio_vix_vix1y < 1;
    const sign = (v) => (v > 0 ? "+" : "") + v.toFixed(1);
    // 柱高用相对刻度：把 5 档间的差值放大（绝对刻度下 15→23 只差三成，视觉上像一样高）
    const ladderVals = [t.vix9d, t.vix, t.vix3m, t.vix6m, t.vix1y];
    const ladderHi = Math.max(...ladderVals), ladderLo = Math.min(...ladderVals);
    const barH = (v) => Math.round(16 + 84 * (v - ladderLo + 0.6) / (ladderHi - ladderLo + 0.6));
    document.getElementById("lg-hero").innerHTML = `
      <div class="card">
        <div class="lg-top">
          <div class="lg-num">
            <div class="lg-big" style="color:${col}">${p3}<span>/100</span></div>
            <div class="lg-verdict" style="background:${col}">${verdict}</div>
            <div class="lg-numsub">VIX1Y 在过去 <b>3 年</b>的百分位（高=贵）</div>
            <div class="lg-numsub">即：比过去三年 ${p3}% 的交易日都贵</div>
          </div>
          <div class="lg-right">
            <div class="lg-spectrum"><div class="lg-mark" style="left:${e.p3y}%"><span>${p3}</span></div></div>
            <div class="lg-scale"><span>0 · 便宜</span><span>贵 · 100</span></div>
            <div class="lg-windows">
              <div><span>近 3 年</span><b>${p3}</b><i>主看</i></div>
              <div><span>近 5 年</span><b>${Math.round(e.p5y)}</b><i>中期</i></div>
              <div><span>全 史</span><b>${Math.round(e.pfull)}</b><i>长期</i></div>
            </div>
            <div class="lg-wnote">同一天，近 3 年偏贵、拉长看只是中性——最近三年太平静。三窗并陈，不藏选择。</div>
          </div>
        </div>
      </div>
      <div class="card lg-ladder">
        <div class="lc-name">期限阶梯 <span>短端平静 → 长端（你买的那截）最贵</span></div>
        <div class="lg-bars">
          <div class="lg-bar"><div class="lg-col" style="height:${barH(t.vix9d)}%"></div><b>${t.vix9d.toFixed(1)}</b><span>9 天</span></div>
          <div class="lg-bar"><div class="lg-col" style="height:${barH(t.vix)}%"></div><b>${t.vix.toFixed(1)}</b><span>VIX 30 天</span></div>
          <div class="lg-bar"><div class="lg-col" style="height:${barH(t.vix3m)}%"></div><b>${t.vix3m.toFixed(1)}</b><span>3 月</span></div>
          <div class="lg-bar"><div class="lg-col" style="height:${barH(t.vix6m)}%"></div><b>${t.vix6m.toFixed(1)}</b><span>6 月</span></div>
          <div class="lg-bar hi"><div class="lg-col" style="height:${barH(t.vix1y)}%"></div><b>${t.vix1y.toFixed(1)}</b><span>1 年 ★</span></div>
        </div>
        <div class="lg-wnote">五根柱 = 给 5 个期限各开一份"保费"；买 LEAPS，付的是最右那根的价。</div>
      </div>
      <div class="senti-cards lg-ctx4">
        <div class="senti-card">
          <div class="lc-name">VRP 波动税 <span>你多付的"冤枉钱"</span></div>
          <div class="lc-val">${sign(x.vrp.main)}</div>
          <div class="lc-meta"><span>vol 点 · 近 3 月 ${sign(x.vrp.small)}</span></div>
        </div>
        <div class="senti-card">
          <div class="lc-name">期限结构 <span>VIX ÷ VIX1Y</span></div>
          <div class="lc-val">${t.ratio_vix_vix1y.toFixed(2)}</div>
          <div class="lc-meta"><span>${inv ? "越远越贵 · 保得久，保费高" : "倒挂 · 眼下比一年后还贵"}</span></div>
        </div>
        <div class="senti-card">
          <div class="lc-name">Call 偏斜 SKEW <span>看涨相对看跌</span></div>
          <div class="lc-val">${Math.round(x.call_skew.pctile_full)}</div>
          <div class="lc-meta"><span>分位 · 全史 · 值 ${x.call_skew.value.toFixed(0)}</span></div>
        </div>
        <div class="senti-card">
          <div class="lc-name">实际利率 <span>10 年期 · 资金压在仓里的成本</span></div>
          <div class="lc-val">${Math.round(x.real_rate.pctile_full)}</div>
          <div class="lc-meta"><span>分位 · 全史 · ${x.real_rate.value.toFixed(2)}%</span></div>
        </div>
      </div>
      <p class="footnote src-note"><span>VIX1Y = ${c.vix1y}</span> · <span>4 context 只展示，不平均进头条</span> · <span>数据截至</span> ${c.date}（<span>${c.segment === "forward" ? "前向台账" : "回测"}</span>）· <span>描述性数据，非投资建议</span></p>`;
  }

  // 恐惧的分解（2026-07-17 自头版迁入）：与本页 4 context 去重后剩四卡——
  // P/C、VXN 纳指溢价、广度 %>200DMA、恐贪七分量（SKEW/期限结构两张与 4 context 重复，已删）。
  // 文案逐字沿用头版旧卡，i18n D key 原样命中；语言切换由文本节点翻译器接管，无需重渲。
  async function renderFearDecomp() {
    const host = document.getElementById("leaps-decomp");
    if (!host) return;
    let senti = null, breadth = null;
    try { senti = await load("sentiment"); } catch (e) {}
    try { breadth = await load("breadth"); } catch (e) {}
    if (!senti || !senti.pc) {
      host.innerHTML = '<div class="card"><p style="color:var(--ink-muted);font-size:13px">数据更新中，稍后自动出现 · data updating</p></div>';
      return;
    }
    const SUB_NAMES = {
      market_momentum_sp500: "市场动能", stock_price_strength: "股价强度",
      stock_price_breadth: "股价广度", put_call_options: "期权 Put/Call",
      market_volatility_vix: "波动率 VIX", junk_bond_demand: "垃圾债需求",
      safe_haven_demand: "避险需求",
    };
    // 2026-07-17 统一色调（用户定）：中性灰退场，两色制——恐惧侧(<45)猩红，其余绿
    const subColor = (s) => (s < 45 ? "var(--danger)" : "var(--moss)");
    const subRows = Object.entries(SUB_NAMES).map(([k, name]) => {
      const v = senti.subs && senti.subs[k];
      if (!v) return "";
      return `<div class="senti-row"><span class="senti-name">${name}</span>
        <span class="senti-bar"><i style="width:${Math.max(3, Math.min(100, v.score))}%;background:${subColor(v.score)}"></i></span>
        <b style="color:${subColor(v.score)}">${v.score.toFixed(0)}</b></div>`;
    }).join("");
    host.innerHTML = `
      <div class="senti-cards">
        <div class="senti-card">
          <div class="lc-name">Put/Call 比 <span>全市场 · 5 日均值</span></div>
          <div class="lc-val">${senti.pc.current == null ? "--" : senti.pc.current.toFixed(2)}</div>
          <div class="lc-meta"><span>近一年百分位</span> <b>${senti.pc.pctile == null ? "--" : senti.pc.pctile.toFixed(0)}</b><br><span>越高 = 买保护的人越多 = 越恐慌</span></div>
        </div>
        ${senti.vxn ? `
        <div class="senti-card">
          <div class="lc-name">纳指恐慌溢价 <span>VXN ÷ VIX</span></div>
          <div class="lc-val">${senti.vxn.current.toFixed(2)}</div>
          <div class="lc-meta"><span class="nw"><span>当前 VXN</span> <b>${senti.vxn.vxn.toFixed(1)}</b></span> · <span class="nw"><span>全史百分位</span> <b>${senti.vxn.pctile.toFixed(0)}</b></span><br><span>越高 = 市场为纳指波动付的保费越贵</span></div>
        </div>` : ""}
        ${breadth && breadth.current != null ? `
        <div class="senti-card">
          <div class="lc-name">市场广度 <span>标普成分股在 200 日均线上的占比</span></div>
          <div class="lc-val">${breadth.current.toFixed(0)}%</div>
          <div class="lc-meta"><span class="nw"><span>累积史百分位</span> <b>${breadth.pctile.toFixed(0)}</b></span> · <span class="nw"><span>自</span> ${breadth.since}</span><br><span>越低 = 超卖越深，历史底部常见个位数</span></div>
        </div>` : ""}
        <div class="senti-card">
          <div class="lc-name">恐贪指数的七个分量 <span>CNN 官方口径</span></div>
          ${subRows}
        </div>
      </div>
      <p class="footnote senti-note"><span>数据截至</span> ${senti.date} · CNN Fear & Greed + Cboe + Yahoo Finance · <span>每交易日收盘后自动更新</span></p>`;
  }

  // ---------------- 注册 SPY / QQQ ----------------
  chart("spy", "ch-spy-century", centuryChart("sp500_century", [{ ds: "sp500_century", name: "标普 500" }]));
  chart("spy", "ch-spy-annual", annualChart("sp500_annual"));
  chart("spy", "ch-spy-dist", distChart("sp500_distribution"));
  chart("spy", "ch-spy-holding", holdingChart("sp500_holding"));
  chart("spy", "ch-spy-rollmatrix", rollMatrixChart("sp500_rollmatrix"));
  chart("spy", "ch-spy-dailyhist", dailyHistChart("sp500_extremes"));
  chart("spy", "ch-spy-dd", ddChart("sp500_drawdowns"));
  chart("spy", "ch-spy-intra", intraChart("sp500_intrayear"));
  chart("spy", "ch-spy-cape", capeChart());
  chart("spy", "ch-spy-pettm", simpleLine("sp500_pe_ttm", "PE(TTM)", "accent", { avgLine: true }));
  chart("spy", "ch-spy-eps", simpleLine("sp500_eps_hist", "EPS(TTM)", "moss", { log: true }));
  chart("spy", "ch-spy-vol", volChart("sp500_volatility"));
  chart("spy", "ch-spy-season", seasonChart("sp500_seasonality"));
  chart("spy", "ch-spy-sectors", sectorChart("sp500_constituents"));

  chart("qqq", "ch-qqq-century", centuryChart(null, [
    { ds: "ixic_century", name: "纳指综指" }, { ds: "ndx_century", name: "纳指 100" },
  ]));
  chart("qqq", "ch-qqq-annual", annualChart("ndx_annual"));
  chart("qqq", "ch-qqq-dist", distChart("ndx_distribution"));
  chart("qqq", "ch-qqq-holding", holdingChart("ndx_holding"));
  chart("qqq", "ch-qqq-rollmatrix", rollMatrixChart("ndx_rollmatrix"));
  chart("qqq", "ch-qqq-dailyhist", dailyHistChart("ndx_extremes"));
  chart("qqq", "ch-qqq-dd", ddChart("ndx_drawdowns"));
  chart("qqq", "ch-qqq-intra", intraChart("ndx_intrayear"));
  chart("qqq", "ch-qqq-vol", volChart("ndx_volatility"));
  chart("qqq", "ch-qqq-season", seasonChart("ndx_seasonality"));
  chart("qqq", "ch-qqq-sectors", sectorChart("ndx_constituents"));

  ["tech", "fin", "consumer", "luxury"].forEach((b) => {
    chart(b, "ch-" + b + "-growth", basketGrowthChart(b));
    chart(b, "ch-" + b + "-annual", annualChart(b + "_annual"));
    chart(b, "ch-" + b + "-dd", ddChart(b + "_drawdowns"));
  });
  // 科技板块锚 = QQQ，复用纳指 100（ndx）面板
  chart("tech", "ch-tech-etf", centuryChart(null, [{ ds: "ndx_century", name: "QQQ 纳指 100" }]));
  chart("tech", "ch-tech-etf-annual", annualChart("ndx_annual"));
  chart("tech", "ch-tech-etf-dd", ddChart("ndx_drawdowns"));
  chart("fin", "ch-fin-etf", centuryChart(null, [{ ds: "s_xlf_century", name: "XLF" }]));
  chart("fin", "ch-fin-etf-annual", annualChart("s_xlf_annual"));
  chart("fin", "ch-fin-etf-dd", ddChart("s_xlf_drawdowns"));
  chart("consumer", "ch-consumer-etf", centuryChart(null, [
    { ds: "s_xlp_century", name: "XLP 必需消费" }, { ds: "s_xly_century", name: "XLY 可选消费" },
  ]));
  chart("consumer", "ch-consumer-etf-annual", annualChart("s_xlp_annual"));
  chart("consumer", "ch-consumer-etf2-annual", annualChart("s_xly_annual"));

  // ---------------- 定价：月 / 年切换 ----------------
  // 事件委托：docs-i18n 切换语言时会整块替换 #panel-pricing 的 innerHTML，直接绑按钮的监听会被销毁
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".pbill-btn");
    if (!b) return;
    document.querySelectorAll(".pbill-btn").forEach((x) => x.classList.toggle("active", x === b));
    const tiers = document.getElementById("pricing-tiers");
    if (tiers) tiers.classList.toggle("annual", b.dataset.bill === "y");
  });

  // ---------------- 启动 ----------------
  renderKStatus();
  renderValCards();
  renderLeaps();
  renderLeapsGauge();
  renderFearDecomp();
  renderPulse();
  renderDDTable("sp500_drawdowns", "spy-dd-table");
  renderDDTable("ndx_drawdowns", "qqq-dd-table");
  renderHoldingTable("sp500_holding", "spy-holding-table");
  renderHoldingTable("ndx_holding", "qqq-holding-table");
  renderBullBearTable("sp500_bullbear", "spy-bullbear-table");
  renderBullBearTable("ndx_bullbear", "qqq-bullbear-table");
  renderExtremesTable("sp500_extremes", "spy-extremes-table");
  renderExtremesTable("ndx_extremes", "qqq-extremes-table");
  renderConstituents("sp500_constituents", "spy-constituents");
  renderConstituents("ndx_constituents", "qqq-constituents");
  renderTopTable("sp500_top", "spy-top-table");
  renderTopTable("ndx_top", "qqq-top-table");
  renderBasketTable("tech", "tech-table");
  renderBasketTable("fin", "fin-table");
  renderBasketTable("consumer", "consumer-table");
  renderBasketTable("luxury", "luxury-table");
  load("meta").then((m) => {
    // "数据更新于" 单独包 span 以便 i18n 词典翻译；日期语言中性
    document.getElementById("meta-line").innerHTML =
      '<span>数据更新于</span> ' + m.updated.slice(0, 10);
    const [y, mo, dd] = m.updated.slice(0, 10).split("-");
    metaDate = `${dd}-${mo}-${y}`; // 日-月-年
    stampSources();
  }).catch(() => {});
  if (window.MC_I18N) {
    MC_I18N.onChange(() => { rebuildAll(); renderPulse(); }); // 图表与头版随语言重建
    MC_I18N.ready.then(route);
  } else route();
})();
