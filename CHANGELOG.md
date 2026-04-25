# Mozkotron — Changelog

Chronologický přehled vývoje interní znalostní báze Elektro Kutílek.
Zachycuje nové funkce, architektonické změny a milníky — ne opravy drobných chyb.

---

## Fáze 1 — Základ Docusaurus

Vytvoření projektu Docusaurus 3.10.0 jako platformy pro interní dokumentaci.

- **Docusaurus projekt** — inicializace s konfigurací pro češtinu, dark theme, KaTeX matematika
- **Demo obsah** — vzorové stránky demonstrující typografii, kód, diagramy, multimédia, widgety
- **Mermaid diagramy** — nativní `@docusaurus/theme-mermaid` (CDN loader vyčištěn od duplicity)
- **Web Components** — `ek-ack-widget` (potvrzení přečtení), `ek-quiz` (kvízy), `ek-decision-tree` (rozhodovací stromy) v `ek-components.js`
- **KaTeX** — CDN loader pro matematické vzorce (`cdn-loader.js`)

---

## Fáze 2 — Tracking systém

Návrh a implementace systému sledování čtení dokumentů.

- **Architektura trackingu** — SQLite databáze (`analytics.sqlite`) s tabulkami: `page_sessions`, `heartbeats`, `confirmations`, `quiz_results`
- **Express server** (`server.js`) — nahrazuje přímé spuštění Docusaurus; servíruje statické soubory + REST API pro tracking
- **Frontend tracker** (`reading-tracker.js`) — SPA-aware sledování: session management, heartbeaty, aktivní čas, scroll progress
- **Dashboard** (`dashboard.html`) — HTML reporty s přehledem čtení, TOP stránkami, uživatelskými statistikami

---

## Fáze 3 — Docker deployment na Synology

Kontejnerizace a nasazení na Synology NAS DS1817+.

- **Dockerfile** — `node:22-alpine`, build-stage pro `better-sqlite3` (nativní kompilace), webpack patch pro Docusaurus 3.10 bug
- **docker-compose.yml** — port mapping 3300:3000, volume mounts pro docs/, static/, config/, data/
- **Package.json** — server závislosti: express, better-sqlite3, cookie-parser, http-proxy-middleware
- **Deployment guide** — postup pro Synology Docker GUI

---

## Fáze 4 — Autentizace a uživatelské rozhraní

Přihlašování, uživatelská identita a základní admin UI.

- **Login systém** (`login.html`) — cookie-based autentizace (`ek_user`), výběr uživatele ze seznamu, zobrazení jména a příjmení
- **Admin UI** (`admin.html`) — správa uživatelů a skupin, první verze
- **Status bar** (`status-bar.js`) — persistentní spodní lišta na všech stránkách: jméno, skupina, statistiky (stránky, čas, kvízy), navigační odkazy, hodiny
- **API `/api/me/stats`** — personalizované statistiky pro přihlášeného uživatele (přečteno, celkem, potvrzení, čas)
- **DEV SERVER režim** — přepnutí z production build na dev server s hot reload; Express proxyuje na Docusaurus přes `http-proxy-middleware` (ws: true)

---

## Fáze 5 — Rozšíření admin UI

Profesionální správa uživatelů a skupin.

- **Skupiny CRUD** — vytváření, editace, mazání skupin s ikonou, popisem a přístupovými právy
- **Uživatelé** — fotky (upload + base64 uložení), vícenásobné členství ve skupinách, provázanost s přístupovými právy
- **Auth config** (`auth-config.json`) — nový formát: `users{}` objekt s firstName, lastName, groups; `groups{}` s label, description, access[], icon

---

## Fáze 6 — Přístupová matice

Granulární řízení přístupu k obsahu.

- **Architektura** — `access-matrix.json` s `pages{}` a `folders{}`, každý s: groups[], users[], denyGroups[], denyUsers[], inherit
- **Prioritní řetězec** — deny user > allow user > deny group > allow group > folder inherit > default deny
- **Access control middleware** — server-side kontrola přístupu před Docusaurus proxy
- **Admin záložka Obsah** — stromový přehled docs/ s možností přiřazovat přístup
- **Třístupňový toggle** — allow / deny / nic (zděděno) pro skupiny i jednotlivé uživatele
- **User sloupce** — individuální přiřazení přístupu per uživatel ve stromu obsahu

---

## Fáze 7 — Bezpečnostní pojistky

Ochrana konzistence systému.

- **Server-side pojistky** — API vrátí 400 při pokusu: smazat admin skupinu, odebrat `*` z admin skupiny, smazat posledního admina, odebrat admin skupinu poslednímu správci
- **UI pojistky** — skryté/zablokované tlačítka pro nebezpečné operace
- **Admin odkaz** ve status baru — viditelný pouze pro adminy

---

## Fáze 8 — Oddělení správy obsahu

Přesunutí content managementu z admin UI na samostatnou stránku.

- **Stránka `/obsah`** (`obsah.html`) — přiřazení obsahu, oddělená od admin UI, přístupná editorům i adminům
- **Rozšíření access matrix** — rozlišení `required` (povinné) vs. `info` (informační) čtení
- **Frontmatter sync** — API endpoint pro synchronizaci audience tagů z markdown frontmatter do access matrix
- **Status bar** — aktualizace odkazů: přidán odkaz na `/obsah`

