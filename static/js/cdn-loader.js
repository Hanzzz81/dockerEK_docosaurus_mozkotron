/**
 * CDN Loader — dynamicky načte KaTeX pro matematické vzorce.
 *
 * Mermaid diagramy řeší nativně @docusaurus/theme-mermaid
 * (viz docusaurus.config.js: markdown.mermaid + themes).
 *
 * Stačí jediný <script src="/js/cdn-loader.js"> v configu.
 */
(function () {
  'use strict';

  // === Helpers ===
  function loadCSS(href) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadJS(src, onload) {
    var script = document.createElement('script');
    script.src = src;
    if (onload) script.onload = onload;
    document.head.appendChild(script);
  }

  // === KaTeX ===
  loadCSS('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css');
  loadJS('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', function () {
    loadJS('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js', function () {
      renderKaTeX();
    });
  });

  function renderKaTeX() {
    if (typeof renderMathInElement === 'undefined') {
      setTimeout(renderKaTeX, 200);
      return;
    }
    var container = document.querySelector('article') || document.body;
    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  }

  // === MutationObserver pro client-side navigaci ===
  var observer = new MutationObserver(function () {
    setTimeout(function () {
      renderKaTeX();
    }, 300);
  });

  function startObserver() {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  console.log('[CDN Loader] KaTeX loading initiated');
})();
