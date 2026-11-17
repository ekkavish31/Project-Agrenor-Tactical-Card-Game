// v98.136 · node tools/test-manifest-merge.cjs — ManifestMerge keeps newer main work when a staged manifest is pushed
const assert = require('node:assert/strict'), M = require('../js/manifest-merge.js');
const A = (id, x = {}) => ({ id, file: id + '.png', status: 'final', ...x });
const base = { version: 1, assets: [A('a'), A('b'), A('c', { status: 'missing' })], studioAllyWalks: { ren: { SW: { createdAt: '1', frames: [1] } } }, heroVariants: { male: { idle: 1 } } };
// mine: edited a, removed b, added d · theirs: added sigrid walk + filled c + edited heroVariants
const mine = JSON.parse(JSON.stringify(base)); mine.assets[0].note = 'mine'; mine.assets.splice(1, 1); mine.assets.push(A('d'));
const theirs = JSON.parse(JSON.stringify(base)); theirs.assets[2].status = 'final'; theirs.studioAllyWalks.sigrid = { SW: { createdAt: '2', frames: [1, 2] } }; theirs.heroVariants.male.idle = 2;
let r = M.merge(base, mine, theirs);
assert.deepEqual(r.assets.map(a => a.id), ['a', 'c', 'd']); assert.equal(r.assets[0].note, 'mine'); assert.equal(r.assets[1].status, 'final');
assert.ok(r.studioAllyWalks.sigrid && r.studioAllyWalks.ren); assert.equal(r.heroVariants.male.idle, 2); console.log('ok 3-way');
// no base: union, filled slot wins, newer createdAt wins
const old = { assets: [A('a'), A('s', { status: 'missing' })], studioAllyWalks: { ren: { SW: { createdAt: '2026-11-03', frames: [1] } } } };
const now = { assets: [A('a'), A('s', { status: 'final', file: 'new.png' }), A('n')], studioAllyWalks: { ren: { SW: { createdAt: '2026-11-04', frames: [1, 2, 3] } }, sigrid: { NE: { createdAt: '2026-11-04', frames: [1] } } } };
r = M.merge(null, old, now);
assert.deepEqual(r.assets.map(a => a.id), ['a', 's', 'n']); assert.equal(r.assets[1].file, 'new.png'); assert.equal(r.studioAllyWalks.ren.SW.frames.length, 3); assert.ok(r.studioAllyWalks.sigrid); console.log('ok no base');
// a newer local walk set beats an older one on main
r = M.merge(null, { studioAllyWalks: { ren: { SW: { createdAt: '5', frames: [9] } } }, assets: [] }, { studioAllyWalks: { ren: { SW: { createdAt: '4', frames: [1] } } }, assets: [] });
assert.deepEqual(r.studioAllyWalks.ren.SW.frames, [9]); console.log('ok newer local set kept');
// v98.442 · no base: an old staged copy must not turn a finished picture back into code / temp, and a retired picture never comes back
r = M.merge(null, { assets: [{ id: 'card-a', file: 'assets/a.webp', status: 'code' }, { id: 'old', file: 'assets/old.webp', status: 'temp' }] },
  { retired: ['assets/old.webp'], assets: [{ id: 'card-a', file: 'assets/a.webp', status: 'final', artRevision: '2' }] });
assert.equal(r.assets.find(a => a.id === 'card-a').status, 'final'); assert.ok(!r.assets.some(a => a.id === 'old')); assert.deepEqual(r.retired, ['assets/old.webp']); console.log('ok old Cart cannot downgrade / revive');
r = M.merge(null, { assets: [{ id: 'x', file: 'assets/x.webp', status: 'final', artRevision: '1' }] }, { assets: [{ id: 'x', file: 'assets/x.webp', status: 'final', artRevision: '3' }] });
assert.equal(r.assets[0].artRevision, '3'); console.log('ok newer art revision wins without a base');
(async () => { const res = await M.rebase([['data/asset-manifest.json', JSON.stringify(old)], ['js/asset-manifest.js', 'x'], ['assets/x.png', 'img']], JSON.stringify(now), null);
  assert.ok(res.changed); assert.equal(res.files.length, 3); const js = await res.files.find(f => f[0] === 'js/asset-manifest.js')[1].text(); assert.match(js, /window\.ASSET_MANIFEST=\{/); assert.match(js, /sigrid/);
  const same = await M.rebase([['data/asset-manifest.json', JSON.stringify(now)]], JSON.stringify(now), null); assert.equal(same.changed, false); console.log('ok rebase files'); console.log('manifest merge: all tests passed') })();
