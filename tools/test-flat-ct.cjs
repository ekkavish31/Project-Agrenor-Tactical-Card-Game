/* v97 · CT turn order for the flat battle: gauges, queue preview, AI turns run until the hero is up again */
const B = require('../js/flat-battle.js'); let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m) } };
const rng = (() => { let s = 7; return () => (s = s * 16807 % 2147483647) / 2147483647 })();
const mk = o => B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, ct: true, rng, hero: { u: 1, v: 1 }, allies: [{ u: 1, v: 2, speed: 10 }], monsters: [{ u: 8, v: 8, speed: 5 }, { u: 8, v: 7, speed: 12 }], ...o });
{ const st = mk(); ok(st.ct && st.active === st.units[0], 'hero acts first'); ok(st.units[0].ct === 100, 'hero gauge starts full') }
{ const st = mk(), q = B.queue(st, 12); ok(q[0] === st.units[0], 'queue starts with the acting unit'); ok(q.length === 12, 'queue length');
  const n = u => q.filter(x => x === u).length; ok(n(st.units[3]) > n(st.units[2]), 'faster monster appears more often: ' + n(st.units[3]) + ' vs ' + n(st.units[2])) }
{ const st = mk({ allies: [], monsters: [{ u: 2, v: 1, speed: 8, hp: 999, maxHp: 999 }] }); const hp0 = st.units[0].hp, r = B.endTurnCT(st); ok(r.ok, 'endTurnCT ok'); ok(st.turn === 'hero' && st.active === st.units[0], 'back to the hero'); ok(r.steps.at(-1).type === 'turn' && r.steps.at(-1).unit === st.units[0], 'last step is the hero turn'); ok(r.steps.some(x => x.type === 'turn' && x.unit !== st.units[0]), 'monster took a turn'); ok(st.units[0].hp < hp0, 'monster in reach hit the hero'); ok(st.turns === 2, 'turn counter') }
{ const st = mk(); for (let i = 0; i < 30 && !st.outcome; i++) { const r = B.endTurnCT(st); if (st.outcome) break; ok(st.turn === 'hero', 'hero up again #' + i); ok(r.steps.length > 0, 'steps exist') } ok(st.turns > 3, 'several rounds ran') }
{ const st = mk({ monsters: [{ u: 2, v: 1, hp: 1, maxHp: 1, passive: true }] }); B.units; st.units[2].hp = 0; B.checkOutcome(st); ok(st.outcome === 'win', 'win when all monsters are down'); ok(!B.endTurnCT(st).ok, 'no turn after the end') }
{ const st = mk(); st.units[1].hp = 0; const q = B.queue(st, 20); ok(!q.includes(st.units[1]), 'fallen units leave the queue') }
/* Auto + preview need the deck library */
const TD = require('../js/tactics-decks.js'); global.TacticsDecks = TD;
const mc = o => B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, ct: true, cards: true, rng, hero: { u: 1, v: 1, weapon: 'sword', level: 1 }, monsters: [{ u: 2, v: 1, hp: 200, maxHp: 200 }], ...o });
{ const st = mc(); const i = st.deck.combat.hand.findIndex(c => B.CARD[c.id] && !B.CARD[c.id].self && !B.combatBlock(st, st.deck.combat.hand.indexOf(c)));
  if (i >= 0) { const pv = B.preview(st, i), hp0 = st.units[1].hp, g0 = st.units[1].guard || 0, r = B.playCombat(st, i); const dealt = r.hits.reduce((a, x) => a + x.damage, 0);
    ok(pv && pv.total > 0, 'preview has damage'); ok(!r.hits.some(x => x.crit) ? dealt === pv.total : dealt >= pv.total, 'preview equals the real hit when no crit: ' + pv.total + ' vs ' + dealt) } }
for (let k = 0; k < 20; k++) { const st = mc({ hero: { u: 0, v: 0, weapon: 'sword', level: 1 }, monsters: [{ u: 7, v: 7, hp: 60, maxHp: 60, atk: 5 }] }); let guard = 0;
  while (!st.outcome && guard++ < 60) { for (let n = 0; n < 12; n++) { const p = B.autoPlan(st); if (p.type === 'end') break;
      const r = p.type === 'combat' ? B.playCombat(st, p.index) : p.type === 'moveCard' ? B.playMove(st, p.index) : B.move(st, p.to); if (!r.ok) { ok(false, 'auto plan failed: ' + JSON.stringify(p) + ' ' + r.reason); break } }
    B.endTurnCT(st) }
  ok(st.outcome, 'auto finishes the fight #' + k + ' (turns ' + st.turns + ')') }
console.log(fail ? fail + ' failed' : 'flat-ct: all passed'); process.exit(fail ? 1 : 0);
