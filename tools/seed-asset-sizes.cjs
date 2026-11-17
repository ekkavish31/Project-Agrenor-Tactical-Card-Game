// v98.576 · seeds 'asset-hero-ratio-v1' (js/asset-size.js): every picture that is placed on a map today gets its size next to the hero (width ÷ hero height on that map).
// Sources: the village (decor + buildings) · the sub-maps (market, forge, home + every saved place map) · the battle props table.   One number per picture:
// the village's own value wins; otherwise the MEDIAN of the other maps.   Writes js/game-settings.js (key asset-hero-ratio-v1) — run:  node tools/seed-asset-sizes.cjs   (needs Playwright + a server on :8765)
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/', GS = path.join(__dirname, '..', 'js', 'game-settings.js');
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }), rows = [];   // [file, ratio, source]
  /* village */
  let p = await ctx.newPage(); await p.goto(BASE + 'village-town.html?edit=1'); await p.waitForTimeout(6000);
  const v = await p.evaluate(() => { const hero = CharSize.VILLAGE_HERO_PX * (MapScale.get('village') || 1) * (CharScaleAdjust?.factor('village', 'hero') || 1), out = [];
    for (const [n, [, w]] of Object.entries(VillageAssetTables.DECOR_W)) out.push(['assets/village-town/decor/' + n + '.png', w / hero]);
    for (const id of Object.keys(artSpecs)) if (BUILDINGS[id]) out.push([BUILDINGS[id], artSpecs[id][0] * 2 / hero]); return { hero, out } });
  console.log('village hero px', v.hero.toFixed(1), 'pictures', v.out.length); v.out.forEach(([f, r]) => rows.push([f, r, 'village'])); await p.close();
  /* sub-maps */
  p = await ctx.newPage(); await p.goto(BASE + 'village-place.html?place=market&edit=1'); await p.waitForTimeout(6000);
  const pm = await p.evaluate(() => { const all = (() => { try { return JSON.parse(localStorage.getItem('place-maps-v1') || '{}') } catch (e) { return {} } })(), out = [], ids = new Set(['market', 'forge', 'home', ...Object.keys(all)]);
    for (const id of ids) { let m = all[id] || (DEFAULTS[id] ? copy(DEFAULTS[id]) : null); if (!m) continue; m = withArt(copy(m));
      const hero = CharSize.VILLAGE_HERO_PX * (MapScale.get('place', id) || 1) * (CharScaleAdjust?.factor('village', 'hero') || 1) * PLACE_CHAR_K;
      for (const o of [...(m.props || []), ...(m.stations || [])]) { if (!o.art || /^code:/.test(o.art)) continue; const src = imgOf(o.art)?.src; if (!src) continue; out.push([new URL(src).pathname.replace(/^\//, ''), (+o.width || 110) * (+o.s || 1) / hero, id]) } }
    return out });
  console.log('sub-map pieces', pm.length); pm.forEach(([f, r, id]) => rows.push([f, r, 'place:' + id])); await p.close();
  /* battle props */
  p = await ctx.newPage(); await p.goto(BASE + 'battle-field.html?battle=1&embed=1&imm=1&noflee=1&warm=1&r=6&biome=grass&seed=1&ms=goat*1'); await p.waitForTimeout(5000);
  const bt = await p.evaluate(() => { const out = []; for (const set of Object.values(PROP_ART)) for (const list of Object.values(set)) for (const sp of list) out.push([PA + sp[0] + '.webp', sp[1] / 109]); return out });
  console.log('battle props', bt.length); bt.forEach(([f, r]) => rows.push([f, r, 'battle'])); await p.close(); await b.close();
  const by = new Map(); for (const [f, r, src] of rows) { if (!by.has(f)) by.set(f, []); by.get(f).push([src, r]) }
  const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2 }, out = {};
  for (const [f, list] of by) { const vil = list.filter(x => x[0] === 'village'); out[f] = +(vil.length ? vil[0][1] : med(list.map(x => x[1]))).toFixed(4) }
  const keys = Object.keys(out).sort(); const sorted = Object.fromEntries(keys.map(k => [k, out[k]]));
  console.log('pictures with a size:', keys.length);
  let t = fs.readFileSync(GS, 'utf8'); const line = ' "asset-hero-ratio-v1": ' + JSON.stringify(JSON.stringify(sorted)), re = /\n "asset-hero-ratio-v1": "(?:[^"\\]|\\.)*",?/;
  if (re.test(t)) t = t.replace(re, '\n' + line + ','); else { const i = t.indexOf('window.GAME_SETTINGS={') + 'window.GAME_SETTINGS={'.length; t = t.slice(0, i) + '\n' + line + ',' + t.slice(i) }
  fs.writeFileSync(GS, t); console.log('written to js/game-settings.js');
})();
