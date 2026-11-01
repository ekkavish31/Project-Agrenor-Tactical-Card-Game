/* node tools/check-places.cjs [--browser]
   Does every place in the village actually open? (the "Hilda's house shows 'not open yet'" class of bug)
   Static (always): every place has a kind, every house has an owner who exists, interior.js builds that kind.
   --browser (needs playwright): runs the real game — inside an iframe, like in play — and for every place
     • asks to enter it and checks the "enter" button is enabled (only the plaza may say "not open")
     • opens its interior page and checks it draws, has a door and throws no error.
   Exit code 1 when anything fails. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
require('../js/village-life.js');
const L = globalThis.VillageLife;
let fail = 0, pass = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('✗ ' + msg) } };

/* ---- the places: the village list in village-town.html + custom places saved in game-settings.js ---- */
const vt = read('village-town.html');
const places = new Map();
for (const m of vt.matchAll(/\[\s*'([a-z0-9-]+)'\s*,\s*'([^']+)'\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,/g)) places.set(m[1], m[2]);
for (const id of ['inn', 'healer', 'shop', 'market', 'temple', 'forge', 'square']) if (!places.has(id)) places.set(id, id);
try {
  const gs = read('js/game-settings.js'), mm = gs.match(/"project-a-village-custom-places-v1":\s*"((?:[^"\\]|\\.)*)"/);
  if (mm) for (const c of JSON.parse(JSON.parse('"' + mm[1] + '"'))) places.set(c.id, c.name || c.id);
} catch (e) { console.log('(custom places not read: ' + e.message + ')') }

/* ---- static checks ---- */
const interior = read('js/interior.js');
const KINDS = new Set(['inn', 'healer', 'shop', 'market', 'temple', 'forge', 'square', 'house', 'home', 'guild', 'farm']);
for (const [id, name] of places) {
  if (id === 'square') continue;
  const kind = L.placeKind(id, name), owner = L.HOUSE_OF[id];
  ok(KINDS.has(kind), `${id} «${name}»: unknown kind "${kind}"`);
  if (kind === 'house' && owner) ok(L.P[owner], `${id} «${name}»: house owner "${owner}" is not a villager`);
  if (kind !== 'house' && kind !== 'home') ok(new RegExp(`KIND === '${kind}'`).test(interior), `${id} «${name}»: interior.js has no room for kind "${kind}"`);
}
for (const [id, who] of Object.entries(L.HOUSE_OF)) ok(L.P[who], `HOUSE_OF ${id} → ${who}: not a villager`);
console.log(`static: ${places.size} places · ${pass} ok · ${fail} problems`);

/* ---- browser checks ---- */
async function browser() {
  let pw; try { pw = require('playwright') } catch (e) { console.log('--browser needs playwright (npm i playwright) — skipped'); return }
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, r)); const base = 'http://localhost:' + srv.address().port;
  const b = await pw.chromium.launch(), page = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.setContent(`<body style="margin:0"><iframe id="v" src="${base}/village-town.html" style="width:1200px;height:800px;border:0"></iframe></body>`);
  let fr = null; for (let i = 0; i < 60 && !fr; i++) { await page.waitForTimeout(1000); const f = page.frames().find(x => /village-town/.test(x.url())); if (f && await f.evaluate(() => typeof locations !== 'undefined' && locations.length > 0 && !!window.TownUX).catch(() => false)) fr = f }
  ok(fr, 'village did not load in the iframe');
  if (fr) {
    await page.waitForTimeout(3000);
    const rows = await fr.evaluate(() => locations.filter(o => o.id !== 'square' && !o.hidden).map(o => { window.TownUX.requestEntry(o); const y = document.getElementById('entryYes'), r = { id: o.id, name: o.name, disabled: y.disabled, text: y.textContent }; document.getElementById('entryNo').click(); return r }));
    for (const r of rows) ok(!r.disabled, `${r.id} «${r.name}»: the enter button is disabled ("${r.text}") when played in the game`);
    console.log(`enter button: ${rows.length} places checked, ${rows.filter(r => r.disabled).length} disabled`);
    for (const r of rows) {
      const pg = await (await b.newContext({ viewport: { width: 900, height: 600 } })).newPage(), pe = []; pg.on('pageerror', e => pe.push(e.message));
      await pg.goto(`${base}/place-interior.html?embed=1&place=${encodeURIComponent(r.id)}&name=${encodeURIComponent(r.name)}`, { waitUntil: 'load' });
      await pg.waitForTimeout(2500);
      const info = await pg.evaluate(() => ({ canvas: !!document.querySelector('canvas'), room: !!(window.Interior && Interior.room), door: Interior?.room?.door }));
      ok(info.canvas && info.room && info.door != null, `${r.id} «${r.name}»: interior did not build (${JSON.stringify(info)})`);
      ok(!pe.length, `${r.id} «${r.name}»: interior page error: ${pe[0]}`);
      await pg.context().close();
    }
    console.log(`interiors: ${rows.length} pages opened`);
  }
  ok(!errs.length, 'village page errors: ' + errs.slice(0, 2).join(' | '));
  await b.close(); srv.close();
}
(async () => { if (process.argv.includes('--browser')) await browser(); console.log(fail ? `✗ ${fail} problem(s)` : `✓ all ${pass} checks passed`); process.exit(fail ? 1 : 0) })();
