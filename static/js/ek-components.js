/**
 * Elektro Kutílek — Web Components pro Docusaurus
 * ================================================
 *
 * Tento soubor definuje tři custom HTML tagy:
 *
 *   <ek-ack-widget>        — potvrzení přečtení dokumentu
 *   <ek-quiz>              — mini kvíz s vícero otázkami
 *   <ek-decision-tree>     — rozhodovací strom s větvením
 *
 * Nasazení v Docusaurus:
 *   1. Zkopíruj soubor do static/js/ek-components.js
 *   2. V docusaurus.config.js přidej: scripts: ['/js/ek-components.js']
 *
 * Verze: 1.0 (demo) · Autor: Jan Kutílek
 */

(function () {
  'use strict';

  // ========================================================================
  //  1. <ek-ack-widget>
  // ========================================================================

  class EkAckWidget extends HTMLElement {
    connectedCallback() {
      const docId = this.getAttribute('doc-id') || 'unknown';
      const docTitle = this.getAttribute('doc-title') || 'Dokument';
      this.innerHTML = `
        <div class="ek-ack" style="
          border: 2px solid #1976D2;
          background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
          border-radius: 10px;
          padding: 18px 20px;
          margin: 20px 0;
          font-family: -apple-system, Segoe UI, Roboto, sans-serif;
        ">
          <div style="font-weight: 700; color: #0D47A1; font-size: 15px; margin-bottom: 10px;">
            📋 Potvrzení přečtení dokumentu
          </div>
          <div style="color: #1565C0; margin-bottom: 14px; font-size: 14px;">
            Dokument: <strong>${escapeHtml(docTitle)}</strong>
          </div>
          <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; color: #0D47A1;">
            <input type="checkbox" class="ek-ack-check" style="margin-top: 3px; transform: scale(1.2);">
            <span style="font-size: 13px;">
              Potvrzuji, že jsem si dokument přečetl(a) celý, rozumím mu a budu se jeho obsahem řídit.
            </span>
          </label>
          <button class="ek-ack-btn" disabled style="
            margin-top: 14px;
            background: #1976D2;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            opacity: 0.5;
            transition: all 0.2s;
          ">Potvrdit přečtení</button>
          <div class="ek-ack-result" style="margin-top: 14px; display: none;"></div>
        </div>
      `;

      const checkbox = this.querySelector('.ek-ack-check');
      const button = this.querySelector('.ek-ack-btn');
      const result = this.querySelector('.ek-ack-result');

      checkbox.addEventListener('change', () => {
        button.disabled = !checkbox.checked;
        button.style.opacity = checkbox.checked ? '1' : '0.5';
        button.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
      });

      button.addEventListener('click', () => {
        const timestamp = new Date().toLocaleString('cs-CZ');
        console.log('[EK-ACK]', { docId, docTitle, timestamp });

        // Odeslat do tracking API (pokud je reading-tracker aktivní)
        if (typeof window.__ekTrackConfirmation === 'function') {
          window.__ekTrackConfirmation(docId, docTitle);
        }

        result.style.display = 'block';
        result.innerHTML = `
          <div style="
            background: #C8E6C9;
            border: 1px solid #2E7D32;
            border-radius: 6px;
            padding: 10px 14px;
            color: #1B5E20;
            font-size: 13px;
            font-weight: 600;
          ">
            ✅ Potvrzeno: ${timestamp}
          </div>
        `;
        button.disabled = true;
        button.style.opacity = '0.4';
        button.style.background = '#78909C';
        checkbox.disabled = true;
      });
    }
  }

  // ========================================================================
  //  2. <ek-quiz>
  // ========================================================================

  class EkQuiz extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Kvíz';
      let questions = [];
      try {
        questions = JSON.parse(this.getAttribute('questions') || '[]');
      } catch (e) {
        this.innerHTML = `<div style="color:red">Chyba: nevalidní JSON v atributu questions</div>`;
        return;
      }

      const state = { current: 0, answers: [], finished: false };

      const render = () => {
        if (state.finished) {
          const correct = state.answers.filter((a, i) => a === questions[i].correct).length;
          const total = questions.length;
          const pct = Math.round((correct / total) * 100);

          // Odeslat do tracking API (pokud je reading-tracker aktivní)
          if (typeof window.__ekTrackQuiz === 'function') {
            window.__ekTrackQuiz(title, total, correct, pct);
          }
          const color = pct >= 80 ? '#2E7D32' : pct >= 50 ? '#F57C00' : '#C62828';
          const bg = pct >= 80 ? '#C8E6C9' : pct >= 50 ? '#FFE0B2' : '#FFCDD2';
          this.innerHTML = `
            <div style="
              border: 2px solid ${color};
              background: ${bg};
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              font-family: -apple-system, Segoe UI, Roboto, sans-serif;
              text-align: center;
            ">
              <div style="font-size: 18px; font-weight: 700; color: ${color}; margin-bottom: 10px;">
                🎯 ${escapeHtml(title)} — výsledek
              </div>
              <div style="font-size: 36px; font-weight: 800; color: ${color}; margin: 16px 0;">
                ${correct} / ${total}
              </div>
              <div style="font-size: 14px; color: ${color}; margin-bottom: 16px;">
                Úspěšnost: <strong>${pct} %</strong>
              </div>
              <button class="ek-quiz-restart" style="
                background: ${color};
                color: #fff;
                border: none;
                padding: 8px 18px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
              ">Zkusit znovu</button>
            </div>
          `;
          this.querySelector('.ek-quiz-restart').addEventListener('click', () => {
            state.current = 0;
            state.answers = [];
            state.finished = false;
            render();
          });
          return;
        }

        const q = questions[state.current];
        this.innerHTML = `
          <div style="
            border: 2px solid #F59E0B;
            background: #FFF8E1;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            font-family: -apple-system, Segoe UI, Roboto, sans-serif;
          ">
            <div style="font-size: 15px; font-weight: 700; color: #E65100; margin-bottom: 6px;">
              🎯 ${escapeHtml(title)}
            </div>
            <div style="font-size: 12px; color: #BF360C; margin-bottom: 14px;">
              Otázka ${state.current + 1} z ${questions.length}
            </div>
            <div style="font-size: 15px; color: #333; margin-bottom: 14px; font-weight: 600;">
              ${escapeHtml(q.q)}
            </div>
            <div class="ek-quiz-options" style="display: flex; flex-direction: column; gap: 8px;">
              ${q.options.map((opt, i) => `
                <button class="ek-quiz-opt" data-idx="${i}" style="
                  text-align: left;
                  background: #fff;
                  border: 2px solid #FFB74D;
                  padding: 10px 14px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  color: #333;
                  transition: all 0.15s;
                ">${escapeHtml(opt)}</button>
              `).join('')}
            </div>
          </div>
        `;
        this.querySelectorAll('.ek-quiz-opt').forEach(btn => {
          btn.addEventListener('mouseover', () => { btn.style.background = '#FFE0B2'; });
          btn.addEventListener('mouseout', () => { btn.style.background = '#fff'; });
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx, 10);
            state.answers.push(idx);
            if (state.current + 1 >= questions.length) {
              state.finished = true;
            } else {
              state.current += 1;
            }
            render();
          });
        });
      };

      render();
    }
  }

  // ========================================================================
  //  3. <ek-decision-tree>
  // ========================================================================

  class EkDecisionTree extends HTMLElement {
    connectedCallback() {
      const scriptEl = this.querySelector('script[type="application/json"]');
      if (!scriptEl) {
        this.innerHTML = `<div style="color:red">Chyba: decision-tree vyžaduje &lt;script type="application/json"&gt; uvnitř.</div>`;
        return;
      }
      let data;
      try {
        data = JSON.parse(scriptEl.textContent);
      } catch (e) {
        this.innerHTML = `<div style="color:red">Chyba: nevalidní JSON v decision-tree (${e.message})</div>`;
        return;
      }

      const state = { current: data.start, history: [] };

      const render = () => {
        const node = data.nodes[state.current];
        if (!node) {
          this.innerHTML = `<div style="color:red">Chyba: uzel "${state.current}" neexistuje.</div>`;
          return;
        }

        if (node.result !== undefined) {
          this.innerHTML = `
            <div style="
              border: 2px solid #10B981;
              background: #D1FAE5;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              font-family: -apple-system, Segoe UI, Roboto, sans-serif;
            ">
              <div style="font-size: 18px; font-weight: 700; color: #065F46; margin-bottom: 10px;">
                ${escapeHtml(node.result)}
              </div>
              <div style="font-size: 14px; color: #064E3B; margin-bottom: 14px; line-height: 1.5;">
                ${escapeHtml(node.text)}
              </div>
              <button class="ek-dt-restart" style="
                background: #10B981;
                color: #fff;
                border: none;
                padding: 8px 18px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
              ">Začít znovu</button>
              ${state.history.length > 0 ? `
                <button class="ek-dt-back" style="
                  background: transparent;
                  color: #10B981;
                  border: 1px solid #10B981;
                  padding: 8px 18px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 13px;
                  margin-left: 8px;
                ">← Zpět o krok</button>
              ` : ''}
            </div>
          `;
          this.querySelector('.ek-dt-restart').addEventListener('click', () => {
            state.current = data.start;
            state.history = [];
            render();
          });
          const backBtn = this.querySelector('.ek-dt-back');
          if (backBtn) backBtn.addEventListener('click', goBack);
          return;
        }

        this.innerHTML = `
          <div style="
            border: 2px solid #8B5CF6;
            background: #F5F3FF;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            font-family: -apple-system, Segoe UI, Roboto, sans-serif;
          ">
            <div style="font-size: 12px; color: #6D28D9; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
              🌳 Rozhodovací průvodce — krok ${state.history.length + 1}
            </div>
            <div style="font-size: 15px; color: #4C1D95; margin-bottom: 16px; font-weight: 600;">
              ${escapeHtml(node.q)}
            </div>
            <div class="ek-dt-options" style="display: flex; flex-direction: column; gap: 8px;">
              ${node.options.map((opt, i) => `
                <button class="ek-dt-opt" data-next="${escapeAttr(opt.next)}" style="
                  text-align: left;
                  background: #fff;
                  border: 2px solid #C4B5FD;
                  padding: 10px 14px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  color: #4C1D95;
                  transition: all 0.15s;
                  font-weight: 500;
                ">${escapeHtml(opt.label)}</button>
              `).join('')}
            </div>
            ${state.history.length > 0 ? `
              <button class="ek-dt-back" style="
                background: transparent;
                color: #8B5CF6;
                border: none;
                padding: 8px 0;
                margin-top: 12px;
                cursor: pointer;
                font-size: 12px;
              ">← Zpět o krok</button>
            ` : ''}
          </div>
        `;
        this.querySelectorAll('.ek-dt-opt').forEach(btn => {
          btn.addEventListener('mouseover', () => { btn.style.background = '#EDE9FE'; });
          btn.addEventListener('mouseout', () => { btn.style.background = '#fff'; });
          btn.addEventListener('click', () => {
            state.history.push(state.current);
            state.current = btn.dataset.next;
            render();
          });
        });
        const backBtn = this.querySelector('.ek-dt-back');
        if (backBtn) backBtn.addEventListener('click', goBack);
      };

      const goBack = () => {
        if (state.history.length > 0) {
          state.current = state.history.pop();
          render();
        }
      };

      render();
    }
  }

  // ========================================================================
  //  Helpers
  // ========================================================================

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  // ========================================================================
  //  Registrace
  // ========================================================================

  if (!customElements.get('ek-ack-widget')) {
    customElements.define('ek-ack-widget', EkAckWidget);
  }
  if (!customElements.get('ek-quiz')) {
    customElements.define('ek-quiz', EkQuiz);
  }
  if (!customElements.get('ek-decision-tree')) {
    customElements.define('ek-decision-tree', EkDecisionTree);
  }

  console.log('[EK Components] Registered: ek-ack-widget, ek-quiz, ek-decision-tree');
})();
