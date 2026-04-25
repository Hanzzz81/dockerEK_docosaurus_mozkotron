/**
 * Block Editor Engine — Mozkotron
 * ================================
 * Blokový editor s lomítkovými příkazy (Notion/Coda styl).
 * Samostatný modul — vyměnitelný za Tiptap, BlockNote apod.
 *
 * API:
 *   var editor = new BlockEditor(containerEl, options)
 *   editor.loadMarkdown(mdString)
 *   editor.toMarkdown(frontmatterObj)  → string
 *   editor.clear()
 *   editor.focus()
 *   editor.getBlocks()  → [{ id, type, content, variant?, lang? }]
 *   editor.onSave = function() { ... }
 *
 * Události:
 *   editor.onChange — voláno při každé změně obsahu
 *   editor.onSave   — voláno při Ctrl+S
 */
(function (root) {
  'use strict';

  // ================================================================
  // SLASH COMMAND DEFINITIONS
  // ================================================================
  var SLASH_COMMANDS = [
    { group: 'Text', items: [
      { cmd: 'h1', alias: 'nadpis1,heading1', icon: 'H₁', label: 'Nadpis 1', desc: 'Hlavní nadpis', type: 'h1' },
      { cmd: 'h2', alias: 'nadpis2,heading2', icon: 'H₂', label: 'Nadpis 2', desc: 'Sekce', type: 'h2' },
      { cmd: 'h3', alias: 'nadpis3,heading3', icon: 'H₃', label: 'Nadpis 3', desc: 'Podsekce', type: 'h3' },
      { cmd: 'p', alias: 'text,odstavec,paragraph', icon: '¶', label: 'Odstavec', desc: 'Běžný text', type: 'paragraph' },
    ]},
    { group: 'Seznamy', items: [
      { cmd: 'seznam', alias: 'list,ul,bullet,odrazky', icon: '•', label: 'Odrážkový seznam', desc: 'Nečíslovaný bod', type: 'bullet' },
      { cmd: 'cislo', alias: 'ol,numbered,cislovany', icon: '1.', label: 'Číslovaný seznam', desc: 'Číslovaný bod', type: 'numbered' },
    ]},
    { group: 'Formátování', items: [
      { cmd: 'citace', alias: 'quote,blockquote', icon: '❝', label: 'Citace', desc: 'Zvýrazněný blok', type: 'blockquote' },
      { cmd: 'kod', alias: 'code,codeblock', icon: '{ }', label: 'Blok kódu', desc: 'Formátovaný kód', type: 'code' },
      { cmd: 'oddelovac', alias: 'hr,divider,separator,cara', icon: '—', label: 'Oddělovač', desc: 'Horizontální čára', type: 'divider' },
    ]},
    { group: 'Zvýraznění', items: [
      { cmd: 'tip', alias: 'rada', icon: '💡', label: 'Tip', desc: 'Užitečná rada', type: 'callout', variant: 'tip' },
      { cmd: 'varovani', alias: 'warning,pozor', icon: '⚠️', label: 'Varování', desc: 'Důležité upozornění', type: 'callout', variant: 'warning' },
      { cmd: 'info', alias: 'informace', icon: 'ℹ️', label: 'Info', desc: 'Doplňující informace', type: 'callout', variant: 'info' },
      { cmd: 'poznamka', alias: 'note,nota', icon: '📝', label: 'Poznámka', desc: 'Poznámka na okraj', type: 'callout', variant: 'note' },
      { cmd: 'nebezpeci', alias: 'danger,critical', icon: '🔴', label: 'Nebezpečí', desc: 'Kritické varování', type: 'callout', variant: 'danger' },
    ]},
    { group: 'Rozložení', items: [
      { cmd: 'sloupce2', alias: 'columns2,col2,dva', icon: '▐▌', label: '2 sloupce', desc: 'Dva sloupce vedle sebe', type: 'columns', variant: '2' },
      { cmd: 'sloupce3', alias: 'columns3,col3,tri', icon: '▐▌▐', label: '3 sloupce', desc: 'Tři sloupce vedle sebe', type: 'columns', variant: '3' },
      { cmd: 'sloupce4', alias: 'columns4,col4,ctyri', icon: '▐▌▐▌', label: '4 sloupce', desc: 'Čtyři sloupce vedle sebe', type: 'columns', variant: '4' },
      { cmd: 'rozbalit', alias: 'details,toggle,collapsible,spoiler,accordion', icon: '▸', label: 'Rozbalitelný', desc: 'Skrytý obsah s nadpisem', type: 'details' },
    ]},
    { group: 'Komponenty', items: [
      { cmd: 'tabulka', alias: 'table,tab', icon: '▦', label: 'Tabulka', desc: 'Tabulka s daty', type: 'table' },
      { cmd: 'potvrzeni', alias: 'confirm,ack,stvrzeni', icon: '✅', label: 'Potvrzení přečtení', desc: 'Widget pro stvrzení', type: 'confirm' },
    ]},
  ];

  // ================================================================
  // BLOCK EDITOR CLASS
  // ================================================================
  function BlockEditor(containerEl, options) {
    this.container = containerEl;
    this.options = options || {};
    this.blocks = [];
    this._idCounter = 0;
    this.onChange = null;
    this.onSave = null;

    // Slash menu element
    this._slashMenu = null;
    this._slashBlockId = null;
    this._slashSelectedIdx = 0;
    this._slashFilteredItems = [];
    this._slashKeyHandler = this._handleSlashKey.bind(this);

    // Format toolbar
    this._formatToolbar = null;

    this._createSlashMenu();
    this._createFormatToolbar();
    this._attachSelectionListener();
  }

  var proto = BlockEditor.prototype;

  // ================================================================
  // PUBLIC API
  // ================================================================
  proto.clear = function () {
    this.blocks = [];
    this.blocks.push(this._createBlock('h1', ''));
    this.blocks.push(this._createBlock('paragraph', ''));
    this._render();
  };

  proto.focus = function () {
    if (this.blocks.length > 0) this._focusBlock(this.blocks[0].id);
  };

  proto.getBlocks = function () { return this.blocks; };

  proto.loadMarkdown = function (md) {
    this.blocks = [];
    var body = md;
    var frontmatter = {};

    // Parse frontmatter
    var fmMatch = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (fmMatch) {
      body = fmMatch[2];
      fmMatch[1].split('\n').forEach(function (line) {
        var m = line.match(/^([\w_]+):\s*["']?(.+?)["']?\s*$/);
        if (m) frontmatter[m[1]] = m[2];
      });
    }

    // Parse body into blocks
    var lines = body.split('\n');
    var i = 0;
    var self = this;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      // Headings
      if (line.startsWith('### ')) { this.blocks.push(this._createBlock('h3', line.slice(4))); i++; continue; }
      if (line.startsWith('## ')) { this.blocks.push(this._createBlock('h2', line.slice(3))); i++; continue; }
      if (line.startsWith('# ')) { this.blocks.push(this._createBlock('h1', line.slice(2))); i++; continue; }

      // Divider
      if (/^---+$/.test(line)) { this.blocks.push(this._createBlock('divider')); i++; continue; }

      // Bullet list
      if (/^[-*]\s/.test(line)) { this.blocks.push(this._createBlock('bullet', line.replace(/^[-*]\s/, ''))); i++; continue; }

      // Numbered list
      if (/^\d+\.\s/.test(line)) { this.blocks.push(this._createBlock('numbered', line.replace(/^\d+\.\s/, ''))); i++; continue; }

      // Blockquote
      if (line.startsWith('> ')) { this.blocks.push(this._createBlock('blockquote', line.slice(2))); i++; continue; }

      // Code block
      if (line.startsWith('```')) {
        var lang = line.slice(3).trim();
        var codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
        this.blocks.push(this._createBlock('code', codeLines.join('\n'), { lang: lang }));
        i++; continue;
      }

      // Callout (Docusaurus admonition)
      if (line.startsWith(':::')) {
        var variant = line.slice(3).trim() || 'note';
        if (variant === 'tip' || variant === 'warning' || variant === 'info' || variant === 'note' || variant === 'danger') {
          var calloutLines = [];
          i++;
          while (i < lines.length && !lines[i].startsWith(':::')) { calloutLines.push(lines[i]); i++; }
          this.blocks.push(this._createBlock('callout', calloutLines.join('\n'), { variant: variant }));
          i++; continue;
        }
      }

      // Markdown table
      if (line.startsWith('|') && line.endsWith('|')) {
        var tableHeader = line.slice(1, -1).split('|').map(function (c) { return c.trim(); });
        i++;
        // Skip separator row (| --- | --- |)
        if (i < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i])) i++;
        var tableRows = [];
        while (i < lines.length && lines[i].startsWith('|') && lines[i].endsWith('|')) {
          var row = lines[i].slice(1, -1).split('|').map(function (c) { return c.trim(); });
          tableRows.push(row);
          i++;
        }
        this.blocks.push(this._createBlock('table', '', { header: tableHeader, rows: tableRows }));
        continue;
      }

      // Details / collapsible
      if (line.trim() === '<details>') {
        var detSummary = '';
        var detContent = [];
        i++;
        // Read summary line
        if (i < lines.length && lines[i].trim().startsWith('<summary>')) {
          detSummary = lines[i].replace(/<\/?summary>/g, '').trim();
          i++;
        }
        // Read content until </details>
        while (i < lines.length && lines[i].trim() !== '</details>') {
          detContent.push(lines[i]);
          i++;
        }
        this.blocks.push(this._createBlock('details', '', {
          summary: detSummary,
          detailsContent: this._mdInlineToHtml(detContent.join('\n').trim())
        }));
        i++; continue;
      }

      // Columns (div flex layout)
      if (line.trim().startsWith('<div') && line.includes('display:flex')) {
        var colContents = [];
        var currentCol = null;
        i++;
        while (i < lines.length && !lines[i].trim().match(/^<\/div>$/)) {
          if (lines[i].trim().startsWith('<div') && lines[i].includes('flex:1')) {
            if (currentCol !== null) colContents.push(currentCol);
            currentCol = '';
            i++; continue;
          }
          if (lines[i].trim() === '</div>' && currentCol !== null) {
            colContents.push(currentCol.trim());
            currentCol = null;
            i++; continue;
          }
          if (currentCol !== null) {
            currentCol += (currentCol ? '\n' : '') + lines[i];
          }
          i++;
        }
        if (currentCol !== null) colContents.push(currentCol.trim());
        this.blocks.push(this._createBlock('columns', '', {
          variant: '' + colContents.length,
          cols: colContents.map(function (c) { return self._mdInlineToHtml(c); })
        }));
        i++; continue;
      }

      // Confirm widget
      if (line.includes('<ek-ack-widget')) { this.blocks.push(this._createBlock('confirm')); i++; continue; }

      // Regular paragraph (convert inline MD to HTML)
      this.blocks.push(this._createBlock('paragraph', this._mdInlineToHtml(line)));
      i++;
    }

    if (this.blocks.length === 0) {
      this.blocks.push(this._createBlock('h1', frontmatter.title || ''));
      this.blocks.push(this._createBlock('paragraph', ''));
    }

    this._render();
    return frontmatter;
  };

  proto.toMarkdown = function (frontmatterObj) {
    // Sync all blocks from DOM
    var self = this;
    this.blocks.forEach(function (b) { self._syncContent(b.id); });

    var lines = [];
    var fm = frontmatterObj || {};

    // Frontmatter
    lines.push('---');
    Object.keys(fm).forEach(function (key) {
      var val = fm[key];
      if (val === undefined || val === null || val === '') return;
      // Quote strings that contain special chars
      if (typeof val === 'string' && (val.includes(':') || val.includes('"'))) {
        lines.push(key + ': "' + val.replace(/"/g, '\\"') + '"');
      } else {
        lines.push(key + ': ' + val);
      }
    });
    lines.push('---');
    lines.push('');

    var numberedCounter = 0;

    this.blocks.forEach(function (block) {
      var text = self._htmlToMd(block.content || '');

      switch (block.type) {
        case 'h1': lines.push('# ' + text); lines.push(''); break;
        case 'h2': lines.push('## ' + text); lines.push(''); break;
        case 'h3': lines.push('### ' + text); lines.push(''); break;
        case 'paragraph':
          if (text) { lines.push(text); lines.push(''); }
          break;
        case 'bullet': lines.push('- ' + text); break;
        case 'numbered':
          numberedCounter++;
          lines.push(numberedCounter + '. ' + text);
          break;
        case 'blockquote': lines.push('> ' + text); lines.push(''); break;
        case 'code':
          lines.push('```' + (block.lang || ''));
          lines.push(text);
          lines.push('```');
          lines.push('');
          break;
        case 'divider': lines.push('---'); lines.push(''); break;
        case 'callout':
          lines.push(':::' + (block.variant || 'note'));
          if (text) lines.push(text);
          lines.push(':::');
          lines.push('');
          break;
        case 'table':
          if (block.header && block.rows) {
            lines.push('| ' + block.header.join(' | ') + ' |');
            lines.push('| ' + block.header.map(function () { return '---'; }).join(' | ') + ' |');
            block.rows.forEach(function (row) {
              lines.push('| ' + row.join(' | ') + ' |');
            });
            lines.push('');
          }
          break;
        case 'columns':
          if (block.cols) {
            // Export as Docusaurus-compatible column layout (using div with flex)
            var n = block.cols.length;
            lines.push('<div style="display:flex;gap:1rem;">');
            block.cols.forEach(function (col) {
              lines.push('<div style="flex:1;">');
              lines.push('');
              lines.push(self._htmlToMd(col || ''));
              lines.push('');
              lines.push('</div>');
            });
            lines.push('</div>');
            lines.push('');
          }
          break;
        case 'details':
          lines.push('<details>');
          lines.push('<summary>' + (block.summary || 'Rozbalit') + '</summary>');
          lines.push('');
          if (block.detailsContent) lines.push(self._htmlToMd(block.detailsContent));
          lines.push('');
          lines.push('</details>');
          lines.push('');
          break;
        case 'confirm':
          lines.push('<ek-ack-widget title="Potvrzení přečtení" />');
          lines.push('');
          break;
        default:
          if (text) { lines.push(text); lines.push(''); }
      }
      if (block.type !== 'numbered') numberedCounter = 0;
    });

    return lines.join('\n');
  };

  // ================================================================
  // BLOCK MANAGEMENT (internal)
  // ================================================================
  proto._newId = function () { return 'blk_' + (++this._idCounter); };

  proto._createBlock = function (type, content, opts) {
    var block = { id: this._newId(), type: type || 'paragraph', content: content || '' };
    if (opts) {
      for (var k in opts) { if (opts.hasOwnProperty(k)) block[k] = opts[k]; }
    }
    return block;
  };

  proto._findBlock = function (id) {
    for (var i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].id === id) return this.blocks[i];
    }
    return null;
  };

  proto._findBlockIndex = function (id) {
    for (var i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].id === id) return i;
    }
    return -1;
  };

  proto._addBlockAfter = function (afterId, type, content, opts) {
    var block = this._createBlock(type, content, opts);
    var idx = this._findBlockIndex(afterId);
    if (idx >= 0) {
      this.blocks.splice(idx + 1, 0, block);
    } else {
      this.blocks.push(block);
    }
    this._render();
    this._focusBlock(block.id);
    this._emitChange();
    return block;
  };

  proto._removeBlock = function (id) {
    var idx = this._findBlockIndex(id);
    if (idx < 0) return;
    if (this.blocks.length <= 1) {
      this.blocks[0].content = '';
      this._render();
      return;
    }
    this.blocks.splice(idx, 1);
    this._render();
    if (idx > 0) this._focusBlock(this.blocks[idx - 1].id, 'end');
    this._emitChange();
  };

  proto._getContentEl = function (id) {
    var el = this.container.querySelector('.ek-block[data-id="' + id + '"] .ek-block-content');
    return el;
  };

  proto._focusBlock = function (id, pos) {
    var self = this;
    setTimeout(function () {
      var el = self._getContentEl(id);
      if (!el) return;
      el.focus();
      if (pos === 'end' && el.textContent.length > 0) {
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  };

  proto._syncContent = function (id) {
    var el = this._getContentEl(id);
    var block = this._findBlock(id);
    if (el && block && block.type !== 'table' && block.type !== 'columns' && block.type !== 'details') block.content = el.innerHTML;
    // Table, columns, details sync via blur events on individual cells — skip here
  };

  proto._emitChange = function () {
    if (typeof this.onChange === 'function') this.onChange();
  };

  // ================================================================
  // RENDERING
  // ================================================================
  proto._render = function () {
    var self = this;
    this.container.innerHTML = '';
    var numberedCounter = 0;

    this.blocks.forEach(function (block, idx) {
      if (block.type === 'numbered') { numberedCounter++; } else { numberedCounter = 0; }

      var wrapper = document.createElement('div');
      wrapper.className = 'ek-block';
      wrapper.dataset.type = block.type;
      wrapper.dataset.id = block.id;
      if (block.variant) wrapper.dataset.variant = block.variant;

      // Drag handle
      var handle = document.createElement('div');
      handle.className = 'ek-block-handle';
      handle.innerHTML = '⋮⋮';
      handle.title = 'Přetáhni blok';
      wrapper.appendChild(handle);

      // Content
      var content = document.createElement('div');
      content.className = 'ek-block-content';

      if (block.type === 'divider') {
        content.contentEditable = 'false';
      } else if (block.type === 'table') {
        content.contentEditable = 'false';
        content.innerHTML = self._renderTableBlock(block);
        self._attachTableEvents(block, content);
      } else if (block.type === 'columns') {
        content.contentEditable = 'false';
        content.innerHTML = self._renderColumnsBlock(block);
        self._attachColumnsEvents(block, content);
      } else if (block.type === 'details') {
        content.contentEditable = 'false';
        content.innerHTML = self._renderDetailsBlock(block);
        self._attachDetailsEvents(block, content);
      } else if (block.type === 'confirm') {
        content.contentEditable = 'false';
        content.innerHTML = '✅ Potvrzení přečtení — widget se vloží automaticky';
      } else if (block.type === 'quiz') {
        content.contentEditable = 'false';
        content.innerHTML = '❓ Kvíz — widget se vloží automaticky';
      } else {
        content.contentEditable = 'true';
        content.innerHTML = block.content || '';
        // Placeholders — subtle, only contextual hints
        if (!block.content) {
          if (idx === 0 && block.type === 'h1') {
            content.dataset.placeholder = 'Název dokumentu...';
          } else if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
            content.dataset.placeholder = 'Nadpis...';
          } else if (block.type === 'callout') {
            content.dataset.placeholder = 'Text zvýraznění...';
          } else if (block.type === 'code') {
            content.dataset.placeholder = 'Kód...';
          } else if (block.type === 'blockquote') {
            content.dataset.placeholder = 'Citace...';
          } else if (block.type === 'table') {
            // no placeholder for table
          } else {
            // Only the last block shows a subtle hint; others are blank
            if (idx === self.blocks.length - 1) {
              content.dataset.placeholder = '/';
            }
            // Intermediate empty paragraphs: no placeholder at all
          }
        }
      }

      // Numbered list index display
      if (block.type === 'numbered') {
        content.dataset.num = numberedCounter + '.';
      }

      wrapper.appendChild(content);
      self.container.appendChild(wrapper);
    });

    this._attachBlockEvents();
  };

  // ================================================================
  // BLOCK EVENTS
  // ================================================================
  proto._attachBlockEvents = function () {
    var self = this;
    this.container.querySelectorAll('.ek-block-content[contenteditable="true"]').forEach(function (el) {
      el.addEventListener('keydown', function (e) { self._onBlockKeydown(e); });
      el.addEventListener('input', function (e) { self._onBlockInput(e); });
      el.addEventListener('blur', function (e) {
        var blockEl = e.target.closest('.ek-block');
        if (blockEl) self._syncContent(blockEl.dataset.id);
      });
    });
  };

  proto._isSlashMenuOpen = function () {
    return this._slashMenu && this._slashMenu.classList.contains('visible');
  };

  proto._onBlockKeydown = function (e) {
    var blockEl = e.target.closest('.ek-block');
    if (!blockEl) return;
    var blockId = blockEl.dataset.id;
    var block = this._findBlock(blockId);
    if (!block) return;

    // Slash menu open → let it handle navigation keys
    if (this._isSlashMenuOpen()) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
        return;
      }
    }

    // Enter → new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this._syncContent(blockId);

      var newType = 'paragraph';
      if (block.type === 'bullet') newType = 'bullet';
      if (block.type === 'numbered') newType = 'numbered';

      // Empty list item → convert to paragraph
      if ((block.type === 'bullet' || block.type === 'numbered') && !e.target.textContent.trim()) {
        block.type = 'paragraph';
        block.content = '';
        this._render();
        this._focusBlock(blockId);
        return;
      }

      // Split block at cursor if cursor is in the middle
      var sel = window.getSelection();
      if (sel.rangeCount) {
        var range = sel.getRangeAt(0);
        // Get text after cursor
        var afterRange = range.cloneRange();
        afterRange.selectNodeContents(e.target);
        afterRange.setStart(range.endContainer, range.endOffset);
        var fragment = afterRange.extractContents();
        var tmp = document.createElement('div');
        tmp.appendChild(fragment);
        var afterHtml = tmp.innerHTML;

        // Update current block (text before cursor)
        this._syncContent(blockId);

        // New block with text after cursor
        this._addBlockAfter(blockId, newType, afterHtml);
      } else {
        this._addBlockAfter(blockId, newType, '');
      }
      return;
    }

    // Backspace at start
    if (e.key === 'Backspace') {
      var sel = window.getSelection();
      if (sel.isCollapsed && sel.anchorOffset === 0) {
        var idx = this._findBlockIndex(blockId);
        if (block.type !== 'paragraph') {
          e.preventDefault();
          this._syncContent(blockId);
          block.type = 'paragraph';
          this._render();
          this._focusBlock(blockId);
        } else if (idx > 0) {
          e.preventDefault();
          this._syncContent(blockId);
          var prev = this.blocks[idx - 1];
          if (prev.type === 'divider' || prev.type === 'confirm' || prev.type === 'quiz') {
            // Remove non-editable block above
            this.blocks.splice(idx - 1, 1);
            this._render();
            this._focusBlock(blockId);
          } else {
            var prevLen = (prev.content || '').length;
            prev.content = (prev.content || '') + (block.content || '');
            this.blocks.splice(idx, 1);
            this._render();
            this._focusBlock(prev.id, 'end');
          }
        }
        this._emitChange();
      }
    }

    // Arrow navigation between blocks
    if (e.key === 'ArrowUp') {
      var idx = this._findBlockIndex(blockId);
      if (idx > 0) {
        var sel = window.getSelection();
        if (sel.isCollapsed && sel.anchorOffset === 0) {
          e.preventDefault();
          this._focusBlock(this.blocks[idx - 1].id, 'end');
        }
      }
    }
    if (e.key === 'ArrowDown') {
      var idx = this._findBlockIndex(blockId);
      if (idx < this.blocks.length - 1) {
        var sel = window.getSelection();
        if (sel.isCollapsed && sel.anchorOffset >= (e.target.textContent || '').length) {
          e.preventDefault();
          this._focusBlock(this.blocks[idx + 1].id);
        }
      }
    }

    // Tab → convert paragraph to bullet
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (block.type === 'paragraph') {
        this._syncContent(blockId);
        block.type = 'bullet';
        this._render();
        this._focusBlock(blockId, 'end');
        this._emitChange();
      }
    }
    // Shift+Tab → convert bullet/numbered back to paragraph
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if (block.type === 'bullet' || block.type === 'numbered') {
        this._syncContent(blockId);
        block.type = 'paragraph';
        this._render();
        this._focusBlock(blockId, 'end');
        this._emitChange();
      }
    }

    // Ctrl+B / Ctrl+I / Ctrl+E
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); this._wrapSelection('code'); }

    // Ctrl+S → save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (typeof this.onSave === 'function') this.onSave();
    }
  };

  proto._onBlockInput = function (e) {
    var blockEl = e.target.closest('.ek-block');
    if (!blockEl) return;
    var blockId = blockEl.dataset.id;
    var block = this._findBlock(blockId);
    var text = e.target.textContent;

    // Detect slash at start of block
    if (text.startsWith('/')) {
      this._showSlashMenu(blockId, text.slice(1));
    } else {
      this._hideSlashMenu();
    }

    // Markdown shortcuts — only on paragraph blocks
    if (block && block.type === 'paragraph') {
      var converted = this._checkMarkdownShortcut(text);
      if (converted) {
        block.type = converted.type;
        block.content = converted.content || '';
        if (converted.variant) block.variant = converted.variant;
        this._render();
        this._focusBlock(blockId, converted.content ? 'end' : undefined);
        this._emitChange();
        return;
      }
    }

    this._emitChange();
  };

  /**
   * Check if the typed text triggers a markdown shortcut.
   * Returns { type, content, variant? } or null.
   */
  proto._checkMarkdownShortcut = function (text) {
    // "- " or "* " → bullet
    if (/^[-*]\s$/.test(text)) return { type: 'bullet', content: '' };
    // "1. " → numbered
    if (/^\d+\.\s$/.test(text)) return { type: 'numbered', content: '' };
    // "# " → h1
    if (text === '# ') return { type: 'h1', content: '' };
    // "## " → h2
    if (text === '## ') return { type: 'h2', content: '' };
    // "### " → h3
    if (text === '### ') return { type: 'h3', content: '' };
    // "> " → blockquote
    if (text === '> ') return { type: 'blockquote', content: '' };
    // "---" → divider (no trailing space needed)
    if (/^-{3,}$/.test(text)) return { type: 'divider', content: '' };
    // "```" → code block
    if (text === '```') return { type: 'code', content: '' };
    return null;
  };

  // ================================================================
  // SLASH MENU
  // ================================================================
  proto._createSlashMenu = function () {
    var menu = document.createElement('div');
    menu.className = 'slash-menu';
    menu.innerHTML = '<div class="slash-menu-search"><input placeholder="Hledat příkaz..." autocomplete="off"></div>' +
      '<div class="slash-menu-items"></div>';
    document.body.appendChild(menu);
    this._slashMenu = menu;

    // Filter on search input
    var self = this;
    menu.querySelector('input').addEventListener('input', function () {
      self._filterSlashItems(this.value);
    });
  };

  proto._getAllSlashItems = function () {
    var all = [];
    SLASH_COMMANDS.forEach(function (g) {
      g.items.forEach(function (item) {
        all.push({ group: g.group, cmd: item.cmd, alias: item.alias || '', icon: item.icon,
          label: item.label, desc: item.desc, type: item.type, variant: item.variant, lang: item.lang });
      });
    });
    return all;
  };

  proto._showSlashMenu = function (blockId, query) {
    this._slashBlockId = blockId;
    var contentEl = this._getContentEl(blockId);
    if (!contentEl) return;

    var rect = contentEl.getBoundingClientRect();
    this._slashMenu.style.left = rect.left + 'px';
    this._slashMenu.style.top = (rect.bottom + 4) + 'px';

    this._filterSlashItems(query || '');
    this._slashMenu.classList.add('visible');

    document.addEventListener('keydown', this._slashKeyHandler, true);
  };

  proto._hideSlashMenu = function () {
    if (!this._slashMenu) return;
    this._slashMenu.classList.remove('visible');
    this._slashBlockId = null;
    document.removeEventListener('keydown', this._slashKeyHandler, true);
  };

  proto._filterSlashItems = function (query) {
    var allItems = this._getAllSlashItems();
    var q = (query || '').toLowerCase();
    this._slashFilteredItems = allItems.filter(function (item) {
      return item.cmd.includes(q) || item.label.toLowerCase().includes(q) || (item.alias && item.alias.includes(q));
    });
    this._slashSelectedIdx = 0;
    this._renderSlashItems();
  };

  proto._renderSlashItems = function () {
    var container = this._slashMenu.querySelector('.slash-menu-items');
    container.innerHTML = '';
    var currentGroup = '';
    var self = this;

    if (this._slashFilteredItems.length === 0) {
      container.innerHTML = '<div style="padding:0.8rem;color:#64748b;font-size:0.85rem;text-align:center">Žádný příkaz nenalezen</div>';
      return;
    }

    this._slashFilteredItems.forEach(function (item, idx) {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        var groupEl = document.createElement('div');
        groupEl.className = 'slash-menu-group-label';
        groupEl.textContent = currentGroup;
        container.appendChild(groupEl);
      }
      var el = document.createElement('div');
      el.className = 'slash-menu-item' + (idx === self._slashSelectedIdx ? ' selected' : '');
      el.innerHTML = '<span class="item-icon">' + item.icon + '</span>' +
        '<span><span class="item-label">' + item.label + '</span> <span class="item-desc">' + item.desc + '</span></span>';
      el.addEventListener('mousedown', function (e) { e.preventDefault(); self._executeSlashCommand(item); });
      container.appendChild(el);
    });
  };

  proto._handleSlashKey = function (e) {
    if (!this._isSlashMenuOpen()) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation();
      this._slashSelectedIdx = Math.min(this._slashSelectedIdx + 1, this._slashFilteredItems.length - 1);
      this._renderSlashItems();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      this._slashSelectedIdx = Math.max(this._slashSelectedIdx - 1, 0);
      this._renderSlashItems();
    } else if (e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (this._slashFilteredItems[this._slashSelectedIdx]) {
        this._executeSlashCommand(this._slashFilteredItems[this._slashSelectedIdx]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      this._hideSlashMenu();
      // Restore the block content (remove the / text)
      var block = this._findBlock(this._slashBlockId);
      if (block) {
        block.content = '';
        this._render();
        this._focusBlock(block.id);
      }
    }
  };

  proto._executeSlashCommand = function (item) {
    var blockId = this._slashBlockId;
    this._hideSlashMenu();
    var block = this._findBlock(blockId);
    if (!block) return;

    // Clear the slash text from DOM immediately
    var contentEl = this._getContentEl(blockId);
    if (contentEl) contentEl.innerHTML = '';

    block.type = item.type;
    block.content = '';
    delete block.variant;
    delete block.lang;
    if (item.variant) block.variant = item.variant;
    if (item.lang) block.lang = item.lang;

    // Table → initialize default structure
    if (item.type === 'table') {
      block.rows = [['', '', ''], ['', '', '']];
      block.header = ['Sloupec 1', 'Sloupec 2', 'Sloupec 3'];
    }

    // Columns → initialize empty columns
    if (item.type === 'columns') {
      var n = parseInt(item.variant) || 2;
      block.cols = [];
      for (var ci = 0; ci < n; ci++) block.cols.push('');
    }

    // Details → initialize with title and content
    if (item.type === 'details') {
      block.summary = 'Klikni pro zobrazení';
      block.detailsContent = '';
    }

    // Non-editable blocks → add empty paragraph after
    if (item.type === 'divider' || item.type === 'confirm' || item.type === 'quiz' || item.type === 'table' || item.type === 'columns' || item.type === 'details') {
      var idx = this._findBlockIndex(blockId);
      if (idx === this.blocks.length - 1) {
        this.blocks.push(this._createBlock('paragraph', ''));
      }
      this._render();
      this._focusBlock(this.blocks[this._findBlockIndex(blockId) + 1].id);
    } else {
      this._render();
      this._focusBlock(blockId);
    }
    this._emitChange();
  };

  // ================================================================
  // FORMAT TOOLBAR
  // ================================================================
  proto._createFormatToolbar = function () {
    var toolbar = document.createElement('div');
    toolbar.className = 'format-toolbar';
    toolbar.innerHTML =
      // Inline formatting
      '<button class="format-btn" data-cmd="bold" title="Tučné (Ctrl+B)"><b>B</b></button>' +
      '<button class="format-btn" data-cmd="italic" title="Kurzíva (Ctrl+I)"><i>I</i></button>' +
      '<button class="format-btn" data-cmd="strikethrough" title="Přeškrtnuté"><s>S</s></button>' +
      '<button class="format-btn" data-cmd="code" title="Kód (Ctrl+E)"><code>&lt;&gt;</code></button>' +
      '<button class="format-btn" data-cmd="link" title="Odkaz (Ctrl+K)">🔗</button>' +
      '<span class="format-sep"></span>' +
      // Block type conversion
      '<button class="format-btn" data-block="h1" title="Nadpis 1">H₁</button>' +
      '<button class="format-btn" data-block="h2" title="Nadpis 2">H₂</button>' +
      '<button class="format-btn" data-block="h3" title="Nadpis 3">H₃</button>' +
      '<button class="format-btn" data-block="paragraph" title="Odstavec">¶</button>' +
      '<span class="format-sep"></span>' +
      '<button class="format-btn" data-block="bullet" title="Odrážkový seznam">•</button>' +
      '<button class="format-btn" data-block="numbered" title="Číslovaný seznam">1.</button>' +
      '<button class="format-btn" data-block="blockquote" title="Citace">❝</button>' +
      '<button class="format-btn" data-block="code" title="Blok kódu">{ }</button>';
    document.body.appendChild(toolbar);
    this._formatToolbar = toolbar;

    var self = this;
    toolbar.querySelectorAll('.format-btn').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var cmd = btn.dataset.cmd;
        var blockType = btn.dataset.block;

        if (cmd) {
          // Inline format commands
          if (cmd === 'bold') document.execCommand('bold');
          else if (cmd === 'italic') document.execCommand('italic');
          else if (cmd === 'strikethrough') document.execCommand('strikeThrough');
          else if (cmd === 'code') self._wrapSelection('code');
          else if (cmd === 'link') {
            var url = prompt('URL odkazu:');
            if (url) document.execCommand('createLink', false, url);
          }
        } else if (blockType) {
          // Block type conversion
          self._convertSelectedBlock(blockType);
        }
      });
    });
  };

  proto._convertSelectedBlock = function (newType) {
    var sel = window.getSelection();
    if (!sel.anchorNode) return;
    var el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
    if (!el) return;
    var blockEl = el.closest('.ek-block');
    if (!blockEl) return;
    var blockId = blockEl.dataset.id;
    var block = this._findBlock(blockId);
    if (!block) return;
    this._syncContent(blockId);
    block.type = newType;
    this._render();
    this._focusBlock(blockId, 'end');
    this._emitChange();
  };

  proto._attachSelectionListener = function () {
    var self = this;
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      if (!self._formatToolbar) return;
      if (!sel.rangeCount || sel.isCollapsed) { self._formatToolbar.classList.remove('visible'); return; }

      var anchor = sel.anchorNode;
      if (!anchor) return;
      var el = anchor.nodeType === 3 ? anchor.parentElement : anchor;
      if (!el || !el.closest || !el.closest('.ek-block-content')) {
        self._formatToolbar.classList.remove('visible');
        return;
      }

      var range = sel.getRangeAt(0);
      var rect = range.getBoundingClientRect();
      if (rect.width === 0) { self._formatToolbar.classList.remove('visible'); return; }
      self._formatToolbar.style.left = Math.max(8, rect.left + rect.width / 2 - 220) + 'px';
      self._formatToolbar.style.top = (rect.top - 44) + 'px';
      self._formatToolbar.classList.add('visible');
    });
  };

  proto._wrapSelection = function (tag) {
    var sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var el = document.createElement(tag);
    try { range.surroundContents(el); } catch (e) { /* cross-node selection */ }
  };

  // ================================================================
  // TABLE BLOCK
  // ================================================================
  proto._renderTableBlock = function (block) {
    if (!block.header) block.header = ['Sloupec 1', 'Sloupec 2', 'Sloupec 3'];
    if (!block.rows) block.rows = [['', '', '']];
    var cols = block.header.length;
    var html = '<table class="ek-table" cellspacing="0">';
    html += '<thead><tr>';
    block.header.forEach(function (h, ci) {
      html += '<th contenteditable="true" data-col="' + ci + '">' + (h || '') + '</th>';
    });
    html += '<th class="ek-table-add-col" title="Přidat sloupec">+</th>';
    html += '</tr></thead><tbody>';
    block.rows.forEach(function (row, ri) {
      html += '<tr>';
      for (var ci = 0; ci < cols; ci++) {
        html += '<td contenteditable="true" data-row="' + ri + '" data-col="' + ci + '">' + (row[ci] || '') + '</td>';
      }
      html += '<td class="ek-table-row-del" data-row="' + ri + '" title="Smazat řádek">&times;</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '<div class="ek-table-add-row" title="Přidat řádek">+ řádek</div>';
    return html;
  };

  proto._attachTableEvents = function (block, containerEl) {
    var self = this;
    // Sync cell edits
    containerEl.querySelectorAll('th[contenteditable], td[contenteditable]').forEach(function (cell) {
      cell.addEventListener('blur', function () {
        var ri = cell.dataset.row;
        var ci = parseInt(cell.dataset.col);
        if (ri !== undefined && ri !== '') {
          block.rows[parseInt(ri)][ci] = cell.textContent;
        } else if (cell.tagName === 'TH') {
          block.header[ci] = cell.textContent;
        }
        self._emitChange();
      });
      // Tab navigation within table
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          var next = e.shiftKey ? cell.previousElementSibling : cell.nextElementSibling;
          if (next && next.contentEditable === 'true') next.focus();
        }
        if (e.key === 'Enter') { e.preventDefault(); }
      });
    });
    // Add row
    var addRowBtn = containerEl.querySelector('.ek-table-add-row');
    if (addRowBtn) addRowBtn.addEventListener('click', function () {
      var newRow = [];
      for (var i = 0; i < block.header.length; i++) newRow.push('');
      block.rows.push(newRow);
      containerEl.innerHTML = self._renderTableBlock(block);
      self._attachTableEvents(block, containerEl);
      self._emitChange();
    });
    // Add column
    var addColBtn = containerEl.querySelector('.ek-table-add-col');
    if (addColBtn) addColBtn.addEventListener('click', function () {
      block.header.push('Sloupec ' + (block.header.length + 1));
      block.rows.forEach(function (row) { row.push(''); });
      containerEl.innerHTML = self._renderTableBlock(block);
      self._attachTableEvents(block, containerEl);
      self._emitChange();
    });
    // Delete row
    containerEl.querySelectorAll('.ek-table-row-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ri = parseInt(btn.dataset.row);
        if (block.rows.length <= 1) return; // keep at least one row
        block.rows.splice(ri, 1);
        containerEl.innerHTML = self._renderTableBlock(block);
        self._attachTableEvents(block, containerEl);
        self._emitChange();
      });
    });
  };

  // ================================================================
  // COLUMNS BLOCK
  // ================================================================
  proto._renderColumnsBlock = function (block) {
    var n = (block.cols || []).length || 2;
    var html = '<div class="ek-columns ek-columns-' + n + '">';
    for (var i = 0; i < n; i++) {
      html += '<div class="ek-column" contenteditable="true" data-col="' + i + '"' +
        ' data-placeholder="Sloupec ' + (i + 1) + '...">' + (block.cols[i] || '') + '</div>';
    }
    html += '</div>';
    return html;
  };

  proto._attachColumnsEvents = function (block, containerEl) {
    var self = this;
    containerEl.querySelectorAll('.ek-column[contenteditable]').forEach(function (col) {
      col.addEventListener('blur', function () {
        var ci = parseInt(col.dataset.col);
        block.cols[ci] = col.innerHTML;
        self._emitChange();
      });
      col.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          var next = e.shiftKey ? col.previousElementSibling : col.nextElementSibling;
          if (next && next.contentEditable === 'true') next.focus();
        }
      });
    });
  };

  // ================================================================
  // DETAILS (COLLAPSIBLE) BLOCK
  // ================================================================
  proto._renderDetailsBlock = function (block) {
    var html = '<details class="ek-details" open>';
    html += '<summary contenteditable="true" class="ek-details-summary" data-placeholder="Nadpis...">' +
      (block.summary || '') + '</summary>';
    html += '<div class="ek-details-body" contenteditable="true" data-placeholder="Skrytý obsah...">' +
      (block.detailsContent || '') + '</div>';
    html += '</details>';
    return html;
  };

  proto._attachDetailsEvents = function (block, containerEl) {
    var self = this;
    var summary = containerEl.querySelector('.ek-details-summary');
    var body = containerEl.querySelector('.ek-details-body');
    if (summary) {
      summary.addEventListener('blur', function () {
        block.summary = summary.textContent;
        self._emitChange();
      });
      summary.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); if (body) body.focus(); }
      });
    }
    if (body) {
      body.addEventListener('blur', function () {
        block.detailsContent = body.innerHTML;
        self._emitChange();
      });
    }
  };

  // ================================================================
  // MARKDOWN HELPERS
  // ================================================================
  proto._htmlToMd = function (html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('b, strong').forEach(function (el) { el.replaceWith('**' + el.textContent + '**'); });
    tmp.querySelectorAll('i, em').forEach(function (el) { el.replaceWith('*' + el.textContent + '*'); });
    tmp.querySelectorAll('s, strike, del').forEach(function (el) { el.replaceWith('~~' + el.textContent + '~~'); });
    tmp.querySelectorAll('code').forEach(function (el) { el.replaceWith('`' + el.textContent + '`'); });
    tmp.querySelectorAll('a').forEach(function (el) { el.replaceWith('[' + el.textContent + '](' + (el.getAttribute('href') || '') + ')'); });
    tmp.querySelectorAll('br').forEach(function (el) { el.replaceWith('\n'); });
    return tmp.textContent.trim();
  };

  proto._mdInlineToHtml = function (text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  };

  // ================================================================
  // EXPOSE
  // ================================================================
  root.BlockEditor = BlockEditor;
  root.BLOCK_EDITOR_COMMANDS = SLASH_COMMANDS;

})(window);
