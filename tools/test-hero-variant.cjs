// v98.70 · hero look variants (js/hero-variant.js): default leaves the sprites untouched; female swaps the standing picture in all 4 directions and fills walk/action.
const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
let n = 0; const test = (name, fn) => { fn(); n++ };
const load = (variant) => {
  const store = variant ? { 'projectA.heroVariant': variant } : {};
  const ctx = { localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v } }, globalThis: null };
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'tactics-sprites.js'), 'utf8') + ';globalThis.TACTICS_SPRITES=TACTICS_SPRITES;\n' + fs.readFileSync(path.join(__dirname, '..', 'js', 'hero-variant.js'), 'utf8');
  const g = { localStorage: ctx.localStorage }; new Function('globalThis', 'localStorage', code.replace(/\}\)\(globalThis\);\s*$/, '})(globalThis);') + ';return globalThis')(g, ctx.localStorage); return g;
};
test('default: sprites untouched', () => { const g = load(null); assert.equal(g.HeroVariant.get(), 'default'); assert.match(g.TACTICS_SPRITES.directions.SW.idle.src, /imported\/idle-sw/); assert.equal(g.TACTICS_SPRITES.directions.SW.walk.length, 6) });
test('female: idle picture replaced in all 4 directions, hand anchors kept, no flipping', () => {
  const g = load('female'), T = g.TACTICS_SPRITES;
  for (const d of ['SW', 'SE', 'NW', 'NE']) { const D = T.directions[d]; assert.equal(D.idle.src, `assets/characters/hero-female/idle-${d.toLowerCase()}.webp`); assert.equal(D.idle.flipImage, false); assert.ok(Array.isArray(D.idle.right) && Array.isArray(D.idle.left), d + ' anchors'); assert.equal(D.idleFrames.length, 1); assert.equal(D.walk.length, 2); assert.equal(D['walk-left'], undefined); assert.equal(D.strike.src, D.idle.src) }
  for (const d of ['sw', 'se', 'nw', 'ne']) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'characters', 'hero-female', `idle-${d}.webp`)), d + ' file exists');
});
test('unknown value falls back to default; set() validates', () => { const g = load('nonsense'); assert.equal(g.HeroVariant.get(), 'default'); assert.equal(g.HeroVariant.set('nope'), false); assert.equal(g.HeroVariant.set('female'), true); assert.equal(g.HeroVariant.get(), 'female') });
console.log(`hero-variant: ${n} tests passed`);
