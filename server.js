/**
 * Mozek — Express server pro Docusaurus + Tracking API
 * =====================================================
 *
 * Nahrazuje přímé spuštění Docusauru. Servíruje statický build
 * a poskytuje REST API pro tracking čtení.
 *
 * Spuštění: node server.js
 * Port: process.env.PORT || 3000
 *
 * Sdílí auth-config.json s budoucím auth pluginem.
 */

const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { startWatcher } = require('./docs-watcher');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Sidebar Map — mapování kategorií na podstránky pro klientský sidebar filtr
// ---------------------------------------------------------------------------
// Dynamicky scanuje docs/ složku místo parsování sidebars.js.
// Díky tomu přidání/odebrání MD souborů nevyžaduje žádnou ruční údržbu.
// ---------------------------------------------------------------------------
let sidebarMap = {};

function buildSidebarMapFromDocs() {
  const map = {};
  const docsDir = path.join(__dirname, 'docs');
  try {
    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    entries.forEach(function(entry) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) return;
      const catDir = path.join(docsDir, entry.name);
      let label = entry.name;
      // Přečti _category_.json pro display label
      const catJsonPath = path.join(catDir, '_category_.json');
      if (fs.existsSync(catJsonPath)) {
        try {
          const catJson = JSON.parse(fs.readFileSync(catJsonPath, 'utf8'));
          if (catJson.label) label = catJson.label;
        } catch (e) { /* ignore parse errors */ }
      }
      // Sesbírej MD/MDX soubory jako stránky
      const mdFiles = fs.readdirSync(catDir)
        .filter(function(f) { return (f.endsWith('.md') || f.endsWith('.mdx')) && !f.startsWith('_'); })
        .map(function(f) { return '/' + entry.name + '/' + f.replace(/\.(md|mdx)$/, ''); });
      if (mdFiles.length > 0) {
        map[label] = mdFiles;
      }
    });
  } catch (e) {
    console.warn('[Server] docs/ scan failed for sidebarMap:', e.message);
  }
  return map;
}

sidebarMap = buildSidebarMapFromDocs();
console.log('[Server] Sidebar map built from docs/ scan:', JSON.stringify(sidebarMap));

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Auth Config — sdílená identita uživatelů
// ---------------------------------------------------------------------------
const AUTH_CONFIG_PATH = process.env.AUTH_CONFIG || path.join(__dirname, 'config', 'auth-config.json');

function loadAuthConfig() {
  try {
    return JSON.parse(fs.readFileSync(AUTH_CONFIG_PATH, 'utf-8'));
  } catch (e) {
    console.warn('[Server] auth-config.json nenalezen, používám výchozí:', e.message);
    return {
      groups: {
        vedeni: { description: 'Management', members: ['jan'], access: ['*'] },
        uzivatele: { description: 'Uživatelé', members: [], access: ['audience:uzivatel'] }
      },
      tracking: { enabled: true, require_confirmation: ['audience:uzivatel', 'audience:editor'], min_reading_time_seconds: 30 }
    };
  }
}

function getAuthConfig() {
  return loadAuthConfig();
}

function saveAuthConfig(config) {
  fs.writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Access Matrix — přístupová matice obsahu
// ---------------------------------------------------------------------------
const ACCESS_MATRIX_PATH = process.env.ACCESS_MATRIX || path.join(__dirname, 'config', 'access-matrix.json');

function loadAccessMatrix() {
  try {
    const matrix = JSON.parse(fs.readFileSync(ACCESS_MATRIX_PATH, 'utf-8'));
    return matrix;
  } catch (e) {
    console.warn('[AccessMatrix] Failed to load, using empty:', e.message);
    return { pages: {}, folders: {} };
  }
}

function saveAccessMatrix(matrix) {
  fs.writeFileSync(ACCESS_MATRIX_PATH, JSON.stringify(matrix, null, 2), 'utf-8');
}

/**
 * Zjistí, jestli má uživatel přístup ke stránce.
 * Logika (třístupňová: allow / deny / nic):
 * 1. Uživatel s * access (vedení) vidí vše
 * 2. Explicitní deny per uživatel → zakázáno
 * 3. Explicitní allow per uživatel → povoleno
 * 4. Deny přes skupinu → zakázáno
 * 5. Allow přes skupinu → povoleno
 * 6. Hledáme nadřazenou složku s inherit (stejná logika)
 * 7. Pokud nic → vidí jen * (vedení)
 */
function canUserAccessPage(username, pagePath) {
  const userAccess = getUserAccess(username);
  if (userAccess.includes('*')) return true;

  const matrix = loadAccessMatrix();
  const config = getAuthConfig();
  const userGroups = config.users?.[username]?.groups || [];

  // Normalizuj cestu (odstraň /docs/ prefix pokud je)
  const normalizedPath = pagePath.replace(/^\/?(docs\/)?/, 'docs/').replace(/\/$/, '');

  // Pomocná funkce — vyhodnotí přístup pro jeden záznam matice
  function evaluateEntry(entry) {
    if (!entry) return null; // žádný záznam → pokračuj dál
    // Deny per uživatel má nejvyšší prioritu
    if ((entry.denyUsers || []).includes(username)) return false;
    // Allow per uživatel (required i info)
    if ((entry.requiredUsers || []).includes(username)) return true;
    if ((entry.users || []).includes(username)) return true;
    // Deny přes skupinu
    if ((entry.denyGroups || []).some(g => userGroups.includes(g))) return false;
    // Allow přes skupinu (required i info)
    if ((entry.requiredGroups || []).some(g => userGroups.includes(g))) return true;
    if ((entry.groups || []).some(g => userGroups.includes(g))) return true;
    // Záznam existuje ale uživatel není ani v allow ani deny
    const hasAllowEntries = (entry.groups || []).length > 0 || (entry.users || []).length > 0
      || (entry.requiredGroups || []).length > 0 || (entry.requiredUsers || []).length > 0;
    if (hasAllowEntries) return false;
    return null; // prázdný záznam
  }

  // 1. Explicitní stránka
  const pageResult = evaluateEntry(matrix.pages?.[normalizedPath]);
  if (pageResult !== null) return pageResult;

  // 2. Dědičná složka — hledáme od nejhlubší k nejmělčí
  const parts = normalizedPath.split('/');
  for (let i = parts.length - 1; i >= 1; i--) {
    const folderPath = parts.slice(0, i).join('/');
    const folderEntry = matrix.folders?.[folderPath];
    if (folderEntry && folderEntry.inherit !== false) {
      const folderResult = evaluateEntry(folderEntry);
      if (folderResult !== null) {
        console.log(`[Access] ${username} → ${normalizedPath}: folder ${folderPath} → ${folderResult}`);
        return folderResult;
      }
    }
  }

  // 3. Nic nenalezeno → jen vedení (*)
  console.log(`[Access] ${username} → ${normalizedPath}: no match → denied`);
  return false;
}

/**
 * Zjistí typ přístupu uživatele ke stránce: 'required', 'info', 'denied', 'none'.
 * Používá se pro compliance tracking (rozlišení povinné vs informační čtení).
 */
function getPageAccessType(username, pagePath) {
  const userAccess = getUserAccess(username);
  if (userAccess.includes('*')) return 'required'; // admini vidí vše jako povinné (pro stats)

  const matrix = loadAccessMatrix();
  const config = getAuthConfig();
  const userGroups = config.users?.[username]?.groups || [];
  const normalizedPath = pagePath.replace(/^\/?(docs\/)?/, 'docs/').replace(/\/$/, '');

  function evaluateEntryType(entry) {
    if (!entry) return null;
    // Deny per uživatel
    if ((entry.denyUsers || []).includes(username)) return 'denied';
    // Required per uživatel
    if ((entry.requiredUsers || []).includes(username)) return 'required';
    // Info per uživatel
    if ((entry.users || []).includes(username)) return 'info';
    // Deny přes skupinu
    if ((entry.denyGroups || []).some(g => userGroups.includes(g))) return 'denied';
    // Required přes skupinu
    if ((entry.requiredGroups || []).some(g => userGroups.includes(g))) return 'required';
    // Info přes skupinu
    if ((entry.groups || []).some(g => userGroups.includes(g))) return 'info';
    // Existují allow záznamy ale uživatel tam není
    const hasAllowEntries = (entry.groups || []).length > 0 || (entry.users || []).length > 0
      || (entry.requiredGroups || []).length > 0 || (entry.requiredUsers || []).length > 0;
    if (hasAllowEntries) return 'denied';
    return null;
  }

  // 1. Explicitní stránka
  const pageResult = evaluateEntryType(matrix.pages?.[normalizedPath]);
  if (pageResult !== null) return pageResult;

  // 2. Dědičná složka
  const parts = normalizedPath.split('/');
  for (let i = parts.length - 1; i >= 1; i--) {
    const folderPath = parts.slice(0, i).join('/');
    const folderEntry = matrix.folders?.[folderPath];
    if (folderEntry && folderEntry.inherit !== false) {
      const folderResult = evaluateEntryType(folderEntry);
      if (folderResult !== null) return folderResult;
    }
  }

  return 'none';
}

/**
 * Vrátí pro uživatele všechny stránky s typem přístupu.
 * { required: ['docs/intro.md', ...], info: ['docs/xyz.md', ...] }
 */
function getUserPageAssignments(username) {
  const docsDir = path.join(__dirname, 'docs');
  const allPages = [];
  function scanDir(dir, prefix) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), prefix + entry.name + '/');
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
          allPages.push('docs/' + prefix + entry.name);
        }
      }
    } catch (e) { /* ignore */ }
  }
  scanDir(docsDir, '');

  const result = { required: [], info: [] };
  for (const page of allPages) {
    const type = getPageAccessType(username, page);
    if (type === 'required') result.required.push(page);
    else if (type === 'info') result.info.push(page);
  }
  return result;
}

/**
 * Vrátí seznam stránek dostupných uživateli (pro stats).
 */
function getAccessiblePages(username) {
  const userAccess = getUserAccess(username);
  const matrix = loadAccessMatrix();

  // Naskenuj všechny .md soubory v docs/ (filtruje _prefix, @eaDir, hidden)
  const docsDir = path.join(__dirname, 'docs');
  const allPages = [];
  function scanDir(dir, prefix) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('_') || entry.name.startsWith('@') || entry.name.startsWith('.')) continue;
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), prefix + entry.name + '/');
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
          allPages.push('docs/' + prefix + entry.name);
        }
      }
    } catch (e) { /* ignore */ }
  }
  scanDir(docsDir, '');

  if (userAccess.includes('*')) return allPages;

  return allPages.filter(p => canUserAccessPage(username, p));
}

/**
 * Skenuje frontmatter ze všech .md souborů a vrátí strukturu.
 */
/** Konvertuje docs/ filesystem cestu na Docusaurus URL.
 *  Stripuje: docs/ prefix, .md/.mdx příponu, /index suffix, číselné prefixy složek (00-, 01-, ...) */
function docPathToUrl(docPath) {
  return '/' + docPath
    .replace(/^docs\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '')
    .split('/')
    .map(seg => seg.replace(/^\d+-/, ''))
    .join('/');
}

