// v98.95 · Asset Studio ⚖ Scale Lineup tab: same characters as the Animation tab, live pictures, two-way selection, size badge.
// Run: node tools/e2e-studio-lineup.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1700, height: 950 } });
  page.on('dialog', d => d.accept()); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(base + 'asset-studio.html'); await page.waitForTimeout(2000); await page.click('#conn'); await page.waitForTimeout(9000); await page.click('text=Animation'); await page.waitForTimeout(3000);
  const studioChars = await page.evaluate(() => StudioBrowser.state.model.filter(e => e.group === 'characters' || e.group === 'npcs').map(e => e.group === 'npcs' ? e.id.replace(/^npc:/, '') : e.id));   // v98.444 · the lineup lists the villagers as well as the friends
  await page.click('#lineupTab'); await page.waitForTimeout(9000);
  const fr = page.frames().find(f => /scale-lineup\.html/.test(f.url())); assert.ok(fr, 'the Scale Lineup frame did not open');
  const lineupIds = () => fr.evaluate(() => ENTRIES.filter(e => e.kind === 'hero' || e.kind === 'ally').map(e => e.id));
  // 1 same characters as the Animation tab
  const toId = id => id === 'hero' ? 'hero' : id.replace(/^ally:/, '');
  const ids = (await lineupIds()).filter(i => !/^hero-(male|female)$/.test(i)); assert.deepEqual([...ids].sort(), studioChars.map(toId).sort(), 'the lineup must list the same characters as the Animation tab'); console.log('ok same characters', ids.length);
  // 2 no scene buttons, no per-scene size rows
  const ui = await fr.evaluate(() => ({ ctxHidden: getComputedStyle(document.getElementById('ctxBtns')).display === 'none', rows: [...document.querySelectorAll('#ctl .adj > span')].map(s => s.textContent) }));
  assert.ok(ui.ctxHidden, 'scene buttons must be hidden'); assert.ok(!ui.rows.some(t => /สนามรบ|หมู่บ้าน|แผนที่/.test(t)), 'no per-scene size rows: ' + ui.rows.join(','));
  // 3 the battle and village views are the same set (one entry object serves both)
  assert.ok(await fr.evaluate(() => ENTRIES.filter(e => e.kind === 'hero' || e.kind === 'ally').every(e => e.ctx.battle === e.ctx.village)), 'battle/village must share one measurement'); console.log('ok one set for every scene');
  // 4 live pictures: switching the hero's look in the Animation tab changes the lineup picture
  await page.click('text=Animation'); await page.waitForTimeout(1500);
  const heroFile = () => fr.evaluate(() => ENTRIES.find(e => e.id === 'hero').ctx.battle.file);
  const a = await heroFile(); await page.click('[data-look="female"]'); await page.waitForTimeout(3500); const b2 = await heroFile();
  assert.notEqual(a, b2, 'the lineup hero must follow the studio look'); console.log('ok hero follows the look:', a.split('/').slice(-2).join('/'), '->', b2.split('/').slice(-2).join('/'));
  // 5 selection: lineup -> studio
  await fr.evaluate(() => pickSel('luna')); await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => StudioBrowser.state.entity), 'ally:luna', 'choosing Luna in the lineup must select her in Animation'); console.log('ok lineup -> studio selection');
  // 6 selection: studio -> lineup
  await page.click('[data-entity="ally:kier"]'); await page.waitForTimeout(800);
  assert.equal(await fr.evaluate(() => sel), 'kier', 'choosing Kier in Animation must select him in the lineup'); console.log('ok studio -> lineup selection');
  // 7 any frame of the Animation clips can be compared (walk frame of the hero is a different picture and a different silhouette)
  await fr.evaluate(() => pickSel('hero')); await page.waitForTimeout(500);
  const clip = await fr.evaluate(() => { const c = parent.StudioBrowser.lineup.entities().find(e => e.id === 'hero').clips.find(c => c.action === 'walk' && c.view === 'SE'); return c && c.id });
  assert.ok(clip, 'the hero has no walk SE clip'); const before = await heroFile();
  await fr.evaluate(c => { PICK.hero = { clip: c, index: 3 }; return buildChars().then(render) }, clip); const after = await heroFile();
  assert.notEqual(before, after, 'picking a walk frame must change the compared picture'); assert.match(after, /walk/i); console.log('ok compares any frame:', after.split('/').slice(-2).join('/'));
  await fr.evaluate(() => { delete PICK.hero; return buildChars().then(render) });
  // 8 size factor set in the lineup shows as a badge in Animation, and an unset one does not
  await fr.evaluate(() => { bump('g', 7) }); await page.waitForTimeout(600); await page.click('[data-entity="hero"]'); await page.waitForTimeout(800);
  const badge = await page.evaluate(() => document.querySelector('#grid .entity-title h2')?.innerText || ''); assert.match(badge, /ขนาดในเกม \d+%/, 'size badge missing: ' + badge); console.log('ok size badge:', badge.replace(/\s+/g, ' '));
  assert.deepEqual(errs, [], 'page errors: ' + errs.join(' | ')); console.log('studio lineup e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
