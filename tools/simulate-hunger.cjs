// v98.489 · Boss simulator for ก้อนหิว (hunger) + 2 สัตว์รอยหมอง (murk) at hero levels — adapted from tools/simulate-flat.cjs
//   Usage: node tools/simulate-hunger.cjs [runs=200]  → win rate, turns, HP left, allies down, boss specials used
// v95.00 · Balance simulator for the world-map card battle (js/flat-battle.js) with the current progression (js/progression.js).
// A greedy player: hits with the strongest playable card, heals when low, otherwise plays a move card and walks to the nearest foe.
// Usage: [CT=1] node tools/simulate-flat.cjs [runs=300]   (CT=1: FFT speed-gauge turn order, v97)   → win rate, turns, HP left per hero level × danger
const path = require('path');
global.window = global;
const D = require(path.join(__dirname, '..', 'js', 'tactics-decks.js'));
require(path.join(__dirname, '..', 'js', 'elements.js'));
const B = require(path.join(__dirname, '..', 'js', 'flat-battle.js'));
const P = require(path.join(__dirname, '..', 'js', 'progression.js'));
const RUNS = +process.argv[2] || 200;

// copied from js/town-battle.js (MON) and js/village-life.js (ALLY_STATS)
const MON = { bandit: { hp: 34, move: 3, atk: 8, el: 'earth' }, wolf: { hp: 26, move: 4, atk: 7, el: 'wind' }, slime: { hp: 40, move: 2, atk: 8, el: 'water' }, kobold: { hp: 30, move: 3, atk: 9, el: 'earth' }, bat: { hp: 22, move: 5, atk: 7, el: 'dark', fly: true } };
const ALLY = { kier: { hp: 48, atk: 13, move: 4, range: 1, el: 'fire' }, bram: { hp: 54, atk: 12, move: 4, range: 1, def: 2, el: 'earth' }, luna: { hp: 44, atk: 11, move: 3, range: 4, el: 'fusion' } };
const FOES = Object.keys(MON), IQ = { bandit: 2, wolf: 1, kobold: 1, bat: 1, frostWolf: 1, snowKobold: 1, yeti: 1, frostQueen: 3, shadowWolf: 2 };   // = js/town-battle.js MON.iq (IQ=0 turns the tactics off)

let seed = 1; const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 };
const pick = a => a[Math.floor(rng() * a.length)];

