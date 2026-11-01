// v98.41 · ฉายา (js/titles.js): hidden conditions, tiers, equip slots, capped bonuses, wiring into Progression.heroCombat.
const path = require('path');
global.window = global;
const P = require(path.join(__dirname, '..', 'js', 'progression.js'));
const T = require(path.join(__dirname, '..', 'js', 'titles.js'));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const game = () => ({ day: 1, hp: 60, inventory: [], village: { coins: 0, character: { level: 1, xp: 0, points: 0, stats: {} } } });
const win = (g, o = {}) => T.battle(g, { outcome: 'win', foe: 'wolf', kills: 2, hp0: 50, hp1: 40, maxHp: 60, party: 1, allyDown: 0, ...o });

// catalogue
ok(T.LIST.length >= 30, 'at least 30 titles: ' + T.LIST.length);
ok(new Set(T.LIST.map(d => d.id)).size === T.LIST.length, 'ids are unique');
for (const tier of [1, 2, 3, 4, 5]) ok(T.LIST.some(d => d.tier === tier), 'tier ' + tier + ' exists');
ok(T.LIST.every(d => d.fx && Object.keys(d.fx).length && Object.keys(d.fx).every(k => k in T.CAP)), 'every title has known bonuses');
const power = d => Object.entries(d.fx).reduce((a, [k, v]) => a + (k === 'hp' ? v / 4 : k === 'st' ? v / 5 : k === 'crit' || k === 'xp' || k === 'gold' ? v * 60 : v * 3), 0);
const avg = t => { const a = T.LIST.filter(d => d.tier === t); return a.reduce((x, d) => x + power(d), 0) / a.length };
ok(avg(1) < avg(2) && avg(2) < avg(3) && avg(3) < avg(4), 'harder tiers give more: ' + [1, 2, 3, 4].map(avg).map(x => x.toFixed(1)));

// first win → first title, auto-equipped; conditions stay hidden in the view
let g = game(); let got = win(g);
ok(got.length === 1 && got[0].id === 'rookie', 'first win gives "rookie"');
ok(T.mods(g).hp === 3, 'rookie equipped: hp +3');
let v = T.view(g);
ok(v.rows.filter(r => !r.got).every(r => r.name === undefined && r.story === undefined && r.fx === undefined), 'locked titles reveal nothing (no name / story / bonus)');
ok(!v.rows.some(r => r.tier === 5), 'secret tier is not listed until earned');
ok(v.secretLeft === T.LIST.filter(d => d.tier === 5).length, 'secret titles are only counted');
ok(!JSON.stringify(v).includes('foe:'), 'conditions never appear in the view');

// counters: flawless / clutch / solo / night / boss / elite
g = game(); for (let i = 0; i < 3; i++) win(g, { hp0: 50, hp1: 50 });
ok(g.village.titles.earned.unscathed, '3 flawless wins → unscathed');
g = game(); win(g, { hp0: 50, hp1: 6, maxHp: 60 }); ok(g.village.titles.earned.survivor, 'win at ≤15% hp → survivor');
g = game(); for (let i = 0; i < 5; i++) win(g, { party: 0 }); ok(g.village.titles.earned.lonewolf, '5 solo wins → lone wolf');
g = game(); for (let i = 0; i < 5; i++) win(g, { night: true }); ok(g.village.titles.earned.nightwalker, '5 night wins');
g = game(); for (let i = 0; i < 3; i++) win(g, { boss: true }); ok(g.village.titles.earned.bosskiller, '3 bosses');
g = game(); for (let i = 0; i < 5; i++) win(g, { foe: 'wolf*1.4' }); ok(g.village.titles.earned.wolfbane, 'foe key strips the *mult suffix');

// streak resets on loss; best is remembered
g = game(); for (let i = 0; i < 9; i++) win(g); T.battle(g, { outcome: 'lose' }); for (let i = 0; i < 9; i++) win(g);
ok(!g.village.titles.earned.streak10 && g.village.titles.best === 9, 'streak broken at 9 → no "undefeated"');
g = game(); for (let i = 0; i < 10; i++) win(g); ok(g.village.titles.earned.streak10, '10 in a row → streak10');

