// v98.144 · Asset Studio "🧩 นำเข้าชีท": one sheet → cut → several slots at once (the 6 standard poses of Kier SW, with the opposite direction mirrored for two of them), then a walk set.
// Run: node tools/e2e-studio-sheet-import.cjs   (needs Playwright + Chromium + python PIL; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { chromium } = require('playwright'), { execFileSync } = require('node:child_process');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const sheet = path.join(os.tmpdir(), 'sheet-import-e2e.png');   // 3 x 2 characters on a flat light-grey background
  execFileSync('python3', ['-c', `from PIL import Image\nR='${ROOT}/'\nn=['ren','nadia','sigrid','orla','olwen','ren']\ns=Image.new('RGB',(900,800),(236,236,236))\nfor i,k in enumerate(n):\n im=Image.open(R+'assets/village-town/npc/%s/sw-stand.webp'%k).convert('RGBA');im.thumbnail((250,330));s.paste(im,((i%3)*300+(300-im.width)//2,(i//3)*400+(400-im.height)-20),im)\ns.save('${sheet}')`]);
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage();
  p.on('dialog', d => d.accept()); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(10000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  await p.evaluate(() => { StudioBrowser.state.entity = 'ally:kier'; StudioBrowser.rerender() }); await p.waitForTimeout(2500);
  assert.ok(await p.$('#shImpBtn'), 'the 🧩 button is in the grid controls'); await p.click('#shImpBtn'); await p.waitForTimeout(500);
  await p.setInputFiles('#shFile', sheet); await p.waitForTimeout(2500);
  let n = await p.evaluate(() => StudioSheetImport._cells().length); assert.equal(n, 6, 'smart grid 3x2 → 6 cells: ' + n);
  await p.selectOption('#shMode', 'blob'); await p.click('#shRecut'); await p.waitForTimeout(1500);
  n = await p.evaluate(() => StudioSheetImport._cells().length); assert.equal(n, 6, 'cut by pieces → 6 cells (background removed): ' + n); console.log('ok cut: grid and by pieces both give 6 cells');
  await p.selectOption('#shMode', 'smart'); await p.click('#shRecut'); await p.waitForTimeout(1200);
  await p.selectOption('#shView', 'SW'); await p.click('#shFill'); await p.waitForTimeout(300);
  const tg = await p.evaluate(() => StudioSheetImport._cells().map(c => c.target)); assert.deepEqual(tg, ['idle|SW', 'windup|SW', 'strike|SW', 'guard|SW', 'hit|SW', 'down|SW'], 'preset order: ' + tg);
  await p.evaluate(() => { const c = StudioSheetImport._cells(); c[0].mirror = true; c[5].mirror = true; document.querySelector('#shCells').dispatchEvent(new Event('x')) });
  await p.click('#shApply'); await p.waitForTimeout(9000);
  const r = await p.evaluate(() => { const o = {}; for (const [a, v] of [['idle', 'SW'], ['windup', 'SW'], ['strike', 'SW'], ['guard', 'SW'], ['hit', 'SW'], ['down', 'SW'], ['idle', 'SE'], ['down', 'SE'], ['hit', 'SE']]) { const x = byId(`tactics-kier-${v.toLowerCase()}-${a}`); o[a + v] = x ? x.status + ':' + (x.artRevision || '') : null } o.staged = RepoDir.paths().filter(p => /kier_/.test(p)).length; o.msg = document.getElementById('shMsg').textContent; return o });
  console.log(JSON.stringify(r)); for (const k of ['idleSW', 'windupSW', 'strikeSW', 'guardSW', 'hitSW', 'downSW', 'idleSE', 'downSE']) assert.ok(r[k] && r[k].startsWith('final'), k + ' final: ' + r[k]);
  assert.ok(r.staged >= 8, 'files written (staged): ' + r.staged); console.log('ok 6 poses to 6 slots, 2 mirrored to the opposite direction');
  // a walk set: three pieces → ONE target = 3 frames
  await p.click('#shClose'); await p.click('#shImpBtn'); await p.setInputFiles('#shFile', sheet); await p.waitForTimeout(2000);
  await p.evaluate(() => { const c = StudioSheetImport._cells(); for (let i = 0; i < 3; i++) c[i].target = 'walk|NE'; document.querySelector('#shAssign').dispatchEvent(new Event('x')) });
  await p.evaluate(() => { const b = document.querySelector('#shApply'); b.disabled = false; b.click() }); await p.waitForTimeout(6000);
  const w = await p.evaluate(() => ({ n: ASSET_MANIFEST.studioAllyWalks.kier.NE.frames.length, ms: ASSET_MANIFEST.studioAllyWalks.kier.NE.frames[0].ms })); assert.deepEqual(w, { n: 3, ms: 100 }, 'walk set from 3 pieces'); console.log('ok walk set of 3 frames @100 ms');
  // the hero (open look): pieces → saved pose sets
  await p.click('#shClose'); await p.evaluate(() => { StudioBrowser.state.entity = 'hero'; StudioBrowser.rerender() }); await p.waitForTimeout(2000); await p.click('#shImpBtn'); await p.setInputFiles('#shFile', sheet); await p.waitForTimeout(2000);
  await p.evaluate(() => { const c = StudioSheetImport._cells(); c[0].target = 'strike|SW'; c[1].target = 'down|NE'; c[1].mirror = true }); await p.evaluate(() => { const b = document.querySelector('#shApply'); b.disabled = false; b.click() }); await p.waitForTimeout(6000);
  const h = await p.evaluate(() => ({ strike: M.studioPoses.strike?.SW?.frames?.[0]?.assetId, downNE: M.studioPoses.down?.NE?.frames?.length, downNW: M.studioPoses.down?.NW?.frames?.length })); assert.match(h.strike, /^studio-hero-sw-strike-/); assert.equal(h.downNE, 1); assert.equal(h.downNW, 1); console.log('ok hero poses', JSON.stringify(h));
  assert.deepEqual(errs, [], errs.join('|')); console.log('sheet import e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
