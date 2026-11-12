// Exercise the actual quest scene renderer: states select the imported poses,
// rest remembers facing, and mirroring happens once, inside MonsterArt.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const calls = [], flips = [];
const context = new Proxy({}, { get: (o, k) => o[k] || (k === 'measureText' ? () => ({ width: 10 }) : k === 'scale' ? (x, y) => flips.push([x, y]) : () => {}), set: (o, k, v) => (o[k] = v, true) });
const s = { console, URLSearchParams, location: { search: '' }, performance: { now: () => 1000 },
  parent: { Story: { questTargets: () => ({ spots: [{ key: 'goats', kind: 'goat', n: 1, near: ['square'], flee: true }] }) } },
  locations: [{ id: 'square' }], hero: { u: 0, v: 0 }, path: [], scale: 1, zoom: 1, editing: false,
  W: 800, H: 600, WORLD_W: 100, WORLD_H: 100, pan: { x: 0, y: 0 }, devicePixelRatio: 1,
  blocked: () => false, door: () => ({ u: 12, v: 12 }), project: (u, v) => ({ x: u, y: v }), addEventListener() {},
  MonsterArt: { frame(kind, dir, state) { calls.push({ kind, dir, pose: state.pose }); return { image: {}, sw: 512, sh: 512, sx: 0, sy: 0, pivot: [.5, .95], flip: ['SW', 'NW'].includes(dir) }; } } };
vm.createContext(s); vm.runInContext(fs.readFileSync('js/town-quest.js', 'utf8'), s);
s.TownQuest.draw(context, 1000);
const goat = s.TownQuest.objects()[0]; assert(goat);
for (const [mode, dir, pose, face] of [
  ['run', { du: 1, dv: 0 }, 'run', 'SE'],
  ['run', { du: 0, dv: -1 }, 'run', 'NE'],
  ['rest', null, 'pant', 'NE'],
  ['idle', null, 'graze', 'NE'],
  ['run', { du: -1, dv: 0 }, 'run', 'NW'],
  ['rest', null, 'pant', 'NW'],
]) {
  goat.mode = mode; goat.dir = dir; flips.length = 0;
  s.TownQuest.sorted(1000)[0].draw(context);
  assert.equal(calls.at(-1).pose, pose); assert.equal(calls.at(-1).dir, face);
  assert.equal(flips.length, face === 'NW' ? 1 : 0, 'must not mirror twice');
}
console.log('PASS: quest goats use run/pant/graze, remember facing and mirror once.');
