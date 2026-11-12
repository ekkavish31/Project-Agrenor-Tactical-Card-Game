// The real village renderer must use the new NPC files in all four views,
// both when standing and when moving, without missing walk files/code figures.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/asset-manifest.json')));
const loaded = [];
class Image {
  set src(value) { this.srcValue = value; const file = value.split('?')[0]; assert(fs.existsSync(path.join(root, file)), 'Missing image requested: ' + file); this.complete = true; this.naturalWidth = this.naturalHeight = 384; loaded.push(file); }
}
const context = { console, Image, ASSET_MANIFEST: manifest };
context.globalThis = context; vm.createContext(context);
for (const file of ['js/char-size.js', 'js/village-life.js', 'js/villager-draw.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const names = ['finn', 'berg', 'ken', 'shep', 'vera', 'graven', 'tess', 'ash', 'pell', 'hugo', 'pim', 'pip'];
let count = 0;
for (const key of names) {
  const person = context.VillageLife.P[key]; assert.equal(person.look.sprite, key);
  for (const direction of ['SW', 'SE', 'NE', 'NW']) for (const walking of [false, true]) {
    const draws = [], g = new Proxy({}, { get: (_, method) => method === 'drawImage' ? (...args) => draws.push(args) : () => {} });
    context.VillagerDraw(g, person.look, 100, 100, 1000, { face: direction, walking, scale: 1 });
    assert.equal(draws.length, 1, key + ' must draw a picture, not code geometry');
    assert(draws[0][0].srcValue.includes('/' + key + '/' + direction.toLowerCase() + '-stand.webp'));
    const entry = manifest.assets.find(a => a.id === `npc-${key}-${direction.toLowerCase()}-stand`);
    assert.equal(entry.status, 'final'); assert.equal(entry.studioOwner.id, 'npc:' + key);
    if (key === 'pim' || key === 'pip') {
      assert.equal(person.look.small, true, 'retain the age flag for the code fallback');
      assert.equal(entry.ageScaleBaked, true, 'the real image already contains a smaller child');
    }
    const scale = draws[0][3] / 384;
    assert(Math.abs(draws[0][2] + context.CharSize.FEET_Y * scale) < .001, 'same foot anchor as other villagers');
    assert(Math.abs(draws[0][3] - context.CharSize.VILLAGE_HERO_PX * context.CharSize.DRAW.ally / context.CharSize.DRAW.hero) < .001, 'same lineup sizing rule');
    count++;
  }
}
assert.equal(loaded.length, names.length * 4, 'only real stand files, no fictional walk frames');
const standFiles = loaded.length;
assert.equal(context.VillageLife.P.mil.look.sprite, 'mil');
for (const face of ['SW', 'SE', 'NE', 'NW']) {
  const draws = [], g = new Proxy({}, { get: (_, method) => method === 'drawImage' ? (...args) => draws.push(args) : () => {} });
  context.VillagerDraw(g, context.VillageLife.P.mil.look, 100, 100, 0, { face });
  assert.equal(draws.length, 1, 'Mil uses the existing picture rather than a code person');
  assert(draws[0][0].srcValue.includes('mil'));
}
console.log('PASS: ' + count + ' village render cases, ' + standFiles + ' real stand files, ' + names.length + ' NPC identities, four views and shared feet/lineup sizing; children are not shrunk twice; existing Mil linked in 4 views');
