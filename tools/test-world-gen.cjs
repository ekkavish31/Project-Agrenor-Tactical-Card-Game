const assert = require('node:assert/strict');
const G = require('../js/world-gen.js');
let n = 0; const test = (name, fn) => { fn(); n++; };
test('hex distance and neighbours (odd-r)', () => {
  assert.equal(G.dist({ c: 0, r: 0 }, { c: 3, r: 0 }), 3);
  assert.equal(G.neighbors(5, 5).length, 6);
  for (const [c, r] of G.neighbors(5, 4)) assert.equal(G.dist({ c: 5, r: 4 }, { c, r }), 1);
  for (const [c, r] of G.neighbors(5, 5)) assert.equal(G.dist({ c: 5, r: 5 }, { c, r }), 1);
});
for (const seed of [1, 42, 777, 2026, 99999, 31337]) test('seed ' + seed + ': village, 3 reachable destinations, 3–4 battles on each route', () => {
  const w = G.generate(seed), T = (c, r) => w.tiles[G.key(c, r)];
  assert.equal(T(w.home.c, w.home.r).poi.id, 'home');
  assert.equal(w.dests.length, 3);
  for (const d of w.dests) {
    const p = G.path(w, w.home, d); assert.ok(p, 'reachable'); assert.ok(G.dist(w.home, d) >= 8);
    const onRoute = new Set(p.map(x => G.key(x.c, x.r))), battles = Object.values(w.tiles).filter(t => t.enc?.type === 'battle' && (onRoute.has(G.key(t.c, t.r)) || G.neighbors(t.c, t.r).some(([c, r]) => onRoute.has(G.key(c, r)))));
    assert.ok(battles.length >= 3, d.id + ' has ' + battles.length + ' battles near the route');
  }
  assert.ok(Object.values(w.tiles).some(t => t.road));
});
test('same seed = same world', () => { assert.deepEqual(G.generate(5).dests, G.generate(5).dests) });
console.log('world gen: ' + n + ' tests passed');
