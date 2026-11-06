// Bulk-delete library UI against the GitHub-backed Asset Studio without staging real deletions.
// Run: node tools/e2e-studio-bulk-delete.cjs (needs Playwright + Chromium)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), context = await browser.newContext({ viewport: { width: 1700, height: 950 } }), p = await context.newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  try {
    await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000);
    await p.locator('select').first().selectOption('library');
    await p.waitForFunction(() => typeof library === 'function' && typeof RepoDir === 'object' && !!document.querySelector('#bulkDeleteToggle'));
    const ui = await p.evaluate(() => {
      document.querySelector('#bulkDeleteToggle').click();
      const eligible = document.querySelectorAll('.bulk-check').length, locked = document.querySelectorAll('.bulk-ineligible').length;
      document.querySelector('#bulkSelectVisible').click();
      const selected = bulkDeleteSelected.size;
      document.querySelector('#bulkClear').click();
      return { eligible, locked, selected };
    });
    assert.ok(ui.eligible > 0, 'eligible old, retired, or loose files are shown');
    assert.ok(ui.locked > 0, 'active files are locked against bulk deletion');
    assert.ok(ui.selected > 0, 'select visible adds eligible files');
    console.log('ok bulk controls:', ui);

    const cancel = await p.evaluate(async () => {
      const item = library().find(x => bulkDeletable(x)); if (!item) throw Error('no deletable live GitHub item');
      const before = await RepoDir.count(), original = window.confirm;
      try {
        bulkDeleteSelected.add(item.path); render(); window.confirm = () => false;
        document.querySelector('#bulkDelete').click(); await new Promise(r => setTimeout(r, 100));
        return { before, after: await RepoDir.count(), selectionRetained: bulkDeleteSelected.has(item.path) };
      } finally { window.confirm = original; bulkDeleteSelected.clear(); render() }
    });
    assert.equal(cancel.after, cancel.before, 'cancel does not stage changes');
    assert.ok(cancel.selectionRetained, 'cancel keeps the selection available');
    console.log('ok cancel leaves GitHub staging untouched');

    const loose = await p.evaluate(async () => {
      const item = library().find(x => x.kind === 'loose'); if (!item) throw Error('no live loose file to exercise');
      const before = await RepoDir.count(), calls = [], originalRemove = removeFile, originalConfirm = window.confirm;
      try {
        removeFile = async path => calls.push(path); window.confirm = () => true;
        bulkDeleteMode = true; bulkDeleteSelected = new Set([item.path]); await deleteLibrarySelection();
        return { path: item.path, calls, before, after: await RepoDir.count() };
      } finally { removeFile = originalRemove; window.confirm = originalConfirm }
    });
    assert.deepEqual(loose.calls, [loose.path], 'confirmed loose-file deletion targets only the selected GitHub path');
    assert.equal(loose.after, loose.before, 'simulated deletion does not stage a real GitHub change');
    console.log('ok simulated loose-file deletion:', loose.path);

    const shared = await p.evaluate(async () => {
      const item = library().find(x => x.kind === 'version' && x.slot?.history?.some(h => h.file === x.path));
      if (!item) throw Error('no live version file to exercise shared-reference guard');
      const backup = JSON.parse(JSON.stringify(M)), calls = [], originalRemove = removeFile, originalSave = saveManifest, originalConfirm = window.confirm;
      const other = { id: '__e2e_shared_test__', status: 'unused', category: 'test', history: [{ file: item.path, at: 'test' }] };
      let retained = false, prompt = '';
      try {
        M.assets.push(other); removeFile = async path => calls.push(path); saveManifest = async () => {}; window.confirm = text => { prompt = text; return true };
        bulkDeleteMode = true; bulkDeleteSelected = new Set([item.path]); await deleteLibrarySelection();
        retained = M.assets.find(a => a.id === item.slot.id)?.history?.some(h => h.file === item.path) || false;
        return { path: item.path, calls, retained, prompt };
      } finally {
        removeFile = originalRemove; saveManifest = originalSave; window.confirm = originalConfirm;
        for (const key of Object.keys(M)) delete M[key]; Object.assign(M, backup); bulkDeleteMode = false; bulkDeleteSelected.clear(); render();
      }
    });
    assert.deepEqual(shared.calls, [], 'a path still referenced by another asset is not removed');
    assert.ok(shared.retained, 'deleting one version reference preserves the other reference');
    assert.match(shared.prompt, /ไม่มี — ไฟล์ยังถูกอ้างถึง/, 'confirmation explains why a shared file will stay');
    console.log('ok shared version reference is preserved');

    const retired = await p.evaluate(async () => {
      const item = library().find(x => x.kind === 'retired' && x.slot?.status === 'unused' && x.slot.file === x.path);
      if (!item) throw Error('no live retired asset to exercise');
      const backup = JSON.parse(JSON.stringify(M)), calls = [], originalRemove = removeFile, originalSave = saveManifest, originalConfirm = window.confirm;
      let removed = false, prompt = '';
      try {
        removeFile = async path => calls.push(path); saveManifest = async () => {}; window.confirm = text => { prompt = text; return true };
        bulkDeleteMode = true; bulkDeleteSelected = new Set([item.path]); await deleteLibrarySelection();
        removed = !M.assets.some(a => a.id === item.slot.id);
        return { assetId: item.slot.id, path: item.path, calls, removed, prompt };
      } finally {
        removeFile = originalRemove; saveManifest = originalSave; window.confirm = originalConfirm;
        for (const key of Object.keys(M)) delete M[key]; Object.assign(M, backup); bulkDeleteMode = false; bulkDeleteSelected.clear(); render();
      }
    });
    assert.ok(retired.removed, 'confirmed retired asset is removed from the manifest model');
    assert.ok(retired.prompt.includes(retired.path), 'confirmation lists files queued for deletion');
    console.log('ok retired asset confirmation lists the staged path');
    assert.deepEqual(errs, [], errs.join('|'));
    console.log('bulk-delete e2e: all cases passed');
  } finally { await browser.close(); server.close() }
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
