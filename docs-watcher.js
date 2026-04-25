/**
 * docs-watcher.js — Auto-invalidace Docusaurus cache při změně struktury docs/
 * ==============================================================================
 *
 * Sleduje docs/ přes chokidar. Když se přidá/smaže/přesune soubor nebo složka,
 * automaticky smaže .docusaurus/ cache a restartuje Docusaurus dev server.
 *
 * Použití v server.js:
 *
 *   const { startWatcher } = require('./docs-watcher');
 *   const watcher = startWatcher({
 *     docsDir: path.join(__dirname, 'docs'),
 *     docusaurusDir: __dirname,
 *     devServerPort: 3001,
 *     onRestart: () => console.log('Dev server restartuje...'),
 *     onReady: () => console.log('Dev server je zpět!'),
 *   });
 *
 * Exportuje:
 *   startWatcher(options)  — spustí sledování, vrátí objekt s .close(), .rebuild(), .getStatus()
 */

const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Stav
// ---------------------------------------------------------------------------
let docusaurusProcess = null;
let rebuildTimer = null;
let isRebuilding = false;
let config = {};

// ---------------------------------------------------------------------------
// Lifecycle Docusaurus dev serveru
// ---------------------------------------------------------------------------

function clearDocusaurusCache() {
  const cacheDir = path.join(config.docusaurusDir, '.docusaurus');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('[docs-watcher] ✓ .docusaurus/ cache smazána');
  }
}

function killDevServer() {
  return new Promise((resolve) => {
    if (!docusaurusProcess) {
      resolve();
      return;
    }

    console.log('[docs-watcher] Zastavuji Docusaurus dev server...');

    const killTimeout = setTimeout(() => {
      if (docusaurusProcess) {
        console.log('[docs-watcher] SIGKILL — dev server nereagoval na SIGTERM');
        try { docusaurusProcess.kill('SIGKILL'); } catch (e) { /* already dead */ }
      }
      docusaurusProcess = null;
      resolve();
    }, 8000);

    docusaurusProcess.once('exit', () => {
      clearTimeout(killTimeout);
      docusaurusProcess = null;
      resolve();
    });

    try { docusaurusProcess.kill('SIGTERM'); } catch (e) { resolve(); }
  });
}

function startDevServer() {
  return new Promise((resolve) => {
    const port = config.devServerPort || 3001;

    console.log(`[docs-watcher] Spouštím Docusaurus dev server na portu ${port}...`);

    docusaurusProcess = spawn(
      'npx',
      ['docusaurus', 'start', '--host', '0.0.0.0', '--port', String(port), '--no-open'],
      {
        cwd: config.docusaurusDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, BROWSER: 'none' },
      }
    );

    let resolved = false;

    const onData = (data) => {
      const line = data.toString();

      if (!resolved && (
        line.includes('running at') ||
        line.includes('compiled successfully') ||
        line.includes('webpack compiled') ||
        line.includes('ready in')
      )) {
        resolved = true;
        console.log('[docs-watcher] ✓ Docusaurus dev server je ready');
        if (config.onReady) config.onReady();
        resolve();
      }

      const trimmed = line.trim();
      if (trimmed && !trimmed.includes('DeprecationWarning')) {
        console.log(`[docusaurus] ${trimmed.substring(0, 300)}`);
      }
    };

    docusaurusProcess.stdout.on('data', onData);
    docusaurusProcess.stderr.on('data', onData);

    docusaurusProcess.on('error', (err) => {
      console.error('[docs-watcher] ✗ Chyba při spuštění dev serveru:', err.message);
      if (!resolved) { resolved = true; resolve(); }
    });

    docusaurusProcess.on('exit', (code, signal) => {
      console.log(`[docs-watcher] Dev server ukončen (code: ${code}, signal: ${signal})`);
      docusaurusProcess = null;
      if (!resolved) { resolved = true; resolve(); }
    });

    // Safety timeout — 120s
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('[docs-watcher] ⚠ Dev server timeout 120s — pokračuji');
        resolve();
      }
    }, 120000);
  });
}

// ---------------------------------------------------------------------------
// Rebuild logika
// ---------------------------------------------------------------------------

