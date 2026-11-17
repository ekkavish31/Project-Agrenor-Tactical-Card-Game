// v98.139 · ONE character-size multiplier per map (js/map-scale.js): edited in Scale Lineup → 🗺 ขนาดต่อแผนที่, read by the village, sub-maps, battle and world map.
// Run: node tools/e2e-map-scale.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } }), errs = [];
  const page = async url => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); p.on('dialog', d => d.accept()); await p.goto(base + url); return p };
  // 1 the editor tab: one number per map
  let p = await page('scale-lineup.html'); await p.waitForTimeout(3500);
  await p.evaluate(() => localStorage.setItem('place-maps-v1', JSON.stringify({ 'custom-interior-test': { name: 'ห้องทดสอบ', sub: 'ภายในอาคาร' } })));
  await p.evaluate(() => localStorage.setItem('project-a-village-custom-places-v1', JSON.stringify([{ id: 'custom-village-test', name: 'สถานที่ทดสอบ' }])));
  await p.click('[data-t="maps"]'); await p.waitForTimeout(800);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#mapTbl tr')].slice(1).map(tr => tr.children[0].textContent));
  assert.ok(rows.some(r => /หมู่บ้าน/.test(r)) && rows.some(r => /แผนที่โลก/.test(r)) && rows.filter(r => /สนามรบ/.test(r)).length === 6 && rows.some(r => /ตลาด/.test(r)), 'a row for every kind of map: ' + rows.join(' | '));
  assert.ok(rows.some(r => /ภายในอาคาร.*สมาคมนักผจญภัย/.test(r)) && rows.some(r => /ภายในอาคาร.*บ้านเคียร์/.test(r)) && rows.some(r => /ภายในอาคาร.*ห้องทดสอบ/.test(r)) && rows.some(r => /ภายในอาคาร.*สถานที่ทดสอบ/.test(r)), 'all built-in and custom interior scenes are configurable: ' + rows.filter(r => /ภายในอาคาร/.test(r)).join(' | '));
  const col = await p.evaluate(() => document.querySelectorAll('#mapTbl tr:nth-child(2) input[type=number]').length); assert.equal(col, 1, 'exactly ONE number per map');
  await p.evaluate(() => { const i = document.querySelector('#mapTbl tr:nth-child(2) input[type=number]'); i.value = 120; i.dispatchEvent(new Event('change', { bubbles: true })) });   // village 120 %
  await p.evaluate(() => { const r = [...document.querySelectorAll('#mapTbl tr')].find(tr => /ป่า/.test(tr.children[0].textContent)); const i = r.querySelector('input[type=number]'); i.value = 150; i.dispatchEvent(new Event('change', { bubbles: true })) });   // battle forest 150 %
  await p.evaluate(() => { const r = [...document.querySelectorAll('#mapTbl tr')].find(tr => /ตลาด/.test(tr.children[0].textContent)); const i = r.querySelector('input[type=number]'); i.value = 80; i.dispatchEvent(new Event('change', { bubbles: true })) });   // market 80 %
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('map-char-scale-v1'))); assert.deepEqual(saved, { village: 1.2, battle: { forest: 1.5 }, place: { market: 0.8 } }, 'saved: ' + JSON.stringify(saved)); console.log('ok editor tab saves one value per map', JSON.stringify(saved));
  // 2 village: hero and villagers share the one multiplier
  const v = await page('village-town.html'); await v.waitForTimeout(9000);
  const vs = await v.evaluate(() => ({ hero: VillageAssetEdit.charScale('hero'), npc: VillageAssetEdit.charScale('npc:' + TownNPC.roster[0].id), adjH: CharScaleAdjust.factor('village', 'hero'), adjN: CharScaleAdjust.factor('village', TownNPC.roster[0].id) }));
  assert.ok(Math.abs(vs.hero - 1.2 * vs.adjH) < 1e-9 && Math.abs(vs.npc - 1.2 * vs.adjN) < 1e-9, 'village: ' + JSON.stringify(vs)); console.log('ok village hero + villager use the one multiplier', JSON.stringify(vs));
  // 3 sub-map: own value, else the village's
  const pl = await page('village-place.html?place=market'); await pl.waitForTimeout(5000);
  assert.equal(await pl.evaluate(() => window.placeScale()), 0.8, 'market uses its own value');
  assert.equal(await pl.evaluate(() => { MapScale.set('place', 'market', null); return window.placeScale() }), 1.2, 'unset sub-map follows the village'); console.log('ok sub-map own value / follows village');
  // 4 battle + world read their value (the module answers; the draw code multiplies it)
  const mv = await v.evaluate(() => ({ forest: MapScale.get('battle', 'forest'), snow: MapScale.get('battle', 'snow'), world: MapScale.get('world') })); assert.deepEqual(mv, { forest: 1.5, snow: 1, world: 1 });
  const bf = await page('battle-field.html'); await bf.waitForTimeout(3000); assert.ok(await bf.evaluate(() => !!window.MapScale), 'battle page loads MapScale');
  assert.deepEqual(errs.filter(e => !/404|favicon/.test(e)), [], errs.join('|')); console.log('map scale e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
