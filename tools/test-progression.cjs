// v94.06 · F2 progression (js/progression.js): hero levels, card unlock queue, companion levels, gear stars, recipes, battle XP.
const path = require('path');
const P = require(path.join(__dirname, '..', 'js', 'progression.js'));
global.window = global; require(path.join(__dirname, '..', 'js', 'flat-battle.js'));
const FB = global.FlatBattle;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const game = () => ({ hp: 50, inventory: [], village: { character: { level: 1, xp: 0, points: 0, stats: {} }, materials: { iron: 5, coal: 3, wood: 2 }, bag: { wolfFang: 2 } } });

// hero levels
let g = game(); P.sync(g);
ok(g.maxHp === 60 && g.maxStamina === 100, 'level 1: HP 60, stamina 100');
let ups = P.gainHero(g, 99); ok(!ups.length && g.village.character.xp === 99, 'below 100 XP: no level');
ups = P.gainHero(g, 1); ok(ups[0] === 2 && g.maxHp === 64 && g.maxStamina === 105 && g.hp === 54, 'level 2: HP max +4 (and heals +4), stamina +5');
ok(g.village.character.points === 2, 'stat points +2 per level');
ok(g.village.levelUnlocks.length === 1 && g.village.levelUnlocks[0].level === 2, 'card unlock queued at level 2');
ups = P.gainHero(g, 200 + 300); ok(ups.join() === '3,4' && g.maxHp === 72, 'multi-level gain');
ok(P.heroCombat(g).power === 1 && P.heroCombat(g).armor === 1, 'level 4: weapon cards +1 (every 3 levels), armour +1');
ok(P.heroNeed(1) === 100 && P.heroNeed(2) === 140 && P.heroNeed(9) === 420, 'XP curve 60 + 40 × level');
for (let lv = 2; lv <= 10; lv++) for (const c of P.LEVEL_CARDS[lv] || []) ok(FB.CARD[c.id], `level ${lv} card ${c.id} works in the flat battle`);
const old = game(); old.hp = 99; old.village.character.level = 3; P.sync(old); ok(old.maxHp === 68 && old.hp === 68, 'old save synced from its level');

// companions
const m = { key: 'bram', hp: 54, max: 54 };
ok(!P.gainAlly(m, 79).length && P.gainAlly(m, 1)[0] === 2 && m.max === 58 && m.hp === 58, 'companion level 2: HP +4');
ok(P.allyAtk(m) === 1 && P.allyAtk({}) === 0, 'companion ATK +1 per level');

// gear
const R = { sword: { kind: 'sword' }, hammer: { kind: 'hammer' }, ...P.ZONE_RECIPES };
ok(P.stars({ kind: 'sword', recipe: 'sword', quality: 1 }, R) === 1 && P.stars({ kind: 'sword', recipe: 'sword', quality: 3 }, R) === 2 && P.stars({ kind: 'sword', recipe: 'sword', quality: 5 }, R) === 3, 'stars from quality');
ok(P.stars({ kind: 'sword', recipe: 'frostBlade', quality: 1 }, R) === 3 && P.stars({ kind: 'sword', recipe: 'fangBlade', quality: 1 }, R) === 2, 'zone recipes give their tier');
ok(P.weaponAtk({ kind: 'knife', quality: 1 }, R) === 0 && P.weaponAtk({ kind: 'sword', recipe: 'sword', quality: 1 }, R) === 2, 'knife weakest, sword +2');
ok(P.weaponAtk({ kind: 'sword', recipe: 'fangBlade', quality: 2 }, R) === 2 + 1 + 1, 'quality and stars add ATK');
g = game(); g.inventory = [{ id: 7, kind: 'sword', recipe: 'sword', quality: 1 }]; g.equipped = 7;
ok(P.heroCombat(g, R).atk === 14, 'equipped sword adds to hero ATK');
ok(P.starText({ kind: 'sword', recipe: 'sword', quality: 4 }, R) === '★★', 'star text');

