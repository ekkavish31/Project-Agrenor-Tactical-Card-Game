const assert = require('node:assert/strict');
const T = require('../js/terrain-height.js');
let count = 0;
function test(name, fn) { fn(); count++; }
const share = (m, lv) => m.levels.filter(l => l === lv).length / m.levels.length;
const gen = (zone, seed, extra = {}) => T.generate({ w: 40, h: 40, seed, zone, flat: (u, v) => u === 20 || v === 20, ...extra });

test('town and low-severity zones stay flat, severity grows with the zone', () => {
  const nonZero = z => { let t = 0; for (let s = 0; s < 20; s++) t += 1 - share(gen(z, 's' + s), 0); return t / 20; };
  assert.equal(nonZero('town'), 0);
  assert.equal(nonZero('sand'), 0);
  const g = nonZero('grass'), f = nonZero('forest'), h = nonZero('hills'), m = nonZero('mountain');
  assert(g > 0 && g < 0.4, 'grass has gentle mounds only: ' + g);
  assert(g < f && f < h && h < m, 'severity order ' + [g, f, h, m]);
});

test('level cap: 0..3 only, and gentle zones never exceed level 1 or 2', () => {
  for (let s = 0; s < 20; s++) {
    assert(gen('grass', 'a' + s).levels.every(l => l <= 1), 'grass <= 1');
    assert(gen('hills', 'b' + s).levels.every(l => l <= 2), 'hills <= 2');
    assert(gen('snowpeak', 'c' + s).levels.every(l => l <= T.MAX_LEVEL));
    assert(gen('snowpeak', 'd' + s, { maxLevel: 2 }).levels.every(l => l <= 2), 'maxLevel option');
  }
});

test('only cliff zones (mountain / snow peak) get cliffs; gentle zones have none', () => {
  for (let s = 0; s < 20; s++) {
    for (const z of ['town', 'sand', 'grass', 'forest', 'snow', 'hills']) assert.equal(T.cliffEdges(gen(z, 'k' + s)).length, 0, z);
  }
  let cliffs = 0; for (let s = 0; s < 20; s++) cliffs += T.cliffEdges(gen('mountain', 'k' + s)).length;
  assert(cliffs > 0, 'mountains have cliffs');
});

test('100 seeds x 4 zones: every walkable cell stays connected (stairs are carved through cliffs)', () => {
  for (const z of ['hills', 'snow', 'mountain', 'snowpeak']) for (let s = 0; s < 100; s++) {
    const m = gen(z, 'conn' + s), r = T.validate(m);
    assert(r.ok, `${z} seed ${s}: ${JSON.stringify(r)}`);
  }
});

test('forced-flat cells (roads) are level 0 even inside a mountain, and the ground beside them rises by at most one level per cell', () => {
  for (let s = 0; s < 30; s++) {
    const m = gen('snowpeak', 'road' + s), W = m.w;
    for (let i = 0; i < m.levels.length; i++) if (m.flat[i]) assert.equal(m.levels[i], 0);
    for (let v = 0; v < m.h; v++) for (let u = 0; u < W; u++) {
      if (!m.flat[v * W + u]) continue;
      for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = u + du, b = v + dv; if (a < 0 || b < 0 || a >= W || b >= m.h) continue;
        assert(m.levels[b * W + a] <= 1, 'cell next to a road is at most level 1');
      }
    }
  }
});

test('town fade: ground near the town is flat and rises with distance in the same biome', () => {
  const town = { u: 20, v: 20, r0: 6, r1: 24 };
  let near = 0, far = 0;
  for (let s = 0; s < 20; s++) {
    const m = T.generate({ w: 48, h: 48, seed: 'f' + s, zone: 'mountain', town, origin: { u: 0, v: 0 }, anchors: [{ u: 20, v: 20 }] });
    for (let v = 0; v < m.h; v++) for (let u = 0; u < m.w; u++) {
      const d = Math.hypot(u - 20, v - 20), l = m.levels[v * m.w + u];
      if (d <= 5) near = Math.max(near, l); else if (d >= 24) far = Math.max(far, l);
    }
  }
  assert(near <= 1, 'near the town: ' + near);
  assert(far >= 2, 'far from the town: ' + far);
});

test('determinism: same seed and region = same terrain; different seed differs', () => {
  const a = gen('hills', 'same'), b = gen('hills', 'same'), c = gen('hills', 'other');
  assert.deepEqual(Array.from(a.levels), Array.from(b.levels));
  assert.notDeepEqual(Array.from(a.levels), Array.from(c.levels));
});