function scanDocsStructure() {
  const docsDir = path.join(__dirname, 'docs');
  const result = [];

  // Složky/soubory které se mají přeskočit (Synology metadata, Obsidian, Docusaurus interní)
  const SKIP_DIRS = ['@eadir', '.obsidian', '_shared', 'node_modules', '.git'];
  const SKIP_FILES = ['_category_.json'];
  // Asset složky — neobsahují MD obsah, nemají se zobrazovat ve stromu
  const ASSET_DIRS = ['img', 'image', 'images', 'assets', 'static', 'media'];

  function hasMarkdownContent(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx'))) return true;
        if (e.isDirectory() && !SKIP_DIRS.includes(e.name) && !ASSET_DIRS.includes(e.name)
            && !e.name.startsWith('_') && !e.name.startsWith('.') && !e.name.startsWith('@')) {
          if (hasMarkdownContent(path.join(dirPath, e.name))) return true;
        }
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function scanDir(dir, prefix) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => {
          // Přeskoč všechny _prefix položky (systémové, importy, skryté)
          if (e.name.startsWith('_') || e.name.startsWith('.')) return false;
          if (e.isDirectory()) {
            if (SKIP_DIRS.includes(e.name) || e.name.startsWith('@')) return false;
            // Přeskoč asset složky (img, images, assets...)
            if (ASSET_DIRS.includes(e.name)) return false;
            // Přeskoč složky bez MD obsahu
            return hasMarkdownContent(path.join(dir, e.name));
          }
          return !SKIP_FILES.includes(e.name);
        });

      // Přečti metadata pro řazení — stejně jako /api/sidebar
      const entriesWithMeta = entries.map(e => {
        let position = 999;
        let label = e.name;
        const fullPath = path.join(dir, e.name);

        if (e.isDirectory()) {
          // Přečti _category_.json pro label a position
          const catPath = path.join(fullPath, '_category_.json');
          if (fs.existsSync(catPath)) {
            try {
              const catJson = JSON.parse(fs.readFileSync(catPath, 'utf8'));
              if (catJson.position != null) position = catJson.position;
              if (catJson.label) label = catJson.label;
            } catch (err) { /* ignore */ }
          }
        } else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch) {
              const posMatch = fmMatch[1].match(/sidebar_position:\s*(\d+)/);
              if (posMatch) position = parseInt(posMatch[1]);
            }
          } catch (err) { /* ignore */ }
        }
        return { entry: e, position, label };
      });

      // Řadit podle position, pak abecedně (jako sidebar)
      entriesWithMeta.sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.label.localeCompare(b.label, 'cs');
      });

      for (const { entry, label: catLabel } of entriesWithMeta) {
        const fullPath = path.join(dir, entry.name);
        const relPath = 'docs/' + prefix + entry.name;
        if (entry.isDirectory()) {
          result.push({ type: 'folder', path: relPath, name: catLabel });
          scanDir(fullPath, prefix + entry.name + '/');
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
          // Přeskoč index.md v podsložkách — index = stránka složky, ne samostatný soubor
          const isIndex = entry.name === 'index.md' || entry.name === 'index.mdx';
          if (isIndex && prefix !== '') continue;

          // Parse frontmatter — sidebar_label > title > filename
          const content = fs.readFileSync(fullPath, 'utf-8');
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
          let title = entry.name.replace(/\.mdx?$/, '');
          let audience = null;
          if (fmMatch) {
            const labelMatch = fmMatch[1].match(/sidebar_label:\s*["']?(.+?)["']?\s*$/m);
            const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
            if (labelMatch) title = labelMatch[1];
            else if (titleMatch) title = titleMatch[1];
            const audMatch = fmMatch[1].match(/audience:\s*(.+)$/m);
            if (audMatch) audience = audMatch[1].trim().split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
          }
          // Word count — bez frontmatter, MD syntaxe a prázdných řádků
          const bodyText = fmMatch ? content.slice(fmMatch[0].length) : content;
          const cleanText = bodyText
            .replace(/```[\s\S]*?```/g, ' ')        // code bloky
            .replace(/`[^`]+`/g, ' ')                // inline code
            .replace(/!\[.*?\]\(.*?\)/g, ' ')        // obrázky
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // linky → jen text
            .replace(/<[^>]+>/g, ' ')                // HTML tagy
            .replace(/[#*_~>|`\-=]/g, ' ')           // MD syntaxe
            .replace(/:::\w+/g, ' ')                 // admonitions
            .replace(/\s+/g, ' ')
            .trim();
          const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
          const estReadTimeSec = Math.round((wordCount / 200) * 60); // 200 slov/min
          result.push({ type: 'page', path: relPath, name: entry.name, title, audience, wordCount, estReadTimeSec });
        }
      }
    } catch (e) { /* ignore */ }
  }
  scanDir(docsDir, '');
  return result;
}

function getAllUsers() {
  const config = getAuthConfig();
  // Nový formát: config.users je objekt { id: { firstName, lastName, groups } }
  if (config.users) {
    return Object.entries(config.users).map(([id, u]) => ({
      username: id,
      firstName: u.firstName || id,
      lastName: u.lastName || '',
      groups: u.groups || [],
    }));
  }
  // Starý formát (fallback): groups.members
  const users = new Map();
  for (const [groupName, group] of Object.entries(config.groups || {})) {
    for (const member of group.members || []) {
      if (!users.has(member)) {
        users.set(member, { username: member, firstName: member, lastName: '', groups: [] });
      }
      users.get(member).groups.push(groupName);
    }
  }
  return [...users.values()];
}

function getUserAccess(username) {
  const config = getAuthConfig();
  const user = config.users?.[username];
  if (!user) return [];
  // Skupinová práva
  const groupAccess = new Set();
  for (const g of user.groups || []) {
    for (const a of config.groups?.[g]?.access || []) {
      groupAccess.add(a);
    }
  }
  // Výjimky per uživatel
  const overrides = config.overrides?.[username] || {};
  for (const a of overrides.allow || []) groupAccess.add(a);
  for (const a of overrides.deny || []) groupAccess.delete(a);
  return [...groupAccess];
}

