// v98.430 · the placeable-picture catalogue (js/placeable-art.js) is complete and up to date
// node tools/test-placeable-art.cjs
'use strict';
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), { build, FOLDERS, SKIP } = require('./build-placeable-art.cjs');
const cat = build();

// 1 · the generated file matches the tool (run `node tools/build-placeable-art.cjs` after editing names)
global.window = {}; require('../js/placeable-art.js'); const OUT = global.window.PLACEABLE_ART;
assert.equal(OUT.items.length, cat.items.length, 'js/placeable-art.js is stale — run node tools/build-placeable-art.cjs');
assert.deepEqual(OUT.items.map(i => i.src + '|' + i.n + '|' + i.g + '|' + i.tw + '|' + i.sw + '|' + i.sub), cat.items.map(i => i.src + '|' + i.n + '|' + i.g + '|' + i.tw + '|' + i.sw + '|' + i.sub), 'js/placeable-art.js is stale');

// 2 · every picture in the object folders has a name (or is a texture / cut-out / effect on purpose)
const known = new Set(cat.items.map(i => i.src)), missing = [];
for (const f of FOLDERS) for (const n of fs.readdirSync(path.join(ROOT, 'assets', f))) {
  const p = 'assets/' + f + '/' + n; if (!/\.(webp|png)$/.test(n) || SKIP.test(p)) continue;
  if (!known.has(p)) missing.push(p);
}
assert.deepEqual(missing, [], 'pictures without a catalogue row (add them to tools/build-placeable-art.cjs): ' + missing.join(', '));

// 3 · rows are sane: unique art ids, a group from the list, a positive sub-map width, a real size
const subs = new Set(); for (const i of cat.items) { assert.ok(!subs.has(i.sub), 'duplicate art id ' + i.sub); subs.add(i.sub); assert.ok(cat.groups.includes(i.g), i.src + ' group'); assert.ok(i.sw > 0 && i.w > 0 && i.h > 0, i.src + ' size') }

// 4 · the code shapes the sub-maps swap for pictures all point at a catalogue picture
const vp = fs.readFileSync(path.join(ROOT, 'village-place.html'), 'utf8'), swap = vp.match(/const CODE_SWAP = (\{[^}]*\})/);
assert.ok(swap, 'CODE_SWAP in village-place.html'); for (const to of Object.values(Function('return ' + swap[1])())) assert.ok(subs.has(to), 'CODE_SWAP → ' + to + ' is in the catalogue');
// …and the forge/market defaults still exist as code shapes only through that swap (the stations get real pictures)
for (const a of ['code:furnace', 'code:anvil', 'code:tub', 'code:board', 'code:crate', 'code:lamp']) assert.ok(vp.includes(`'${a}': '`), a + ' is swapped');

console.log('placeable art: ' + cat.items.length + ' pictures · ' + cat.groups.length + ' groups · all passed');
