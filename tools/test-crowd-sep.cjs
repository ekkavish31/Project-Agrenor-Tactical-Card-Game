// v98.1187 · js/crowd-sep.js — soft collision: a crammed crowd is spread out, nobody is pushed into a wall, a pinned body (the hero) never moves.
// Usage: node tools/test-crowd-sep.cjs
const path = require('path'); global.localStorage = { getItem: () => null, setItem() { } };
require(path.join(__dirname, '..', 'js', 'crowd-sep.js')); const C = globalThis.CrowdSep;
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 - .5 };
const mk = (id, u, v) => ({ id, u, v, kind: 'adult', set(a, b) { this.u = a; this.v = b } });
const pairs = (arr, d) => { let n = 0; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (Math.hypot(arr[i].u - arr[j].u, arr[i].v - arr[j].v) < d) n++; return n };
let fail = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fail++ };
const A = Array.from({ length: 8 }, (_, i) => mk('n' + i, 10 + rnd() * .3, 10 + rnd() * .3)), hero = { id: 'hero', u: 10, v: 10, kind: 'hero', pin: true };
ok(pairs(A, .8) >= 20, 'start: 8 villagers crammed on one spot (' + pairs(A, .8) + ' overlapping pairs)');
for (let f = 0; f < 120; f++) C.run(1 / 60, { movers: A, pins: [hero], blocked: () => false });
ok(pairs(A, .8) === 0, 'after 2 s: no two bodies overlap');
ok(hero.u === 10 && hero.v === 10, 'the pinned hero did not move');
ok(Math.min(...A.map(a => Math.hypot(a.u - 10, a.v - 10))) >= .78, 'everybody keeps clear of the hero (>= 0.78 cell)');
const B = Array.from({ length: 4 }, (_, i) => mk('b' + i, 10.2 + rnd() * .2, 10 + rnd() * .2));
for (let f = 0; f < 180; f++) C.run(1 / 60, { movers: B, pins: [], blocked: u => u > 10.4 });
ok(B.every(b => b.u <= 10.4), 'nobody was pushed into a blocked cell');
const D = [mk('x', 5, 5), mk('y', 5, 5)]; C.run(1 / 60, { movers: D, pins: [], blocked: () => false }); ok(D[0].u !== D[1].u || D[0].v !== D[1].v, 'two bodies on exactly the same spot split in a stable direction');
const step = Math.hypot(D[0].u - 5, D[0].v - 5); ok(step < .1, 'one frame moves a body only a little (' + step.toFixed(3) + ' cell)');
ok(C.free(20, 20, .4) === true && C.free(5, 5, .4) === false, 'free(): a crowded spot is not free, an empty one is');
console.log(fail ? '\nFAILED ' + fail : '\nall passed'); process.exit(fail ? 1 : 0)
