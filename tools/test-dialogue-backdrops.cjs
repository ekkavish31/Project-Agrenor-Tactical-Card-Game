const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
global.window = global; const B = require('../js/dialogue-backdrops.js'); require('../js/story-data.js');
const C = require('../js/crossroads.js'), Cast = require('../js/story-cast.js'), Services = require('../js/town-services.js');
const ROOT = path.join(__dirname, '..'); let n = 0;
for (const [id, s] of Object.entries(STORY_DATA.SCENES)) {
  assert.ok(id in B.INTRO, 'Unreviewed intro scene ' + id); assert.ok(fs.existsSync(path.join(ROOT, s.bg)), id);
  assert.ok(s.dialogueLocation, id + ' lacks location metadata'); n++;
}
for (const e of C.EVENTS) { assert.ok(e.id in B.EVENTS, 'Unreviewed event ' + e.id); for (const town of e.towns || Object.keys(B.TOWNS)) { assert.ok(B.resolve({ town, event: e.id })?.src, e.id + town); n++; } }
for (const id of Object.keys(Cast.SPOTS)) assert.ok(id in B.SERVICES, 'Unreviewed story service ' + id);
for (const [town, services] of Object.entries(Services.SVC)) for (const s of services) assert.ok(B.resolve({ town, service: s.key }), town + s.key);
for (const [id, file] of Object.entries(B.IMG)) { assert.ok(fs.existsSync(path.join(ROOT, file)), file); n++; }
// Correct real locations, including an NPC changing place; explicit line transitions and player data are preserved.
assert.equal(STORY_DATA.SCENES.guildFirst.bg, B.IMG.guild);
assert.equal(STORY_DATA.SCENES.kierAdmitted.bg, B.IMG.healer);
assert.equal(STORY_DATA.SCENES.kierHurt.bg, B.IMG['forest-stream']);
assert.equal(B.intro('seeds', STORY_DATA.SCENES.seeds, 'market').bg, B.IMG.square);
assert.equal(B.intro('seeds', STORY_DATA.SCENES.seeds, 'npc9').bg, B.IMG.door);
assert.equal(B.resolve({ town: 'northgate', event: 'sickRefugee' }).key, 'refugee-camp');
assert.equal(B.resolve({ town: 'willowshore', service: 'st:clinic' }).key, 'war-clinic');
assert.equal(B.resolve({ town: 'lakenhold', service: 'tower' }).key, 'mage-hall');
assert.notEqual(B.resolve({ town: 'thornwatch', event: 'dragonTale' }).key, 'haven');
assert.equal(B.resolve({ town: 'haven', event: 'dragonAsh' }).key, 'haven');
assert.equal(B.resolve({ town: 'lakenhold' }).key, 'lakenhold', 'No sticky event background');
// New Game slides and dialogue words are not rewritten by the backdrop resolver.
const original = { bg: 'original.webp', lines: [{ text: 'test', bg: B.IMG.house }], flags: { keep: true } };
const fixed = B.intro('opening', original); assert.equal(fixed.lines, original.lines); assert.equal(fixed.flags, original.flags); assert.equal(original.bg, 'original.webp');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/asset-manifest.json')));
for (const a of manifest.assets.filter(a => a.id.startsWith('dialogue-bg-'))) { const bytes = fs.readFileSync(path.join(ROOT, a.file)); assert.equal(bytes.toString('ascii', 8, 12), 'WEBP'); assert.ok(a.size[0] >= 1500 && a.size[1] >= 840); }
for (const page of ['index.html', 'world-map.html']) { const s = fs.readFileSync(path.join(ROOT, page), 'utf8'); const i = s.indexOf('js/dialogue-backdrops.js?'); assert.ok(i >= 0 && i < s.indexOf(page === 'index.html' ? 'js/story-data.js?' : 'js/world-map.js?'), page + ' load order'); }
console.log('PASS dialogue locations: ' + n + ' coverage/image checks + real-location fixtures, scene transitions and load order');

// Execute the actual scoped-context helper used by world-map, including nested scopes and errors.
const worldSource = fs.readFileSync(path.join(ROOT, 'js/world-map.js'), 'utf8');
const scopeSource = worldSource.slice(worldSource.indexOf('  let dialogueContext = null;'), worldSource.indexOf('  function modal('));
const scope = vm.createContext({}); vm.runInContext(scopeSource + '\nthis.runScope=atDialogue;this.getScope=()=>dialogueContext;', scope);
(async () => {
  assert.equal(scope.getScope(), null);
  await scope.runScope({ town: 'willowshore' }, async () => {
    assert.equal(scope.getScope().town, 'willowshore');
    await scope.runScope({ location: 'deep-mine-inner' }, async () => { assert.equal(scope.getScope().location, 'deep-mine-inner'); });
    assert.equal(scope.getScope().town, 'willowshore');
  });
  assert.equal(scope.getScope(), null);
  await assert.rejects(scope.runScope({ location: 'deep-mine' }, async () => { throw Error('cancel'); }));
  assert.equal(scope.getScope(), null);
  console.log('PASS actual world-map dialogue context: restored after nested pages, return and thrown error');
})().catch(e => { console.error(e); process.exitCode = 1; });
