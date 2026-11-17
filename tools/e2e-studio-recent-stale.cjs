// v98.130 · a "recently pushed" copy kept by this browser must not hide a NEWER version pushed afterwards from somewhere else.
// The test remembers an OLD manifest (Mil without its 12-frame walk) as if this browser had just pushed it, reconnects, and expects the branch's current manifest.
// Needs network access to api.github.com (reads the current blob sha of data/asset-manifest.json on main).
// Run: node tools/e2e-studio-recent-stale.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  const milSW = () => p.evaluate(() => { const e = StudioBrowser.state.model.find(x => x.id === 'ally:mil'), c = e.clips.find(c => c.action === 'walk' && c.view === 'SW'); return c.frames.length });
  const now = await milSW(); assert.ok(now > 1, 'precondition: the branch has the multi-frame Mil walk (' + now + ')');
  await p.evaluate(async () => { const m = JSON.parse(JSON.stringify(ASSET_MANIFEST)); delete m.studioAllyWalks.mil; const b = new Blob([JSON.stringify(m, null, 1)], { type: 'application/json' }); await RepoDir.remember([['data/asset-manifest.json', b]]) });
  await p.evaluate(() => RepoDir.afterExternal().then(() => StudioBrowser.connect(null))); await p.waitForTimeout(9000);
  const after = await milSW(); assert.equal(after, now, 'the newer branch version wins over the old remembered copy (got ' + after + ' frames)');
  assert.equal(await p.evaluate(() => RepoDir.recentPaths().includes('data/asset-manifest.json')), false, 'the stale remembered copy is forgotten');
  console.log('ok stale remembered manifest ignored · Mil walk SW', after, 'frames');
  assert.deepEqual(errs, [], errs.join('|')); console.log('recent-stale e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
