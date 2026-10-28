/* v92.08 · Flat-grid battle (phase 2 of docs/PLAN-v92.md). No heights: one hero and one monster on the village lattice.
   Cards (create({cards:true})): the old deck (TacticsDecks: 3 crystals a turn, 4 move cards, 6 combat cards) drives the hero — a move card adds its
   points to st.mp, a combat card hits with the old damage numbers (sword 18, spell 14 …). Without `cards` the plain atk/def duel of v92.07 is kept.
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
    if (o.cards) {
      const TD = deckLib(); if (!TD) throw new Error('TacticsDecks missing');
      const h = st.units[0], m = st.units[1];
      Object.assign(h, { atk: 0, def: 0, stamina: 100, guard: 0, weapon: 'sword', ...o.hero });
      Object.assign(m, { def: 0, ...o.monster }); m.guard = 0;
      st.cards = true; st.deck = TD.create(o.deckConfig || TD.DEFAULT, o.rng || Math.random); st.mp = 0;
    }
    return st;
  }
  function deckLib() { return root.TacticsDecks || (typeof require === 'function' ? require('./tactics-decks.js') : null) }
  /* flat versions of the old combat cards: range in cells, raw damage, stamina cost (numbers from tactics-core cardInfo, sword) */
  const CARD = {
    attack: { range: 1, dmg: 18, st: 12, fx: 'sword' }, skill: { range: 1, dmg: 30, st: 22, fx: 'sword', big: 1.45 },
    spell: { range: 4, dmg: 14, st: 12, fx: 'arcane' }, thunder: { range: 4, dmg: 14, st: 14, fx: 'lightning' }, frost: { range: 4, dmg: 13, st: 12, fx: 'ice' },
    flame: { range: 1, dmg: 22, st: 16, fx: 'fire' }, gust: { range: 3, dmg: 7, st: 10, push: 1, fx: 'wind' }, push: { range: 1, dmg: 9, st: 8, push: 1, fx: 'blunt' },
    pull: { range: 3, dmg: 6, st: 8, pull: 1, fx: 'arcane' }, line: { range: 1, dmg: 16, st: 12, fx: 'spear' }, quake: { range: 1, dmg: 10, st: 16, fx: 'earth' },
    aimed: { range: 1, dmg: 26, st: 20, fx: 'rapier' }, whirl: { range: 1, dmg: 14, st: 14, fx: 'wind' }, twin: { range: 1, dmg: 10, st: 12, hits: 2, fx: 'knife' },
    guard: { self: true, guard: 8, st: 0, fx: 'shield' }, wall: { self: true, guard: 14, st: 6, fx: 'shield' }, rest: { self: true, restore: 30, st: 0, fx: 'heal' }, mend: { self: true, heal: 16, st: 10, fx: 'heal' }
  };
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
  /* one hit of `raw` damage on tgt: cover −30 %, then the guard pool soaks it up. Returns { damage, notes } (damage = HP actually lost) */
  function hurt(st, tgt, raw) {
    let d = Math.max(1, Math.round(raw)), notes = [];
    if (kind(st, tgt.u, tgt.v) === 'cover') { d = Math.max(1, Math.round(d * (1 - KINDS.cover.reduce))); notes.push('กำบัง −30%') }
    if (tgt.guard > 0) { const a = Math.min(tgt.guard, d); tgt.guard -= a; d -= a; notes.push('ป้องกัน −' + a) }
    tgt.hp = Math.max(0, tgt.hp - d);
    return { damage: d, notes };
  }
  function attack(st) {
    if (st.outcome) return { ok: false, reason: 'จบการต่อสู้แล้ว' };
    if (st.acted) return { ok: false, reason: 'โจมตีไปแล้วในเทิร์นนี้' };
    const a = actor(st), t = targets(st, a)[0];
    if (!t) return { ok: false, reason: 'ศัตรูอยู่นอกระยะ' };
    if (st.cards && a.side === 'hero') return { ok: false, reason: 'ใช้ไพ่โจมตี' };
    const r = st.cards ? hurt(st, t, a.atk) : damageFor(st, a, t); if (!st.cards) t.hp = Math.max(0, t.hp - r.damage); st.acted = true; st.mp = 0;
    st.log.push(a.name + ' ตี ' + t.name + ' −' + r.damage + (r.notes.length ? ' (' + r.notes.join(', ') + ')' : ''));
    if (!alive(t)) st.outcome = t.side === 'monster' ? 'win' : 'lose';
    return { ok: true, damage: r.damage, target: t, notes: r.notes };
  }
  function endTurn(st) {
    if (st.outcome) return { ok: false, reason: 'จบการต่อสู้แล้ว' };
    if (st.cards && st.turn === 'hero') { deckLib().next(st.deck, Math.random); const h = hero(st); h.stamina = Math.min(100, h.stamina + 10) }
    st.turn = st.turn === 'hero' ? 'monster' : 'hero'; if (st.turn === 'hero') st.turns++;
    st.acted = false; st.mp = st.cards && st.turn === 'hero' ? 0 : actor(st).move;
    if (st.cards && st.turn === 'hero') hero(st).guard = 0;
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
  /* ---------- cards ---------- */
  function playMove(st, index) {
    if (!st.cards || st.outcome || st.turn !== 'hero') return { ok: false, reason: 'ไม่ใช่ตาคุณ' };
    if (st.acted) return { ok: false, reason: 'โจมตีแล้ว เดินต่อไม่ได้' };
    const TD = deckLib(), h = hero(st), card = st.deck.movement.hand[index], proxy = { stamina: h.stamina, mp: 0 };
    const r = TD.selectMove(st.deck, proxy, index); if (!r.ok) return r;
    h.stamina = proxy.stamina; st.mp += r.card.move; st.log.push('ไพ่ ' + r.card.name + ' +' + r.card.move + ' แต้มเดิน');
    return { ok: true, card: card.id, move: r.card.move };
  }
  function cardRule(id) { return CARD[id] || null }
  function combatBlock(st, index) {
    if (!st.cards) return 'ไม่ได้เปิดโหมดไพ่';
    if (st.outcome) return 'จบการต่อสู้แล้ว'; if (st.turn !== 'hero') return 'ไม่ใช่ตาคุณ';
    const TD = deckLib(), c = st.deck.combat.hand[index]; if (!c || c.used) return 'ไม่มีไพ่ใบนี้';
    const rule = CARD[c.id]; if (!rule) return TD.COMBAT[c.id].name + ' ยังไม่รองรับในสนามแบน';
    const why = TD.actionBlock(st.deck, 'combat'); if (why) return why;
    const h = hero(st); if (h.stamina < rule.st) return 'แรงไม่พอ (ต้อง ' + rule.st + ')';
    if (!rule.self) { const t = foe(st, h); if (!alive(t) || dist(h, t) > rule.range) return 'ศัตรูอยู่นอกระยะ (' + rule.range + ' ช่อง)' }
    return '';
  }
  function playCombat(st, index) {
    const why = combatBlock(st, index); if (why) return { ok: false, reason: why };
    const TD = deckLib(), h = hero(st), t = foe(st, h), id = st.deck.combat.hand[index].id, rule = CARD[id], name = TD.COMBAT[id].name;
    TD.consumeCombat(st.deck, index); h.stamina -= rule.st;
    const out = { ok: true, card: id, name, fx: rule.fx, self: !!rule.self, big: rule.big || 1, hits: [] };
    if (rule.self) {
      if (rule.guard) { h.guard = Math.max(h.guard, rule.guard); out.guard = h.guard }
      if (rule.restore) { h.stamina = Math.min(100, h.stamina + rule.restore); out.restore = rule.restore }
      if (rule.heal) { const b = h.hp; h.hp = Math.min(h.maxHp, h.hp + rule.heal); out.heal = h.hp - b }
      st.log.push(name + (out.guard ? ' ป้องกัน ' + out.guard : out.heal ? ' ฟื้น ' + out.heal : out.restore ? ' แรง +' + out.restore : ''));
      return out;
    }
    st.acted = true; st.mp = 0;
    for (let i = 0; i < (rule.hits || 1); i++) {
      if (!alive(t)) break;
      const r = hurt(st, t, rule.dmg); out.hits.push({ target: t, damage: r.damage, notes: r.notes });
    }
    const total = out.hits.reduce((a, x) => a + x.damage, 0);
    st.log.push(h.name + ' ' + name + ' −' + total + (out.hits[0]?.notes.length ? ' (' + out.hits[0].notes.join(', ') + ')' : ''));
    if (alive(t) && (rule.push || rule.pull)) out.moved = shove(st, t, h, rule.push ? 1 : -1);
    if (!alive(t)) st.outcome = 'win';
    return out;
  }
  /* push (dir 1) the target one cell away from `from`, or pull (dir −1) it one cell toward; stays put when blocked */
  function shove(st, t, from, dir) {
    const du = t.u - from.u, dv = t.v - from.v, su = Math.abs(du) >= Math.abs(dv) ? Math.sign(du) : 0, sv = su ? 0 : Math.sign(dv);
    const nu = t.u + su * dir, nv = t.v + sv * dir;
    if (dir < 0 && nu === from.u && nv === from.v) return false;
    if (!free(st, nu, nv, t)) return false;
    t.u = nu; t.v = nv; return true;
  }
  const api = { CARD, cardRule, combatBlock, playMove, playCombat, hurt, KINDS, distField, create, hero, monster, actor, foe, kind, reach, pathTo, canMove, move, targets, damageFor, attack, endTurn, monsterTurn, dist, alive };
  root.FlatBattle = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
