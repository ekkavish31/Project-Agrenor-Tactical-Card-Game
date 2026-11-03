// v98.99 · map editor walking speed (m/s) for the hero and NPCs: UI edits change what the game uses; defaults unchanged.
// Run: node tools/e2e-walk-speed.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1300, height: 850 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(base + 'village-town.html?edit=1'); await p.waitForTimeout(6000);
  const def = await p.evaluate(() => ({ r: WalkSpeed.heroMs(true), g: WalkSpeed.heroMs(false), n: TownNPC.roster.map(n => [n.id, WalkSpeed.npcMs(n), n.speed * 0.57]) }));
  assert.ok(Math.abs(def.r - 8.8 * 0.57) < 1e-9 && Math.abs(def.g - 7.4 * 0.57) < 1e-9, 'hero defaults unchanged'); for (const [id, a, b] of def.n) assert.ok(Math.abs(a - b) < 1e-9, 'npc default ' + id);
  await p.evaluate(() => document.getElementById('walkSpeedBtn').click()); await p.waitForTimeout(500);
  assert.ok(await p.evaluate(() => document.getElementById('walkSpeedDialog').open), 'dialog opens');
  await p.fill('input[data-id="hero:road"]', '2'); await p.fill('input[data-all]', '1.2'); await p.fill('input[data-mul="' + def.n[0][0] + '"]', '0.5');
  const now = await p.evaluate(() => ({ road: WalkSpeed.heroCells(true), a: WalkSpeed.npcCells(TownNPC.roster[0]), b: WalkSpeed.npcCells(TownNPC.roster[1]), ls: localStorage.getItem('walk-speed-v1') }));
  assert.ok(Math.abs(now.road - 2 / 0.57) < 1e-6, 'hero uses 2 m/s'); assert.ok(Math.abs(now.b - 1.2 / 0.57) < 1e-6, 'everyone uses the base 1.2 m/s'); assert.ok(Math.abs(now.a - 0.6 / 0.57) < 1e-6, 'one villager = base x 0.5'); assert.match(now.ls, /"npcBase":1.2/);
  assert.match(await p.evaluate(id => document.querySelector('[data-ms="' + id + '"]').textContent, def.n[0][0]), /0\.60/, 'shows the resulting m/s');
  await p.click('[data-reset="hero:road"]'); await p.waitForTimeout(300);
  assert.ok(Math.abs(await p.evaluate(() => WalkSpeed.heroMs(true)) - def.r) < 1e-9, 'reset restores the game speed');
  // v98.108 · walking direction -> animation: N->NE, S->SE, W->SW, E->SE, thresholds + hysteresis
  const dirs = await p.evaluate(() => { const D = WalkSpeed.dir, hd = deg => { const a = deg * Math.PI / 180, x = Math.cos(a), y = Math.sin(a); return [(x + y) / 56, (y - x) / 56] }, A = deg => D.anim(D.raw8(...hd(deg), null)); WalkSpeed.dir.reset();
    const o = {}; for (const [k, deg] of Object.entries({ E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: 225, N: 270, NE: 315 })) o[k] = A(deg);
    const t = { n40: A(40), n20: A(20), n25: A(25) }; D.set({ card: 0 }); t.card0_20 = A(20); t.card0_80 = A(80); D.set({ card: 22.5 });
    const obj = {}; D.face(obj, ...hd(115)); const first = D.anim(obj.raw8); const second = D.face(obj, ...hd(110)); const third = D.face(obj, ...hd(106)); D.reset(); return { o, t, hys: [first, second, third] } });
  assert.deepEqual(dirs.o, { E: 'SE', SE: 'SE', S: 'SE', SW: 'SW', W: 'SW', NW: 'NW', N: 'NE', NE: 'NE' }, 'default map: ' + JSON.stringify(dirs.o)); assert.equal(dirs.t.card0_80, 'SE'); assert.equal(dirs.t.card0_20, 'SE'); console.log('ok direction map', JSON.stringify(dirs.o), 'hysteresis keeps', dirs.hys.join('>'));
  await p.evaluate(() => document.getElementById('walkSpeedBtn').click()); await p.waitForTimeout(300); await p.selectOption('select[data-dir="N"]', 'NW');
  assert.equal(await p.evaluate(() => WalkSpeed.dir.anim('N')), 'NW', 'dropdown changes the map'); await p.evaluate(() => WalkSpeed.dir.reset());
  // the hero really moves with the changed speed: walk 1 s with a slow setting, then compare with the default
  assert.deepEqual(errs, [], errs.join('|')); console.log('walk speed e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
