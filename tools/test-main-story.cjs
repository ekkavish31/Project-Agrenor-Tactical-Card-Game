/* v98.474 · node tools/test-main-story.cjs — main story framework (phase B): stage · flags · war · infection · signs · reveal · factions that stay hidden until opened */
const path = require('path'); global.window = global;
const T = require(path.join(__dirname, '..', 'js', 'titles.js')), M = require(path.join(__dirname, '..', 'js', 'main-story.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const game = () => ({ day: 3, hp: 60, village: { coins: 0, character: { level: 1, xp: 0 } } });
// an old save has no main story at all and nothing breaks
{ const g = game(); ok(M.stage(g).id === 'intro' && M.index(g) === 0, 'old save = intro'); ok(g.village.main === undefined, 'reading does not create the save block'); ok(M.war(g) === 0 && M.signs(g).length === 0, 'no war yet'); ok(M.infection(g, 'deepcairn') === 0, 'no infection yet'); ok(!M.check(g), 'nothing to move') }
// the intro finishing starts the story; level 5 opens the war — never by the day count
{ const g = game(); g.day = 400; ok(!M.check(g) && M.is(g, 'intro'), 'many days alone move nothing'); g.village.story = { mode: 'done' }; ok(M.check(g) && M.is(g, 'free'), 'intro done → free play'); ok(M.war(g) === 1 && M.signs(g).length === 1, 'rumours only');
  ok(T.has(g, 'war.rumor'), 'chronicle line written'); g.village.character.level = 5; ok(M.check(g) && M.is(g, 'signs') && M.war(g) === 2, 'level 5 → the front opens'); ok(M.signs(g).some(x => x.id === 'draft'), 'draft notices appear');
  ok(!M.check(g), 'nothing else moves on its own (later phases call advanceTo)') }
// forward only; skipping writes every chronicle line passed once
{ const g = game(); ok(M.advanceTo(g, 'release', { silent: true }), 'jump ahead'); ok(M.is(g, 'release') && M.war(g) === 3, 'war 3'); ok(T.has(g, 'war.rumor') && T.has(g, 'war.signs') && T.has(g, 'mage.wake') && T.has(g, 'war.arms'), 'every stage passed is written');
  ok(!M.advanceTo(g, 'signs', { silent: true }) && M.is(g, 'release'), 'never backwards'); ok(!M.advanceTo(g, 'nope'), 'unknown stage ignored'); ok(T.chronicle(g).length === 4, 'once each: ' + T.chronicle(g).length) }
// infection is a gradient from the mine
{ const g = game(); M.advanceTo(g, 'mine', { silent: true }); const v = id => M.infection(g, id);
  ok(v('deepcairn') === 3 && v('fernvale') === 2 && v('lakenhold') === 1 && v('brookmere') === 0, 'dense at the mine, thin far away: ' + ['deepcairn', 'fernvale', 'lakenhold', 'brookmere'].map(v));
  ok(v('nowhere') === 0, 'unknown place = clean'); M.advanceTo(g, 'end', { silent: true }); ok(v('deepcairn') === 0, 'cleaned when the story ends') }
// flags and reveal
{ const g = game(); ok(M.flag(g, 'x') === undefined, 'unset flag'); M.set(g, 'x', 2); ok(M.flag(g, 'x') === 2, 'flag set'); ok(!M.reveal(g, 'north') && !M.reveal(g, 'light') && !M.reveal(g, 'supply'), 'nothing revealed at the start');
  M.advanceTo(g, 'signs', { silent: true }); ok(M.reveal(g, 'north') && !M.reveal(g, 'light'), 'the north appears with the front'); M.advanceTo(g, 'wake', { silent: true }); ok(M.reveal(g, 'light') && M.reveal(g, 'shadow') && !M.reveal(g, 'supply'), 'wardens with the trail'); M.set(g, 'supplyExposed'); ok(M.reveal(g, 'supply'), 'the clique only when exposed') }
// v98.475 · Mip comes back after the intro and follows the hero (no party slot): state lives in main.mip
{ const g = game(); ok(!M.flag(g, 'mipJoined'), 'not joined during the intro'); g.village.story = { mode: 'done' }; M.check(g);
  ok(M.flag(g, 'mipJoined') === true && T.has(g, 'mip.joined'), 'joins once the intro is done + chronicle'); const m = M.mip(g); ok(m.state === 'stable' && m.dark === 0 && Array.isArray(m.fed), 'a stable, light friend');
  ok(T.view(g).rows.some(r => r.id === 'foxfriend' && r.got), 'the friend title unlocks'); const before = T.chronicle(g).length; M.check(g); ok(T.chronicle(g).length === before, 'joins only once');
  const F = require(path.join(__dirname, '..', 'js', 'mip-follower.js')); global.MainStory = M; global.WorldState = { game: () => g };
  ok(F.visible(g) === true, 'drawn while stable'); m.state = 'mad'; ok(F.visible(g) === false, 'not drawn as a friend once mad'); m.state = 'berserk'; ok(F.visible(g) === true, 'a berserk moment is still the friend'); m.state = 'stable';
  const P = (u, v) => ({ x: u * 10, y: v * 10 }); let hero = { u: 0, v: 0 }; let out = [];
  for (let i = 0; i < 60; i++) { hero = { u: i * .5, v: 0 }; out = F.objects(hero, .05, i * 50, { show: true, project: P, size: 90, g: null }) }
  ok(out.length === 1 && out[0].mobile && out[0].follower, 'one drawable follower'); ok(out[0].x < hero.u * 10 - 20, 'it walks BEHIND the lead: ' + out[0].x + ' vs ' + hero.u * 10);
  ok(F.objects(hero, .05, 99999, { show: false, project: P }).length === 0, 'nothing when hidden'); F.reset() }
// stage list sanity
ok(M.STAGES.every((d, i) => d.id && d.name && d.spoiler >= 0 && d.spoiler <= 3 && d.war >= 0 && d.war <= 4), 'stage data'); ok(new Set(M.STAGES.map(d => d.id)).size === M.STAGES.length, 'unique ids');
ok(M.STAGES.every((d, i) => i === 0 || d.spoiler >= M.STAGES[i - 1].spoiler), 'spoiler level never goes down'); ok(M.STAGES.every(d => !d.log || T.CHRON[d.log]), 'every stage chronicle id has text');
// factions stay hidden until opened (no spill into them either)
{ const F = require(path.join(__dirname, '..', 'js', 'factions.js')); const g = game(); global.s = g; global.WorldState = undefined; global.MainStory = M; global.save = () => {};
  ok(!F.shown('north') && !F.shown('light') && !F.shown('shadow') && !F.shown('supply'), 'hidden at the start'); ok(F.shown('crown') && F.shown('village'), 'the old factions are always shown');
  F.add('crown', -20, 'test'); ok((g.village.rep.north || 0) === 0 && (g.village.rep.light || 0) === 0, 'hidden factions do not move by spill');
  M.advanceTo(g, 'signs', { silent: true }); ok(F.shown('north'), 'the north is shown once the front opens'); F.add('crown', 10, 'test'); ok((g.village.rep.north || 0) !== 0, 'and then it reacts');
  ok(Object.values(F.FACTIONS).every(x => x.name && x.icon && x.col && x.perk), 'every faction is complete') }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
