// v98.102 · importing a walk set (12 frames) into an ally's one-frame walk placeholder (Kier NW) must save, close the modal and update the list.
// Run: node tools/e2e-studio-ally-walk.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const { execFileSync } = require('node:child_process'), sheet = path.join(os.tmpdir(), 'ally-walk-sheet.png');
  execFileSync('python3', ['-c', `from PIL import Image\nfr=[Image.open('${ROOT}/assets/characters/hero-male/walk-se-%02d.webp'%(1+n%8)).convert('RGBA') for n in range(12)]\ns=Image.new('RGBA',(4*384,4*384),(0,0,0,0))\n[s.alpha_composite(f,((i%4)*384,(i//4)*384)) for i,f in enumerate(fr)]\ns.save('${sheet}')`]);
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  // start from empty walk slots for Kier whatever the repo already holds (the test works on the in-memory manifest only)
  await p.evaluate(() => { if (ASSET_MANIFEST.studioAllyWalks) delete ASSET_MANIFEST.studioAllyWalks.kier; StudioBrowser.invalidate() }); await p.waitForTimeout(1500);
  const clipOf = () => p.evaluate(() => { const e = StudioBrowser.state.model.find(x => x.id === 'ally:kier'); const c = e.clips.find(c => c.action === 'walk' && c.view === 'NW'); return { id: c.id, n: c.frames.length } });
  const c0 = await clipOf(); assert.equal(c0.n, 1, 'precondition: placeholder has 1 frame');
  await p.evaluate(id => StudioUnifiedReview.open(id), c0.id); await p.waitForTimeout(3000); await p.setInputFiles('#wi-files', sheet); await p.waitForTimeout(3500);
  // axis mode: 'กว้างอย่างเดียว' changes the width of the output only
  { const box = m => p.evaluate(async mode => { document.getElementById('wi-axis').value = mode; document.getElementById('wi-axis').dispatchEvent(new Event('change')); const s = document.getElementById('wi-scale'); s.value = 1.4; s.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 400)); const c = StudioWalkImport._output()[0]; const d = c.getContext('2d').getImageData(0, 0, 384, 384).data; let x0 = 384, x1 = 0, y0 = 384, y1 = 0; for (let y = 0; y < 384; y++)for (let x = 0; x < 384; x++)if (d[(y * 384 + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) } return [x1 - x0, y1 - y0] }, m);
    const b1 = await box('both'), bw = await box('w'), bh = await box('h'); console.log('bbox both/w/h', b1, bw, bh); assert.ok(bw[0] > bh[0] && bh[1] > bw[1], 'width-only widens, height-only heightens'); await p.evaluate(() => { document.getElementById('wi-axis').value = 'both'; document.getElementById('wi-axis').dispatchEvent(new Event('change')); const s = document.getElementById('wi-scale'); s.value = 1; s.dispatchEvent(new Event('input')) }) }
  assert.equal(await p.evaluate(() => document.getElementById('wi-total').textContent), '12', 'default 4x4 sheet uses the first 12 cells');
  await p.click('#wi-save'); await p.waitForTimeout(6000);
  const c1 = await clipOf(); assert.equal(c1.n, 12, 'the list must now hold the 12-frame walk: ' + JSON.stringify(c1));
  assert.equal(await p.evaluate(() => StudioUnifiedReview.isOpen()), false, 'modal must close');
  assert.ok(await p.evaluate(() => RepoDir.count()) > 0, 'files must be staged');
  console.log('ok Kier NW walk saved: 1 ->', c1.n, 'frames');
  // v98.104 · copy the opposite direction mirrored: NW (12 frames) -> NE (1-frame placeholder) must work and save
  await p.evaluate(id => StudioUnifiedReview.open(id), c1.id); await p.waitForTimeout(3000);
  // per-frame values must travel with the mirrored copy: time, X shift (mirrored), Y shift, size %
  await p.evaluate(() => { const set = (sel, i, v) => { const el = document.querySelectorAll(sel)[i]; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) }; set('[data-time]', 0, 137); set('[data-x]', 0, 12); set('[data-y]', 0, -7); set('[data-size]', 0, 90); set('[data-time]', 3, 55); set('[data-x]', 3, -9) });
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => StudioWalkImport.getFrames().map(f => [f.ms, f.dx, f.dy, Math.round((f.scale || 1) * 100)]));
  assert.deepEqual(before[0], [137, 12, -7, 90], 'source values were set: ' + JSON.stringify(before[0]));
  await p.click('#wi-mir-to'); await p.waitForTimeout(3500);
  assert.equal(await p.evaluate(() => StudioUnifiedReview.current ? StudioUnifiedReview.current().id : document.getElementById('ur-title')?.textContent), await p.evaluate(() => document.getElementById('ur-title')?.textContent), 'sanity');
  assert.match(await p.evaluate(() => document.getElementById('ur-title').textContent), /NE/, 'editor switched to the NE clip');
  assert.equal(await p.evaluate(() => StudioWalkImport.getState().frames), 12, 'NE editor now holds the 12 mirrored frames');
  const after = await p.evaluate(() => StudioWalkImport.getFrames().map(f => [f.ms, f.dx, f.dy, Math.round((f.scale || 1) * 100)]));
  assert.deepEqual(after[0], [137, -12, -7, 90], 'frame 1: time kept, X mirrored, Y + size kept: ' + JSON.stringify(after[0])); assert.deepEqual(after[3], [55, 9, 0, 100], 'frame 4: ' + JSON.stringify(after[3])); console.log('ok per-frame values copied with the mirror', JSON.stringify(after[0]), JSON.stringify(after[3]));
  console.log('title', await p.evaluate(() => [document.getElementById('ur-title').textContent, document.getElementById('ur-status')?.textContent, StudioWalkImport.getClip().id, StudioWalkImport.getClip().frames.length]));
  console.log('pre-save', await p.evaluate(() => [StudioWalkImport.isAllyWalk(), StudioWalkImport.getClip()?.id, StudioWalkImport.getState().saving, document.getElementById('wi-save').disabled]));
  await p.click('#wi-save'); await p.waitForTimeout(6000);
  console.log('msg:', await p.evaluate(() => [document.getElementById('wi-message')?.textContent, document.getElementById('ur-status')?.textContent, JSON.stringify(Object.keys(ASSET_MANIFEST.studioAllyWalks.kier))]));
  const se = await p.evaluate(() => StudioBrowser.state.model.find(x => x.id === 'ally:kier').clips.filter(c => c.action === 'walk').map(c => c.view + ':' + c.frames.length).join());
  assert.match(se, /NE:12/, 'NE walk saved with 12 frames: ' + se); console.log('ok mirrored copy to the opposite direction:', se);
  assert.deepEqual(errs, [], errs.join('|')); console.log('ally walk e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