// stats count in battle (v95.00)
g = game(); g.village.character.stats = { strength: 4, knowledge: 2, precision: 3, endurance: 2 }; P.sync(g);
let c = P.heroCombat(g);
ok(c.power === 2 && c.spell === 1 && Math.abs(c.crit - .06) < 1e-9 && c.stMax === 108, 'strength/knowledge/precision/endurance → power, spell, crit, battle stamina');
g.fatigue = 50; const bh = P.battleHero(g); ok(bh.st === 78 && bh.stMax === 108, 'tired hero starts with less stamina');
ok(/^hero=/.test(P.battleParam(g)) && JSON.parse(decodeURIComponent(P.battleParam(g).slice(5))).power === 2, 'battle param carries the profile');
ok(P.LEVEL_CARDS[2][0].id === 'climb' && P.LEVEL_CARDS[3][0].id === 'rockfall' && P.LEVEL_CARDS[4].some(x => x.id === 'perch'), 'height cards come first (Lv2–4)');
ok(P.foeScale(3).hp === 1 && P.foeScale(10).hp > 1.4 && P.foeScale(10).atk > 1.3, 'monsters grow from Lv4 on');

// the card battle reads the profile (js/flat-battle.js)
{
  const D = require(path.join(__dirname, '..', 'js', 'tactics-decks.js'));
  const mk = (hero, mon = {}) => FB.create({ bounds: { u0: 0, v0: 0, u1: 6, v1: 6 }, kindAt: () => 'normal', cards: true, rng: () => .99, deckConfig: D.STARTER, hero: { u: 3, v: 3, stamina: 100, ...hero }, monsters: [{ u: 4, v: 3, hp: 300, maxHp: 300, atk: 9, ...mon }] });
  const hit = (hero, id) => { const st = mk(hero); st.deck.combat.hand[0] = { id, uid: 't' }; const m = FB.monsters(st)[0]; FB.playCombat(st, 0); return 300 - m.hp };
  ok(hit({ power: 5 }, 'attack') === hit({}, 'attack') + 5, 'power adds to weapon cards');
  ok(hit({ power: 5 }, 'thunder') === hit({}, 'thunder') && hit({ spell: 3 }, 'thunder') === hit({}, 'thunder') + 3, 'spell adds to element cards only');
  const st = mk({ armor: 3 }); const h = FB.hero(st), b = h.hp; FB.hurt(st, h, 10); ok(b - h.hp === 7, 'armour reduces each hit');
  const st2 = mk({}, { passive: true }); FB.endTurn(st2); FB.monsterTurn(st2); ok(FB.hero(st2).hp === 60, 'a passive scarecrow never hits back');
  const st3 = mk({ stMax: 130, stamina: 125 }); FB.endTurn(st3); FB.monsterTurn(st3); ok(FB.hero(st3).stamina === 130, 'stamina refills up to stMax');
}

// recipes with zone goods
g = game();
ok(P.recipeMissing(g.village, P.ZONE_RECIPES.fangBlade) === '', 'fang blade affordable with 2 fangs');
ok(/crystalShard|ผลึก/.test(P.recipeMissing(g.village, P.ZONE_RECIPES.crystalHammer)), 'crystal hammer needs crystal shards');
P.spendRecipe(g.village, P.ZONE_RECIPES.fangBlade);
ok(g.village.materials.iron === 3 && !g.village.bag.wolfFang, 'spending removes materials and goods');
for (const [k, r] of Object.entries(P.ZONE_RECIPES)) ok(r.star >= 2 && r.goods && r.level >= 2, `zone recipe ${k} is tiered`);

// battle XP: 3–4 ordinary wins reach level 2
const win = P.battleXp({ dang: .3, kills: 2 });
ok(win >= 25 && win <= 40, 'ordinary win ≈ 25–40 XP (' + win + ')');
ok(P.battleXp({ boss: true }) > P.battleXp({ dang: 1, elite: true }), 'boss gives the most');
ok(Math.ceil(100 / win) >= 3 && Math.ceil(100 / win) <= 4, 'level 2 after 3–4 wins');

console.log(`progression: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
