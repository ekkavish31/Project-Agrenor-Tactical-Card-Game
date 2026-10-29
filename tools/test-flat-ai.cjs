/* v97.01 · monster tactics by intelligence */
const B = require('../js/flat-battle.js'); let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m) } };
const mk = (iq, foes, me = {}) => { const st = B.create({ bounds: { u0: 0, v0: 0, u1: 14, v1: 14 }, hero: { u: 0, v: 14, hp: 60, maxHp: 60 }, allies: foes, monsters: [{ u: 7, v: 7, hp: 40, maxHp: 40, atk: 12, move: 4, range: 1, iq, ...me }] }); st.units.forEach(x => { if (x.side === 'hero') x.armor = x.armor || 0 }); return st };
const tgt = st => { const m = st.units.find(x => x.side === 'monster'); st.turn = 'monster'; const steps = B.aiAct(st, m); return { m, steps, hit: steps.find(x => x.type === 'attack')?.target } };
const nameOf = st => ({ tank: 'tank', heal: 'heal', weak: 'weak' });
/* iq 0: nearest; iq 2: the healer even though a tank is nearer */
for (const [iq, want] of [[0, 'tank'], [2, 'heal']]) { const st = mk(iq, [{ u: 8, v: 7, hp: 54, maxHp: 54, name: 'tank', armor: 3 }, { u: 9, v: 8, hp: 40, maxHp: 40, name: 'heal', healer: true }]); const r = tgt(st); ok(r.hit && r.hit.name === want, 'iq' + iq + ' picks ' + want + ' (got ' + r.hit?.name + ')') }
/* iq 1: finishes a kill over a nearer healthy foe */
{ const st = mk(1, [{ u: 8, v: 7, hp: 54, maxHp: 54, name: 'tank' }, { u: 7, v: 10, hp: 6, maxHp: 44, name: 'weak' }]); ok(tgt(st).hit?.name === 'weak', 'iq1 finishes the weak one') }
/* iq 2: the hero when he is about to fall */
{ const st = mk(2, [{ u: 8, v: 7, hp: 54, maxHp: 54, name: 'tank' }]); const h = st.units[0]; h.u = 7; h.v = 11; h.hp = 14; const r = tgt(st); ok(r.hit === h, 'iq2 goes for the hero at 14 HP (got ' + r.hit?.name + ')') }
/* flee: iq 3 at 15 % moves away from the foes and recovers; iq 0 keeps fighting */
{ const st = mk(3, [{ u: 8, v: 7, hp: 54, maxHp: 54, name: 'tank' }], { hp: 6 }); const m = st.units.find(x => x.side === 'monster'), d0 = Math.abs(m.u - 8) + Math.abs(m.v - 7), r = tgt(st); const d1 = Math.abs(m.u - 8) + Math.abs(m.v - 7);
  ok(d1 > d0 && !r.steps.some(x => x.type === 'attack'), 'iq3 flees instead of attacking (' + d0 + ' → ' + d1 + ')') }
{ const st = mk(0, [{ u: 8, v: 7, hp: 54, maxHp: 54, name: 'tank' }], { hp: 6 }); ok(tgt(st).hit?.name === 'tank', 'iq0 never flees') }
/* flee is limited (cornered units fight) */
{ const st = mk(3, [{ u: 1, v: 1, hp: 54, maxHp: 54, name: 'tank', move: 4 }], { hp: 5, u: 0, v: 0 }); const m = st.units.find(x => x.side === 'monster'); m.fled = 3; ok(tgt(st).hit?.name === 'tank', 'out of flees → fights') }
/* kiting: an iq 2 archer shoots from range and ends away from the melee foe */
{ const st = mk(2, [{ u: 6, v: 7, hp: 54, maxHp: 54, name: 'tank', move: 4 }], { range: 4, atk: 10 }); const r = tgt(st); ok(r.hit && Math.abs(r.m.u - 6) + Math.abs(r.m.v - 7) >= 3, 'archer keeps its distance: ' + (Math.abs(r.m.u - 6) + Math.abs(r.m.v - 7))) }
/* v97.14 · flanking by intelligence: a foe facing the monster (SE = +u); the back cell costs more steps than the front one */
for (const [iq, want] of [[0, 'front'], [2, 'back'], [3, 'back']]) { const st = mk(iq, [{ u: 9, v: 7, hp: 54, maxHp: 54, name: 'guard', face: 'SE' }], { u: 12, v: 7, move: 6 }); const r = tgt(st); ok(r.hit?.name === 'guard' && B.sideOf(r.hit, r.m) === want, 'iq' + iq + ' hits from the ' + want + ' (got ' + (r.hit ? B.sideOf(r.hit, r.m) : 'no hit') + ')') }
/* v97.20 · bosses: tell the turn before, special every 3rd turn, enrage under half HP */
{ const st = mk(0, [{ u: 8, v: 7, hp: 54, maxHp: 54, name: 'tank' }, { u: 7, v: 8, hp: 40, maxHp: 40, name: 'b' }], { boss: true, kind: 'golem', atk: 15 }); const m = st.units.find(x => x.side === 'monster'); st.turn = 'monster';
  const t1 = B.aiAct(st, m), t2 = B.aiAct(st, m), t3 = B.aiAct(st, m);
  ok(!t1.some(s => s.type === 'charge') && t2.some(s => s.type === 'charge'), 'boss tells on its 2nd turn'); ok(t3.some(s => s.type === 'bossSkill' && s.hits.length === 2), 'ground slam hits both foes next to it');
  m.hp = 15; const a0 = m.atk; const t4 = B.aiAct(st, m); ok(t4.some(s => s.type === 'phase') && m.atk > a0 && m.enraged, 'enrage under half HP') }
/* a full fight with mixed iq never stalls */
{ let seed = 5; const rng = () => (seed = seed * 16807 % 2147483647) / 2147483647; for (let k = 0; k < 20; k++) { const st = B.create({ bounds: { u0: 0, v0: 0, u1: 10, v1: 10 }, ct: true, rng, hero: { u: 0, v: 0, hp: 60, maxHp: 60, atk: 14 }, allies: [{ u: 1, v: 0, hp: 40, maxHp: 40, atk: 10 }], monsters: [0, 1, 2, 3].map(i => ({ u: 8, v: 6 + i, hp: 30, maxHp: 30, atk: 8, iq: i })) });
    for (let t = 0; t < 40 && !st.outcome; t++) { const h = B.hero(st), m = B.monsters(st).find(B.alive); st.mp = 4; const r = B.reach(st, h); let to = null, bd = 1e9; for (const e of r.values()) { const d = Math.abs(e.u - m.u) + Math.abs(e.v - m.v); if (d < bd && d >= 1) { bd = d; to = e } } if (to) B.move(st, to); const tg = B.targets(st, h)[0]; if (tg) { tg.hp -= 14; B.checkOutcome(st) } if (st.outcome) break; B.endTurnCT(st) }
    ok(st.outcome, 'mixed-iq fight ends #' + k) } }
console.log(fail ? fail + ' failed' : 'flat-ai: all passed'); process.exit(fail ? 1 : 0);
