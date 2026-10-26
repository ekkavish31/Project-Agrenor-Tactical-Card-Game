const assert = require('node:assert/strict');
const fs = require('node:fs');
const G = require('../js/village-grid.js');
let count = 0;
function test(name, fn) { fn(); count++; }
const near = (a, b, eps = 1e-9) => assert(Math.abs(a - b) <= eps, `${a} !~ ${b}`);
// small deterministic generator so failures are reproducible
let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const rr = (a, b) => a + rnd() * (b - a);

test('modes: 2x2 is the default and steps are 0.5 / 0.25 cell', () => {
  assert.equal(G.DEFAULT_MODE, '2x2');
  assert.deepEqual(G.MODES.slice().sort(), ['2x2', '4x4']);
  assert.equal(G.stepCells('2x2'), 0.5);
  assert.equal(G.stepCells('4x4'), 0.25);
  assert.throws(() => G.stepCells('3x3'));
});

test('snapCell rounds to the nearest line, never returns -0, error stays within half a step', () => {
  assert.equal(G.snapCell(0.3, '2x2'), 0.5);
  assert.equal(G.snapCell(0.2, '2x2'), 0);
  assert.equal(G.snapCell(0.1, '2x2'), 0);
  assert.equal(G.snapCell(0.13, '4x4'), 0.25);
  assert(Object.is(G.snapCell(-0.01, '2x2'), 0), 'negative zero');
  for (let i = 0; i < 2000; i++) {
    const v = rr(-60, 60);
    assert(Math.abs(G.snapCell(v, '2x2') - v) <= 0.25 + 1e-12);
    assert(Math.abs(G.snapCell(v, '4x4') - v) <= 0.125 + 1e-12);
  }
});

test('grids are nested and snapping is idempotent', () => {
  for (let i = 0; i < 2000; i++) {
    const v = rr(-60, 60), a = G.snapCell(v, '2x2');
    assert.equal(G.snapCell(a, '4x4'), a, 'a 2x2 point is already a 4x4 point');
    assert.equal(G.snapCell(a, '2x2'), a);
    const b = G.snapCell(v, '4x4');
    assert.equal(G.snapCell(b, '4x4'), b);
  }
});

test('project/unproject match village-town.html and round-trip', () => {
  const html = fs.readFileSync(__dirname + '/../village-town.html', 'utf8');
  assert(html.includes('function project(u,v,z=0){return{x:2240+(u-v)*28,y:1232+(u+v)*14-z}}'), 'project() changed in village-town.html');
  assert(html.includes('function inv(x,y){return{u:((x-2240)/28+(y-1232)/14)/2,v:((y-1232)/14-(x-2240)/28)/2}}'), 'inv() changed in village-town.html');
  for (let i = 0; i < 500; i++) {
    const u = rr(-40, 40), v = rr(-40, 40), p = G.project(u, v), q = G.unproject(p.x, p.y);
    near(q.u, u, 1e-9); near(q.v, v, 1e-9);
  }
  const p = G.project(0, 0); assert.deepEqual([p.x, p.y], [2240, 1232]);
  assert.equal(G.project(1, 0).x - G.project(0, 0).x, 28);
  assert.equal(G.project(1, 0).y - G.project(0, 0).y, 14);
});

test('offsetToWorld follows canonical() for SE-facing owners (axes swap) and round-trips', () => {
  const html = fs.readFileSync(__dirname + '/../village-town.html', 'utf8');
  assert(html.includes("function canonical(o,u,v){const a=center(o);return o.facing==='SE'?{u:a.u+v-a.v,v:a.v+u-a.u}:{u,v}}"), 'canonical() changed in village-town.html');
  for (let i = 0; i < 500; i++) {
    const c = { u: rr(-30, 30), v: rr(-30, 30) }, du = rr(-12, 12), dv = rr(-12, 12);
    for (const mirror of [false, true]) {
      const w = G.offsetToWorld(c, mirror, du, dv);
      const lu = c.u + du, lv = c.v + dv; // the local absolute position canonical() receives
      const e = mirror ? { u: c.u + lv - c.v, v: c.v + lu - c.u } : { u: lu, v: lv };
      near(w.u, e.u); near(w.v, e.v);
      const back = G.worldToOffset(c, mirror, w.u, w.v);
      near(back.du, du); near(back.dv, dv);
    }
  }
});

