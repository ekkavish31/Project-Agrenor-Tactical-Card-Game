/* v98.526 · js/place-catalog.js: every town has a group, existing maps are matched by name, missing ones get a deterministic key. Run: node tools/test-place-catalog.cjs */
const assert = require('node:assert/strict'), C = require('../js/place-catalog.js');
const all = { forge: { name: 'โรงตีเหล็ก' }, 'm-a': { name: 'สมาคมนักผจญภัย' }, 'm-d': { name: 'บ้านป้าเมย์คนทำขนมปัง' }, 'm-z': { name: 'ห้องลับ' } };
const g = C.groups(all, ['map:home'], 'forge'); let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++ };
ok(g.length === C.TOWNS.length, 'one group per town');
for (const t of ['fernvale', 'brookmere', 'haven', 'northgate', 'lakenhold', 'willowshore', 'deepcairn', 'thornwatch', 'vinehollow']) ok(g.find(x => x.id === t)?.items.length >= 1, t + ' has at least one map');
const fv = g[0].items;
ok(fv.find(i => i.key === 'forge')?.exists && fv.find(i => i.key === 'm-a')?.exists && fv.find(i => i.key === 'm-d')?.exists, 'existing maps matched (forge, guild, May by fuzzy name)');
ok(fv.find(i => i.key === 'm-fernvale-inn')?.exists === false, 'missing maps get a deterministic key');
ok(fv.some(i => i.key === 'm-z'), 'hand-made maps stay listed');
ok(new Set(g.flatMap(x => x.items.map(i => i.key))).size === g.flatMap(x => x.items).length, 'no duplicate keys');
ok(C.template('ทดสอบ', 'haven').town === 'haven', 'template stores the town');
console.log('place catalog: ' + n + ' ok');