// secret: phoenix = 3 losses then 5 wins
g = game(); for (let i = 0; i < 3; i++) T.battle(g, { outcome: 'lose' }); for (let i = 0; i < 5; i++) win(g);
ok(g.village.titles.earned.phoenix, 'phoenix: 3 losses then 5 wins');
g = game(); for (let i = 0; i < 3; i++) T.battle(g, { outcome: 'lose' }); for (let i = 0; i < 2; i++) win(g); T.battle(g, { outcome: 'lose' }); for (let i = 0; i < 4; i++) win(g);
ok(!g.village.titles.earned.phoenix, 'phoenix needs 5 wins in a row after the losses');
ok(T.view(g).rows.every(r => r.tier < 5 || r.got), 'unearned secret still unlisted');

// save-derived titles via check()
g = game(); g.day = 8; g.village.character.level = 5; g.village.coins = 600; T.check(g);
ok(g.village.titles.earned.wayfarer && g.village.titles.earned.seasoned && g.village.titles.earned.pennywise, 'day / level / coins titles');
g = game(); g.village.character.jobs = { warrior: { lv: 5 } }; T.check(g); ok(g.village.titles.earned.adept && g.village.titles.earned.scholar, 'job level titles');

// slots: 1 at Lv1, 2 at Lv5, 3 at Lv10, 4 at Lv18; extra titles are earned but not worn
g = game(); ok(T.slots(g) === 1, 'Lv1 → 1 slot');
g.village.character.level = 5; ok(T.slots(g) === 2, 'Lv5 → 2'); g.village.character.level = 10; ok(T.slots(g) === 3, 'Lv10 → 3'); g.village.character.level = 18; ok(T.slots(g) === 4, 'Lv18 → 4');
g = game(); win(g); g.day = 8; T.check(g);
ok(g.village.titles.equipped.length === 1 && g.village.titles.earned.wayfarer, 'second title earned but slot is full');
ok(!T.equip(g, 'wayfarer'), 'cannot equip over the slot limit');
ok(T.swap(g, 'rookie', 'wayfarer') && T.mods(g).st === 6 && !T.mods(g).hp, 'swap changes the bonus');
ok(!T.equip(g, 'legend'), 'cannot equip an unearned title');

// caps
g = game(); g.village.titles = { tally: {}, earned: {}, equipped: [] };
for (const d of T.LIST) { g.village.titles.earned[d.id] = { day: 1 }; g.village.titles.equipped.push(d.id) }
const m = T.mods(g); ok(Object.entries(m).every(([k, x]) => x <= T.CAP[k] + 1e-9), 'every bonus is capped'); ok(m.power === T.CAP.power, 'power hits the cap');

// wired into the card battle profile
g = game(); P.sync(g); const base = P.heroCombat(g, {});
win(g); g.village.titles.equipped = ['veteran']; g.village.titles.earned.veteran = { day: 1 };
const withT = P.heroCombat(g, {}); ok(withT.power === base.power + 1, 'veteran: +1 weapon-card damage in heroCombat');
g.village.titles.equipped = ['rookie']; ok(P.heroCombat(g, {}).hpMod === (base.hpMod || 0) + 3, 'hp bonus goes through hpMod');
g.village.titles.equipped = ['nightwalker']; g.village.titles.earned.nightwalker = { day: 1 }; ok(Math.abs(P.heroCombat(g, {}).crit - (base.crit + .02)) < 1e-9, 'crit bonus');
ok(P.battleHero(g, {}).hpMod !== undefined, 'battleHero still builds');

// onEarn callback fires once per newly earned set
let fired = 0; T.onEarn = l => { fired += l.length }; g = game(); win(g); win(g); ok(fired === 1, 'onEarn fires only for new titles'); T.onEarn = null;

console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
