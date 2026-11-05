// v98.136 · an OLD manifest waiting to be pushed ("รอ Push") must not hide newer work on main, and must not overwrite it when pushed.
// Reproduces the report: staged manifest from before Sigrid's walk sets → the studio showed her walk as empty. Needs api.github.com (main's current manifest).
// Run: node tools/e2e-studio-stale-staged.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000);
  // stage an old manifest (no walk sets for Sigrid, an extra edit of my own) BEFORE connecting, exactly like a browser that saved yesterday
  await p.evaluate(async () => { const m = JSON.parse(JSON.stringify(ASSET_MANIFEST)); delete m.studioAllyWalks.sigrid; m.e2eMyOwnEdit = { at: 1 };
    const db = await new Promise(r => { const q = indexedDB.open('asset-studio', 1); q.onupgradeneeded = () => q.result.createObjectStore('kv'); q.onsuccess = () => r(q.result) });
    const put = (k, v) => new Promise(r => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = r });
    await put('repo-staged', [['data/asset-manifest.json', new Blob([JSON.stringify(m, null, 1)], { type: 'application/json' })], ['js/asset-manifest.js', new Blob(['window.ASSET_MANIFEST=' + JSON.stringify(m) + ';'], { type: 'text/javascript' })]]); await put('repo-staged-base', null) });
  await p.reload(); await p.waitForTimeout(2500);   // a fresh page reads the staged list from IndexedDB, like the next visit
  await p.click('#conn'); await p.waitForTimeout(11000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const e = StudioBrowser.state.model.find(x => x.id === 'ally:sigrid'), c = e.clips.find(c => c.action === 'walk' && c.view === 'SW'); return { n: c.frames.length, mine: !!ASSET_MANIFEST.e2eMyOwnEdit, note: RepoDir.lastRebase()?.note || null } });
  assert.ok(r.n > 1, 'Sigrid walk SW from main is shown (got ' + r.n + ' frames)'); assert.ok(r.mine, 'my own staged edit is kept'); assert.ok(r.note, 'a merge happened'); console.log('ok merged on open ·', r.note);
  // the staged manifest itself now contains both
  const st = await p.evaluate(async () => { const db = await new Promise(r => { const q = indexedDB.open('asset-studio', 1); q.onsuccess = () => r(q.result) }); const s = await new Promise(r => { const q = db.transaction('kv').objectStore('kv').get('repo-staged'); q.onsuccess = () => r(q.result) });
    const m = JSON.parse(await s.find(x => x[0] === 'data/asset-manifest.json')[1].text()); return { sigrid: !!m.studioAllyWalks?.sigrid?.SW, mine: !!m.e2eMyOwnEdit } });
  assert.deepEqual(st, { sigrid: true, mine: true }, 'what would be pushed keeps both');
  assert.deepEqual(errs, [], errs.join('|')); console.log('stale staged e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
