/**
 * Mozkotron — Unified Sidebar Tree (editor style)
 * ==================================================
 *
 * Single sidebar tree used on ALL pages except admin/login.
 * Renders in the editor style: SVG folder/file icons, div.tree-item,
 * collapsible categories, indent spans.
 *
 * Fetches /api/sidebar for the tree structure.
 * On editor.html, skips rendering (editor has its own tree in the same style).
 *
 * Features:
 * - SVG folder/file icons (matching editor.html)
 * - Expandable/collapsible categories with caret rotation
 * - Current page highlighting based on URL
 * - Fixed left sidebar (260px)
 * - Dark navy theme
 * - SessionStorage persistence of expanded state
 */

(function () {
  'use strict';

  // ============================================================================
  // CONFIG
  // ============================================================================
  var SIDEBAR_WIDTH = 260;
  var TOP_OFFSET = 42;      // below top nav (status-bar.js)
  var BOTTOM_OFFSET = 36;   // above bottom bar
  var EXPANDED_STATE_KEY = 'ek_sidebar_expanded';

  // Pages to skip
  var SKIP_PATHS = ['/login', '/admin', '/statistiky', '/schema'];

  // AOR colors — from AOR Palác v4.1 (Material Design)
  // Maps root category slug → accent color
  var AOR_COLORS = {
    'firma':       '#90a4ae',  // Blue Grey — průřezové
    'management':  '#4caf50',  // Green
    'finance':     '#ab47bc',  // Purple
    'rust':        '#ec407a',  // Pink
    'nakup':       '#f1c40f',  // Yellow
    'prodej':      '#ffa726',  // Orange
    'dodani':      '#ef5350',  // Red
    'technologie': '#42a5f5'   // Blue
  };

  // SVG icons — level-specific folder icons
  var SVG = {
    // Root folder: filled (solid background)
    folderRoot: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" opacity="0.3"/><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    // Level 1: folder with Ⅰ
    folderL1: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><text x="12" y="17.5" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">I</text></svg>',
    // Level 2: folder with Ⅱ
    folderL2: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><text x="12" y="17.5" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">II</text></svg>',
    // Level 3: folder with Ⅲ
    folderL3: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><text x="12" y="17.5" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">III</text></svg>',
    // Generic folder (depth 4+)
    folder: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    file:   '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    caret:  '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>'
  };

  // Pick folder icon by depth
  function getFolderIcon(depth) {
    if (depth === 0) return SVG.folderRoot;
    if (depth === 1) return SVG.folderL1;
    if (depth === 2) return SVG.folderL2;
    if (depth === 3) return SVG.folderL3;
    return SVG.folder;
  }

  // ============================================================================
  // INIT
  // ============================================================================
  function init() {
    // Skip excluded paths
    var path = window.location.pathname;
    for (var i = 0; i < SKIP_PATHS.length; i++) {
      if (path === SKIP_PATHS[i] || path.startsWith(SKIP_PATHS[i] + '/') || path.endsWith(SKIP_PATHS[i] + '.html')) return;
    }

    // Skip editor — it has its own tree already rendered in the same style
    if (document.getElementById('docTree')) return;

    // Skip if we already injected
    if (document.querySelector('.ek-sidebar-tree')) return;

    // On Docusaurus pages — hide the native sidebar, we replace it
    var docuSidebar = document.querySelector('.theme-doc-sidebar-container');
    if (docuSidebar) {
      docuSidebar.style.display = 'none';
    }

    // Fetch sidebar tree and build
    fetch('/api/sidebar')
      .then(function (r) { return r.json(); })
      .then(function (tree) { buildSidebar(tree); })
      .catch(function (e) { console.warn('[Sidebar] Failed to fetch tree:', e); });
  }

  // ============================================================================
  // BUILD SIDEBAR
  // ============================================================================
  function buildSidebar(tree) {
    // Create container
    var container = document.createElement('nav');
    container.className = 'ek-sidebar-tree';
    container.setAttribute('aria-label', 'Navigation');

    // Header + search
    var header = document.createElement('div');
    header.className = 'ek-sidebar-header';
    header.innerHTML = '<h2>Mozkotron</h2>' +
      '<div class="ek-search-box">' +
        '<input type="text" class="ek-search-input" placeholder="Hledat..." />' +
        '<button class="ek-search-toggle active" data-mode="folders" title="Složky">&#x1F4C1;</button>' +
        '<button class="ek-search-toggle active" data-mode="headings" title="Nadpisy">&#x1F4C4;</button>' +
        '<button class="ek-search-toggle active" data-mode="text" title="Text">&#x1F4DD;</button>' +
      '</div>';
    container.appendChild(header);

    // Search results — wrapper with resize handle (handle must survive innerHTML wipes)
    var searchWrap = document.createElement('div');
    searchWrap.className = 'ek-search-results';
    searchWrap.style.display = 'none';

    var searchResults = document.createElement('div');
    searchResults.style.cssText = 'flex:1;overflow-y:auto;';
    searchWrap.appendChild(searchResults);

    // Resize handle
    var searchResizeHandle = document.createElement('div');
    searchResizeHandle.className = 'ek-search-resize';
    searchWrap.appendChild(searchResizeHandle);

    // Drag to resize
    (function () {
      var dragging = false;
      searchResizeHandle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        dragging = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      });
      document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var sidebar = document.querySelector('.ek-sidebar-tree');
        var sidebarW = sidebar ? sidebar.offsetWidth : SIDEBAR_WIDTH;
        var newWidth = e.clientX - sidebarW;
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 600) newWidth = 600;
        searchWrap.style.width = newWidth + 'px';
        updateMainMargin();
      });
      document.addEventListener('mouseup', function () {
        if (dragging) {
          dragging = false;
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });
    })();

    document.body.appendChild(searchWrap);

    // Helper: shift main content when search panel is visible
    function updateMainMargin() {
      var sidebar = document.querySelector('.ek-sidebar-tree');
      var sidebarW = sidebar ? sidebar.offsetWidth : SIDEBAR_WIDTH;
      var selectors = ['[class*="docMainContainer"]', '[class*="docPage"]', '.app', '.dashboard-container', '.stats-container', '.home-layout', '.home-content', '.home-wrapper', '.mapa-container', '.obsah-container', '.palace-wrap'];
      var container = null;
      for (var i = 0; i < selectors.length; i++) {
        container = document.querySelector(selectors[i]);
        if (container && container !== document.body) break;
      }
      if (!container || container === document.body) return;
      var extra = (searchWrap.style.display !== 'none') ? parseInt(searchWrap.style.width || sidebarW, 10) : 0;
      container.style.marginLeft = (sidebarW + extra) + 'px';
    }

    // Tree container
    var treeWrap = document.createElement('div');
    treeWrap.className = 'ek-sidebar-items';

    // Render tree items (null = no root color yet)
    renderTreeItems(tree, treeWrap, 0, null);

    container.appendChild(treeWrap);

    // --- Search logic ---
    var searchInput = header.querySelector('.ek-search-input');
    var searchToggles = header.querySelectorAll('.ek-search-toggle');
    var searchTimer = null;

    // Toggle mode buttons
    for (var ti = 0; ti < searchToggles.length; ti++) {
      searchToggles[ti].addEventListener('click', function () {
        this.classList.toggle('active');
        doSearch();
      });
    }

    function getSearchMode() {
      var modes = [];
      for (var i = 0; i < searchToggles.length; i++) {
        if (searchToggles[i].classList.contains('active')) {
          modes.push(searchToggles[i].getAttribute('data-mode'));
        }
      }
      // If all or none active → 'all'
      if (modes.length === 0 || modes.length === 3) return 'all';
      // If one → that mode
      if (modes.length === 1) return modes[0];
      // If two → 'all' (backend supports individual modes, simplify for multi)
      return 'all';
    }

    function highlightMatch(text, query) {
      if (!query) return text;
      var idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx === -1) return text;
      return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
    }

    function doSearch() {
      var q = searchInput.value.trim();
      if (q.length < 2) {
        searchWrap.style.display = 'none';
        updateMainMargin();
        return;
      }
      var mode = getSearchMode();
      fetch('/api/search?q=' + encodeURIComponent(q) + '&mode=' + mode)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          searchResults.innerHTML = '';
          // Close button at top of results
          var closeBar = document.createElement('div');
          closeBar.className = 'ek-search-clear';
          closeBar.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Zavřít hledání';
          closeBar.addEventListener('click', function () {
            searchInput.value = '';
            searchWrap.style.display = 'none';
            updateMainMargin();
            clearInPageHighlights();
          });
          searchResults.appendChild(closeBar);

          if (!data || data.length === 0) {
            searchResults.innerHTML += '<div class="sr-empty">Nic nenalezeno</div>';
          } else {
            for (var i = 0; i < data.length; i++) {
              var item = data[i];
              var el = document.createElement('div');
              el.className = 'sr-item';

              if (item.type === 'folder') {
                el.innerHTML = '<div class="sr-title sr-folder">\uD83D\uDCC1 ' + highlightMatch(item.name, q) + '</div>';
                if (item.url) {
                  el.setAttribute('data-url', item.url);
                  el.addEventListener('click', function () {
                    var url = this.getAttribute('data-url');
                    if (url) {
                      var allItems = searchResults.querySelectorAll('.sr-item');
                      for (var si = 0; si < allItems.length; si++) allItems[si].classList.remove('sr-active');
                      this.classList.add('sr-active');
                      spaNavigate(url);
                      highlightAfterNav();
                    }
                  });
                }
              } else {
                var html = '<div class="sr-title">' + highlightMatch(item.title, q) + '</div>';
                if (item.headings) {
                  for (var h = 0; h < item.headings.length; h++) {
                    html += '<div class="sr-heading">' + highlightMatch(item.headings[h].text, q) + '</div>';
                  }
                }
                if (item.snippet) {
                  html += '<div class="sr-snippet">' + highlightMatch(item.snippet, q) + '</div>';
                }
                el.innerHTML = html;
                el.setAttribute('data-url', item.url);
                el.addEventListener('click', function () {
                  var url = this.getAttribute('data-url');
                  if (url) {
                    // Highlight clicked result, keep results visible
                    var allItems = searchResults.querySelectorAll('.sr-item');
                    for (var si = 0; si < allItems.length; si++) allItems[si].classList.remove('sr-active');
                    this.classList.add('sr-active');
                    spaNavigate(url);
                    highlightAfterNav();
                  }
                });
              }
              searchResults.appendChild(el);
            }
          }
          searchWrap.style.display = 'flex';
          updateMainMargin();
          })
        .catch(function () {
          searchResults.innerHTML = '<div class="sr-empty">Chyba vyhledávání</div>';
          searchWrap.style.display = 'flex';
          updateMainMargin();
        });
    }

    // --- In-page highlight + minimap ---
    var minimapEl = null;
    var highlightQuery = '';

    function clearInPageHighlights() {
      // Remove all highlight marks
      var marks = document.querySelectorAll('.ek-search-hl');
      for (var m = 0; m < marks.length; m++) {
        var parent = marks[m].parentNode;
        parent.replaceChild(document.createTextNode(marks[m].textContent), marks[m]);
        parent.normalize(); // merge adjacent text nodes
      }
      // Remove minimap
      if (minimapEl) { minimapEl.remove(); minimapEl = null; }
      highlightQuery = '';
    }

    function highlightInPage(query) {
      clearInPageHighlights();
      if (!query || query.length < 2) return;
      highlightQuery = query.toLowerCase();

      var article = document.querySelector('article');
      if (!article) return;

      // Walk text nodes in article
      var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null, false);
      var textNodes = [];
      var node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.toLowerCase().indexOf(highlightQuery) !== -1) {
          // Skip if inside script/style/code
          var tag = node.parentNode.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CODE' || tag === 'PRE') continue;
          textNodes.push(node);
        }
      }

      // Wrap matches in <mark>
      for (var t = 0; t < textNodes.length; t++) {
        var tn = textNodes[t];
        var text = tn.nodeValue;
        var lower = text.toLowerCase();
        var idx = lower.indexOf(highlightQuery);
        if (idx === -1) continue;

        var frag = document.createDocumentFragment();
        var lastEnd = 0;
        while (idx !== -1) {
          // Text before match
          if (idx > lastEnd) frag.appendChild(document.createTextNode(text.slice(lastEnd, idx)));
          // Match
          var mark = document.createElement('mark');
          mark.className = 'ek-search-hl';
          mark.textContent = text.slice(idx, idx + highlightQuery.length);
          frag.appendChild(mark);
          lastEnd = idx + highlightQuery.length;
          idx = lower.indexOf(highlightQuery, lastEnd);
        }
        // Text after last match
        if (lastEnd < text.length) frag.appendChild(document.createTextNode(text.slice(lastEnd)));
        tn.parentNode.replaceChild(frag, tn);
      }

      // Build minimap
      buildMinimap();
    }

    function buildMinimap() {
      if (minimapEl) minimapEl.remove();
      var marks = document.querySelectorAll('.ek-search-hl');
      if (marks.length === 0) return;

      minimapEl = document.createElement('div');
      minimapEl.className = 'ek-search-minimap';
      document.body.appendChild(minimapEl);

      var docHeight = document.documentElement.scrollHeight;
      var mapHeight = minimapEl.offsetHeight || (window.innerHeight - 90);

      for (var i = 0; i < marks.length; i++) {
        var rect = marks[i].getBoundingClientRect();
        var absY = rect.top + window.pageYOffset;
        var pct = absY / docHeight;
        var tick = document.createElement('div');
        tick.className = 'mm-tick';
        tick.style.top = (pct * mapHeight) + 'px';
        (function (targetMark) {
          tick.addEventListener('click', function () {
            var topNav = document.getElementById('ek-top-nav');
            var navH = topNav ? topNav.offsetHeight : 46;
            var targetY = targetMark.getBoundingClientRect().top + window.pageYOffset - navH - 20;
            animateScroll(window.pageYOffset, Math.max(0, targetY), 500);
            // Flash the mark
            targetMark.classList.add('ek-search-hl-active');
            setTimeout(function () { targetMark.classList.remove('ek-search-hl-active'); }, 1500);
          });
        })(marks[i]);
        minimapEl.appendChild(tick);
      }

      // Viewport position indicator
      var posIndicator = document.createElement('div');
      posIndicator.className = 'mm-pos';
      minimapEl.appendChild(posIndicator);

      function updatePos() {
        if (!minimapEl) return;
        var scrollPct = window.pageYOffset / docHeight;
        posIndicator.style.top = (scrollPct * mapHeight) + 'px';
        var vpPct = window.innerHeight / docHeight;
        posIndicator.style.height = Math.max(4, vpPct * mapHeight) + 'px';
      }
      updatePos();
      window.addEventListener('scroll', updatePos);
      // Store cleanup ref
      minimapEl._scrollHandler = updatePos;
    }

    // Highlight after navigation
    function highlightAfterNav() {
      if (!searchInput.value.trim()) return;
      // Wait for Docusaurus to render new content, then highlight + sync tree
      setTimeout(function () {
        highlightInPage(searchInput.value.trim());
        // Sync tree: highlight active item + scroll sidebar to it
        highlightActiveLink();
        setTimeout(function () {
          var activeEl = document.querySelector('.ek-sidebar-tree .tree-item.active');
          if (activeEl) {
            activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 100);
      }, 300);
    }

    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(doSearch, 250);
    });

    // Escape clears search
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchWrap.style.display = 'none';
        updateMainMargin();
        clearInPageHighlights();
      }
    });

    // Resize handle
    var resizeHandle = document.createElement('div');
    resizeHandle.className = 'ek-sidebar-resize';
    container.appendChild(resizeHandle);

    // Insert at beginning of body
    document.body.insertBefore(container, document.body.firstChild);

    // Mark that sidebar is active
    document.body.classList.add('ek-has-sidebar-tree');

    // Inject CSS
    injectCSS();

    // Restore expanded state
    restoreExpandedState();

    // Highlight active link
    highlightActiveLink();

    // Adjust main content
    adjustMainContent();

    // Enable resize
    initResize(container, resizeHandle);
  }

  // ============================================================================
  // RENDER TREE ITEMS (editor style — div.tree-item)
  // ============================================================================
  // Get root slug from href: "/firma/" → "firma", "/management/kapacity/" → "management"
  function getRootSlug(href) {
    if (!href) return null;
    var parts = href.replace(/^\//, '').replace(/\/$/, '').split('/');
    return parts[0] || null;
  }

  function renderTreeItems(items, container, depth, rootColor) {
    if (!items || items.length === 0) return;

    items.forEach(function (item) {
      if (item.type === 'category') {
        // ---- Category (folder) ----
        var folderEl = document.createElement('div');
        folderEl.className = 'tree-item folder';
        folderEl.setAttribute('data-category-key', item.href || item.label);
        folderEl.setAttribute('data-depth', depth);
        if (item.href) folderEl.setAttribute('data-href', item.href);

        // Determine AOR color: at depth 0 look up from href, deeper levels inherit
        var color = rootColor;
        if (depth === 0) {
          var slug = getRootSlug(item.href);
          color = (slug && AOR_COLORS[slug]) ? AOR_COLORS[slug] : null;
        }

        // Store color on element for CSS/active state
        if (color) {
          folderEl.setAttribute('data-aor-color', color);
          folderEl.style.color = color;
        }

        var indent = '';
        for (var i = 0; i < depth; i++) indent += '<span class="indent"></span>';

        // Level-specific folder icon
        var folderIcon = getFolderIcon(depth);

        folderEl.innerHTML = indent +
          '<span class="tree-caret">' + SVG.caret + '</span>' +
          '<span class="tree-icon">' + folderIcon + '</span> ' +
          '<span class="tree-label">' + item.label + '</span>';

        // Apply AOR color to SVG strokes (and fill for root)
        if (color) {
          var iconSvg = folderEl.querySelector('.tree-icon svg');
          if (iconSvg) iconSvg.style.stroke = color;
        }

        // Children container
        var childWrap = document.createElement('div');
        childWrap.className = 'tree-children';
        // Tint children border with AOR color
        if (color) childWrap.style.borderLeftColor = color + '40';

        // Default collapsed
        var expanded = isItemExpanded(item.href || item.label);
        folderEl.setAttribute('data-expanded', expanded ? 'true' : 'false');
        childWrap.style.display = expanded ? 'block' : 'none';

        // Caret click → toggle expand/collapse
        (function (el, wrap) {
          var caretEl = el.querySelector('.tree-caret');
          if (caretEl) {
            caretEl.addEventListener('click', function (e) {
              e.stopPropagation();
              var isOpen = el.getAttribute('data-expanded') === 'true';
              el.setAttribute('data-expanded', isOpen ? 'false' : 'true');
              wrap.style.display = isOpen ? 'none' : 'block';
              saveExpandedState();
            });
          }
        })(folderEl, childWrap);

        // Icon click: toggle expand/collapse + animate
        // Label click: navigate to index (if exists)
        // Double click on label: toggle expand/collapse
        (function (el, wrap, href, aorColor) {
          var labelEl = el.querySelector('.tree-label');
          var iconEl = el.querySelector('.tree-icon');

          // Toggle helper with icon animation
          var toggleFolder = function () {
            var isOpen = el.getAttribute('data-expanded') === 'true';
            el.setAttribute('data-expanded', isOpen ? 'false' : 'true');
            wrap.style.display = isOpen ? 'none' : 'block';
            // Animate icon: quick pulse
            if (iconEl) {
              iconEl.classList.add('tree-icon-pulse');
              setTimeout(function () { iconEl.classList.remove('tree-icon-pulse'); }, 350);
            }
            saveExpandedState();
          };

          // Ripple helper — visual feedback on click
          var fireRipple = function () {
            var ripple = document.createElement('span');
            ripple.className = 'tree-click-ripple';
            var c = aorColor || '#94a3b8';
            ripple.style.background = 'linear-gradient(90deg, transparent, ' + c + '60, transparent)';
            el.appendChild(ripple);
            el.style.setProperty('--glow-color', c + '40');
            el.classList.add('tree-item-glow');
            setTimeout(function () {
              if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
              el.classList.remove('tree-item-glow');
            }, 500);
          };

          // Icon single click → toggle expand/collapse
          if (iconEl) {
            iconEl.addEventListener('click', function (e) {
              e.stopPropagation();
              toggleFolder();
            });
          }

          // Label single click → navigate (if folder has index)
          if (labelEl && href) {
            labelEl.addEventListener('click', function (e) {
              e.stopPropagation();
              fireRipple();
              lastClickedDirection = getNavigationDirection(el);
              spaNavigate(href);
            });
          }

          // Double click anywhere on the folder row → toggle expand/collapse
          el.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            e.preventDefault();
            fireRipple();
            toggleFolder();
          });
        })(folderEl, childWrap, item.href, color);

        container.appendChild(folderEl);

        // Root category: add level expand buttons (Ⅰ Ⅱ Ⅲ)
        if (depth === 0) {
          var btnWrap = document.createElement('div');
          btnWrap.className = 'tree-level-btns';
          if (color) btnWrap.style.borderColor = color + '30';

          // Button "0" — collapse all (back to root only)
          var btn0 = document.createElement('button');
          btn0.className = 'tree-level-btn';
          btn0.textContent = '0';
          btn0.title = 'Zabalit vše';
          if (color) {
            btn0.style.color = color;
            btn0.style.borderColor = color + '40';
          }
          (function (childContainer, folderElement) {
            btn0.addEventListener('click', function (e) {
              e.stopPropagation();
              // Collapse root folder and all children
              folderElement.setAttribute('data-expanded', 'false');
              childContainer.style.display = 'none';
              // Also collapse everything inside
              var allInner = childContainer.querySelectorAll('.tree-item.folder');
              for (var k = 0; k < allInner.length; k++) {
                allInner[k].setAttribute('data-expanded', 'false');
                var cw = allInner[k].nextElementSibling;
                if (cw && cw.classList.contains('tree-children')) cw.style.display = 'none';
              }
              saveExpandedState();
            });
          })(childWrap, folderEl);
          btnWrap.appendChild(btn0);

          // Buttons Ⅰ, Ⅱ, Ⅲ — expand to level
          for (var lvl = 1; lvl <= 3; lvl++) {
            var btn = document.createElement('button');
            btn.className = 'tree-level-btn';
            btn.textContent = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'][lvl];
            btn.title = 'Rozbalit na úroveň ' + lvl;
            if (color) {
              btn.style.color = color;
              btn.style.borderColor = color + '40';
            }
            (function (targetLevel, childContainer, folderElement) {
              btn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleToLevel(folderElement, childContainer, targetLevel, 0);
                saveExpandedState();
              });
            })(lvl, childWrap, folderEl);
            btnWrap.appendChild(btn);
          }
          container.appendChild(btnWrap);
        }

        // Render children — pass AOR color down
        if (item.children && item.children.length > 0) {
          renderTreeItems(item.children, childWrap, depth + 1, color);
        }
        container.appendChild(childWrap);

      } else if (item.type === 'page') {
        // ---- Page (file) ----
        var fileEl = document.createElement('a');
        fileEl.className = 'tree-item file';
        fileEl.href = item.href;

        // Inherit AOR color from root category
        if (rootColor) {
          fileEl.setAttribute('data-aor-color', rootColor);
        }

        var indent2 = '';
        for (var j = 0; j < depth; j++) indent2 += '<span class="indent"></span>';

        fileEl.innerHTML = indent2 +
          '<span class="tree-icon">' + SVG.file + '</span> ' +
          '<span class="tree-label">' + item.label + '</span>';

        // Tint file icon with AOR color
        if (rootColor) {
          var fileSvg = fileEl.querySelector('.tree-icon svg');
          if (fileSvg) fileSvg.style.stroke = rootColor;
        }

        // SPA navigation — prevent full page reload on Docusaurus pages
        (function (el, href, aorColor) {
          el.addEventListener('click', function (e) {
            e.preventDefault();

            // Ripple animation
            var ripple = document.createElement('span');
            ripple.className = 'tree-click-ripple';
            var c = aorColor || '#38bdf8';
            ripple.style.background = 'linear-gradient(90deg, transparent, ' + c + '60, transparent)';
            el.appendChild(ripple);

            // Glow flash
            el.style.setProperty('--glow-color', c + '40');
            el.classList.add('tree-item-glow');

            // Cleanup after animation
            setTimeout(function () {
              if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
              el.classList.remove('tree-item-glow');
            }, 500);

            // Determine slide direction before navigating
            lastClickedDirection = getNavigationDirection(el);

            saveExpandedState();
            spaNavigate(href);
          });
        })(fileEl, item.href, rootColor);

        container.appendChild(fileEl);
      }
    });
  }

  // ============================================================================
  // LEVEL EXPAND/COLLAPSE — toggles all folders within a root category
  // ============================================================================
  function toggleToLevel(rootFolderEl, rootChildWrap, targetLevel, currentDepth) {
    // Determine if we should expand or collapse at this level
    // We check if ANY folder at targetLevel is currently collapsed → expand all
    // If ALL are expanded → collapse all at that level and deeper
    var shouldExpand = hasCollapsedAtLevel(rootChildWrap, targetLevel, 1);

    applyLevel(rootFolderEl, rootChildWrap, targetLevel, 0, shouldExpand);
  }

  function hasCollapsedAtLevel(container, targetLevel, currentLevel) {
    var folders = container.querySelectorAll(':scope > .tree-item.folder');
    for (var i = 0; i < folders.length; i++) {
      if (currentLevel <= targetLevel) {
        if (folders[i].getAttribute('data-expanded') !== 'true') return true;
        // Check deeper
        var childWrap = folders[i].nextElementSibling;
        if (childWrap && childWrap.classList.contains('tree-children') && currentLevel < targetLevel) {
          if (hasCollapsedAtLevel(childWrap, targetLevel, currentLevel + 1)) return true;
        }
      }
    }
    return false;
  }

  function applyLevel(rootFolderEl, container, targetLevel, currentLevel, shouldExpand) {
    // First ensure root itself is expanded
    if (shouldExpand) {
      rootFolderEl.setAttribute('data-expanded', 'true');
      container.style.display = 'block';
    }

    var children = container.children;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.classList.contains('tree-item') && el.classList.contains('folder')) {
        var childLevel = currentLevel + 1;
        var childWrap = el.nextElementSibling;
        if (!childWrap || !childWrap.classList.contains('tree-children')) continue;

        if (childLevel <= targetLevel) {
          if (shouldExpand) {
            el.setAttribute('data-expanded', 'true');
            childWrap.style.display = 'block';
            // Recurse deeper if needed
            if (childLevel < targetLevel) {
              applyLevel(el, childWrap, targetLevel, childLevel, shouldExpand);
            }
          } else {
            // Collapse at target level and deeper
            if (childLevel === targetLevel) {
              el.setAttribute('data-expanded', 'false');
              childWrap.style.display = 'none';
            } else {
              // Keep expanded above target, but recurse
              applyLevel(el, childWrap, targetLevel, childLevel, shouldExpand);
            }
          }
        }
      }
    }
  }

  // ============================================================================
  // EXPANDED STATE PERSISTENCE
  // ============================================================================
  function isItemExpanded(key) {
    try {
      var state = JSON.parse(sessionStorage.getItem(EXPANDED_STATE_KEY) || '{}');
      return state[key] === true;
    } catch (e) { return false; }
  }

  function saveExpandedState() {
    try {
      var state = {};
      var folders = document.querySelectorAll('.ek-sidebar-tree .tree-item.folder[data-category-key]');
      for (var i = 0; i < folders.length; i++) {
        var key = folders[i].getAttribute('data-category-key');
        if (key) state[key] = folders[i].getAttribute('data-expanded') === 'true';
      }
      sessionStorage.setItem(EXPANDED_STATE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function restoreExpandedState() {
    // Already handled in renderTreeItems via isItemExpanded()
  }

  // ============================================================================
  // HIGHLIGHT ACTIVE LINK
  // ============================================================================
  function highlightActiveLink() {
    var currentPath = window.location.pathname;
    if (currentPath !== '/' && currentPath.endsWith('/')) currentPath = currentPath.slice(0, -1);

    // Remove all existing highlights + reset inline active styles
    var allActive = document.querySelectorAll('.ek-sidebar-tree .tree-item.active');
    for (var a = 0; a < allActive.length; a++) {
      var el = allActive[a];
      el.classList.remove('active');
      el.style.backgroundColor = '';
      var prevColor = el.getAttribute('data-aor-color');
      // Restore AOR color on text and icon
      if (prevColor) {
        if (el.classList.contains('folder')) el.style.color = prevColor;
        else el.style.color = '';
        var svg = el.querySelector('.tree-icon svg');
        if (svg) svg.style.stroke = prevColor;
      } else {
        el.style.color = '';
        var svg2 = el.querySelector('.tree-icon svg');
        if (svg2) svg2.style.stroke = '';
      }
    }

    // Check file items (pages)
    var links = document.querySelectorAll('.ek-sidebar-tree a.tree-item.file');
    var found = false;
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');
      if (href !== '/' && href.endsWith('/')) href = href.slice(0, -1);

      if (href === currentPath) {
        link.classList.add('active');
        applyActiveColor(link);
        found = true;
        expandParents(link);
      }
    }

    // Check folder items (category index pages) — if no file matched
    if (!found) {
      var folders = document.querySelectorAll('.ek-sidebar-tree .tree-item.folder[data-href]');
      for (var j = 0; j < folders.length; j++) {
        var folder = folders[j];
        var fhref = folder.getAttribute('data-href');
        if (fhref !== '/' && fhref.endsWith('/')) fhref = fhref.slice(0, -1);

        if (fhref === currentPath) {
          folder.classList.add('active');
          applyActiveColor(folder);
          expandParents(folder);
          break;
        }
      }
    }
  }

  // Apply AOR-colored active background
  function applyActiveColor(el) {
    var aorColor = el.getAttribute('data-aor-color');
    if (aorColor) {
      el.style.backgroundColor = aorColor;
      el.style.color = '#fff';
      // Also set icon stroke to white
      var svg = el.querySelector('.tree-icon svg');
      if (svg) svg.style.stroke = '#fff';
    }
  }

  function expandParents(el) {
    var node = el.parentElement;
    while (node && !node.classList.contains('ek-sidebar-tree')) {
      if (node.classList.contains('tree-children')) {
        node.style.display = 'block';
        var folder = node.previousElementSibling;
        if (folder && folder.classList.contains('tree-item') && folder.classList.contains('folder')) {
          folder.setAttribute('data-expanded', 'true');
        }
      }
      node = node.parentElement;
    }
  }

  // ============================================================================
  // ADJUST MAIN CONTENT
  // ============================================================================
  function adjustMainContent() {
    // The sidebar takes 260px. Add margin-left to the main content container.
    // Don't set 460px here — let each page control its own inner spacing.
    // We only ensure the sidebar doesn't overlap content.
    var selectors = ['[class*="docMainContainer"]', '[class*="docPage"]', '.app', '.dashboard-container', '.stats-container', '.home-layout', '.home-content', '.home-wrapper', '.mapa-container', '.obsah-container', '.palace-wrap'];
    var container = null;
    for (var i = 0; i < selectors.length; i++) {
      container = document.querySelector(selectors[i]);
      if (container) break;
    }
    if (!container) container = document.body;

    // Only set margin-left if sidebar-tree injected it
    container.style.marginLeft = SIDEBAR_WIDTH + 'px';

    // Docusaurus may not have rendered yet on first load — retry
    if (container === document.body) {
      var retries = 0;
      var retryInterval = setInterval(function () {
        retries++;
        for (var r = 0; r < selectors.length; r++) {
          var c = document.querySelector(selectors[r]);
          if (c && c !== document.body) {
            c.style.marginLeft = SIDEBAR_WIDTH + 'px';
            clearInterval(retryInterval);
            return;
          }
        }
        if (retries >= 20) clearInterval(retryInterval); // stop after 2s
      }, 100);
    }
  }

  // ============================================================================
  // CSS INJECTION
  // ============================================================================
  function injectCSS() {
    var style = document.createElement('style');
    style.textContent = [
      '/* ===== EK SIDEBAR TREE (unified, editor style) ===== */',
      '.ek-sidebar-tree {',
      '  position: fixed; left: 0; top: ' + TOP_OFFSET + 'px; bottom: ' + BOTTOM_OFFSET + 'px;',
      '  width: ' + SIDEBAR_WIDTH + 'px; z-index: 1000;',
      '  background: #1e293b;',
      '  border-right: 1px solid #334155;',
      '  overflow-y: auto; overflow-x: hidden;',
      '  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;',
      '  display: flex; flex-direction: column;',
      '}',
      '',
      '/* Scrollbar */',
      '.ek-sidebar-tree::-webkit-scrollbar { width: 6px; }',
      '.ek-sidebar-tree::-webkit-scrollbar-track { background: transparent; }',
      '.ek-sidebar-tree::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }',
      '.ek-sidebar-tree::-webkit-scrollbar-thumb:hover { background: #475569; }',
      '',
      '/* Header */',
      '.ek-sidebar-header {',
      '  padding: 0.8rem 1.2rem 0.5rem;',
      '  border-bottom: 1px solid #334155;',
      '  flex-shrink: 0;',
      '}',
      '.ek-sidebar-header h2 {',
      '  font-size: 1rem; color: #38bdf8; font-weight: 700; margin: 0 0 0.5rem 0;',
      '}',
      '',
      '/* Search box */',
      '.ek-search-box {',
      '  display: flex; align-items: center; gap: 4px;',
      '}',
      '.ek-search-input {',
      '  flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 4px;',
      '  color: #e2e8f0; font-size: 0.8rem; padding: 5px 8px;',
      '  outline: none; font-family: inherit;',
      '}',
      '.ek-search-input::placeholder { color: #64748b; }',
      '.ek-search-input:focus { border-color: #38bdf8; }',
      '.ek-search-toggle {',
      '  width: 26px; height: 26px; border: 1px solid #334155; border-radius: 4px;',
      '  background: transparent; color: #64748b; cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  font-size: 13px; transition: all 0.15s; padding: 0; flex-shrink: 0;',
      '}',
      '.ek-search-toggle:hover { border-color: #94a3b8; color: #94a3b8; }',
      '.ek-search-toggle.active { border-color: #38bdf8; color: #38bdf8; background: #1e3a5f; }',
      '',
      '/* Search results — floating panel next to sidebar */',
      '.ek-search-results {',
      '  position: fixed; left: ' + SIDEBAR_WIDTH + 'px; top: ' + TOP_OFFSET + 'px; bottom: ' + BOTTOM_OFFSET + 'px;',
      '  width: ' + SIDEBAR_WIDTH + 'px; z-index: 999;',
      '  background: #1e293b; border-right: 1px solid #334155;',
      '  display: flex; flex-direction: column; padding: 0;',
      '  box-shadow: 4px 0 12px rgba(0,0,0,0.3);',
      '}',
      '.ek-search-results .sr-item {',
      '  display: flex; flex-direction: column; gap: 2px;',
      '  padding: 0.4rem 1.2rem; cursor: pointer; font-size: 0.8rem; color: #e2e8f0;',
      '  transition: background 0.1s; border-bottom: 1px solid #1e293b;',
      '}',
      '.ek-search-results .sr-item:hover { background: #334155; }',
      '.ek-search-results .sr-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.ek-search-results .sr-title mark { background: #38bdf8; color: #0f172a; border-radius: 2px; padding: 0 2px; }',
      '.ek-search-results .sr-heading { font-size: 0.75rem; color: #94a3b8; padding-left: 0.5rem; }',
      '.ek-search-results .sr-heading::before { content: "# "; color: #475569; }',
      '.ek-search-results .sr-heading mark { background: #fbbf24; color: #0f172a; border-radius: 2px; padding: 0 1px; }',
      '.ek-search-results .sr-snippet { font-size: 0.72rem; color: #64748b; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.ek-search-results .sr-snippet mark { background: #a78bfa; color: #0f172a; border-radius: 2px; padding: 0 1px; }',
      '.ek-search-results .sr-folder { color: #94a3b8; font-weight: 600; }',
      '.ek-search-results .sr-empty { color: #475569; text-align: center; padding: 2rem 1rem; font-size: 0.8rem; }',
      '.ek-search-results .sr-item.sr-active { background: #1e3a5f; border-left: 3px solid #38bdf8; }',
      '.ek-search-clear {',
      '  display: flex; align-items: center; justify-content: center; gap: 6px;',
      '  padding: 6px 1.2rem; cursor: pointer; font-size: 0.75rem; color: #64748b;',
      '  border-bottom: 1px solid #334155; transition: all 0.15s;',
      '}',
      '.ek-search-clear:hover { color: #e2e8f0; background: #334155; }',
      '.ek-search-clear svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }',
      '',
      '/* Search panel resize handle */',
      '.ek-search-resize {',
      '  position: absolute; top: 0; right: 0; bottom: 0; width: 4px;',
      '  cursor: col-resize; background: transparent; z-index: 1001;',
      '  transition: background 0.15s;',
      '}',
      '.ek-search-resize:hover { background: #38bdf8; }',
      '',
      '/* In-page search highlights — pulsing */',
      '@keyframes hlPulse {',
      '  0%, 100% { background: #fbbf2470; outline-color: #fbbf2440; }',
      '  50%      { background: #fbbf2420; outline-color: transparent; }',
      '}',
      '.ek-search-hl { border-radius: 2px; outline: 2px solid #fbbf2440; scroll-margin-top: 60px; animation: hlPulse 1.8s ease-in-out infinite; }',
      '.ek-search-hl-active { background: #f59e0b !important; outline: 2px solid #f59e0b80 !important; animation: none; }',
      '',
      '/* Search minimap — vertical strip showing match positions */',
      '.ek-search-minimap {',
      '  position: fixed; right: 4px; top: 50px; bottom: 40px; width: 8px;',
      '  z-index: 999; pointer-events: none; border-radius: 4px;',
      '  background: #1e293b40;',
      '}',
      '.ek-search-minimap .mm-tick {',
      '  position: absolute; right: 0; width: 8px; height: 3px;',
      '  background: #fbbf24; border-radius: 1px; pointer-events: auto; cursor: pointer;',
      '}',
      '.ek-search-minimap .mm-tick:hover { background: #f59e0b; height: 5px; }',
      '.ek-search-minimap .mm-pos {',
      '  position: absolute; right: 0; width: 8px; height: 2px;',
      '  background: #38bdf8; border-radius: 1px;',
      '}',
      '',
      '/* Items container */',
      '.ek-sidebar-items {',
      '  flex: 1; overflow-y: auto; padding: 0.5rem 0;',
      '}',
      '',
      '/* Tree item — base (matches editor.html) */',
      '.ek-sidebar-tree .tree-item {',
      '  display: flex; align-items: center; gap: 0.4rem;',
      '  padding: 0.35rem 1.2rem;',
      '  cursor: pointer; font-size: 0.85rem; color: #e2e8f0;',
      '  transition: background 0.1s; user-select: none;',
      '  text-decoration: none;',
      '}',
      '.ek-sidebar-tree .tree-item:hover { background: #334155; }',
      '',
      '/* Active item — background color set inline via AOR_COLORS, fallback blue */',
      '.ek-sidebar-tree .tree-item.active {',
      '  background: #0ea5e9; color: #fff;',
      '  border-radius: 4px;',
      '}',
      '.ek-sidebar-tree .tree-item.active .tree-icon svg { stroke: #fff; }',
      '',
      '/* Folder items — color set inline via AOR_COLORS */',
      '.ek-sidebar-tree .tree-item.folder {',
      '  font-weight: 600; color: #94a3b8;',
      '}',
      '',
      '/* Indent */',
      '.ek-sidebar-tree .indent { width: 16px; flex-shrink: 0; }',
      '',
      '/* Tree icon */',
      '.ek-sidebar-tree .tree-icon {',
      '  flex-shrink: 0; width: 18px; height: 18px;',
      '  display: flex; align-items: center; justify-content: center;',
      '}',
      '.ek-sidebar-tree .tree-icon svg {',
      '  width: 16px; height: 16px; stroke: currentColor; fill: none;',
      '  stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;',
      '}',
      '',
      '/* Caret for folders — click target for expand/collapse (larger hit area) */',
      '.ek-sidebar-tree .tree-caret {',
      '  flex-shrink: 0; width: 22px; height: 22px;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: transform 0.2s;',
      '  cursor: pointer; border-radius: 3px;',
      '}',
      '.ek-sidebar-tree .tree-caret:hover { background: #475569; }',
      '.ek-sidebar-tree .tree-caret svg {',
      '  width: 14px; height: 14px; stroke: #94a3b8; fill: none;',
      '  stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;',
      '}',
      '.ek-sidebar-tree .tree-item.folder[data-expanded="true"] > .tree-caret {',
      '  transform: rotate(90deg);',
      '}',
      '',
      '/* Folder label — click = toggle, double-click = navigate (if has index) */',
      '.ek-sidebar-tree .tree-item.folder { cursor: pointer; }',
      '.ek-sidebar-tree .tree-item.folder .tree-label,',
      '.ek-sidebar-tree .tree-item.folder .tree-icon { cursor: pointer; }',
      '/* Folders with index page: dashed underline hint on hover */',
      '.ek-sidebar-tree .tree-item.folder[data-href] .tree-label:hover { text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 3px; }',
      '',
      '/* Children container */',
      '.ek-sidebar-tree .tree-children {',
      '  border-left: 1px solid #334155;',
      '  margin-left: 1.5rem;',
      '}',
      '',
      '/* Level expand buttons (Ⅰ Ⅱ Ⅲ) on root categories */',
      '.ek-sidebar-tree .tree-level-btns {',
      '  display: flex; gap: 4px; padding: 2px 1.2rem 6px 3.2rem;',
      '}',
      '.ek-sidebar-tree .tree-level-btn {',
      '  width: 24px; height: 20px; font-size: 11px; font-weight: 700;',
      '  font-family: system-ui, sans-serif; border: 1px solid #475569; border-radius: 3px;',
      '  background: transparent; color: #94a3b8; cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: all 0.15s; padding: 0; line-height: 1;',
      '}',
      '.ek-sidebar-tree .tree-level-btn:hover {',
      '  background: #334155; border-color: currentColor;',
      '}',
      '',
      '/* Folder icon pulse animation on toggle */',
      '@keyframes iconPulse {',
      '  0%   { transform: scale(1);   opacity: 1;   }',
      '  30%  { transform: scale(1.35); opacity: 0.7; }',
      '  60%  { transform: scale(0.9); opacity: 1;   }',
      '  100% { transform: scale(1);   opacity: 1;   }',
      '}',
      '.ek-sidebar-tree .tree-icon-pulse svg {',
      '  animation: iconPulse 0.35s ease-out;',
      '}',
      '',
      '/* Click ripple effect on document items */',
      '.ek-sidebar-tree .tree-item { position: relative; overflow: hidden; }',
      '@keyframes itemRipple {',
      '  0%   { left: -20%; opacity: 0.6; }',
      '  100% { left: 120%; opacity: 0; }',
      '}',
      '.tree-click-ripple {',
      '  position: absolute; top: 0; bottom: 0; width: 20%;',
      '  pointer-events: none; border-radius: 4px;',
      '  animation: itemRipple 0.45s ease-out forwards;',
      '}',
      '',
      '/* Glow flash on active transition */',
      '@keyframes itemGlow {',
      '  0%   { box-shadow: inset 0 0 0 0 transparent; }',
      '  30%  { box-shadow: inset 0 0 12px 2px var(--glow-color, #38bdf840); }',
      '  100% { box-shadow: inset 0 0 0 0 transparent; }',
      '}',
      '.tree-item-glow {',
      '  animation: itemGlow 0.5s ease-out;',
      '}',
      '',
      '/* ===== CRT power-on effect — page entry animation ===== */',
      '@keyframes crtPowerOn {',
      '  0%   { transform: scaleY(0);    opacity: 0;   }',
      '  50%  { transform: scaleY(1.03); opacity: 0.8; }',
      '  100% { transform: scaleY(1);    opacity: 1;   }',
      '}',
      '.crt-power-on {',
      '  animation: crtPowerOn 0.4s ease-out forwards;',
      '  transform-origin: center 120px;',
      '}',
      '',
      '/* Extra bottom padding so TOC last headings can scroll to top */',
      'article { padding-bottom: 80vh !important; }',
      '',
      '/* Label */',
      '.ek-sidebar-tree .tree-label {',
      '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
      '}',
      '',
      '/* Resize handle */',
      '.ek-sidebar-resize {',
      '  position: absolute; top: 0; right: 0; bottom: 0; width: 4px;',
      '  cursor: col-resize; background: transparent; z-index: 1001;',
      '  transition: background 0.15s;',
      '}',
      '.ek-sidebar-resize:hover, .ek-sidebar-resize.dragging {',
      '  background: #38bdf8;',
      '}',
    ].join('\n');

    document.head.appendChild(style);
  }

  // ============================================================================
  // RESIZE
  // ============================================================================
  function initResize(sidebar, handle) {
    var MIN_WIDTH = 180;
    var MAX_WIDTH = 500;
    var startX, startWidth;

    // Restore saved width
    try {
      var saved = sessionStorage.getItem('ek_sidebar_width');
      if (saved) {
        var w = parseInt(saved, 10);
        if (w >= MIN_WIDTH && w <= MAX_WIDTH) {
          applySidebarWidth(sidebar, w);
        }
      }
    } catch (e) { /* ignore */ }

    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      handle.classList.add('dragging');

      function onMouseMove(e2) {
        var newWidth = startWidth + (e2.clientX - startX);
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        applySidebarWidth(sidebar, newWidth);
      }

      function onMouseUp() {
        handle.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        try { sessionStorage.setItem('ek_sidebar_width', sidebar.offsetWidth); } catch (e) {}
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function applySidebarWidth(sidebar, width) {
    sidebar.style.width = width + 'px';
    // Move search panel to right edge of sidebar
    var sp = document.querySelector('.ek-search-results');
    if (sp) sp.style.left = width + 'px';
    // Update main content margin (sidebar + search panel if visible)
    var selectors = ['[class*="docMainContainer"]', '[class*="docPage"]', '.app', '.dashboard-container', '.stats-container', '.home-layout', '.home-content', '.home-wrapper', '.mapa-container', '.obsah-container', '.palace-wrap'];
    var container = null;
    for (var i = 0; i < selectors.length; i++) {
      container = document.querySelector(selectors[i]);
      if (container) break;
    }
    if (!container) container = document.body;
    var extra = (sp && sp.style.display !== 'none') ? parseInt(sp.style.width || width, 10) : 0;
    container.style.marginLeft = (width + extra) + 'px';
  }

  // ============================================================================
  // PAGE SLIDE TRANSITION — content slides up/down based on sidebar position
  // ============================================================================
  var lastClickedDirection = 'down'; // default

  // Manual scroll animation — full control over speed (browser smooth is too fast)
  function animateScroll(from, to, duration, callback) {
    var startTime = null;
    window.scrollTo({ top: from, behavior: 'auto' });
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic — decelerates naturally
      var ease = 1 - Math.pow(1 - progress, 3);
      window.scrollTo({ top: from + (to - from) * ease, behavior: 'auto' });
      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (callback) {
        callback();
      }
    }
    requestAnimationFrame(step);
  }

  function playSlideTransition(direction) {
    // CRT power-on: article scales from 0→1 vertically (like old TV turning on).
    // Simple, reliable CSS animation — no scroll manipulation.
    var article = document.querySelector('article');
    if (!article) return;
    window.scrollTo({ top: 0, behavior: 'auto' }); // start at top of new page
    article.classList.remove('crt-power-on');
    void article.offsetHeight; // force reflow to restart animation
    article.classList.add('crt-power-on');
    article.addEventListener('animationend', function handler() {
      article.classList.remove('crt-power-on');
      article.removeEventListener('animationend', handler);
    });
  }

  // Determine direction: compare Y of clicked sidebar item vs. active one
  function getNavigationDirection(clickedEl) {
    try {
      var active = document.querySelector('.ek-sidebar-tree .tree-item.active');
      if (!active || !clickedEl) return 'down';
      var clickedY = clickedEl.getBoundingClientRect().top;
      var activeY = active.getBoundingClientRect().top;
      return clickedY > activeY ? 'down' : 'up';
    } catch (e) { return 'down'; }
  }

  // ============================================================================
  // SPA NAVIGATION — no full page reload on Docusaurus pages
  // ============================================================================
  function spaNavigate(href) {
    if (!href) return;

    // Root "/" is home.html served by Express — always full reload
    var normalized = href.replace(/\/$/, '') || '/';
    if (normalized === '/') {
      window.location.href = '/';
      return;
    }

    // On Docusaurus pages, use pushState + popstate to trigger React Router
    var isDocusaurus = !!document.getElementById('__docusaurus');
    if (isDocusaurus) {
      var current = window.location.pathname.replace(/\/$/, '') || '/';
      if (current === normalized) return; // already there

      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));

      // Wait for React to render, then fix sidebar + animate
      var dir = lastClickedDirection;
      var attempts = 0;
      function waitAndAnimate() {
        attempts++;
        onDocusaurusNavigate();
        var article = document.querySelector('article');
        if (article || attempts >= 5) {
          playSlideTransition(dir);
        } else {
          setTimeout(waitAndAnimate, 50);
        }
      }
      setTimeout(waitAndAnimate, 80);
      return;
    }

    // Non-Docusaurus (home, dashboard, mapa...) — full navigation
    window.location.href = href;
  }

  // ============================================================================
  // DOCUSAURUS SPA NAVIGATION HANDLER
  // ============================================================================
  function onDocusaurusNavigate() {
    // Hide Docusaurus sidebar if it reappeared after SPA navigation
    var docuSidebar = document.querySelector('.theme-doc-sidebar-container');
    if (docuSidebar) docuSidebar.style.display = 'none';

    // Re-apply margin to new main container
    var sidebar = document.querySelector('.ek-sidebar-tree');
    if (sidebar) {
      var width = sidebar.offsetWidth || SIDEBAR_WIDTH;
      var selectors = ['[class*="docMainContainer"]', '[class*="docPage"]', '.app', '.dashboard-container', '.stats-container', '.home-layout', '.home-content', '.home-wrapper', '.mapa-container', '.obsah-container', '.palace-wrap'];
      for (var i = 0; i < selectors.length; i++) {
        var container = document.querySelector(selectors[i]);
        if (container) { container.style.marginLeft = width + 'px'; break; }
      }
    }

    // Re-highlight active link (highlightActiveLink handles full reset internally)
    highlightActiveLink();
  }

  // Watch for Docusaurus SPA route changes (URL changes without full reload)
  var lastUrl = window.location.href;
  var urlObserver = new MutationObserver(function () {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(onDocusaurusNavigate, 50);
    }
  });

  // ============================================================================
  // TOC SCROLL OVERRIDE — always scroll heading to top of viewport
  // ============================================================================
  // Docusaurus TOC links use href="#id". Browser won't scroll if target is
  // already visible. We force it: heading always lands at the top of viewport.
  document.addEventListener('click', function (e) {
    // Match any link with href="#..." inside a TOC or inside the article itself
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    // Only intercept in-page anchors (not sidebar links etc.)
    var href = link.getAttribute('href');
    if (!href || href.length < 2 || href.charAt(0) !== '#') return;

    // Skip if it's inside the sidebar tree (those are navigation, not anchors)
    if (link.closest('.ek-sidebar-tree')) return;

    e.preventDefault();
    e.stopPropagation();

    var targetId = decodeURIComponent(href.slice(1));
    var target = document.getElementById(targetId);
    if (!target) return;

    // Top nav offset
    var topNav = document.getElementById('ek-top-nav');
    var navH = topNav ? topNav.offsetHeight : 46;

    // Calculate absolute Y position of target, minus nav height and a small gap
    var targetY = target.getBoundingClientRect().top + window.pageYOffset - navH - 8;
    var finalY = Math.max(0, targetY);

    // Use animateScroll for visible, controlled scroll speed (700ms ease-out)
    var currentY = window.pageYOffset;
    // Scale duration by distance — short jumps faster, long jumps slower (min 400ms, max 900ms)
    var dist = Math.abs(finalY - currentY);
    var dur = Math.min(900, Math.max(400, dist * 0.7));
    animateScroll(currentY, finalY, dur);

    // Update URL hash
    if (history.replaceState) {
      history.replaceState(null, '', href);
    }
  }, true);

  // ============================================================================
  // AUTO-INIT
  // ============================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      urlObserver.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    init();
    urlObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