test('world-coordinate noise: a sub-window of a larger region keeps the same raw ground away from the edges', () => {
  const big = T.generate({ w: 60, h: 60, seed: 'win', zone: 'grass' });
  const win = T.generate({ w: 20, h: 20, seed: 'win', zone: 'grass', origin: { u: 20, v: 20 } });
  let same = 0, total = 0;
  for (let v = 4; v < 16; v++) for (let u = 4; u < 16; u++) { total++; if (big.levels[(v + 20) * 60 + u + 20] === win.levels[v * 20 + u]) same++; }
  assert(same / total > 0.9, 'overlap agreement ' + same / total);
});

test('step rules: 1 level is walkable and costs more going up, 2+ is a cliff, blocked cells stop everyone', () => {
  const m = { w: 3, h: 1, origin: { u: 0, v: 0 }, maxLevel: 3, levels: Uint8Array.from([0, 1, 3]), flat: new Uint8Array(3), blocked: new Uint8Array(3) };
  assert.equal(T.canStep(m, 0, 0, 1, 0), true);
  assert.equal(T.stepCost(m, 0, 0, 1, 0), 2);   // climb one level: 1 + 1
  assert.equal(T.stepCost(m, 1, 0, -1, 0), 1);  // descend: plain cost
  assert.equal(T.canStep(m, 1, 0, 1, 0), false); // 1 -> 3 is a cliff
  assert.equal(T.stepCost(m, 1, 0, 1, 0), null);
  assert.equal(T.canStep(m, 0, 0, 1, 1), false); // no diagonal steps
  assert.equal(T.canStep(m, 2, 0, 1, 0), false); // out of the map
  m.blocked[1] = 1;
  assert.equal(T.canStep(m, 0, 0, 1, 0), false);
});

test('reachable respects slope cost and cliffs', () => {
  const m = { w: 5, h: 1, origin: { u: 0, v: 0 }, maxLevel: 3, levels: Uint8Array.from([0, 0, 1, 1, 3]), flat: new Uint8Array(5), blocked: new Uint8Array(5) };
  const r = T.reachable(m, 0, 0, 10);
  assert.equal(r['1,0'], 1); assert.equal(r['2,0'], 3); assert.equal(r['3,0'], 4);
  assert.equal(r['4,0'], undefined, 'cliff cell not reachable');
  assert.equal(T.reachable(m, 0, 0, 2)['2,0'], undefined, 'budget respected');
});

test('forScene: flat road from every entry to a centre plaza, all connected, same tile = same ground', () => {
  const entries = [{ u: 0, v: 20 }, { u: 39, v: 20 }, { u: 20, v: 39 }];
  for (const biome of ['grass', 'hills', 'mountain', 'snowpeak']) for (let s = 0; s < 15; s++) {
    const m = T.forScene({ w: 40, h: 40, seed: 'tile|' + s, biome, entries });
    assert(T.validate(m).ok, biome + ' ' + s);
    for (const e of entries) assert.equal(T.levelAt(m, e.u, e.v), 0, 'entry is flat');
    assert.equal(T.levelAt(m, 20, 20), 0);
    const again = T.forScene({ w: 40, h: 40, seed: 'tile|' + s, biome, entries });
    assert.deepEqual(Array.from(m.levels), Array.from(again.levels));
  }
});

test('blocked cells (water) never get stairs through them and are not required to connect', () => {
  const blocked = (u, v) => u >= 10 && u <= 12 && v >= 10 && v <= 30;
  for (let s = 0; s < 20; s++) {
    const m = T.generate({ w: 40, h: 40, seed: 'w' + s, zone: 'hills', blocked });
    for (let v = 10; v <= 30; v++) for (let u = 10; u <= 12; u++) assert.equal(m.blocked[v * 40 + u], 1);
    assert(!T.canStep(m, 9, 20, 1, 0));
  }
});

test('pack / unpack round trip keeps levels, flat and blocked cells', () => {
  const m = gen('mountain', 'pack', { blocked: (u, v) => u === 3 && v < 10 });
  const p = JSON.parse(JSON.stringify(T.pack(m))), r = T.unpack(p);
  assert.deepEqual(Array.from(r.levels), Array.from(m.levels));
  assert.deepEqual(Array.from(r.flat), Array.from(m.flat));
  assert.deepEqual(Array.from(r.blocked), Array.from(m.blocked));
  assert(p.rle.length < m.levels.length, 'run-length is smaller than one char per cell');
  assert.throws(() => T.unpack({ ...p, w: p.w + 1 }), /size mismatch/);
});

test('bad input is rejected', () => {
  assert.throws(() => T.generate({ w: 0, h: 5 }), /at least 1x1/);
  assert.throws(() => T.generate({ w: 5, h: 5, zone: 'lava' }), /unknown terrain zone/);
});

console.log('PASS: ' + count + ' terrain-height tests');
