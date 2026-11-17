/* v98.444 · node tools/test-studio-roster.cjs — everything that walks / fights in the game is in Asset Studio › Animation
   friends (village-life ALLY_STATS) → "ตัวละคร" · every other villager → "NPC ชาวบ้าน" · every monster of js/town-battle.js → "มอนสเตอร์ / มินิบอส / บอส" with a Thai name */
'use strict';
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
globalThis.window = globalThis; require('../js/studio-people.js'); require('../js/studio-catalog.js');
const { build } = require('./build-studio-people.cjs'), C = globalThis.StudioCatalog, P = globalThis.STUDIO_PEOPLE, E = globalThis.STUDIO_ENEMIES;
assert.deepEqual(P, build(), 'js/studio-people.js is stale — run node tools/build-studio-people.cjs');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/asset-manifest.json'), 'utf8')), owners = new Map();
for (const a of manifest.assets.filter(x => x.status !== 'unused')) { const o = C.owner(a, E); (owners.get(o.id) || owners.set(o.id, { ...o, n: 0 }).get(o.id)).n++ }
// friends
for (const [k, name] of Object.entries(P.allies)) { const o = owners.get('ally:' + k); assert.ok(o, `friend ${k} (${name}) has no entity under ตัวละคร`); assert.equal(o.group, 'characters'); assert.equal(o.name, name, `friend ${k} shows its Thai name`); assert.ok(!owners.has('npc:' + k), `${k} is listed twice (also as NPC)`) }
// villagers
for (const [k, name] of Object.entries(P.npcs)) { const o = owners.get('npc:' + k); assert.ok(o, `villager ${k} (${name}) has no entity under NPC ชาวบ้าน`); assert.equal(o.group, 'npcs') }
// monsters
const tb = fs.readFileSync(path.join(ROOT, 'js/town-battle.js'), 'utf8'), mons = [...tb.matchAll(/^\s*(\w+):\s*\{\s*name:\s*'([^']+)'[^\n]*?img:/gm)].map(m => m[1]);
assert.ok(mons.length >= 17, 'read the monster table');
for (const k of mons) { assert.ok(E[k], `monster ${k} is missing from STUDIO_ENEMIES (js/studio-catalog.js)`); const o = owners.get('enemy:' + k); assert.ok(o, `monster ${k} has no entity`); assert.notEqual(o.name, k, `monster ${k} has a Thai name`); assert.ok(['monsters', 'bosses'].includes(o.group)) }
assert.equal(owners.get('enemy:pumpkinBoss').group, 'bosses', 'the pumpkin boss is under บอส');
console.log(`studio roster: ${Object.keys(P.allies).length} friends · ${Object.keys(P.npcs).length} villagers · ${mons.length} monsters (+${Object.keys(E).length - mons.length} more in the catalog) — all passed`);
