/* v98.472 · node tools/test-mystery-goat.cjs — main story phase A: the odd extra goat in the goat quest (docs/lore/MAIN-STORY-CANON.md A8).
   It is NOT one of Pip's goats: it never counts toward the quest, never starts the fight, drops its disguise when touched (→ Mip runs off) and is shown once. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const context = new Proxy({}, { get: (o, k) => o[k] || (k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: (o, k, v) => (o[k] = v, true) });
const events = [], seen = { v: false };
const s = { console, URLSearchParams, location: { search: '' }, performance: { now: () => now }, setTimeout, Promise,
  parent: { Story: { questTargets: () => ({ spots: [{ key: 'goats', kind: 'goat', n: 2, near: ['square', 'inn'], flee: true, mystery: true, spread: 7 }] }),
    questEvent: ev => { events.push(ev); return null }, mipSeen: () => seen.v, mystery: ev => { if (ev === 'seen') seen.v = true } } },
  locations: [{ id: 'square' }, { id: 'inn' }], hero: { u: 0, v: 0 }, path: [], scale: 1, zoom: 1, editing: false, W: 800, H: 600, WORLD_W: 100, WORLD_H: 100, pan: { x: 0, y: 0 }, devicePixelRatio: 1,
  blocked: () => false, door: () => ({ u: 14, v: 14 }), project: (u, v) => ({ x: u, y: v }), addEventListener() {}, MonsterArt: { frame: () => null } };
let now = 1000; vm.createContext(s); vm.runInContext(fs.readFileSync('js/town-quest.js', 'utf8'), s);
const tick = (n, step = 100) => { for (let i = 0; i < n; i++) { now += step; s.TownQuest.draw(context, now) } };
tick(3); let list = s.TownQuest.objects(); const real = list.filter(o => !o.mystery), mys = list.filter(o => o.mystery);
assert.equal(real.length, 2, "Pip's two goats"); assert.equal(mys.length, 1, 'one odd goat'); assert.equal(mys[0].flee, false, 'the odd goat does not run like the others');
// far away: it just stands there; no quest event
tick(10); assert.equal(events.length, 0, 'no quest event while it grazes');
// the hero walks up to it → reveal → Mip runs → gone → seen once
const m = mys[0]; s.hero.u = m.u + 3; s.hero.v = m.v; tick(4); assert.ok(m.stare > 0, 'it watches the hero'); assert.equal(m.mode, 'idle');
s.hero.u = m.u + .6; s.hero.v = m.v; tick(1); assert.equal(m.mode, 'reveal', 'touching it drops the disguise'); tick(10); assert.equal(m.mode, 'mip', 'then the mascot runs'); assert.equal(events.length, 0, 'the quest never saw it: no fight, no count');
tick(50); assert.ok(!s.TownQuest.objects().some(o => o.mystery), 'it ran away'); assert.equal(seen.v, true, 'story.mip.seen is set');
tick(5); assert.ok(!s.TownQuest.objects().some(o => o.mystery), 'it never comes back once seen'); assert.equal(s.TownQuest.objects().filter(o => !o.mystery).length, 2, "Pip's goats are untouched");
console.log('✓ mystery goat: not counted · no fight · reveals as Mip · shown once');
