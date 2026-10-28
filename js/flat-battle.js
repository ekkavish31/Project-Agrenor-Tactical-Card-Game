/* v92.08 · Flat-grid card battle (plan: docs/TODO.md). v94: heights below.
   v92.15: melee — the hero plus companions (create({allies:[…]}), AI-controlled, act at the end of the player phase via alliesTurn) against a
   group of monsters (create({monsters:[…]}); each acts in monsterTurn). Win = every monster down; lose = the hero down (companions can fall).
   Cards (create({cards:true})): the old deck contents (TacticsDecks: 4 move cards, 6 combat cards) drive the hero — a move card adds its points to
   st.mp, a combat card hits with the old damage numbers (sword 18, spell 14 …). v92.09 flat rules: 2 action crystals a turn (any mix), a used or
   discarded card leaves the hand and the hand is refilled only when the hero's next turn starts; discarding any number of cards at once costs
   1 crystal and gives STAMINA_PER_DISCARD stamina per card. Without `cards` the plain atk/def duel of v92.07 is kept.
   Pure logic (works in the browser and in node). The map only has to answer kindAt(u,v) with one of the four terrain kinds:
     normal  ปกติ      cost 1
     slow    เดินช้า    cost 2 to enter
     cover   กำบัง     cost 1, damage taken −30 %
     blocked กีดขวาง   cannot enter
   Turn: the side to act has `mp` movement points (spent per cell entered, by terrain) and one attack; attacking ends its movement.
   v94 heights (create({levelAt(u,v)}) — the world-map fields use js/terrain-height.js, levels 0–3; without levelAt everything is level 0):
     • walking: climb up at most 1 level (+1 movement point per level), jump down at most 2 · the ปีนป่าย card: up 2 / down 3 and no uphill cost
     • melee (range 1) only reaches a target at most 1 level up or down · ranged cards ignore height
     • height bonus: +10 % damage per level above the target, −10 % per level below (max ±30 %) · ยึดที่สูง doubles it for the percher
     • กระโจนฟาด strikes down any number of levels (+25 %/level, max 3; same level ×0.85) · หินถล่ม needs higher ground (8 +6 per level, range 3, slows)
     • ทุบธรณี: targets below take ×1.5, targets 2+ levels above are out of reach · push/pull: a shove down 2+ levels costs 5 HP per level */
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
      kindAt: o.kindAt || (() => 'normal'), levelAt: o.levelAt || null,
      units: [
        { id: 'hero', side: 'hero', name: 'ฮีโร่', hp: 60, maxHp: 60, atk: 12, def: 3, move: 4, range: 1, ...o.hero },
        ...(o.allies || []).map((a, i) => ({ id: 'ally' + i, side: 'hero', ai: true, name: 'เพื่อน', hp: 40, maxHp: 40, atk: 10, def: 0, move: 4, range: 1, ...a })),
        ...(o.monsters || [o.monster || {}]).map((m, i) => ({ id: i ? 'monster' + (i + 1) : 'monster', side: 'monster', ai: true, name: 'มอนสเตอร์', hp: 40, maxHp: 40, atk: 9, def: 1, move: 4, range: 1, ...m }))
      ],
      turn: 'hero', turns: 1, mp: 0, acted: false, outcome: null, log: []
    };
    st.mp = st.units[0].move;
    if (o.cards) {
      const TD = deckLib(); if (!TD) throw new Error('TacticsDecks missing');
      const h = st.units[0];
      Object.assign(h, { atk: 0, def: 0, stamina: 100, guard: 0, weapon: 'sword', ...o.hero });
      st.units.forEach((u, i) => { if (i) { if (u.def === 1 && u.side === 'monster') u.def = 0; u.guard = u.guard || 0 } });
      st.cards = true; st.rng = o.rng || Math.random; st.deck = TD.create(o.deckConfig || TD.DEFAULT, st.rng); st.mp = 0;
      st.crystalMax = o.crystals || CRYSTALS; st.spent = 0; st.drawn = [...st.deck.movement.hand, ...st.deck.combat.hand].map(c => c.uid);
    }
    return st;
  }
  /* critical hits (card mode): hero 15 %, monster 8 %, ×1.5 damage */
  const CRIT = { hero: .15, ally: .12, monster: .08, mult: 1.5 };
  const CRYSTALS = 2, STAMINA_PER_DISCARD = 10, HAND = { movement: 4, combat: 6 };
  const crystals = st => Math.max(0, (st.crystalMax || CRYSTALS) - (st.spent || 0));
  function cardEvent(st, type, group, cards) { if (cards.length) (st.deck.cardEvents ||= []).push({ type, group, cards: cards.map(c => ({ ...c })), seq: st.deck.cardSeq = (st.deck.cardSeq || 0) + 1 }) }
  /* take card `index` out of the hand into the discard pile (no refill — that waits for the next turn) */
  function spend(st, group, index) { const p = st.deck[group], c = p.hand.splice(index, 1)[0]; p.discard.push({ ...c, used: false }); cardEvent(st, 'discard', group, [c]); return c }
  /* start of the hero's turn: refill both hands (reshuffling the discard pile when the draw pile runs out), crystals back to full */
  function refill(st) {
    const TD = deckLib(), drawn = [];
    for (const group of ['movement', 'combat']) {
      const p = st.deck[group], got = [];
      while (p.hand.length < HAND[group]) {
        if (!p.draw.length) { if (!p.discard.length) break; p.draw = TD.shuffle(p.discard.map(c => ({ ...c, used: false })), st.rng || Math.random); p.discard = []; p.cycles++; cardEvent(st, 'shuffle', group, p.draw) }
        const c = p.draw.pop(); c.used = false; p.hand.push(c); got.push(c);
      }
      cardEvent(st, 'draw', group, got); drawn.push(...got.map(c => c.uid));
    }
    st.spent = 0; st.drawn = drawn; return drawn;
  }
  function deckLib() { return root.TacticsDecks || (typeof require === 'function' ? require('./tactics-decks.js') : null) }
  /* flat versions of the old combat cards: range in cells, raw damage, stamina cost (numbers from tactics-core cardInfo, sword) */
  const CARD = {
    attack: { range: 1, dmg: 18, st: 12, fx: 'sword' }, skill: { range: 1, dmg: 30, st: 22, fx: 'sword', big: 1.45 },
    spell: { range: 4, dmg: 14, st: 12, fx: 'arcane' }, thunder: { range: 4, dmg: 14, st: 14, fx: 'lightning' }, frost: { range: 4, dmg: 13, st: 12, fx: 'ice' },
    flame: { range: 1, dmg: 22, st: 16, fx: 'fire' }, gust: { range: 3, dmg: 7, st: 10, push: 1, fx: 'wind' }, push: { range: 1, dmg: 9, st: 8, push: 1, fx: 'blunt' },
    pull: { range: 3, dmg: 6, st: 8, pull: 1, fx: 'arcane' }, line: { range: 1, dmg: 16, st: 12, fx: 'spear' }, quake: { range: 1, dmg: 10, st: 16, fx: 'earth', aoe: 'splash' },
    aimed: { range: 1, dmg: 26, st: 20, fx: 'rapier' }, whirl: { range: 1, dmg: 14, st: 14, fx: 'wind', aoe: 'self' }, twin: { range: 1, dmg: 10, st: 12, hits: 2, fx: 'knife' },
    guard: { self: true, guard: 8, st: 0, fx: 'shield' },
    /* v92.13 flat versions of the reaction / position cards */
    evade: { self: true, evade: 1, st: 8, fx: 'wind' }, counter: { self: true, counter: 1, st: 10, fx: 'parry' }, ambush: { self: true, ambush: 1.6, st: 10, fx: 'arcane' },
    firstAid: { self: true, heal: 14, st: 0, fx: 'heal' }, backstab: { range: 1, dmg: 18, st: 12, behind: 12, fx: 'knife' }, dive: { range: 3, dmg: 16, st: 14, leap: 1, fx: 'blunt' },
    tide: { range: 2, dmg: 10, st: 10, push: 1, fx: 'water' }, formation: { range: 1, dmg: 14, st: 12, guardAfter: 6, fx: 'sword' }, wall: { self: true, guard: 14, st: 6, fx: 'shield' },
    /* v94 height cards (numbers from tactics-core) */
    rockfall: { range: 3, dmg: 8, perLevel: 6, high: 1, slow: 1, st: 10, fx: 'earth' }, perch: { self: true, guard: 6, perch: 2, st: 6, fx: 'shield' }, climb: { self: true, climb: 1, st: 6, fx: 'wind' },
    rest: { self: true, restore: 30, st: 0, fx: 'heal' }, mend: { self: true, heal: 16, st: 10, fx: 'heal' }
  };
  const hero = st => st.units[0];
  const monsters = st => st.units.filter(u => u.side === 'monster'), allies = st => st.units.filter((u, i) => i && u.side === 'hero');
  const monster = st => monsters(st).find(alive) || monsters(st)[0];
  const actor = st => st.turn === 'hero' ? hero(st) : (st.cur && alive(st.cur) ? st.cur : monster(st));
  const opponents = (st, u) => st.units.filter(x => x.side !== u.side && alive(x));
  /* nearest living opponent (falls back to any opponent so old callers still get a unit) */
  const foe = (st, u) => opponents(st, u).sort((a, b) => dist(u, a) - dist(u, b))[0] || st.units.find(x => x.side !== u.side);
  function checkOutcome(st) { if (!alive(hero(st))) st.outcome = 'lose'; else if (!monsters(st).some(alive)) st.outcome = 'win'; return st.outcome }
  const inside = (st, u, v) => u >= st.bounds.u0 && u <= st.bounds.u1 && v >= st.bounds.v0 && v <= st.bounds.v1;
  function kind(st, u, v) { if (!inside(st, u, v)) return 'blocked'; const k = st.kindAt(u, v); return KINDS[k] ? k : 'normal' }
  const cost = (st, u, v) => KINDS[kind(st, u, v)].cost;
  function free(st, u, v, self) { return inside(st, u, v) && cost(st, u, v) < Infinity && !st.units.some(x => x !== self && alive(x) && x.u === u && x.v === v) }
  /* ---------- heights (v94) ---------- */
  const lv = (st, u, v) => (st.levelAt ? st.levelAt(u, v) || 0 : 0);
  /* may `unit` step from (fu,fv) onto (tu,tv)? (unit null = any walker without the climb card) */
  function climbOk(st, unit, fu, fv, tu, tv) { if (unit?.fly) return true; const d = lv(st, tu, tv) - lv(st, fu, fv), c = unit?.climb ? 1 : 0; return d > 0 ? d <= 1 + c : -d <= 2 + c }
  const upCost = (st, unit, fu, fv, tu, tv) => unit?.climb || unit?.fly ? 0 : Math.max(0, lv(st, tu, tv) - lv(st, fu, fv));
  const gap = (st, a, b) => lv(st, a.u, a.v) - lv(st, b.u, b.v);      // > 0: a stands higher
  function heightMult(st, a, t) { const d = Math.max(-3, Math.min(3, gap(st, a, t))); if (!d) return 1; const k = (d > 0 && a.perch) || (d < 0 && t.perch) ? .2 : .1; return Math.max(.4, 1 + k * d) }
  /* ---------- Kaelam elements (v94.02, js/elements.js): the attack's element vs the target's element ---------- */
  const EW = () => root.ElementWheel || (typeof require === 'function' ? require('./elements.js') : null);
  const WEAPON_EL = { bow: 'wind', axe: 'earth', tome: 'light', sword: 'fire', hammer: 'earth', staff: 'fusion', unarmed: 'earth', knife: 'wind', spear: 'wind', rapier: 'water' };
  const CARD_EL = { thunder: 'lightning', frost: 'ice', flame: 'fire', gust: 'wind', quake: 'earth', aimed: 'light', spell: 'fusion', tide: 'water', push: 'earth', pull: 'wind', rockfall: 'earth', whirl: 'wind' };
  const FX_EL = { fire: 'fire', ice: 'ice', lightning: 'lightning', wind: 'wind', earth: 'earth', holy: 'light', heal: 'light', water: 'water', arcane: 'fusion' };
  const cardEl = (id, h) => CARD_EL[id] || WEAPON_EL[h.weapon] || 'earth';
  function elOf(u) { return u.el || null }
  function elMult(st, el, tgt, notes) { const W = EW(); if (!W || !el) return 1; const m = W.mult(el, elOf(tgt)); if (m !== 1) notes.push(W.note(el, elOf(tgt))); if (W.isSecret(el)) W.reveal(el); return m }
  const heightNote = m => m > 1 ? 'ที่สูง +' + Math.round((m - 1) * 100) + '%' : m < 1 ? 'ต่ำกว่า −' + Math.round((1 - m) * 100) + '%' : '';
  /* a melee blow (range 1) needs the two cells within one level of each other */
  const meleeOk = (st, a, t) => Math.abs(gap(st, a, t)) <= (a.fly || t.fly ? 3 : 1);   // flyers reach any height
  /* a cell at the top of a 2+ drop: standing there invites a shove off the cliff */
  const ledge = (st, u, v) => DIRS.some(([du, dv]) => inside(st, u + du, v + dv) && lv(st, u, v) - lv(st, u + du, v + dv) >= 2);

  /* cells `unit` can reach with `budget` movement points → Map key → { u, v, cost, from } */
  function reach(st, unit, budget = st.mp) {
    const best = new Map([[key(unit.u, unit.v), { u: unit.u, v: unit.v, cost: 0, from: null }]]), open = [best.get(key(unit.u, unit.v))];
    while (open.length) {
      open.sort((a, b) => a.cost - b.cost); const c = open.shift();
      for (const [du, dv] of DIRS) {
        const u = c.u + du, v = c.v + dv; if (!free(st, u, v, unit) || !climbOk(st, unit, c.u, c.v, u, v)) continue;
        const n = c.cost + cost(st, u, v) + upCost(st, unit, c.u, c.v, u, v); if (n > budget) continue;
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
        const u = c.u + du, v = c.v + dv; if (!inside(st, u, v) || cost(st, u, v) === Infinity || !climbOk(st, null, u, v, c.u, c.v)) continue;
        const n = c.c + cost(st, c.u, c.v) + upCost(st, null, u, v, c.u, c.v), k = key(u, v), old = best.get(k); if (old !== undefined && old <= n) continue;
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
    const u = actor(st), pv = c.path[c.path.length - 2] || u; u.face = faceOf(pv, to); u.u = to.u; u.v = to.v; st.mp -= c.cost;
    st.log.push(u.name + ' เดิน ' + c.cost + ' แต้ม');
    return { ok: true, path: c.path, cost: c.cost };
  }
  /* facing on the lattice (+u = SE, +v = SW, −u = NW, −v = NE) — used by แทงข้างหลัง */
  function faceOf(a, b) { const du = b.u - a.u, dv = b.v - a.v; return Math.abs(du) >= Math.abs(dv) ? (du >= 0 ? 'SE' : 'NW') : (dv > 0 ? 'SW' : 'NE') }
  function targets(st, att, range = att.range) { return opponents(st, att).filter(t => dist(att, t) <= range && (range > 1 || meleeOk(st, att, t))).sort((a, b) => dist(att, a) - dist(att, b)) }
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
    a.face = faceOf(a, t);
    if (st.cards && t.evade) { t.evade = 0; st.acted = true; st.mp = 0; st.log.push(t.name + ' ก้าวหลบ ' + a.name + ' พลาด'); return { ok: true, damage: 0, target: t, notes: ['หลบ'], evaded: true } }
    const crit = st.cards && (st.rng || Math.random)() < (a.side === 'monster' ? CRIT.monster : CRIT.ally), hm = st.cards ? heightMult(st, a, t) : 1, en = [], em = st.cards ? elMult(st, a.el, t, en) : 1, r = st.cards ? hurt(st, t, a.atk * hm * em * (crit ? CRIT.mult : 1)) : damageFor(st, a, t); r.notes.push(...en); if (crit) r.notes.unshift('คริติคอล'); if (hm !== 1) r.notes.push(heightNote(hm)); if (!st.cards) t.hp = Math.max(0, t.hp - r.damage); st.acted = true; st.mp = 0;
    st.log.push(a.name + ' ตี ' + t.name + ' −' + r.damage + (r.notes.length ? ' (' + r.notes.join(', ') + ')' : ''));
    let counter = 0;
    if (st.cards && t.counter && alive(t) && dist(a, t) <= 1) { t.counter = 0; const c = hurt(st, a, 12); counter = c.damage; st.log.push(t.name + ' สวนกลับ −' + counter) }
    checkOutcome(st);
    return { ok: true, damage: r.damage, target: t, notes: r.notes, crit, counter };
  }
  function endTurn(st) {
    if (st.outcome) return { ok: false, reason: 'จบการต่อสู้แล้ว' };
    if (st.cards && st.turn === 'hero') { const h = hero(st); h.stamina = Math.min(100, h.stamina + 10); h.climb = 0 }
    st.turn = st.turn === 'hero' ? 'monster' : 'hero'; if (st.turn === 'hero') st.turns++;
    st.acted = false; st.mp = st.cards && st.turn === 'hero' ? 0 : actor(st).move;
    if (st.cards && st.turn === 'hero') { const h = hero(st); h.guard = 0; if (h.perch && --h.perch <= 0) h.perch = 0; for (const a of allies(st)) { a.guard = 0; if (a.cd) a.cd-- } refill(st) }
    return { ok: true, turn: st.turn };
  }
  /* one AI unit (monster or companion): pick the opponent it can reach soonest (terrain-aware), walk toward it within its own move points
     (a ranged unit stops as soon as the target is in range), then hit it if in range. Returns animation steps. */
  /* หินถล่ม slows: the next move of a slowed unit is 2 points shorter */
  function aiAct(st, u) { if (!u?.slowed) return aiActCore(st, u); const m = u.move; u.move = Math.max(1, m - 2); u.slowed = 0; try { return aiActCore(st, u) } finally { u.move = m } }
  function aiActCore(st, u) {
    const steps = [], opp = opponents(st, u); if (!alive(u) || !opp.length || st.outcome) return steps;
    if (u.stun) { u.stun = 0; steps.push({ unit: u, type: 'stun' }); return steps }
    /* a healer companion mends the most hurt friend in reach (walking closer if needed) instead of attacking */
    if (u.side === 'hero' && u.healer) {
      const hurtF = st.units.filter(f => f.side === 'hero' && alive(f) && f.hp < f.maxHp * .7).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (hurtF) {
        if (dist(u, hurtF) > u.range) { const r = reach(st, u, u.move); let best = null; for (const e of r.values()) if (dist(e, hurtF) <= u.range && (!best || e.cost < best.cost)) best = e; if (!best) for (const e of r.values()) if (!best || dist(e, hurtF) < dist(best, hurtF)) best = e; if (best && (best.u !== u.u || best.v !== u.v)) { const path = pathTo(r, best); u.u = best.u; u.v = best.v; steps.push({ unit: u, type: 'move', path }) } }
        if (dist(u, hurtF) <= u.range) { const b = hurtF.hp; hurtF.hp = Math.min(hurtF.maxHp, hurtF.hp + 12); st.log.push(u.name + ' รักษา ' + hurtF.name + ' +' + (hurtF.hp - b)); steps.push({ unit: u, type: 'heal', target: hurtF, heal: hurtF.hp - b }); return steps }
      }
    }
    let tgt = targets(st, u).find(t => t.id === st.target && u.side === 'hero') || targets(st, u)[0], field = null;
    /* companion orders: guard = hold the ground (+6 guard, hit only what is already in range) · follow = stay by the hero */
    if (u.side === 'hero' && u.order === 'guard') { u.guard = Math.max(u.guard || 0, 6); steps.push({ unit: u, type: 'hold' }); if (tgt) { const at = strike(st, u, tgt); steps.push({ unit: u, type: 'attack', target: tgt, damage: at.damage, notes: at.notes, crit: at.crit, evaded: !!at.evaded, counter: at.counter || 0, fall: at.fall }) } return steps }
    if (u.side === 'hero' && u.order === 'follow' && !tgt) {
      const h = hero(st), r = reach(st, u, u.move); let bestE = null, bestS = 1e9;
      for (const e of r.values()) { const near = opponents(st, u).filter(o => dist(o, e) <= u.range && dist(o, h) <= 3); const sc = near.length ? -100 + dist(e, h) : Math.abs(dist(e, h) - 1) * 10 + e.cost * .1; if (sc < bestS) { bestS = sc; bestE = e } }
      if (bestE && (bestE.u !== u.u || bestE.v !== u.v)) { const path = pathTo(r, bestE), pv = path[path.length - 2] || u; u.face = faceOf(pv, bestE); u.u = bestE.u; u.v = bestE.v; steps.push({ unit: u, type: 'move', path }) }
      tgt = targets(st, u).find(o => dist(o, h) <= 3); if (tgt) { const at = strike(st, u, tgt); steps.push({ unit: u, type: 'attack', target: tgt, damage: at.damage, notes: at.notes, crit: at.crit, evaded: !!at.evaded, counter: at.counter || 0, fall: at.fall }) }
      return steps;
    }
    if (!tgt) {
      let best = 1e9;
      for (const o of opp) { const f = distField(st, o), d = f.get(key(u.u, u.v)); const sc = (d === undefined ? 1e6 : d) + o.hp / 200; if (sc < best) { best = sc; tgt = o; field = f } }
      const r = reach(st, u, u.move), dOf = (a, b) => { const x = field.get(key(a, b)); return x === undefined ? 1e6 : x };
      let bestE = null, bestD = dOf(u.u, u.v), bestC = 0;
      for (const e of r.values()) { const up = lv(st, e.u, e.v) - lv(st, tgt.u, tgt.v), inR = dist(e, tgt) <= u.range && (u.range > 1 || Math.abs(up) <= 1), d = inR ? -100 + (u.range > 1 ? -dist(e, tgt) : 0) - 2 * Math.max(-2, Math.min(3, up)) + (!u.fly && ledge(st, e.u, e.v) ? 1.5 : 0) : dOf(e.u, e.v) + (!u.fly && ledge(st, e.u, e.v) ? .5 : 0);   /* v94: in reach, prefer the higher cell · v94.03: keep off cliff edges */ if (d < bestD || (d === bestD && e.cost < bestC)) { bestE = e; bestD = d; bestC = e.cost } }
      if (bestE && (bestE.u !== u.u || bestE.v !== u.v)) { const path = pathTo(r, bestE), pv = path[path.length - 2] || u; u.face = faceOf(pv, bestE); u.u = bestE.u; u.v = bestE.v; st.log.push(u.name + ' เดิน'); steps.push({ unit: u, type: 'move', path }) }
      tgt = targets(st, u)[0];
    }
    if (tgt) { st.cur = u; const at = strike(st, u, tgt); steps.push({ unit: u, type: 'attack', target: tgt, damage: at.damage, notes: at.notes, crit: at.crit, evaded: !!at.evaded, counter: at.counter || 0, fall: at.fall }) }
    return steps;
  }
  function strike(st, a, t) {
    const keep = { acted: st.acted, mp: st.mp, turn: st.turn, cur: st.cur };
    st.cur = a; st.acted = false; if (a.side === 'hero') st.turn = 'monster';   // let attack() resolve for this attacker
    const at = (() => { a.face = faceOf(a, t);
      if (st.cards && t.evade) { t.evade = 0; st.log.push(t.name + ' ก้าวหลบ ' + a.name + ' พลาด'); return { ok: true, damage: 0, target: t, notes: ['หลบ'], evaded: true } }
      const crit = st.cards && (st.rng || Math.random)() < (a.side === 'monster' ? CRIT.monster : CRIT.ally), hm = st.cards ? heightMult(st, a, t) : 1, en = [], em = st.cards ? elMult(st, a.el, t, en) : 1, r = st.cards ? hurt(st, t, a.atk * hm * em * (crit ? CRIT.mult : 1)) : damageFor(st, a, t); r.notes.push(...en); if (crit) r.notes.unshift('คริติคอล'); if (hm !== 1) r.notes.push(heightNote(hm)); if (!st.cards) t.hp = Math.max(0, t.hp - r.damage);
      st.log.push(a.name + ' ตี ' + t.name + ' −' + r.damage + (r.notes.length ? ' (' + r.notes.join(', ') + ')' : ''));
      let counter = 0; if (st.cards && t.counter && alive(t) && dist(a, t) <= 1) { t.counter = 0; counter = hurt(st, a, 12).damage; st.log.push(t.name + ' สวนกลับ −' + counter) }
      /* v94: heavy monsters (shove) knock a target standing at a ledge off it — down 2+ levels costs 5 HP per level */
      let fall = null; if (st.cards && a.shove && alive(t) && !t.fly && dist(a, t) <= 1 && st.levelAt) { const fu = t.u, fv = t.v, du = Math.sign(t.u - a.u), dv = du ? 0 : Math.sign(t.v - a.v), nu = t.u + du, nv = t.v + dv; if (free(st, nu, nv, t) && lv(st, fu, fv) - lv(st, nu, nv) >= 2) { const drop = lv(st, fu, fv) - lv(st, nu, nv), fd = Math.min(t.hp, 5 * drop); t.u = nu; t.v = nv; t.hp -= fd; fall = { from: { u: fu, v: fv }, drop, damage: fd }; r.notes.push('ผลักตก ' + drop + ' ระดับ −' + fd); st.log.push(a.name + ' ผลัก ' + t.name + ' ตกลงไป −' + fd) } }
      return { ok: true, damage: r.damage, target: t, notes: r.notes, crit, counter, fall } })();
    st.acted = keep.acted; st.mp = keep.mp; st.turn = keep.turn; st.cur = keep.cur; checkOutcome(st);
    return at;
  }
  /* companion signature skills (from the old SIGNATURE cards), ordered by the player for 1 crystal, then a cooldown of 3 player turns */
  const ALLY_SKILL = {
    bram: { id: 'wall', name: 'กำแพงโล่', guard: 14, near: 8, fx: 'shield' },
    luna: { id: 'frost', name: 'หอกน้ำแข็ง', range: 4, dmg: 13, stun: 1, fx: 'ice' },
    kier: { id: 'whirl', name: 'ดาบหมุน', range: 1, dmg: 14, aoe: 'self', fx: 'wind' },
    mil: { id: 'twin', name: 'สองคมต่อเนื่อง', range: 1, dmg: 10, hits: 2, fx: 'knife' },
    /* v92.17 recruits from the inn and the village */
    sigrid: { id: 'cleave', name: 'ผ่าขวานหนัก', range: 1, dmg: 22, push: 1, fx: 'blunt' },
    ren: { id: 'aimed', name: 'ธนูเล็งจุดตาย', range: 5, dmg: 22, fx: 'arrow' },
    olwen: { id: 'flame', name: 'ระเบิดไฟนิรันดร์', range: 4, dmg: 14, aoe: 'splash', fx: 'fire' },
    nadia: { id: 'backstab', name: 'แทงเงา', range: 1, dmg: 26, fx: 'knife' },
    orla: { id: 'mendAll', name: 'พรแห่งผืนดิน', healAll: 15, fx: 'heal' },
    berg: { id: 'snare', name: 'ลูกดอกตรึง', range: 4, dmg: 12, stun: 1, fx: 'arrow' }
  };
  const SKILL_CD = 3;
  function skillBlock(st, a) {
    if (!st.cards) return 'ไม่ได้เปิดโหมดไพ่'; if (st.outcome) return 'จบการต่อสู้แล้ว'; if (st.turn !== 'hero') return 'ไม่ใช่ตาคุณ';
    if (!a || !alive(a) || a.side !== 'hero' || a === hero(st)) return 'สั่งไม่ได้'; const sk = ALLY_SKILL[a.key]; if (!sk) return 'ไม่มีท่าพิเศษ';
    if (a.cd > 0) return 'รออีก ' + a.cd + ' เทิร์น'; if (!crystals(st)) return 'คริสตัลหมดแล้วในเทิร์นนี้';
    if (sk.range && !targets(st, a, sk.range).length) return 'ไม่มีศัตรูในระยะ ' + sk.range + ' ช่อง';
    if (sk.healAll && !st.units.some(u => u.side === 'hero' && alive(u) && u.hp < u.maxHp)) return 'ทุกคนยังเลือดเต็ม';
    return '';
  }
  function allySkill(st, id) {
    const a = st.units.find(u => u.id === id), why = skillBlock(st, a); if (why) return { ok: false, reason: why };
    const sk = ALLY_SKILL[a.key], out = { ok: true, ally: a, skill: sk.id, name: sk.name, fx: sk.fx, hits: [], shielded: [] };
    st.spent++; a.cd = SKILL_CD;
    if (sk.healAll) { out.heals = []; for (const f of st.units) if (f.side === 'hero' && alive(f)) { const b = f.hp; f.hp = Math.min(f.maxHp, f.hp + sk.healAll); if (f.hp > b) out.heals.push({ unit: f, heal: f.hp - b }) } st.log.push(a.name + ' ' + sk.name); return out }
    if (sk.guard) { a.guard = Math.max(a.guard || 0, sk.guard); out.shielded.push({ unit: a, guard: a.guard }); for (const f of st.units) if (f !== a && f.side === 'hero' && alive(f) && dist(f, a) <= 1) { f.guard = Math.max(f.guard || 0, sk.near); out.shielded.push({ unit: f, guard: f.guard }) } st.log.push(a.name + ' ' + sk.name); return out }
    const inR = targets(st, a, sk.range), t = inR.find(x => x.id === st.target) || inR[0]; out.target = t; a.face = faceOf(a, t);
    const list = sk.aoe === 'self' ? inR.filter(o => dist(o, a) <= 1) : sk.aoe === 'splash' ? opponents(st, a).filter(o => o === t || dist(o, t) <= 1) : [t];
    for (const o of list) for (let i = 0; i < (sk.hits || 1); i++) { if (!alive(o)) break; const crit = (st.rng || Math.random)() < CRIT.ally, en = [], r = hurt(st, o, sk.dmg * heightMult(st, a, o) * elMult(st, FX_EL[sk.fx] || a.el, o, en) * (crit ? CRIT.mult : 1)); r.notes.push(...en); out.hits.push({ target: o, damage: r.damage, notes: r.notes, crit }) }
    if (sk.stun && alive(t)) { t.stun = 1; out.stun = t }
    if (sk.push && alive(t)) out.moved = shove(st, t, a, 1);
    st.log.push(a.name + ' ' + sk.name + ' −' + out.hits.reduce((x, h) => x + h.damage, 0)); checkOutcome(st);
    return out;
  }
  function setOrder(st, id, order) { const a = st.units.find(u => u.id === id && u.side === 'hero' && u !== hero(st)); if (a && ['charge', 'follow', 'guard'].includes(order)) a.order = order; return a }
  /* companions act at the end of the player phase (before endTurn) */
  function alliesTurn(st) { const steps = []; if (st.outcome || st.turn !== 'hero') return steps; for (const a of allies(st)) { if (!alive(a)) continue; steps.push(...aiAct(st, a)); if (st.outcome) break } return steps }
  /* the enemy phase: every living monster acts in turn, then the player phase starts. Returns the steps (for animation). */
  function monsterTurn(st) {
    const steps = [];
    if (st.outcome || st.turn !== 'monster') return steps;
    for (const m of monsters(st)) { if (!alive(m)) continue; st.cur = m; steps.push(...aiAct(st, m)); if (st.outcome) break }
    st.cur = null;
    if (!st.outcome) endTurn(st);
    return steps;
  }
  /* ---------- cards ---------- */
  function playMove(st, index) {
    if (!st.cards || st.outcome || st.turn !== 'hero') return { ok: false, reason: 'ไม่ใช่ตาคุณ' };
    if (st.acted) return { ok: false, reason: 'โจมตีแล้ว เดินต่อไม่ได้' };
    const TD = deckLib(), h = hero(st), card = st.deck.movement.hand[index];
    if (!card) return { ok: false, reason: 'ไม่มีไพ่ใบนี้' };
    if (!crystals(st)) return { ok: false, reason: 'คริสตัลหมดแล้วในเทิร์นนี้' };
    const def = TD.MOVE[card.id]; if (h.stamina < def.stamina) return { ok: false, reason: 'แรงไม่พอ (ต้อง ' + def.stamina + ')' };
    spend(st, 'movement', index); st.spent++; h.stamina -= def.stamina; st.mp += def.move;
    st.log.push('ไพ่ ' + def.name + ' +' + def.move + ' แต้มเดิน');
    return { ok: true, card: card.id, uid: card.uid, name: def.name, move: def.move };
  }
  function cardRule(id) { return CARD[id] || null }
  function combatBlock(st, index) {
    if (!st.cards) return 'ไม่ได้เปิดโหมดไพ่';
    if (st.outcome) return 'จบการต่อสู้แล้ว'; if (st.turn !== 'hero') return 'ไม่ใช่ตาคุณ';
    const TD = deckLib(), c = st.deck.combat.hand[index]; if (!c) return 'ไม่มีไพ่ใบนี้';
    const rule = CARD[c.id]; if (!rule) return TD.COMBAT[c.id].name + ' ยังไม่รองรับในสนามแบน';
    if (!crystals(st)) return 'คริสตัลหมดแล้วในเทิร์นนี้';
    const h = hero(st); if (h.stamina < rule.st) return 'แรงไม่พอ (ต้อง ' + rule.st + ')';
    if (!rule.self && !pickTarget(st, rule)) return rule.high && targets(st, h, rule.range).length ? 'ต้องยืนสูงกว่าเป้าอย่างน้อย 1 ระดับ' : rule.range === 1 && opponents(st, h).some(o => dist(h, o) <= 1) ? 'ต่างระดับเกินระยะประชิด' : 'ศัตรูอยู่นอกระยะ (' + rule.range + ' ช่อง)';
    return '';
  }
  /* the chosen target (st.target = unit id, set by clicking a monster) if it is in range, else the nearest one in range */
  function pickTarget(st, rule) { const h = hero(st), inR = targets(st, h, rule.range).filter(t => rule.high ? gap(st, h, t) >= rule.high : rule.leap ? gap(st, h, t) >= -1 : rule.aoe === 'splash' ? gap(st, t, h) < 2 : true), pick = inR.find(t => t.id === st.target); return pick || inR[0] || null }
  function setTarget(st, id) { const t = st.units.find(u => u.id === id && u.side === 'monster' && alive(u)); st.target = t ? t.id : null; return t || null }
  function playCombat(st, index) {
    const why = combatBlock(st, index); if (why) return { ok: false, reason: why };
    const TD = deckLib(), h = hero(st), t = pickTarget(st, CARD[st.deck.combat.hand[index].id]) || foe(st, h), c0 = st.deck.combat.hand[index], id = c0.id, rule = CARD[id], name = TD.COMBAT[id].name;
    spend(st, 'combat', index); st.spent++; h.stamina -= rule.st;
    const out = { ok: true, card: id, uid: c0.uid, name, fx: rule.fx, self: !!rule.self, big: rule.big || 1, hits: [] };
    if (rule.self) {
      if (rule.guard) { h.guard = Math.max(h.guard, rule.guard); out.guard = h.guard }
      if (rule.restore) { h.stamina = Math.min(100, h.stamina + rule.restore); out.restore = rule.restore }
      if (rule.heal) { const b = h.hp; h.hp = Math.min(h.maxHp, h.hp + rule.heal); out.heal = h.hp - b }
      if (rule.perch) { h.perch = rule.perch; out.perch = true } if (rule.climb) { h.climb = 1; out.climb = true } if (rule.evade) { h.evade = 1; out.evade = true } if (rule.counter) { h.counter = 1; out.counter = true } if (rule.ambush) { h.ambush = rule.ambush; out.ambush = true }
      st.log.push(name + (out.guard ? ' ป้องกัน ' + out.guard : out.heal ? ' ฟื้น ' + out.heal : out.restore ? ' แรง +' + out.restore : out.perch ? ' (ยึดที่สูง · โบนัสความสูง ×2)' : out.climb ? ' (ตานี้ปีนต่างระดับได้ 2 · ขึ้นเนินไม่เสียแต้ม)' : out.evade ? ' (หลบการโจมตีครั้งถัดไป)' : out.counter ? ' (สวนกลับเมื่อโดนตี)' : out.ambush ? ' (ตีครั้งถัดไป ×1.6)' : ''));
      return out;
    }
    st.acted = true; st.mp = 0;
    const d0 = gap(st, h, t);   // height difference before a dive moves the hero
    if (rule.leap) { const spot = leapSpot(st, h, t); if (spot) { out.leap = { from: { u: h.u, v: h.v }, to: spot }; h.u = spot.u; h.v = spot.v } }
    h.face = faceOf(h, t);
    let bonus = 0, mult = 1; const extra = [];
    if (rule.behind && t.face && faceOf(t, h) !== t.face) { bonus = rule.behind; extra.push('ข้างหลัง +' + rule.behind) }
    if (h.ambush) { mult = h.ambush; h.ambush = 0; extra.push('ซุ่ม ×1.6') }
    if (rule.leap) { const k = d0 > 0 ? 1 + .25 * Math.min(3, d0) : .85; mult *= k; extra.push(d0 > 0 ? 'กระโจนจากที่สูง ×' + k.toFixed(2) : 'ระดับเดียวกัน ×0.85') }
    else { const hm = heightMult(st, h, t); if (hm !== 1) { mult *= hm; extra.push(heightNote(hm)) } }
    if (rule.perLevel) bonus += rule.perLevel * Math.max(0, d0);
    if (rule.aoe === 'splash' && d0 >= 1) { mult *= 1.5; extra.push('ต่ำกว่า ×1.5') }
    out.target = t;
    for (let i = 0; i < (rule.hits || 1); i++) {
      if (!alive(t)) break;
      const crit = (st.rng || Math.random)() < CRIT.hero, en = [], em = elMult(st, cardEl(id, h), t, en), r = hurt(st, t, (rule.dmg + bonus) * mult * em * (crit ? CRIT.mult : 1)); out.hits.push({ target: t, damage: r.damage, notes: [...extra, ...en, ...r.notes], crit });
    }
    /* area cards: ดาบหมุน hits everyone next to the hero, ทุบธรณี everyone next to the target */
    if (rule.aoe) { const c = rule.aoe === 'self' ? h : t; for (const o of opponents(st, h)) { if (o === t || dist(o, c) > 1) continue; const g2 = gap(st, h, o); if (rule.aoe === 'splash' && g2 <= -2) continue; const crit = (st.rng || Math.random)() < CRIT.hero, r = hurt(st, o, rule.dmg * (rule.aoe === 'splash' ? (g2 >= 1 ? 1.5 : 1) * (h.ambush || 1) : mult) * (crit ? CRIT.mult : 1)); out.hits.push({ target: o, damage: r.damage, notes: r.notes, crit, splash: true }) } }
    if (rule.guardAfter) { h.guard = Math.max(h.guard, rule.guardAfter); out.guard = h.guard }
    const total = out.hits.reduce((a, x) => a + x.damage, 0);
    st.log.push(h.name + ' ' + name + ' −' + total + (out.hits[0]?.notes.length ? ' (' + out.hits[0].notes.join(', ') + ')' : ''));
    if (alive(t) && (rule.push || rule.pull)) { const fu = t.u, fv = t.v; out.moved = shove(st, t, h, rule.push ? 1 : -1); if (out.moved) { const drop = lv(st, fu, fv) - lv(st, t.u, t.v); if (drop >= 2 && !t.fly) { const fd = Math.min(t.hp, 5 * drop); t.hp -= fd; out.fall = { drop, damage: fd }; st.log.push(t.name + ' ตกลง ' + drop + ' ระดับ −' + fd) } } }
    if (rule.slow && alive(t)) { t.slowed = 1; out.slowed = t }
    checkOutcome(st);
    return out;
  }
  /* throw away any number of hand cards at once for stamina: costs 1 crystal, +STAMINA_PER_DISCARD per card. picks = [{group, uid}] */
  function discardForStamina(st, picks) {
    if (!st.cards || st.outcome || st.turn !== 'hero') return { ok: false, reason: 'ไม่ใช่ตาคุณ' };
    if (!picks?.length) return { ok: false, reason: 'เลือกไพ่ที่จะทิ้งก่อน' };
    if (!crystals(st)) return { ok: false, reason: 'คริสตัลหมดแล้วในเทิร์นนี้' };
    const found = picks.map(x => ({ group: x.group, i: st.deck[x.group]?.hand.findIndex(c => c.uid === x.uid) }));
    if (found.some(x => x.i == null || x.i < 0)) return { ok: false, reason: 'ไม่มีไพ่ใบนั้นในมือ' };
    const out = [];
    for (const g of ['movement', 'combat']) for (const x of found.filter(f => f.group === g).sort((a, b) => b.i - a.i)) out.push(spend(st, g, x.i));
    st.spent++; const h = hero(st), b = h.stamina; h.stamina = Math.min(100, h.stamina + out.length * STAMINA_PER_DISCARD);
    st.log.push('ทิ้งไพ่ ' + out.length + ' ใบ แรง +' + (h.stamina - b));
    return { ok: true, cards: out, stamina: h.stamina - b };
  }
  /* dive: a free cell next to the target, the one closest to where the hero stands */
  function leapSpot(st, h, t) { let best = null; for (const [du, dv] of DIRS) { const u = t.u + du, v = t.v + dv; if (!free(st, u, v, h) && !(u === h.u && v === h.v)) continue; const d = Math.abs(u - h.u) + Math.abs(v - h.v); if (!best || d < best.d) best = { u, v, d } } return best && { u: best.u, v: best.v } }
  /* push (dir 1) the target one cell away from `from`, or pull (dir −1) it one cell toward; stays put when blocked */
  function shove(st, t, from, dir) {
    const du = t.u - from.u, dv = t.v - from.v, su = Math.abs(du) >= Math.abs(dv) ? Math.sign(du) : 0, sv = su ? 0 : Math.sign(dv);
    const nu = t.u + su * dir, nv = t.v + sv * dir;
    if (dir < 0 && nu === from.u && nv === from.v) return false;
    if (!free(st, nu, nv, t) || lv(st, nu, nv) - lv(st, t.u, t.v) > 1) return false;
    t.u = nu; t.v = nv; return true;
  }
  const api = { WEAPON_EL, CARD_EL, lv, climbOk, heightMult, gap, meleeOk, ALLY_SKILL, SKILL_CD, skillBlock, allySkill, setOrder, monsters, allies, opponents, alliesTurn, aiAct, pickTarget, setTarget, checkOutcome, CRIT, CRYSTALS, STAMINA_PER_DISCARD, HAND, crystals, refill, discardForStamina, CARD, cardRule, combatBlock, playMove, playCombat, hurt, KINDS, distField, create, hero, monster, actor, foe, kind, reach, pathTo, canMove, move, targets, damageFor, attack, endTurn, monsterTurn, dist, alive };
  root.FlatBattle = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
