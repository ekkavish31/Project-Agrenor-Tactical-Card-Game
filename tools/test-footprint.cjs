const assert = require('node:assert/strict');
const G = require('../js/village-grid.js');
const F = require('../js/village-footprint.js');
let n = 0; const test = (name, fn) => { fn(); n++; };
const mk = (id, w, d, facing = 'SW', fp) => ({ id, w, d, facing, ...(fp ? { fp } : {}) });

test('default footprint rounds the old half sizes outward to half a cell', () => {
  assert.deepEqual(F.defaultFp(mk('a', 3.4, 3.6)), { u0: 3.5, u1: 3.5, v0: 4, v1: 4 });
  assert.deepEqual(F.defaultFp(mk('b', 2.6, 2.6)), { u0: 3, u1: 3, v0: 3, v1: 3 });
  assert.deepEqual(F.defaultFp(mk('c', 4, 4.2)), { u0: 4, u1: 4, v0: 4.5, v1: 4.5 });
});

test('fpOf uses a valid saved fp (snapped to half a cell) and ignores a broken one', () => {
  const o = mk('a', 3, 3, 'SW', { u0: 1.3, u1: 2, v0: 2, v1: 2 });
  assert.deepEqual(F.fpOf(o), { u0: 1.5, u1: 2, v0: 2, v1: 2 });
  assert.deepEqual(F.fpOf(mk('a', 3, 3, 'SW', { u0: -1, u1: 2, v0: 2, v1: 2 })), F.defaultFp(mk('a', 3, 3)));
  assert.deepEqual(F.fpOf(mk('a', 3, 3, 'SW', { u0: 'x' })), F.defaultFp(mk('a', 3, 3)));
  assert.equal(F.isCustom(o), true);
  assert.equal(F.isCustom(mk('a', 3, 3)), false);
});

test('SE-facing places swap the two axes in the world (same as canonical())', () => {
  const fp = { u0: 1, u1: 2, v0: 3, v1: 4 }, c = { u: 10, v: 20 };
  const sw = F.worldRect(mk('a', 1, 1, 'SW'), c, fp), se = F.worldRect(mk('a', 1, 1, 'SE'), c, fp);
  assert.deepEqual(sw, G.rectFromCells(9, 17, 3, 7));
  assert.deepEqual(se, G.rectFromCells(7, 19, 7, 3));
});

test('touching places do not collide, overlapping ones do', () => {
  const a = mk('a', 2, 2), b = mk('b', 2, 2);
  const ra = F.worldRect(a, { u: 0, v: 0 }), rb = F.worldRect(b, { u: 4, v: 0 }), rc = F.worldRect(b, { u: 3.5, v: 0 });
  assert.equal(G.overlaps(ra, rb), false);
  assert.equal(G.overlaps(ra, rc), true);
  assert.deepEqual(F.hits(rc, [{ id: 'a', rect: ra }]), ['a']);
});

test('nearestFree: free spot stays; blocked spot slides flush against the neighbour', () => {
  const a = mk('a', 2, 2), me = mk('me', 2, 2);
  const others = [{ id: 'a', rect: F.worldRect(a, { u: 0, v: 0 }) }];
  const make = c => F.worldRect(me, c);
  const free = F.nearestFree(make, { u: 10, v: 0 }, others, '2x2');
  assert.deepEqual([free.u, free.v, free.moved], [10, 0, false]);
  const r = F.nearestFree(make, { u: 3, v: 0.5 }, others, '2x2');   // overlaps a by 1 cell
  assert.equal(r.moved, true); assert.deepEqual(r.hit, ['a']);
  assert.equal(G.overlaps(make({ u: r.u, v: r.v }), others[0].rect), false);
  assert.equal(r.u, 4); assert.equal(r.v, 0.5);                       // shortest slide: out along u, v kept; touching edge
  for (const mode of ['1x1', '2x2']) {
    const q = F.nearestFree(make, { u: 1, v: 1 }, others, mode);
    assert(Math.abs(q.u / G.stepCells(mode) - Math.round(q.u / G.stepCells(mode))) < 1e-9, 'result stays on the lattice');
  }
});

test('nearestFree always finds a spot in a crowded row and never overlaps', () => {
  const me = mk('me', 1, 1), others = [];
  for (let i = -3; i <= 3; i++) others.push({ id: 'o' + i, rect: F.worldRect(mk('o' + i, 1, 1), { u: i * 2, v: 0 }) });
  const r = F.nearestFree(c => F.worldRect(me, c), { u: 0, v: 0 }, others, '2x2');
  assert(F.hits(F.worldRect(me, { u: r.u, v: r.v }), others).length === 0);
});

test('edit helpers: pull one edge in, pull everything in, never below half a cell', () => {
  let fp = { u0: 3, u1: 3, v0: 3, v1: 3 };
  assert.deepEqual(F.nudgeEdge(fp, 'u1', -0.5), { u0: 3, u1: 2.5, v0: 3, v1: 3 });
  assert.deepEqual(F.nudgeAll(fp, -0.5), { u0: 2.5, u1: 2.5, v0: 2.5, v1: 2.5 });
  assert.equal(F.nudgeEdge({ u0: 0.5, u1: 1, v0: 1, v1: 1 }, 'u0', -5).u0, 0.5);
  assert.equal(F.nudgeEdge(fp, 'v1', 99).v1, F.MAX);
});

test('automatic footprint: width = one side of the base, height/2 = the other (56px per cell across)', () => {
  const f = F.autoFromArt(448, 336);                     // 8 cells x 6 cells -> halves 4 and 3
  assert.deepEqual(f, { u0: 4, u1: 4, v0: 3, v1: 3 });
  assert.deepEqual(F.autoFromArt(400, 300), { u0: 4, u1: 4, v0: 3, v1: 3 });   // 7.14 / 5.36 cells -> halves 3.57 / 2.68 rounded outward to 4 / 3
  const o = { id: 'a', w: 1, d: 1, facing: 'SW', fpAuto: f };
  assert.deepEqual(F.defaultFp(o), f);
  assert.deepEqual(F.fpOf(o), f);
  assert.deepEqual(F.fpOf({ ...o, fp: { u0: 1, u1: 1, v0: 1, v1: 1 } }), { u0: 1, u1: 1, v0: 1, v1: 1 });
  assert.deepEqual(F.defaultFp({ id: 'b', w: 2, d: 2, facing: 'SW', fpAuto: { u0: -1 } }), { u0: 2, u1: 2, v0: 2, v1: 2 }, 'a broken fpAuto falls back to w,d');
  assert.equal(F.isCustom(o), false);
});

test('corners lists the four world corners of a rect', () => {
  const c = F.corners(G.rectFromCells(1, 2, 3, 4));
  assert.deepEqual(c, [{ u: 1, v: 2 }, { u: 4, v: 2 }, { u: 4, v: 6 }, { u: 1, v: 6 }]);
});

console.log(`footprint: ${n} tests passed`);
