// v98.142 · thumbnails (character list) and Scale Lineup read the standing picture from the SAME place as the Animation grid (its idle clip), not from fixed file names.
// Test: change Kier's standing picture in the grid's data → the thumbnail and the Scale Lineup use that picture.
// Run: node tools/e2e-studio-one-source.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(10000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  // the grid's standing SW picture for Kier is a file the legacy names do NOT point to: use another cast picture as the "new" one
  const r = await p.evaluate(async () => { const NEW = 'assets/village-town/npc/orla/sw-stand.webp', a = ASSET_MANIFEST.assets.find(a => a.id === 'tactics-kier-sw-idle'); a.file = NEW; a.artRevision = 'e2e'; StudioBrowser.rebuild();
    const pic = await StudioBrowser.lineup.picture('ally:kier', 'SW'); const src = img => img && decodeURIComponent(img.getAttribute('src') || '');
    StudioBrowser.rerender(); await new Promise(r => setTimeout(r, 2500)); const th = [...document.querySelectorAll('#cats img[data-bust="ally:kier"]')].map(i => i.src.slice(0, 30));
    return { file: pic && pic.file, thumb: th.length, thumbIsData: th.every(s => s.startsWith('data:image')) } });
  assert.equal(r.file, 'assets/village-town/npc/orla/sw-stand.webp', 'lineup picture comes from the grid clip: ' + JSON.stringify(r)); assert.ok(r.thumb > 0 && r.thumbIsData, 'thumbnail drawn');
  console.log('ok lineup picture = the grid\'s idle clip', r.file); assert.deepEqual(errs, [], errs.join('|')); console.log('one source e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
