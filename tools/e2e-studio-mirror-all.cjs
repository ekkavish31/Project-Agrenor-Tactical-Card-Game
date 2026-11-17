// v98.115 · "ลอกกลับด้าน" must be offered for EVERY character / direction: the 5 recruits only had SW + NE standing pictures, so there was nothing to copy to. They now have empty SE / NW slots
// (+ walk placeholders); copying SW -> SE fills the empty slot and saves it.
// Run: node tools/e2e-studio-mirror-all.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  const views = await p.evaluate(() => Object.fromEntries(['ren', 'nadia', 'sigrid', 'orla', 'olwen', 'luna', 'bram', 'kier', 'mil'].map(k => { const e = StudioBrowser.state.model.find(x => x.id === 'ally:' + k); return [k, e ? ['idle', 'walk'].map(a => a + ':' + e.clips.filter(c => c.action === a).map(c => c.view).sort().join('/')).join(' ') : null] })));
  console.log(views); for (const k of ['ren', 'nadia', 'sigrid', 'orla', 'olwen']) assert.match(views[k], /idle:NE\/NW\/SE\/SW/, k + ' has all 4 standing directions');
  const id = await p.evaluate(() => StudioBrowser.state.model.find(x => x.id === 'ally:nadia').clips.find(c => c.action === 'idle' && c.view === 'SW').id);
  await p.evaluate(id => StudioUnifiedReview.open(id), id); await p.waitForTimeout(3000);
  assert.ok(await p.evaluate(() => !!document.getElementById('wi-mir-to')), 'the mirror row must be there for Nadia idle SW');
  await p.click('#wi-mir-to'); await p.waitForTimeout(3500);
  assert.match(await p.evaluate(() => document.getElementById('ur-title').textContent), /SE/, 'switched to the SE slot');
  await p.click('#wi-save'); await p.waitForTimeout(6000);
  const st = await p.evaluate(() => { const a = ASSET_MANIFEST.assets.find(a => a.id === 'tactics-nadia-se-idle'); return { status: a.status, file: a.file, staged: RepoDir.count() } });
  assert.equal(st.status, 'final', 'the SE slot is filled: ' + JSON.stringify(st)); assert.ok(st.staged > 0, 'the new picture is staged'); console.log('ok Nadia SW -> SE saved', JSON.stringify(st));
  assert.deepEqual(errs, [], errs.join('|')); console.log('mirror-all e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