// ---------------------------------------------------------------------------
// SQLite — inicializace databáze
// ---------------------------------------------------------------------------
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'analytics.sqlite');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS page_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    page_path TEXT NOT NULL,
    page_title TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    active_time_ms INTEGER DEFAULT 0,
    max_scroll_pct REAL DEFAULT 0,
    is_confirmed INTEGER DEFAULT 0,
    user_agent TEXT,
    referrer TEXT
  );

  CREATE TABLE IF NOT EXISTS heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    active_time_ms INTEGER NOT NULL,
    scroll_pct REAL NOT NULL,
    FOREIGN KEY (session_id) REFERENCES page_sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    doc_id TEXT NOT NULL,
    doc_title TEXT,
    page_path TEXT,
    confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
    session_id TEXT,
    FOREIGN KEY (session_id) REFERENCES page_sessions(session_id)
  );

  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    page_path TEXT NOT NULL,
    quiz_title TEXT,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score_pct REAL NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    session_id TEXT,
    FOREIGN KEY (session_id) REFERENCES page_sessions(session_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON page_sessions(username);
  CREATE INDEX IF NOT EXISTS idx_sessions_page ON page_sessions(page_path);
  CREATE INDEX IF NOT EXISTS idx_sessions_started ON page_sessions(started_at);
  CREATE INDEX IF NOT EXISTS idx_confirmations_user ON confirmations(username);
  CREATE INDEX IF NOT EXISTS idx_confirmations_doc ON confirmations(doc_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_results(username);

  CREATE TABLE IF NOT EXISTS section_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    heading TEXT NOT NULL,
    heading_level INTEGER NOT NULL DEFAULT 2,
    time_ms INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES page_sessions(session_id)
  );
  CREATE INDEX IF NOT EXISTS idx_sections_session ON section_times(session_id);
`);

// Migrace: normalizace trailing slash v page_path (jednorázová)
db.exec(`
  UPDATE page_sessions SET page_path = RTRIM(page_path, '/') WHERE page_path LIKE '%/' AND page_path != '/';
  UPDATE confirmations SET page_path = RTRIM(page_path, '/') WHERE page_path LIKE '%/' AND page_path != '/';
  UPDATE quiz_results SET page_path = RTRIM(page_path, '/') WHERE page_path LIKE '%/' AND page_path != '/';
`);

// ---------------------------------------------------------------------------
// Prepared Statements
// ---------------------------------------------------------------------------
const stmts = {
  insertSession: db.prepare(`
    INSERT INTO page_sessions (session_id, username, page_path, page_title, user_agent, referrer)
    VALUES (@session_id, @username, @page_path, @page_title, @user_agent, @referrer)
  `),
  upsertHeartbeat: db.prepare(`
    INSERT INTO heartbeats (session_id, active_time_ms, scroll_pct)
    VALUES (@session_id, @active_time_ms, @scroll_pct)
  `),
  updateSession: db.prepare(`
    UPDATE page_sessions
    SET active_time_ms = @active_time_ms, max_scroll_pct = MAX(max_scroll_pct, @scroll_pct)
    WHERE session_id = @session_id
  `),
  endSession: db.prepare(`
    UPDATE page_sessions
    SET ended_at = datetime('now'), active_time_ms = @active_time_ms, max_scroll_pct = MAX(max_scroll_pct, @scroll_pct)
    WHERE session_id = @session_id
  `),
  insertConfirmation: db.prepare(`
    INSERT INTO confirmations (username, doc_id, doc_title, page_path, session_id)
    VALUES (@username, @doc_id, @doc_title, @page_path, @session_id)
  `),
  markSessionConfirmed: db.prepare(`
    UPDATE page_sessions SET is_confirmed = 1 WHERE session_id = @session_id
  `),
  insertQuiz: db.prepare(`
    INSERT INTO quiz_results (username, page_path, quiz_title, total_questions, correct_answers, score_pct, session_id)
    VALUES (@username, @page_path, @quiz_title, @total_questions, @correct_answers, @score_pct, @session_id)
  `),
};

// ---------------------------------------------------------------------------
// Middleware — identifikace uživatele + povinné přihlášení
// ---------------------------------------------------------------------------
function identifyUser(req, res, next) {
  req.ekUser = req.cookies.ek_user || null;
  next();
}
app.use(identifyUser);

// Cesty, které fungují bez přihlášení
const PUBLIC_PATHS = ['/login', '/api/login', '/api/users', '/api/logout', '/api/me', '/api/sidebar'];

function requireLogin(req, res, next) {
  // Statické assety potřebné pro login stránku (JS, CSS, fonty, ikony)
  if (req.path.match(/\.(js|css|ico|png|jpg|svg|woff2?)$/)) return next();
  // Veřejné cesty
  if (PUBLIC_PATHS.some(p => req.path === p || req.path.startsWith(p + '/'))) return next();
  // Nepřihlášený → redirect na login
  if (!req.ekUser) return res.redirect('/login');
  // Ověřit, že uživatel existuje v auth-config
  const users = getAllUsers();
  if (!users.find(u => u.username === req.ekUser)) {
    res.clearCookie('ek_user');
    return res.redirect('/login');
  }
  next();
}
app.use(requireLogin);

// ---------------------------------------------------------------------------
// API — Tracking endpointy
// ---------------------------------------------------------------------------
app.post('/api/track/session', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const { session_id, page_path: rawPath, page_title, referrer } = req.body;
  if (!session_id || !rawPath) return res.status(400).json({ error: 'missing_fields' });
  const page_path = rawPath.replace(/\/+$/, '') || '/';
  try {
    stmts.insertSession.run({
      session_id, username: req.ekUser, page_path,
      page_title: page_title || null,
      user_agent: req.headers['user-agent'] || null,
      referrer: referrer || null,
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint')) {
      res.json({ ok: true, note: 'session_exists' });
    } else {
      console.error('[Track] session error:', e);
      res.status(500).json({ error: 'db_error' });
    }
  }
});

app.post('/api/track/heartbeat', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const { session_id, active_time_ms, scroll_pct } = req.body;
  if (!session_id) return res.status(400).json({ error: 'missing_session_id' });
  try {
    stmts.upsertHeartbeat.run({ session_id, active_time_ms: active_time_ms || 0, scroll_pct: scroll_pct || 0 });
    stmts.updateSession.run({ session_id, active_time_ms: active_time_ms || 0, scroll_pct: scroll_pct || 0 });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Track] heartbeat error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/track/leave', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const { session_id, active_time_ms, scroll_pct } = req.body;
  if (!session_id) return res.status(400).json({ error: 'missing_session_id' });
  try {
    stmts.endSession.run({ session_id, active_time_ms: active_time_ms || 0, scroll_pct: scroll_pct || 0 });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Track] leave error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/track/sections', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const { session_id, sections } = req.body;
  if (!session_id || !Array.isArray(sections)) return res.status(400).json({ error: 'missing_fields' });
  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO section_times (session_id, heading, heading_level, time_ms)
      VALUES (@session_id, @heading, @heading_level, @time_ms)
    `);
    const upsert = db.transaction((items) => {
      // Delete old entries for this session, then insert fresh
      db.prepare('DELETE FROM section_times WHERE session_id = ?').run(session_id);
      for (const s of items) {
        insert.run({ session_id, heading: s.heading || '', heading_level: s.level || 2, time_ms: s.time_ms || 0 });
      }
    });
    upsert(sections);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Track] sections error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/track/confirm', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const { doc_id, doc_title, page_path: rawConfirmPath, session_id } = req.body;
  if (!doc_id) return res.status(400).json({ error: 'missing_doc_id' });
  const page_path = rawConfirmPath ? (rawConfirmPath.replace(/\/+$/, '') || '/') : null;
  try {
    stmts.insertConfirmation.run({
      username: req.ekUser, doc_id,
      doc_title: doc_title || null, page_path: page_path, session_id: session_id || null,
    });
    if (session_id) stmts.markSessionConfirmed.run({ session_id });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Track] confirm error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/track/quiz', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const { page_path, quiz_title, total_questions, correct_answers, score_pct, session_id } = req.body;
  if (!page_path || total_questions == null) return res.status(400).json({ error: 'missing_fields' });
  try {
    stmts.insertQuiz.run({
      username: req.ekUser, page_path,
      quiz_title: quiz_title || null, total_questions,
      correct_answers: correct_answers || 0, score_pct: score_pct || 0,
      session_id: session_id || null,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Track] quiz error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Dashboard data
// ---------------------------------------------------------------------------
app.get('/api/dashboard/stats', requireEditor, (req, res) => {
  try {
    const totalViews = db.prepare('SELECT COUNT(*) as c FROM page_sessions').get().c;
    const uniqueUsers = db.prepare('SELECT COUNT(DISTINCT username) as c FROM page_sessions').get().c;
    const uniquePages = db.prepare('SELECT COUNT(DISTINCT page_path) as c FROM page_sessions').get().c;
    const totalConfirmations = db.prepare('SELECT COUNT(*) as c FROM confirmations').get().c;
    const totalQuizzes = db.prepare('SELECT COUNT(*) as c FROM quiz_results').get().c;
    const avgTime = db.prepare('SELECT AVG(active_time_ms) as avg FROM page_sessions WHERE active_time_ms > 0').get().avg || 0;
    res.json({ totalViews, uniqueUsers, uniquePages, totalConfirmations, totalQuizzes, avgTimeMs: Math.round(avgTime) });
  } catch (e) {
    console.error('[Dashboard] stats error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/dashboard/pages', requireEditor, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT page_path, page_title, COUNT(*) as view_count,
        COUNT(DISTINCT username) as unique_users,
        ROUND(AVG(active_time_ms) / 1000.0, 1) as avg_time_sec,
        ROUND(AVG(max_scroll_pct), 1) as avg_scroll_pct,
        SUM(is_confirmed) as confirmations,
        MAX(started_at) as last_visit
      FROM page_sessions GROUP BY page_path ORDER BY view_count DESC
    `).all();
    res.json(rows);
  } catch (e) {
    console.error('[Dashboard] pages error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/dashboard/users', requireEditor, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT username, COUNT(*) as total_views,
        COUNT(DISTINCT page_path) as pages_visited,
        ROUND(SUM(active_time_ms) / 1000.0, 1) as total_time_sec,
        MAX(started_at) as last_active
      FROM page_sessions GROUP BY username ORDER BY last_active DESC
    `).all();
    res.json(rows);
  } catch (e) {
    console.error('[Dashboard] users error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/dashboard/user/:username', requireEditor, (req, res) => {
  try {
    const { username } = req.params;
    const sessions = db.prepare(`
      SELECT page_path, page_title, started_at, active_time_ms, max_scroll_pct, is_confirmed
      FROM page_sessions WHERE username = ? ORDER BY started_at DESC LIMIT 100
    `).all(username);
    const confirmations = db.prepare(`
      SELECT doc_id, doc_title, page_path, confirmed_at
      FROM confirmations WHERE username = ? ORDER BY confirmed_at DESC
    `).all(username);
    const quizzes = db.prepare(`
      SELECT page_path, quiz_title, total_questions, correct_answers, score_pct, completed_at
      FROM quiz_results WHERE username = ? ORDER BY completed_at DESC
    `).all(username);
    const frequency = db.prepare(`
      SELECT date(started_at) as day, COUNT(*) as views
      FROM page_sessions WHERE username = ? AND started_at >= date('now', '-30 days')
      GROUP BY date(started_at) ORDER BY day
    `).all(username);
    res.json({ username, sessions, confirmations, quizzes, frequency });
  } catch (e) {
    console.error('[Dashboard] user detail error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/dashboard/page', requireEditor, (req, res) => {
  try {
    const pagePath = (req.query.path || '').replace(/\/+$/, '') || '/';
    if (!req.query.path) return res.status(400).json({ error: 'missing_path' });
    const sessions = db.prepare(`
      SELECT session_id, username, started_at, active_time_ms, max_scroll_pct, is_confirmed
      FROM page_sessions WHERE page_path = ? ORDER BY started_at DESC LIMIT 200
    `).all(pagePath);
    const confirmations = db.prepare(`
      SELECT username, confirmed_at FROM confirmations WHERE page_path = ? ORDER BY confirmed_at DESC
    `).all(pagePath);
    const frequency = db.prepare(`
      SELECT date(started_at) as day, COUNT(*) as views, COUNT(DISTINCT username) as unique_users
      FROM page_sessions WHERE page_path = ? AND started_at >= date('now', '-30 days')
      GROUP BY date(started_at) ORDER BY day
    `).all(pagePath);
    const allUsers = getAllUsers().map(u => u.username);
    const readUsers = new Set(sessions.map(s => s.username));
    const unreadUsers = allUsers.filter(u => !readUsers.has(u));
    // Section breakdown — agregace přes všechny sessions na této stránce
    const sessionIds = sessions.map(s => s.session_id || '').filter(Boolean);
    let sectionBreakdown = [];
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map(() => '?').join(',');
      sectionBreakdown = db.prepare(`
        SELECT heading, heading_level, SUM(time_ms) as total_ms, COUNT(*) as session_count
        FROM section_times WHERE session_id IN (${placeholders})
        GROUP BY heading ORDER BY MIN(id)
      `).all(...sessionIds);
    }
    // Najdi stránku ve structure pro estReadTimeSec a wordCount
    const structure = scanDocsStructure();
    const pageItem = structure.find(s => s.type === 'page' && docPathToUrl(s.path) === pagePath);
    const estReadTimeSec = pageItem?.estReadTimeSec || 0;
    const wordCount = pageItem?.wordCount || 0;

    // Per-user breakdown: kdo má required/info, kdo přečetl, kdo potvrdil
    const config = getAuthConfig();
    const allUsersList = getAllUsers();
    const confirmedSet = new Set(confirmations.map(c => c.username));
    const userBreakdown = allUsersList.map(u => {
      const accessType = pageItem ? getPageAccessType(u.username, pageItem.path) : null;
      if (!accessType) return null; // uživatel nemá přístup
      const userSessions = sessions.filter(s => s.username === u.username);
      const totalTimeMs = userSessions.reduce((sum, s) => sum + (s.active_time_ms || 0), 0);
      const maxScroll = userSessions.reduce((max, s) => Math.max(max, s.max_scroll_pct || 0), 0);
      return {
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        accessType,
        read: userSessions.length > 0,
        confirmed: confirmedSet.has(u.username),
        visits: userSessions.length,
        totalTimeMs,
        maxScroll,
        lastVisit: userSessions.length > 0 ? userSessions[0].started_at : null,
      };
    }).filter(Boolean);

    res.json({ page_path: pagePath, sessions, confirmations, frequency, unreadUsers, sectionBreakdown, estReadTimeSec, wordCount, userBreakdown });
  } catch (e) {
    console.error('[Dashboard] page detail error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/dashboard/frequency', requireEditor, (req, res) => {
  try {
    const period = req.query.period || 'month';
    const days = period === 'week' ? 7 : 30;
    const daily = db.prepare(`
      SELECT date(started_at) as day, COUNT(*) as views,
        COUNT(DISTINCT username) as unique_users, COUNT(DISTINCT page_path) as unique_pages
      FROM page_sessions WHERE started_at >= date('now', '-' || ? || ' days')
      GROUP BY date(started_at) ORDER BY day
    `).all(days);
    res.json({ period, days, daily });
  } catch (e) {
    console.error('[Dashboard] frequency error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/dashboard/export', requireEditor, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ps.username, ps.page_path, ps.page_title, ps.started_at, ps.ended_at,
        ROUND(ps.active_time_ms / 1000.0, 1) as active_time_sec,
        ROUND(ps.max_scroll_pct, 1) as scroll_pct, ps.is_confirmed,
        COALESCE(c.confirmed_at, '') as confirmed_at
      FROM page_sessions ps
      LEFT JOIN confirmations c ON c.session_id = ps.session_id
      ORDER BY ps.started_at DESC
    `).all();
    const header = 'username,page_path,page_title,started_at,ended_at,active_time_sec,scroll_pct,is_confirmed,confirmed_at\n';
    const csv = header + rows.map(r =>
      `"${r.username}","${r.page_path}","${r.page_title || ''}","${r.started_at}","${r.ended_at || ''}",${r.active_time_sec},${r.scroll_pct},${r.is_confirmed},"${r.confirmed_at}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mozek-tracking-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[Dashboard] export error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Dashboard: TOP stránky
// ---------------------------------------------------------------------------
app.get('/api/dashboard/top-pages', requireEditor, (req, res) => {
  try {
    const by = req.query.by || 'views';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    let rows;
    if (by === 'views') {
      rows = db.prepare(`
        SELECT page_path, page_title, COUNT(*) as view_count,
          COUNT(DISTINCT username) as unique_users,
          ROUND(AVG(active_time_ms) / 1000.0, 1) as avg_time_sec,
          ROUND(AVG(max_scroll_pct), 1) as avg_scroll_pct,
          MAX(started_at) as last_visit
        FROM page_sessions GROUP BY page_path
        ORDER BY view_count DESC LIMIT ?
      `).all(limit);
    } else if (by === 'time') {
      rows = db.prepare(`
        SELECT page_path, page_title, COUNT(*) as view_count,
          COUNT(DISTINCT username) as unique_users,
          ROUND(AVG(active_time_ms) / 1000.0, 1) as avg_time_sec,
          ROUND(AVG(max_scroll_pct), 1) as avg_scroll_pct,
          MAX(started_at) as last_visit
        FROM page_sessions GROUP BY page_path
        ORDER BY avg_time_sec DESC LIMIT ?
      `).all(limit);
    } else if (by === 'newest') {
      rows = db.prepare(`
        SELECT page_path, page_title, COUNT(*) as view_count,
          COUNT(DISTINCT username) as unique_users,
          ROUND(AVG(active_time_ms) / 1000.0, 1) as avg_time_sec,
          ROUND(AVG(max_scroll_pct), 1) as avg_scroll_pct,
          MIN(started_at) as first_visit,
          MAX(started_at) as last_visit
        FROM page_sessions GROUP BY page_path
        ORDER BY first_visit DESC LIMIT ?
      `).all(limit);
    } else {
      return res.status(400).json({ error: 'invalid_by_param' });
    }

    res.json({ by, limit, rows });
  } catch (e) {
    console.error('[Dashboard] top-pages error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Dashboard: User compliance (povinné/info přiřazení vs přečtení)
// ---------------------------------------------------------------------------
app.get('/api/dashboard/user-compliance', requireEditor, (req, res) => {
  try {
    const config = getAuthConfig();
    const users = Object.keys(config.users || {});
    const result = [];

    for (const username of users) {
      const assignments = getUserPageAssignments(username);
      const u = config.users[username];

      // Zjistit, které stránky uživatel skutečně navštívil
      const visitedPages = db.prepare(`
        SELECT DISTINCT page_path FROM page_sessions WHERE username = ?
      `).all(username).map(r => r.page_path);

      // Normalizovat page_path z DB na docs/ formát pro porovnání
      // V DB je page_path jako /souborovy-system/bimg, v assignments jako docs/souborovy-system/bimg.md
      const visitedSet = new Set();
      for (const vp of visitedPages) {
        // Zkusit najít shodu: /xyz → docs/xyz.md nebo docs/xyz/index.md
        const normalized = 'docs' + vp + '.md';
        const normalizedIndex = 'docs' + vp + '/index.md';
        visitedSet.add(normalized);
        visitedSet.add(normalizedIndex);
        // Taky přímo URL bez lomítka na začátku
        const alt = 'docs/' + vp.replace(/^\//, '') + '.md';
        const altIndex = 'docs/' + vp.replace(/^\//, '') + '/index.md';
        visitedSet.add(alt);
        visitedSet.add(altIndex);
      }

      const requiredRead = assignments.required.filter(p => visitedSet.has(p)).length;
      const infoRead = assignments.info.filter(p => visitedSet.has(p)).length;

      // Celkový aktivní čas
      const totalTime = db.prepare(`
        SELECT COALESCE(SUM(active_time_ms), 0) as total FROM page_sessions WHERE username = ?
      `).get(username).total;

      // Poslední aktivita
      const lastActive = db.prepare(`
        SELECT MAX(started_at) as last FROM page_sessions WHERE username = ?
      `).get(username).last;

      // Průměrná reakční doba (od první návštěvy stránky kýmkoli po návštěvu tímto uživatelem)
      const reactionTimes = db.prepare(`
        SELECT ps.page_path,
          MIN(ps.started_at) as user_first_visit,
          (SELECT MIN(started_at) FROM page_sessions WHERE page_path = ps.page_path) as page_first_visit
        FROM page_sessions ps
        WHERE ps.username = ?
        GROUP BY ps.page_path
      `).all(username);

      let avgReactionMs = null;
      const validReactions = reactionTimes.filter(r => r.page_first_visit && r.user_first_visit);
      if (validReactions.length > 0) {
        const totalReaction = validReactions.reduce((sum, r) => {
          return sum + (new Date(r.user_first_visit + 'Z').getTime() - new Date(r.page_first_visit + 'Z').getTime());
        }, 0);
        avgReactionMs = totalReaction / validReactions.length;
      }

      result.push({
        username,
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        groups: u?.groups || [],
        requiredTotal: assignments.required.length,
        requiredRead,
        infoTotal: assignments.info.length,
        infoRead,
        totalTimeSec: Math.round(totalTime / 1000),
        lastActive,
        avgReactionMs,
      });
    }

    res.json(result);
  } catch (e) {
    console.error('[Dashboard] user-compliance error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Dashboard: User rankings (žebříčky)
// ---------------------------------------------------------------------------
app.get('/api/dashboard/user-rankings', requireEditor, (req, res) => {
  try {
    const config = getAuthConfig();
    const users = Object.keys(config.users || {});
    const rankings = [];

    for (const username of users) {
      const assignments = getUserPageAssignments(username);
      const u = config.users[username];

      const visitedPages = db.prepare(`
        SELECT DISTINCT page_path FROM page_sessions WHERE username = ?
      `).all(username).map(r => r.page_path);

      const visitedSet = new Set();
      for (const vp of visitedPages) {
        visitedSet.add('docs' + vp + '.md');
        visitedSet.add('docs' + vp + '/index.md');
        visitedSet.add('docs/' + vp.replace(/^\//, '') + '.md');
        visitedSet.add('docs/' + vp.replace(/^\//, '') + '/index.md');
      }

      const requiredRead = assignments.required.filter(p => visitedSet.has(p)).length;
      const infoRead = assignments.info.filter(p => visitedSet.has(p)).length;
      const requiredPct = assignments.required.length > 0 ? Math.round((requiredRead / assignments.required.length) * 100) : null;
      const infoPct = assignments.info.length > 0 ? Math.round((infoRead / assignments.info.length) * 100) : null;

      // Nejrychlejší a nejpomalejší reakční čas (od první návštěvy stránky po uživatelovu návštěvu)
      const reactions = db.prepare(`
        SELECT ps.page_path,
          MIN(ps.started_at) as user_first_visit,
          (SELECT MIN(started_at) FROM page_sessions WHERE page_path = ps.page_path) as page_first_visit
        FROM page_sessions ps
        WHERE ps.username = ?
        GROUP BY ps.page_path
      `).all(username);

      let fastestReactionMs = null, slowestReactionMs = null, avgReactionMs = null;
      const validReactions = reactions
        .filter(r => r.page_first_visit && r.user_first_visit)
        .map(r => ({
          page: r.page_path,
          ms: new Date(r.user_first_visit + 'Z').getTime() - new Date(r.page_first_visit + 'Z').getTime()
        }))
        .filter(r => r.ms > 0); // vyloučit ty, kde uživatel byl první

      if (validReactions.length > 0) {
        fastestReactionMs = Math.min(...validReactions.map(r => r.ms));
        slowestReactionMs = Math.max(...validReactions.map(r => r.ms));
        avgReactionMs = validReactions.reduce((s, r) => s + r.ms, 0) / validReactions.length;
      }

      rankings.push({
        username,
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        requiredRead,
        requiredTotal: assignments.required.length,
        requiredPct,
        infoRead,
        infoTotal: assignments.info.length,
        infoPct,
        fastestReactionMs,
        slowestReactionMs,
        avgReactionMs,
      });
    }

    res.json(rankings);
  } catch (e) {
    console.error('[Dashboard] user-rankings error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Dashboard: Pages tree (stromová struktura s compliance stats)
// ---------------------------------------------------------------------------
app.get('/api/dashboard/pages-tree', requireEditor, (req, res) => {
  try {
    const structure = scanDocsStructure();
    const config = getAuthConfig();
    const allUsers = Object.keys(config.users || {});

    // Pro každou stránku zjistit: kolik uživatelů má required, kolik info, kolik přečetlo
    const tree = [];
    for (const item of structure) {
      if (item.type === 'folder') {
        tree.push({ type: 'folder', label: item.name, path: item.path });
      } else {
        const docPath = item.path; // docs/souborovy-system/bimg.md
        const urlPath = docPathToUrl(docPath);

        // Spočítej per-user typy přístupu
        let requiredTotal = 0, infoTotal = 0;
        for (const username of allUsers) {
          const accessType = getPageAccessType(username, docPath);
          if (accessType === 'required') requiredTotal++;
          else if (accessType === 'info') infoTotal++;
        }

        // Kdo stránku skutečně navštívil
        const visitStats = db.prepare(`
          SELECT COUNT(DISTINCT username) as unique_readers,
            COUNT(*) as total_views,
            ROUND(AVG(active_time_ms) / 1000.0, 1) as avg_time_sec,
            ROUND(AVG(max_scroll_pct), 1) as avg_scroll_pct,
            MAX(started_at) as last_visit
          FROM page_sessions WHERE page_path = ?
        `).get(urlPath) || {};

        // Kolik z required uživatelů přečetlo
        const readUsers = db.prepare(`
          SELECT DISTINCT username FROM page_sessions WHERE page_path = ?
        `).all(urlPath).map(r => r.username);
        const readSet = new Set(readUsers);

        let requiredRead = 0, infoRead = 0;
        for (const username of allUsers) {
          const accessType = getPageAccessType(username, docPath);
          if (accessType === 'required' && readSet.has(username)) requiredRead++;
          else if (accessType === 'info' && readSet.has(username)) infoRead++;
        }

        // Potvrzení
        const confirmCount = db.prepare(`
          SELECT COUNT(DISTINCT username) as cnt FROM confirmations WHERE page_path = ?
        `).get(urlPath)?.cnt || 0;
        const confirmedUsers = new Set(
          db.prepare(`SELECT DISTINCT username FROM confirmations WHERE page_path = ?`).all(urlPath).map(r => r.username)
        );

        // Per-user breakdown pro inline rozbalení ve stromu
        const usersBreakdown = [];
        for (const username of allUsers) {
          const accessType = getPageAccessType(username, docPath);
          if (!accessType) continue;
          const u = config.users[username];
          usersBreakdown.push({
            username,
            name: ((u?.firstName || '') + ' ' + (u?.lastName || '')).trim() || username,
            accessType,
            read: readSet.has(username),
            confirmed: confirmedUsers.has(username),
          });
        }

        tree.push({
          type: 'page',
          label: item.title || item.name,
          file: item.path,
          path: urlPath,
          requiredTotal,
          requiredRead,
          infoTotal,
          infoRead,
          totalViews: visitStats.total_views || 0,
          uniqueReaders: visitStats.unique_readers || 0,
          avgTimeSec: visitStats.avg_time_sec || 0,
          avgScrollPct: visitStats.avg_scroll_pct || 0,
          lastVisit: visitStats.last_visit || null,
          confirmCount,
          wordCount: item.wordCount || 0,
          estReadTimeSec: item.estReadTimeSec || 0,
          usersBreakdown,
        });
      }
    }

    res.json(tree);
  } catch (e) {
    console.error('[Dashboard] pages-tree error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Dashboard: User content tree (stromová struktura s read statusem)
// ---------------------------------------------------------------------------
app.get('/api/dashboard/user/:username/tree', requireEditor, (req, res) => {
  try {
    const { username } = req.params;
    const config = getAuthConfig();
    if (!config.users?.[username]) return res.status(404).json({ error: 'user_not_found' });

    const structure = scanDocsStructure();
    const assignments = getUserPageAssignments(username);

    // Stránky, které uživatel navštívil (s detaily)
    const visits = db.prepare(`
      SELECT page_path, MAX(active_time_ms) as best_time_ms, MAX(max_scroll_pct) as best_scroll,
        MAX(started_at) as last_visit, COUNT(*) as visit_count
      FROM page_sessions WHERE username = ?
      GROUP BY page_path
    `).all(username);

    const visitMap = {};
    for (const v of visits) {
      visitMap[v.page_path] = v;
    }

    // Potvrzení
    const confirmations = db.prepare(`
      SELECT page_path, confirmed_at FROM confirmations WHERE username = ?
    `).all(username);
    const confirmMap = {};
    for (const c of confirmations) {
      confirmMap[c.page_path] = c.confirmed_at;
    }

    // Kvízy per page
    const quizResults = db.prepare(`
      SELECT page_path, quiz_title, total_questions, correct_answers, score_pct, completed_at
      FROM quiz_results WHERE username = ? ORDER BY completed_at DESC
    `).all(username);
    const quizMap = {};
    for (const q of quizResults) {
      if (!quizMap[q.page_path]) {
        quizMap[q.page_path] = {
          title: q.quiz_title,
          totalQuestions: q.total_questions,
          bestCorrect: q.correct_answers,
          bestPct: q.score_pct,
          lastCompleted: q.completed_at,
          attempts: 1
        };
      } else {
        quizMap[q.page_path].attempts++;
        if (q.score_pct > quizMap[q.page_path].bestPct) {
          quizMap[q.page_path].bestCorrect = q.correct_answers;
          quizMap[q.page_path].bestPct = q.score_pct;
        }
      }
    }

    // Sestav strom
    // scanDocsStructure() vrací: folder={type,path,name}, page={type,path,name,title,audience}
    const tree = [];
    for (const item of structure) {
      if (item.type === 'folder') {
        tree.push({ type: 'folder', label: item.name, path: item.path });
      } else {
        const docPath = item.path; // docs/souborovy-system/bimg.md
        const urlPath = docPathToUrl(docPath);
        const accessType = getPageAccessType(username, docPath);

        // Najdi visit data
        const visit = visitMap[urlPath] || null;
        const confirmed = confirmMap[urlPath] || null;
        const quiz = quizMap[urlPath] || null;

        tree.push({
          type: 'page',
          label: item.title || item.name,
          file: item.path,
          path: urlPath,
          accessType, // 'required', 'info', 'denied', 'none'
          read: !!visit,
          visitCount: visit?.visit_count || 0,
          bestTimeMs: visit?.best_time_ms || 0,
          bestScroll: visit?.best_scroll || 0,
          lastVisit: visit?.last_visit || null,
          confirmed,
          quizBestPct: quiz?.bestPct || 0,
          quizBestCorrect: quiz?.bestCorrect || 0,
          quizTotalQuestions: quiz?.totalQuestions || 0,
          quizAttempts: quiz?.attempts || 0,
        });
      }
    }

    // Summary stats
    let reqTotal = 0, reqRead = 0, infoTotal = 0, infoRead = 0, confirmedCount = 0, quizCount = 0;
    for (const t of tree) {
      if (t.type !== 'page') continue;
      if (t.accessType === 'required') { reqTotal++; if (t.read) reqRead++; }
      if (t.accessType === 'info') { infoTotal++; if (t.read) infoRead++; }
      if (t.confirmed) confirmedCount++;
      if (t.quizAttempts > 0) quizCount++;
    }

    // TOP čas per stránka (aggregované ze sessions)
    const topTime = db.prepare(`
      SELECT page_path, page_title, SUM(active_time_ms) as total_ms, COUNT(*) as visits
      FROM page_sessions WHERE username = ?
      GROUP BY page_path ORDER BY total_ms DESC LIMIT 10
    `).all(username);

    res.json({
      username,
      firstName: config.users[username]?.firstName || '',
      lastName: config.users[username]?.lastName || '',
      tree,
      summary: { reqTotal, reqRead, infoTotal, infoRead, confirmedCount, quizCount },
      topTime,
    });
  } catch (e) {
    console.error('[Dashboard] user tree error:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Uživatelé
// ---------------------------------------------------------------------------
app.get('/api/users', (req, res) => {
  res.json(getAllUsers());
});

app.post('/api/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'missing_username' });
  const users = getAllUsers();
  if (!users.find(u => u.username === username)) {
    return res.status(403).json({ error: 'unknown_user' });
  }
  res.cookie('ek_user', username, {
    httpOnly: false,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });
  res.json({ ok: true, username });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('ek_user');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.ekUser) return res.json({ authenticated: false });
  const users = getAllUsers();
  const user = users.find(u => u.username === req.ekUser);
  const access = getUserAccess(req.ekUser);
  const isEditor = (user?.groups || []).includes('editori');

  // Seznam povolených URL cest pro klientský access guard
  const accessiblePages = getAccessiblePages(req.ekUser);
  const allowedPaths = accessiblePages.map(p => docPathToUrl(p));

  // Refresh sidebarMap z aktuálního stavu docs/ (odchytí nové/smazané soubory bez restartu)
  sidebarMap = buildSidebarMapFromDocs();

  // Section themes pro per-sekce styling
  const config = getAuthConfig();
  const sectionThemes = config.sectionThemes || {};

  // Nepřečtené stránky — URL cesty, které uživatel ještě nenavštívil
  let unreadPaths = [];
  try {
    const visitedRows = db.prepare(`
      SELECT DISTINCT page_path FROM page_sessions WHERE username = ?
    `).all(req.ekUser);
    const visitedPaths = new Set(visitedRows.map(r => {
      let p = r.page_path.replace(/^\//, '');
      if (!p.startsWith('docs/')) p = 'docs/' + p;
      if (!p.endsWith('.md') && !p.endsWith('.mdx')) p = p + '.md';
      return p;
    }));
    unreadPaths = accessiblePages
      .filter(p => !visitedPaths.has(p))
      .filter(p => p !== 'docs/index.mdx' && p !== 'docs/index.md') // vyloučit homepage
      .map(p => docPathToUrl(p));
  } catch (e) { /* tracking DB nedostupná — vrátíme prázdný seznam */ }

  res.json({
    authenticated: true, username: req.ekUser,
    groups: user ? user.groups : [], access, isEditor,
    allowedPaths,
    unreadPaths,
    sidebarMap,
    sectionThemes,
  });
});

// ---------------------------------------------------------------------------
// API — User stats (pro spodní lištu)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// API — Home Dashboard (personalizovaný přehled pro přihlášeného uživatele)
// ---------------------------------------------------------------------------
app.get('/api/home', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const username = req.ekUser;

  try {
    const config = getAuthConfig();
    const dashConfig = config.dashboard || { widgets: {} };
    const widgets = dashConfig.widgets || {};
    const userInfo = config.users?.[username] || {};
    const result = {
      user: {
        username,
        firstName: userInfo.firstName || username,
        lastName: userInfo.lastName || '',
        groups: userInfo.groups || []
      },
      widgets: {}
    };

    // --- Widget: Nepřečtené stránky ---
    if (widgets.unreadPages?.enabled !== false) {
      const accessiblePages = getAccessiblePages(username);
      const visitedRows = db.prepare(`
        SELECT DISTINCT page_path FROM page_sessions WHERE username = ?
      `).all(username);
      const visitedPaths = new Set(visitedRows.map(r => {
        // Normalizuj: /aor-prodej/xxx → docs/aor-prodej/xxx.md
        let p = r.page_path.replace(/^\//, '');
        if (!p.startsWith('docs/')) p = 'docs/' + p;
        if (!p.endsWith('.md') && !p.endsWith('.mdx')) p = p + '.md';
        return p;
      }));

      const unread = accessiblePages
        .filter(p => !visitedPaths.has(p))
        .filter(p => p !== 'docs/index.mdx' && p !== 'docs/index.md') // vyloučit homepage
        .map(pagePath => {
          // Přečti titulek z frontmatter
          const fullPath = path.join(__dirname, pagePath.replace(/^docs\//, 'docs/'));
          let title = pagePath.split('/').pop().replace(/\.mdx?$/, '');
          let folder = pagePath.split('/').slice(1, -1).join('/') || '';
          try {
            const content = fs.readFileSync(path.join(__dirname, pagePath), 'utf-8');
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch) {
              const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
              if (titleMatch) title = titleMatch[1];
            }
          } catch (e) { /* soubor nenalezen */ }
          const accessType = getPageAccessType(username, pagePath);
          // URL cesta pro odkaz
          const urlPath = docPathToUrl(pagePath);
          return { path: pagePath, title, folder, accessType, url: urlPath };
        });

      const maxItems = widgets.unreadPages?.maxItems || 10;
      // Povinné stránky první
      unread.sort((a, b) => {
        if (a.accessType === 'required' && b.accessType !== 'required') return -1;
        if (a.accessType !== 'required' && b.accessType === 'required') return 1;
        return a.title.localeCompare(b.title, 'cs');
      });

      result.widgets.unreadPages = {
        enabled: true,
        title: widgets.unreadPages?.title || 'Nové stránky k přečtení',
        pages: unread.slice(0, maxItems),
        totalUnread: unread.length
      };
    }

    // --- Widget: Statistiky čtení ---
    if (widgets.readingStats?.enabled !== false) {
      const accessiblePages = getAccessiblePages(username);
      const pagesRead = db.prepare(`
        SELECT COUNT(DISTINCT page_path) as count FROM page_sessions WHERE username = ?
      `).get(username).count;

      const totalActiveTime = db.prepare(`
        SELECT COALESCE(SUM(active_time_ms), 0) as total FROM page_sessions WHERE username = ?
      `).get(username).total;

      const confirmsDone = db.prepare(`
        SELECT COUNT(DISTINCT doc_id) as count FROM confirmations WHERE username = ?
      `).get(username).count;

      const lastActivity = db.prepare(`
        SELECT MAX(started_at) as last FROM page_sessions WHERE username = ?
      `).get(username).last;

      // Nedávno čtené stránky (posledních 5)
      const recentRows = db.prepare(`
        SELECT page_path, page_title, MAX(started_at) as last_visit,
               SUM(active_time_ms) as total_time
        FROM page_sessions WHERE username = ?
        GROUP BY page_path ORDER BY last_visit DESC LIMIT 5
      `).all(username);
      const recentPages = recentRows.map(r => {
        const urlPath = r.page_path.startsWith('/') ? r.page_path : '/' + r.page_path;
        return {
          url: urlPath,
          title: r.page_title || r.page_path.split('/').pop(),
          lastVisit: r.last_visit,
          totalTimeMs: r.total_time
        };
      });

      const totalAvailable = accessiblePages.length;
      const progressPct = totalAvailable > 0 ? Math.round((pagesRead / totalAvailable) * 100) : 0;

      result.widgets.readingStats = {
        enabled: true,
        title: widgets.readingStats?.title || 'Moje statistiky',
        pagesRead,
        totalAvailable,
        progressPct,
        totalActiveTimeMs: totalActiveTime,
        confirmsDone,
        lastActivity,
        recentPages
      };
    }

    // --- Widget: Rychlé odkazy ---
    if (widgets.quickLinks?.enabled !== false) {
      result.widgets.quickLinks = {
        enabled: true,
        title: widgets.quickLinks?.title || 'Rychlé odkazy',
        links: widgets.quickLinks?.links || []
      };
    }

    // --- Navigační strom dokumentů (pro levý panel) ---
    const docsTree = [];
    const docsDir = path.join(__dirname, 'docs');
    const SKIP_DIRS = ['@eadir', '.obsidian', '_shared', 'node_modules', '.git'];
    function buildNavTree(dir, prefix) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter(e => {
            if (e.isDirectory()) return !SKIP_DIRS.includes(e.name) && !e.name.startsWith('@');
            return (e.name.endsWith('.md') || e.name.endsWith('.mdx')) && e.name !== '_category_.json';
          });

        // Přečti _category_.json pro position a label (shodné řazení s Docusaurus)
        const entryMeta = entries.map(e => {
          let position = 999;
          let label = e.name;
          if (e.isDirectory()) {
            try {
              const catJson = JSON.parse(fs.readFileSync(path.join(dir, e.name, '_category_.json'), 'utf-8'));
              if (catJson.position != null) position = catJson.position;
              if (catJson.label) label = catJson.label;
            } catch (err) { /* no category file */ }
          } else {
            // Čti sidebar_position + sidebar_label z frontmatter
            try {
              const content = fs.readFileSync(path.join(dir, e.name), 'utf-8');
              const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
              if (fmMatch) {
                const posMatch = fmMatch[1].match(/sidebar_position:\s*(\d+)/);
                if (posMatch) position = parseInt(posMatch[1]);
                const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
                if (titleMatch) label = titleMatch[1];
                // Preferuj sidebar_label (shodné s Docusaurus)
                const labelMatch = fmMatch[1].match(/sidebar_label:\s*["']?(.+?)["']?\s*$/m);
                if (labelMatch) label = labelMatch[1];
              }
            } catch (err) { /* ignore */ }
          }
          return { entry: e, position, label };
        });

        // Řazení: složky a soubory dohromady podle position, pak abecedně
        entryMeta.sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return a.label.localeCompare(b.label, 'cs');
        });

        for (const { entry, label: folderLabel } of entryMeta) {
          const fullPath = path.join(dir, entry.name);
          const relPath = 'docs/' + prefix + entry.name;
          if (entry.isDirectory()) {
            const children = [];
            const subEntries = fs.readdirSync(fullPath, { withFileTypes: true })
              .filter(e => {
                if (e.isDirectory()) return !SKIP_DIRS.includes(e.name);
                return (e.name.endsWith('.md') || e.name.endsWith('.mdx'));
              });

            // Řazení pod-položek podle sidebar_position z frontmatter
            const subMeta = subEntries.map(sub => {
              let pos = 999, title = sub.name.replace(/\.mdx?$/, ''), sidebarLabel = null;
              if (!sub.isDirectory()) {
                try {
                  const content = fs.readFileSync(path.join(fullPath, sub.name), 'utf-8');
                  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
                  if (fmMatch) {
                    const posMatch = fmMatch[1].match(/sidebar_position:\s*(\d+)/);
                    if (posMatch) pos = parseInt(posMatch[1]);
                    const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
                    if (titleMatch) title = titleMatch[1];
                    // Preferuj sidebar_label (shodné s Docusaurus sidebar)
                    const labelMatch = fmMatch[1].match(/sidebar_label:\s*["']?(.+?)["']?\s*$/m);
                    if (labelMatch) sidebarLabel = labelMatch[1];
                  }
                } catch (err) { /* ignore */ }
              }
              return { sub, pos, title: sidebarLabel || title };
            });
            subMeta.sort((a, b) => {
              if (a.pos !== b.pos) return a.pos - b.pos;
              return a.title.localeCompare(b.title, 'cs');
            });

            for (const { sub, title } of subMeta) {
              const subRel = 'docs/' + prefix + entry.name + '/' + sub.name;
              if (sub.isDirectory()) continue; // pro teď jen 1 úroveň hloubky
              if (!canUserAccessPage(username, subRel)) continue;
              const urlPath = '/' + (prefix + entry.name + '/' + sub.name).replace(/\.mdx?$/, '');
              children.push({ type: 'page', title, url: urlPath, path: subRel });
            }
            if (children.length > 0) {
              docsTree.push({ type: 'folder', label: folderLabel, children });
            }
          } else {
            // Root-level soubor
            if (!canUserAccessPage(username, relPath)) continue;
            // Preferuj sidebar_label pro konzistenci s Docusaurus sidebar
            let title = folderLabel; // folderLabel z entryMeta (čte sidebar_label i title)
            const urlPath = '/' + (prefix + entry.name).replace(/\.mdx?$/, '');
            docsTree.push({ type: 'page', title, url: urlPath, path: relPath });
          }
        }
      } catch (e) { /* ignore */ }
    }
    buildNavTree(docsDir, '');
    result.docsTree = docsTree;

    res.json(result);
  } catch (e) {
    console.error('[Home] Error:', e);
    res.status(500).json({ error: 'home_error' });
  }
});

app.get('/api/me/stats', (req, res) => {
  if (!req.ekUser) return res.status(401).json({ error: 'not_authenticated' });
  const username = req.ekUser;

  try {
    // Unikátní stránky, které uživatel navštívil (distinct page_path)
    const pagesRead = db.prepare(`
      SELECT COUNT(DISTINCT page_path) as count FROM page_sessions WHERE username = ?
    `).get(username).count;

    // Potvrzení přečtení
    const confirmsDone = db.prepare(`
      SELECT COUNT(DISTINCT doc_id) as count FROM confirmations WHERE username = ?
    `).get(username).count;

    // Kvízy dokončené
    const quizzesDone = db.prepare(`
      SELECT COUNT(DISTINCT page_path) as count FROM quiz_results WHERE username = ?
    `).get(username).count;

    // Celkový aktivní čas (ms)
    const totalActiveTime = db.prepare(`
      SELECT COALESCE(SUM(active_time_ms), 0) as total FROM page_sessions WHERE username = ?
    `).get(username).total;

    // Poslední aktivita
    const lastActivity = db.prepare(`
      SELECT MAX(started_at) as last FROM page_sessions WHERE username = ?
    `).get(username).last;

    // Celkový počet stránek dostupných uživateli (z access matice)
    const accessiblePages = getAccessiblePages(username);
    const totalPagesAvailable = accessiblePages.length;

    res.json({
      pagesRead,
      totalPagesAvailable,
      confirmsDone,
      confirmsRequired: null,  // TODO: až bude tracking per stránka
      quizzesDone,
      quizzesRequired: null,   // TODO: až bude tracking per stránka
      totalActiveTimeMs: totalActiveTime,
      lastActivity
    });
  } catch (e) {
    console.error('[Stats] Error:', e);
    res.status(500).json({ error: 'stats_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Sidebar tree (veřejný endpoint pro client-side sidebar)
// ---------------------------------------------------------------------------
app.get('/api/sidebar', (req, res) => {
  try {
    const docsDir = path.join(__dirname, 'docs');

    function scanDir(dir, relativePath) {
      const items = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter(e => {
            if (e.name.startsWith('_') || e.name.startsWith('.') || e.name.startsWith('@')) return false;
            const SKIP = ['@eadir', '.obsidian', '_shared', 'node_modules', '.git'];
            if (e.isDirectory() && SKIP.includes(e.name)) return false;
            return true;
          });

        // Přečti metadata (position, label) z _category_.json a frontmatter
        const entriesWithMeta = entries.map(e => {
          let position = 999;
          let label = e.name;
          let isIndex = false;

          if (e.isDirectory()) {
            const catPath = path.join(dir, e.name, '_category_.json');
            if (fs.existsSync(catPath)) {
              try {
                const catJson = JSON.parse(fs.readFileSync(catPath, 'utf8'));
                if (catJson.position != null) position = catJson.position;
                if (catJson.label) label = catJson.label;
              } catch (err) { /* ignore */ }
            }
          } else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) {
            isIndex = e.name === 'index.md' || e.name === 'index.mdx';
            try {
              const content = fs.readFileSync(path.join(dir, e.name), 'utf8');
              const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
              if (fmMatch) {
                const posMatch = fmMatch[1].match(/sidebar_position:\s*(\d+)/);
                if (posMatch) position = parseInt(posMatch[1]);
                const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
                if (titleMatch) label = titleMatch[1];
                const labelMatch = fmMatch[1].match(/sidebar_label:\s*["']?(.+?)["']?\s*$/m);
                if (labelMatch) label = labelMatch[1];
              }
            } catch (err) { /* ignore */ }
          }

          return { entry: e, position, label, isIndex };
        });

        // Řaď podle position, pak abecedně
        entriesWithMeta.sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return a.label.localeCompare(b.label, 'cs');
        });

        for (const { entry, position, label, isIndex } of entriesWithMeta) {
          const fullPath = path.join(dir, entry.name);
          // Slug — strip numeric prefix (00-firma → firma)
          const slug = entry.name.replace(/^\d+-/, '').replace(/\.(md|mdx)$/, '');

          if (entry.isDirectory()) {
            const childRelPath = relativePath ? relativePath + '/' + slug : slug;
            // Kategorie href = /slug/ (index.md uvnitř)
            const hasIndex = fs.existsSync(path.join(fullPath, 'index.md')) || fs.existsSync(path.join(fullPath, 'index.mdx'));
            const href = '/' + childRelPath + '/';
            const children = scanDir(fullPath, childRelPath);
            items.push({
              label,
              href: hasIndex ? href : null,
              type: 'category',
              children
            });
          } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
            if (isIndex) {
              // index.md v kořeni = homepage Přehled
              if (relativePath === '') {
                items.unshift({ label: 'Přehled', href: '/', type: 'page' });
              }
              // index.md v podsložce přeskočíme (kategorie link se řeší výše)
            } else {
              const href = '/' + (relativePath ? relativePath + '/' : '') + slug;
              items.push({ label, href, type: 'page' });
            }
          }
        }
      } catch (e) {
        console.warn('[Sidebar] scan error:', e.message);
      }
      return items;
    }

    const tree = scanDir(docsDir, '');
    res.json(tree);
  } catch (e) {
    console.error('[Sidebar] Error:', e);
    res.status(500).json({ error: 'sidebar_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Search (fulltextové prohledávání docs/)
// ---------------------------------------------------------------------------
app.get('/api/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const mode = req.query.mode || 'all'; // 'folders' | 'headings' | 'text' | 'all'
    if (!q || q.length < 2) return res.json([]);

    const docsDir = path.join(__dirname, 'docs');
    const SKIP_DIRS = ['@eadir', '.obsidian', '_shared', 'node_modules', '.git'];
    const results = [];
    const MAX_RESULTS = 30;

    function searchDir(dir, prefix) {
      if (results.length >= MAX_RESULTS) return;
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      entries = entries.filter(e => {
        if (e.name.startsWith('_') || e.name.startsWith('.')) return false;
        if (e.isDirectory()) return !SKIP_DIRS.includes(e.name.toLowerCase()) && !e.name.startsWith('@');
        return e.name.endsWith('.md') || e.name.endsWith('.mdx');
      }).sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of entries) {
        if (results.length >= MAX_RESULTS) break;
        const fullPath = path.join(dir, entry.name);
        const relPath = prefix + entry.name;

        if (entry.isDirectory()) {
          // Folder name match
          if (mode === 'folders' || mode === 'all') {
            if (entry.name.toLowerCase().includes(q)) {
              const folderUrl = '/' + relPath.split('/').map(s => s.replace(/^\d+-/, '')).join('/');
              results.push({ type: 'folder', path: relPath, name: entry.name, url: folderUrl });
            }
          }
          searchDir(fullPath, relPath + '/');
        } else {
          // Read file content
          let raw;
          try { raw = fs.readFileSync(fullPath, 'utf-8'); } catch (e) { continue; }

          // Parse frontmatter title
          let title = entry.name.replace(/\.mdx?$/, '');
          const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
          let content = raw;
          if (fmMatch) {
            const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
            if (titleMatch) title = titleMatch[1];
            content = raw.slice(fmMatch[0].length);
          }
          // Remove import lines
          content = content.replace(/^import\s+.*$/gm, '').trim();

          // Title/filename match (always included in all modes)
          const titleMatch = (mode === 'folders' || mode === 'all') && title.toLowerCase().includes(q);

          // Heading match
          let headingHits = [];
          if (mode === 'headings' || mode === 'all') {
            const lines = content.split('\n');
            for (const line of lines) {
              const hm = line.match(/^(#{1,4})\s+(.+)/);
              if (hm) {
                const hText = hm[2].replace(/[*_`\[\]]/g, '');
                if (hText.toLowerCase().includes(q)) {
                  headingHits.push({ level: hm[1].length, text: hText });
                }
              }
            }
          }

          // Text content match (snippet)
          let textSnippet = null;
          if (mode === 'text' || mode === 'all') {
            // Strip markdown formatting for search
            const plain = content.replace(/^#+\s+/gm, '').replace(/[*_`\[\]()!]/g, '');
            const idx = plain.toLowerCase().indexOf(q);
            if (idx !== -1) {
              const start = Math.max(0, idx - 40);
              const end = Math.min(plain.length, idx + q.length + 60);
              textSnippet = (start > 0 ? '...' : '') + plain.slice(start, end).trim() + (end < plain.length ? '...' : '');
            }
          }

          // Build URL path for Docusaurus navigation (strip numeric prefixes like sidebar API does)
          const urlPath = '/' + relPath.replace(/\/(index|_index)\.mdx?$/, '').replace(/\.mdx?$/, '').split('/').map(s => s.replace(/^\d+-/, '')).join('/');

          if (titleMatch || headingHits.length > 0 || textSnippet) {
            results.push({
              type: 'page',
              path: relPath,
              url: urlPath,
              title: title,
              headings: headingHits.length > 0 ? headingHits.slice(0, 3) : undefined,
              snippet: textSnippet || undefined,
              titleMatch: titleMatch || undefined
            });
          }
        }
      }
    }

    searchDir(docsDir, '');
    res.json(results);
  } catch (e) {
    console.error('[Search] Error:', e);
    res.status(500).json({ error: 'search_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Admin (správa uživatelů, skupin, výjimek)
// ---------------------------------------------------------------------------
function requireAdmin(req, res, next) {
  const access = getUserAccess(req.ekUser);
  if (!access.includes('*')) return res.status(403).json({ error: 'admin_only' });
  next();
}

// Editoři + Admini — pro /obsah (správa přiřazení obsahu)
function requireEditor(req, res, next) {
  const access = getUserAccess(req.ekUser);
  if (access.includes('*')) return next(); // admin má vždy přístup
  const config = getAuthConfig();
  const userGroups = config.users?.[req.ekUser]?.groups || [];
  if (userGroups.includes('editori')) return next();
  return res.status(403).json({ error: 'editor_or_admin_only' });
}

// Celý config (pro admin stránku)
app.get('/api/admin/config', requireAdmin, (req, res) => {
  res.json(getAuthConfig());
});

// Uložit celý config
app.post('/api/admin/config', requireAdmin, (req, res) => {
  try {
    const config = req.body;
    if (!config.users || !config.groups) return res.status(400).json({ error: 'invalid_config' });

    // ---- BEZPEČNOSTNÍ POJISTKA ----
    // Ověř, že po uložení zůstane alespoň jeden admin
    const adminGroups = new Set();
    for (const [gid, g] of Object.entries(config.groups || {})) {
      if ((g.access || []).includes('*')) adminGroups.add(gid);
    }
    let adminCount = 0;
    for (const [uid, u] of Object.entries(config.users || {})) {
      if ((u.groups || []).some(g => adminGroups.has(g))) adminCount++;
    }
    if (adminCount === 0) {
      return res.status(400).json({
        error: 'no_admin',
        message: 'Konfigurace by odstranila všechny správce. Musí existovat alespoň jeden uživatel ve skupině s * přístupem.'
      });
    }

    saveAuthConfig(config);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Admin] save config error:', e);
    res.status(500).json({ error: 'save_error', message: e.message });
  }
});

// Pomocná funkce — zjistí, kolik admin uživatelů existuje (mají * přes skupinu)
function countAdminUsers(config) {
  let count = 0;
  const adminGroups = new Set();
  for (const [gid, g] of Object.entries(config.groups || {})) {
    if ((g.access || []).includes('*')) adminGroups.add(gid);
  }
  for (const [uid, u] of Object.entries(config.users || {})) {
    if ((u.groups || []).some(g => adminGroups.has(g))) count++;
  }
  return count;
}

// CRUD uživatel
app.put('/api/admin/user/:id', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    const { id } = req.params;
    const { firstName, lastName, groups } = req.body;
    if (!firstName) return res.status(400).json({ error: 'missing_firstName' });

    // ---- BEZPEČNOSTNÍ POJISTKA ----
    // Pokud editujeme existujícího admina, nesmíme mu odebrat admin skupinu, pokud je poslední
    const existingUser = config.users?.[id];
    if (existingUser) {
      const wasAdmin = getUserAccess(id).includes('*');
      if (wasAdmin) {
        // Simuluj nové skupiny a zkontroluj jestli by stále měl *
        const adminGroups = new Set();
        for (const [gid, g] of Object.entries(config.groups || {})) {
          if ((g.access || []).includes('*')) adminGroups.add(gid);
        }
        const wouldBeAdmin = (groups || []).some(g => adminGroups.has(g));
        if (!wouldBeAdmin && countAdminUsers(config) <= 1) {
          return res.status(400).json({
            error: 'last_admin',
            message: 'Nelze odebrat admin skupinu poslednímu správci "' + id + '". Systém by zůstal bez admina.'
          });
        }
      }
    }

    config.users = config.users || {};
    config.users[id] = { firstName, lastName: lastName || '', groups: groups || ['uzivatele'] };
    saveAuthConfig(config);
    res.json({ ok: true, user: config.users[id] });
  } catch (e) {
    console.error('[Admin] save user error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

app.delete('/api/admin/user/:id', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    const { id } = req.params;
    if (!config.users?.[id]) return res.status(404).json({ error: 'user_not_found' });

    // ---- BEZPEČNOSTNÍ POJISTKA ----
    // Nelze smazat posledního admina
    const isAdmin = getUserAccess(id).includes('*');
    if (isAdmin && countAdminUsers(config) <= 1) {
      return res.status(400).json({
        error: 'last_admin',
        message: 'Nelze smazat posledního správce "' + id + '". Systém by zůstal bez admina.'
      });
    }

    delete config.users[id];
    if (config.overrides?.[id]) delete config.overrides[id];
    saveAuthConfig(config);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Admin] delete user error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

// CRUD skupina
app.put('/api/admin/group/:id', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    const { id } = req.params;
    const { label, description, access, icon } = req.body;
    if (!label) return res.status(400).json({ error: 'missing_label' });

    // ---- BEZPEČNOSTNÍ POJISTKA ----
    // Pokud editujeme skupinu, která má *, nesmí se * odebrat
    const existingGroup = config.groups?.[id];
    if (existingGroup && (existingGroup.access || []).includes('*')) {
      if (!(access || []).includes('*')) {
        return res.status(400).json({
          error: 'cannot_remove_admin',
          message: 'Nelze odebrat * (admin přístup) ze skupiny "' + id + '". Tím by se zamkla administrace.'
        });
      }
    }

    config.groups = config.groups || {};
    config.groups[id] = {
      label,
      description: description || '',
      access: access || [],
      icon: icon || null
    };
    saveAuthConfig(config);
    res.json({ ok: true, group: config.groups[id] });
  } catch (e) {
    console.error('[Admin] save group error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

app.delete('/api/admin/group/:id', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    const { id } = req.params;
    if (!config.groups?.[id]) return res.status(404).json({ error: 'group_not_found' });

    // ---- BEZPEČNOSTNÍ POJISTKA ----
    // Nelze smazat skupinu, která má * (admin přístup)
    if ((config.groups[id].access || []).includes('*')) {
      return res.status(400).json({
        error: 'cannot_delete_admin_group',
        message: 'Nelze smazat skupinu "' + id + '" — má admin přístup (*). Nejdřív přesuňte * jinam.'
      });
    }

    // Odeber skupinu ze všech uživatelů
    for (const [uid, user] of Object.entries(config.users || {})) {
      user.groups = (user.groups || []).filter(g => g !== id);
    }
    delete config.groups[id];
    saveAuthConfig(config);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Admin] delete group error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

// Upload profilové fotky uživatele (base64 v JSON)
app.put('/api/admin/user/:id/photo', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    const { id } = req.params;
    if (!config.users?.[id]) return res.status(404).json({ error: 'user_not_found' });
    config.users[id].photo = req.body.photo || null;
    saveAuthConfig(config);
    res.json({ ok: true });
  } catch (e) {
    console.error('[Admin] photo upload error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

// Výjimky per uživatel — DEPRECATED, ponecháno pro zpětnou kompatibilitu
// Správa obsahu se přesunula na /obsah (access matrix).

// ---------------------------------------------------------------------------
// API — Access Matrix (přístupová matice obsahu)
// ---------------------------------------------------------------------------

// Struktura docs/ + frontmatter audience tagy
// Přístupné pro editory + adminy (správa obsahu)
app.get('/api/admin/docs', requireEditor, (req, res) => {
  const structure = scanDocsStructure();
  const matrix = loadAccessMatrix();
  // Přidej access info ke každému záznamu
  for (const item of structure) {
    if (item.type === 'page') {
      item.access = matrix.pages?.[item.path] || null;
    } else if (item.type === 'folder') {
      item.access = matrix.folders?.[item.path] || null;
    }
  }
  res.json(structure);
});

// Osnova stránky — nadpisy + první odstavec (pro Přiřazení obsahu)
app.get('/api/admin/doc-preview', requireEditor, (req, res) => {
  try {
    const docPath = req.query.path;
    if (!docPath || !docPath.startsWith('docs/')) {
      return res.status(400).json({ error: 'invalid_path' });
    }
    const fullPath = path.join(__dirname, docPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'not_found' });
    }
    const raw = fs.readFileSync(fullPath, 'utf-8');
    // Odstraň frontmatter
    let content = raw.replace(/^---\n[\s\S]*?\n---\n*/, '');
    // Odstraň import řádky
    content = content.replace(/^import\s+.*$/gm, '').trim();

    const lines = content.split('\n');

    // 1) Extrahuj nadpisy (outline)
    const headings = [];
    for (const line of lines) {
      const hMatch = line.match(/^(#{1,4})\s+(.+)/);
      if (hMatch) {
        headings.push({ level: hMatch[1].length, text: hMatch[2].replace(/[*_`]/g, '') });
      }
    }

    // 2) První odstavec — první blok ne-prázdného textu (ne nadpis, ne kód, ne mermaid)
    let firstParagraph = '';
    let inCodeBlock = false;
    for (const line of lines) {
      if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
      if (inCodeBlock) continue;
      if (line.startsWith('#')) continue;
      if (line.startsWith('import ')) continue;
      if (line.startsWith(':::')) continue;
      if (line.startsWith('<')) continue;
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        firstParagraph = trimmed;
        break;
      }
    }
    // Ořízni na ~200 znaků
    if (firstParagraph.length > 200) {
      firstParagraph = firstParagraph.substring(0, 200) + '…';
    }

    // 3) Statistika
    const wordCount = content.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;

    res.json({
      ok: true,
      headings,
      firstParagraph,
      wordCount,
      headingCount: headings.length
    });
  } catch (e) {
    console.error('[DocPreview] error:', e);
    res.status(500).json({ error: 'read_error' });
  }
});

// Celá matice
app.get('/api/admin/access-matrix', requireEditor, (req, res) => {
  res.json(loadAccessMatrix());
});

// Nastavit přístup pro stránku
app.put('/api/admin/access/page', requireEditor, (req, res) => {
  try {
    const { path: pagePath, groups, users, denyGroups, denyUsers, requiredGroups, requiredUsers } = req.body;
    if (!pagePath) return res.status(400).json({ error: 'missing_path' });
    const matrix = loadAccessMatrix();
    matrix.pages = matrix.pages || {};
    const hasAny = (groups?.length || 0) + (users?.length || 0) + (denyGroups?.length || 0) + (denyUsers?.length || 0)
                 + (requiredGroups?.length || 0) + (requiredUsers?.length || 0);
    if (!hasAny) {
      delete matrix.pages[pagePath];
    } else {
      matrix.pages[pagePath] = {
        groups: groups || [],
        users: users || [],
        denyGroups: denyGroups || [],
        denyUsers: denyUsers || [],
        requiredGroups: requiredGroups || [],
        requiredUsers: requiredUsers || []
      };
    }
    saveAccessMatrix(matrix);
    res.json({ ok: true });
  } catch (e) {
    console.error('[AccessMatrix] page error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

// Nastavit přístup pro složku (s dědičností)
app.put('/api/admin/access/folder', requireEditor, (req, res) => {
  try {
    const { path: folderPath, groups, users, denyGroups, denyUsers, requiredGroups, requiredUsers, inherit } = req.body;
    if (!folderPath) return res.status(400).json({ error: 'missing_path' });
    const matrix = loadAccessMatrix();
    matrix.folders = matrix.folders || {};
    const hasAny = (groups?.length || 0) + (users?.length || 0) + (denyGroups?.length || 0) + (denyUsers?.length || 0)
                 + (requiredGroups?.length || 0) + (requiredUsers?.length || 0);
    if (!hasAny) {
      delete matrix.folders[folderPath];
    } else {
      matrix.folders[folderPath] = {
        groups: groups || [],
        users: users || [],
        denyGroups: denyGroups || [],
        denyUsers: denyUsers || [],
        requiredGroups: requiredGroups || [],
        requiredUsers: requiredUsers || [],
        inherit: inherit !== false
      };
    }
    saveAccessMatrix(matrix);
    res.json({ ok: true });
  } catch (e) {
    console.error('[AccessMatrix] folder error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

// Sync frontmatter audience tagů do matice (návrhy)
app.post('/api/admin/access/sync-frontmatter', requireEditor, (req, res) => {
  try {
    const structure = scanDocsStructure();
    const matrix = loadAccessMatrix();
    let synced = 0;
    for (const item of structure) {
      if (item.type === 'page' && item.audience && !matrix.pages?.[item.path]) {
        // Frontmatter audience tag → mapuj na skupiny
        matrix.pages = matrix.pages || {};
        matrix.pages[item.path] = { groups: item.audience, users: [], _fromFrontmatter: true };
        synced++;
      }
    }
    saveAccessMatrix(matrix);
    res.json({ ok: true, synced });
  } catch (e) {
    console.error('[AccessMatrix] sync error:', e);
    res.status(500).json({ error: 'sync_error' });
  }
});

// ---------------------------------------------------------------------------
// API — Section Themes (per-sekce barevné schéma)
// ---------------------------------------------------------------------------
// GET /api/admin/section-themes — vrátí _structure.json + aktuální témata
app.get('/api/admin/section-themes', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    const themes = config.sectionThemes || {};
    // Načti _structure.json pro seznam sekcí
    let sections = [];
    const structPath = path.join(__dirname, 'docs', '_structure.json');
    if (fs.existsSync(structPath)) {
      try {
        const struct = JSON.parse(fs.readFileSync(structPath, 'utf8'));
        sections = (struct.sections || []).map(function(s) {
          return {
            folder: s.folder, label: s.label, type: s.type,
            pages: (s.pages || []).map(function(p) {
              return { file: p.file, title: p.title, type: p.type };
            })
          };
        });
      } catch (e) { /* ignore */ }
    }
    // Doplň sekce které jsou v docs/ ale ne v _structure.json
    const docsDir = path.join(__dirname, 'docs');
    const dirs = fs.readdirSync(docsDir, { withFileTypes: true })
      .filter(function(d) { return d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'); })
      .map(function(d) { return d.name; });
    dirs.forEach(function(dir) {
      if (!sections.find(function(s) { return s.folder === dir; })) {
        var label = dir;
        var catPath = path.join(docsDir, dir, '_category_.json');
        if (fs.existsSync(catPath)) {
          try { label = JSON.parse(fs.readFileSync(catPath, 'utf8')).label || dir; } catch (e) {}
        }
        // Scanuj MD soubory ve složce
        var pages = [];
        try {
          pages = fs.readdirSync(path.join(docsDir, dir))
            .filter(function(f) { return (f.endsWith('.md') || f.endsWith('.mdx')) && !f.startsWith('_'); })
            .map(function(f) { return { file: f, title: f.replace(/\.(md|mdx)$/, ''), type: '' }; });
        } catch (e) {}
        sections.push({ folder: dir, label: label, type: 'unknown', pages: pages });
      }
    });
    res.json({ sections, themes });
  } catch (e) {
    console.error('[SectionThemes] load error:', e);
    res.status(500).json({ error: 'load_error' });
  }
});

// PUT /api/admin/section-themes — uložit témata
app.put('/api/admin/section-themes', requireAdmin, (req, res) => {
  try {
    const config = getAuthConfig();
    config.sectionThemes = req.body.themes || {};
    saveAuthConfig(config);
    res.json({ ok: true });
  } catch (e) {
    console.error('[SectionThemes] save error:', e);
    res.status(500).json({ error: 'save_error' });
  }
});

// GET /api/section-themes — veřejný endpoint pro klienta (bez admin)
app.get('/api/section-themes', (req, res) => {
  try {
    const config = getAuthConfig();
    res.json(config.sectionThemes || {});
  } catch (e) {
    res.json({});
  }
});

// ---------------------------------------------------------------------------
// Dashboard + Login + Admin HTML
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'hub.html'));
});

app.get('/statistiky', requireEditor, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'dashboard.html'));
});
app.get('/dashboard', (req, res) => { res.redirect(301, '/statistiky'); });

app.get('/editor', requireEditor, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'editor.html'));
});

// ---------------------------------------------------------------------------
// API — Editor (CRUD pro docs/ soubory)
// ---------------------------------------------------------------------------
// GET /api/editor/tree — strom dokumentů s metadaty
app.get('/api/editor/tree', requireEditor, (req, res) => {
  const docsDir = path.join(__dirname, 'docs');

  function readTree(dir, relativePath) {
    const items = [];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (e) { return items; }

    // Read _category_.json if exists
    let categoryMeta = {};
    const catFile = path.join(dir, '_category_.json');
    try { categoryMeta = JSON.parse(fs.readFileSync(catFile, 'utf-8')); } catch (e) {}

    entries.sort((a, b) => {
      // Folders first, then files
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name, 'cs');
    });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name.startsWith('@')) continue;

      const entryPath = path.join(dir, entry.name);
      const relPath = relativePath + '/' + entry.name;

      if (entry.isDirectory()) {
        let folderMeta = {};
        const folderCatFile = path.join(entryPath, '_category_.json');
        try { folderMeta = JSON.parse(fs.readFileSync(folderCatFile, 'utf-8')); } catch (e) {}

        const ekType = folderMeta.customProps?.ek_type || '';

        items.push({
          type: 'folder',
          name: entry.name,
          label: folderMeta.label || entry.name,
          path: 'docs' + relPath,
          position: folderMeta.position || 999,
          ek_type: ekType,
          children: readTree(entryPath, relPath),
        });
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        // Skip index.mdx (homepage)
        if (entry.name === 'index.mdx' || entry.name === 'index.md') continue;

        // Read frontmatter
        let fm = {};
        try {
          const content = fs.readFileSync(entryPath, 'utf-8');
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (fmMatch) {
            fmMatch[1].split('\n').forEach(line => {
              const m = line.match(/^(\w+):\s*["']?(.+?)["']?\s*$/);
              if (m) fm[m[1]] = m[2];
            });
          }
        } catch (e) {}

        items.push({
          type: 'file',
          name: entry.name,
          label: fm.sidebar_label || fm.title || entry.name.replace(/\.mdx?$/, ''),
          path: 'docs' + relPath,
          position: parseInt(fm.sidebar_position) || 999,
          ek_type: fm.ek_type || '',
        });
      }
    }

    // Sort by position
    items.sort((a, b) => (a.position || 999) - (b.position || 999));
    return items;
  }

  res.json({ tree: readTree(docsDir, '') });
});

// GET /api/editor/doc?path=docs/foo/bar.md — načíst obsah souboru
app.get('/api/editor/doc', requireEditor, (req, res) => {
  const docPath = req.query.path;
  if (!docPath || !docPath.startsWith('docs/')) return res.status(400).json({ error: 'invalid_path' });

  const fullPath = path.join(__dirname, docPath);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ path: docPath, content });
  } catch (e) {
    res.status(404).json({ error: 'not_found' });
  }
});

// PUT /api/editor/doc — uložit obsah souboru
app.put('/api/editor/doc', requireEditor, (req, res) => {
  const { path: docPath, content } = req.body;
  if (!docPath || !docPath.startsWith('docs/')) return res.status(400).json({ error: 'invalid_path' });

  const fullPath = path.join(__dirname, docPath);
  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    res.json({ ok: true, path: docPath });
  } catch (e) {
    res.status(500).json({ error: 'write_failed', message: e.message });
  }
});

// POST /api/editor/doc — vytvořit nový soubor
app.post('/api/editor/doc', requireEditor, (req, res) => {
  const { path: docPath, content } = req.body;
  if (!docPath || !docPath.startsWith('docs/')) return res.status(400).json({ error: 'invalid_path' });

  const fullPath = path.join(__dirname, docPath);

  // Vytvoř adresáře pokud neexistují
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Kontrola: soubor už existuje?
  if (fs.existsSync(fullPath)) return res.status(409).json({ error: 'already_exists' });

  try {
    fs.writeFileSync(fullPath, content || '', 'utf-8');
    res.json({ ok: true, path: docPath });
  } catch (e) {
    res.status(500).json({ error: 'write_failed', message: e.message });
  }
});

// POST /api/editor/folder — vytvořit novou složku s _category_.json
app.post('/api/editor/folder', requireEditor, (req, res) => {
  const { path: folderPath, label } = req.body;
  if (!folderPath || !folderPath.startsWith('docs/')) return res.status(400).json({ error: 'invalid_path' });

  const fullPath = path.join(__dirname, folderPath);
  if (fs.existsSync(fullPath)) return res.status(409).json({ error: 'already_exists' });

  try {
    fs.mkdirSync(fullPath, { recursive: true });
    // Create _category_.json with label
    const catMeta = { label: label || path.basename(folderPath), position: 999 };
    fs.writeFileSync(path.join(fullPath, '_category_.json'), JSON.stringify(catMeta, null, 2), 'utf-8');
    res.json({ ok: true, path: folderPath });
  } catch (e) {
    res.status(500).json({ error: 'create_failed', message: e.message });
  }
});

// PUT /api/editor/move — přesunout soubor
app.put('/api/editor/move', requireEditor, (req, res) => {
  const { from, to } = req.body;
  if (!from || !from.startsWith('docs/') || !to || !to.startsWith('docs/')) {
    return res.status(400).json({ error: 'invalid_path' });
  }

  const fromFull = path.join(__dirname, from);
  const toFull = path.join(__dirname, to);

  if (!fs.existsSync(fromFull)) return res.status(404).json({ error: 'not_found' });

  // Ensure target directory exists
  const toDir = path.dirname(toFull);
  if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });

  try {
    fs.renameSync(fromFull, toFull);
    res.json({ ok: true, from, to });
  } catch (e) {
    res.status(500).json({ error: 'move_failed', message: e.message });
  }
});

// DELETE /api/editor/doc?path=docs/foo/bar.md — smazat soubor
app.delete('/api/editor/doc', requireEditor, (req, res) => {
  const docPath = req.query.path;
  if (!docPath || !docPath.startsWith('docs/')) return res.status(400).json({ error: 'invalid_path' });

  const fullPath = path.join(__dirname, docPath);
  try {
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'not_found' });
    fs.unlinkSync(fullPath);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'delete_failed', message: e.message });
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'login.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'admin.html'));
});

app.get('/obsah', requireEditor, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'obsah.html'));
});

app.get('/mapa', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'mapa.html'));
});

app.get('/hub', (req, res) => {
  res.redirect(301, '/');
});

// Guides — in-app help (návody na používání Mozkotron samotného)
// Tyto stránky jsou SYSTÉMOVÉ — žijí ve static/guides/, ne v docs/.
// docs/ je pro firemní obsah (postupy, pravidla). Guides jsou meta-návody na tvorbu obsahu.
app.get('/guides/:name', requireLogin, (req, res) => {
  const allowed = ['progress', 'workflow-vyvojak', 'pruvodce-tvorbou', 'pruvodce-kviz'];
  if (!allowed.includes(req.params.name)) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'static', 'guides', req.params.name + '.html'));
});

app.get('/palac', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'palace.html'));
});

app.get('/palace', (req, res) => {
  res.redirect(301, '/palac');
});

app.get('/schema', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'schema.html'));
});

app.get('/administrace', requireLogin, (req, res) => {
  res.redirect(301, '/admin');
});

// ---------------------------------------------------------------------------
// Vrstvy statických souborů (priorita: static/ > Docusaurus)
// ---------------------------------------------------------------------------
// Vrstva 1: JS z volume-mounted static/ (tracking, komponenty)
app.use('/js', express.static(path.join(__dirname, 'static', 'js')));

// Vrstva 2: CSS z volume-mounted static/
app.use('/css', express.static(path.join(__dirname, 'static', 'css')));

// Vrstva 3: Ostatní statické soubory z static/
app.use(express.static(path.join(__dirname, 'static')));

// ---------------------------------------------------------------------------
// Middleware — servírování HTML souborů z docs/ (kapitoly)
// ---------------------------------------------------------------------------
// HTML soubory uvnitř docs/ složek (např. workflow-diagram.html v kapitole)
// se servírují přímo — Docusaurus je nezpracovává.
// URL mapování: /firma/jak-dokumentujeme/matice.html → docs/00-firma/jak-dokumentujeme/matice.html
// (číselné prefixy složek se stripují z URL, stejně jako u docPathToUrl)

function resolveDocsHtmlPath(urlPath) {
  const docsDir = path.join(__dirname, 'docs');
  const segments = urlPath.replace(/^\//, '').split('/');
  if (segments.length === 0) return null;

  const htmlFile = segments.pop();
  if (!htmlFile.endsWith('.html')) return null;

  // Projdi adresáře — matchuj URL segmenty na složky s/bez číselného prefixu
  let currentDir = docsDir;
  for (const seg of segments) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      let found = false;
      for (const e of entries) {
        if (e.isDirectory()) {
          const stripped = e.name.replace(/^\d+-/, '');
          if (stripped === seg || e.name === seg) {
            currentDir = path.join(currentDir, e.name);
            found = true;
            break;
          }
        }
      }
      if (!found) return null;
    } catch (err) { return null; }
  }

  const fullPath = path.join(currentDir, htmlFile);
  if (fs.existsSync(fullPath)) return fullPath;
  return null;
}

app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.path.endsWith('.html')) return next();
  if (!req.ekUser) return next(); // requireLogin řeší redirect

  const htmlPath = resolveDocsHtmlPath(req.path);
  if (!htmlPath) return next(); // Není v docs/ → fallthrough

  // Ověř přístup ke složce obsahující HTML soubor
  const docsDir = path.join(__dirname, 'docs');
  const relDir = path.relative(docsDir, path.dirname(htmlPath));
  const folderDocPath = 'docs/' + relDir;

  if (!canUserAccessPage(req.ekUser, folderDocPath)) {
    console.log(`[AccessControl] DENIED HTML: user=${req.ekUser} file=${req.path}`);
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Přístup odepřen</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
               background: #0d0d1a; color: #d0d0d8; display: flex; align-items: center; justify-content: center;
               min-height: 100vh; margin: 0; text-align: center; }
        .box { max-width: 420px; }
        h1 { font-size: 1.3rem; color: #ef4444; margin-bottom: 0.8rem; }
        p { color: #888; font-size: 0.9rem; line-height: 1.5; }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style></head>
      <body><div class="box">
        <h1>🔒 Přístup odepřen</h1>
        <p>Nemáš oprávnění zobrazit tuto stránku.<br>Kontaktuj správce.</p>
        <p style="margin-top:1.5rem;"><a href="/">← Zpět na hlavní stránku</a></p>
      </div></body></html>
    `);
  }

  console.log(`[DocsHTML] Serving: ${req.path} → ${htmlPath}`);
  res.sendFile(htmlPath);
});

// ---------------------------------------------------------------------------
// Middleware — filtrování obsahu podle přístupové matice
// ---------------------------------------------------------------------------
// Mapuje URL cestu na docs/ soubor a ověří přístup přes canUserAccessPage().
// Musí být PŘED proxy na Docusaurus, aby zablokoval přístup dřív než se stránka pošle.

const SKIP_ACCESS_CHECK = ['/login', '/statistiky', '/admin', '/editor', '/obsah', '/api/', '/__docusaurus', '/assets/'];

function accessControlMiddleware(req, res, next) {
  // Přeskočit ne-GET požadavky (POST, PUT, DELETE jdou na API)
  if (req.method !== 'GET') return next();

  // Přeskočit statické assety (včetně .html — docs/ HTML je handled výše)
  if (req.path.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|map|json|html)$/)) return next();

  // Přeskočit cesty, které se nekontrolují
  if (SKIP_ACCESS_CHECK.some(p => req.path === p || req.path.startsWith(p))) return next();

  // Přeskočit WebSocket upgrade (hot reload)
  if (req.headers.upgrade === 'websocket') return next();

  // Nepřihlášený — requireLogin už to řeší výše, ale pro jistotu
  if (!req.ekUser) return next();

  // Mapuj URL cestu na docs/ soubor
  // Docusaurus s routeBasePath: '/' servíruje docs na /<slug>
  // URL /aor-prodej/reklamacni-sop → docs/aor-prodej/reklamacni-sop.md
  const urlPath = req.path.replace(/\/$/, '') || '/';

  // Přeskočit homepage
  if (urlPath === '' || urlPath === '/') return next();

  // Zkus najít odpovídající .md/.mdx soubor
  const docsDir = path.join(__dirname, 'docs');
  const possiblePaths = [
    'docs' + urlPath + '.md',
    'docs' + urlPath + '.mdx',
    'docs' + urlPath + '/index.md',
    'docs' + urlPath + '/index.mdx',
  ];

  let matchedDocPath = null;
  for (const p of possiblePaths) {
    const fsPath = path.join(__dirname, p.replace(/^docs\//, 'docs/'));
    if (fs.existsSync(fsPath)) {
      matchedDocPath = p;
      break;
    }
  }

  // Pokud nenalezeno, může to být kategorie/složka — zkontroluj
  if (!matchedDocPath) {
    // Zkus jestli je to složka v docs/
    const folderPath = path.join(docsDir, urlPath.replace(/^\//, ''));
    if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
      matchedDocPath = 'docs' + urlPath; // folder path pro canUserAccessPage
    } else {
      // Neznámá cesta — nechat projít (Docusaurus ukáže 404)
      return next();
    }
  }

  // Ověř přístup
  if (!canUserAccessPage(req.ekUser, matchedDocPath)) {
    console.log(`[AccessControl] DENIED: user=${req.ekUser} page=${matchedDocPath}`);
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Přístup odepřen</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
               background: #0d0d1a; color: #d0d0d8; display: flex; align-items: center; justify-content: center;
               min-height: 100vh; margin: 0; text-align: center; }
        .box { max-width: 420px; }
        h1 { font-size: 1.3rem; color: #ef4444; margin-bottom: 0.8rem; }
        p { color: #888; font-size: 0.9rem; line-height: 1.5; }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style></head>
      <body><div class="box">
        <h1>🔒 Přístup odepřen</h1>
        <p>Nemáš oprávnění zobrazit tuto stránku.<br>Pokud si myslíš, že bys měl(a) mít přístup, kontaktuj správce.</p>
        <p style="margin-top:1.5rem;"><a href="/">← Zpět na hlavní stránku</a></p>
      </div></body></html>
    `);
  }

  next();
}

app.use(accessControlMiddleware);

// ---------------------------------------------------------------------------
// Vrstva 4: Proxy na Docusaurus dev server (live reload, hot changes)
// ---------------------------------------------------------------------------
const DOCUSAURUS_PORT = process.env.DOCUSAURUS_PORT || 3001;
const docusaurusProxy = createProxyMiddleware({
  target: `http://127.0.0.1:${DOCUSAURUS_PORT}`,
  changeOrigin: false,
  ws: true,
  onError: (err, req, res) => {
    console.warn('[Proxy] Docusaurus dev server nedostupný:', err.message);
    if (!res.headersSent) {
      res.status(503).send('<h1>Docusaurus se spouští...</h1><p>Zkus to za chvíli. Dev server se startuje po spuštění kontejneru (~30s).</p><script>setTimeout(()=>location.reload(),5000)</script>');
    }
  }
});

// API 404 handler — aby proxy nechytal API requesty
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Všechno ostatní → Docusaurus dev server
app.use(docusaurusProxy);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Docs Watcher — auto-invalidace cache při změně struktury docs/
// ---------------------------------------------------------------------------
const DOCS_DIR = process.env.DOCS_DIR || path.join(__dirname, 'docs');
const docsWatcher = startWatcher({
  docsDir: DOCS_DIR,
  docusaurusDir: __dirname,
  devServerPort: parseInt(DOCUSAURUS_PORT),
  onRestart: () => {
    console.log('[Server] Docusaurus restartuje kvůli změně docs/...');
  },
  onReady: () => {
    // Po rebuildu aktualizovat sidebarMap
    sidebarMap = buildSidebarMapFromDocs();
    console.log('[Server] Sidebar map aktualizována po rebuildu');
  },
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Mozek Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[Mozek Server] Auth config: ${AUTH_CONFIG_PATH}`);
  console.log(`[Mozek Server] SQLite: ${DB_PATH}`);
  console.log(`[Mozek Server] Docusaurus dev server proxy → http://127.0.0.1:${DOCUSAURUS_PORT}`);
  console.log(`[Mozek Server] Docs watcher: ACTIVE`);
  console.log(`[Mozek Server] Mode: DEV (live reload + auto-rebuild)`);
});

// Graceful shutdown
async function shutdown() {
  console.log('[Mozek Server] Shutting down...');
  await docsWatcher.close();
  db.close();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