---

## Fáze 9 — Dashboard přepracování

Kompletní přestavba analytického dashboardu.

- **Přehled** — summary karty (celkové návštěvy, unikátní uživatelé, stránky, čas) + TOP 10 stránek/uživatelů
- **Stránky** — stromová struktura s compliance statistikami (přečteno/nepřečteno per stránka), nahradila tabulkový pohled
- **Uživatelé** — compliance sloupce, žebříčky, rozšířené profily
- **User Detail** — stromová struktura přiřazeného obsahu, čas na stránce, scroll %, datum návštěvy, potvrzení
- **Přístup** — omezen na adminy a editory (`requireEditor`)

---

## Fáze 10 — Sidebar filtr a audience doporučení

Personalizace zobrazení obsahu.

- **Sidebar filtr** — skrytí položek v Docusaurus sidebaru podle přístupových práv uživatele
- **Sidebar map** — server generuje `sidebarMap` z `sidebars.js` pro klientský filtr
- **Audience doporučení** — nový sloupec v `/obsah` porovnávající aktuální přiřazení s frontmatter `audience` tagem
- **Plná jména** — ve sloupcích content tree místo username; slovní popis skupin v záhlaví

---

## Fáze 11 — Vizuální identita systémových stránek

Grafické odlišení administračních sekcí.

- **Grafické bannery** — kognitivní kotvy (emoji + gradient) pro Dashboard, Admin, Obsah
- **Barevné podkreslení** — každá systémová stránka má vlastní barevné schéma (amber/zelená/fialová)
- **Admin přepracování** — nová záložka Přehled s maticí uživatelé × skupiny
- **Accordion UI** — skupiny a uživatelé přepracovány na inline roletky (expand/collapse)

---

## Fáze 12 — Horní navigace a administrace

Nová navigační vrstva a systémové nastavení.

- **Horní navigační lišta** — přepínač mezi sekcemi (Dokumenty, Statistiky, Obsah, Admin, Administrace) s barevným zvýrazněním aktivní sekce
- **Stránka `/administrace`** (`administrace.html`) — systémové nastavení, přístupné pouze adminům
- **Barevné kódování sekcí** — každá sekce má vlastní accent color: modrá (docs), amber (dashboard), fialová (obsah), zelená (admin)

---

## Fáze 13 — Content tree vylepšení

Pokročilé funkce pro správu a procházení obsahu.

- **Sbalitelné složky** — collapse/expand v content tree na stránkách Obsah i Dashboard; tlačítka "Sbalit vše" / "Rozbalit vše"
- **Content preview** — klik na název stránky v Obsahu zobrazí outline (struktura nadpisů h1–h4 + první odstavec + počet slov)
- **Custom SVG ikony** — nahrazení emoji 📁/📄 za parametrizované SVG ikony (`svgFolder(color)`, `svgDoc(color)`) pro plnou kontrolu barvy; folder = žlutá (#f5c542), document = bílá (#ffffff)
- **Čistka sidebars.js** — odstranění mrtvých referencí na smazané markdown soubory

---

## Fáze 14 — Personalizovaný Home Dashboard

Landing page s přehledem pro každého uživatele.

- **Home dashboard** (`home.html`) — personalizovaná stránka na `/` s pozdravem podle denní doby
- **Widget: Nové stránky k přečtení** — nepřečtené stránky z access matrix, povinné zvýrazněné zeleně
- **Widget: Moje statistiky** — progress bar, karty (přečteno, přiřazeno, čas, potvrzení), naposledy navštívené stránky
- **Widget: Rychlé odkazy** — admin-definované odkazy s ikonami
- **API `/api/home`** — personalizovaný endpoint kombinující tracking data s access matrix
- **Admin záložka Dashboard** — zapínání/vypínání widgetů, správa rychlých odkazů (přidat/odebrat, ikony)
- **Levý navigační panel** — sidebar se stromem přiřazených dokumentů uživatele (složky sbalitelné), layout sidebar + main content
- **Navigace** — "Dokumenty" přejmenováno na "Domů" (🏠) v horní i spodní liště
- **Dashboard config** — nová sekce `dashboard` v `auth-config.json` s widgety
- **CHANGELOG.md** — zpětný chronologický přehled vývoje projektu, průběžně udržovaný

---

## Fáze 15 — Vizuální sjednocení

Sjednocení vzhledu Docusaurus dokumentových stránek s dashboardem.

- **Amber dark téma** (`mozkotron-theme.css`) — kompletní CSS override: barvy (#110f08 pozadí, #f59e0b accent, #d4a040 nadpisy), sidebar, TOC, admonitions, kód bloky, tabulky, navigace
- **Skrytí Docusaurus navbar** — vlastní horní lišta nahrazuje nativní navbar
- **Sidebar styl** — tmavý sidebar s hover efekty a amber active state, konzistentní s home dashboardem
- **Scrollbar** — subtilní tmavý styl
- **Mermaid diagramy** — tmavé pozadí s borderem

---

_Tento changelog je udržován průběžně. Při přidání nové funkce se připíše nová položka do aktuální nebo nové fáze._
