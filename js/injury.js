/* v98.295 · INJURIES (docs/DESIGN-INJURY-FARM-NODEMAP-TH.md) — a body-part wound system, separate from HP and Stamina.
   Who: every character (the hero 'hero', the sibling 'sib', companions by their party key).  Where it is stored: g.injuries (world save).
   Parts: head · torso · arm · hand · leg   Level: 'light' (เจ็บ) → 'heavy' (หนัก).
   · A character who is knocked down in a fight MAY be hurt: roll(g, id, {lose, protect}) → maybe one part (weighted), light or heavy.
   · Each new day (Injury.sync, called by WorldState.ensure for every elapsed day) every wound rolls to heal by a growing percentage:
        p(day n) = min(cap, base + step·(n−1)) × (town quality) + item bonus + visit bonus
     light: heals anywhere · heavy: only in a hospital bed (admit) — then it becomes a light wound, which heals the same way.
   · What a HEAVY wound forbids is DATA (RULES below, per part: fight / work / travel) so it can be tuned without touching code.
   · Leader rule: leader(g, order) = first character in the line-up with no heavy wound (the others follow). talkAllowed() tells whether the
     one who leads may talk / do quests (only the two siblings can).
   Pure functions on the save object — no DOM, tested by tools/test-injury.cjs. */
