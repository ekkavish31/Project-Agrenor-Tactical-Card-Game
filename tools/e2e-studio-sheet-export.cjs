// v98.633 · Asset Studio "⬇ ส่งออกชีท": the hero, a friend, a villager and a monster give the right sheets (sizes, frame counts, greyed-out ones). Run: node tools/e2e-studio-sheet-export.cjs
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), browser = await chromium.launch(), p = await browser.newPage({ viewport: { width: 1500, height: 900 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:' + server.address().port + '/asset-studio.html'); await p.waitForTimeout(6000);
  const r = await p.evaluate(async () => { const S = StudioBrowser, X = StudioSheetExport, out = {};
    for (const id of ['hero', 'ally:kier', 'npc:graven', 'enemy:bat']) { const e = S.state.model.find(x => x.id === id); out[id] = {}; for (const sh of X.plan(e)) { if (!sh.ok) { out[id][sh.id] = null; continue } const parts = await X.gather(e, sh.kind, sh.views), cv = X.compose(parts, null, false, sh.kind.cols || 0); out[id][sh.id] = [cv.width, cv.height, parts.map(q => q.cvs.length)] } } return out });
  assert.deepEqual(r.hero['combat-SW'], [1152, 768, [1, 1, 1, 1, 1, 1]], 'hero: the 6 combat poses in one 3 × 2 sheet'); assert.deepEqual(r.hero['combat-NE'], [1152, 768, [1, 1, 1, 1, 1, 1]]);
  assert.deepEqual(r.hero['walk-SW'], [4608, 384, [12]], 'hero walk: 12 frames'); assert.deepEqual(r.hero['walk-NE'], [4608, 384, [12]]);
  assert.deepEqual(r['ally:kier']['walk-NE'], [4608, 384, [12]], 'a friend has the same six sheets');
  assert.deepEqual(r['npc:graven'].stand, [768, 384, [1, 1]], 'villager: stand SW + NE in ONE sheet'); assert.equal(r['npc:graven']['walk-SW'], null, 'a one-picture walk is greyed out');
  assert.equal(r['enemy:bat']['walk-SW'][0], 2048, 'monster: 4 walk frames of 512'); assert.ok(r['enemy:bat']['combat-NE'][2].length >= 2 && r['enemy:bat']['combat-NE'][2].length <= 5, 'monster without a guard pose: the poses it has, at most 5');
  const btn = await p.evaluate(() => { StudioBrowser.state.entity = 'hero'; StudioBrowser.rerender(); return new Promise(r => setTimeout(() => r(!!document.querySelector('#shExpBtn')), 1500)) });
  assert.ok(btn, 'the ⬇ button is in the grid controls'); assert.deepEqual(errs.filter(e => !/Invalid or unexpected token/.test(e)), [], 'no page errors');
  console.log('ok studio sheet export'); await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1) });
