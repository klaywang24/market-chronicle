/* 多语言：简体为源语言。繁体 = OpenCC 运行时转换（全覆盖）；
   EN/FR/DE/ES = 字典查表（界面骨架；图表内部文字与含动态数字的长句暂保留中文）。 */
(function () {
  "use strict";

  // 词条格式："简体原文": [EN, FR, DE, ES]
  const D = {
    // ---- 页脚 ----
    "每个交易日自动更新的美股百年图表档案与信号台账 · 免费 · 代码公开": ["A self-updating archive of a century of US market charts, plus a public signal ledger · free · source-available", "", "", ""],
    "关于": ["About", "À propos", "Über", "Acerca de"],
    "联系": ["Contact", "Contact", "Kontakt", "Contacto"],
    "定价": ["Pricing", "Tarifs", "Preise", "Precios"],
    "隐私政策": ["Privacy", "Confidentialité", "Datenschutz", "Privacidad"],
    "服务条款": ["Terms", "Conditions", "AGB", "Términos"],
    "退款政策": ["Refunds", "Remboursements", "Erstattungen", "Reembolsos"],
    "数据源：": ["Data sources: ", "Sources : ", "Datenquellen: ", "Fuentes: "],
    "仅供信息与教育用途，不构成投资建议": ["For information and education only; not investment advice", "À titre d'information et d'éducation uniquement ; pas un conseil en investissement", "Nur zur Information und Bildung; keine Anlageberatung", "Solo con fines informativos y educativos; no es asesoramiento de inversión"],
    "数据更新于": ["Data updated", "Données au", "Daten aktualisiert", "Datos actualizados"],
    "方法论": ["Methodology", "Méthodologie", "Methodik", "Metodología"],
    // ---- 头版 · 信号台账 ----
    "信号台账 · 逐次公开对账": ["The Signal Ledger · every entry reconciled in public", "", "", ""],
    "两个原创指标，一本逐日自动记的账——赢的和输的都在账上。读数由数据管线每个交易日自动提交，带 GitHub 时间戳，事后不可改写。": ["Two original indicators, one ledger written automatically every trading day — wins and losses alike. Each reading is committed by the pipeline with a GitHub timestamp; nothing can be rewritten after the fact.", "", "", ""],
    "CNN 恐贪 ÷ VIX": ["CNN Fear & Greed ÷ VIX", "", "", ""],
    "恐贪 < 25 · 极端恐惧": ["Fear & Greed < 25 · extreme fear", "", "", ""],
    "触发中": ["Triggered", "", "", ""],
    "未触发": ["Not triggered", "", "", ""],
    "（K < 1 触发）": ["(triggers at K < 1)", "", "", ""],
    "（恐贪 < 25 开启）": ["(opens below 25)", "", "", ""],
    "窗口开启": ["Window open", "", "", ""],
    "窗口关闭": ["Window closed", "", "", ""],
    "次信号（2020 年起）": ["signals since 2020", "", "", ""],
    "次窗口（2011 年起）": ["windows since 2011", "", "", ""],
    "60 个交易日后": ["60 trading days on:", "", "", ""],
    "12 个月后": ["12 months on:", "", "", ""],
    "涨": ["up", "", "", ""],
    "跌": ["down", "", "", ""],
    "最近战报": ["Latest entries", "", "", ""],
    "按信号首日纳指 100 收盘价计": ["returns from the Nasdaq-100 close on day one", "", "", ""],
    "完整对账表见 K 指数与 LEAPS 窗口两页": ["Full ledgers on the K-Index and LEAPS Window pages", "", "", ""],
    "十五年，每一次入场都标在这条线上": ["Fifteen years — every entry marked on this line", "", "", ""],
    "纳指 100（对数坐标）· 圆点 = LEAPS 窗口开启（2011 年起）· 菱形 = K < 1 信号（2020 年起）· 点任意标记看当次结果": ["Nasdaq-100 (log scale) · dots = LEAPS windows since 2011 · diamonds = K < 1 signals since 2020 · tap any marker for its outcome", "", "", ""],
    "如果每次窗口都跟，这本账长这样": ["If you had followed every window, the ledger reads like this", "", "", ""],
    "窗口首日买入纳指 100、持有 12 个月，持有期内新窗口跳过；虚线为同期一直持有": ["Buy the Nasdaq-100 at each window's first close, hold 12 months, skip windows inside a holding period; dashed = buy and hold", "", "", ""],
    "示意口径：信号首日按收盘价入场，空仓期收益记零，不计成本与滑点。本站不宣称信号能跑赢买入持有——右图如实呈现了这一点；台账的价值在于告诉你「现在处于历史的哪个位置」。完整口径与如实披露见方法论。历史表现不预示未来，不构成投资建议。": ["Illustrative rules: enter at the close on a signal's first day; cash periods earn zero; no costs or slippage. This site does not claim the signals beat buy-and-hold — the right-hand chart shows exactly that. The ledger's value is telling you where today stands in history. Full rules and honest disclosure in the Methodology. Past performance does not predict future results; not investment advice.", "", "", ""],
    "盘前信号简报 · 创始价预约": ["Pre-market signal brief · reserve the founding price", "", "", ""],
    "方法论全文": ["Full methodology", "", "", ""],
    "每周一封：台账读数与信号战报（免费）": ["One email a week: ledger readings & signal reports (free)", "", "", ""],
    "订阅": ["Subscribe", "", "", ""],
    "信号触发日加发一封。随时退订，不发广告。": ["An extra issue on signal days. Unsubscribe anytime; no ads.", "", "", ""],
    "在 GitHub 验证台账": ["Verify the ledger on GitHub", "", "", ""],
    "LEAPS 窗口开启": ["LEAPS window opens", "", "", ""],
    "K < 1 信号": ["K < 1 signal", "", "", ""],
    "每次窗口都跟（持有 12 个月）": ["Follow every window (12-month hold)", "", "", ""],
    "一直持有纳指 100": ["Buy & hold Nasdaq-100", "", "", ""],
    // ---- 顶栏 tab ----
    "标普 500": ["S&P 500", "S&P 500", "S&P 500", "S&P 500"],
    "纳斯达克": ["Nasdaq", "Nasdaq", "Nasdaq", "Nasdaq"],
    "科技": ["Technology", "Technologie", "Technologie", "Tecnología"],
    "金融": ["Financials", "Finance", "Finanzen", "Finanzas"],
    "消费": ["Consumer", "Consommation", "Konsum", "Consumo"],
    "奢侈品": ["Luxury", "Luxe", "Luxus", "Lujo"],
    "K 指数": ["K-Index", "Indice K", "K-Index", "Índice K"],
    "LEAPS 窗口": ["LEAPS Window", "Fenêtre LEAPS", "LEAPS-Fenster", "Ventana LEAPS"],
    "行情": ["Quotes", "Cours", "Kurse", "Cotización"],
    "指数 ETF": ["Index ETFs", "ETF indiciels", "Index-ETFs", "ETF de índice"],
    "行情图表暂时加载不出来": ["Live chart can't load right now", "", "", ""],
    "图表由 TradingView 提供，当前网络连不上它的服务器（中国大陆地区需要国际网络）。站内其他板块的历史数据不受影响，可正常浏览。": [
      "Charts are served by TradingView, which is unreachable on the current network (mainland China requires an international connection). All other sections of this site work normally.", "", "", ""],
    "重试": ["Retry", "", "", ""],
    "宏观": ["Macro", "Macro", "Makro", "Macro"],
    "纳指 100": ["Nasdaq-100", "Nasdaq-100", "Nasdaq-100", "Nasdaq-100"],
    "纳指综指": ["Nasdaq Composite", "Nasdaq Composite", "Nasdaq Composite", "Nasdaq Composite"],
    "XLF 金融": ["XLF Financials", "XLF Finance", "XLF Finanzen", "XLF Finanzas"],
    "XLK 科技": ["XLK Technology", "XLK Technologie", "XLK Technologie", "XLK Tecnología"],
    "XLP 必需消费": ["XLP Staples", "XLP conso. de base", "XLP Basiskonsum", "XLP básico"],
    "XLY 可选消费": ["XLY Discretionary", "XLY conso. cyclique", "XLY Zyklisch", "XLY discrecional"],
    "宏观：市场的水位": ["Macro: The Market's Water Level", "Macro : le niveau d'eau du marché", "Makro: Der Wasserstand des Marktes", "Macro: el nivel del agua del mercado"],
    "资金面、信用、物价与增长——指数涨跌的四个上游变量，全部来自圣路易斯联储 FRED，随每日更新刷新。": [
      "Capital, credit, prices and growth — four upstream variables of the index, all from the St. Louis Fed's FRED, refreshed daily.",
      "Capitaux, crédit, prix et croissance — quatre variables amont de l'indice, via FRED, actualisées chaque jour.",
      "Kapital, Kredit, Preise und Wachstum — vier vorgelagerte Variablen des Index, alle aus FRED, täglich aktualisiert.",
      "Capital, crédito, precios y crecimiento: cuatro variables aguas arriba del índice, todas de FRED, actualizadas a diario."],
    "资金面 · CAPITAL": ["Capital · Liquidity", "Capitaux · liquidité", "Kapital · Liquidität", "Capital · liquidez"],
    "信用 · CREDIT": ["Credit", "Crédit", "Kredit", "Crédito"],
    "物价 · PRICES": ["Prices", "Prix", "Preise", "Precios"],
    "增长与就业 · GROWTH": ["Growth & Jobs", "Croissance & emploi", "Wachstum & Arbeitsmarkt", "Crecimiento y empleo"],
    "隔夜利率：SOFR × EFFR × 联邦基金目标上限": ["Overnight rates: SOFR × EFFR × Fed funds target", "Taux au jour le jour : SOFR × EFFR × cible Fed", "Tagesgeldsätze: SOFR × EFFR × Fed-Zielband", "Tipos a un día: SOFR × EFFR × objetivo Fed"],
    "隔夜逆回购用量（ON RRP · 十亿美元）": ["Overnight reverse repo (ON RRP, $bn)", "Prise en pension (ON RRP, Md$)", "Reverse Repo (ON RRP, Mrd. $)", "Repo inverso (ON RRP, $mm)"],
    "Fed 资产负债表（WALCL · 万亿美元）": ["Fed balance sheet (WALCL, $tn)", "Bilan de la Fed (Bn$)", "Fed-Bilanz (Bio. $)", "Balance de la Fed ($bn)"],
    "国债收益率：2Y × 10Y × 20Y × 30Y": ["Treasury yields: 2Y × 10Y × 20Y × 30Y", "Rendements des Treasuries", "Treasury-Renditen", "Rendimientos del Tesoro"],
    "期限利差：10Y − 2Y": ["Term spread: 10Y − 2Y", "Écart de terme : 10A − 2A", "Laufzeitspread: 10J − 2J", "Diferencial de plazos: 10A − 2A"],
    "信用利差：高收益 × 投资级 OAS": ["Credit spreads: HY × IG OAS", "Spreads de crédit : HY × IG", "Kreditspreads: HY × IG OAS", "Diferenciales de crédito: HY × IG"],
    "通胀同比：CPI × 核心 PCE × PPI": ["Inflation YoY: CPI × core PCE × PPI", "Inflation a/a : CPI × PCE core × PPI", "Inflation ggü. Vorjahr: CPI × Kern-PCE × PPI", "Inflación interanual: CPI × PCE núcleo × PPI"],
    "实际 GDP 环比年化": ["Real GDP, QoQ annualized", "PIB réel, t/t annualisé", "Reales BIP, annualisiert", "PIB real, anualizado"],
    "非农新增就业（千人/月）× 失业率": ["Nonfarm payrolls (k/month) × unemployment", "Emplois non agricoles × chômage", "Beschäftigung (Tsd./Monat) × Arbeitslosenquote", "Nóminas no agrícolas × desempleo"],
    "企业利润同比（季频）": ["Corporate profits YoY (quarterly)", "Profits des entreprises a/a", "Unternehmensgewinne ggü. Vorjahr", "Beneficios empresariales interanuales"],

    // ---- Hero ----
    "标普 500：一个世纪的形状": ["S&P 500: The Shape of a Century", "S&P 500 : la forme d'un siècle", "S&P 500: Die Form eines Jahrhunderts", "S&P 500: la forma de un siglo"],
    "价格、回报、分布、周期、回撤、估值、盈利与结构——把近百年的标普 500 放进一部章节式编年史。": [
      "Price, returns, distributions, cycles, drawdowns, valuation, earnings and structure — a century of the S&P 500 in chapters.",
      "Prix, rendements, distributions, cycles, replis, valorisation, bénéfices et structure — un siècle de S&P 500 en chapitres.",
      "Preis, Renditen, Verteilungen, Zyklen, Drawdowns, Bewertung, Gewinne und Struktur — ein Jahrhundert S&P 500 in Kapiteln.",
      "Precio, rendimientos, distribuciones, ciclos, caídas, valoración, beneficios y estructura: un siglo del S&P 500 en capítulos."],
    "纳斯达克：成长与代价": ["Nasdaq: Growth and Its Price", "Nasdaq : la croissance et son prix", "Nasdaq: Wachstum und sein Preis", "Nasdaq: el crecimiento y su precio"],
    "纳指综指（1971→）与纳指 100（1985→）：更陡的复利，更深的回撤。": [
      "Composite (1971→) and Nasdaq-100 (1985→): steeper compounding, deeper drawdowns.",
      "Composite (1971→) et Nasdaq-100 (1985→) : capitalisation plus raide, replis plus profonds.",
      "Composite (1971→) und Nasdaq-100 (1985→): steilerer Zinseszins, tiefere Drawdowns.",
      "Composite (1971→) y Nasdaq-100 (1985→): capitalización más pronunciada, caídas más profundas."],
    "科技：增长的引擎": ["Technology: The Engine of Growth", "Technologie : le moteur de la croissance", "Technologie: Der Motor des Wachstums", "Tecnología: el motor del crecimiento"],
    "七姐妹加博通与台积电——扛起纳指的九只巨头。先看板块的锚 QQQ，再点个股名徐徐展开各自的历史。": [
      "The Magnificent Seven plus Broadcom and TSMC — nine giants that carry the Nasdaq. Start with QQQ, then click any name to unfold its history.",
      "Les Sept Magnifiques plus Broadcom et TSMC — neuf géants qui portent le Nasdaq. Commencez par QQQ, puis cliquez sur un titre.",
      "Die Glorreichen Sieben plus Broadcom und TSMC — neun Giganten, die den Nasdaq tragen. Erst QQQ, dann per Klick jede Aktie im Detail.",
      "Los Siete Magníficos más Broadcom y TSMC: nueve gigantes que sostienen el Nasdaq. Empiece por QQQ y pulse cada valor para ver su historia."],
    "纳斯达克 100 至今，科技巨头共同走过了什么？": ["Since inception, what has the Nasdaq 100 lived through?", "Depuis sa création, qu'a traversé le Nasdaq 100 ?", "Was hat der Nasdaq 100 seit Auflegung durchlebt?", "Desde su origen, ¿qué ha vivido el Nasdaq 100?"],
    "QQQ 走势（月线 · 对数坐标）": ["QQQ (monthly · log scale)", "QQQ (mensuel · échelle log)", "QQQ (monatlich · log)", "QQQ (mensual · escala log)"],
    "QQQ 年度回报": ["QQQ annual returns", "QQQ — rendements annuels", "QQQ Jahresrenditen", "QQQ rendimientos anuales"],
    "QQQ 回撤曲线": ["QQQ drawdown curve", "QQQ — courbe de drawdown", "QQQ Drawdown-Kurve", "QQQ curva de caídas"],
    "QQQ 总览": ["QQQ Overview", "Vue QQQ", "QQQ Übersicht", "Resumen QQQ"],
    "QQQ 纳指 100": ["QQQ Nasdaq 100", "QQQ Nasdaq 100", "QQQ Nasdaq 100", "QQQ Nasdaq 100"],
    "九只成员自最晚上市者同一起跑线（Meta 2012 上市）；墨色粗线为等权组合。": [
      "All nine from the same start line, set by the latest IPO (Meta, 2012); the bold ink line is the equal-weight portfolio.",
      "Les neuf depuis la même ligne de départ, fixée par la dernière IPO (Meta, 2012) ; la ligne épaisse est le portefeuille équipondéré.",
      "Alle neun ab derselben Startlinie, bestimmt vom jüngsten IPO (Meta, 2012); die fette Linie ist das gleichgewichtete Portfolio.",
      "Los nueve desde la misma línea de salida, fijada por la última IPO (Meta, 2012); la línea gruesa es la cartera equiponderada."],
    "金融：钱的生意": ["Financials: The Business of Money", "Finance : le commerce de l'argent", "Finanzen: Das Geschäft mit dem Geld", "Finanzas: el negocio del dinero"],
    "银行、卡组织、投行、资管、券商、保险与加密/稳定币，十四只龙头。先看板块的锚 XLF，再点个股名徐徐展开各自的历史。": [
      "Banks, card networks, investment banks, asset managers, brokers, insurance and crypto — 14 leaders. Start with XLF, then click any name to unfold its history.",
      "Banques, réseaux de cartes, banques d'affaires, gérants d'actifs, courtiers, assurance et crypto — 14 leaders. Commencez par XLF, puis cliquez sur un titre.",
      "Banken, Kartennetzwerke, Investmentbanken, Vermögensverwalter, Broker, Versicherung und Krypto — 14 Marktführer. Erst XLF, dann per Klick jede Aktie im Detail.",
      "Bancos, redes de tarjetas, banca de inversión, gestoras, brokers, seguros y cripto: 14 líderes. Empiece por XLF y pulse cada valor para ver su historia."],
    "消费：慢变量的复利": ["Consumer: Compounding the Slow Variables", "Consommation : la capitalisation des variables lentes", "Konsum: Der Zinseszins der langsamen Variablen", "Consumo: el interés compuesto de las variables lentas"],
    "可乐、超市、仓储会员店、建材、折扣零售与快餐——六只穿越周期的消费龙头，锚定 XLP 与 XLY 双 ETF。": [
      "Coke, supermarkets, warehouse clubs, home improvement, off-price retail and fast food — six cycle-proof leaders, anchored by XLP and XLY.",
      "Coca, supermarchés, clubs-entrepôts, bricolage, déstockage et fast-food — six leaders anticycliques, ancrés sur XLP et XLY.",
      "Cola, Supermärkte, Warehouse-Clubs, Baumärkte, Off-Price und Fast Food — sechs zyklusfeste Marktführer, verankert an XLP und XLY.",
      "Coca-Cola, supermercados, clubes mayoristas, bricolaje, retail de descuento y comida rápida: seis líderes a prueba de ciclos, anclados a XLP y XLY."],
    "奢侈品：定价权的溢价": ["Luxury: The Premium of Pricing Power", "Luxe : la prime du pouvoir de fixation des prix", "Luxus: Die Prämie der Preissetzungsmacht", "Lujo: la prima del poder de fijación de precios"],
    "LVMH、爱马仕、法拉利——三只对定价权的信仰（起点 2015-10，法拉利上市；欧股按欧元计价）。": [
      "LVMH, Hermès, Ferrari — three bets on pricing power (from Oct 2015, Ferrari's IPO; EU names in EUR).",
      "LVMH, Hermès, Ferrari — trois paris sur le pricing power (depuis oct. 2015 ; valeurs européennes en EUR).",
      "LVMH, Hermès, Ferrari — drei Wetten auf Preissetzungsmacht (ab Okt. 2015; EU-Werte in EUR).",
      "LVMH, Hermès, Ferrari: tres apuestas por el poder de precios (desde oct. 2015; valores europeos en EUR)."],
    "金风玉露一相逢": ["When Fear Meets Volatility", "Quand la peur rencontre la volatilité", "Wenn Angst auf Volatilität trifft", "Cuando el miedo se encuentra con la volatilidad"],
    "LEAPS 窗口：恐惧的定价": ["LEAPS Window: Pricing Fear", "Fenêtre LEAPS : le prix de la peur", "LEAPS-Fenster: Der Preis der Angst", "Ventana LEAPS: el precio del miedo"],

    // ---- 章节标题 ----
    "头版 · 世纪尺度": ["Front Page · Century Scale", "Une · échelle du siècle", "Titelseite · Jahrhundertmaßstab", "Portada · escala secular"],
    "年度结账": ["Annual Ledger", "Bilan annuel", "Jahresabrechnung", "Cierre anual"],
    "入场与离场": ["Entry and Exit", "Entrée et sortie", "Ein- und Ausstieg", "Entrada y salida"],
    "滚动年化": ["Rolling Returns", "Rendements glissants", "Rollierende Renditen", "Rentabilidades móviles"],
    "周期换挡": ["Cycle Shifts", "Changements de cycle", "Zykluswechsel", "Cambios de ciclo"],
    "左尾放大镜": ["The Left-Tail Lens", "La loupe de la queue gauche", "Die Lupe auf den linken Rand", "La lupa de la cola izquierda"],
    "回撤谱系": ["Drawdown Genealogy", "Généalogie des replis", "Drawdown-Genealogie", "Genealogía de las caídas"],
    "估值的两条曲线": ["Two Curves of Valuation", "Deux courbes de valorisation", "Zwei Bewertungskurven", "Dos curvas de valoración"],
    "估值的弹性": ["Valuation Elasticity", "Élasticité de la valorisation", "Bewertungselastizität", "Elasticidad de la valoración"],
    "利润基本面": ["Earnings Fundamentals", "Fondamentaux des bénéfices", "Gewinnfundamentaldaten", "Fundamentales de beneficios"],
    "恐惧的标价": ["The Price of Fear", "Le prix de la peur", "Der Preis der Angst", "El precio del miedo"],
    "月度季节性": ["Monthly Seasonality", "Saisonnalité mensuelle", "Monatliche Saisonalität", "Estacionalidad mensual"],
    "行业结构": ["Sector Structure", "Structure sectorielle", "Sektorstruktur", "Estructura sectorial"],
    "五百家一览": ["All Five Hundred", "Les cinq cents", "Alle fünfhundert", "Las quinientas"],
    "综指历程": ["The Composite's Journey", "Le parcours du Composite", "Der Weg des Composite", "El camino del Composite"],
    "回撤解剖": ["Drawdown Anatomy", "Anatomie des replis", "Drawdown-Anatomie", "Anatomía de las caídas"],
    "纳指恐慌": ["Nasdaq Panic", "Panique Nasdaq", "Nasdaq-Panik", "Pánico Nasdaq"],
    "纳指百家": ["The Nasdaq Hundred", "Les cent du Nasdaq", "Die Nasdaq-Hundert", "Los cien del Nasdaq"],
    "板块的锚：QQQ": ["The Sector Anchor: QQQ", "L'ancre sectorielle : QQQ", "Der Sektoranker: QQQ", "El ancla sectorial: QQQ"],
    "板块的锚：XLF": ["The Sector Anchor: XLF", "L'ancre sectorielle : XLF", "Der Sektoranker: XLF", "El ancla sectorial: XLF"],
    "板块的锚：XLP × XLY": ["The Sector Anchors: XLP × XLY", "Les ancres : XLP × XLY", "Die Sektoranker: XLP × XLY", "Las anclas: XLP × XLY"],
    "成长的对照": ["Growth, Compared", "Croissances comparées", "Wachstum im Vergleich", "Crecimiento comparado"],
    "组合的脾气": ["The Basket's Temperament", "Le tempérament du panier", "Das Temperament des Korbs", "El temperamento de la cesta"],
    "信号面板": ["Signal Panel", "Panneau de signal", "Signaltafel", "Panel de señales"],
    "逐次对账": ["Signal-by-Signal Audit", "Audit signal par signal", "Signal-für-Signal-Prüfung", "Auditoría señal a señal"],
    "窗口面板": ["Window Panel", "Panneau de fenêtre", "Fenstertafel", "Panel de ventana"],
    "窗口对账": ["Window Audit", "Audit des fenêtres", "Fensterprüfung", "Auditoría de ventanas"],
    "上市以来": ["Since Listing", "Depuis l'introduction", "Seit Börsengang", "Desde la salida a bolsa"],
    "回报的形状": ["The Shape of Returns", "La forme des rendements", "Die Form der Renditen", "La forma de los rendimientos"],
    "危机的节奏": ["The Rhythm of Crises", "Le rythme des crises", "Der Rhythmus der Krisen", "El ritmo de las crisis"],
    "时间的纹理": ["The Texture of Time", "La texture du temps", "Die Textur der Zeit", "La textura del tiempo"],
    "关键指标仪表盘": ["Key Metrics Dashboard", "Tableau de bord des indicateurs", "Kennzahlen-Dashboard", "Panel de métricas clave"],
    "资本效率": ["Capital Efficiency", "Efficacité du capital", "Kapitaleffizienz", "Eficiencia del capital"],
    "估值的锚": ["The Valuation Anchor", "L'ancre de valorisation", "Der Bewertungsanker", "El ancla de valoración"],
    "估值驱动 vs EPS 驱动": ["Multiple-Driven vs EPS-Driven", "Multiple vs BPA", "Multiple- vs. EPS-getrieben", "Múltiplo vs BPA"],
    "股东回报": ["Shareholder Returns", "Retour à l'actionnaire", "Aktionärsrendite", "Retorno al accionista"],
    "同业对比": ["Peer Comparison", "Comparaison sectorielle", "Peer-Vergleich", "Comparación entre pares"],
    "时间的复利": ["The Compounding of Time", "La capitalisation du temps", "Der Zinseszins der Zeit", "El interés compuesto del tiempo"],

    // ---- 常用卡片标题 ----
    "百年走势（月线 · 对数坐标）": ["A century of prices (monthly, log scale)", "Un siècle de cours (mensuel, log)", "Ein Jahrhundert Kurse (monatlich, log)", "Un siglo de precios (mensual, log)"],
    "年度回报": ["Annual returns", "Rendements annuels", "Jahresrenditen", "Rendimientos anuales"],
    "收益分布": ["Return distribution", "Distribution des rendements", "Renditeverteilung", "Distribución de rendimientos"],
    "持有期胜率": ["Holding-period win rate", "Taux de gain par durée", "Gewinnquote je Haltedauer", "Tasa de acierto por plazo"],
    "持有期年化分位": ["Holding-period annualized quantiles", "Quantiles annualisés", "Annualisierte Quantile", "Cuantiles anualizados"],
    "滚动 5 / 10 / 20 年年化回报": ["Rolling 5/10/20-year annualized returns", "Rendements glissants 5/10/20 ans", "Rollierende 5/10/20-Jahres-Renditen", "Rentabilidades móviles a 5/10/20 años"],
    "历史回撤曲线": ["Historical drawdown curve", "Courbe historique des replis", "Historische Drawdown-Kurve", "Curva histórica de caídas"],
    "深度回撤一览（≥10%）": ["Deep drawdowns (≥10%)", "Replis profonds (≥10 %)", "Tiefe Drawdowns (≥10 %)", "Caídas profundas (≥10 %)"],
    "年内最大回撤 vs 全年收益": ["Intra-year max drawdown vs annual return", "Repli intra-annuel vs rendement annuel", "Unterjähriger Drawdown vs. Jahresrendite", "Caída intraanual vs rendimiento anual"],
    "席勒 CAPE（1871 年至今）": ["Shiller CAPE (since 1871)", "CAPE de Shiller (depuis 1871)", "Shiller-CAPE (seit 1871)", "CAPE de Shiller (desde 1871)"],
    "PE（TTM，1871 年至今）": ["P/E, TTM (since 1871)", "PER (depuis 1871)", "KGV (seit 1871)", "PER (desde 1871)"],
    "PE（TTM）与三条历史中位数": ["P/E (TTM) and three historical medians", "PER et trois médianes historiques", "KGV und drei historische Mediane", "PER y tres medianas históricas"],
    "标普 500 EPS（TTM · 对数坐标）": ["S&P 500 EPS (TTM, log scale)", "BPA du S&P 500 (log)", "S&P-500-EPS (log)", "BPA del S&P 500 (log)"],
    "VIX · 保险费的账本": ["VIX · The Insurance Ledger", "VIX · le registre des primes", "VIX · das Prämienbuch", "VIX · el libro de primas"],
    "VXN · 纳指的保险费": ["VXN · Nasdaq's insurance premium", "VXN · la prime du Nasdaq", "VXN · die Nasdaq-Prämie", "VXN · la prima del Nasdaq"],
    "各月平均涨跌与上涨概率": ["Average monthly return and win rate", "Rendement mensuel moyen et taux de hausse", "Monatsrendite und Gewinnquote", "Rendimiento mensual medio y probabilidad de subida"],
    "GICS 行业分布（按家数）": ["GICS sector breakdown (by count)", "Répartition GICS (par nombre)", "GICS-Sektoren (nach Anzahl)", "Sectores GICS (por número)"],
    "归一化成长曲线（起点 = 100 · 对数坐标 · 周线）": ["Normalized growth (start = 100, log, weekly)", "Croissance normalisée (base 100, log)", "Normiertes Wachstum (Start = 100, log)", "Crecimiento normalizado (base 100, log)"],
    "个股对照": ["Stock comparison table", "Tableau comparatif", "Vergleichstabelle", "Tabla comparativa"],
    "等权组合年度回报": ["Equal-weight basket: annual returns", "Panier équipondéré : rendements annuels", "Gleichgewichteter Korb: Jahresrenditen", "Cesta equiponderada: rendimientos anuales"],
    "等权组合回撤曲线": ["Equal-weight basket: drawdowns", "Panier équipondéré : replis", "Gleichgewichteter Korb: Drawdowns", "Cesta equiponderada: caídas"],
    "走势（月线 · 对数坐标 · 复权价）": ["Price history (monthly, log, adjusted)", "Historique (mensuel, log, ajusté)", "Kursverlauf (monatlich, log, bereinigt)", "Histórico (mensual, log, ajustado)"],
    "EPS（TTM · 季频）": ["EPS (TTM, quarterly)", "BPA (TTM, trimestriel)", "EPS (TTM, vierteljährlich)", "BPA (TTM, trimestral)"],
    "营业收入（近四财年 · 十亿美元）": ["Revenue (last 4 FY, $bn)", "Chiffre d'affaires (4 ex., Md$)", "Umsatz (4 GJ, Mrd. $)", "Ingresos (4 ej., $mm)"],
    "净利润（近四财年 · 十亿美元）": ["Net income (last 4 FY, $bn)", "Résultat net (4 ex., Md$)", "Nettogewinn (4 GJ, Mrd. $)", "Beneficio neto (4 ej., $mm)"],
    "ROE × ROIC（TTM）": ["ROE × ROIC (TTM)", "ROE × ROIC (TTM)", "ROE × ROIC (TTM)", "ROE × ROIC (TTM)"],
    "自由现金流（年度 · 十亿美元）": ["Free cash flow (annual, $bn)", "Flux de trésorerie libre (Md$)", "Freier Cashflow (Mrd. $)", "Flujo de caja libre ($mm)"],
    "PE（TTM · 含历史中位数）": ["P/E (TTM, with historical median)", "PER (avec médiane historique)", "KGV (mit historischem Median)", "PER (con mediana histórica)"],
    "年度回报分解": ["Annual return decomposition", "Décomposition du rendement annuel", "Zerlegung der Jahresrendite", "Descomposición del rendimiento anual"],
    "每股分红（年度合计 · 各自币种）": ["Dividends per share (annual, local currency)", "Dividende par action (annuel)", "Dividende je Aktie (jährlich)", "Dividendo por acción (anual)"],
    "估值与质量 vs 同篮子": ["Valuation and quality vs the basket", "Valorisation et qualité vs panier", "Bewertung und Qualität vs. Korb", "Valoración y calidad vs la cesta"],

    // ---- 状态卡标签 ----
    "上市数据起点": ["Data since", "Données depuis", "Daten seit", "Datos desde"],
    "上市以来总回报": ["Total return since listing", "Rendement total", "Gesamtrendite", "Rentabilidad total"],
    "5 年年化": ["5y CAGR", "TCAC 5 ans", "5J-CAGR", "TCAC 5a"],
    "10 年年化": ["10y CAGR", "TCAC 10 ans", "10J-CAGR", "TCAC 10a"],
    "20 年年化": ["20y CAGR", "TCAC 20 ans", "20J-CAGR", "TCAC 20a"],
    "零线": ["Zero line", "Ligne zéro", "Nulllinie", "Línea cero"],
    "净利率 %": ["Net margin %", "Marge nette %", "Nettomarge %", "Margen neto %"],
    "Fed 资产负债表": ["Fed balance sheet", "Bilan de la Fed", "Fed-Bilanz", "Balance de la Fed"],
    "上市以来年化": ["CAGR since listing", "TCAC depuis l'intro", "CAGR seit Börsengang", "TCAC desde salida"],
    "历史最大回撤": ["Max drawdown", "Repli maximal", "Max. Drawdown", "Caída máxima"],
    "市值": ["Market cap", "Capitalisation", "Marktkapitalisierung", "Capitalización"],
    "远期 PE": ["Forward P/E", "PER prospectif", "Forward-KGV", "PER adelantado"],
    "毛利率": ["Gross margin", "Marge brute", "Bruttomarge", "Margen bruto"],
    "净利率": ["Net margin", "Marge nette", "Nettomarge", "Margen neto"],
    "股息率": ["Dividend yield", "Rendement du dividende", "Dividendenrendite", "Rentabilidad por dividendo"],
    "派息率": ["Payout ratio", "Taux de distribution", "Ausschüttungsquote", "Ratio de reparto"],
    "自由现金流": ["Free cash flow", "Flux de trésorerie libre", "Freier Cashflow", "Flujo de caja libre"],
    "当前 PE (TTM)": ["Current P/E (TTM)", "PER actuel (TTM)", "Aktuelles KGV (TTM)", "PER actual (TTM)"],
    "席勒 CAPE": ["Shiller CAPE", "CAPE de Shiller", "Shiller-CAPE", "CAPE de Shiller"],
    "远期 PE (SPY 口径)": ["Forward P/E (SPY)", "PER prospectif (SPY)", "Forward-KGV (SPY)", "PER adelantado (SPY)"],
    "三条中位数锚": ["Three median anchors", "Trois ancres médianes", "Drei Median-Anker", "Tres anclas medianas"],
    "历史中位数": ["Historical median", "Médiane historique", "Historischer Median", "Mediana histórica"],
    "相对中位溢价": ["Premium vs median", "Prime vs médiane", "Prämie vs. Median", "Prima vs mediana"],
    "开仓阈值": ["Entry threshold", "Seuil d'entrée", "Einstiegsschwelle", "Umbral de entrada"],
    "2011 年以来窗口": ["Windows since 2011", "Fenêtres depuis 2011", "Fenster seit 2011", "Ventanas desde 2011"],
    "最近一次窗口": ["Latest window", "Dernière fenêtre", "Letztes Fenster", "Última ventana"],
    "最近一次信号": ["Latest signal", "Dernier signal", "Letztes Signal", "Última señal"],
    "CNN 恐惧贪婪": ["CNN Fear & Greed", "CNN Fear & Greed", "CNN Fear & Greed", "CNN Fear & Greed"],

    // ---- 表头 ----
    "代码": ["Ticker", "Code", "Ticker", "Ticker"],
    "名称": ["Name", "Nom", "Name", "Nombre"],
    "公司": ["Company", "Société", "Unternehmen", "Empresa"],
    "至今": ["To date", "À ce jour", "Bis heute", "Hasta hoy"],
    "信号首日": ["Signal date", "Date du signal", "Signaldatum", "Fecha de señal"],
    "持续(日)": ["Days", "Jours", "Tage", "Días"],
    "最低 K": ["Min K", "K min", "Min. K", "K mín"],
    "峰值": ["Peak", "Sommet", "Hoch", "Máximo"],
    "谷底": ["Trough", "Creux", "Tief", "Mínimo"],
    "深度": ["Depth", "Ampleur", "Tiefe", "Profundidad"],
    "下跌(天)": ["Down (days)", "Baisse (j)", "Abstieg (T)", "Caída (d)"],
    "修复(天)": ["Recovery (days)", "Récupération (j)", "Erholung (T)", "Recuperación (d)"],
    "未修复": ["Not recovered", "Non récupéré", "Nicht erholt", "Sin recuperar"],
    "持有期": ["Holding period", "Durée", "Haltedauer", "Plazo"],
    "胜率": ["Win rate", "Taux de gain", "Gewinnquote", "Tasa de acierto"],
    "年化中位": ["Median CAGR", "TCAC médian", "Median-CAGR", "TCAC mediano"],
    "最差年化": ["Worst CAGR", "Pire TCAC", "Schlechteste CAGR", "Peor TCAC"],
    "最好年化": ["Best CAGR", "Meilleur TCAC", "Beste CAGR", "Mejor TCAC"],
    "样本": ["Samples", "Échantillons", "Stichproben", "Muestras"],
    "阶段": ["Phase", "Phase", "Phase", "Fase"],
    "起点": ["Start", "Début", "Beginn", "Inicio"],
    "终点": ["End", "Fin", "Ende", "Fin"],
    "涨跌": ["Change", "Variation", "Veränderung", "Variación"],
    "历时(天)": ["Duration (days)", "Durée (j)", "Dauer (T)", "Duración (d)"],
    "进行中": ["Ongoing", "En cours", "Laufend", "En curso"],
    "最差单日": ["Worst day", "Pire séance", "Schlechtester Tag", "Peor día"],
    "最好单日": ["Best day", "Meilleure séance", "Bester Tag", "Mejor día"],
    "跌幅": ["Loss", "Baisse", "Verlust", "Caída"],
    "涨幅": ["Gain", "Hausse", "Gewinn", "Subida"],
    "GICS 行业": ["GICS sector", "Secteur GICS", "GICS-Sektor", "Sector GICS"],
    "纳入日期": ["Date added", "Date d'ajout", "Aufnahmedatum", "Fecha de inclusión"],
    "窗口首日": ["Window start", "Début de fenêtre", "Fensterbeginn", "Inicio de ventana"],
    "最低恐贪": ["Min F&G", "F&G min", "Min. F&G", "F&G mín"],
    "1年": ["1y", "1 an", "1 J", "1a"],
    "3年年化": ["3y CAGR", "TCAC 3 ans", "3J-CAGR", "TCAC 3a"],
    "5年年化": ["5y CAGR", "TCAC 5 ans", "5J-CAGR", "TCAC 5a"],
    "10年年化": ["10y CAGR", "TCAC 10 ans", "10J-CAGR", "TCAC 10a"],
    "共同起点年化": ["CAGR from common start", "TCAC (départ commun)", "CAGR ab gem. Start", "TCAC desde inicio común"],
    "最大回撤": ["Max drawdown", "Repli max", "Max. Drawdown", "Caída máx"],

    // ---- 章节引言（chapter-q）----
    "拉长到一个世纪，回报长什么样？": ["Stretched over a century, what do returns look like?", "Sur un siècle, à quoi ressemblent les rendements ?", "Wie sehen Renditen über ein Jahrhundert aus?", "A escala de un siglo, ¿cómo son los rendimientos?"],
    "98 份年度成绩单，各落在哪个区间？": ["98 annual report cards — where did each land?", "98 bulletins annuels — où sont-ils tombés ?", "98 Jahreszeugnisse — wo landeten sie?", "98 boletines anuales: ¿dónde cayó cada uno?"],
    "随便挑一天入场，拿满 N 年赚钱的概率有多大？": ["Pick any day to enter — what are the odds after N years?", "Entrez n'importe quel jour — quelles chances après N ans ?", "Beliebiger Einstiegstag — wie stehen die Chancen nach N Jahren?", "Entre cualquier día: ¿qué probabilidad tras N años?"],
    "5 年、10 年、20 年为期，复利何时让人失望过？": ["Over 5, 10, 20 years — when did compounding disappoint?", "Sur 5, 10, 20 ans — quand la capitalisation a-t-elle déçu ?", "Über 5, 10, 20 Jahre — wann enttäuschte der Zinseszins?", "A 5, 10 y 20 años, ¿cuándo decepcionó el interés compuesto?"],
    "牛市走多久，熊市跌多深？": ["How long do bulls run, how deep do bears bite?", "Combien durent les hausses, jusqu'où mordent les baisses ?", "Wie lange laufen Bullen, wie tief beißen Bären?", "¿Cuánto dura el alcista y cuánto muerde el bajista?"],
    "最坏的单日有多坏？": ["How bad is the worst single day?", "À quel point la pire séance est-elle mauvaise ?", "Wie schlimm ist der schlimmste Tag?", "¿Qué tan malo es el peor día?"],
    "跌下去要多深，爬回来要多久？": ["How deep is the fall, how long the climb back?", "Quelle profondeur, quelle remontée ?", "Wie tief der Fall, wie lang der Aufstieg?", "¿Qué tan honda la caída y cuánto tarda la vuelta?"],
    "现在贵不贵？和 1929、2000 比呢？": ["Expensive today? Compared with 1929 and 2000?", "Cher aujourd'hui ? Et face à 1929, 2000 ?", "Teuer heute? Verglichen mit 1929 und 2000?", "¿Caro hoy? ¿Y frente a 1929 y 2000?"],
    "当前估值站在 150 年历史的什么位置？": ["Where does today's valuation sit in 150 years of history?", "Où se situe la valorisation dans 150 ans d'histoire ?", "Wo steht die Bewertung in 150 Jahren Geschichte?", "¿Dónde se sitúa la valoración en 150 años?"],
    "指数背后，每股盈利涨了多少？": ["Behind the index, how much did EPS grow?", "Derrière l'indice, de combien le BPA a-t-il crû ?", "Wie stark wuchs das EPS hinter dem Index?", "Detrás del índice, ¿cuánto creció el BPA?"],
    "市场什么时候在发抖？": ["When does the market tremble?", "Quand le marché tremble-t-il ?", "Wann zittert der Markt?", "¿Cuándo tiembla el mercado?"],
    "哪个月份最顺，哪个月最凶？": ["Which month is kindest, which cruelest?", "Quel mois est le plus doux, le plus cruel ?", "Welcher Monat ist am mildesten, welcher am härtesten?", "¿Qué mes es el más amable y cuál el más cruel?"],
    "五百家公司分布在哪些行业？": ["How are five hundred companies spread across sectors?", "Comment les cinq cents se répartissent-elles ?", "Wie verteilen sich fünfhundert Unternehmen?", "¿Cómo se reparten quinientas empresas?"],
    "名单本身就是一部行业史。": ["The list itself is an industrial history.", "La liste est une histoire industrielle.", "Die Liste selbst ist Industriegeschichte.", "La lista es en sí una historia industrial."],
    "半个世纪的成长股复利曲线。": ["Half a century of growth-stock compounding.", "Un demi-siècle de capitalisation des valeurs de croissance.", "Ein halbes Jahrhundert Wachstums-Zinseszins.", "Medio siglo de capitalización growth."],
    "四十年成绩单，波动比标普大多少？": ["Forty years of report cards — how much wilder than the S&P?", "Quarante ans de bulletins — combien plus volatil ?", "Vierzig Jahre Zeugnisse — wie viel wilder als der S&P?", "Cuarenta años de boletines: ¿cuánto más volátil?"],
    "纳指 100 拿满 N 年，赚钱概率多大？": ["Hold the NDX for N years — what are the odds?", "Tenir le NDX N ans — quelles chances ?", "NDX N Jahre halten — wie stehen die Chancen?", "Mantener el NDX N años: ¿qué probabilidad?"],
    "dotcom 之后，10 年年化曾经归零。": ["After dotcom, 10-year returns once hit zero.", "Après la bulle Internet, le rendement à 10 ans est tombé à zéro.", "Nach Dotcom fiel die 10-Jahres-Rendite auf null.", "Tras las puntocom, la rentabilidad a 10 años llegó a cero."],
    "纳指的牛市更陡，熊市也更狠。": ["Nasdaq bulls are steeper; its bears, crueler.", "Hausses plus raides, baisses plus cruelles.", "Steilere Bullen, grausamere Bären.", "Alcistas más empinados y bajistas más crueles."],
    "成长股的极端日长什么样？": ["What do growth stocks' extreme days look like?", "À quoi ressemblent les séances extrêmes ?", "Wie sehen extreme Tage bei Wachstumsaktien aus?", "¿Cómo son los días extremos del growth?"],
    "dotcom 崩了 −83%，这次呢？": ["Dotcom crashed −83%. This time?", "La bulle a chuté de −83 %. Et cette fois ?", "Dotcom stürzte −83 % ab. Und diesmal?", "Las puntocom cayeron −83 %. ¿Y esta vez?"],
    "成长股的心跳有多快？": ["How fast is a growth stock's heartbeat?", "À quel rythme bat le cœur du growth ?", "Wie schnell schlägt der Puls der Wachstumswerte?", "¿A qué ritmo late el growth?"],
    "纳指的月份脾气。": ["The Nasdaq's monthly temperament.", "L'humeur mensuelle du Nasdaq.", "Das Monatstemperament des Nasdaq.", "El temperamento mensual del Nasdaq."],
    "纳指 100 有多\"科技\"？": ["How \"tech\" is the Nasdaq-100?", "À quel point le Nasdaq-100 est-il « tech » ?", "Wie „Tech“ ist der Nasdaq-100?", "¿Qué tan «tecnológico» es el Nasdaq-100?"],
    "一百家公司的名单。": ["A list of one hundred companies.", "La liste des cent.", "Die Liste der hundert.", "La lista de las cien."],
    "1998 年至今，金融板块 ETF 走过了什么？": ["Since 1998, what has the financials ETF lived through?", "Depuis 1998, qu'a traversé l'ETF financier ?", "Was hat der Finanz-ETF seit 1998 durchlebt?", "Desde 1998, ¿qué ha vivido el ETF financiero?"],
    "同样的 100 元，各自长成了多少？": ["The same 100 — what did each grow into?", "Les mêmes 100 — que sont-ils devenus ?", "Dieselben 100 — was wurde daraus?", "Los mismos 100: ¿en qué se convirtieron?"],
    "等权拿着这九只，年景和回撤什么样？": ["Hold all nine equal-weighted — what do the years look like?", "Les neuf équipondérés — quelles années, quels replis ?", "Alle neun gleichgewichtet — wie liefen die Jahre?", "Las nueve equiponderadas: ¿qué años y qué caídas?"],
    "等权拿着这十一只，年景和回撤什么样？": ["Hold all eleven equal-weighted — what do the years look like?", "Les onze équipondérés — quelles années, quels replis ?", "Alle elf gleichgewichtet — wie liefen die Jahre?", "Las once equiponderadas: ¿qué años y qué caídas?"],
    "防守与周期，两条消费曲线怎么走？": ["Defense vs cycle — how do the two consumer curves run?", "Défense vs cycle — comment courent les deux courbes ?", "Defensive vs. Zyklus — wie laufen die zwei Kurven?", "Defensa vs ciclo: ¿cómo corren las dos curvas?"],
    "四十年维度，谁是真正的复利机器？": ["Over forty years, who is the true compounding machine?", "Sur quarante ans, qui est la vraie machine à capitaliser ?", "Wer ist über vierzig Jahre die wahre Zinseszinsmaschine?", "En cuarenta años, ¿quién es la verdadera máquina de capitalizar?"],
    "防守型组合的年景与回撤。": ["A defensive basket's years and drawdowns.", "Années et replis d'un panier défensif.", "Jahre und Drawdowns eines defensiven Korbs.", "Años y caídas de una cesta defensiva."],
    "同为奢侈品，分化有多大？": ["All luxury — yet how wide is the divergence?", "Tous dans le luxe — quelle divergence ?", "Alle Luxus — wie groß die Divergenz?", "Todo lujo, ¿pero cuánta divergencia?"],
    "奢侈品也有熊市。": ["Luxury has bear markets too.", "Le luxe aussi connaît des marchés baissiers.", "Auch Luxus kennt Bärenmärkte.", "El lujo también tiene mercados bajistas."],
    "今天的 K 值在哪里？": ["Where is K today?", "Où est K aujourd'hui ?", "Wo steht K heute?", "¿Dónde está K hoy?"],
    "2020 年以来的每次相逢，事后都发生了什么？": ["After every encounter since 2020 — what happened next?", "Après chaque rencontre depuis 2020 — que s'est-il passé ?", "Was geschah nach jeder Begegnung seit 2020?", "Tras cada encuentro desde 2020, ¿qué pasó después?"],
    "今天的窗口开着吗？": ["Is the window open today?", "La fenêtre est-elle ouverte aujourd'hui ?", "Ist das Fenster heute offen?", "¿Está abierta la ventana hoy?"],
    "股价背后，利润跟上了吗？": ["Behind the price, did profits keep up?", "Derrière le cours, les profits ont-ils suivi ?", "Hielten die Gewinne mit dem Kurs Schritt?", "Detrás del precio, ¿siguieron los beneficios?"],
    "一块钱资本，赚回多少？（芒格：长期回报趋近 ROIC）": ["One dollar of capital — how much comes back? (Munger: long-run returns converge to ROIC)", "Un dollar de capital — combien revient ? (Munger)", "Ein Dollar Kapital — wie viel kommt zurück? (Munger)", "Un dólar de capital: ¿cuánto vuelve? (Munger)"],
    "现在的价格，在自己的历史里算贵吗？": ["Is today's price expensive against its own history?", "Le prix est-il cher face à sa propre histoire ?", "Ist der Preis teuer gegen die eigene Historie?", "¿Es caro el precio frente a su propia historia?"],
    "每年的涨跌，是利润挣来的，还是估值给的？": ["Each year's move — earned by profits, or granted by multiples?", "Chaque année — gagnée par les profits ou offerte par les multiples ?", "Jedes Jahr — von Gewinnen verdient oder vom Multiple geschenkt?", "Cada año: ¿ganado por beneficios o regalado por múltiplos?"],
    "分红有没有年年长大？": ["Do the dividends grow every year?", "Le dividende grandit-il chaque année ?", "Wächst die Dividende Jahr für Jahr?", "¿Crece el dividendo cada año?"],
    "放回同一个篮子里看，贵还是便宜、强还是弱？": ["Back in the basket — cheap or dear, strong or weak?", "Dans le panier — cher ou bon marché, fort ou faible ?", "Zurück im Korb — teuer oder billig, stark oder schwach?", "En la cesta: ¿caro o barato, fuerte o débil?"],
    "巴菲特们打开报表前先看的一屏。": ["The one screen the Buffetts check before the filings.", "L'écran que les Buffett regardent avant les comptes.", "Der Bildschirm, den die Buffetts zuerst prüfen.", "La pantalla que los Buffett miran antes de las cuentas."],

    // ---- 其他 UI ----
    "和谁比一比？——": ["Compare with — ", "Comparer avec — ", "Vergleichen mit — ", "Comparar con — "],
    "XLF 总览": ["XLF Overview", "Vue XLF", "XLF-Überblick", "Vista XLF"],
    "XLP·XLY 总览": ["XLP·XLY Overview", "Vue XLP·XLY", "XLP·XLY-Überblick", "Vista XLP·XLY"],
    "组合总览": ["Basket Overview", "Vue du panier", "Korb-Überblick", "Vista de la cesta"],
    "银行": ["Banks", "Banques", "Banken", "Bancos"],
    "卡组织": ["Card networks", "Réseaux de cartes", "Kartennetzwerke", "Redes de tarjetas"],
    "投行": ["Investment banks", "Banques d'affaires", "Investmentbanken", "Banca de inversión"],
    "资管": ["Asset mgmt", "Gestion d'actifs", "Vermögensverw.", "Gestoras"],
    "券商": ["Brokers", "Courtiers", "Broker", "Brokers"],
    "保险": ["Insurance", "Assurance", "Versicherung", "Seguros"],
    "半导体": ["Semiconductors", "Semi-conducteurs", "Halbleiter", "Semiconductores"],
    "平台·软件": ["Platforms & software", "Plateformes & logiciels", "Plattformen & Software", "Plataformas y software"],
    "硬件·终端": ["Hardware & devices", "Matériel & appareils", "Hardware & Geräte", "Hardware y dispositivos"],
    "加密·稳定币": ["Crypto & stablecoins", "Crypto & stablecoins", "Krypto & Stablecoins", "Cripto y stablecoins"],
    "必需": ["Staples", "Base", "Basiskonsum", "Básico"],
    "可选": ["Discretionary", "Cyclique", "Zyklisch", "Discrecional"],
    "摩根大通": ["JPMorgan", "JPMorgan", "JPMorgan", "JPMorgan"],
    "美国银行": ["Bank of America", "Bank of America", "Bank of America", "Bank of America"],
    "万事达": ["Mastercard", "Mastercard", "Mastercard", "Mastercard"],
    "美国运通": ["Amex", "Amex", "Amex", "Amex"],
    "高盛": ["Goldman Sachs", "Goldman Sachs", "Goldman Sachs", "Goldman Sachs"],
    "摩根士丹利": ["Morgan Stanley", "Morgan Stanley", "Morgan Stanley", "Morgan Stanley"],
    "贝莱德": ["BlackRock", "BlackRock", "BlackRock", "BlackRock"],
    "嘉信理财": ["Charles Schwab", "Charles Schwab", "Charles Schwab", "Charles Schwab"],
    "盈透证券": ["Interactive Brokers", "Interactive Brokers", "Interactive Brokers", "Interactive Brokers"],
    "可口可乐": ["Coca-Cola", "Coca-Cola", "Coca-Cola", "Coca-Cola"],
    "沃尔玛": ["Walmart", "Walmart", "Walmart", "Walmart"],
    "好市多": ["Costco", "Costco", "Costco", "Costco"],
    "家得宝": ["Home Depot", "Home Depot", "Home Depot", "Home Depot"],
    "麦当劳": ["McDonald's", "McDonald's", "McDonald's", "McDonald's"],
    "爱马仕": ["Hermès", "Hermès", "Hermès", "Hermès"],
    "法拉利": ["Ferrari", "Ferrari", "Ferrari", "Ferrari"],
    "英伟达": ["Nvidia", "Nvidia", "Nvidia", "Nvidia"],
    "苹果": ["Apple", "Apple", "Apple", "Apple"],
    "谷歌": ["Google", "Google", "Google", "Google"],
    "亚马逊": ["Amazon", "Amazon", "Amazon", "Amazon"],
    "微软": ["Microsoft", "Microsoft", "Microsoft", "Microsoft"],
    "特斯拉": ["Tesla", "Tesla", "Tesla", "Tesla"],
    "博通": ["Broadcom", "Broadcom", "Broadcom", "Broadcom"],
    "台积电": ["TSMC", "TSMC", "TSMC", "TSMC"],
    "伯克希尔": ["Berkshire", "Berkshire", "Berkshire", "Berkshire"],
    "标普 500 · 仅供个人研究": ["", "", "", ""],
    "仅供个人研究，不构成投资建议": ["Personal research only — not investment advice", "Recherche personnelle — pas un conseil en investissement", "Nur private Recherche — keine Anlageberatung", "Solo investigación personal; no es asesoramiento de inversión"],
    "数据源：Yahoo Finance / CNN Fear & Greed / multpl.com": ["Data: Yahoo Finance / CNN Fear & Greed / multpl.com", "Données : Yahoo Finance / CNN Fear & Greed / multpl.com", "Daten: Yahoo Finance / CNN Fear & Greed / multpl.com", "Datos: Yahoo Finance / CNN Fear & Greed / multpl.com"],

    // ---- 图表 series / 轴名 / 图例（进 ECharts option）----
    "等权组合": ["Equal-weight basket", "Panier équipondéré", "Gleichgew. Korb", "Cesta equiponderada"],
    "CNN 恐贪": ["CNN F&G", "CNN F&G", "CNN F&G", "CNN F&G"],
    "已实现波动率(20d)": ["Realized vol (20d)", "Vol réalisée (20 j)", "Real. Vol (20T)", "Vol realizada (20d)"],
    "已实现波动率(60d)": ["Realized vol (60d)", "Vol réalisée (60 j)", "Real. Vol (60T)", "Vol realizada (60d)"],
    "距前高": ["From peak", "Depuis le sommet", "Vom Hoch", "Desde máximo"],
    "滚动5年年化": ["Rolling 5y CAGR", "TCAC glissant 5 ans", "Roll. 5J-CAGR", "TCAC móvil 5a"],
    "全年收益": ["Annual return", "Rendement annuel", "Jahresrendite", "Rendimiento anual"],
    "年内最大回撤": ["Intra-year max DD", "Repli intra-annuel", "Unterj. Max-DD", "Caída intraanual"],
    "平均涨跌": ["Avg return", "Rendement moyen", "Ø Rendite", "Rendimiento medio"],
    "上涨概率": ["Win rate", "Taux de hausse", "Gewinnquote", "Prob. de subida"],
    "EPS 变化": ["EPS change", "Variation BPA", "EPS-Änderung", "Variación BPA"],
    "估值变化": ["Multiple change", "Variation du multiple", "Multiple-Änderung", "Variación del múltiplo"],
    "全年回报": ["Full-year return", "Rendement annuel", "Jahresrendite", "Rendimiento anual"],
    "目标上限": ["Fed target (upper)", "Cible Fed (haut)", "Fed-Ziel (oben)", "Objetivo Fed (sup.)"],
    "非农新增": ["Nonfarm payrolls", "Emplois non agricoles", "Beschäftigung", "Nóminas"],
    "失业率": ["Unemployment", "Chômage", "Arbeitslosenquote", "Desempleo"],
    "高收益 OAS": ["High-yield OAS", "OAS haut rendement", "High-Yield-OAS", "OAS alto rendimiento"],
    "投资级 OAS": ["Investment-grade OAS", "OAS investment grade", "Investment-Grade-OAS", "OAS grado de inversión"],
    "CPI 同比": ["CPI YoY", "CPI a/a", "CPI ggü. Vj.", "CPI interanual"],
    "核心 PCE 同比": ["Core PCE YoY", "PCE core a/a", "Kern-PCE ggü. Vj.", "PCE núcleo interanual"],
    "PPI 同比": ["PPI YoY", "PPI a/a", "PPI ggü. Vj.", "PPI interanual"],
    "GDP 环比年化": ["GDP QoQ ann.", "PIB t/t ann.", "BIP annualisiert", "PIB anualizado"],
    "企业利润同比": ["Corp. profits YoY", "Profits a/a", "Gewinne ggü. Vj.", "Beneficios interanual"],
    "倒挂线": ["Inversion line", "Ligne d'inversion", "Inversionslinie", "Línea de inversión"],
    "开仓阈值 25": ["Entry threshold 25", "Seuil 25", "Schwelle 25", "Umbral 25"],
    "2% 目标": ["2% target", "Cible 2 %", "2%-Ziel", "Objetivo 2 %"],
    "年数": ["Years", "Années", "Jahre", "Años"],
    "天数(log)": ["Days (log)", "Jours (log)", "Tage (log)", "Días (log)"],
    "千人": ["Thousands", "Milliers", "Tsd.", "Miles"],
    "失业率%": ["Unemp. %", "Chômage %", "ALQ %", "Desempleo %"],
    "起点=100": ["Start = 100", "Base 100", "Start = 100", "Base 100"],
    "家数": ["Count", "Nombre", "Anzahl", "Número"],
    "🐂 牛": ["🐂 Bull", "🐂 Hausse", "🐂 Bulle", "🐂 Alcista"],
    "🐻 熊": ["🐻 Bear", "🐻 Baisse", "🐻 Bär", "🐻 Bajista"],
    "1月": ["Jan", "janv.", "Jan.", "ene"], "2月": ["Feb", "févr.", "Feb.", "feb"],
    "3月": ["Mar", "mars", "März", "mar"], "4月": ["Apr", "avr.", "Apr.", "abr"],
    "5月": ["May", "mai", "Mai", "may"], "6月": ["Jun", "juin", "Juni", "jun"],
    "7月": ["Jul", "juil.", "Juli", "jul"], "8月": ["Aug", "août", "Aug.", "ago"],
    "9月": ["Sep", "sept.", "Sep.", "sep"], "10月": ["Oct", "oct.", "Okt.", "oct"],
    "11月": ["Nov", "nov.", "Nov.", "nov"], "12月": ["Dec", "déc.", "Dez.", "dic"],

    // ---- 状态卡 / 文案残留 ----
    "未触发（K ≥ 1）": ["Not triggered (K ≥ 1)", "Non déclenché (K ≥ 1)", "Nicht ausgelöst (K ≥ 1)", "No activada (K ≥ 1)"],
    "★ 金风玉露相逢 — 信号触发": ["★ Signal triggered", "★ Signal déclenché", "★ Signal ausgelöst", "★ Señal activada"],
    "窗口关闭（≥ 25）": ["Window closed (≥ 25)", "Fenêtre fermée (≥ 25)", "Fenster geschlossen (≥ 25)", "Ventana cerrada (≥ 25)"],
    "★ 窗口开启 — 极端恐惧": ["★ Window open — extreme fear", "★ Fenêtre ouverte — peur extrême", "★ Fenster offen — extreme Angst", "★ Ventana abierta — miedo extremo"],
    "连续交易日聚为一次": ["Consecutive days = one window", "Jours consécutifs = une fenêtre", "Folgetage = ein Fenster", "Días consecutivos = una ventana"],
    "免费源暂缺，参考 TTM": ["No free source; see TTM", "Pas de source gratuite ; voir TTM", "Keine freie Quelle; siehe TTM", "Sin fuente gratuita; ver TTM"],
    "免费源暂缺": ["No free source", "Pas de source gratuite", "Keine freie Quelle", "Sin fuente gratuita"],
    "全历史 / 近50年 / 2010→": ["All history / 50y / 2010→", "Tout l'historique / 50 ans / 2010→", "Gesamt / 50 J / 2010→", "Todo / 50a / 2010→"],
    "持仓加权": ["Holdings-weighted", "Pondéré par positions", "Bestandsgewichtet", "Ponderado por cartera"],
    "同为 ETF 口径": ["Same ETF basis", "Même base ETF", "Gleiche ETF-Basis", "Misma base ETF"],
    "贵于历史中枢": ["Above its historical anchor", "Au-dessus de l'ancre historique", "Über dem histor. Anker", "Sobre su ancla histórica"],
    "低于历史中枢": ["Below its historical anchor", "Sous l'ancre historique", "Unter dem histor. Anker", "Bajo su ancla histórica"],
    "yfinance 快照": ["yfinance snapshot", "Instantané yfinance", "yfinance-Momentaufnahme", "Instantánea de yfinance"],
    "回到": ["Back to ", "Retour à ", "Zurück zu ", "Volver a "],
    "美股编年史 · 自用版": ["Market Chronicle · personal edition", "Market Chronicle · édition personnelle", "Market Chronicle · private Ausgabe", "Market Chronicle · edición personal"],
    "数据更新中，稍后自动出现 · data updating": ["Data updating — will appear shortly", "Données en cours de mise à jour", "Daten werden aktualisiert", "Actualizando datos"],

    // ---- 长图注 / sub ----
    "每年收盘对收盘的价格回报": ["Close-to-close price return per year", "Rendement prix clôture à clôture", "Jahresrendite Schluss zu Schluss", "Rendimiento precio cierre a cierre"],
    "年度回报分桶 · 悬停查看每桶年份": ["Annual returns bucketed · hover for years", "Rendements par tranche · survolez pour les années", "Jahresrenditen in Klassen · Hover zeigt Jahre", "Rendimientos por tramos · pase el cursor"],
    "月频滚动窗口 · 正收益概率": ["Monthly rolling windows · probability of gain", "Fenêtres mensuelles glissantes · probabilité de gain", "Monatlich rollierend · Gewinnwahrscheinlichkeit", "Ventanas móviles mensuales · probabilidad de ganancia"],
    "首段自数据起点截断": ["First segment truncated at data start", "Premier segment tronqué au début des données", "Erstes Segment am Datenbeginn gekappt", "Primer tramo truncado al inicio de datos"],
    "距前高的百分比距离（周频）": ["Percent below prior peak (weekly)", "Écart au sommet précédent (hebdo)", "Abstand zum Hoch in % (wöchentlich)", "Distancia al máximo previo (semanal)"],
    "几乎每一年都有回撤，多数年份仍收正": ["Nearly every year has a drawdown; most still close positive", "Presque chaque année connaît un repli ; la plupart finissent positives", "Fast jedes Jahr hat einen Drawdown; die meisten schließen positiv", "Casi todos los años hay caídas; la mayoría cierra en positivo"],
    "全历史（1871→）· 近 50 年 · 2010 年以来，三条虚线即三个\"回归锚\"": ["All history (1871→), last 50 years, and 2010→ — three dashed anchors of mean reversion", "Tout l'historique (1871→), 50 ans, 2010→ — trois ancres de retour à la moyenne", "Gesamthistorie (1871→), 50 Jahre, 2010→ — drei Anker der Rückkehr zum Mittel", "Todo el histórico (1871→), 50 años y 2010→: tres anclas de reversión a la media"],
    "VIX 衡量市场对未来 30 天的波动预期——冲破 30，意味着投资者已经在为下一轮风险付保费。叠加 20 日 / 60 日年化已实现波动率（周频）。": [
      "VIX prices the next 30 days of expected volatility — above 30, investors are already paying premium for the next storm. Overlaid with 20d/60d realized vol (weekly).",
      "Le VIX cote la volatilité attendue à 30 jours — au-dessus de 30, la prime de risque est déjà payée. Superposé aux vols réalisées 20 j/60 j.",
      "Der VIX bepreist die erwartete Volatilität der nächsten 30 Tage — über 30 zahlen Anleger bereits Prämie für den nächsten Sturm. Mit realisierter 20T/60T-Vol.",
      "El VIX cotiza la volatilidad esperada a 30 días: por encima de 30, ya se paga prima por la próxima tormenta. Superpuesto con vol realizada 20d/60d."],
    "VXN 衡量市场对纳指未来 30 天的波动预期。叠加 20 日 / 60 日年化已实现波动率（周频）。": [
      "VXN prices the Nasdaq's next 30 days of expected volatility. Overlaid with 20d/60d realized vol (weekly).",
      "Le VXN cote la volatilité attendue du Nasdaq à 30 jours. Avec vols réalisées 20 j/60 j.",
      "Der VXN bepreist die erwartete Nasdaq-Volatilität der nächsten 30 Tage. Mit realisierter 20T/60T-Vol.",
      "El VXN cotiza la volatilidad esperada del Nasdaq a 30 días. Con vol realizada 20d/60d."],
    "当前成分股（Wikipedia · 随每日更新刷新）": ["Current constituents (Wikipedia, refreshed daily)", "Composition actuelle (Wikipedia, quotidien)", "Aktuelle Mitglieder (Wikipedia, täglich)", "Componentes actuales (Wikipedia, diario)"],
    "牛熊周期（跌 20% 确认熊 · 涨 25% 确认牛）": ["Bull/bear cycles (−20% confirms bear, +25% confirms bull)", "Cycles haussiers/baissiers (−20 % / +25 %)", "Bullen-/Bärenzyklen (−20 % / +25 %)", "Ciclos alcistas/bajistas (−20 % / +25 %)"],
    "日收益分布（对数计数）": ["Daily return distribution (log count)", "Distribution des rendements quotidiens (log)", "Tagesrenditeverteilung (log)", "Distribución de rendimientos diarios (log)"],
    "最差 / 最好单日": ["Worst / best single days", "Pires / meilleures séances", "Schlechteste / beste Tage", "Peores / mejores días"],
    "十一只核心成员自 2008-03（Visa 上市）同一起跑线；墨色粗线为等权组合。COIN/HOOD/CRCL 上市较晚，不入组合、只出个股页。": [
      "Eleven core members from a common start in Mar 2008 (Visa's IPO); the bold ink line is the equal-weight basket. COIN/HOOD/CRCL listed too recently and are excluded from the basket.",
      "Onze membres depuis mars 2008 (IPO de Visa) ; la ligne épaisse est le panier équipondéré. COIN/HOOD/CRCL, trop récents, en sont exclus.",
      "Elf Kernmitglieder ab März 2008 (Visa-IPO); die dicke Linie ist der gleichgewichtete Korb. COIN/HOOD/CRCL sind zu jung und ausgeschlossen.",
      "Once miembros desde marzo de 2008 (salida de Visa); la línea gruesa es la cesta equiponderada. COIN/HOOD/CRCL cotizan hace poco y quedan fuera."],
    "墨色粗线为六股等权组合": ["Bold ink line = equal-weight basket of six", "Ligne épaisse = panier équipondéré des six", "Dicke Linie = gleichgewichteter Korb der sechs", "Línea gruesa = cesta equiponderada de seis"],
    "墨色粗线为三股等权组合；MC/RMS 为欧元、RACE 为美元，混币种仅供比较": ["Bold line = equal-weight basket of three; MC/RMS in EUR, RACE in USD — mixed currencies, for comparison only", "Ligne épaisse = panier des trois ; MC/RMS en EUR, RACE en USD — devises mixtes", "Dicke Linie = Korb der drei; MC/RMS in EUR, RACE in USD — Mischwährung", "Línea gruesa = cesta de tres; MC/RMS en EUR, RACE en USD — divisas mixtas"],
    "年化收益按各自币种计；YTD 为年初至今涨跌 · 点击任意一行进入个股页": ["CAGRs in local currency; YTD = year-to-date · click any row for the stock page", "TCAC en devise locale ; cliquez une ligne pour la fiche valeur", "CAGR in Lokalwährung; Zeile anklicken für die Aktienseite", "TCAC en divisa local; haga clic en una fila para ver el valor"],
    "点击任意一行进入个股页": ["Click any row for the stock page", "Cliquez une ligne pour la fiche valeur", "Zeile anklicken für die Aktienseite", "Haga clic en una fila para ver el valor"],
    "上图：CNN（黄，左轴 0–100）· VIX（红，左轴）· 纳指 100（蓝，右轴，对数）｜下图：K 指数（红，左轴 1–10），K < 1 区间高亮": [
      "Top: CNN (gold, left 0–100), VIX (red, left), NDX (blue, right, log). Bottom: K-Index (red, 1–10), K < 1 zones highlighted.",
      "Haut : CNN (or), VIX (rouge), NDX (bleu, log). Bas : indice K (rouge, 1–10), zones K < 1 en surbrillance.",
      "Oben: CNN (gold), VIX (rot), NDX (blau, log). Unten: K-Index (rot, 1–10), K < 1 hervorgehoben.",
      "Arriba: CNN (oro), VIX (rojo), NDX (azul, log). Abajo: índice K (rojo, 1–10), zonas K < 1 resaltadas."],
    "CNN 数据 2011 年起为每日存档；图表自 2019-06 起展示。数据源：CNN Fear & Greed（whit3rabbit 存档 + 官方接口）、Yahoo Finance。": [
      "CNN data archived daily since 2011; chart shown from Jun 2019. Sources: CNN Fear & Greed (whit3rabbit archive + official endpoint), Yahoo Finance.",
      "Données CNN archivées depuis 2011 ; graphique depuis juin 2019. Sources : CNN Fear & Greed, Yahoo Finance.",
      "CNN-Daten seit 2011 täglich archiviert; Chart ab Juni 2019. Quellen: CNN Fear & Greed, Yahoo Finance.",
      "Datos de CNN archivados desde 2011; gráfico desde junio de 2019. Fuentes: CNN Fear & Greed, Yahoo Finance."],
    "金风（CNN）玉露（VIX）一（K < 1）相逢，便胜却人间无数。": [
      "When golden fear (CNN) meets jade volatility (VIX) below one, the encounter outshines countless ordinary days.",
      "Quand la peur (CNN) rencontre la volatilité (VIX) sous 1, la rencontre vaut mieux que mille jours ordinaires.",
      "Wenn Angst (CNN) auf Volatilität (VIX) unter 1 trifft, ist diese Begegnung mehr wert als tausend gewöhnliche Tage.",
      "Cuando el miedo (CNN) se encuentra con la volatilidad (VIX) bajo 1, ese encuentro vale más que mil días corrientes."],
    "每段连续 K < 1 的交易日聚为一次信号（间隔超过 10 个交易日记为新信号）。收益为信号首日纳指 100 收盘价之后 20 / 40 / 60 个交易日的涨跌幅。": [
      "Consecutive K < 1 days cluster into one signal (gaps > 10 trading days start a new one). Returns are NDX moves 20/40/60 trading days after the signal's first day.",
      "Les jours consécutifs K < 1 forment un signal (écart > 10 jours = nouveau). Rendements NDX à 20/40/60 jours après le premier jour.",
      "Aufeinanderfolgende K<1-Tage bilden ein Signal (Lücke > 10 Handelstage = neu). NDX-Renditen 20/40/60 Tage nach Signalbeginn.",
      "Los días consecutivos con K < 1 forman una señal (hueco > 10 días = nueva). Rendimientos del NDX a 20/40/60 días."],
    "黄色为 CNN 恐贪指数（左轴 0–100），蓝色为纳指 100（右轴 · 对数）；恐贪 < 25 的窗口期红色高亮，25 处虚线为开仓阈值": [
      "Gold = CNN Fear & Greed (left, 0–100); blue = NDX (right, log). Windows below 25 highlighted; dashed line = entry threshold.",
      "Or = CNN Fear & Greed ; bleu = NDX (log). Fenêtres < 25 en surbrillance ; pointillé = seuil.",
      "Gold = CNN Fear & Greed; blau = NDX (log). Fenster < 25 hervorgehoben; gestrichelt = Schwelle.",
      "Oro = CNN Fear & Greed; azul = NDX (log). Ventanas < 25 resaltadas; línea discontinua = umbral."],
    "连续低于 25 的交易日聚为一个窗口（间隔 >10 个交易日记新窗口）；收益为窗口首日起 6/12/18 个月（126/252/378 交易日）标普 500 与纳指 100 涨跌幅": [
      "Consecutive days below 25 cluster into one window (gaps > 10 days start a new one). Returns are S&P 500 and NDX moves 6/12/18 months (126/252/378 trading days) from the window's first day.",
      "Jours consécutifs < 25 = une fenêtre. Rendements S&P 500 et NDX à 6/12/18 mois.",
      "Folgetage < 25 = ein Fenster. S&P-500- und NDX-Renditen nach 6/12/18 Monaten.",
      "Días consecutivos < 25 = una ventana. Rendimientos del S&P 500 y NDX a 6/12/18 meses."],
    "低于 25，市场进入极端恐惧——别人恐惧时的保费，就是 LEAPS 买家的入场券。不买 3 个月以内的期权：短期权大概率归零，胜负手在时间价值站在你这边。": [
      "Below 25 the market enters extreme fear — the premium others pay in panic is the LEAPS buyer's ticket. Never buy options under 3 months: short-dated contracts mostly expire worthless; the edge is having time value on your side.",
      "Sous 25, peur extrême — la prime payée par les autres est le ticket d'entrée de l'acheteur de LEAPS. Jamais d'options < 3 mois : elles expirent le plus souvent sans valeur.",
      "Unter 25 herrscht extreme Angst — die Prämie der anderen ist das Ticket des LEAPS-Käufers. Keine Optionen unter 3 Monaten: kurze Laufzeiten verfallen meist wertlos.",
      "Bajo 25, miedo extremo: la prima que pagan otros es la entrada del comprador de LEAPS. Nunca opciones a menos de 3 meses: suelen expirar sin valor."],
    "CNN 恐惧贪婪指数跌破 25 = 市场进入极端恐惧 = LEAPS call 开仓观察窗口。只做一年以上的远期期权——短期期权是彩票，LEAPS 才是用时间换空间。": [
      "CNN Fear & Greed below 25 = extreme fear = LEAPS-call entry watch window. Only go a year or more out — short-dated options are lottery tickets; LEAPS trade time for room to be right.",
      "CNN Fear & Greed sous 25 = peur extrême = fenêtre d'observation LEAPS. Un an minimum — le court terme est une loterie.",
      "CNN Fear & Greed unter 25 = extreme Angst = LEAPS-Beobachtungsfenster. Mindestens ein Jahr Laufzeit — kurzes ist Lotterie.",
      "CNN Fear & Greed bajo 25 = miedo extremo = ventana de observación LEAPS. Mínimo un año: el corto plazo es lotería."],
    "K 指数 = CNN 恐惧贪婪指数 ÷ VIX。当恐惧（CNN 走低）与波动（VIX 走高）交叉，K 跌破 1 —— 2020 年以来的每一次，都对应纳指 100 的一次深度回调。下方逐次对账。": [
      "K-Index = CNN Fear & Greed ÷ VIX. When fear (CNN falling) crosses volatility (VIX rising), K breaks below 1 — every time since 2020 has coincided with a deep NDX correction. Audited signal by signal below.",
      "Indice K = CNN ÷ VIX. Quand K passe sous 1, chaque occurrence depuis 2020 a coïncidé avec une correction profonde du NDX. Audit ci-dessous.",
      "K-Index = CNN ÷ VIX. Fällt K unter 1, fiel dies seit 2020 jedes Mal mit einer tiefen NDX-Korrektur zusammen. Prüfung unten.",
      "Índice K = CNN ÷ VIX. Cada vez que K cae bajo 1 desde 2020 ha coincidido con una corrección profunda del NDX. Auditoría abajo."],
    "过剩流动性的蓄水池，抽干即水位警报": ["The reservoir of excess liquidity — drained means low-water alarm", "Réservoir de liquidité excédentaire", "Reservoir überschüssiger Liquidität", "Reserva de liquidez excedente"],
    "QE 放水 / QT 收水的总闸门": ["The master valve of QE and QT", "La vanne maîtresse du QE/QT", "Das Hauptventil von QE/QT", "La válvula maestra del QE/QT"],
    "倒挂（< 0）历来是衰退的前奏": ["Inversion (< 0) has historically preceded recessions", "L'inversion précède historiquement les récessions", "Inversion ging Rezessionen historisch voraus", "La inversión ha precedido históricamente a las recesiones"],
    "CDS 级的违约恐惧温度计（美银美林指数）": ["A CDS-grade default-fear thermometer (BofA ML indices)", "Thermomètre de peur du défaut (indices BofA ML)", "Ausfallangst-Thermometer (BofA-ML-Indizes)", "Termómetro del miedo al impago (índices BofA ML)"],
    "全美企业税后利润（FRED CP）——指数 EPS 的宏观母体": ["US after-tax corporate profits (FRED CP) — the macro parent of index EPS", "Profits après impôts des entreprises US — matrice macro du BPA", "US-Unternehmensgewinne nach Steuern — Makro-Mutter des Index-EPS", "Beneficios empresariales después de impuestos — matriz macro del BPA"],
    "钱贵不贵、多不多？隔夜利率是资金的体温计，逆回购与 Fed 资产负债表是流动性的蓄水池。": [
      "Is money dear, is money plentiful? Overnight rates are its thermometer; RRP and the Fed's balance sheet are its reservoirs.",
      "L'argent est-il cher, abondant ? Les taux au jour le jour en sont le thermomètre.",
      "Ist Geld teuer, ist Geld reichlich? Tagesgeldsätze sind das Thermometer.",
      "¿El dinero está caro o abunda? Los tipos a un día son su termómetro."],
    "Fed 政策方向写在收益率曲线上，违约恐惧写在信用利差里。": [
      "Fed policy is written on the yield curve; default fear is written in credit spreads.",
      "La politique de la Fed s'écrit sur la courbe des taux ; la peur du défaut, dans les spreads.",
      "Fed-Politik steht in der Zinskurve; Ausfallangst in den Kreditspreads.",
      "La política de la Fed se escribe en la curva de tipos; el miedo al impago, en los spreads."],
    "CPI、核心 PCE 与 PPI——Fed 盯的就是这三条线回不回 2%。": [
      "CPI, core PCE and PPI — the three lines the Fed watches on their way back to 2%.",
      "CPI, PCE core et PPI — les trois lignes que la Fed surveille vers 2 %.",
      "CPI, Kern-PCE und PPI — die drei Linien auf dem Weg zurück zu 2 %.",
      "CPI, PCE núcleo y PPI: las tres líneas que la Fed vigila hacia el 2 %."],
    "GDP、非农、失业率与企业利润——基本面的四块基石。": [
      "GDP, payrolls, unemployment and corporate profits — the four cornerstones of fundamentals.",
      "PIB, emploi, chômage et profits — les quatre pierres angulaires.",
      "BIP, Beschäftigung, Arbeitslosigkeit und Gewinne — die vier Grundpfeiler.",
      "PIB, empleo, paro y beneficios: las cuatro piedras angulares."],
    "对比模式：全部序列在共同起点归一化为 100（对数坐标），跑赢基准 = 长期真正的好公司。": [
      "Comparison mode: all series normalized to 100 at the common start (log scale). Beating the benchmark = a genuinely great long-term business.",
      "Mode comparaison : séries en base 100 au départ commun (log). Battre l'indice = une vraie grande entreprise.",
      "Vergleichsmodus: alle Serien auf 100 normiert (log). Den Index schlagen = ein wirklich gutes Unternehmen.",
      "Modo comparación: todas las series en base 100 (log). Batir al índice = una empresa realmente buena."],
    "(1+回报) = (1+EPS变化) × (1+估值变化)，年末对年末": ["(1+return) = (1+EPS change) × (1+multiple change), year-end to year-end", "(1+rendement) = (1+ΔBPA) × (1+Δmultiple)", "(1+Rendite) = (1+ΔEPS) × (1+ΔMultiple)", "(1+retorno) = (1+ΔBPA) × (1+Δmúltiplo)"],

    // ---- 残留清扫（自动扫描补充）----
    "美股编年史": ["Market Chronicle", "Market Chronicle", "Market Chronicle", "Market Chronicle"],
    "纳指综指 × 纳指 100（月线 · 对数坐标）": ["Composite × Nasdaq-100 (monthly, log)", "Composite × Nasdaq-100 (mensuel, log)", "Composite × Nasdaq-100 (monatlich, log)", "Composite × Nasdaq-100 (mensual, log)"],
    "纳指 100 年度回报": ["Nasdaq-100 annual returns", "Rendements annuels du Nasdaq-100", "Nasdaq-100-Jahresrenditen", "Rendimientos anuales del Nasdaq-100"],
    "纳指 100 历史回撤曲线": ["Nasdaq-100 drawdown curve", "Courbe des replis du Nasdaq-100", "Nasdaq-100-Drawdown-Kurve", "Curva de caídas del Nasdaq-100"],
    "纳指 100 现在贵吗？": ["Is the Nasdaq-100 expensive today?", "Le Nasdaq-100 est-il cher ?", "Ist der Nasdaq-100 heute teuer?", "¿Está caro el Nasdaq-100?"],
    "QQQ PE (TTM · ETF 口径)": ["QQQ P/E (TTM, ETF basis)", "PER QQQ (TTM, base ETF)", "QQQ-KGV (TTM, ETF-Basis)", "PER QQQ (TTM, base ETF)"],
    "QQQ 远期 PE": ["QQQ forward P/E", "PER prospectif QQQ", "QQQ-Forward-KGV", "PER adelantado QQQ"],
    "SPY PE 对照": ["SPY P/E for reference", "PER SPY en référence", "SPY-KGV als Referenz", "PER SPY de referencia"],
    "指数级的纳指 PE 长历史与远期 PE 无免费公开数据源（原站为 Bloomberg 手动维护），此处仅展示 QQQ ETF 口径的当前值；个股级的 20 年 PE 历史请进入金融/消费/奢侈品板块的个股页查看。": [
      "No free public source exists for index-level Nasdaq P/E history or forward P/E (the original site maintains Bloomberg files by hand); only current QQQ ETF-basis values are shown here. For 20-year P/E histories, open any stock page in the Financials / Consumer / Luxury tabs.",
      "Pas de source publique gratuite pour l'historique du PER du Nasdaq ; seules les valeurs actuelles base ETF sont affichées. Voir les fiches valeurs pour 20 ans de PER.",
      "Keine freie Quelle für die Nasdaq-KGV-Historie; hier nur aktuelle ETF-Werte. 20-Jahres-KGV auf den Aktienseiten.",
      "No hay fuente gratuita para el histórico del PER del Nasdaq; aquí solo valores actuales base ETF. Vea 20 años de PER en las páginas de valores."],
    "XLF 走势（月线 · 对数坐标）": ["XLF price (monthly, log)", "XLF (mensuel, log)", "XLF (monatlich, log)", "XLF (mensual, log)"],
    "XLF 年度回报": ["XLF annual returns", "Rendements annuels XLF", "XLF-Jahresrenditen", "Rendimientos anuales XLF"],
    "XLF 回撤曲线": ["XLF drawdown curve", "Courbe des replis XLF", "XLF-Drawdown-Kurve", "Curva de caídas XLF"],
    "XLP（必需消费）× XLY（可选消费）走势（月线 · 对数坐标）": ["XLP (staples) × XLY (discretionary), monthly log", "XLP × XLY (mensuel, log)", "XLP × XLY (monatlich, log)", "XLP × XLY (mensual, log)"],
    "XLP 年度回报": ["XLP annual returns", "Rendements annuels XLP", "XLP-Jahresrenditen", "Rendimientos anuales XLP"],
    "XLY 年度回报": ["XLY annual returns", "Rendements annuels XLY", "XLY-Jahresrenditen", "Rendimientos anuales XLY"],
    "滚动 5 年年化": ["Rolling 5-year CAGR", "TCAC glissant 5 ans", "Rollierende 5J-CAGR", "TCAC móvil 5 años"],
    "已实现波动率（20 日年化）": ["Realized volatility (20d annualized)", "Volatilité réalisée (20 j annualisée)", "Realisierte Volatilität (20T ann.)", "Volatilidad realizada (20d anualizada)"],
    "PB（银行类更看市净率）": ["P/B (the right lens for banks)", "P/B (la bonne optique pour les banques)", "KBV (der richtige Blick für Banken)", "P/VC (la lente correcta para bancos)"],
    "CNN 恐贪 × VIX × 纳指 100，与 K 指数": ["CNN F&G × VIX × Nasdaq-100, and the K-Index", "CNN F&G × VIX × Nasdaq-100, et l'indice K", "CNN F&G × VIX × Nasdaq-100 und der K-Index", "CNN F&G × VIX × Nasdaq-100, y el índice K"],
    "2020 年以来 K < 1 信号逐次对账": ["Every K < 1 signal since 2020, audited", "Chaque signal K < 1 depuis 2020, audité", "Jedes K<1-Signal seit 2020, geprüft", "Cada señal K < 1 desde 2020, auditada"],
    "CNN 恐贪 × 纳指 100（2011 年至今）": ["CNN F&G × Nasdaq-100 (since 2011)", "CNN F&G × Nasdaq-100 (depuis 2011)", "CNN F&G × Nasdaq-100 (seit 2011)", "CNN F&G × Nasdaq-100 (desde 2011)"],
    "2011 年以来每次极端恐惧，6 / 12 / 18 个月后指数在哪里？（LEAPS 的持有视界）": ["After every extreme-fear window since 2011 — where was the index 6/12/18 months later? (the LEAPS holding horizon)", "Après chaque fenêtre de peur extrême depuis 2011 — où était l'indice 6/12/18 mois plus tard ?", "Nach jedem Extremangst-Fenster seit 2011 — wo stand der Index 6/12/18 Monate später?", "Tras cada ventana de miedo extremo desde 2011, ¿dónde estaba el índice 6/12/18 meses después?"],
    "恐贪 < 25 窗口逐次对账": ["Every window below 25, audited", "Chaque fenêtre sous 25, auditée", "Jedes Fenster unter 25, geprüft", "Cada ventana bajo 25, auditada"],
    "NDX至今": ["NDX to date", "NDX à ce jour", "NDX bis heute", "NDX hasta hoy"],
    "前二十大持仓（权重 · 每日刷新）": ["Top 20 holdings (weights, refreshed daily)", "Top 20 des positions (pondérations, quotidien)", "Top-20-Positionen (Gewichte, täglich)", "Las 20 mayores posiciones (pesos, diario)"],
    "季度/年度调仓后权重自动更新": ["Weights update automatically after each rebalance", "Pondérations mises à jour après chaque rebalancement", "Gewichte aktualisieren sich nach jedem Rebalancing", "Los pesos se actualizan tras cada rebalanceo"],
    "ICB 行业分布（按家数）": ["ICB sector breakdown (by count)", "Répartition ICB (par nombre)", "ICB-Sektoren (nach Anzahl)", "Sectores ICB (por número)"],
    "行业": ["Sector", "Secteur", "Sektor", "Sector"],
    "市值 ($B)": ["Mkt cap ($B)", "Cap. (Md$)", "MktKap (Mrd$)", "Cap. ($mm)"],
    "权重": ["Weight", "Poids", "Gewicht", "Peso"],

    // ---- 今日头版 ----
    "今日": ["Today", "Aujourd'hui", "Heute", "Hoy"],
    "今日，市场的体温": ["Today's Market Temperature", "La température du marché", "Die Temperatur des Marktes", "La temperatura del mercado"],
    "炙热": ["Scorching", "Brûlant", "Glühend", "Ardiente"],
    "偏暖": ["Warm", "Chaud", "Warm", "Cálido"],
    "温和": ["Mild", "Tempéré", "Mild", "Templado"],
    "冰点": ["Freezing", "Glacial", "Eiskalt", "Helado"],
    "涨跌分布 · 标普 500 成分股": ["Advance / decline · S&P 500 members", "Hausse / baisse · membres du S&P 500", "Steiger / Faller · S&P-500-Mitglieder", "Suben / bajan · miembros del S&P 500"],
    "板块温度 · 11 只 SPDR 行业 ETF 当日涨跌": ["Sector heat · 11 SPDR sector ETFs today", "Chaleur sectorielle · 11 ETF SPDR", "Sektorhitze · 11 SPDR-ETFs heute", "Calor sectorial · 11 ETF SPDR hoy"],
    "板块热力图 · 标普 500 全成分股（面积 = 市值 · 颜色 = 当日涨跌 · 点任意板块可放大细看）": ["Sector heatmap · all S&P 500 members (size = market cap, color = daily change · click any sector to zoom in)", "Carte thermique · tous les membres du S&P 500 (taille = capitalisation, couleur = variation · cliquez sur un secteur pour zoomer)", "Sektor-Heatmap · alle S&P-500-Mitglieder (Größe = Marktkapitalisierung, Farbe = Tagesänderung · Sektor anklicken zum Vergrößern)", "Mapa de calor · todos los miembros del S&P 500 (tamaño = capitalización, color = variación diaria · haz clic en un sector para ampliar)"],
    "滑动光标，掀开夜之一角。数据每交易日收盘后自动更新；温度是尺度不是信号——96 度的估值曾经烫了三年。": [
      "Move the cursor to lift a corner of the night. Data refreshes after each close; temperature is a scale, not a signal — 96-degree valuations once stayed hot for three years.",
      "Déplacez le curseur pour soulever un coin de la nuit. Données actualisées après chaque clôture ; la température est une échelle, pas un signal.",
      "Bewegen Sie den Cursor und lüften Sie einen Zipfel der Nacht. Daten nach jedem Handelsschluss; Temperatur ist ein Maßstab, kein Signal.",
      "Mueva el cursor para levantar una esquina de la noche. Datos tras cada cierre; la temperatura es una escala, no una señal."],
    "市场温度": ["Market temp", "Temp. du marché", "Markttemperatur", "Temp. del mercado"],
    "开启": ["Open", "Ouverte", "Offen", "Abierta"],
    "关闭": ["Closed", "Fermée", "Geschlossen", "Cerrada"],
    "科技": ["Tech", "Tech", "Tech", "Tecnología"],
    "医疗保健": ["Health care", "Santé", "Gesundheit", "Salud"],
    "能源": ["Energy", "Énergie", "Energie", "Energía"],
    "工业": ["Industrials", "Industrie", "Industrie", "Industria"],
    "原材料": ["Materials", "Matériaux", "Rohstoffe", "Materiales"],
    "公用事业": ["Utilities", "Services publics", "Versorger", "Servicios públicos"],
    "房地产": ["Real estate", "Immobilier", "Immobilien", "Inmobiliario"],
    "通信服务": ["Comm. services", "Télécoms", "Kommunikation", "Comunicaciones"],
    "恐贪": ["F&G", "F&G", "F&G", "F&G"],
    "大萧条": ["Great Depression", "Grande Dépression", "Große Depression", "Gran Depresión"],
    "滞胀": ["Stagflation", "Stagflation", "Stagflation", "Estanflación"],
    "黑色星期一": ["Black Monday", "Lundi noir", "Schwarzer Montag", "Lunes Negro"],
    "互联网泡沫": ["Dot-com bubble", "Bulle Internet", "Dotcom-Blase", "Burbuja puntocom"],
    "金融危机": ["Financial crisis", "Crise financière", "Finanzkrise", "Crisis financiera"],
    "疫情冲击": ["COVID shock", "Choc COVID", "COVID-Schock", "Shock del COVID"],
    "加息": ["Rate hikes", "Hausse des taux", "Zinserhöhungen", "Subida de tipos"],
    "必需消费": ["Staples", "Conso. de base", "Basiskonsum", "Consumo básico"],
    "可选消费": ["Discretionary", "Conso. cyclique", "Zykl. Konsum", "Consumo discrecional"],
    "道琼斯": ["Dow Jones", "Dow Jones", "Dow Jones", "Dow Jones"],
    "罗素 2000": ["Russell 2000", "Russell 2000", "Russell 2000", "Russell 2000"],
    "VIX 恐慌指数": ["VIX Fear Index", "VIX indice de peur", "VIX-Angstindex", "VIX índice del miedo"],
    "恐惧贪婪指数": ["Fear & Greed Index", "Indice Fear & Greed", "Fear-&-Greed-Index", "Índice Fear & Greed"],
    "LEAPS Call 窗口": ["LEAPS Call Window", "Fenêtre LEAPS Call", "LEAPS-Call-Fenster", "Ventana LEAPS Call"],
  };

  // 带动态数字的句式：正则 → 各语言模板（$1…为捕获组）
  const P = [
    [/^今日 K 指数（(.+)）$/, ["K-Index today ($1)", "Indice K aujourd'hui ($1)", "K-Index heute ($1)", "Índice K hoy ($1)"]],
    [/^今日恐贪（(.+)）$/, ["Fear & Greed today ($1)", "Fear & Greed aujourd'hui ($1)", "Fear & Greed heute ($1)", "Fear & Greed hoy ($1)"]],
    [/^至今 (.+)$/, ["$1 to date", "$1 à ce jour", "$1 bis heute", "$1 hasta hoy"]],
    [/^NDX 至今 (.+)$/, ["NDX to date: $1", "NDX à ce jour : $1", "NDX bis heute: $1", "NDX hasta hoy: $1"]],
    [/^(\d+) 次$/, ["$1", "$1", "$1", "$1"]],
    [/^数据截至 (.+) · (.+) · 每交易日收盘后自动更新$/,
      ["Data as of $1 · $2 · auto-updates after each market close",
       "Données au $1 · $2 · mise à jour après chaque clôture",
       "Daten per $1 · $2 · Aktualisierung nach jedem Handelsschluss",
       "Datos a $1 · $2 · se actualiza tras cada cierre"]],
    [/^数据截至 (.+) · (.+) · 每周六自动更新$/,
      ["Data as of $1 · $2 · auto-updates every Saturday",
       "Données au $1 · $2 · mise à jour chaque samedi",
       "Daten per $1 · $2 · Aktualisierung jeden Samstag",
       "Datos a $1 · $2 · se actualiza cada sábado"]],
    [/^数据截至 (.+)$/, ["Data as of $1", "Données au $1", "Daten per $1", "Datos a $1"]],
    [/^(\d+) 涨$/, ["$1 up", "$1 hausse", "$1 hoch", "$1 suben"]],
    [/^(\d+) 平$/, ["$1 flat", "$1 stable", "$1 unv.", "$1 planas"]],
    [/^(\d+) 跌$/, ["$1 down", "$1 baisse", "$1 runter", "$1 bajan"]],
    [/^上涨家数占比 (.+)%（\(涨 \+ 平÷2\) ÷ (\d+)），处于近一年第 (.+) 百分位$/,
      ["Advance ratio $1% ((up + flat÷2) ÷ $2) — $3th percentile of the past year",
       "Ratio de hausse $1 % — $3e percentile sur un an",
       "Steigerquote $1 % — $3. Perzentil im Jahr",
       "Ratio de subida $1 % — percentil $3 del último año"]],
    [/^温度 = （估值百分位 (.+) \+ 情绪百分位 (.+)）÷ 2。估值取标普 500 PE\(TTM\) 在 1871 年以来全历史的位置；情绪取今日上涨家数占比在近一年中的位置。$/,
      ["Temperature = (valuation percentile $1 + sentiment percentile $2) ÷ 2. Valuation: S&P 500 P/E (TTM) within all history since 1871; sentiment: today's advance ratio within the past year.",
       "Température = (percentile de valorisation $1 + percentile de sentiment $2) ÷ 2.",
       "Temperatur = (Bewertungsperzentil $1 + Stimmungsperzentil $2) ÷ 2.",
       "Temperatura = (percentil de valoración $1 + percentil de sentimiento $2) ÷ 2."]],
    [/^(\d+) 年$/, ["$1y", "$1 ans", "$1 J", "$1a"]],
    [/^持有(\d+)年$/, ["Hold $1y", "Tenir $1 ans", "$1 J halten", "Mantener $1a"]],
    [/^全历史第 (.+) 百分位$/, ["$1th percentile, all history", "$1e percentile (historique)", "$1. Perzentil (gesamt)", "Percentil $1 (histórico)"]],
    [/^1871 年来第 (.+) 百分位$/, ["$1th percentile since 1871", "$1e percentile depuis 1871", "$1. Perzentil seit 1871", "Percentil $1 desde 1871"]],
    [/^自身 (\d{4})→ 第 (.+) 百分位$/, ["$2th percentile since $1", "$2e percentile depuis $1", "$2. Perzentil seit $1", "Percentil $2 desde $1"]],
    [/^约 (\d{4}) 年以来$/, ["since ~$1", "depuis ~$1", "seit ca. $1", "desde ~$1"]],
    [/^历史均值 (.+)$/, ["Mean $1", "Moyenne $1", "Mittel $1", "Media $1"]],
    [/^均值 (.+)$/, ["Mean $1", "Moyenne $1", "Mittel $1", "Media $1"]],
    [/^中位 (.+)$/, ["Median $1", "Médiane $1", "Median $1", "Mediana $1"]],
    [/^全历史中位 (.+)$/, ["All-history median $1", "Médiane historique $1", "Gesamtmedian $1", "Mediana histórica $1"]],
    [/^近50年中位 (.+)$/, ["50y median $1", "Médiane 50 ans $1", "50J-Median $1", "Mediana 50a $1"]],
    [/^2010→中位 (.+)$/, ["2010→ median $1", "Médiane 2010→ $1", "Median 2010→ $1", "Mediana 2010→ $1"]],
    [/^(VIX|VXN) = 30 · 保费警戒线$/, ["$1 = 30 · premium alert", "$1 = 30 · alerte prime", "$1 = 30 · Prämienalarm", "$1 = 30 · alerta de prima"]],
    [/^美股编年史 · 自用版 · 数据更新于 (.+)$/, ["Market Chronicle · personal edition · data updated $1", "Market Chronicle · données mises à jour le $1", "Market Chronicle · Daten aktualisiert am $1", "Market Chronicle · datos actualizados el $1"]],
    [/^· 数据源：.+$/, ["· Data: Yahoo Finance / CNN Fear & Greed / multpl / FRED / macrotrends / Wikipedia · Personal research only — not investment advice",
      "· Données : Yahoo Finance / CNN / multpl / FRED / macrotrends / Wikipedia · Recherche personnelle — pas un conseil en investissement",
      "· Daten: Yahoo Finance / CNN / multpl / FRED / macrotrends / Wikipedia · Private Recherche — keine Anlageberatung",
      "· Datos: Yahoo Finance / CNN / multpl / FRED / macrotrends / Wikipedia · Investigación personal; no es asesoramiento"]],
    [/^实证结论：2020 年以来共 (\d+) 次信号。60 个交易日窗口胜率 (\d+)\/(\d+)（.+）。所有信号持有至今全部为正。历史规律不保证未来。$/,
      ["Empirical result: $1 signals since 2020; 60-trading-day win rate $2/$3 (near-perfect in V-shaped corrections; the 2021–22 bear market fired repeated signals with negative short windows). All signals are positive held to date. Past patterns do not guarantee the future.",
       "Résultat empirique : $1 signaux depuis 2020 ; taux de gain à 60 jours $2/$3. Tous les signaux sont positifs à ce jour. Le passé ne garantit pas l'avenir.",
       "Empirisches Ergebnis: $1 Signale seit 2020; 60-Tage-Gewinnquote $2/$3. Alle Signale bis heute positiv. Vergangenheit garantiert keine Zukunft.",
       "Resultado empírico: $1 señales desde 2020; tasa de acierto a 60 días $2/$3. Todas positivas hasta hoy. El pasado no garantiza el futuro."]],
    [/^实证结论：(\d+) 次窗口中，12 个月视界 NDX 胜率 (\d+)\/(\d+)、SPX 胜率 (\d+)\/(\d+)。.+$/,
      ["Empirical result: of $1 windows, 12-month NDX win rate $2/$3 and SPX $4/$5. Note the late-2021 windows: extreme fear during a topping market was not the bottom — still negative 12 months on. Fear gauges mark sentiment extremes, not valuation floors; cross-check with the K-Index. Past patterns do not guarantee the future.",
       "Résultat : sur $1 fenêtres, taux de gain NDX à 12 mois $2/$3, SPX $4/$5. Les fenêtres fin 2021 n'étaient pas un plancher. À croiser avec l'indice K.",
       "Ergebnis: von $1 Fenstern NDX-12-Monats-Quote $2/$3, SPX $4/$5. Die Fenster Ende 2021 waren kein Boden. Mit dem K-Index gegenprüfen.",
       "Resultado: de $1 ventanas, acierto NDX a 12 meses $2/$3 y SPX $4/$5. Las ventanas de finales de 2021 no fueron suelo. Contrastar con el índice K."]],
    [/^口径说明：PE\(TTM\) 与 CAPE 来自 multpl\/席勒月度数据（(\d+) 年起），.+数据截至 (.+)。$/,
      ["Methodology: PE(TTM) and CAPE from multpl/Shiller monthly data (since $1); percentile = today's reading within all history. The three medians are three eras' gravity anchors — the farther from an anchor, the more stretched the elastic. Data as of $2.",
       "Méthodologie : PER et CAPE via multpl/Shiller (depuis $1) ; percentile = position actuelle dans l'historique. Données au $2.",
       "Methodik: KGV und CAPE via multpl/Shiller (seit $1); Perzentil = heutige Position in der Gesamthistorie. Stand: $2.",
       "Metodología: PER y CAPE de multpl/Shiller (desde $1); percentil = posición actual en el histórico. Datos a $2."]],
  ];

  // 精简为两种语言：简体（你与核心读者）+ English（全球 / LLM / GitHub 门面）。
  // 词典数组仍是 [en, fr, de, es]，只用到 en 那一列；繁/FR/DE/ES 已下架。
  const LANG_META = {
    zh: { label: "简", html: "zh-CN" },
    en: { label: "EN", html: "en" },
  };
  const COL = { en: 0 };

  let cur = localStorage.getItem("mc-lang") || "zh";
  if (!LANG_META[cur]) cur = "zh"; // 旧访客存了繁/法/德/西，回退简体
  let twConv = null;

  function ensureOpenCC() {
    if (twConv) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.js";
      s.onload = () => { twConv = OpenCC.Converter({ from: "cn", to: "twp" }); resolve(); };
      s.onerror = () => resolve(); // 加载失败则繁体退回简体
      document.head.appendChild(s);
    });
  }

  const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五"];
  const CHAPTER_WORD = { en: "Chapter", fr: "Chapitre", de: "Kapitel", es: "Capítulo" };

  function translate(src) {
    if (cur === "zh") return src;
    const t = src.trim();
    if (!t || !/[一-鿿]/.test(t)) return src; // 无中文不处理
    if (cur === "tw") return twConv ? twConv(src) : src;
    const ch = t.match(/^第(.+)章$/); // "第N章" 动态编号（中文数字或阿拉伯数字）
    if (ch) {
      const n = /^\d+$/.test(ch[1]) ? parseInt(ch[1], 10) : CN_NUM.indexOf(ch[1]) + 1;
      if (n > 0) return src.replace(t, CHAPTER_WORD[cur] + " " + n);
    }
    const entry = D[t];
    if (entry && entry[COL[cur]]) return src.replace(t, entry[COL[cur]]);
    for (const [re, out] of P) { // 带数字的动态句式
      if (re.test(t) && out[COL[cur]]) return src.replace(t, t.replace(re, out[COL[cur]]));
    }
    return src;
  }

  function applyTo(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const tag = n.parentElement && n.parentElement.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") continue;
      if (n.__zh === undefined) n.__zh = n.nodeValue;
      const out = translate(n.__zh);
      if (n.nodeValue !== out) n.nodeValue = out;
    }
  }

  // 动态渲染的内容（表格、卡片、tooltip）自动跟随当前语言
  const mo = new MutationObserver((muts) => {
    if (cur === "zh") return;
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) applyTo(node);
        else if (node.nodeType === 3) {
          if (node.__zh === undefined) node.__zh = node.nodeValue;
          node.nodeValue = translate(node.__zh);
        }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // 对外 API：app.js 用它翻译 ECharts 配置、并在语言切换时重建图表
  const changeCbs = [];
  window.MC_I18N = {
    lang: () => cur,
    translate,
    onChange: (cb) => changeCbs.push(cb),
    ready: cur === "tw" ? ensureOpenCC() : Promise.resolve(),
  };

  const host = document.getElementById("lang-switch");
  function renderSwitch() {
    host.innerHTML = Object.entries(LANG_META).map(([k, m]) =>
      `<span class="${k === cur ? "active" : ""}" data-lang="${k}">${m.label}</span>`
    ).join('<span class="sep">·</span>');
  }
  host.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-lang]");
    if (!el || el.dataset.lang === cur) return;
    cur = el.dataset.lang;
    localStorage.setItem("mc-lang", cur);
    document.documentElement.lang = LANG_META[cur].html;
    if (cur === "tw") await ensureOpenCC();
    renderSwitch();
    applyTo(document.body);
    changeCbs.forEach((cb) => cb(cur)); // 图表等 canvas 内容重建
  });

  renderSwitch();
  if (cur !== "zh") {
    window.MC_I18N.ready.then(() => applyTo(document.body));
    document.documentElement.lang = LANG_META[cur].html;
  }
})();
