/* Reference art integration: each combat mood resolves to a real, indexed, distinct boss portrait. */
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path'), crypto = require('crypto');
global.window = global;
const BP = require('../js/battle-portrait.js');
require('../js/battle-talk.js'); require('../js/story-actors.js');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/asset-manifest.json'), 'utf8'));
const kinds = 'treant crystalKing bogHydra coralGolem frostQueen pumpkinBoss voidKing hunger byrexael wolf golem slime bandit kobold'.split(' ');
const moods = { idle: 'neutral', guard: 'neutral', attack: 'angry', hurt: 'worry', down: 'worry', heal: 'happy', win: 'happy' };
let checked = 0;
for (const kind of kinds) {
  const hashes = new Set();
  for (const expression of ['neutral', 'happy', 'angry', 'worry']) {
    const file = `assets/portraits/boss-${kind}-${expression}.webp`;
    const bytes = fs.readFileSync(path.join(__dirname, '..', file));
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    const entry = manifest.assets.find(a => a.file === file);
    assert.ok(entry?.transparent && entry.size[0] >= 512 && entry.size[1] >= 512, file);
    hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
    assert.equal(BattleTalk.portrait('b:' + kind, expression), file);
    assert.equal(StoryActors.facePic('b:' + kind, null, expression), file);
    checked++;
  }
  assert.equal(hashes.size, 4, kind + ' must not repeat the same image for every emotion');
  const u = { side: 'monster', kind, boss: true };
  for (const [mood, expression] of Object.entries(moods)) {
    const face = BP.face(u, mood);
    assert.equal(face.src, `assets/portraits/boss-${kind}-${expression}.webp`);
    assert.equal(face.kind, 'real');
  }
  assert.equal(BattleTalk.portrait('b:' + kind, 'surprised'), `assets/portraits/boss-${kind}-worry.webp`);
}
for (const kind of ['wolf', 'golem', 'slime', 'bandit', 'kobold']) {
  assert.equal(BP.face({ side: 'monster', kind, boss: false }, 'attack').src, `assets/cards/portraits/en-${kind}.webp`);
}
global.CodeMonsters = { icon: kind => 'code:' + kind };
assert.equal(BP.face({ side: 'monster', kind: 'hunger', boss: true }, 'attack', { monCode: true }).src, 'code:hunger');
assert.equal(StoryActors.facePic('boss', null, 'angry'), 'assets/portraits/story/boss-angry.webp');
assert.equal(BP.face({ side: 'monster', kind: 'unreleased', boss: true }, 'idle').src, 'assets/cards/portraits/en-unreleased.webp');
console.log(checked + ' boss assets: dialogue, story, combat moods, ordinary-enemy and code-preview fallbacks OK');
