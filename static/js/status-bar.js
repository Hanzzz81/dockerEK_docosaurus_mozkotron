/**
 * Mozkotron — Stavové lišty (horní + spodní)
 * ============================================
 * Spodní bar: uživatel, čas, statistiky, navigace, odhlásit
 * Horní bar: přepínač sekcí (Dokumenty / Statistiky / Obsah / Admin)
 *   - Horní bar je toggleable přes localStorage klíč 'ek-top-nav'
 *   - Zapíná/vypíná se v /admin → záložka Nastavení
 *
 * Načítá se přes <script> v docusaurus.config.js (scripts[]).
 * Data z /api/me a /api/me/stats.
 */

(function () {
  'use strict';

  // ---- Konfigurace ----
  var REFRESH_INTERVAL = 60000;
  var loginTime = Date.now();
  var TOP_NAV_KEY = 'ek-top-nav';

  // ---- Barvy a ikony sekcí ----
  var SECTION_COLORS = {
    home:     { bg: '#1e293b', accent: '#60a5fa', border: '#334155', icon: '🧭', iconBg: '#3b82f6' },
    statistiky:{ bg: '#1e293b', accent: '#38bdf8', border: '#334155', icon: '📊', iconBg: '#0ea5e9' },
    obsah:    { bg: '#1e293b', accent: '#7c3aed', border: '#334155', icon: '🔗', iconBg: '#7c3aed' },
    editor:   { bg: '#1e293b', accent: '#38bdf8', border: '#334155', icon: '✏', iconBg: '#0ea5e9' },
    palac:    { bg: '#1e293b', accent: '#e8b4f8', border: '#334155', icon: '🏛', iconBg: '#ab47bc' },
    mapa:     { bg: '#1e293b', accent: '#f59e0b', border: '#334155', icon: '🗺', iconBg: '#f59e0b' },
    admin:    { bg: '#1e293b', accent: '#10b981', border: '#334155', icon: '⚙', iconBg: '#10b981' }
  };

  // ---- Dynamická favicona per sekce ----
  function setSectionFavicon(section) {
    var sec = SECTION_COLORS[section] || SECTION_COLORS.home;
    var color = sec.iconBg || sec.accent;
    var icon = sec.icon || 'M';

    // SVG favicona — barevný zaoblený čtverec s bílým symbolem
    var svg;
    if (icon.length === 1 && icon.charCodeAt(0) < 256) {
      // ASCII znak (písmeno) — render jako text v SVG
      svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
        '<rect width="32" height="32" rx="6" fill="' + color + '"/>' +
        '<text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#fff">' + icon + '</text>' +
      '</svg>';
    } else {
      // Emoji — render emoji na barevném pozadí
      svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
        '<rect width="32" height="32" rx="6" fill="' + color + '"/>' +
        '<text x="16" y="24" text-anchor="middle" font-size="18">' + icon + '</text>' +
      '</svg>';
    }

    var dataUri = 'data:image/svg+xml,' + encodeURIComponent(svg);

    // Nahradit nebo vytvořit favicon link
    var link = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = dataUri;
  }

  // ---- CSS ----
  var style = document.createElement('style');
  style.textContent = [
    '/* ===== SPODNÍ STATUS BAR ===== */',
    '#ek-status-bar {',
    '  position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;',
    '  background: #1e293b; border-top: 1px solid #334155;',
    '  color: #94a3b8; font-family: "Segoe UI", system-ui, -apple-system, sans-serif;',
    '  font-size: 0.78rem; height: 36px;',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  padding: 0 1rem; gap: 1rem;',
    '}',
    '#ek-status-bar .ek-sb-section { display: flex; align-items: center; gap: 0.8rem; }',
    '#ek-status-bar .ek-sb-user { color: #e2e8f0; font-weight: 600; }',
    '#ek-status-bar .ek-sb-group { color: #64748b; }',
    '#ek-status-bar .ek-sb-divider { width: 1px; height: 16px; background: #334155; }',
    '#ek-status-bar .ek-sb-stat { display: flex; align-items: center; gap: 0.3rem; }',
    '#ek-status-bar .ek-sb-stat-value { color: #38bdf8; font-weight: 600; font-variant-numeric: tabular-nums; }',
    '#ek-status-bar .ek-sb-stat-label { color: #64748b; }',
    '#ek-status-bar .ek-sb-time { color: #64748b; font-variant-numeric: tabular-nums; }',
    '#ek-status-bar .ek-sb-logout {',
    '  background: transparent; border: 1px solid #334155; border-radius: 4px;',
    '  color: #64748b; font-size: 0.72rem; padding: 3px 10px; cursor: pointer;',
    '  transition: all 0.15s;',
    '}',
    '#ek-status-bar .ek-sb-logout:hover { border-color: #ef4444; color: #ef4444; }',
    '#ek-status-bar a { color: #94a3b8; text-decoration: none; transition: color 0.15s; }',
    '#ek-status-bar a:hover { color: #e2e8f0; text-decoration: underline; }',
    '#ek-status-bar a.ek-sb-active { color: #38bdf8; font-weight: 600; }',
    '',
    '/* Posunout obsah stránky, aby lišty nepřekrývaly */',
    'body { padding-bottom: 40px !important; }',
    'body.ek-has-top-nav { padding-top: 46px !important; }',
    '',
    '/* ===== HORNÍ NAVIGAČNÍ LIŠTA ===== */',
    '#ek-top-nav {',
    '  position: fixed; top: 0; left: 0; right: 0; z-index: 9998;',
    '  background: #0d1117; border-bottom: 1px solid #1e293b;',
    '  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;',
    '  height: 42px; display: flex; align-items: center; justify-content: center;',
    '  padding: 0 1rem; gap: 0;',
    '}',
    '#ek-top-nav .ek-tn-tab {',
    '  display: flex; align-items: center; gap: 0.4rem;',
    '  padding: 0.5rem 1rem; font-size: 0.82rem; color: #64748b;',
    '  text-decoration: none; border-bottom: 2px solid transparent;',
    '  transition: all 0.15s; white-space: nowrap; height: 42px;',
    '}',
    '#ek-top-nav .ek-tn-tab:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); text-decoration: none; }',
    '#ek-top-nav .ek-tn-tab.active { font-weight: 600; border-bottom-color: currentColor; }',
    '#ek-top-nav .ek-tn-icon { font-size: 0.95rem; }',
    '#ek-top-nav .ek-tn-spacer { flex: 1; }',
    '',
    '/* ===== DEBUG KONZOLE ===== */',
    '#ek-debug-panel {',
    '  position: fixed; bottom: 36px; left: 0; right: 0; z-index: 9998;',
    '  background: #0d1117; border-top: 1px solid #1e293b;',
    '  font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;',
    '  font-size: 0.72rem; color: #8b949e;',
    '  max-height: 220px; overflow-y: auto; overflow-x: hidden;',
    '  display: none; flex-direction: column;',
    '  scrollbar-width: thin; scrollbar-color: #334155 transparent;',
    '}',
    '#ek-debug-panel.open { display: flex; }',
    '#ek-debug-panel .ek-dbg-header {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  padding: 4px 12px; background: #161b22; border-bottom: 1px solid #1e293b;',
    '  position: sticky; top: 0; z-index: 1; min-height: 24px;',
    '}',
    '#ek-debug-panel .ek-dbg-title { color: #58a6ff; font-weight: 600; font-size: 0.7rem; }',
    '#ek-debug-panel .ek-dbg-controls { display: flex; gap: 8px; align-items: center; }',
    '#ek-debug-panel .ek-dbg-btn {',
    '  background: transparent; border: 1px solid #30363d; border-radius: 3px;',
    '  color: #8b949e; font-size: 0.65rem; padding: 1px 6px; cursor: pointer;',
    '  font-family: inherit; transition: all 0.15s;',
    '}',
    '#ek-debug-panel .ek-dbg-btn:hover { border-color: #58a6ff; color: #58a6ff; }',
    '#ek-debug-panel .ek-dbg-log { padding: 4px 0; flex: 1; overflow-y: auto; }',
    '#ek-debug-panel .ek-dbg-row {',
    '  padding: 2px 12px; display: flex; gap: 8px; align-items: baseline;',
    '  border-bottom: 1px solid rgba(30,41,59,0.4);',
    '  animation: ek-dbg-fade-in 0.3s ease;',
    '}',
    '#ek-debug-panel .ek-dbg-row:hover { background: rgba(56,189,248,0.04); }',
    '#ek-debug-panel .ek-dbg-time { color: #484f58; white-space: nowrap; min-width: 65px; }',
    '#ek-debug-panel .ek-dbg-tag {',
    '  font-size: 0.6rem; padding: 0 4px; border-radius: 3px; white-space: nowrap;',
    '  font-weight: 600; min-width: 50px; text-align: center;',
    '}',
    '#ek-debug-panel .ek-dbg-tag.session { background: #1f3a1f; color: #3fb950; }',
    '#ek-debug-panel .ek-dbg-tag.heartbeat { background: #1a2a3f; color: #58a6ff; }',
    '#ek-debug-panel .ek-dbg-tag.leave { background: #3d1f1f; color: #f85149; }',
    '#ek-debug-panel .ek-dbg-tag.scroll { background: #2a2a1a; color: #d29922; }',
    '#ek-debug-panel .ek-dbg-tag.state { background: #2a1a2a; color: #bc8cff; }',
    '#ek-debug-panel .ek-dbg-tag.api { background: #1a2a2a; color: #39d353; }',
    '#ek-debug-panel .ek-dbg-tag.error { background: #3d1f1f; color: #f85149; }',
    '#ek-debug-panel .ek-dbg-msg { color: #c9d1d9; word-break: break-all; }',
    '#ek-debug-panel .ek-dbg-dim { color: #484f58; }',
    '@keyframes ek-dbg-fade-in { from { opacity: 0; background: rgba(56,189,248,0.08); } to { opacity: 1; } }',
    '',
    '.ek-sb-debug-toggle {',
    '  background: transparent; border: 1px solid #334155; border-radius: 4px;',
    '  color: #64748b; font-size: 0.7rem; padding: 2px 8px; cursor: pointer;',
    '  font-family: "Cascadia Code", "Fira Code", monospace;',
    '  transition: all 0.15s; letter-spacing: -0.5px;',
    '}',
    '.ek-sb-debug-toggle:hover { border-color: #58a6ff; color: #58a6ff; }',
    '.ek-sb-debug-toggle.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.1); }',
    '',
    '/* Responsivita */',
    '@media (max-width: 768px) {',
    '  #ek-status-bar { font-size: 0.68rem; padding: 0 0.5rem; gap: 0.5rem; }',
    '  #ek-status-bar .ek-sb-stat-label { display: none; }',
    '  #ek-top-nav .ek-tn-tab { padding: 0.5rem 0.6rem; font-size: 0.75rem; }',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // ---- Spodní bar HTML ----
  var bar = document.createElement('div');
  bar.id = 'ek-status-bar';
  bar.innerHTML = [
    '<div class="ek-sb-section">',
    '  <span class="ek-sb-user" id="ek-sb-name">...</span>',
    '  <span class="ek-sb-group" id="ek-sb-group"></span>',
    '  <span class="ek-sb-divider"></span>',
    '  <span class="ek-sb-time" id="ek-sb-time"></span>',
    '</div>',
    '<div class="ek-sb-section">',
    '  <span class="ek-sb-stat">',
    '    <span class="ek-sb-stat-value" id="ek-sb-pages">–</span>',
    '    <span class="ek-sb-stat-label">přečteno</span>',
    '  </span>',
    '  <span class="ek-sb-divider"></span>',
    '  <span class="ek-sb-stat">',
    '    <span class="ek-sb-stat-value" id="ek-sb-confirms">–</span>',
    '    <span class="ek-sb-stat-label">potvrzeno</span>',
    '  </span>',
    '  <span class="ek-sb-divider"></span>',
    '  <span class="ek-sb-stat">',
    '    <span class="ek-sb-stat-value" id="ek-sb-quizzes">–</span>',
    '    <span class="ek-sb-stat-label">kvízů</span>',
    '  </span>',
    '  <span class="ek-sb-divider"></span>',
    '  <a href="/schema" id="ek-sb-schema" style="font-size:0.72rem;color:#64748b;" title="Mapa komponent">🗂 Schema</a>',
    '  <button class="ek-sb-debug-toggle" id="ek-debug-toggle" onclick="ekToggleDebug()" title="Debug konzole">&gt;_</button>',
    '  <button class="ek-sb-logout" onclick="ekLogout()">Odhlásit</button>',
    '</div>',
  ].join('\n');

  // ---- Horní nav HTML ----
  var topNav = document.createElement('div');
  topNav.id = 'ek-top-nav';

  // ---- Funkce ----
  var GROUP_LABELS = {
    vedeni: 'Správce',
    spravci: 'IT správa',
    editori: 'Editor',
    uzivatele: 'Čtenář',
  };

  function formatDuration(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    if (h > 0) return h + 'h ' + (m % 60) + 'min';
    if (m > 0) return m + ' min';
    return s + 's';
  }

  function formatStat(done, total) {
    if (total !== null && total !== undefined) {
      return done + '/' + total;
    }
    return String(done);
  }

  function updateTime() {
    var el = document.getElementById('ek-sb-time');
    if (el) el.textContent = formatDuration(Date.now() - loginTime);
  }

  function isTopNavEnabled() {
    try { return localStorage.getItem(TOP_NAV_KEY) !== 'off'; }
    catch(e) { return true; }
  }

  /** Nastaví viditelnost horní navigace a uloží do localStorage */
  window.ekSetTopNav = function(enabled) {
    try { localStorage.setItem(TOP_NAV_KEY, enabled ? 'on' : 'off'); }
    catch(e) { /* ticho */ }
    if (enabled) {
      document.body.classList.add('ek-has-top-nav');
      topNav.style.display = 'flex';
    } else {
      document.body.classList.remove('ek-has-top-nav');
      topNav.style.display = 'none';
    }
  };

  /** Vrátí stav horní navigace */
  window.ekGetTopNav = function() {
    return isTopNavEnabled();
  };

  function getCurrentSection() {
    var path = window.location.pathname;
    if (path === '/' || path === '/hub') return 'home';
    if (path === '/statistiky') return 'statistiky';
    if (path === '/obsah') return 'obsah';
    if (path === '/editor') return 'editor';
    if (path === '/palac') return 'palac';
    if (path === '/mapa') return 'mapa';
    if (path === '/admin') return 'admin';
    return 'home';
  }

  function buildTopNav(isAdmin, isEditorOrAdmin) {
    var section = getCurrentSection();
    var tabs = [
      { id: 'home', href: '/', icon: '🧭', label: 'Domů', show: true },
      { id: 'statistiky', href: '/statistiky', icon: '📊', label: 'Statistiky čtení', show: isEditorOrAdmin },
      { id: 'editor', href: '/editor', icon: '✏️', label: 'Editor', show: isEditorOrAdmin },
      { id: 'obsah', href: '/obsah', icon: '🔗', label: 'Přiřazení obsahu', show: isEditorOrAdmin },
      { id: 'palac', href: '/palac', icon: '🏛️', label: 'Palác', show: true },
      { id: 'mapa', href: '/mapa', icon: '🗺️', label: 'Myšlenková mapa', show: true },
      { id: 'admin', href: '/admin', icon: '⚙️', label: 'Admin', show: isAdmin },
    ];

    var html = '';
    tabs.forEach(function(t) {
      if (!t.show) return;
      var cls = 'ek-tn-tab' + (section === t.id ? ' active' : '');
      var colorStyle = section === t.id ? 'color:' + SECTION_COLORS[t.id].accent + ';' : '';
      html += '<a href="' + t.href + '" class="' + cls + '" style="' + colorStyle + '">' +
        '<span class="ek-tn-icon">' + t.icon + '</span>' +
        t.label + '</a>';
    });

    topNav.innerHTML = html;
  }

  function loadUserInfo() {
    fetch('/api/me')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.authenticated) return;
        var nameEl = document.getElementById('ek-sb-name');
        var groupEl = document.getElementById('ek-sb-group');
        if (nameEl) nameEl.textContent = data.username;
        if (groupEl) {
          var labels = (data.groups || []).map(function (g) {
            return GROUP_LABELS[g] || g;
          });
          groupEl.textContent = labels.join(', ');
        }
        // Práva pro horní nav
        var isAdmin = data.access && data.access.indexOf('*') >= 0;
        var isEditorOrAdmin = isAdmin || data.isEditor;
        // Horní nav — sestavit s právy
        buildTopNav(isAdmin, isEditorOrAdmin);
      })
      .catch(function () { /* ticho */ });
  }

  function loadStats() {
    fetch('/api/me/stats')
      .then(function (r) { return r.json(); })
      .then(function (s) {
        var pagesEl = document.getElementById('ek-sb-pages');
        var confirmsEl = document.getElementById('ek-sb-confirms');
        var quizzesEl = document.getElementById('ek-sb-quizzes');
        if (pagesEl) pagesEl.textContent = formatStat(s.pagesRead, s.totalPagesAvailable);
        if (confirmsEl) confirmsEl.textContent = formatStat(s.confirmsDone, s.confirmsRequired);
        if (quizzesEl) quizzesEl.textContent = formatStat(s.quizzesDone, s.quizzesRequired);
      })
      .catch(function () { /* ticho */ });
  }

  window.ekLogout = function () {
    fetch('/api/logout', { method: 'POST' })
      .then(function () { window.location.href = '/login'; })
      .catch(function () { window.location.href = '/login'; });
  };

  // ---- Debug panel ----
  var debugPanel = document.createElement('div');
  debugPanel.id = 'ek-debug-panel';
  debugPanel.innerHTML = [
    '<div class="ek-dbg-header">',
    '  <span class="ek-dbg-title">TRACKER DEBUG</span>',
    '  <div class="ek-dbg-controls">',
    '    <span class="ek-dbg-dim" id="ek-dbg-count">0 events</span>',
    '    <button class="ek-dbg-btn" onclick="ekDebugCopy()">Copy</button>',
    '    <button class="ek-dbg-btn" onclick="ekDebugClear()">Clear</button>',
    '  </div>',
    '</div>',
    '<div class="ek-dbg-log" id="ek-dbg-log"></div>',
  ].join('\n');

  var debugOpen = false;
  var DEBUG_KEY = 'ek-debug';
  var debugEventCount = 0;

  window.ekToggleDebug = function () {
    debugOpen = !debugOpen;
    debugPanel.classList.toggle('open', debugOpen);
    var btn = document.getElementById('ek-debug-toggle');
    if (btn) btn.classList.toggle('active', debugOpen);
    try { localStorage.setItem(DEBUG_KEY, debugOpen ? 'on' : 'off'); } catch (e) {}
  };

  window.ekDebugCopy = function () {
    var log = document.getElementById('ek-dbg-log');
    if (!log) return;
    var lines = [];
    var rows = log.querySelectorAll('.ek-dbg-row');
    rows.forEach(function (row) {
      var time = row.querySelector('.ek-dbg-time');
      var tag = row.querySelector('.ek-dbg-tag');
      var msg = row.querySelector('.ek-dbg-msg');
      lines.push(
        (time ? time.textContent : '') + ' [' +
        (tag ? tag.textContent : '') + '] ' +
        (msg ? msg.textContent : '')
      );
    });
    var text = '=== TRACKER DEBUG (' + new Date().toISOString() + ') ===\n' + lines.join('\n');
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    var btn = log.closest('#ek-debug-panel').querySelector('.ek-dbg-btn');
    if (btn && btn.textContent === 'Copy') {
      btn.textContent = 'Copied!';
      btn.style.color = '#3fb950';
      btn.style.borderColor = '#3fb950';
      setTimeout(function () { btn.textContent = 'Copy'; btn.style.color = ''; btn.style.borderColor = ''; }, 1500);
    }
  };

  window.ekDebugClear = function () {
    var log = document.getElementById('ek-dbg-log');
    if (log) log.innerHTML = '';
    debugEventCount = 0;
    var cnt = document.getElementById('ek-dbg-count');
    if (cnt) cnt.textContent = '0 events';
  };

  /** Globální debug log — volá reading-tracker.js */
  window.ekDebugLog = function (tag, message, detail) {
    var log = document.getElementById('ek-dbg-log');
    if (!log) return;
    debugEventCount++;
    var now = new Date();
    var time = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join(':') + '.' + String(now.getMilliseconds()).padStart(3, '0');

    var tagClass = (tag || 'state').toLowerCase().replace(/[^a-z]/g, '');
    var row = document.createElement('div');
    row.className = 'ek-dbg-row';
    row.innerHTML =
      '<span class="ek-dbg-time">' + time + '</span>' +
      '<span class="ek-dbg-tag ' + tagClass + '">' + (tag || '').toUpperCase() + '</span>' +
      '<span class="ek-dbg-msg">' + escapeHtml(message || '') +
      (detail ? ' <span class="ek-dbg-dim">' + escapeHtml(detail) + '</span>' : '') +
      '</span>';

    log.appendChild(row);
    // Auto-scroll dolů
    log.scrollTop = log.scrollHeight;
    // Limit na 200 řádků
    while (log.children.length > 200) log.removeChild(log.firstChild);
    // Update počet
    var cnt = document.getElementById('ek-dbg-count');
    if (cnt) cnt.textContent = debugEventCount + ' events';
  };

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  // ---- Init ----
  function init() {
    // Nepřidávat na login stránku
    if (window.location.pathname === '/login') return;

    // Spodní bar
    document.body.appendChild(bar);

    // Debug panel — nad footer
    document.body.appendChild(debugPanel);
    // Restore stav z localStorage
    try {
      if (localStorage.getItem(DEBUG_KEY) === 'on') {
        debugOpen = true;
        debugPanel.classList.add('open');
        var dbgBtn = document.getElementById('ek-debug-toggle');
        if (dbgBtn) dbgBtn.classList.add('active');
      }
    } catch (e) {}

    // Horní nav — vždy viditelný
    document.body.classList.add('ek-has-top-nav');
    document.body.insertBefore(topNav, document.body.firstChild);

    // Dynamická favicona per sekce
    setSectionFavicon(getCurrentSection());

    loadUserInfo();
    loadStats();
    updateTime();

    setInterval(updateTime, 1000);
    setInterval(loadStats, REFRESH_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
