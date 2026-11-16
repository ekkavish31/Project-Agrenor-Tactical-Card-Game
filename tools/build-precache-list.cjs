// v98.579 · builds data/precache-list.json = the pictures the game REALLY requests, in priority order (village first, then the sub-maps, then the fights).
// It opens each scene in headless Chromium, walks around a little, and records every picture response.  js/precache.js downloads this list in the background (sw.js cache).
// Run: node tools/build-precache-list.cjs   (needs Playwright + a static server on :8765 serving the repo root)
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/', OUT = path.join(__dirname, '..', 'data', 'precache-list.json');
/* the place ids: every Fernvale place + the other towns' places (js/place-catalog.js) + the maps saved in js/game-settings.js; the monster kinds: the MON table of js/town-battle.js */
const rd = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const placeIds = (() => { const ids = new Set(); const cat = rd('js/place-catalog.js'); for (const m of cat.matchAll(/\[\s*'([a-z0-9_-]+)'\s*,\s*'[^']*'\s*\]/g)) ids.add(m[1]);
  try { global.window = global; require('../js/game-settings.js'); for (const k of Object.keys(JSON.parse(window.GAME_SETTINGS['place-maps-v1'] || '{}'))) ids.add(k) } catch (e) { } return [...ids].filter(x => /^[a-z0-9_-]{1,40}$/i.test(x)) })();
const kinds = (() => { const t = rd('js/town-battle.js'), i = t.indexOf('const MON = {'), j = t.indexOf('\n  };', i); return [...t.slice(i, j).matchAll(/^    ([a-zA-Z0-9_]+): \{ name:/gm)].map(m => m[1]) })();
const chunks = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o };
const B = 'battle=1&embed=1&imm=1&noflee=1&warm=1';
const SCENES = ['goatStreet', 'hungerPit', 'moonGuard', 'campDefense', 'convoyPass', 'dragonLair'];
const GROUPS = [
  ['village', ['village-town.html']],
  ['places', ['market', 'forge', 'home'].map(x => 'village-place.html?place=' + x)],
  ['fights', [...SCENES.map(sc => 'battle-field.html?scene=' + sc + '&' + B + '&r=9&biome=hills&seed=1' + (sc === 'goatStreet' ? '&tut=goat&ms=goat*1,goat*1' : '')), 'battle-field.html?' + B + '&tut=pumpkin&r=6&biome=grass&poi=patch&seed=4102&ms=pumpkin*1,pest*1', 'battle-field.html?' + B + '&r=6&biome=forest&seed=7&ms=wolf*1,bandit*1']],
  /* v98.580 · everything else: all the other sub-maps, every biome, every monster kind (4 per fight page) */
  ['places-all', placeIds.filter(x => !['market', 'forge', 'home'].includes(x)).map(x => 'village-place.html?place=' + x)],
  ['fights-all', [...['forest', 'grass', 'hills', 'swamp', 'snow', 'sand'].map((bi, i) => 'battle-field.html?' + B + '&r=6&biome=' + bi + '&seed=' + (11 + i) + '&ms=wolf*1,bandit*1'), ...chunks(kinds, 4).map((k, i) => 'battle-field.html?' + B + '&r=6&biome=grass&seed=' + (31 + i) + '&ms=' + k.map(x => x + '*1').join(','))]]
];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, POOL = +process.env.POOL || 3;
(async () => {
  const b = await chromium.launch(), seen = new Map(), out = []; let old = { groups: [] }; try { old = JSON.parse(fs.readFileSync(OUT, 'utf8')) } catch (e) { }
  const keep = ONLY ? old.groups.filter(g => !ONLY.includes(g.name)) : []; for (const g of keep) for (const [f] of g.files) seen.set(f, 1); out.push(...keep);
  for (const [name, urls] of GROUPS) {
    if (ONLY && !ONLY.includes(name)) continue;
    const files = [], run = async u => {
      const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
      p.on('response', r => { try { const url = new URL(r.url()); if (url.origin === new URL(BASE).origin && /\.(webp|png|jpe?g)$/i.test(url.pathname)) { const f = decodeURIComponent(url.pathname.slice(1)); if (!seen.has(f) && /^assets\//.test(f)) { const bytes = +r.headers()['content-length'] || 0; seen.set(f, 1); files.push([f, bytes]) } } } catch (e) { } });
      await p.goto(BASE + u).catch(() => { }); await p.waitForTimeout(/^village-town/.test(u) ? 7000 : 4500);
      for (let i = 0; i < (/^village-town/.test(u) ? 8 : 3); i++) { await p.mouse.click(220 + i * 130, 330 + (i % 3) * 70).catch(() => { }); await p.waitForTimeout(900) }
      await p.close();
    };
    const q = urls.slice(); await Promise.all(Array.from({ length: Math.min(POOL, q.length) }, async () => { while (q.length) await run(q.shift()) }));
    out.push({ name, files }); console.log(name, urls.length + ' pages', files.length, 'new files', (files.reduce((a, f) => a + f[1], 0) / 1e6).toFixed(1) + ' MB');
  }
  await b.close(); const order = GROUPS.map(g => g[0]); out.sort((x, y) => order.indexOf(x.name) - order.indexOf(y.name));
  fs.writeFileSync(OUT, JSON.stringify({ v: 1, built: new Date().toISOString().slice(0, 10), groups: out }) + '\n'); console.log('written data/precache-list.json · places', placeIds.length, '· monster kinds', kinds.length);
})();