(function (root) {
  'use strict';
  const PARTS = { head: 'หัว', torso: 'ลำตัว', arm: 'แขน', hand: 'มือ', leg: 'ขา' };
  /* tunable numbers — the starting values the user accepted ("รับตัวเลขเริ่มต้นไปทดสอบ") */
  const CFG = {
    chanceOnFall: .35,                         /* a knocked-down character is hurt with this chance */
    heavyChance: .35, heavyChanceLose: .6,     /* given a wound: heavy (after a won fight / after a lost one) */
    weights: { head: 1, torso: 3, arm: 2, hand: 1, leg: 2 },
    light: { base: .20, step: .10, cap: .90 },
    heavy: { base: .10, step: .08, cap: .85, sure: 14 },   /* day 14 in a bed always heals */
    town: { village: { q: .8, cost: 10 }, town: { q: 1.0, cost: 18 }, city: { q: 1.3, cost: 35 } },   /* quality × healing chance · gold a day */
    visit: { rel: 1, heal: .05 }               /* one visit a day: relationship +1, +5 points of healing chance tomorrow */
  };
  /* what a HEAVY wound on each part forbids: fight = cannot take part in a battle · work = no craft / farm / forge work · travel = cannot go out of town */
  const RULES = {
    head:  { fight: 1, work: 1, travel: 1 },
    torso: { fight: 1, work: 1, travel: 1 },
    arm:   { fight: 1, work: 1, travel: 0 },
    hand:  { fight: 0, work: 1, travel: 0 },
    leg:   { fight: 1, work: 0, travel: 1 }
  };
  /* the two heroes are the only ones who can talk / do quests (docs: a friend leading cannot) */
  const HEROES = { hero: 1, sib: 1 };

  const store = g => (g.injuries ||= {});
  const rec = (g, id, make) => { const s = store(g); return s[id] || (make ? (s[id] = { parts: {}, bed: null }) : null) };
  const of = (g, id) => rec(g, id, false);
  const parts = (g, id) => of(g, id)?.parts || {};
  const heavyParts = (g, id) => Object.keys(parts(g, id)).filter(p => parts(g, id)[p].lv === 'heavy');
  const hurt = (g, id) => Object.keys(parts(g, id)).length > 0;
  const forbids = (g, id, what) => heavyParts(g, id).some(p => RULES[p]?.[what]);
  const canFight = (g, id) => !forbids(g, id, 'fight');
  const canWork = (g, id) => !forbids(g, id, 'work');
  const canTravel = (g, id) => !forbids(g, id, 'travel');
  /* manual control needs a character with NO heavy wound at all (design: "เจ็บหนัก … รอพักฟื้น") */
  const canLead = (g, id) => heavyParts(g, id).length === 0;

  function pickPart(rng) {
    const keys = Object.keys(CFG.weights), tot = keys.reduce((a, k) => a + CFG.weights[k], 0); let r = rng() * tot;
    for (const k of keys) { r -= CFG.weights[k]; if (r < 0) return k } return keys[0];
  }
  /* a character was knocked down: maybe a wound.  o = { lose, protect (0..1), rng } → { part, lv } or null */
  function roll(g, id, o = {}) {
    const rng = o.rng || Math.random, p = CFG.chanceOnFall * (1 - Math.max(0, Math.min(1, o.protect || 0)));
    if (rng() >= p) return null;
    const part = pickPart(rng), r = rec(g, id, true), cur = r.parts[part], heavy = rng() < (o.lose ? CFG.heavyChanceLose : CFG.heavyChance);
    const lv = cur ? 'heavy' : heavy ? 'heavy' : 'light';        /* hurt again on the same part → it gets worse */
    r.parts[part] = { lv, days: 0 };
    return { part, lv, name: PARTS[part] };
  }
  const townOf = id => root.Settlements?.SETTLEMENTS?.[id];
  const quality = town => (CFG.town[townOf(town)?.size || 'village'] || CFG.town.village);
  /* chance to heal today for one wound that has lasted `days` days */
  function chance(lv, days, o = {}) {
    const c = CFG[lv], base = Math.min(c.cap, c.base + c.step * Math.max(0, days)) * (o.q ?? 1);
    return Math.max(0, Math.min(.98, base + (o.bonus || 0)));
  }
  /* v98.332 · a scripted wound (story events): force(g, 'kier', 'leg', 'heavy') */
  function force(g, id, part, lv = 'heavy') { const r = rec(g, id, true); r.parts[part] = { lv, days: 0 }; return { part, lv, name: PARTS[part] } }
  function admit(g, id, town) {
    const r = of(g, id); if (!r || !heavyParts(g, id).length) return { ok: false, why: 'ไม่มีบาดแผลหนัก' };
    const q = quality(town); r.bed = town; return { ok: true, cost: q.cost, town };
  }
  function discharge(g, id) { const r = of(g, id); if (r) r.bed = null }
  /* visiting a patient (once a day): relationship +1 (the caller adds it) and a little extra healing chance for the next morning */
  function visit(g, id, day) {
    const r = of(g, id); if (!r || r.visitDay === day) return { ok: false };
    r.visitDay = day; r.visitBonus = CFG.visit.heal; return { ok: true, rel: CFG.visit.rel, heal: CFG.visit.heal };
  }
  /* one day passes for one character */
  function dayFor(g, id, o = {}) {
    const r = of(g, id); if (!r) return []; const out = [], rng = o.rng || Math.random; let paid = true;
    if (r.bed) {
      const q = quality(r.bed), v = g.village || (g.village = {});
      if ((v.coins || 0) >= q.cost) v.coins -= q.cost; else { r.bed = null; paid = false; out.push({ id, why: 'unpaid' }) }
    }
    const bonus = (r.visitBonus || 0) + (o.bonus || 0), q = r.bed ? quality(r.bed).q : 1;
    for (const p of Object.keys(r.parts)) {
      const w = r.parts[p]; w.days = (w.days || 0) + 1;
      if (w.lv === 'heavy' && !r.bed) continue;               /* a heavy wound only mends in a hospital bed */
      const sure = w.lv === 'heavy' && w.days >= CFG.heavy.sure;
      if (sure || rng() < chance(w.lv, w.days - 1, { q: w.lv === 'heavy' ? q : 1, bonus })) {
        if (w.lv === 'heavy') { r.parts[p] = { lv: 'light', days: 0 }; out.push({ id, part: p, to: 'light' }) }
        else { delete r.parts[p]; out.push({ id, part: p, to: 'healed' }) }
      }
    }
    delete r.visitBonus;
    if (!heavyParts(g, id).length) r.bed = null;               /* nothing heavy left → out of the bed */
    if (!Object.keys(r.parts).length && !r.bed) delete store(g)[id];
    return out;
  }
  /* WorldState.ensure() calls this on every access: runs every day that has passed since the last call (at most 30) */
  function sync(g, o = {}) {
    const s = store(g); if (!Number.isFinite(g.day)) return [];
    if (!Number.isFinite(s._day)) { s._day = g.day; return [] }
    const out = []; let n = Math.min(30, g.day - s._day);
    for (; n > 0; n--) for (const id of Object.keys(s)) if (id[0] !== '_') out.push(...dayFor(g, id, o));
    s._day = g.day; return out;
  }
  /* first of the line-up (ids in order) who can be played; the rest follow */
  const leader = (g, order) => order.find(id => canLead(g, id)) || null;
  /* may the one who leads talk to people / take quests?  only the two siblings */
  const talkAllowed = id => !!HEROES[id];
  /* readable one-liners for UIs: "แขน (หนัก) · ขา (เจ็บ)" */
  const describe = (g, id) => Object.keys(parts(g, id)).map(p => PARTS[p] + ' (' + (parts(g, id)[p].lv === 'heavy' ? 'หนัก' : 'เจ็บ') + ')').join(' · ');

  root.Injury = { PARTS, CFG, RULES, force, roll, chance, admit, discharge, visit, dayFor, sync, of, parts, heavyParts, hurt, canFight, canWork, canTravel, canLead, leader, talkAllowed, describe, quality };
  if (typeof module === 'object' && module.exports) module.exports = root.Injury;
})(typeof window !== 'undefined' ? window : globalThis);
