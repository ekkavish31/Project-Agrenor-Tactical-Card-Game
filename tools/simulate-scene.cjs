// v98.492 · SET-PIECE simulator: ก้อนหิว in its FIXED scene (js/set-pieces.js hungerPit: roots, waves, plateau) — two bots: NAIVE (hits the nearest foe) vs SMART (cuts the roots first, then the boss)
//   Usage: node tools/simulate-scene.cjs [runs=150]  → win rate per hero level for both bots
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
const P = require(path.join(__dirname, '..', 'js', 'progression.js')); const SP = require(path.join(__dirname, '..', 'js', 'set-pieces.js')), SC = SP.get(process.env.SCENE || 'hungerPit'), AK = SC.anchorKind || 'hungerRoot'; const BOT = process.env.BOT || 'smart'; { const tune = JSON.parse(process.env.TUNE || '{}'); const w = tune.waves; delete tune.waves; Object.assign(SC, tune); if (w) Object.assign(SC.waves, w) }
const RUNS = +process.argv[2] || 150;

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
  const fs = P.foeScale(lv), MONS = { hunger: { hp: 150, atk: 14, move: 2, range: 3, el: 'dark', iq: 2, name: 'ก้อนหิว' }, hungerRoot: { hp: 42, atk: 0, move: 0, el: 'dark', iq: 0, passive: true, name: 'ปมหิว' }, murk: { hp: 38, atk: 9, move: 4, el: 'dark', iq: 1, name: 'สัตว์รอยหมอง' }, bandit: { hp: 34, atk: 8, move: 3, el: 'earth', iq: 2, name: 'โจรป่า' }, wolf: { hp: 26, atk: 7, move: 4, el: 'wind', iq: 1, name: 'หมาป่า' }, alarmHorn: { hp: 30, atk: 0, move: 0, el: 'earth', iq: 0, passive: true, name: 'แตรสัญญาณ' } };
  const monsters = SC.enemies.map(e => { const T = MONS[e.kind], hp = Math.round(T.hp * (e.hp || 1) * fs.hp); return { ...{ u: e.u, v: e.v }, id: undefined, name: e.name || T.name, kind: e.kind, boss: !!e.boss, hp, maxHp: hp, atk: Math.round(T.atk * fs.atk * (e.boss ? 1.15 : 1)), move: T.move, range: T.range || 1, el: T.el, iq: Math.min(3, T.iq + (e.boss ? 1 : 0)), passive: !!T.passive, ct: e.ct } });
  const allies2 = allies.map((a, i) => ({ ...a, ...(SC.allies[i] || { u: 0, v: 8 }) }));
  let nwave = 0; const st = B.create({ bounds: { u0: -SC.R, v0: -SC.R, u1: SC.R, v1: SC.R }, kindAt: (u, v) => SP.cell(SC, u, v).k, levelAt: (u, v) => SP.cell(SC, u, v).level, cards: true, ct: true, rng, deckConfig: deckFor(lv), objective: { ...SC.obj },
    hero: { ...SC.hero, hp: g.maxHp, maxHp: g.maxHp, el: 'earth', stamina: bh.st, stMax: bh.stMax, power: bh.power, spell: bh.spell, crit: bh.crit, armor: bh.armor }, allies: allies2, monsters });
  for (const u of st.units) if (u.side === 'monster') { u.speed = Math.max(5, Math.min(10, Math.round(5 + (u.move || 3)))); u.ct = u.ct ?? u.speed * 3 } else if (u.id !== 'hero') { u.speed = 8; u.ct = 40 }
  st.rules = SP.rules(SC, { alive: u => u.hp > 0, free: (s2, u, v) => !s2.units.some(x => x.hp > 0 && x.u === u && x.v === v), mk: (kind, pos, ex) => { const T = MONS[kind]; if (!T) return null; const hp = Math.round(T.hp * fs.hp); nwave++; return { id: 'wave' + nwave, side: 'monster', ai: true, ...pos, ...ex, kind, name: T.name + ' ' + (nwave + 2), hp, maxHp: hp, atk: Math.round(T.atk * fs.atk), def: 1, move: T.move, range: 1, boss: false, iq: T.iq, el: T.el, speed: 8, ct: 16 } } });
  const h = B.hero(st);
  for (let turn = 0; turn < 40 && !st.outcome; turn++) {
    for (let guard = 0; guard < 8 && B.crystals(st) && !st.outcome; guard++) {
      const hand = st.deck.combat.hand; let best = -1, bestV = -1;
      for (let i = 0; i < hand.length; i++) { if (!hand[i] || B.combatBlock(st, i)) continue; const r = B.CARD[hand[i].id]; let v = r.self ? (r.heal && h.hp < h.maxHp * .45 ? 40 : r.restore && h.stamina < 30 ? 25 : r.guard ? 4 : 1) : (r.dmg + (r.perLevel || 0)) * (r.hits || 1) + (r.aoe ? 6 : 0); if (v > bestV) { bestV = v; best = i } }
      if (best >= 0 && bestV > 5) { B.playCombat(st, best); continue }
      { const roots = B.monsters(st).filter(m => B.alive(m) && m.kind === AK); if (BOT === 'smart' && roots.length) { const t1 = B.targets(st, h, 1).find(x => x.kind === AK); if (t1) st.target = t1.id } else if (BOT === 'smart') { const t1 = B.targets(st, h, 1).find(x => x.boss); if (t1) st.target = t1.id } }
      if (!st.acted && !B.targets(st, h, 1).length) {
        const mv = st.deck.movement.hand.map((c, i) => [c, i]).filter(([c]) => c && D.MOVE[c.id].stamina <= h.stamina).sort((a, b) => D.MOVE[b[0].id].move - D.MOVE[a[0].id].move)[0];
        if (mv && st.mp < 3) { B.playMove(st, mv[1]); }
        const r = B.reach(st, h, st.mp); let to = null, bd = 1e9;
        for (const e of r.values()) { const foc = (() => { const al = B.monsters(st).filter(B.alive); if (BOT !== 'smart') return al; const rr = al.filter(m => m.kind === AK); return rr.length ? rr : al.filter(m => m.boss).length ? al.filter(m => m.boss) : al })(); const d = Math.min(...foc.map(m => B.dist(e, m))); if (d >= 1 && d < bd) { bd = d; to = e } }
        if (to && (to.u !== h.u || to.v !== h.v)) { B.move(st, { u: to.u, v: to.v }); continue }
      }
      if (best >= 0) { B.playCombat(st, best); continue }
      break;
    }
    if (st.outcome) break;
    if (1) { B.endTurnCT(st); continue }
    B.alliesTurn(st); if (st.outcome) break;
    B.endTurn(st); B.monsterTurn(st);
  }
  return { rev: B.monsters(st).reduce((a, m) => a + (m.revived | 0), 0), win: st.outcome === 'win', turns: st.turns, hp: Math.max(0, h.hp) / h.maxHp, down: B.allies(st).filter(a => !B.alive(a)).length };
}

const rows = [];
for (const lv of [8, 10, 12, 14]) {
  let w = 0, tt = 0, hp = 0, down = 0, rev = 0;
  for (let i = 0; i < RUNS; i++) { const r = fight(lv, .95); w += r.win; tt += r.turns; hp += r.hp; down += r.down; rev += r.rev }
  rows.push({ scene: SC.id, bot: BOT, level: lv, win: Math.round(w / RUNS * 100) + '%', turns: (tt / RUNS).toFixed(1), heroHpLeft: Math.round(hp / RUNS * 100) + '%', alliesDown: (down / RUNS).toFixed(2), revivesPerFight: (rev / RUNS).toFixed(2) });
}
console.table(rows);
