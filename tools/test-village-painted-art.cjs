/* v98.946 · painted background routing, atlas bounds, portraits and iframe wiring. */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = p => fs.readFileSync(path.join(root, p), 'utf8');
class Picture {
  set src(value) { this._src = value; [this.naturalWidth, this.naturalHeight] = value.endsWith('vendors.png') ? [1983, 793] : [1448, 1086]; this.complete = true; }
  get src() { return this._src; }
}
const c = { Image: Picture, setTimeout, clearTimeout, console }; c.window = c;
vm.runInNewContext(read('js/village-painted-art.js'), c);
const art = c.VillagePaintedArt;
for (const id of ['innHall', 'guildHall', 'temple', 'hearth', 'hildaFarm', 'houseDoor']) {
  const original = { art: id, lines: [{ text: 'unchanged' }], tint: 'day' }, s = art.scene(original);
  assert.equal(s.art, null); assert.equal(s.lines, original.lines); assert.equal(s.tint, 'day');
  assert.ok(fs.existsSync(path.join(root, s.bg)), s.bg);
  assert.equal(original.art, id, 'routing must not mutate story data');
}
const legacy = { art: 'ruins' }; assert.equal(art.scene(legacy), legacy);
const calls = [], g = { save() {}, restore() {}, translate() {}, scale(...args) { calls.push(['scale', ...args]); }, drawImage(...args) { calls.push(args); } };
for (const name of [...art.VENDORS, ...art.PROPS]) {
  const r = art.cell(name); assert.ok(r, name); assert.ok(r.x >= 0 && r.y >= 0 && r.w > 0 && r.h > 0);
  assert.ok(r.x + r.w <= r.image.naturalWidth); assert.ok(r.y + r.h <= r.image.naturalHeight);
  assert.equal(art.draw(g, name, 10, 20, 32), true);
}
calls.length = 0; art.draw(g, 'g1', 0, 0, 90, { height: 100, flip: true });
assert.deepEqual(calls[0], ['scale', -1, 1]); assert.equal(calls[1][8], 100, 'vendor height must be stable despite atlas padding');
assert.equal(art.draw(g, 'missing', 0, 0, 20), false);
class LoadingImage { set src(v) { this.complete = false; this.naturalWidth = 0; } }
const loading = { Image: LoadingImage, setTimeout, clearTimeout }; loading.window = loading;
vm.runInNewContext(read('js/village-painted-art.js'), loading);
assert.equal(loading.VillagePaintedArt.draw(g, 'g1', 0, 0, 20), false, 'loading keeps existing fallback available');
vm.runInNewContext(read('js/story-actors.js'), c);
for (const id of ['clerk', 'vera', 'boss']) for (const mood of ['neutral', 'happy', 'angry', 'sad', 'surprised']) {
  const src = c.StoryActors.facePic(id, {}, mood); assert.equal(src, 'assets/generated-village/' + id + '.png'); assert.ok(fs.existsSync(path.join(root, src)));
}
c.s = { village: { party: [{ key: 'sib' }, { key: 'sigrid' }] } }; c.Companions = { ROSTER: { sigrid: { name: 'Sigrid' } } };
vm.runInNewContext(read('js/story-data.js'), c);
assert.equal(c.STORY_DATA.SPEAKERS.ally.bust(), 'sigrid');
assert.equal(c.STORY_DATA.SPEAKERS.ally.portrait(), 'assets/portraits/sigrid-neutral.webp');
c.s.village.party = []; assert.equal(c.STORY_DATA.SPEAKERS.ally.bust(), null);
assert.ok(read('js/story-fx.js').includes("typeof S.bust==='function'?S.bust():S.bust"), 'resolve the current ally at each line');
for (const [page, consumer] of [['index.html', 'js/story-fx.js'], ['village-place.html', 'js/placeable-art.js'], ['place-interior.html', 'js/interior.js'], ['world-map.html', 'js/world-map.js'], ['village-town.html', 'js/town-quest.js']]) {
  const s = read(page); assert.ok(s.includes('js/village-painted-art.js'), page); assert.ok(s.indexOf('js/village-painted-art.js') < s.indexOf(consumer), page + ' script order');
}
assert.ok(read('js/webp-redirect.js').includes('generated-village'), 'native PNG files must bypass legacy WebP rewriting');
const M = JSON.parse(read('data/asset-manifest.json'));
for (const a of M.assets.filter(a => (a.file || '').startsWith('assets/generated-village/'))) {
  const bytes = fs.readFileSync(path.join(root, a.file)); assert.equal(bytes.subarray(1, 4).toString(), 'PNG', a.file);
  const w = bytes.readUInt32BE(16), h = bytes.readUInt32BE(20); assert.ok(w >= 1000 && h >= 700, a.file);
  if (a.transparent) assert.equal(bytes[25], 6, a.file + ' alpha channel');
  if (a.size) assert.deepEqual(a.size, [w, h], a.file);
}
console.log('PASS painted village art: six backgrounds, 22 atlas cells, three portrait fallbacks, dynamic ally, five iframe loaders and PNG assets');