/* the hero at a level: weapon and stat points of a typical player */
function heroSave(lv) {
  const weapon = lv <= 1 ? { id: 1, kind: 'knife', recipe: 'oldKnife', quality: 1 } : lv <= 3 ? { id: 1, kind: 'sword', recipe: 'sword', quality: 1 } : lv <= 6 ? { id: 1, kind: 'sword', recipe: 'fangBlade', quality: 2 } : { id: 1, kind: 'sword', recipe: 'frostBlade', quality: 3 };
  const pts = 2 * (lv - 1), stats = { strength: Math.ceil(pts / 2), endurance: Math.floor(pts / 2), precision: 0, knowledge: 0 };
  const g = { fatigue: 20, inventory: [weapon], equipped: 1, village: { character: { level: lv, xp: 0, points: 0, stats } } };
  P.sync(g); return g;
}
function deckFor(lv) {
  const d = JSON.parse(JSON.stringify(D.STARTER));
  d.combat.skill = 1; d.combat.line = 2; d.combat.formation = 1; d.combat.quake = 2; d.combat.counter = 1;   // the intro's cards
  for (let l = 2; l <= lv; l++) for (const c of P.LEVEL_CARDS[l] || []) d.combat[c.id] = (d.combat[c.id] || 0) + c.n;
  try { return D.validate(d) } catch (e) { return d }
}
function fight(lv, dang) {
  const g = heroSave(lv), bh = P.battleHero(g, P.ZONE_RECIPES), allyN = lv <= 3 ? 1 : lv <= 6 ? 2 : 3;
  const allies = ['kier', 'bram', 'luna'].slice(0, allyN).map((k, i) => { const a = ALLY[k], alv = Math.max(1, lv - 1); return { u: 1, v: 4 + i, key: k, name: k, hp: a.hp + 4 * (alv - 1), maxHp: a.hp + 4 * (alv - 1), atk: a.atk + alv - 1, armor: a.def || 0, move: a.move, range: a.range, el: a.el, order: 'charge' } });
  const fs = P.foeScale(lv), HP = +process.env.HUNGER_HP || 150, EFF = +process.env.EFF_HP || 130, BASE = Math.round(EFF / HP * 10) / 10 * fs.hp;
  const monsters = [{ u: 8, v: 4, name: 'ก้อนหิว', kind: 'hunger', boss: true, hp: Math.round(HP * BASE), maxHp: Math.round(HP * BASE), atk: Math.round(14 * fs.atk), move: 2, range: 3, el: 'dark', iq: 2 }].concat([0, 1].map(i => ({ u: 8, v: 2 + i * 4, name: 'สัตว์รอยหมอง ' + (i + 1), kind: 'murk', hp: Math.round(38 * (1.2 + dang * .6) * fs.hp), maxHp: Math.round(38 * (1.2 + dang * .6) * fs.hp), atk: Math.round(9 * fs.atk), move: 4, el: 'dark', iq: 1 })));
  const st = B.create({ bounds: { u0: 0, v0: 0, u1: 10, v1: 9 }, kindAt: () => 'normal', cards: true, ct: !!process.env.CT, rng, deckConfig: deckFor(lv),
    hero: { u: 2, v: 5, hp: g.maxHp, maxHp: g.maxHp, el: 'earth', stamina: bh.st, stMax: bh.stMax, power: bh.power, spell: bh.spell, crit: bh.crit, armor: bh.armor }, allies, monsters });
  const h = B.hero(st);
  for (let turn = 0; turn < 40 && !st.outcome; turn++) {
    for (let guard = 0; guard < 8 && B.crystals(st) && !st.outcome; guard++) {
      const hand = st.deck.combat.hand; let best = -1, bestV = -1;
      for (let i = 0; i < hand.length; i++) { if (!hand[i] || B.combatBlock(st, i)) continue; const r = B.CARD[hand[i].id]; let v = r.self ? (r.heal && h.hp < h.maxHp * .45 ? 40 : r.restore && h.stamina < 30 ? 25 : r.guard ? 4 : 1) : (r.dmg + (r.perLevel || 0)) * (r.hits || 1) + (r.aoe ? 6 : 0); if (v > bestV) { bestV = v; best = i } }
      if (best >= 0 && bestV > 5) { B.playCombat(st, best); continue }
      if (!st.acted && !B.targets(st, h, 1).length) {
        const mv = st.deck.movement.hand.map((c, i) => [c, i]).filter(([c]) => c && D.MOVE[c.id].stamina <= h.stamina).sort((a, b) => D.MOVE[b[0].id].move - D.MOVE[a[0].id].move)[0];
        if (mv && st.mp < 3) { B.playMove(st, mv[1]); }
        const r = B.reach(st, h, st.mp); let to = null, bd = 1e9;
        for (const e of r.values()) { const d = Math.min(...B.monsters(st).filter(B.alive).map(m => B.dist(e, m))); if (d >= 1 && d < bd) { bd = d; to = e } }
        if (to && (to.u !== h.u || to.v !== h.v)) { B.move(st, { u: to.u, v: to.v }); continue }
      }
      if (best >= 0) { B.playCombat(st, best); continue }
      break;
    }
    if (st.outcome) break;
    if (process.env.CT) { B.endTurnCT(st); continue }
    B.alliesTurn(st); if (st.outcome) break;
    B.endTurn(st); B.monsterTurn(st);
  }
  return { rev: B.monsters(st).reduce((a, m) => a + (m.revived | 0), 0), win: st.outcome === 'win', turns: st.turns, hp: Math.max(0, h.hp) / h.maxHp, down: B.allies(st).filter(a => !B.alive(a)).length };
}

const rows = [];
for (const lv of [8, 10, 12, 14]) {
  let w = 0, tt = 0, hp = 0, down = 0, rev = 0;
  for (let i = 0; i < RUNS; i++) { const r = fight(lv, .95); w += r.win; tt += r.turns; hp += r.hp; down += r.down; rev += r.rev }
  rows.push({ level: lv, win: Math.round(w / RUNS * 100) + '%', turns: (tt / RUNS).toFixed(1), heroHpLeft: Math.round(hp / RUNS * 100) + '%', alliesDown: (down / RUNS).toFixed(2), revivesPerFight: (rev / RUNS).toFixed(2) });
}
console.table(rows);
