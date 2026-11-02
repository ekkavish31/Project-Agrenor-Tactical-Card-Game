// v98.76 · Asset Studio hero looks (js/studio-variants.js) + studio edits applied by the game (js/hero-variant.js).
const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
let n = 0; const test = (name, fn) => { fn(); n++ };
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const clone = x => JSON.parse(JSON.stringify(x));
const loadSV = () => { const g = {}; new Function('globalThis', read('js/studio-variants.js'))(g); return g.StudioVariants };
const cfg = (...srcs) => ({ version: 1, loop: true, frames: srcs.map(src => ({ src, ms: 80 })) });
const base = () => ({ assets: [{ id: 'a' }], studioWalks: { SE: cfg('classic-se.png') }, studioWalkMirrors: { SW: 'SE' }, studioPoses: { idle: { SE: cfg('classic-idle.png') } }, other: 1 });

test('classic open, nothing else: canonical returns the manifest unchanged', () => { const V = loadSV(), M = base(); assert.equal(V.canonical(M), M) });
test('switching away and back loses nothing', () => {
  const V = loadSV(), M = base(), before = clone(M);
  assert.ok(V.switchTo(M, 'male')); assert.equal(M.studioWalks, undefined); assert.equal(V.active, 'male');
  M.studioWalks = { NE: cfg('m-ne.webp') };                       // an edit made while the male look is open
  assert.ok(V.switchTo(M, 'classic')); assert.deepEqual(M.studioWalks, before.studioWalks); assert.deepEqual(M.studioPoses, before.studioPoses);
  assert.deepEqual(M.heroVariants.male.studioWalks, { NE: cfg('m-ne.webp') });
});
test('canonical while a look is open: top level is the ORIGINAL hero, the open look goes to heroVariants', () => {
  const V = loadSV(), M = base(), before = clone(M);
  V.switchTo(M, 'female'); M.studioWalks = { SW: cfg('f-sw.webp') }; M.studioWalkMirrors = { SE: 'SW' };
  const c = V.canonical(M);
  assert.deepEqual(c.studioWalks, before.studioWalks); assert.deepEqual(c.studioWalkMirrors, before.studioWalkMirrors); assert.deepEqual(c.studioPoses, before.studioPoses);
  assert.deepEqual(c.heroVariants.female.studioWalks, { SW: cfg('f-sw.webp') }); assert.deepEqual(c.heroVariants.female.studioWalkMirrors, { SE: 'SW' });
  assert.equal(c.heroVariants.classic, undefined); assert.equal(c.other, 1); assert.equal(c.assets, M.assets);
  assert.equal(M.studioWalks.SW.frames.length, 1, 'canonical() must not change M');
});
test('a look with no edits leaves no trace in the saved manifest', () => {
  const V = loadSV(), M = base(), before = clone(M);
  V.switchTo(M, 'male'); V.switchTo(M, 'female'); V.switchTo(M, 'classic');
  assert.deepEqual(V.canonical(M), before);
});
test('heroVariants loaded from disk survive a classic save and are opened by switchTo', () => {
  const V = loadSV(), M = base(); M.heroVariants = { male: { studioWalks: { NE: cfg('x.webp') } } };
  assert.deepEqual(V.canonical(M).heroVariants, M.heroVariants);
  V.switchTo(M, 'male'); assert.deepEqual(M.studioWalks, { NE: cfg('x.webp') }); assert.equal(M.heroVariants.male, undefined);
  assert.deepEqual(V.canonical(M).heroVariants.male.studioWalks, { NE: cfg('x.webp') });
});
test('round trip through canonical + reload (what a save does)', () => {
  const V = loadSV(), M = base(); V.switchTo(M, 'male'); M.studioPoses = { strike: { SE: cfg('s.webp') } };
  const onDisk = clone(V.canonical(M)); const V2 = loadSV(); const M2 = onDisk;
  assert.deepEqual(V2.canonical(M2), onDisk); V2.switchTo(M2, 'male'); assert.deepEqual(M2.studioPoses, { strike: { SE: cfg('s.webp') } });
});
// tactics-sprites.js + hero-variant.js run in ONE scope, like two <script> tags on a page; `manifest` is the page's window.ASSET_MANIFEST
const page = (variant, manifest) => { const store = { 'projectA.heroVariant': variant }, g = { localStorage: { getItem: k => store[k] ?? null, setItem() { } }, ASSET_MANIFEST: manifest };
  new Function('globalThis', 'localStorage', read('js/tactics-sprites.js') + ';globalThis.TACTICS_SPRITES=TACTICS_SPRITES;\n' + read('js/hero-variant.js'))(g, g.localStorage); return g.TACTICS_SPRITES.directions };
test('game: a look with studio edits shows them, other directions keep the look’s own pictures', () => {
  const T = page('male', { assets: [], heroVariants: { male: { studioWalks: { SE: { frames: [{ src: 'edited-1.webp', ms: 50 }, { src: 'edited-2.webp', ms: 50 }] } }, studioPoses: { strike: { NE: { frames: [{ src: 'strike-ne.webp', ms: 90 }] } } } } } });
  assert.deepEqual(T.SE.walk.map(f => f.src), ['edited-1.webp', 'edited-2.webp']); assert.equal(T.SE.walk[0].ms, 50);
  assert.ok(T.NE.walk.every(f => /hero-male\/walk-ne-\d\d\.webp$/.test(f.src)), 'NE keeps the male default walk');
  assert.ok(T.SW.walk.every(f => /hero-male\/walk-se-\d\d\.webp$/.test(f.src) && f.flipImage), 'SW is still the mirrored default (no edit for it)');
  assert.equal(T.NE.idle.src, 'assets/characters/hero-male/idle-ne.webp'); assert.equal(T.NE.strike.src, 'strike-ne.webp');
  assert.equal(T.SE.strike.src, 'assets/characters/hero-male/idle-se.webp', 'poses without an edit stay the standing picture');
});
test('game: edits of one look never leak into another', () => {
  const T = page('female', { assets: [], heroVariants: { male: { studioWalks: { SE: { frames: [{ src: 'male-only.webp' }] } } } } });
  assert.ok(Object.values(T).every(D => D.walk.every(f => !/male-only/.test(f.src))));
});
test('game: no edits → identical to the plain look (nothing is rebuilt)', () => {
  assert.equal(JSON.stringify(page('female', { assets: [], heroVariants: {} })), JSON.stringify(page('female', undefined)));
});
console.log(`studio-variants: ${n} tests passed`);
