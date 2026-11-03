// v98.89 · Asset Studio: the hero's walk/idle rows must never vanish — for every look, every direction.
// Run: node tools/e2e-studio-walkrow.cjs   (needs Playwright + Chromium; serves the repo itself, connects the studio to the repo like the web app does)
// Cases: A fresh load · B open + close the frame editor · C switch looks · D stale 'unused' marks saved by an older build (the case that kept coming back).
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await browser.newPage({ viewport: { width: 1700, height: 950 } });
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  const rows = () => p.evaluate(() => { const e = StudioBrowser.state.model.find(x => x.id === 'hero'), r = {}; for (const c of e.clips) (r[c.action] ||= {})[c.view] = c.frames.length; return { look: StudioVariants.active, r } });
  const ok = async (label) => { const { look, r } = await rows(); for (const a of ['idle', 'walk']) for (const d of ['SW', 'SE', 'NW', 'NE']) assert.ok(r[a]?.[d] > 0, `${label}: ${look} ${a} ${d} row is missing`); console.log('ok', label, look, 'walk frames', JSON.stringify(r.walk)) };
  await ok('A fresh load');
  await p.evaluate(() => { window.__id = StudioBrowser.state.model.find(x => x.id === 'hero').clips.find(c => c.action === 'walk' && c.view === 'SW').id; StudioUnifiedReview.open(window.__id) }); await p.waitForTimeout(3000);
  await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close())); await p.waitForTimeout(1500); await ok('B after opening/closing the frame editor');
  for (const l of ['female', 'male']) { await p.click(`[data-look="${l}"]`); await p.waitForTimeout(3000); await ok('C switch to ' + l) }
  await p.evaluate(() => { for (const a of ASSET_MANIFEST.assets) if (a.studioImportedWalk || a.studioImportedPose) a.status = 'unused'; StudioBrowser.rebuild() }); await p.waitForTimeout(800); await ok('D stale marks, open look');
  for (const l of ['female', 'male']) { await p.click(`[data-look="${l}"]`); await p.waitForTimeout(3000); await ok('D stale marks, ' + l) }
  assert.deepEqual(errs, [], 'page errors: ' + errs.join(' | ')); console.log('studio walk-row e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error(e.message); process.exit(1) });