test('snapOffset puts the item on the world lattice for any owner centre and facing', () => {
  for (const mode of ['2x2', '4x4']) {
    const step = G.stepCells(mode);
    for (let i = 0; i < 1000; i++) {
      const c = { u: rr(-30, 30), v: rr(-30, 30) }, du = rr(-12, 12), dv = rr(-12, 12), mirror = rnd() < 0.5;
      const r = G.snapOffset(c, mirror, du, dv, mode);
      const w = G.offsetToWorld(c, mirror, r.du, r.dv);
      near(w.u / step, Math.round(w.u / step), 1e-7); near(w.v / step, Math.round(w.v / step), 1e-7);
      assert(r.movePx <= (mode === '2x2' ? 14.0001 : 7.0001), `move ${r.movePx}px too large in ${mode}`);
      const again = G.snapOffset(c, mirror, r.du, r.dv, mode);
      assert(again.movePx < 1e-6, 'second snap must not move the item');
    }
  }
});

test('an item already on 2x2 does not move when switching to 4x4', () => {
  const c = { u: 3.37, v: -8.91 };
  const a = G.snapOffset(c, true, 2.2, -1.9, '2x2');
  const b = G.snapOffset(c, true, a.du, a.dv, '4x4');
  assert(b.movePx < 1e-6);
});

test('planResnap reports moves without touching its input', () => {
  const items = [
    { id: 'a', kind: 'added', centre: { u: 0, v: 0 }, mirror: false, du: 0.2, dv: 0.9 },
    { id: 'b', kind: 'entry', centre: { u: 5.3, v: 1.1 }, mirror: true, du: -1.8, dv: 2.2 },
    { id: 'c', kind: 'court', centre: { u: 0, v: 0 }, mirror: false, du: 1, dv: 1 }
  ];
  const snapshot = JSON.stringify(items);
  const plan = G.planResnap(items, '2x2');
  assert.equal(JSON.stringify(items), snapshot);
  assert.equal(plan.count, 3);
  assert.equal(plan.moves[2].movePx, 0, 'c is already on the grid');
  assert.equal(plan.moved, 2);
  assert(plan.maxPx >= plan.p90Px && plan.p90Px >= 0 && plan.meanPx > 0);
  assert.equal(G.planResnap([], '4x4').count, 0);
});

test('footprints: touching edges do not overlap, shared area does', () => {
  const a = G.rectFromCells(0, 0, 2, 1), b = G.rectFromCells(2, 0, 1, 1), c = G.rectFromCells(1.5, 0.5, 1, 1);
  assert.deepEqual(a, { iu: 0, iv: 0, w: 8, h: 4 });
  assert.equal(G.overlaps(a, b), false);
  assert.equal(G.overlaps(a, c), true);
  assert.equal(G.overlaps(b, c), true);
  assert.deepEqual(G.findOverlaps(c, [a, b]), [a, b]);
  assert.deepEqual(G.findOverlaps(G.rectFromCells(9, 9, 1, 1), [a, b]), []);
});

test('real data: every road point in the saved village layout already sits on the lattice', () => {
  const src = fs.readFileSync(__dirname + '/../js/village-layout-v67.js', 'utf8');
  const win = {}; new Function('window', src)(win);
  const pts = win.VillageDefaultLayout.roads.flat();
  assert(pts.length > 0);
  for (const p of pts) {
    const c = G.unproject(p.x, p.y);
    for (const mode of ['2x2', '4x4']) {
      near(c.u, G.snapCell(c.u, mode), 1e-6); near(c.v, G.snapCell(c.v, mode), 1e-6);
    }
  }
});

console.log(`grid phase 1: ${count} tests passed`);
