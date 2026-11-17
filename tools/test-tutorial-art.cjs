// Integration: real card art suppresses the canvas fallback; authored tutorial
// sprites resolve every pose in four directions without regenerating the goat.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..'), manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/asset-manifest.json')));
const images = new Map(manifest.assets.filter(a => a.file).map(a => [a.file, a.size]));
class Image {
  set src(file) { assert(fs.existsSync(path.join(root, file)), file); [this.naturalWidth, this.naturalHeight] = images.get(file); this.complete = true; this.onload?.(); }
}
const s = { console, performance: { now: () => 0 }, Image, ASSET_MANIFEST: manifest,
  document: { createElement() { throw new Error('Real cards must not request generated canvas art'); } } };
s.window = s; s.globalThis = s; vm.createContext(s);
for (const file of ['js/tactics-decks.js', 'js/code-card-art.js', 'js/monster-animation.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), s, { filename: file });
assert.equal(s.CodeCardArt.made.length, 0);
const cardIds = ['thunder', 'backstab', 'dive', 'tide', 'formation', 'counter', 'evade', 'firstAid', 'ambush', 'rockfall', 'perch', 'climb', 'chaosBolt', 'chaosRend', 'chaosWard'];
for (const id of cardIds) { const a = manifest.assets.find(a => a.id === 'tactic-card-' + id); assert.equal(a.status, 'final'); assert(fs.existsSync(path.join(root, a.file))); }
(async () => {
  let count = 0;
  for (const kind of ['pumpkin', 'pumpkinBoss', 'pest', 'goat']) {
    await s.MonsterArt.prepare(kind);
    const clips = manifest.assets.filter(a => a.enemy === kind && a.status === 'final');
    for (const a of clips) {
      const state = a.pose === 'walk' ? { walking: true } : a.pose === 'hit' ? { hitUntil: 100 } : { pose: a.pose };
      const dir = a.view, f = s.MonsterArt.frame(kind, dir, state, a.pose === 'down' ? 0 : 1, 0, a.id);
      assert(f && f.image.complete, a.id); assert.equal(f.clipId, a.id);
      assert.equal(f.sw, a.frameSize[0]); assert.equal(f.sh, a.frameSize[1]);
      if (['v98.438', 'v98.439'].includes(a.artRevision) && a.animation.frames === 4) {
        assert.equal(f.frames, 4, a.id);
        const laterState = a.pose === 'hit' ? { ...state, hitUntil: 10000 } : state;
        const later = s.MonsterArt.frame(kind, dir, laterState, 1, 400, a.id);
        assert(later.frame > 0, a.id + ' must advance beyond the still frame');
        assert.equal(later.sw, a.frameSize[0]); assert.equal(later.sh, a.frameSize[1]);
        assert(later.sx > 0 && later.sx + later.sw <= a.size[0], a.id + ' atlas bounds');
      }
      const mirrored = s.MonsterArt.frame(kind, dir === 'SE' ? 'SW' : 'NW', state, a.pose === 'down' ? 0 : 1, 0, a.id + '-mirror');
      assert.equal(mirrored.clipId, f.clipId); assert.equal(mirrored.flip, !f.flip);
      assert(f.pivot[1] > .8 && f.pivot[1] < 1); count++;
    }
    assert.equal(new Set(clips.map(a => a.normalization.commonScale)).size, 1, kind + ' must keep one scale including down');
  }
  assert(s.MonsterArt.resolveClip('goat', 'SE', 'idle'), 'existing goat is retained');
  console.log('PASS: 15 real card images suppress code art; ' + count + ' tutorial poses load, resolve and mirror in 4 directions; shared scales and goat retained');
})().catch(e => { console.error(e); process.exitCode = 1; });
