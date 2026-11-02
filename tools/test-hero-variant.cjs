// v98.70 · hero look variants (js/hero-variant.js): default leaves the sprites untouched; female swaps the standing picture in all 4 directions and fills walk/action.
const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
let n = 0; const test = (name, fn) => { fn(); n++ };
const load = (variant) => {
  const store = variant ? { 'projectA.heroVariant': variant } : {};
  const ctx = { localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v } }, globalThis: null };
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'tactics-sprites.js'), 'utf8') + ';globalThis.TACTICS_SPRITES=TACTICS_SPRITES;\n' + fs.readFileSync(path.join(__dirname, '..', 'js', 'hero-variant.js'), 'utf8');
  const g = { localStorage: ctx.localStorage }; new Function('globalThis', 'localStorage', code.replace(/\}\)\(globalThis\);\s*$/, '})(globalThis);') + ';return globalThis')(g, ctx.localStorage); return g;
};
test('default is the male hero; classic leaves the original sprites untouched', () => {
  let g = load(null); assert.equal(g.HeroVariant.get(), 'male'); assert.equal(g.TACTICS_SPRITES.directions.NW.idle.src, 'assets/characters/hero-male/idle-nw.webp');
  g = load('classic'); assert.equal(g.HeroVariant.get(), 'classic'); assert.match(g.TACTICS_SPRITES.directions.SW.idle.src, /imported\/idle-sw/); assert.equal(g.TACTICS_SPRITES.directions.SW.walk.length, 6);
  for (const d of ['sw', 'se', 'nw', 'ne']) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'characters', 'hero-male', `idle-${d}.webp`)), 'male ' + d)
});
test('female: idle picture replaced in all 4 directions, hand anchors kept, no flipping', () => {
  const g = load('female'), T = g.TACTICS_SPRITES;
  for (const d of ['SW', 'SE', 'NW', 'NE']) { const D = T.directions[d]; assert.equal(D.idle.src, `assets/characters/hero-female/idle-${d.toLowerCase()}.webp`); assert.equal(D.idle.flipImage, false); assert.ok(Array.isArray(D.idle.right) && Array.isArray(D.idle.left), d + ' anchors'); assert.equal(D.idleFrames.length, 1); assert.equal(D.walk.length, d === 'SW' || d === 'SE' ? 12 : 2); assert.equal(D['walk-left'], undefined); assert.equal(D.strike.src, D.idle.src) }
  for (const d of ['sw', 'se', 'nw', 'ne']) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'characters', 'hero-female', `idle-${d}.webp`)), d + ' file exists');
});
test('female walk cycle: 12 real frames for SW, mirrored for SE, files exist', () => {
  const T = load('female').TACTICS_SPRITES.directions;
  assert.ok(T.SW.walk.every(f => /walk-sw-\d\d\.webp$/.test(f.src) && f.flipImage === false)); assert.ok(T.SE.walk.every(f => /walk-sw-\d\d\.webp$/.test(f.src) && f.flipImage === true));
  for (const f of T.SW.walk) assert.ok(fs.existsSync(path.join(__dirname, '..', f.src)), f.src); assert.ok(T.NW.walk.every(f => /idle-nw/.test(f.src)));
});
test('unknown value falls back to default; set() validates', () => { const g = load('nonsense'); assert.equal(g.HeroVariant.get(), 'male'); assert.equal(g.HeroVariant.set('nope'), false); assert.equal(g.HeroVariant.set('female'), true); assert.equal(g.HeroVariant.get(), 'female') });
console.log(`hero-variant: ${n} tests passed`);
