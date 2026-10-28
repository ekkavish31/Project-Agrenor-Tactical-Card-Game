/* v92.07 · Flat-grid battle (phase 2 of docs/PLAN-v92.md). No heights, no cards yet: one hero and one monster on the village lattice.
   Pure logic (works in the browser and in node). The map only has to answer kindAt(u,v) with one of the four terrain kinds:
     normal  ปกติ      cost 1
     slow    เดินช้า    cost 2 to enter
     cover   กำบัง     cost 1, damage taken −30 %
     blocked กีดขวาง   cannot enter
   Turn: the side to act has `mp` movement points (spent per cell entered, by terrain) and one attack; attacking ends its movement. */
(function (root) {
  'use strict';
  const KINDS = {
    normal: { cost: 1, name: 'ปกติ' },
    slow: { cost: 2, name: 'เดินช้า' },
    cover: { cost: 1, name: 'กำบัง', reduce: .3 },
    blocked: { cost: Infinity, name: 'กีดขวาง' }
  };
  const key = (u, v) => u + ',' + v, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const dist = (a, b) => Math.abs(a.u - b.u) + Math.abs(a.v - b.v);
  const alive = u => !!u && u.hp > 0;

  function create(o) {
    const b = o.bounds, st = {
      bounds: { u0: b.u0, v0: b.v0, u1: b.u1, v1: b.v1 },
      kindAt: o.kindAt || (() => 'normal'),
      units: [
        { id: 'hero', side: 'hero', name: 'ฮีโร่', hp: 60, maxHp: 60, atk: 12, def: 3, move: 4, range: 1, ...o.hero },
        { id: 'monster', side: 'monster', name: 'มอนสเตอร์', hp: 40, maxHp: 40, atk: 9, def: 1, move: 4, range: 1, ...o.monster }
      ],
      turn: 'hero', turns: 1, mp: 0, acted: false, outcome: null, log: []
    };
    st.mp = st.units[0].move;
    return st;
  }
  const hero = st => st.units[0], monster = st => st.units[1];
  const actor = st => st.units.find(u => u.side === st.turn);
  const foe = (st, u) => st.units.find(x => x.side !== u.side);
  const inside = (st, u, v) => u >= st.bounds.u0 && u <= st.bounds.u1 && v >= st.bounds.v0 && v <= st.bounds.v1;
  function kind(st, u, v) { if (!inside(st, u, v)) return 'blocked'; const k = st.kindAt(u, v); return KINDS[k] ? k : 'normal' }
  const cost = (st, u, v) => KINDS[kind(st, u, v)].cost;
  function free(st, u, v, self) { return inside(st, u, v) && cost(st, u, v) < Infinity && !st.units.some(x => x !== self && alive(x) && x.u === u && x.v === v) }

  /* cells `unit` can reach with `budget` movement points → Map key → { u, v, cost, from } */
  function reach(st, unit, budget = st.mp) {
    const best = new Map([[key(unit.u, unit.v), { u: unit.u, v: unit.v, cost: 0, from: null }]]), open = [best.get(key(unit.u, unit.v))];
    while (open.length) {
      open.sort((a, b) => a.cost - b.cost); const c = open.shift();
      for (const [du, dv] of DIRS) {
        const u = c.u + du, v = c.v + dv; if (!free(st, u, v, unit)) continue;
        const n = c.cost + cost(st, u, v); if (n > budget) continue;
        const k = key(u, v), old = best.get(k); if (old && old.cost <= n) continue;
        const e = { u, v, cost: n, from: key(c.u, c.v) }; best.set(k, e); open.push(e);
      }
    }
    return best;
  }
  /* movement cost from every cell to `goal` (terrain-aware, units ignored) — the monster follows it around walls instead of getting stuck */
  function distField(st, goal) {
    const best = new Map([[key(goal.u, goal.v), 0]]), open = [{ u: goal.u, v: goal.v, c: 0 }];
    while (open.length) {
      open.sort((a, b) => a.c - b.c); const c = open.shift(); if (c.c > best.get(key(c.u, c.v))) continue;
      for (const [du, dv] of DIRS) {
        const u = c.u + du, v = c.v + dv; if (!inside(st, u, v) || cost(st, u, v) === Infinity) continue;
        const n = c.c + cost(st, c.u, c.v), k = key(u, v), old = best.get(k); if (old !== undefined && old <= n) continue;
        best.set(k, n); open.push({ u, v, c: n });
      }
    }
    return best;
  }
  function pathTo(map, to) { const out = []; for (let e = map.get(key(to.u, to.v)); e; e = e.from ? map.get(e.from) : null) out.unshift({ u: e.u, v: e.v }); return out }

  function canMove(st, to) {
    if (st.outcome) return { ok: false, reason: 'จบการต่อสู้แล้ว' };
    const u = actor(st); if (st.acted) return { ok: false, reason: 'โจมตีแล้ว เดินต่อไม่ได้' };
    const r = reach(st, u), e = r.get(key(to.u, to.v));
    if (!e || (to.u === u.u && to.v === u.v)) return { ok: false, reason: 'ไปช่องนั้นไม่ได้' };
    return { ok: true, cost: e.cost, path: pathTo(r, to) };
  }
  function move(st, to) {
    const c = canMove(st, to); if (!c.ok) return c;
    const u = actor(st); u.u = to.u; u.v = to.v; st.mp -= c.cost;
    st.log.push(u.name + ' เดิน ' + c.cost + ' แต้ม');
    return { ok: true, path: c.path, cost: c.cost };
  }
  function targets(st, att) { const t = foe(st, att); return alive(t) && dist(att, t) <= att.range ? [t] : [] }
  function damageFor(st, att, tgt) {
    let d = Math.max(1, att.atk - tgt.def), notes = [];
    if (kind(st, tgt.u, tgt.v) === 'cover') { d = Math.max(1, Math.round(d * (1 - KINDS.cover.reduce))); notes.push('กำบัง −30%') }
    return { damage: d, notes };
  }
  function attack(st) {
    if (st.outcome) return { ok: false, reason: 'จบการต่อสู้แล้ว' };
    if (st.acted) return { ok: false, reason: 'โจมตีไปแล้วในเทิร์นนี้' };
    const a = actor(st), t = targets(st, a)[0];
    if (!t) return { ok: false, reason: 'ศัตรูอยู่นอกระยะ' };
    const r = damageFor(st, a, t); t.hp = Math.max(0, t.hp - r.damage); st.acted = true; st.mp = 0;
    st.log.push(a.name + ' ตี ' + t.name + ' −' + r.damage + (r.notes.length ? ' (' + r.notes.join(', ') + ')' : ''));
    if (!alive(t)) st.outcome = t.side === 'monster' ? 'win' : 'lose';
    return { ok: true, damage: r.damage, target: t, notes: r.notes };
  }
  function endTurn(st) {
    if (st.outcome) return { ok: false, reason: 'จบการต่อสู้แล้ว' };
    st.turn = st.turn === 'hero' ? 'monster' : 'hero'; if (st.turn === 'hero') st.turns++;
    st.acted = false; st.mp = actor(st).move;
    return { ok: true, turn: st.turn };
  }
  /* the monster's whole turn: walk toward the hero as far as the points allow, attack if in range, end turn. Returns the steps (for animation). */
  function monsterTurn(st) {
    const steps = [];
    if (st.outcome || st.turn !== 'monster') return steps;
    const m = actor(st), h = foe(st, m), r = reach(st, m);
    const field = distField(st, h), dOf = (u, v) => { const x = field.get(key(u, v)); return x === undefined ? 1e6 : x };
    let bestK = key(m.u, m.v), bestD = dOf(m.u, m.v), bestC = 0;
    for (const [k, e] of r) { const d = dOf(e.u, e.v); if (d < bestD || (d === bestD && e.cost < bestC)) { bestK = k; bestD = d; bestC = e.cost } }
    if (bestK !== key(m.u, m.v)) { const to = r.get(bestK), mv = move(st, { u: to.u, v: to.v }); if (mv.ok) steps.push({ type: 'move', path: mv.path }) }
    const at = attack(st); if (at.ok) steps.push({ type: 'attack', damage: at.damage, notes: at.notes });
    if (!st.outcome) endTurn(st);
    return steps;
  }
  const api = { KINDS, distField, create, hero, monster, actor, foe, kind, reach, pathTo, canMove, move, targets, damageFor, attack, endTurn, monsterTurn, dist, alive };
  root.FlatBattle = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
