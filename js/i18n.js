/* 多语言：简体为源语言。繁体 = OpenCC 运行时转换（全覆盖）；
   EN/FR/DE/ES = 字典查表（界面骨架；图表内部文字与含动态数字的长句暂保留中文）。 */
(function () {
  "use strict";

  // 词条格式："简体原文": [EN, FR, DE, ES]
  const D = {
    // ---- 顶栏 tab ----
    "标普 500": ["S&P 500", "S&P 500", "S&P 500", "S&P 500"],
    "纳斯达克": ["Nasdaq", "Nasdaq", "Nasdaq", "Nasdaq"],
    "金融": ["Financials", "Finance", "Finanzen", "Finanzas"],
    "消费": ["Consumer", "Consommation", "Konsum", "Consumo"],
    "奢侈品": ["Luxury", "Luxe", "Luxus", "Lujo"],
    "K 指数": ["K-Index", "Indice K", "K-Index", "Índice K"],
    "LEAPS 窗口": ["LEAPS Window", "Fenêtre LEAPS", "LEAPS-Fenster", "Ventana LEAPS"],
    "宏观": ["Macro", "Macro", "Makro", "Macro"],
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
    "金融：钱的生意": ["Financials: The Business of Money", "Finance : le commerce de l'argent", "Finanzen: Das Geschäft mit dem Geld", "Finanzas: el negocio del dinero"],
    "银行、卡组织、投行、资管、券商与加密/稳定币，十三只龙头。先看板块的锚 XLF，再点个股名徐徐展开各自的历史。": [
      "Banks, card networks, investment banks, asset managers, brokers and crypto — 13 leaders. Start with XLF, then click any name to unfold its history.",
      "Banques, réseaux de cartes, banques d'affaires, gérants d'actifs, courtiers et crypto — 13 leaders. Commencez par XLF, puis cliquez sur un titre.",
      "Banken, Kartennetzwerke, Investmentbanken, Vermögensverwalter, Broker und Krypto — 13 Marktführer. Erst XLF, dann per Klick jede Aktie im Detail.",
      "Bancos, redes de tarjetas, banca de inversión, gestoras, brokers y cripto: 13 líderes. Empiece por XLF y pulse cada valor para ver su historia."],
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
    "等权拿着这十只，年景和回撤什么样？": ["Hold all ten equal-weighted — what do the years look like?", "Les dix équipondérés — quelles années, quels replis ?", "Alle zehn gleichgewichtet — wie liefen die Jahre?", "Las diez equiponderadas: ¿qué años y qué caídas?"],
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
    "标普 500 · 仅供个人研究": ["", "", "", ""],
    "仅供个人研究，不构成投资建议": ["Personal research only — not investment advice", "Recherche personnelle — pas un conseil en investissement", "Nur private Recherche — keine Anlageberatung", "Solo investigación personal; no es asesoramiento de inversión"],
    "数据源：Yahoo Finance / CNN Fear & Greed / multpl.com": ["Data: Yahoo Finance / CNN Fear & Greed / multpl.com", "Données : Yahoo Finance / CNN Fear & Greed / multpl.com", "Daten: Yahoo Finance / CNN Fear & Greed / multpl.com", "Datos: Yahoo Finance / CNN Fear & Greed / multpl.com"],
  };

  const LANG_META = {
    zh: { label: "简", html: "zh-CN" },
    tw: { label: "繁", html: "zh-TW" },
    en: { label: "EN", html: "en" },
    fr: { label: "FR", html: "fr" },
    de: { label: "DE", html: "de" },
    es: { label: "ES", html: "es" },
  };
  const COL = { en: 0, fr: 1, de: 2, es: 3 };

  let cur = localStorage.getItem("mc-lang") || "zh";
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
    const ch = t.match(/^第(.+)章$/); // "第N章" 动态编号
    if (ch) {
      const n = CN_NUM.indexOf(ch[1]) + 1;
      if (n > 0) return src.replace(t, CHAPTER_WORD[cur] + " " + n);
    }
    const entry = D[t];
    if (entry && entry[COL[cur]]) return src.replace(t, entry[COL[cur]]);
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
  });

  renderSwitch();
  if (cur !== "zh") {
    (cur === "tw" ? ensureOpenCC() : Promise.resolve()).then(() => applyTo(document.body));
    document.documentElement.lang = LANG_META[cur].html;
  }
})();
