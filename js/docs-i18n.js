/* 页脚静态页（关于/联系/隐私/条款/退款/定价）多语言内容。
   简体在 index.html 里；繁体由 i18n 的 opencc 自动转换（还原简体原文后，
   MutationObserver 会 opencc 转繁）；英/法/德/西用下面整段译文替换。 */
(function () {
  "use strict";
  const IDS = ["about", "contact", "privacy", "terms", "refunds", "pricing"];
  const EMAIL = "klaywang24+marketchronicle@gmail.com";

  // 各平台品牌图标（inline SVG，随文本色，各语言通用）
  const ICON = {
    email: '<svg class="c-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>',
    x: '<svg class="c-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    github: '<svg class="c-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    discord: '<svg class="c-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
  };

  // 联系页正文按语言拼装（图标+链接不变，仅文案变）
  const contactBody = (t) =>
    `<ul class="contact-list">
      <li><span class="c-icon">${ICON.email}</span><span class="c-label">${t.email}</span><a href="mailto:${EMAIL}">${EMAIL}</a></li>
      <li><span class="c-icon">${ICON.x}</span><span class="c-label">X</span><a href="https://x.com/_Klay24_" target="_blank" rel="noopener">@_Klay24_</a></li>
      <li><span class="c-icon">${ICON.github}</span><span class="c-label">GitHub</span><a href="https://github.com/klaywang24/market-chronicle" target="_blank" rel="noopener">klaywang24/market-chronicle</a> · ${t.issues}</li>
      <li><span class="c-icon">${ICON.discord}</span><span class="c-label">Discord</span><a href="https://discord.gg/MnMEZg7Kx2" target="_blank" rel="noopener">${t.join}</a> · ${t.channels}</li>
    </ul>`;

  const DOC_TR = {
    about: {
      en: { kicker: "ABOUT", h1: "About Market Chronicle",
        dek: "A free, open-source archive of US market history that updates automatically after every trading day's close — no ads. A century of markets, turned into a chronicle you can read.",
        body: `<h3>What it is</h3>
<p>Market Chronicle organizes the history of the S&amp;P 500, the Nasdaq, and baskets such as financials, consumer and luxury into a chapter-by-chapter visual record: the shape of returns, the rhythm of crises, the anchors of valuation, the texture of volatility, the compounding of time. Beyond the long-history charts, three original lenses — the "Today's Front Page" market temperature, the "K-Index", and the "LEAPS Window".</p>
<h3>Data &amp; methodology</h3>
<p>Prices and returns approximate total return using adjusted close; CAPE / PE(TTM) come from multpl / Robert Shiller's long series; the Fear &amp; Greed reading is from CNN; company fundamentals from macrotrends and Yahoo Finance; the daily sector heatmap is TradingView's live data. Long-history charts mostly use a log scale so that century-scale moves read honestly — 1929 fell far more than 2000 or 2008, so it should look steeper. That is the data being truthful.</p>
<h3>How it's built</h3>
<p>This site was built by one person + AI, hosted as pure static files on GitHub Pages — no server, no database. The data pipeline (Python, yfinance / pandas + GitHub Actions) pulls data, computes metrics, commits and redeploys automatically after each trading day's close. The code is open-source under Apache-2.0.</p>
<h3>Disclaimer, in one line</h3>
<p>Everything here is for information and education only and <strong>does not constitute investment advice</strong>. Markets carry risk; make your own decisions.</p>` },
      fr: { kicker: "À PROPOS", h1: "À propos de Market Chronicle",
        dek: "Une archive libre et open source de l'histoire des marchés américains, mise à jour automatiquement après chaque clôture — sans publicité. Un siècle de marchés, transformé en une chronique qui se lit.",
        body: `<h3>Qu'est-ce que c'est</h3>
<p>Market Chronicle organise l'histoire du S&amp;P 500, du Nasdaq et de paniers tels que la finance, la consommation et le luxe en un récit visuel chapitre par chapitre : la forme des rendements, le rythme des crises, les ancres de valorisation, la texture de la volatilité, la capitalisation du temps. Au-delà des graphiques historiques, trois angles originaux — la « température du marché » de la Une du jour, l'« indice K » et la « fenêtre LEAPS ».</p>
<h3>Données et méthodologie</h3>
<p>Les prix et rendements approchent le rendement total via le cours ajusté ; le CAPE / PER (TTM) provient des longues séries de multpl / Robert Shiller ; l'indice Fear &amp; Greed vient de CNN ; les fondamentaux d'entreprise de macrotrends et Yahoo Finance ; la carte thermique sectorielle quotidienne utilise les données en direct de TradingView. Les graphiques de longue durée utilisent surtout une échelle logarithmique pour représenter honnêtement les mouvements à l'échelle du siècle — 1929 a bien plus chuté que 2000 ou 2008, il doit donc paraître plus abrupt. C'est la vérité des données.</p>
<h3>Comment c'est construit</h3>
<p>Ce site a été construit par une personne + IA, hébergé en fichiers statiques sur GitHub Pages — sans serveur ni base de données. Le pipeline de données (Python, yfinance / pandas + GitHub Actions) récupère les données, calcule les indicateurs, publie et redéploie automatiquement après chaque clôture. Le code est open source sous Apache-2.0.</p>
<h3>Avertissement, en une ligne</h3>
<p>Tout ici est fourni à titre d'information et d'éducation et <strong>ne constitue pas un conseil en investissement</strong>. Les marchés comportent des risques ; décidez par vous-même.</p>` },
      de: { kicker: "ÜBER UNS", h1: "Über Market Chronicle",
        dek: "Ein kostenloses, quelloffenes Archiv der US-Marktgeschichte, das nach jedem Handelsschluss automatisch aktualisiert wird — werbefrei. Ein Jahrhundert Märkte, als lesbare Chronik.",
        body: `<h3>Was das ist</h3>
<p>Market Chronicle ordnet die Geschichte des S&amp;P 500, der Nasdaq und von Körben wie Finanzwerten, Konsum und Luxus zu einer kapitelweisen visuellen Chronik: die Form der Renditen, der Rhythmus der Krisen, die Anker der Bewertung, die Textur der Volatilität, der Zinseszins der Zeit. Neben den Langzeit-Charts drei eigene Perspektiven — die „Markttemperatur" der heutigen Titelseite, der „K-Index" und das „LEAPS-Fenster".</p>
<h3>Daten &amp; Methodik</h3>
<p>Kurse und Renditen nähern die Gesamtrendite über den bereinigten Schlusskurs an; CAPE / KGV (TTM) stammen aus den langen Reihen von multpl / Robert Shiller; der Fear-&amp;-Greed-Wert von CNN; Unternehmensfundamentaldaten von macrotrends und Yahoo Finance; die tägliche Sektor-Heatmap nutzt Live-Daten von TradingView. Langzeit-Charts verwenden meist eine logarithmische Skala, damit Bewegungen über Jahrhunderte ehrlich erscheinen — 1929 fiel weit stärker als 2000 oder 2008 und sollte daher steiler aussehen. Das ist die Ehrlichkeit der Daten.</p>
<h3>Wie es entsteht</h3>
<p>Diese Seite wurde von einer Person + KI gebaut, als reine statische Dateien auf GitHub Pages gehostet — ohne Server, ohne Datenbank. Die Datenpipeline (Python, yfinance / pandas + GitHub Actions) holt Daten, berechnet Kennzahlen, committet und deployt nach jedem Handelsschluss automatisch neu. Der Code ist unter Apache-2.0 quelloffen.</p>
<h3>Haftungsausschluss, in einer Zeile</h3>
<p>Alles hier dient nur der Information und Bildung und <strong>stellt keine Anlageberatung dar</strong>. Märkte bergen Risiken; treffen Sie eigene Entscheidungen.</p>` },
      es: { kicker: "ACERCA DE", h1: "Acerca de Market Chronicle",
        dek: "Un archivo gratuito y de código abierto de la historia del mercado estadounidense, actualizado automáticamente tras cada cierre — sin anuncios. Un siglo de mercados, convertido en una crónica para leer.",
        body: `<h3>Qué es</h3>
<p>Market Chronicle organiza la historia del S&amp;P 500, el Nasdaq y cestas como financieras, consumo y lujo en un relato visual por capítulos: la forma de los rendimientos, el ritmo de las crisis, las anclas de valoración, la textura de la volatilidad, la capitalización del tiempo. Más allá de los gráficos históricos, tres enfoques propios — la «temperatura del mercado» de la portada del día, el «índice K» y la «ventana LEAPS».</p>
<h3>Datos y metodología</h3>
<p>Los precios y rendimientos aproximan el rendimiento total con el cierre ajustado; el CAPE / PER (TTM) proviene de las largas series de multpl / Robert Shiller; el índice Fear &amp; Greed es de CNN; los fundamentales de empresa de macrotrends y Yahoo Finance; el mapa de calor sectorial diario usa datos en vivo de TradingView. Los gráficos de largo plazo usan sobre todo escala logarítmica para mostrar con honestidad los movimientos a escala de siglo — 1929 cayó mucho más que 2000 o 2008, así que debe verse más pronunciado. Es la honestidad de los datos.</p>
<h3>Cómo está hecho</h3>
<p>Este sitio lo construyó una persona + IA, alojado como archivos estáticos en GitHub Pages — sin servidor ni base de datos. El proceso de datos (Python, yfinance / pandas + GitHub Actions) descarga datos, calcula métricas, publica y redespliega automáticamente tras cada cierre. El código es de código abierto bajo Apache-2.0.</p>
<h3>Aviso, en una línea</h3>
<p>Todo aquí es solo con fines informativos y educativos y <strong>no constituye asesoramiento de inversión</strong>. Los mercados implican riesgo; decide por tu cuenta.</p>` },
    },

    contact: {
      en: { kicker: "CONTACT", h1: "Contact",
        dek: "Data issues, feature ideas, collaboration — reach out anytime.",
        body: contactBody({ email: "Email", issues: "bugs &amp; ideas via Issues", join: "Join Discord", channels: "daily front-page bot · market chat · LEAPS talk" }) },
      fr: { kicker: "CONTACT", h1: "Contact",
        dek: "Problèmes de données, idées de fonctionnalités, collaboration — écrivez quand vous voulez.",
        body: contactBody({ email: "E-mail", issues: "bugs &amp; idées via Issues", join: "Rejoindre Discord", channels: "bot Une quotidienne · discussion marché · LEAPS" }) },
      de: { kicker: "KONTAKT", h1: "Kontakt",
        dek: "Datenfehler, Funktionsideen, Kooperation — melden Sie sich jederzeit.",
        body: contactBody({ email: "E-Mail", issues: "Bugs &amp; Ideen via Issues", join: "Discord beitreten", channels: "täglicher Titel-Bot · Markt-Chat · LEAPS" }) },
      es: { kicker: "CONTACTO", h1: "Contacto",
        dek: "Problemas de datos, ideas de funciones, colaboración — escribe cuando quieras.",
        body: contactBody({ email: "Correo", issues: "errores e ideas vía Issues", join: "Unirse a Discord", channels: "bot de portada diaria · charla de mercado · LEAPS" }) },
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
      fr: { kicker: "CONFIDENTIALITÉ", h1: "Politique de confidentialité", dek: "Dernière mise à jour : 2026-07-05",
        body: `<p class="doc-fineprint">Cette page est une information de conformité, non un avis juridique.</p>
<h3>Aperçu et exploitant</h3>
<p>Ce site est purement statique, hébergé sur GitHub Pages, sans comptes ni backend serveur. Il est exploité par un particulier (le responsable du traitement). Pour toute demande, écrivez à <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
<h3>Quelles données, sur quelle base</h3>
<p>Nous ne collectons aucune information personnelle que vous soumettez. Les seules données éventuellement concernées sont :</p>
<ul>
<li><strong>Journaux d'accès serveur</strong> : en vous servant les pages, l'hébergeur (GitHub) peut enregistrer des informations techniques telles que votre IP et votre user-agent (base : intérêt légitime à fournir le service). Ces journaux sont détenus et contrôlés par GitHub ; nous n'y avons pas accès en détail.</li>
<li><strong>Stockage local du navigateur</strong> : uniquement pour mémoriser votre « thème jour/nuit » et votre « langue » — fonctionnellement nécessaire, stocké sur votre appareil, jamais transmis, sans information vous identifiant.</li>
</ul>
<h3>Cookies</h3>
<p>Nous <strong>ne déposons aucun cookie de suivi et n'utilisons aucune analyse maison</strong>. Les composants tiers ci-dessous (notamment TradingView) peuvent déposer leurs propres cookies ; vous pouvez les bloquer ou les effacer dans votre navigateur.</p>
<h3>Tiers et transferts internationaux</h3>
<p>Le chargement d'une page envoie des requêtes aux tiers suivants, susceptibles de transférer votre IP et données techniques hors de votre région (États-Unis compris). Leurs politiques de confidentialité s'appliquent et nous ne contrôlons pas leur traitement :</p>
<ul>
<li>Google Fonts (fonts.googleapis.com) — polices ;</li>
<li>TradingView (tradingview.com) — widget de carte thermique, peut déposer ses cookies ;</li>
<li>parqet (assets.parqet.com) — logos d'entreprises ;</li>
<li>GitHub Pages (github.io) — hébergeur du site.</li>
</ul>
<h3>Ce que nous ne faisons pas</h3>
<p>Nous <strong>ne vendons, ne louons ni n'échangeons vos informations personnelles</strong> (y compris toute « vente / partage » au sens du CCPA californien), et ne faisons pas de publicité ciblée.</p>
<h3>Vos droits</h3>
<p>Selon la loi applicable (RGPD de l'UE, UK-GDPR, CCPA/CPRA de Californie), vous pouvez disposer de droits d'accès, de rectification, d'effacement, de limitation ou d'opposition, et de portabilité. Comme nous ne détenons quasiment aucune donnée vous identifiant, la plupart des demandes se règlent en effaçant vos données de navigation ; si besoin, écrivez-nous et nous répondrons dans un délai raisonnable. Vous pouvez aussi saisir votre autorité locale de protection des données.</p>
<h3>Enfants</h3>
<p>Ce site ne s'adresse pas aux enfants de moins de 13 ans et nous ne collectons pas sciemment leurs informations.</p>
<h3>Modifications et contact</h3>
<p>Toute mise à jour sera signalée par une date en haut de page. Pour toute question, écrivez à <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>` },
      de: { kicker: "DATENSCHUTZ", h1: "Datenschutzerklärung", dek: "Zuletzt aktualisiert: 2026-07-05",
        body: `<p class="doc-fineprint">Diese Seite ist ein Compliance-Hinweis, keine Rechtsberatung.</p>
<h3>Überblick &amp; Betreiber</h3>
<p>Dies ist eine rein statische Website auf GitHub Pages, ohne Konten und ohne Server-Backend. Betrieben von einer Einzelperson (dem Verantwortlichen). Für Datenschutzanfragen: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
<h3>Welche Daten, auf welcher Grundlage</h3>
<p>Wir erheben keine von Ihnen übermittelten personenbezogenen Daten. Betroffen sein können nur:</p>
<ul>
<li><strong>Server-Zugriffsprotokolle</strong>: Beim Ausliefern der Seiten kann der Hoster (GitHub) technische Informationen wie Ihre IP und den Browser-User-Agent erfassen (Grundlage: berechtigtes Interesse an der Bereitstellung des Dienstes). Diese Protokolle liegen bei GitHub; wir haben keinen Einblick in Einzelheiten.</li>
<li><strong>Lokaler Browser-Speicher</strong>: nur um „Tag-/Nachtmodus" und „Sprache" zu merken — funktional notwendig, auf Ihrem Gerät gespeichert, nie übertragen, ohne Sie identifizierende Angaben.</li>
</ul>
<h3>Cookies</h3>
<p>Wir <strong>setzen keine eigenen Tracking-Cookies und betreiben keine eigene Analyse</strong>. Die untenstehenden Drittkomponenten (v.a. TradingView) können eigene Cookies setzen; Sie können diese im Browser blockieren oder löschen.</p>
<h3>Dritte &amp; internationale Übermittlung</h3>
<p>Das Laden einer Seite sendet Anfragen an folgende Dritte, die Ihre IP und ähnliche technische Daten an Server außerhalb Ihrer Region (auch in die USA) übermitteln können. Deren Datenschutzerklärungen gelten; ihre Verarbeitung kontrollieren wir nicht:</p>
<ul>
<li>Google Fonts (fonts.googleapis.com) — Schriften;</li>
<li>TradingView (tradingview.com) — Heatmap-Widget, kann eigene Cookies setzen;</li>
<li>parqet (assets.parqet.com) — Firmenlogos;</li>
<li>GitHub Pages (github.io) — Website-Hoster.</li>
</ul>
<h3>Was wir nicht tun</h3>
<p>Wir <strong>verkaufen, vermieten oder handeln nicht mit Ihren personenbezogenen Daten</strong> (einschließlich eines „Verkaufs / Teilens" nach dem kalifornischen CCPA) und betreiben keine zielgerichtete Werbung.</p>
<h3>Ihre Rechte</h3>
<p>Nach geltendem Recht (EU-DSGVO, UK-GDPR, kalifornisches CCPA/CPRA) haben Sie ggf. Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung oder Widerspruch sowie auf Datenübertragbarkeit. Da wir kaum Sie identifizierende Daten halten, lassen sich die meisten Anliegen durch Löschen Ihrer Browserdaten erfüllen; benötigen Sie Hilfe, schreiben Sie uns, wir antworten in angemessener Frist. Sie können sich zudem bei Ihrer Datenschutzbehörde beschweren.</p>
<h3>Kinder</h3>
<p>Diese Seite richtet sich nicht an Kinder unter 13 Jahren; wir erheben deren Daten nicht wissentlich.</p>
<h3>Änderungen &amp; Kontakt</h3>
<p>Jede Aktualisierung wird oben mit Datum vermerkt. Bei Fragen: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>` },
      es: { kicker: "PRIVACIDAD", h1: "Política de privacidad", dek: "Última actualización: 2026-07-05",
        body: `<p class="doc-fineprint">Esta página es un aviso de cumplimiento, no asesoramiento jurídico.</p>
<h3>Resumen y operador</h3>
<p>Este es un sitio puramente estático alojado en GitHub Pages, sin cuentas ni backend. Lo opera una persona (el responsable del tratamiento). Para cualquier solicitud, escribe a <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
<h3>Qué datos y con qué base</h3>
<p>No recopilamos información personal que envíes. Los únicos datos que pueden intervenir son:</p>
<ul>
<li><strong>Registros de acceso del servidor</strong>: al servirte las páginas, el proveedor (GitHub) puede registrar información técnica como tu IP y user-agent (base: interés legítimo en prestar el servicio). Estos registros los tiene y controla GitHub; no accedemos a su detalle.</li>
<li><strong>Almacenamiento local del navegador</strong>: solo para recordar tu «tema día/noche» e «idioma» — funcionalmente necesario, guardado en tu dispositivo, nunca enviado, sin datos que te identifiquen.</li>
</ul>
<h3>Cookies</h3>
<p>No <strong>colocamos cookies de seguimiento propias ni usamos analítica propia</strong>. Los componentes de terceros de abajo (sobre todo TradingView) pueden colocar sus cookies; puedes bloquearlas o borrarlas en tu navegador.</p>
<h3>Terceros y transferencias internacionales</h3>
<p>Cargar una página realiza solicitudes a los siguientes terceros, que pueden transferir tu IP y datos técnicos fuera de tu región (incluido EE. UU.). Se aplican sus políticas y no controlamos su tratamiento:</p>
<ul>
<li>Google Fonts (fonts.googleapis.com) — tipografías;</li>
<li>TradingView (tradingview.com) — widget del mapa de calor, puede colocar sus cookies;</li>
<li>parqet (assets.parqet.com) — logos de empresas;</li>
<li>GitHub Pages (github.io) — alojamiento del sitio.</li>
</ul>
<h3>Lo que no hacemos</h3>
<p>No <strong>vendemos, alquilamos ni intercambiamos tu información personal</strong> (incluida cualquier «venta / compartición» según la CCPA de California), ni hacemos publicidad dirigida.</p>
<h3>Tus derechos</h3>
<p>Según la ley aplicable (RGPD de la UE, UK-GDPR, CCPA/CPRA de California) puedes tener derechos de acceso, rectificación, supresión, limitación u oposición, y portabilidad. Como apenas guardamos datos que te identifiquen, la mayoría de solicitudes se resuelven borrando los datos de tu navegador; si necesitas ayuda, escríbenos y responderemos en un plazo razonable. También puedes reclamar ante tu autoridad de protección de datos.</p>
<h3>Menores</h3>
<p>Este sitio no se dirige a menores de 13 años y no recopilamos su información a sabiendas.</p>
<h3>Cambios y contacto</h3>
<p>Toda actualización se indicará con una fecha al inicio de la página. Para dudas: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>` },
    },

    terms: {
      en: { kicker: "TERMS", h1: "Terms of Service", dek: "Last updated: 2026-07-05",
        body: `<h3>Acceptance</h3>
<p>By accessing or using this site, you agree to the terms below.</p>
<h3>Purpose &amp; not investment advice</h3>
<p>All content is for information and education only and <strong>does not constitute investment, financial, legal or tax advice</strong>. Any data may be delayed, inaccurate or incomplete; do not rely on it alone for trading or investment decisions.</p>
<h3>No warranty</h3>
<p>The site is provided "as is" and "as available", without any express or implied warranty as to accuracy, completeness, availability or fitness for a particular purpose.</p>
<h3>Limitation of liability</h3>
<p>To the maximum extent permitted by law, we are not liable for any direct or indirect loss arising from your use of, or inability to use, this site.</p>
<h3>Intellectual property &amp; third parties</h3>
<p>The site's code is open source under Apache-2.0 (see the GitHub repo); charts and copy are for personal, non-commercial reference. Embedded third-party components (such as TradingView) are governed by their own terms.</p>
<h3>Paid products &amp; billing</h3>
<p>When paid subscriptions (such as LEAPS Pro) launch, checkout, invoicing and taxes will be handled by <strong>Paddle as the Merchant of Record</strong> — meaning your payment contract is with Paddle, and its terms and privacy policy also apply. Purchasers must be 18 or the age of majority in their jurisdiction. Refunds follow our Refund Policy.</p>
<h3>Governing law &amp; severability</h3>
<p>These terms are governed by the law of the operator's jurisdiction (to be specified as operations formalize). If any provision is held invalid, the rest remain in effect. These terms are the entire agreement between you and us regarding use of the site.</p>
<h3>Changes</h3>
<p>We may update these terms at any time; continued use after an update means acceptance.</p>` },
      fr: { kicker: "CONDITIONS", h1: "Conditions d'utilisation", dek: "Dernière mise à jour : 2026-07-05",
        body: `<h3>Acceptation</h3>
<p>En accédant au site ou en l'utilisant, vous acceptez les conditions ci-dessous.</p>
<h3>Objet et absence de conseil</h3>
<p>Tout le contenu est fourni à titre d'information et d'éducation et <strong>ne constitue pas un conseil en investissement, financier, juridique ou fiscal</strong>. Les données peuvent être différées, inexactes ou incomplètes ; ne vous y fiez pas seul pour vos décisions.</p>
<h3>Absence de garantie</h3>
<p>Le site est fourni « en l'état » et « selon disponibilité », sans garantie expresse ou implicite d'exactitude, d'exhaustivité, de disponibilité ou d'adéquation à un usage particulier.</p>
<h3>Limitation de responsabilité</h3>
<p>Dans la mesure permise par la loi, nous ne sommes pas responsables des pertes directes ou indirectes liées à l'utilisation ou à l'impossibilité d'utiliser ce site.</p>
<h3>Propriété intellectuelle et tiers</h3>
<p>Le code du site est open source sous Apache-2.0 (voir le dépôt GitHub) ; graphiques et textes sont pour un usage personnel non commercial. Les composants tiers intégrés (comme TradingView) relèvent de leurs propres conditions.</p>
<h3>Produits payants et facturation</h3>
<p>Au lancement d'abonnements payants (comme LEAPS Pro), le paiement, la facturation et les taxes seront gérés par <strong>Paddle en tant que Merchant of Record</strong> — votre contrat de paiement est donc avec Paddle, dont les conditions et la politique de confidentialité s'appliquent aussi. L'acheteur doit avoir 18 ans ou l'âge de la majorité locale. Les remboursements suivent notre Politique de remboursement.</p>
<h3>Droit applicable et divisibilité</h3>
<p>Ces conditions sont régies par le droit de la juridiction de l'exploitant (à préciser lors de la formalisation). Si une clause est jugée invalide, les autres restent en vigueur. Ces conditions constituent l'intégralité de l'accord entre vous et nous.</p>
<h3>Modifications</h3>
<p>Nous pouvons mettre à jour ces conditions à tout moment ; poursuivre l'utilisation vaut acceptation.</p>` },
      de: { kicker: "AGB", h1: "Nutzungsbedingungen", dek: "Zuletzt aktualisiert: 2026-07-05",
        body: `<h3>Annahme</h3>
<p>Mit dem Zugriff auf die Seite oder ihrer Nutzung stimmen Sie den folgenden Bedingungen zu.</p>
<h3>Zweck &amp; keine Anlageberatung</h3>
<p>Alle Inhalte dienen nur der Information und Bildung und <strong>stellen keine Anlage-, Finanz-, Rechts- oder Steuerberatung dar</strong>. Daten können verzögert, fehlerhaft oder unvollständig sein; verlassen Sie sich für Entscheidungen nicht allein darauf.</p>
<h3>Keine Gewährleistung</h3>
<p>Die Seite wird „wie besehen" und „wie verfügbar" bereitgestellt, ohne ausdrückliche oder stillschweigende Gewähr für Richtigkeit, Vollständigkeit, Verfügbarkeit oder Eignung für einen bestimmten Zweck.</p>
<h3>Haftungsbeschränkung</h3>
<p>Soweit gesetzlich zulässig, haften wir nicht für direkte oder indirekte Schäden aus der Nutzung oder Nichtnutzbarkeit dieser Seite.</p>
<h3>Geistiges Eigentum &amp; Dritte</h3>
<p>Der Code ist unter Apache-2.0 quelloffen (siehe GitHub-Repo); Charts und Texte dienen dem persönlichen, nicht-kommerziellen Gebrauch. Eingebettete Drittkomponenten (etwa TradingView) unterliegen deren eigenen Bedingungen.</p>
<h3>Bezahlprodukte &amp; Abrechnung</h3>
<p>Beim Start kostenpflichtiger Abos (etwa LEAPS Pro) übernimmt <strong>Paddle als Merchant of Record</strong> Checkout, Rechnung und Steuern — Ihr Zahlungsvertrag besteht also mit Paddle, dessen Bedingungen und Datenschutz ebenfalls gelten. Käufer müssen 18 Jahre oder volljährig nach ihrem Recht sein. Erstattungen richten sich nach unserer Erstattungsrichtlinie.</p>
<h3>Anwendbares Recht &amp; Salvatorische Klausel</h3>
<p>Diese Bedingungen unterliegen dem Recht der Gerichtsbarkeit des Betreibers (wird bei Formalisierung präzisiert). Ist eine Bestimmung unwirksam, bleiben die übrigen wirksam. Diese Bedingungen sind die vollständige Vereinbarung zwischen Ihnen und uns.</p>
<h3>Änderungen</h3>
<p>Wir können diese Bedingungen jederzeit aktualisieren; fortgesetzte Nutzung gilt als Zustimmung.</p>` },
      es: { kicker: "TÉRMINOS", h1: "Términos del servicio", dek: "Última actualización: 2026-07-05",
        body: `<h3>Aceptación</h3>
<p>Al acceder o usar este sitio, aceptas los términos siguientes.</p>
<h3>Finalidad y no es asesoramiento</h3>
<p>Todo el contenido es solo informativo y educativo y <strong>no constituye asesoramiento de inversión, financiero, jurídico ni fiscal</strong>. Los datos pueden estar retrasados, ser inexactos o incompletos; no te bases solo en ellos para decisiones.</p>
<h3>Sin garantías</h3>
<p>El sitio se ofrece «tal cual» y «según disponibilidad», sin garantía expresa o implícita de exactitud, integridad, disponibilidad o idoneidad para un fin.</p>
<h3>Limitación de responsabilidad</h3>
<p>En la medida permitida por la ley, no somos responsables de pérdidas directas o indirectas derivadas del uso o la imposibilidad de uso de este sitio.</p>
<h3>Propiedad intelectual y terceros</h3>
<p>El código es de código abierto bajo Apache-2.0 (ver el repo de GitHub); gráficos y textos son para referencia personal no comercial. Los componentes de terceros integrados (como TradingView) se rigen por sus propios términos.</p>
<h3>Productos de pago y facturación</h3>
<p>Cuando se lancen suscripciones de pago (como LEAPS Pro), el cobro, la facturación y los impuestos los gestionará <strong>Paddle como Merchant of Record</strong> — tu contrato de pago es con Paddle, cuyos términos y privacidad también aplican. El comprador debe tener 18 años o la mayoría de edad de su jurisdicción. Los reembolsos siguen nuestra Política de reembolso.</p>
<h3>Ley aplicable y divisibilidad</h3>
<p>Estos términos se rigen por la ley de la jurisdicción del operador (se concretará al formalizar la operación). Si una cláusula se declara inválida, las demás siguen vigentes. Estos términos son el acuerdo íntegro entre tú y nosotros.</p>
<h3>Cambios</h3>
<p>Podemos actualizar estos términos en cualquier momento; seguir usando el sitio implica aceptación.</p>` },
    },

    refunds: {
      en: { kicker: "REFUNDS", h1: "Refund Policy", dek: "Last updated: 2026-07-05",
        body: `<h3>Current status</h3>
<p>The site is currently <strong>entirely free</strong> with nothing for sale, so no refunds apply.</p>
<h3>Future paid products</h3>
<p>When paid subscriptions (such as LEAPS Pro daily pre-market intel) launch, the following applies:</p>
<ul>
<li><strong>14-day no-questions refund</strong>: if you're not satisfied within 14 days of subscribing, you get a full refund, no reason needed;</li>
<li>refunds are processed by the payment provider Paddle, returned via the original method;</li>
<li>how to request: email <a href="mailto:${EMAIL}">${EMAIL}</a> with your order details.</li>
</ul>
<p>This policy will be expanded when paid products formally launch.</p>` },
      fr: { kicker: "REMBOURSEMENTS", h1: "Politique de remboursement", dek: "Dernière mise à jour : 2026-07-05",
        body: `<h3>Statut actuel</h3>
<p>Le site est actuellement <strong>entièrement gratuit</strong>, sans rien à vendre ; aucun remboursement ne s'applique.</p>
<h3>Futurs produits payants</h3>
<p>Au lancement d'abonnements payants (comme l'info pré-marché quotidienne LEAPS Pro), ce qui suit s'applique :</p>
<ul>
<li><strong>Remboursement sous 14 jours sans justification</strong> : insatisfait dans les 14 jours suivant l'abonnement, vous êtes intégralement remboursé, sans raison à donner ;</li>
<li>les remboursements sont traités par le prestataire Paddle, par le moyen de paiement d'origine ;</li>
<li>demande : écrivez à <a href="mailto:${EMAIL}">${EMAIL}</a> avec vos détails de commande.</li>
</ul>
<p>Cette politique sera complétée au lancement officiel des produits payants.</p>` },
      de: { kicker: "ERSTATTUNGEN", h1: "Erstattungsrichtlinie", dek: "Zuletzt aktualisiert: 2026-07-05",
        body: `<h3>Aktueller Stand</h3>
<p>Die Seite ist derzeit <strong>vollständig kostenlos</strong>, es wird nichts verkauft; Erstattungen entfallen.</p>
<h3>Künftige Bezahlprodukte</h3>
<p>Beim Start kostenpflichtiger Abos (etwa LEAPS Pro, tägliche Vorbörsen-Infos) gilt Folgendes:</p>
<ul>
<li><strong>14-Tage-Erstattung ohne Nachfragen</strong>: bei Unzufriedenheit innerhalb von 14 Tagen nach Abschluss volle Rückerstattung, ohne Begründung;</li>
<li>Erstattungen werden vom Zahlungsdienstleister Paddle über die ursprüngliche Zahlungsart abgewickelt;</li>
<li>Antrag: E-Mail an <a href="mailto:${EMAIL}">${EMAIL}</a> mit Ihren Bestelldaten.</li>
</ul>
<p>Diese Richtlinie wird beim offiziellen Start der Bezahlprodukte ergänzt.</p>` },
      es: { kicker: "REEMBOLSOS", h1: "Política de reembolso", dek: "Última actualización: 2026-07-05",
        body: `<h3>Estado actual</h3>
<p>El sitio es actualmente <strong>totalmente gratuito</strong>, sin nada a la venta; no aplican reembolsos.</p>
<h3>Futuros productos de pago</h3>
<p>Cuando se lancen suscripciones de pago (como la información pre-mercado diaria LEAPS Pro), aplicará lo siguiente:</p>
<ul>
<li><strong>Reembolso de 14 días sin preguntas</strong>: si no quedas satisfecho dentro de los 14 días de suscribirte, reembolso completo, sin dar motivo;</li>
<li>los reembolsos los procesa el proveedor de pago Paddle, por el método original;</li>
<li>cómo solicitarlo: escribe a <a href="mailto:${EMAIL}">${EMAIL}</a> con los datos de tu pedido.</li>
</ul>
<p>Esta política se ampliará cuando los productos de pago se lancen oficialmente.</p>` },
    },

    pricing: {
      en: { kicker: "PRICING", h1: "Pricing", dek: "Right now: the whole site is free.",
        body: `<h3>Free</h3>
<p>All historical charts, Today's Front Page (market temperature), the K-Index, the LEAPS Window and the sector heatmap are <strong>free and open</strong> — no ads, no paywall, no sign-up.</p>
<h3>Coming soon: LEAPS Pro (daily pre-market intel)</h3>
<p>A paid subscription for options traders: LEAP ratio, average trade size, hottest contracts, and a market-wide ranking, delivered before the open every trading day. Price and launch date to be determined.</p>
<h3>Get early access</h3>
<p>To hear first when it launches, email <a href="mailto:${EMAIL}">${EMAIL}</a> with "LEAPS Pro" and we'll notify you and offer a founding-subscriber price.</p>
<p class="doc-fineprint">The "coming soon" items above are planning information, not a final commitment; the official launch prevails.</p>` },
      fr: { kicker: "TARIFS", h1: "Tarifs", dek: "Pour l'instant : tout le site est gratuit.",
        body: `<h3>Gratuit</h3>
<p>Tous les graphiques historiques, la Une du jour (température du marché), l'indice K, la fenêtre LEAPS et la carte thermique sectorielle sont <strong>gratuits et ouverts</strong> — sans publicité, sans péage, sans inscription.</p>
<h3>Bientôt : LEAPS Pro (info pré-marché quotidienne)</h3>
<p>Un abonnement payant pour les traders d'options : ratio LEAP, taille moyenne des ordres, contrats les plus actifs et un classement du marché entier, livrés avant l'ouverture chaque jour de bourse. Prix et date de lancement à déterminer.</p>
<h3>Accès anticipé</h3>
<p>Pour être prévenu en premier, écrivez à <a href="mailto:${EMAIL}">${EMAIL}</a> avec « LEAPS Pro » ; nous vous préviendrons et proposerons un tarif de membre fondateur.</p>
<p class="doc-fineprint">Les éléments « bientôt » ci-dessus sont indicatifs, non un engagement définitif ; le lancement officiel prévaut.</p>` },
      de: { kicker: "PREISE", h1: "Preise", dek: "Derzeit: die ganze Seite ist kostenlos.",
        body: `<h3>Kostenlos</h3>
<p>Alle historischen Charts, die heutige Titelseite (Markttemperatur), der K-Index, das LEAPS-Fenster und die Sektor-Heatmap sind <strong>kostenlos und offen</strong> — werbefrei, ohne Bezahlschranke, ohne Anmeldung.</p>
<h3>Bald: LEAPS Pro (tägliche Vorbörsen-Infos)</h3>
<p>Ein kostenpflichtiges Abo für Optionshändler: LEAP-Ratio, durchschnittliche Ordergröße, heißeste Kontrakte und ein marktweites Ranking, an jedem Handelstag vor der Eröffnung geliefert. Preis und Starttermin noch offen.</p>
<h3>Früher Zugang</h3>
<p>Um beim Start zuerst Bescheid zu wissen, mailen Sie „LEAPS Pro" an <a href="mailto:${EMAIL}">${EMAIL}</a>; wir benachrichtigen Sie und bieten einen Gründerpreis.</p>
<p class="doc-fineprint">Die „bald"-Angaben sind Planungsinformationen, keine endgültige Zusage; maßgeblich ist der offizielle Start.</p>` },
      es: { kicker: "PRECIOS", h1: "Precios", dek: "Ahora mismo: todo el sitio es gratis.",
        body: `<h3>Gratis</h3>
<p>Todos los gráficos históricos, la portada del día (temperatura del mercado), el índice K, la ventana LEAPS y el mapa de calor sectorial son <strong>gratuitos y abiertos</strong> — sin anuncios, sin muro de pago, sin registro.</p>
<h3>Próximamente: LEAPS Pro (información pre-mercado diaria)</h3>
<p>Una suscripción de pago para operadores de opciones: ratio LEAP, tamaño medio de operación, contratos más activos y un ranking de todo el mercado, entregado antes de la apertura cada día de bolsa. Precio y fecha de lanzamiento por determinar.</p>
<h3>Acceso anticipado</h3>
<p>Para enterarte el primero, escribe a <a href="mailto:${EMAIL}">${EMAIL}</a> con «LEAPS Pro» y te avisaremos con un precio de suscriptor fundador.</p>
<p class="doc-fineprint">Lo «próximamente» es información de planificación, no un compromiso definitivo; prevalece el lanzamiento oficial.</p>` },
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
