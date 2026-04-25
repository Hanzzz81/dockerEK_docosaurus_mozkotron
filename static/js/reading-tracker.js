/**
 * Reading Tracker — frontend měření čtení pro Mozek
 * ===================================================
 *
 * Měří:
 *  - Aktivní čas na stránce (tab visible + user activity)
 *  - Maximální scroll depth (%)
 *  - Posílá heartbeaty každých 15 sekund
 *  - Odesílá leave event při odchodu ze stránky
 *  - Napojuje se na ek-ack-widget (potvrzení přečtení)
 *  - Napojuje se na ek-quiz (výsledky kvízu)
 *  - Detekuje SPA navigaci (Docusaurus React Router)
 *
 * Vyžaduje cookie ek_user (nastaví login stránka nebo auth plugin).
 * Bez cookie netrackuje.
 */
(function () {
  'use strict';

  var HEARTBEAT_INTERVAL = 15000;
  var IDLE_TIMEOUT = 60000;
  var API_BASE = '';
  var SPA_POLL_INTERVAL = 500;

  // --- State ---
  var sessionId = null;
  var activeTimeMs = 0;
  var lastTick = null;
  var isActive = true;
  var isVisible = !document.hidden;
  var maxScrollPct = 0;
  var idleTimer = null;
  var heartbeatTimer = null;
  var spaTimer = null;
  var username = getCookie('ek_user');
  var pagePath = null;
  var pageTitle = null;

  // --- Helpers ---
  function generateSessionId() {
    return 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 8);
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function getScrollPct() {
    var docHeight = Math.max(
      document.body.scrollHeight, document.body.offsetHeight,
      document.documentElement.scrollHeight, document.documentElement.offsetHeight
    );
    var viewHeight = window.innerHeight;
    if (docHeight <= viewHeight) return 100;
    var scrolled = window.scrollY + viewHeight;
    return Math.min(100, Math.round((scrolled / docHeight) * 1000) / 10);
  }

  function sendBeacon(url, data) {
    var payload = JSON.stringify(data);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    }
  }

  function dbg(tag, msg, detail) {
    if (typeof window.ekDebugLog === 'function') window.ekDebugLog(tag, msg, detail);
  }

  function post(url, data) {
    var endpoint = url.replace('/api/track/', '');
    dbg('api', 'POST ' + endpoint, JSON.stringify(data).substring(0, 120));
    return fetch(API_BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'same-origin',
    }).then(function (r) {
      dbg('api', endpoint + ' → ' + r.status, r.ok ? 'OK' : 'FAIL');
      return r;
    }).catch(function (e) {
      dbg('error', endpoint + ' FAILED', e.message);
      console.warn('[Tracker] API error:', e);
    });
  }

  // --- Auth check ---
  if (!username) {
    console.log('[Tracker] No ek_user cookie — tracking disabled');
    dbg('error', 'No ek_user cookie — tracking DISABLED');
    return;
  }
  dbg('state', 'Tracker init', 'user=' + username);

  // --- Section tracking ---
  var sectionTimes = {}; // { "heading text": { level: 2, ms: 1234 } }
  var currentSection = null;
  var sectionTick = null; // timestamp when current section started ticking

  function detectHeadings() {
    var headings = [];
    var article = document.querySelector('article') || document.querySelector('.markdown') || document.querySelector('main');
    if (!article) return headings;
    var hEls = article.querySelectorAll('h1, h2, h3');
    hEls.forEach(function(h) {
      headings.push({
        text: h.textContent.replace(/^[#\s]+/, '').replace(/\s*¶$/, '').trim(),
        level: parseInt(h.tagName.charAt(1), 10),
        top: h.getBoundingClientRect().top + window.scrollY
      });
    });
    return headings;
  }

  function getCurrentSectionName() {
    var headings = detectHeadings();
    if (headings.length === 0) return null;
    var scrollPos = window.scrollY + 100; // offset for sticky header
    var active = headings[0];
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].top <= scrollPos) active = headings[i];
      else break;
    }
    return active;
  }

  function updateSectionTime() {
    var now = Date.now();
    // Flush time for previous section
    if (currentSection && sectionTick) {
      var elapsed = now - sectionTick;
      if (!sectionTimes[currentSection.text]) {
        sectionTimes[currentSection.text] = { level: currentSection.level, ms: 0 };
      }
      sectionTimes[currentSection.text].ms += elapsed;
    }
    // Detect new section
    var newSec = getCurrentSectionName();
    if (newSec && (!currentSection || newSec.text !== currentSection.text)) {
      currentSection = newSec;
    }
    sectionTick = (isActive && isVisible) ? now : null;
  }

  function getSectionPayload() {
    updateSectionTime();
    var sections = [];
    for (var heading in sectionTimes) {
      if (sectionTimes[heading].ms > 0) {
        sections.push({ heading: heading, level: sectionTimes[heading].level, time_ms: sectionTimes[heading].ms });
      }
    }
    return sections;
  }

  function resetSectionTracking() {
    sectionTimes = {};
    currentSection = null;
    sectionTick = null;
  }

  // --- Time tracking ---
  function startTicking() {
    if (lastTick === null && isActive && isVisible) lastTick = Date.now();
  }

  function stopTicking() {
    if (lastTick !== null) { activeTimeMs += Date.now() - lastTick; lastTick = null; }
  }

  function resetIdleTimer() {
    if (!isActive) { isActive = true; startTicking(); dbg('state', 'User ACTIVE again'); }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { isActive = false; stopTicking(); dbg('state', 'User IDLE (60s no activity)'); }, IDLE_TIMEOUT);
  }

  function updateScroll() {
    var pct = getScrollPct();
    if (pct > maxScrollPct) maxScrollPct = pct;
  }

  // --- Klientský Access Guard ---
  // Načte povolené cesty z /api/me a blokuje neautorizované SPA navigace
  var allowedPaths = null; // null = ještě nenačteno, [] = prázdný seznam
  var isAdminUser = false;
  var sidebarMap = null; // { "Label kategorie": ["/path1", "/path2"] }
  var sectionThemes = null; // { "folder-name": { accent, accentLight, heading, sidebarActive } }
  var unreadPaths = null; // ["/path1", "/path2"] — nepřečtené stránky

  function loadAllowedPaths() {
    fetch('/api/me', { credentials: 'same-origin' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.authenticated) {
          isAdminUser = data.access && data.access.indexOf('*') >= 0;
          // Rozlišit: server nemá feature (allowedPaths chybí) vs. user nemá přístup
          if (data.hasOwnProperty('allowedPaths')) {
            allowedPaths = data.allowedPaths;
            console.log('[Tracker] Access guard loaded:', allowedPaths.length, 'allowed paths');
          } else {
            allowedPaths = null; // Server nepodporuje — guard neaktivní
            console.log('[Tracker] Access guard not available (server update needed)');
          }
          if (data.sidebarMap) {
            sidebarMap = data.sidebarMap;
            console.log('[Tracker] Sidebar map loaded:', Object.keys(sidebarMap).length, 'categories');
          }
          if (data.sectionThemes) {
            sectionThemes = data.sectionThemes;
            console.log('[Tracker] Section themes loaded:', Object.keys(sectionThemes).length, 'themes');
          }
          if (data.unreadPaths) {
            unreadPaths = data.unreadPaths;
            console.log('[Tracker] Unread paths loaded:', unreadPaths.length, 'pages');
          }
          // Zkontroluj aktuální stránku
          checkAccess(window.location.pathname);
          // Aplikuj per-sekce téma
          applySectionTheme(window.location.pathname);
          // Filtruj sidebar
          filterSidebar();
          // Červené puntíky pro nepřečtené stránky
          markUnreadInSidebar();
          startSidebarObserver();
        }
      })
      .catch(function() { /* ticho — access guard se prostě neaktivuje */ });
  }

  function checkAccess(path) {
    // Admini vidí vše
    if (isAdminUser) return true;
    // Ještě nenačteno — přeskočit
    if (allowedPaths === null) return true;
    // Speciální cesty (login, dashboard, admin, obsah) — přeskočit
    if (path === '/' || path === '/login' || path === '/statistiky' || path === '/admin' || path === '/obsah') return true;
    // Zkontrolovat přístup
    var normalized = path.replace(/\/$/, '');
    if (allowedPaths.indexOf(normalized) >= 0) return true;

    console.log('[Tracker] ACCESS DENIED (client-side):', normalized);
    // Zobraz blokační overlay
    showAccessDenied();
    return false;
  }

  function showAccessDenied() {
    // Skryj obsah stránky (article) aby nebyl čitelný pod overlayem
    var article = document.querySelector('article, .theme-doc-markdown, [class*="docItemCol"]');
    if (article) article.style.visibility = 'hidden';

    var overlay = document.createElement('div');
    overlay.id = 'ek-access-denied';
    overlay.style.cssText = 'position:fixed;inset:0;background:#0f172a;z-index:9998;display:flex;align-items:center;justify-content:center;text-align:center;';
    overlay.innerHTML = '<div style="max-width:420px;"><h1 style="font-size:1.3rem;color:#ef4444;margin-bottom:0.8rem;font-family:system-ui;">🔒 Přístup odepřen</h1>' +
      '<p style="color:#94a3b8;font-size:0.9rem;line-height:1.5;font-family:system-ui;">Nemáš oprávnění zobrazit tuto stránku.<br>Pokud si myslíš, že bys měl(a) mít přístup, kontaktuj správce.</p>' +
      '<p style="margin-top:1.5rem;"><a href="/" style="color:#7dd3fc;text-decoration:none;font-family:system-ui;">← Zpět na hlavní stránku</a></p></div>';
    // Odstraň předchozí overlay pokud existuje
    var existing = document.getElementById('ek-access-denied');
    if (existing) existing.remove();
    document.body.appendChild(overlay);
  }

  // --- Sidebar Filtering ---
  // Skryje položky v Docusaurus levém menu, na které uživatel nemá přístup.
  // Docusaurus sidebar structure (3.x):
  //   <li> (kategorie)
  //     <div class="menu__list-item-collapsible">
  //       <a class="menu__link menu__link--sublist" href="/kategorie">Název</a>
  //     </div>
  //     <ul class="menu__list">
  //       <li><a class="menu__link" href="/kategorie/stranka">Stránka</a></li>
  //     </ul>
  //   </li>
  //
  // Strategie:
  // Sidebar filtr — skryje položky na které uživatel nemá přístup
  // Strategie:
  //   1. Leaf linky (href != "#"): zkontroluj allowedPaths
  //   2. Kategorie (href="#"): použij sidebarMap k ověření že má alespoň 1 povolenou podstránku
  //   3. Pokud je kategorie rozbalená a děti v DOM: ověř viditelnost dětí

  var sidebarObserver = null;
  var filterDebounce = null;
  var isFiltering = false;

  function filterSidebar() {
    if (isAdminUser) return;
    if (allowedPaths === null) return;
    if (isFiltering) return;
    isFiltering = true;

    var sidebar = document.querySelector('nav.menu, .menu');
    if (!sidebar) { isFiltering = false; return; }

    function isLeafAllowed(href) {
      var normalized = href.replace(/\/$/, '');
      if (normalized === '' || normalized === '/') return true;
      return allowedPaths.indexOf(normalized) >= 0;
    }

    function isCategoryAllowed(label) {
      // Pokud nemáme sidebarMap, neskrývej (fail-open)
      if (!sidebarMap) return true;
      var childPaths = sidebarMap[label];
      if (!childPaths) return true; // Neznámá kategorie — neskrývej
      // Kategorie je povolená pokud alespoň 1 podstránka je v allowedPaths
      for (var i = 0; i < childPaths.length; i++) {
        if (allowedPaths.indexOf(childPaths[i]) >= 0) return true;
      }
      return false;
    }

    var allItems = sidebar.querySelectorAll('li');
    var visible = 0;

    allItems.forEach(function(li) {
      var isCategory = li.className.indexOf('category') >= 0;

      if (isCategory) {
        // Kategorie — najdi label text a ověř přes sidebarMap
        var catLink = li.querySelector(':scope > div > a, :scope > a');
        var label = catLink ? catLink.textContent.trim() : '';

        if (isCategoryAllowed(label)) {
          li.style.display = '';
          visible++;

          // Pokud je kategorie rozbalená a děti v DOM, filtruj i je
          var childUL = li.querySelector(':scope > ul');
          if (childUL) {
            var childItems = childUL.querySelectorAll(':scope > li');
            var hasVisibleChild = false;
            childItems.forEach(function(child) {
              var childLink = child.querySelector('a[href]');
              if (childLink) {
                var childHref = childLink.getAttribute('href');
                if (childHref && childHref !== '#' && !isLeafAllowed(childHref)) {
                  child.style.display = 'none';
                } else {
                  child.style.display = '';
                  hasVisibleChild = true;
                }
              }
            });
            // Pokud žádné dítě není viditelné, skryj i kategorii
            if (childItems.length > 0 && !hasVisibleChild) {
              li.style.display = 'none';
              visible--;
            }
          }
        } else {
          li.style.display = 'none';
        }
      } else {
        // Leaf link — zkontroluj href
        var link = li.querySelector('a[href]');
        if (link) {
          var href = link.getAttribute('href');
          if (href && href !== '#' && !isLeafAllowed(href)) {
            li.style.display = 'none';
          } else {
            li.style.display = '';
            visible++;
          }
        } else {
          // Žádný odkaz — nech být
          li.style.display = '';
          visible++;
        }
      }
    });

    console.log('[Tracker] Sidebar filtered: ' + visible + '/' + allItems.length + ' items visible');
    isFiltering = false;
  }

  // --- Unread indicators ---
  // Přidá červené puntíky k nepřečteným stránkám v sidebaru a rozbalí jejich větve

  // Inject CSS pro puntíky (jednou)
  (function injectUnreadCSS() {
    if (document.getElementById('ek-unread-css')) return;
    var style = document.createElement('style');
    style.id = 'ek-unread-css';
    style.textContent =
      '.ek-unread-dot{display:inline-block;width:8px;height:8px;border-radius:50%;' +
      'background:#ef4444;margin-left:auto;flex-shrink:0;animation:ek-pulse 2s ease-in-out infinite;}' +
      '@keyframes ek-pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}' +
      '.ek-unread-category-dot{display:inline-block;width:6px;height:6px;border-radius:50%;' +
      'background:#ef4444;margin-left:6px;flex-shrink:0;opacity:0.7;}';
    document.head.appendChild(style);
  })();

  function markUnreadInSidebar() {
    if (!unreadPaths || unreadPaths.length === 0) return;

    var sidebar = document.querySelector('nav.menu, .menu');
    if (!sidebar) return;

    // Odstraň staré puntíky
    sidebar.querySelectorAll('.ek-unread-dot, .ek-unread-category-dot').forEach(function(el) { el.remove(); });

    var unreadSet = {};
    unreadPaths.forEach(function(p) { unreadSet[p.replace(/\/$/, '')] = true; });

    // Projdi všechny linky v sidebaru
    var allLinks = sidebar.querySelectorAll('a.menu__link[href]');
    var categoriesWithUnread = new Set();

    allLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      var normalized = href.replace(/\/$/, '');

      if (unreadSet[normalized]) {
        // Přidej červený puntík
        if (!link.querySelector('.ek-unread-dot')) {
          var dot = document.createElement('span');
          dot.className = 'ek-unread-dot';
          dot.title = 'Nepřečteno';
          link.style.display = 'flex';
          link.style.alignItems = 'center';
          link.appendChild(dot);
        }
        // Zapamatuj nadřazenou kategorii pro rozbalení
        var parentCategory = link.closest('li.theme-doc-sidebar-item-category, li[class*="category"]');
        if (parentCategory) categoriesWithUnread.add(parentCategory);
      }
    });

    // Rozbal kategorie obsahující nepřečtené stránky
    categoriesWithUnread.forEach(function(categoryLi) {
      // Docusaurus 3.x: kolapsnutá kategorie nemá class "menu__list-item--collapsed"
      // ale její <button> má aria-expanded="false"
      var toggle = categoryLi.querySelector(':scope > div > button, :scope > div > a.menu__link--sublist');
      if (!toggle) return;
      var isCollapsed = toggle.getAttribute('aria-expanded') === 'false' ||
                        categoryLi.className.indexOf('collapsed') >= 0;
      if (isCollapsed) {
        toggle.click();
        console.log('[Tracker] Auto-expanded category with unread pages');
      }
      // Přidej malý puntík ke kategorii
      var catLink = categoryLi.querySelector(':scope > div > a.menu__link');
      if (catLink && !catLink.querySelector('.ek-unread-category-dot')) {
        var catDot = document.createElement('span');
        catDot.className = 'ek-unread-category-dot';
        catLink.style.display = 'flex';
        catLink.style.alignItems = 'center';
        catLink.appendChild(catDot);
      }
    });

    console.log('[Tracker] Sidebar unread indicators applied');
  }

  function startSidebarObserver() {
    if (sidebarObserver) sidebarObserver.disconnect();

    var sidebar = document.querySelector('nav.menu, .menu');
    if (!sidebar) {
      setTimeout(startSidebarObserver, 500);
      return;
    }

    sidebarObserver = new MutationObserver(function() {
      // Debounce — Docusaurus dělá více DOM změn naráz
      clearTimeout(filterDebounce);
      filterDebounce = setTimeout(function() { filterSidebar(); markUnreadInSidebar(); }, 50);
    });
    sidebarObserver.observe(sidebar, { childList: true, subtree: true });

    filterSidebar();
    markUnreadInSidebar();
  }

  // Načíst povolené cesty při startu
  loadAllowedPaths();

  // --- Session management ---
  function startSession() {
    // Uzavři předchozí session (pokud existuje)
    if (sessionId) {
      endCurrentSession();
    }

    // Odstraň případný access denied overlay + vrať viditelnost obsahu
    var overlay = document.getElementById('ek-access-denied');
    if (overlay) {
      overlay.remove();
      var article = document.querySelector('article, .theme-doc-markdown, [class*="docItemCol"]');
      if (article) article.style.visibility = '';
    }

    // Nová session
    sessionId = generateSessionId();
    activeTimeMs = 0;
    lastTick = null;
    maxScrollPct = 0;
    isActive = true;
    resetSectionTracking();
    pagePath = window.location.pathname;
    pageTitle = document.title;

    // Klientský access guard — zkontroluj přístup
    if (!checkAccess(pagePath)) {
      // Zastav session — uživatel nemá přístup
      dbg('error', 'ACCESS DENIED', pagePath);
      sessionId = null;
      return;
    }

    console.log('[Tracker] Session started for', username, 'on', pagePath);
    dbg('session', 'NEW SESSION', 'id=' + sessionId + ' path=' + pagePath);

    // Odeber stránku z nepřečtených (puntík zmizí po navigaci)
    if (unreadPaths) {
      var normalizedPage = pagePath.replace(/\/$/, '');
      var idx = unreadPaths.indexOf(normalizedPage);
      if (idx >= 0) {
        unreadPaths.splice(idx, 1);
        setTimeout(markUnreadInSidebar, 200);
      }
    }

    post('/api/track/session', {
      session_id: sessionId,
      page_path: pagePath,
      page_title: pageTitle,
      referrer: document.referrer || null,
    });

    // Restart heartbeat
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Nastav globální funkce s aktuální cestou a session
    window.__ekTrackConfirmation = function (docId, docTitle) {
      dbg('state', 'CONFIRM', 'doc=' + docId + ' title=' + (docTitle || ''));
      post('/api/track/confirm', {
        doc_id: docId, doc_title: docTitle,
        page_path: pagePath, session_id: sessionId
      });
    };

    window.__ekTrackQuiz = function (quizTitle, totalQuestions, correctAnswers, scorePct) {
      dbg('state', 'QUIZ', quizTitle + ' ' + correctAnswers + '/' + totalQuestions + ' (' + scorePct + '%)');
      post('/api/track/quiz', {
        page_path: pagePath, quiz_title: quizTitle,
        total_questions: totalQuestions, correct_answers: correctAnswers,
        score_pct: scorePct, session_id: sessionId
      });
    };

    window.__ekTrackingSessionId = sessionId;
    window.__ekTrackingUser = username;

    startTicking();
    resetIdleTimer();

    // Počkej chvíli a pak změř scroll (DOM se ještě může renderovat)
    setTimeout(function () {
      maxScrollPct = 0;
      updateScroll();
    }, 300);
  }

  function endCurrentSession() {
    if (!sessionId) return;
    clearInterval(heartbeatTimer);
    stopTicking();
    updateScroll();
    updateSectionTime();
    dbg('leave', 'Session END', 'id=' + sessionId + ' time=' + Math.round(activeTimeMs / 1000) + 's scroll=' + Math.round(maxScrollPct) + '%');
    // Send final section data
    var sections = getSectionPayload();
    if (sections.length > 0) {
      post('/api/track/sections', { session_id: sessionId, sections: sections });
    }
    post('/api/track/leave', {
      session_id: sessionId,
      active_time_ms: activeTimeMs,
      scroll_pct: maxScrollPct
    });
    console.log('[Tracker] Session ended:', sessionId, '— time:', Math.round(activeTimeMs / 1000), 's');
  }

  function sendHeartbeat() {
    if (lastTick !== null) { activeTimeMs += Date.now() - lastTick; lastTick = Date.now(); }
    updateScroll();
    updateSectionTime();
    dbg('heartbeat', 'Heartbeat', 'time=' + Math.round(activeTimeMs / 1000) + 's scroll=' + Math.round(maxScrollPct) + '%');
    post('/api/track/heartbeat', {
      session_id: sessionId,
      active_time_ms: activeTimeMs,
      scroll_pct: maxScrollPct
    });
    // Send section data
    var sections = getSectionPayload();
    if (sections.length > 0) {
      post('/api/track/sections', { session_id: sessionId, sections: sections });
    }
  }

  // --- Event listeners ---
  document.addEventListener('visibilitychange', function () {
    isVisible = !document.hidden;
    if (isVisible) { startTicking(); dbg('state', 'Tab VISIBLE'); }
    else { stopTicking(); dbg('state', 'Tab HIDDEN', 'accumulated=' + Math.round(activeTimeMs / 1000) + 's'); }
  });

  ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(function (evt) {
    document.addEventListener(evt, function () {
      resetIdleTimer();
      if (evt === 'scroll') { updateScroll(); updateSectionTime(); }
    }, { passive: true });
  });

  // beforeunload — finální leave při zavření tabu/okna
  window.addEventListener('beforeunload', function () {
    if (!sessionId) return;
    clearInterval(heartbeatTimer);
    stopTicking();
    updateScroll();
    sendBeacon(API_BASE + '/api/track/leave', {
      session_id: sessionId,
      active_time_ms: activeTimeMs,
      scroll_pct: maxScrollPct
    });
  });

  // --- Per-sekce theming ---
  // Detekuje aktuální sekci z URL a aplikuje CSS custom properties.
  // Sekce = první segment URL cesty (např. /law-obecne/taxonomie → "law-obecne")
  // Výchozí barvy (amber fallback)
  var DEFAULT_THEME = { accent: '#38bdf8', accentLight: '#0ea5e922', heading: '#38bdf8', sidebarActive: '#38bdf8' };

  function applySectionTheme(urlPath) {
    if (!sectionThemes) return;
    var segments = urlPath.replace(/^\//, '').split('/');
    var section = segments[0] || '';
    var pagePath = segments.length >= 2 ? segments[0] + '/' + segments[1] : '';

    // Priorita: specifická stránka > složka > výchozí
    var theme = null;
    if (pagePath && sectionThemes[pagePath]) {
      theme = sectionThemes[pagePath];
    } else if (sectionThemes[section]) {
      theme = sectionThemes[section];
    }

    var root = document.documentElement;
    var t = theme || DEFAULT_THEME;
    root.style.setProperty('--ek-section-accent', t.accent || DEFAULT_THEME.accent);
    root.style.setProperty('--ek-section-accent-light', t.accentLight || DEFAULT_THEME.accentLight);
    root.style.setProperty('--ek-section-heading', t.heading || DEFAULT_THEME.heading);
    root.style.setProperty('--ek-section-sidebar-active', t.sidebarActive || t.accent || DEFAULT_THEME.sidebarActive);

    if (theme) {
      root.setAttribute('data-ek-section', section);
      console.log('[Tracker] Section theme applied:', section, t.accent);
    } else {
      root.removeAttribute('data-ek-section');
    }

    // Dynamická favicona — barevný čtverec s iniciálou sekce
    var faviconColor = t.accent || '#0ea5e9';
    var faviconLabel = section ? section.charAt(0).toUpperCase() : 'M';
    var faviconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="6" fill="' + faviconColor + '"/>' +
      '<text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#fff">' + faviconLabel + '</text>' +
    '</svg>';
    var faviconUri = 'data:image/svg+xml,' + encodeURIComponent(faviconSvg);
    var faviconLink = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.type = 'image/svg+xml';
    faviconLink.href = faviconUri;
  }

  // --- SPA navigace detekce ---
  // Docusaurus používá React Router (History API).
  // Pollujeme URL každých 500ms — jednoduchý a spolehlivý způsob.
  var lastKnownPath = window.location.pathname;

  function checkSpaNavigation() {
    var currentPath = window.location.pathname;
    if (currentPath !== lastKnownPath) {
      console.log('[Tracker] SPA navigation detected:', lastKnownPath, '→', currentPath);
      dbg('session', 'SPA navigation', lastKnownPath + ' → ' + currentPath);
      lastKnownPath = currentPath;
      startSession();
      // Aplikuj per-sekce téma
      applySectionTheme(currentPath);
      // Po SPA navigaci přefiltrovat sidebar (Docusaurus mohl přegenerovat menu)
      setTimeout(function() { filterSidebar(); markUnreadInSidebar(); }, 100);
    }
  }

  spaTimer = setInterval(checkSpaNavigation, SPA_POLL_INTERVAL);

  // Záchyt i pro popstate (browser back/forward)
  window.addEventListener('popstate', function () {
    setTimeout(checkSpaNavigation, 50);
  });

  // --- Init ---
  console.log('[Tracker] Initialized for user:', username);
  startSession();
})();
