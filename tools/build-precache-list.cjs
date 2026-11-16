// v98.579 · builds data/precache-list.json = the pictures the game REALLY requests, in priority order (village first, then the sub-maps, then the fights).
// It opens each scene in headless Chromium, walks around a little, and records every picture response.  js/precache.js downloads this list in the background (sw.js cache).
// Run: node tools/build-precache-list.cjs   (needs Playwright + a static server on :8765 serving the repo root)
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/', OUT = path.join(__dirname, '..', 'data', 'precache-list.json');
const B = 'battle=1&embed=1&imm=1&noflee=1&warm=1';
const GROUPS = [
  ['village', ['village-town.html']],
  ['places', ['village-place.html?place=market', 'village-place.html?place=forge', 'village-place.html?place=home']],
  ['fights', ['battle-field.html?scene=goatStreet&' + B + '&tut=goat&r=6&biome=grass&seed=4101&ms=goat*1,goat*1', 'battle-field.html?scene=hungerPit&' + B + '&r=9&biome=hills&seed=1', 'battle-field.html?scene=moonGuard&' + B + '&r=9&biome=hills&seed=1', 'battle-field.html?scene=campDefense&' + B + '&r=7&biome=grass&seed=1', 'battle-field.html?scene=convoyPass&' + B + '&r=7&biome=hills&seed=1', 'battle-field.html?' + B + '&tut=pumpkin&r=6&biome=grass&poi=patch&seed=4102&ms=pumpkin*1,pest*1', 'battle-field.html?' + B + '&r=6&biome=forest&seed=7&ms=wolf*1,bandit*1']]
];
(async () => {
  const b = await chromium.launch(), seen = new Map(), out = [];
  for (const [name, urls] of GROUPS) {
    const files = [];
    for (const u of urls) {
      const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
      p.on('response', r => { try { const url = new URL(r.url()); if (url.origin === new URL(BASE).origin && /\.(webp|png|jpe?g)$/i.test(url.pathname)) { const f = decodeURIComponent(url.pathname.slice(1)); if (!seen.has(f) && /^assets\//.test(f)) { const bytes = +r.headers()['content-length'] || 0; seen.set(f, 1); files.push([f, bytes]) } } } catch (e) { } });
      await p.goto(BASE + u).catch(() => { }); await p.waitForTimeout(7000);
      for (let i = 0; i < 8; i++) { await p.mouse.click(220 + i * 130, 330 + (i % 3) * 70).catch(() => { }); await p.waitForTimeout(1100) }
      await p.close();
    }
    out.push({ name, files }); console.log(name, files.length, 'files', (files.reduce((a, f) => a + f[1], 0) / 1e6).toFixed(1) + ' MB');
  }
  await b.close(); fs.writeFileSync(OUT, JSON.stringify({ v: 1, built: new Date().toISOString().slice(0, 10), groups: out }) + '\n'); console.log('written data/precache-list.json');
})();
