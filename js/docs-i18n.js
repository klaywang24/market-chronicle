/* 页脚静态页（关于/联系/隐私/条款/退款/定价）多语言内容。
   简体在 index.html 里；繁体由 i18n 的 opencc 自动转换（还原简体原文后，
   MutationObserver 会 opencc 转繁）；英/法/德/西用下面整段译文替换。 */
(function () {
  "use strict";
  const IDS = ["about", "contact", "privacy", "terms", "refunds", "pricing", "methodology"];
  const EMAIL = "klaywang24+marketchronicle@gmail.com";

  // 各平台品牌图标（inline SVG，随文本色，各语言通用）
  const ICON = {
    web: '<svg class="c-ic c-ic-web" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm7.93 9h-3.02c-.13-2.4-.72-4.6-1.64-6.24A8.01 8.01 0 0119.93 11zM12 4.04c1.1 1.36 1.95 3.82 2.11 6.96H9.89c.16-3.14 1.01-5.6 2.11-6.96zM8.73 4.76C7.81 6.4 7.22 8.6 7.09 11H4.07a8.01 8.01 0 014.66-6.24zM4.07 13h3.02c.13 2.4.72 4.6 1.64 6.24A8.01 8.01 0 014.07 13zM12 19.96c-1.1-1.36-1.95-3.82-2.11-6.96h4.22c-.16 3.14-1.01 5.6-2.11 6.96zm3.27-.72c.92-1.64 1.51-3.84 1.64-6.24h3.02a8.01 8.01 0 01-4.66 6.24z"/></svg>',
    email: '<svg class="c-ic c-ic-mailbox" viewBox="0 0 24 24" aria-hidden="true"><rect x="1.5" y="4" width="21" height="16" rx="2.5" fill="#0f6cbd"/><path d="M2.5 5.5 12 13l9.5-7.5" stroke="#fff" stroke-width="1.8" fill="none"/></svg>',
    x: '<svg class="c-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    github: '<svg class="c-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    discord: '<svg class="c-ic c-ic-discord" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
  };

  // 联系页正文按语言拼装（图标+链接不变，仅文案变）
  const contactBody = (t) =>
    `<div class="contact-icons">
      <a class="ci ci-web" href="https://klay-wang.com/" target="_blank" rel="noopener" title="klay-wang.com" aria-label="Personal website">${ICON.web}</a>
      <a class="ci ci-mail" href="mailto:${EMAIL}" title="${EMAIL}" aria-label="Email">${ICON.email}</a>
      <a class="ci ci-x" href="https://x.com/_Klay24_" target="_blank" rel="noopener" title="@_Klay24_" aria-label="X">${ICON.x}</a>
      <a class="ci ci-github" href="https://github.com/klaywang24" target="_blank" rel="noopener" title="klaywang24" aria-label="GitHub">${ICON.github}</a>
      <a class="ci ci-discord" href="https://discord.gg/MnMEZg7Kx2" target="_blank" rel="noopener" title="Discord" aria-label="Discord">${ICON.discord}</a>
    </div>`;

  const DOC_TR = {
    about: {
      en: { kicker: "ABOUT", h1: "About Market Chronicle",
        dek: "A free, source-available archive of US market history that updates automatically after every trading day's close — no ads. A century of markets, turned into a chronicle you can read.",
        body: `<h3>What it is</h3>
<p>Market Chronicle organizes the history of the S&amp;P 500, the Nasdaq, and baskets such as financials, consumer and luxury into a chapter-by-chapter visual record: the shape of returns, the rhythm of crises, the anchors of valuation, the texture of volatility, the compounding of time. Beyond the long-history charts, three original lenses — the "Today's Front Page" market temperature, the "KAPX Index", and the "LEAPS Window".</p>
<h3>Data &amp; methodology</h3>
<p>Prices and returns approximate total return using adjusted close; CAPE / PE(TTM) come from multpl / Robert Shiller's long series; the Fear &amp; Greed reading is from CNN; company fundamentals from macrotrends and Yahoo Finance; the daily sector heatmap is TradingView's live data. Long-history charts mostly use a log scale so that century-scale moves read honestly — 1929 fell far more than 2000 or 2008, so it should look steeper. That is the data being truthful.</p>
<h3>How it's built</h3>
<p>This site was built by one person and hosted as pure static files — no server, no database; the data is just a few hundred JSON files sitting in a public repo, open for anyone to inspect. The data pipeline (Python, yfinance / pandas + GitHub Actions) pulls data, computes metrics, commits and redeploys automatically after each trading day's close. The code is source-available under PolyForm Noncommercial 1.0.0 — free for noncommercial use; commercial use requires a separate license.</p>
<h3>Disclaimer, in one line</h3>
<p>Everything here is for information and education only and <strong>does not constitute investment advice</strong>. Markets carry risk; make your own decisions.</p>` },
    },

    contact: {
      en: { kicker: "CONTACT", h1: "Contact",
        dek: "Data issues, feature ideas, collaboration — reach out anytime.",
        body: contactBody({ site: "Website", email: "Email", issues: "bugs &amp; ideas via Issues", join: "Join Discord", channels: "daily front-page bot · market chat · LEAPS talk" }) },
    },

    privacy: {
      en: { kicker: "PRIVACY", h1: "Privacy Policy", dek: "Last updated: 2026-07-05",
        body: `<p class="doc-fineprint">This page is a compliance notice, not legal advice.</p>
<h3>Overview &amp; operator</h3>
<p>This is a pure static website hosted on GitHub Pages, with no accounts and no server backend. It is operated by an individual (the data controller). For any privacy request, email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
<h3>What we process, and on what basis</h3>
<p>We do not collect personal information you submit. The only data that may be involved is:</p>
<ul>
<li><strong>Server access logs</strong>: when serving pages to you, the host (GitHub) may record technical information such as your IP and browser user-agent (basis: legitimate interest in providing the service). These logs are held and controlled by GitHub; we cannot access their details.</li>
<li><strong>Browser local storage</strong>: used only to remember your "day/night theme" and "interface language" — functionally necessary, stored on your own device, never uploaded, and containing no personally identifying information.</li>
</ul>
<h3>Cookies</h3>
<p>We <strong>set no tracking cookies of our own and run no in-house analytics</strong>. The third-party embeds below (notably TradingView) may set their own cookies; you can block or clear them in your browser at any time.</p>
<h3>Third parties &amp; international transfers</h3>
<p>Loading a page makes requests to the following third parties, which may transfer your IP and similar technical data to servers outside your region (including the US). Their own privacy policies apply, and we do not control their processing:</p>
<ul>
<li>Google Fonts (fonts.googleapis.com) — web fonts;</li>
<li>TradingView (tradingview.com) — the sector heatmap widget, may set its own cookies;</li>
<li>parqet (assets.parqet.com) — company logo icons;</li>
<li>GitHub Pages (github.io) — the website host.</li>
</ul>
<h3>What we don't do</h3>
<p>We <strong>do not sell, rent or trade your personal information</strong> (including any "sale / sharing" as defined by California's CCPA), and we run no targeted advertising.</p>
<h3>Your rights</h3>
<p>Under applicable law (such as the EU GDPR, UK GDPR, and California CCPA/CPRA) you may have rights to access, correct, delete, restrict or object to processing, and to data portability. Because we hold almost no data that identifies you, most requests can be fulfilled simply by clearing your browser data; if you need our help, email us and we will respond within a reasonable time. You also have the right to complain to your local data protection authority.</p>
<h3>Children</h3>
<p>This site is not directed at children under 13, and we do not knowingly collect their information.</p>
<h3>Changes &amp; contact</h3>
<p>Any update will be noted with a "last updated" date at the top of this page. For privacy questions, email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>` },
    },

    terms: {
      en: { kicker: "TERMS", h1: "Terms of Service", dek: "Last updated: 2026-07-06",
        body: `<h3>Operator</h3>
<p>This website and its paid products are operated by <strong>XIN WANG</strong>, a sole proprietor trading as <strong>Market Chronicle</strong>. Contact details are on the Contact page.</p>
<h3>Acceptance</h3>
<p>By accessing or using this site, you agree to the terms below.</p>
<h3>Purpose &amp; not investment advice</h3>
<p>All content is for information and education only and <strong>does not constitute investment, financial, legal or tax advice</strong>. Any data may be delayed, inaccurate or incomplete; do not rely on it alone for trading or investment decisions.</p>
<h3>No warranty</h3>
<p>The site is provided "as is" and "as available", without any express or implied warranty as to accuracy, completeness, availability or fitness for a particular purpose.</p>
<h3>Limitation of liability</h3>
<p>To the maximum extent permitted by law, we are not liable for any direct or indirect loss arising from your use of, or inability to use, this site.</p>
<h3>Intellectual property &amp; third parties</h3>
<p>The site's code is source-available under PolyForm Noncommercial 1.0.0 (see the GitHub repo) — free for noncommercial use, commercial use requires a separate license; charts and copy are for personal, non-commercial reference. Embedded third-party components (such as TradingView) are governed by their own terms.</p>
<h3>Paid products &amp; billing</h3>
<p>Checkout, invoicing and taxes for this site's paid subscriptions are handled by <strong>Paddle as the Merchant of Record</strong> — meaning your payment contract is with Paddle, and its terms and privacy policy also apply. Purchasers must be 18 or the age of majority in their jurisdiction. Refunds follow our Refund Policy.</p>
<h3>Governing law &amp; severability</h3>
<p>These terms are governed by the law of the operator's jurisdiction (to be specified as operations formalize). If any provision is held invalid, the rest remain in effect. These terms are the entire agreement between you and us regarding use of the site.</p>
<h3>Changes</h3>
<p>We may update these terms at any time; continued use after an update means acceptance.</p>` },
    },

    refunds: {
      en: { kicker: "REFUNDS", h1: "Refund Policy", dek: "Last updated: 2026-07-14",
        body: `<h3>Scope</h3>
<p>This policy covers the site's paid subscription: <strong>Standard — the daily pre-market data digest</strong> ($29 / month, or $290 / year). Everything on the website itself — all charts, ledgers and methodology — is <strong>free, permanently</strong>, and no refunds apply to it.</p>
<h3>Terms</h3>
<ul>
<li><strong>14-day no-questions refund</strong>: if you're not satisfied within 14 days of subscribing, you get a full refund, no reason needed;</li>
<li>refunds are processed by the payment provider Paddle, returned via the original method;</li>
<li>how to request: email <a href="mailto:${EMAIL}">${EMAIL}</a> with your order details.</li>
</ul>
<p>This policy is effective from 2026-07-14. Where your local consumer protection law grants stronger rights (such as a longer unconditional withdrawal period), those rights apply.</p>` },
    },

    methodology: {
      en: { kicker: "METHODOLOGY", h1: "Methodology: Two Gauges, One Ledger",
        dek: "Definitions, formulas, statistical rules and the complete historical record — including the times the signals failed. Every number on this page is backed by public JSON files updated daily by the pipeline; readings since the site's July 2026 launch are timestamped ex-ante in the commit log, and the ledger back to 2011 is reproducible from public data.",
        body: `<h3>The KAPX Index (K 指数)</h3>
<p>Definition: <strong>K = CNN Fear &amp; Greed Index ÷ VIX</strong>. When fear (CNN falling) and volatility (VIX rising) meet, K drops below 1 — that is one signal. Clustering rule: consecutive trading days with K &lt; 1 count as one signal; a gap of more than 10 trading days starts a new one. Return horizon: Nasdaq-100 change 20 / 40 / 60 trading days after the signal's first close.</p>
<p><strong>Canonical definition:</strong> The KAPX Index is a daily U.S. equity fear-pricing gauge published by Market Chronicle, computed as the CNN Fear &amp; Greed reading divided by the VIX. The K stands for kǒng (恐), the Chinese character for fear; readings, methodology, and the complete signal ledger are permanently free and verifiable via Git timestamps. (Previously cited in English as the K-Index; the Chinese name K 指数 is unchanged.)</p>
<p>As of July 2026: 39 signals since 2011; at the 60-trading-day horizon, 26 up and 13 down — strong in V-shaped corrections, negative repeatedly through sustained stress like 2011, 2015, late 2018 and 2022; every signal is positive held to date. The signal-by-signal ledger is on the <a href="#kindex">KAPX Index</a> page; raw data at <a href="https://chronicle.klay-wang.com/data/kindex_signals.json" target="_blank" rel="noopener">kindex_signals.json</a>.</p>
<h3>Fear's Price Tag — the LEAPS Cost Gauge (恐惧的标价指数)</h3>
<p>Definition: the headline is the <strong>percentile of 1-year implied volatility (VIX1Y) over the trailing 3 years</strong> — 0 = historically cheapest, 100 = priciest. It answers one question: is buying long-dated options (LEAPS, 12–18 months) historically expensive or cheap today? Alongside it sit two more coordinates (5-year / full history) and four context readings (shown, never averaged into the headline): the volatility risk premium (VIX1Y − 1-year realized vol), the VIX9D→VIX1Y term ladder, SKEW (full-history percentile), and the 10-year real rate (full-history percentile). Why VIX1Y: LEAPS are long-dated, so the headline must use the volatility closest in tenor — VIX1Y is the longest, closest tenor in Cboe's free family.</p>
<p><strong>It is a descriptive thermometer, not a trading signal and not a forecast.</strong> It only describes "expensive or cheap," never "buy or not" — like a fuel-price sign that tells you whether gas is dear today without deciding whether you should drive. So this index is <strong>never marketed as a timing/entry tool and is never return-tested</strong>. The formula is frozen on registration (VIX1Y headline / high=expensive / three windows / four context); any iteration becomes a separate sibling. Data is backfilled to 2007 and independently reproducible; readings from the July 2026 launch carry GitHub commit timestamps as ex-ante records. Raw data at <a href="https://chronicle.klay-wang.com/data/leaps_gauge.json" target="_blank" rel="noopener">leaps_gauge.json</a>.</p>
<h3>The LEAPS Window (historical reference)</h3>
<p>Definition: a segment forms when CNN's Fear &amp; Greed Index closes <strong>below 25 (extreme fear)</strong>; consecutive days below 25 count as one segment. Horizon: S&amp;P 500 and Nasdaq-100 change 6 / 12 / 18 months after the segment's first day. This is a <strong>descriptive historical record</strong> of what followed fear extremes — not advice.</p>
<p>As of July 2026: 45 windows since 2011; at the 12-month horizon the Nasdaq-100 was up 34 times and down 7 (the rest are not yet 12 months old). Several windows in late 2021 were negative 12 months on — <strong>sentiment extremes are not valuation bottoms</strong>. The episode-by-episode ledger is on the <a href="#leaps">LEAPS Window</a> page; raw data at <a href="https://chronicle.klay-wang.com/data/leaps.json" target="_blank" rel="noopener">leaps.json</a>.</p>
<h3>The "follow every signal" rules — and an honest disclosure</h3>
<p>In plain words first: <strong>the equity curve is simply "what $1 becomes"</strong> — a curve ending at ×9.5 means the initial $1 grew to $9.5. The rules: enter at the Nasdaq-100 close on the signal's first day; hold 12 months for LEAPS windows, 60 trading days for K signals; new signals during a holding period are skipped — no adding, no resetting; cash periods earn zero; no costs, slippage or taxes.</p>
<p>Honest disclosure (as of July 2026): under these rules the LEAPS strategy (buying the Nasdaq-100) compounds to roughly <strong>9.5×</strong> since 2011 — above roughly <strong>5.8×</strong> for buy-and-hold S&amp;P 500, below roughly <strong>13.0×</strong> for buy-and-hold Nasdaq-100; the K strategy to roughly <strong>4.0×</strong> since 2011, well below the <strong>13.0×</strong> from simply holding the Nasdaq over the same span. <strong>This site does not claim these signals beat buy-and-hold of the same instrument.</strong> The ledger's value is telling you where today stands in history, and what actually happened after every sentiment extreme — wins and losses alike.</p>
<p>Why is the K strategy so far below buy-and-hold? Because it sits in cash about 60% of the time: it only holds for 60 trading days after each K &lt; 1 signal, and earns zero the rest of the time. In a market that trends up over the long run, the more time you spend in cash, the harder it is to keep up with staying fully invested — a structural difference in market exposure, not a failure of the signal. The same fact explains its shallower drawdown (roughly <strong>−26.7%</strong> max drawdown since 2011, versus −35.6% for the Nasdaq-100 and −33.9% for the S&amp;P 500): out of the market half the time, it misses half the declines too — a mechanical result of low exposure, not timing skill. <strong>Last place in total return and shallowest drawdown are two sides of the same coin.</strong> K is best used as a gauge of how afraid the crowd is right now and a discipline anchor for deploying cash into panic — not as a strategy to beat the market.</p>
<p>A note on benchmarks: every ledger is dual-anchored — the Nasdaq-100 (the strategy's actual instrument) and the S&amp;P 500 (the mainstream market anchor) are shown side by side. The sentiment inputs are S&amp;P / all-market by construction (the VIX term structure only exists officially for the S&amp;P complex, and the Fear &amp; Greed Index itself is S&amp;P-centric) — a fact of the data, not a choice.</p>
<h3>Verifiability</h3>
<p>The site is pure static architecture: after every trading day's close, a GitHub Actions pipeline pulls data, computes the indicators and commits to the public repository. <strong>From the site's launch (July 2026) onward</strong>, every day's readings carry that day's Git timestamp — the <a href="https://github.com/klaywang24/market-chronicle/commits/main" target="_blank" rel="noopener">commit history</a> is public, so anyone can verify they were recorded ex-ante. <strong>The historical ledger before launch, back to 2011</strong>, is backfilled from public data (the CNN Fear &amp; Greed archive + VIX) using the same published formula: independently reproducible by anyone, but historical backfill rather than an ex-ante record. We label the two plainly.</p>
<h3>Known characteristics &amp; limitations</h3>
<p><strong>Pipeline outage, 2026-07-12 → 07-14 (fixed)</strong>: a variable in <code>scripts/build_data.py</code> that was still used downstream got removed in a 2026-07-12 change, and daily-update failed on consecutive runs. <strong>Two trading days — 07-13 and 07-14 — have no same-day commit</strong>; those readings were recorded on 07-15 (commit <code>569e047</code>). The data itself is recomputed from public sources and independently reproducible — what the outage affected is the <strong>commit timestamp</strong> for those two days, which by this site's own standard makes them backfilled rather than ex-ante. Fixed in commit <code>82f5822</code>, along with the alerting: the previous notifier kept reading the stale files on failure and posted a normal-looking update, which is how the outage stayed invisible.</p>
<p>VIX is itself one of the seven components of the CNN Fear &amp; Greed Index (its "market volatility" component measures VIX against its 50-day average). Since K = CNN Fear &amp; Greed ÷ VIX, VIX influences K through two aligned channels — directly in the denominator, and as roughly one-seventh of the numerator's volatility component — so volatility is partially double-counted. KAPX is therefore more sensitive to volatility than a fully independent fear-over-volatility ratio would be, and describing it as "two independent signals divided" is not strictly accurate (about six-sevenths of the fear reading is independent of VIX). This is not a flaw: KAPX can be read as a volatility-stress-weighted fear gauge, and for its purpose — locating where today sits in history when fear and volatility are extreme together — that sensitivity is a feature. We disclose the overlap plainly rather than quietly removing it: once published, the formula is never changed silently; any revision would launch a new versioned index.</p>
<h3>Data sources</h3>
<p>CNN Fear &amp; Greed (whit3rabbit daily archive + CNN's official endpoint for the current day); prices and VIX from Yahoo Finance (adjusted close approximates total return); the VIX term structure (VIX9D / VIX3M / VIX6M) from Cboe's official historical data; the put/call ratio is CNN's all-market 5-day average; long-history valuation from multpl / Robert Shiller. Machine-readable entry point: <a href="https://chronicle.klay-wang.com/llms.txt" target="_blank" rel="noopener">llms.txt</a>. The KAPX Index historical readings are also published as open datasets on <a href="https://www.kaggle.com/datasets/klaywong/kapx-index-daily-fear-pricing-gauge" target="_blank" rel="noopener">Kaggle</a> and <a href="https://huggingface.co/datasets/klay24/kapx-index" target="_blank" rel="noopener">Hugging Face</a> (CC BY 4.0, refreshed quarterly).</p>
<p>A note on revisions: the CNN Fear &amp; Greed archive may revise the last few days' readings by ±1–2 points after the fact (the intraday snapshot gets replaced by the official historical value); the ledger absorbs revisions automatically with each daily pipeline run. Return horizons are always measured in trading days on the gap-free price calendar.</p>
<h3>Citation</h3>
<p>When citing the KAPX Index or LEAPS Window data, please credit: <strong>KAPX Index — Market Chronicle (chronicle.klay-wang.com)</strong>. Data is provided under PolyForm Noncommercial 1.0.0 — free for noncommercial use.</p>
<p class="doc-fineprint">All statistics on this page are for information and education only and do not constitute investment advice; past performance does not predict future results.</p>` },
    },

    pricing: {
      en: { kicker: "PRICING", h1: "Pricing", dek: "No stock picks, no predictions, no performance bragging — if that's the service you want, the door is that way. Before every open we answer three questions: how expensive is today, how afraid is the market, and where this spot ranks in history. Three minutes of plain words; when we're wrong, it stays on the record.",
        body: `<div class="pbill">
  <div class="pbill-inner">
    <button class="pbill-btn active" data-bill="m">Monthly</button>
    <button class="pbill-btn" data-bill="y">Annual</button>
  </div>
  <div class="pbill-note">Annual = 10 months' price · save 2 months</div>
</div>
<div class="pricing-tiers" id="pricing-tiers">
  <div class="ptier t-free">
    <div class="ptier-name">Free</div>
    <div class="ptier-price">$0<i class="u">forever</i></div>
    <div class="ptier-tag">The website is free, always</div>
    <ul class="ptier-list">
      <li>All index ledgers + today's readings (Fear's Price Tag / KAPX / market temperature)</li>
      <li>A century of charts + methodology + sector heatmap</li>
      <li>Verifiable day by day in the public GitHub commit log</li>
      <li>No ads · no paywall · no sign-up</li>
    </ul>
  </div>
  <div class="ptier featured">
    <div class="ptier-badge">Founding $9.9 · by email</div>
    <div class="ptier-name">Standard</div>
    <div class="ptier-price"><span class="p-m">$29<i class="u">/ mo</i></span><span class="p-y">$290<i class="u">/ yr</i></span></div>
    <div class="ptier-tag"><span class="p-m">Founding <b>$9.9 / mo, billed $99 / yr</b> — locked for life (first 50) · by email</span><span class="p-y">≈ $24 / mo · annual = 10 months' price</span></div>
    <ul class="ptier-list">
      <li><b>The daily reading</b> — never published on the site</li>
      <li><b>The reading archive</b> — filed daily, compounding</li>
      <li><b>One piece of market folklore killed per week</b> — subscribers first, public after 30 days</li>
      <li>Options-structure data table — the dozen-odd names carrying the most US options volume; the list follows liquidity</li>
    </ul>
    <div class="ptier-soon">Access is enabled within 24 hours of subscribing (I do this by hand), then the digest arrives before every open. Full refund within 14 days if you're not satisfied.</div>
    <a class="ptier-cta" href="#" id="pay-btn"><span class="p-m">Subscribe $29 / mo</span><span class="p-y">Subscribe $290 / yr</span></a>
    <a class="ptier-alt" href="mailto:${EMAIL}?subject=Founding">Founding $9.9 — email to reserve →</a>
  </div>
  <div class="ptier t-pro">
    <div class="ptier-name">Pro</div>
    <div class="ptier-price"><span class="p-m">$99<i class="u">/ mo</i></span><span class="p-y">$990<i class="u">/ yr</i></span></div>
    <div class="ptier-tag"><span class="p-m">For professionals · data autonomy</span><span class="p-y">≈ $82.5 / mo · annual = 10 months' price</span></div>
    <ul class="ptier-list">
      <li>Everything in Standard</li>
      <li>CSV / data export + full-history downloads</li>
      <li>Email notice when a reading crosses your threshold</li>
      <li>API (later)</li>
    </ul>
    <div class="ptier-soon">Opens 3–6 months after Standard launches</div>
  </div>
</div>
<p><strong>The numbers are everywhere, free forever.</strong> The archive earns its keep on every selloff that comes after — that morning, you are already holding a reading whose method has not changed in fifteen years.</p>
<p class="pricing-inst"><strong>Institutional / data licensing</strong> (series licensing, index licensing, redistribution) — <a href="#contact">contact us</a>; unpriced.</p>
<p>Annual = 10 months' price ($290 / $990) · 14-day no-questions refund, no trial (the free tier is the trial) · cancel anytime via the manage link in your subscription email. Orders and payments are handled by a Merchant of Record, whose name will appear on your statement. <strong>Data and information only; not investment advice; no buy or sell recommendations.</strong></p>
<p class="doc-fineprint">Pro and API are later plans, not a final commitment; launch dates TBD.</p>` },
    },
  };

  function docPage(id) {
    const p = document.getElementById("panel-" + id);
    return p && p.querySelector(".doc-page");
  }
  const origin = {};
  IDS.forEach((id) => { const el = docPage(id); if (el) origin[id] = el.innerHTML; }); // 缓存简体原文

  function build(tr) {
    return `<div class="hero"><div class="kicker">${tr.kicker}</div><h1>${tr.h1}</h1><p class="dek">${tr.dek}</p></div>` +
      `<div class="doc-body">${tr.body}</div>`;
  }
  function apply(lang) {
    IDS.forEach((id) => {
      const el = docPage(id);
      if (!el) return;
      const tr = DOC_TR[id] && DOC_TR[id][lang];
      // en/fr/de/es → 整段译文；zh/tw → 还原简体原文（繁体交给 MutationObserver 的 opencc 转换）
      el.innerHTML = tr ? build(tr) : origin[id];
    });
  }

  const cur = (window.MC_I18N && window.MC_I18N.lang && window.MC_I18N.lang()) || "zh";
  apply(cur);
  if (window.MC_I18N && window.MC_I18N.onChange) window.MC_I18N.onChange(apply);
})();
