const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/story-actors.js'), 'utf8'), context);
const actors = context.window.StoryActors;
const cast = require(path.join(root, 'js/story-cast.js'));
const map = require(path.join(root, 'js/story-map-data.js'));
const ids = ['clerk', 'vera', 'boss', 'corvin', 'helga', 'darren', 'mierris', 'lorrik', 'serrien', 'vik', 'irene'];
const moods = { neutral: 'neutral', happy: 'happy', angry: 'angry', worry: 'worry', sad: 'worry', surprised: 'worry', think: 'neutral', missing: 'neutral' };
let cases = 0;
for (const [speaker, id] of [...ids.map(id => [id, id]), ['third', 'corvin'], ['mage', 'serrien']]) {
  for (const [mood, expected] of Object.entries(moods)) {
    const src = `assets/portraits/story/${id}-${expected}.webp`;
    assert.equal(actors.facePic(speaker, {}, mood), src);
    assert.equal(cast.face(speaker, mood).src, src);
    assert.ok(fs.existsSync(path.join(root, src)), src);
    cases++;
  }
}
for (const id of ['mierris', 'lorrik', 'helga', 'darren', 'irene', 'vik', 'third', 'mage']) {
  assert.ok(fs.existsSync(path.join(root, map.CAST[id].src)));
  assert.equal(map.CAST[id].code, undefined);
}
assert.equal(actors.facePic('hero', {}, 'happy'), 'assets/portraits/hero-male-happy.webp');
assert.equal(actors.facePic('hilda', {}, 'surprised'), 'assets/portraits/hilda-surprised.webp');
assert.equal(actors.facePic('unknown', {}, 'happy'), null);
console.log(`PASS story portrait art: ${cases} mood/alias cases, both picture consumers, story map, existing speakers`);
