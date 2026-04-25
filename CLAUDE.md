# Mozkotron — technická dokumentace

Interní znalostní báze Elektro Kutílek. Docusaurus 3.10.0 + Express server v Docker kontejneru na Synology NAS DS1817+.

## Architektura

**DEV SERVER režim** — Docusaurus dev server (port 3001, interní) + Express (port 3000, veřejný).
Express proxyuje na Docusaurus přes http-proxy-middleware (ws: true pro hot reload).
Markdown změny se projeví okamžitě bez rebuildu.

**Kontejner:** node:22-alpine, port mapping 3300:3000. Dockerfile vytváří start.sh který spouští oba procesy paralelně.

## Klíčové soubory

```
server.js                    — Express: auth, tracking, admin API, access control, proxy
config/auth-config.json      — uživatelé, skupiny, overrides, tracking nastavení
config/access-matrix.json    — přístupová matice (pages + folders s allow/deny)
data/analytics.sqlite        — SQLite tracking data
static/home.html             — personalizovaný home dashboard (landing page /)
static/admin.html            — admin UI (uživatelé, skupiny, dashboard konfigurace)
static/dashboard.html        — analytický dashboard
static/login.html            — přihlašovací stránka
static/js/status-bar.js      — persistentní spodní lišta
static/js/reading-tracker.js — SPA-aware frontend tracker
static/js/cdn-loader.js      — KaTeX CDN loader (Mermaid odstraněn)
static/js/ek-components.js   — Web Components (ek-ack-widget, ek-quiz, ek-decision-tree)
static/js/mermaid-init.js    — DEPRECATED, prázdný
docusaurus.config.js         — Docusaurus konfigurace
sidebars.js                  — sidebar definice
```

## Volume mounts (docker-compose.yml)

docs/, static/, sidebars.js, docusaurus.config.js, server.js, data/, config/

## Co vyžaduje restart kontejneru

- **server.js** — volume mounted, ale Node.js ho načte jednou při startu
- **docusaurus.config.js** — Docusaurus dev server ho čte při startu
- **sidebars.js** — totéž
- Statické soubory (HTML, JS, CSS) stačí refresh prohlížeče
- Markdown obsah — hot reload automaticky

## Express middleware řetězec (pořadí)

1. express.json() + cookieParser()
2. identifyUser — cookie ek_user → req.ekUser
3. requireLogin — redirect na /login (kromě PUBLIC_PATHS)
4. Statické soubory: /js, /css, static/ (PŘED Docusaurem)
5. Speciální routy: / (home), /dashboard, /login, /admin
6. accessControlMiddleware — kontrola přístupu k docs (PŘED proxy)
7. Docusaurus proxy

## Přístupová matice

**Prioritní řetězec:** deny user > allow user > deny group > allow group > folder inherit > default deny

**access-matrix.json:** pages{} a folders{} s klíči groups[], users[], denyGroups[], denyUsers[], inherit (jen folders).

**Admin skupina** = ta s `*` v access[]. Konvence použitá ve všech bezpečnostních kontrolách.

## Bezpečnostní pojistky

Server-side (API vrátí 400) + UI-side (skryté/zablokované prvky):
- Nelze smazat admin skupinu
- Nelze odebrat * z admin skupiny
- Nelze smazat posledního admina
- Nelze odebrat admin skupinu poslednímu správci

## API endpointy

**Veřejné:** /api/login, /api/users, /api/logout, /api/me
**Tracking:** POST /api/track/{session,heartbeat,leave,confirm,quiz}
**Dashboard:** GET /api/dashboard/{stats,pages,users,user/:username,page,frequency,export}
**User stats:** GET /api/me/stats
**Home dashboard:** GET /api/home (personalizovaný přehled — nepřečtené stránky, statistiky, quick links)
**Admin:** GET/POST /api/admin/config, PUT/DELETE /api/admin/user/:id, PUT /api/admin/user/:id/photo, PUT/DELETE /api/admin/group/:id, PUT /api/admin/override/:id, GET /api/admin/docs, GET /api/admin/access-matrix, PUT /api/admin/access/{page,folder}, POST /api/admin/access/sync-frontmatter

## Mermaid

Nativní @docusaurus/theme-mermaid. CDN loader ho NENAČÍTÁ (odstraněno kvůli duplicitě).

## Důležité gotchas

1. **server.js restart** — po změně VŽDY restartovat kontejner
2. **Statické HTML** — admin.html, dashboard.html musí mít vlastní `<script>` tagy (Docusaurus scripts[] se tam nenačtou)
3. **Content tree sloupce** — header a data musí sdílet stejný flex layout (26px fixed width)
4. **Toggle cyklus** — musí zohlednit efektivní (zděděný) stav, ne jen přímý
5. **Alpine build-base** — nutné pro better-sqlite3 nativní kompilaci
6. **Webpack patch** — Dockerfile sed -i na ProgressPlugin.json (Docusaurus 3.10 bug)
