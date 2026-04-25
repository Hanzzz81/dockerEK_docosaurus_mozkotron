/**
 * KaTeX auto-render pro Docusaurus
 * Najde $...$ a $$...$$ v textu a vyrendruje matematické vzorce.
 */
(function () {
  'use strict';

  function renderMath() {
    if (typeof renderMathInElement === 'undefined') {
      setTimeout(renderMath, 200);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(renderMath, 300); });
  } else {
    setTimeout(renderMath, 300);
  }

  // Client-side navigace
  var observer = new MutationObserver(function () {
    setTimeout(renderMath, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