async function doRebuild(reason) {
  if (isRebuilding) {
    console.log('[docs-watcher] Rebuild už běží, přeskakuji...');
    return { ok: false, reason: 'already_rebuilding' };
  }

  isRebuilding = true;
  const startTime = Date.now();
  console.log(`[docs-watcher] === REBUILD START (důvod: ${reason}) ===`);

  if (config.onRestart) config.onRestart();

  try {
    await killDevServer();
    clearDocusaurusCache();
    await startDevServer();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[docs-watcher] === REBUILD HOTOVO (${elapsed}s) ===`);
    return { ok: true, elapsed };
  } catch (err) {
    console.error('[docs-watcher] ✗ Rebuild selhal:', err.message);
    return { ok: false, error: err.message };
  } finally {
    isRebuilding = false;
  }
}

function scheduleRebuild(reason) {
  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
  }

  console.log(`[docs-watcher] Změna detekována: ${reason}`);
  console.log('[docs-watcher] Čekám 2s na další změny...');

  rebuildTimer = setTimeout(() => {
    rebuildTimer = null;
    doRebuild(reason);
  }, 2000);
}

// ---------------------------------------------------------------------------
// Filtr — co sledovat
// ---------------------------------------------------------------------------

function isStructuralChange(filePath) {
  const basename = path.basename(filePath);

  // Ignorovat systémové a dočasné soubory
  if (
    basename === '.DS_Store' ||
    basename === 'Thumbs.db' ||
    filePath.includes('@eaDir') ||
    filePath.includes('.docusaurus') ||
    filePath.includes('_system_hidden') ||
    basename.startsWith('.') ||
    basename.endsWith('~') ||
    basename.endsWith('.swp') ||
    basename.endsWith('.tmp')
  ) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Veřejné API
// ---------------------------------------------------------------------------

function startWatcher(options) {
  config = {
    docsDir: options.docsDir,
    docusaurusDir: options.docusaurusDir || path.dirname(options.docsDir),
    devServerPort: options.devServerPort || 3001,
    onRestart: options.onRestart || null,
    onReady: options.onReady || null,
  };

  console.log('[docs-watcher] Spouštím sledování:', config.docsDir);

  // Krok 1: Spustit Docusaurus dev server
  startDevServer().then(() => {
    console.log('[docs-watcher] Počáteční start dev serveru dokončen');
  }).catch((err) => {
    console.error('[docs-watcher] Počáteční start selhal:', err.message);
  });

  // Krok 2: Spustit file watcher
  const watcher = chokidar.watch(config.docsDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
    ignored: [
      /(^|[\/\\])\../,
      '**/node_modules/**',
      '**/@eaDir/**',
      '**/.docusaurus/**',
      '**/_system_hidden/**',
    ],
  });

  // Nový soubor
  watcher.on('add', (filePath) => {
    if (isStructuralChange(filePath)) {
      scheduleRebuild(`nový soubor: ${path.relative(config.docsDir, filePath)}`);
    }
  });

  // Smazaný soubor
  watcher.on('unlink', (filePath) => {
    if (isStructuralChange(filePath)) {
      scheduleRebuild(`smazán soubor: ${path.relative(config.docsDir, filePath)}`);
    }
  });

  // Nová složka
  watcher.on('addDir', (dirPath) => {
    if (dirPath !== config.docsDir && isStructuralChange(dirPath)) {
      scheduleRebuild(`nová složka: ${path.relative(config.docsDir, dirPath)}`);
    }
  });

  // Smazaná složka
  watcher.on('unlinkDir', (dirPath) => {
    if (isStructuralChange(dirPath)) {
      scheduleRebuild(`smazána složka: ${path.relative(config.docsDir, dirPath)}`);
    }
  });

  // Změna obsahu — jen _category_.json triggeruje rebuild
  watcher.on('change', (filePath) => {
    const basename = path.basename(filePath);
    if (basename === '_category_.json') {
      scheduleRebuild(`změněn config: ${path.relative(config.docsDir, filePath)}`);
    }
    // Změny .md souborů NE-triggerují rebuild — hot-reload je zvládne
  });

  watcher.on('error', (err) => {
    console.error('[docs-watcher] Chyba watcheru:', err.message);
  });

  watcher.on('ready', () => {
    console.log('[docs-watcher] ✓ Watcher ready — sleduji docs/ pro strukturální změny');
  });

  return {
    close: async () => {
      if (rebuildTimer) clearTimeout(rebuildTimer);
      await watcher.close();
      await killDevServer();
      console.log('[docs-watcher] Watcher ukončen');
    },

    rebuild: (reason = 'manuální') => {
      return doRebuild(reason);
    },

    getStatus: () => ({
      isRebuilding,
      devServerRunning: docusaurusProcess !== null,
      devServerPort: config.devServerPort,
    }),
  };
}

module.exports = { startWatcher };
