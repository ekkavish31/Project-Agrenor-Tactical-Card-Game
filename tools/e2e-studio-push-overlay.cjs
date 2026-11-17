// v98.96 · Asset Studio: right after a push the studio must show the work that was JUST pushed, not the old web copy (GitHub Pages is stale for a few minutes).
// Before: push -> reload from the web -> the new frames vanished and the next save was built on old data. Now pushed files are remembered ('repo-recent') and read first.
// Run: node tools/e2e-studio-push-overlay.cjs   (needs Playwright + Chromium; serves the repo itself, so "the web copy" is the old checked-in manifest)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  // a sheet of 12 walk frames (4 x 3) to import as the new set
  const { execFileSync } = require('node:child_process'), sheet = path.join(os.tmpdir(), 'walk-sheet-e2e.png');
  execFileSync('python3', ['-c', `from PIL import Image\nfr=[Image.open('${ROOT}/assets/characters/hero-male/walk-se-%02d.webp'%(1+n%8)).convert('RGBA') for n in range(12)]\ns=Image.new('RGBA',(4*384,4*384),(0,0,0,0))\n[s.alpha_composite(f,((i%4)*384,(i//4)*384)) for i,f in enumerate(fr)]\ns.save('${sheet}')`]);
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  const nw = () => p.evaluate(() => { const c = (ASSET_MANIFEST.studioWalks || {}).NW; return c ? c.frames.length : null });
  const ids = () => p.evaluate(() => (ASSET_MANIFEST.studioWalks.NW.frames || []).map(f => f.assetId).join()), idsBefore = await ids(), before = await nw(); assert.ok(before && before !== 0, 'precondition: NW has ' + before + ' frames');
  const clip = await p.evaluate(() => StudioBrowser.state.model.find(e => e.id === 'hero').clips.find(c => c.action === 'walk' && c.view === 'NE').id);
  await p.evaluate(id => StudioUnifiedReview.open(id), clip); await p.waitForTimeout(3000); await p.setInputFiles('#wi-files', sheet); await p.waitForTimeout(3500);  await p.waitForTimeout(800); await p.click('#wi-save'); await p.waitForTimeout(6000);
  const saved = await nw(); assert.equal(saved, 12, 'the new set must be saved'); const idsSaved = await ids(); assert.notEqual(idsSaved, idsBefore, 'new frames must replace the old ones'); assert.ok(await p.evaluate(() => RepoDir.count()) > 0, 'files must be staged'); console.log('ok saved a new walk set:', before, '->', saved, 'frames (staged)');
  await p.evaluate(() => { GitHubPush.commit = async (msg, build) => { await build(); return 'stub-tag' } });
  // the push is a stub, so GitHub's branch does not really hold the pushed files: answer the "current blob" question as a real push would (= what was pushed)
  await p.route(/api\.github\.com\/repos\/.+\/contents\//, async route => { const u = new URL(route.request().url()), path = decodeURIComponent(u.pathname.split('/contents/')[1]); const sha = await p.evaluate(pp => RepoDir._recentSha(pp), path); if (sha) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sha }) }); return route.continue() }); await p.click('#stagedPush'); await p.waitForTimeout(4000);
  assert.equal(await p.evaluate(() => RepoDir.count()), 0, 'staged list must be empty after the push'); assert.ok(await p.evaluate(() => RepoDir.recentPaths().length) > 0, 'pushed files must be remembered');
  await p.evaluate(() => RepoDir.afterExternal().then(() => StudioBrowser.connect(null))); await p.waitForTimeout(9000);
  assert.equal(await ids(), idsSaved, 'after the push the studio must still show the pushed set, not the old web copy'); console.log('ok right after the push the studio shows the pushed work (web copy is still old)');
  // the editor shell (editor.html) has its own push button: it must load without errors
  const q = await (await browser.newContext()).newPage(); const e2 = []; q.on('pageerror', e => e2.push(e.message)); await q.goto(base + 'editor.html'); await q.waitForTimeout(4000);
  assert.ok(await q.$('#stagedPush'), 'editor.html lost its push button'); assert.deepEqual(e2, [], 'editor.html errors: ' + e2.join(' | ')); console.log('ok editor.html loads');
  assert.deepEqual(errs, [], 'page errors: ' + errs.join(' | ')); console.log('push overlay e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
