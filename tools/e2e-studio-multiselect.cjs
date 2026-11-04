// v98.128 · Animation grid ☑ เลือกหลายช่อง: pick cells / a whole row, then approve, un-approve, mark needs-fix and delete together.
// Run: node tools/e2e-studio-multiselect.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  await p.evaluate(() => { StudioBrowser.state.entity = 'ally:ren'; StudioBrowser.rerender ? StudioBrowser.rerender() : StudioBrowser.invalidate() }); await p.waitForTimeout(2500);
  assert.ok(await p.$('#msToggle'), 'multi-select toggle in the grid controls');
  await p.click('#msToggle'); await p.waitForTimeout(300);
  // click the row title "ยืน" = every standing direction of Ren
  await p.evaluate(() => { const th = [...document.querySelectorAll('#grid .anim-matrix tbody th')].find(t => /ยืน/.test(t.textContent)); th.click() }); await p.waitForTimeout(300);
  const n = await p.evaluate(() => StudioMultiSelect.picked().length); assert.equal(n, 4, 'row title picks the 4 standing directions: ' + n);
  assert.equal(await p.evaluate(() => StudioUnifiedReview.isOpen()), false, 'clicking in multi-select mode does not open the editor');
  const status = () => p.evaluate(() => { const e = StudioBrowser.state.model.find(x => x.id === 'ally:ren'), st = JSON.parse(localStorage.getItem('asset-animation-reviews-v1') || '{}'); return e.clips.filter(c => c.action === 'idle').map(c => (st[AnimationReviewModel.signature(c)] || ASSET_MANIFEST.studioReviews?.[AnimationReviewModel.signature(c)] || {}).status || 'unreviewed') });
  await p.click('.ms-bar [data-act="approved"]'); await p.waitForTimeout(2500); assert.deepEqual(await status(), ['approved', 'approved', 'approved', 'approved'], 'all approved');
  console.log('ok approve 4 at once');
  assert.equal(await p.evaluate(() => StudioMultiSelect.picked().length), 4, 'the selection stays after an action (the grid re-renders)');
  assert.equal(await p.evaluate(() => document.querySelectorAll('#grid [data-clip-index].ms-on').length), 4, 'picked cells stay highlighted');
  await p.click('.ms-bar [data-act="unreviewed"]'); await p.waitForTimeout(2500); assert.deepEqual(await status(), ['unreviewed', 'unreviewed', 'unreviewed', 'unreviewed'], 'un-approved');
  console.log('ok un-approve');
  // delete: the ren walk NW set (an ally walk config) goes back to the empty placeholder
  await p.click('.ms-bar [data-sel="none"]'); const cellId = await p.evaluate(() => { const b = [...document.querySelectorAll('#grid [data-clip-index]')].find(b => { const cv = b.querySelector('canvas'), e = StudioBrowser.state.entries.find(x => x.canvas === cv); return e && e.clip.id === 'allywalk:ren:NW' }); if (b) { b.click(); return true } return false });
  assert.ok(cellId, 'ren walk NW cell'); await p.waitForTimeout(200);
  await p.click('.ms-bar [data-act="delete"]'); await p.waitForTimeout(3000);
  const after = await p.evaluate(() => ({ cfg: !!ASSET_MANIFEST.studioAllyWalks?.ren?.NW, clip: StudioBrowser.state.model.find(x => x.id === 'ally:ren').clips.find(c => c.action === 'walk' && c.view === 'NW').id }));
  assert.equal(after.cfg, false, 'walk set removed'); assert.match(after.clip, /^static:/, 'slot is the empty placeholder again: ' + after.clip); console.log('ok delete →', after.clip);
  assert.deepEqual(errs, [], errs.join('|')); console.log('multiselect e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
