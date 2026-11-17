/* v98.296 · FARM CREW (docs/DESIGN-INJURY-FARM-NODEMAP-TH.md ข) — who looks after the farm while the hero is away, and what happens when there are too few hands.
   The farm has a WORKLOAD (every planted plot 1 · animals by kind) and a CREW (G.crew = [{ id, kind }]): the mother · a friend who is NOT travelling with the hero
   (a friend can only be in one place) · a villager hired for a wage. Every day that passes (Garden.tick) the crew's MANPOWER is compared with the workload:
        factor = min(1, manpower ÷ workload)      — the share of the work that gets done: plots watered, ripe crops picked, animal produce (proportional loss)
   Manpower of one person = skill × health (a heavy wound on arm / hand / torso = 0, a light one = ×0.7, js/injury.js) · the time only runs while the game runs.
   Wages (hired only) are paid every day from the coins; no money → they stay home.  No crew → nothing changes (the hero tends the farm by hand, as before).
   Pure functions on the save object (tools/test-farm-crew.cjs). */
(function (root) {
  'use strict';
  const WEIGHT = { chicken: .25, goat: .5, sheep: .5, cow: 1 };
  /* skill by trade (the village roster, js/village-life.js) — a placeholder until NPC temperaments exist as data; `dil` is a steady 0.85–1.15 spread per person so two people with the same trade differ */
  const TRADE = [[/ชาวนา/, 1.4], [/คนเลี้ยงแกะ/, 1.3], [/เด็กเลี้ยงแพะ/, .8], [/คนตัดไม้|ช่างไม้/, 1.0], [/ชาวประมง|แม่ค้า|คนทำขนม|คนโม่แป้ง/, .8], [/ผู้ใหญ่|ครู|หมอ|พ่อค้า|กวี|ทหาร|ยาม/, .6]];
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h % 1000) / 1000 };
  const dil = id => .85 + hash('dil:' + id) * .3;
  const trade = role => { for (const [re, k] of TRADE) if (re.test(role || '')) return k; return .7 };
  const skill = (id, role) => id === 'mother' ? .8 : trade(role) * dil(id);
  const wage = (id, role) => Math.max(4, Math.round(5 + 9 * skill(id, role)));
  const workload = G => (G.plots || []).filter(p => p && !p.dead).length + (G.animals || []).reduce((a, x) => a + (WEIGHT[x.kind] ?? .5), 0);
  /* health multiplier from wounds (needs js/injury.js; none → 1) */
  function health(g, id) {
    const I = root.Injury; if (!I || !g) return 1; if (!I.canWork(g, id)) return 0;
    const ps = I.parts(g, id); return ['arm', 'hand', 'torso'].some(p => ps[p]) ? .7 : 1;
  }
  /* may this person be in the crew today?  a friend only while NOT in the travelling party; a hired villager only while not out on a job */
  function available(g, h, ctx = {}) {
    const v = g.village || {};
    if (h.kind === 'friend') return !(v.party || []).some(m => m.key === h.id);
    if (h.kind === 'hired') return !(ctx.away && ctx.away(h.id));
    return true;
  }
  function manpower(G, g, ctx = {}) {
    let n = 0; for (const h of G.crew || []) if (available(g, h, ctx)) n += (h.skill ?? skill(h.id, h.role)) * health(g, h.id); return n;
  }
  /* the day's factor, wages paid · null = no crew (do nothing special) */
  function dayFactor(G, g, ctx = {}) {
    if (!G || !(G.crew || []).length) return null; const v = g.village || (g.village = {});
    for (const h of G.crew) if (h.kind === 'hired' && available(g, h, ctx)) { const w = h.wage ?? wage(h.id, h.role); if ((v.coins || 0) >= w) v.coins -= w; else h.unpaid = true }
    const W = workload(G); let m = 0;
    for (const h of G.crew) { if (h.unpaid) { delete h.unpaid; continue } if (available(g, h, ctx)) m += (h.skill ?? skill(h.id, h.role)) * health(g, h.id) }
    return W <= 0 ? 1 : Math.min(1, m / W);
  }
  /* who can still be added: one person — one job */
  const has = (G, id) => (G.crew || []).some(h => h.id === id);
  function add(G, h) { G.crew ||= []; if (has(G, h.id)) return 'อยู่ในทีมดูแลแล้ว'; G.crew.push({ id: h.id, kind: h.kind, role: h.role || '', skill: +skill(h.id, h.role).toFixed(2), wage: h.kind === 'hired' ? wage(h.id, h.role) : 0 }); return '' }
  function remove(G, id) { G.crew = (G.crew || []).filter(h => h.id !== id) }
  root.FarmCrew = { WEIGHT, skill, wage, workload, manpower, dayFactor, available, add, remove, has, health };
  if (typeof module === 'object' && module.exports) module.exports = root.FarmCrew;
})(typeof window !== 'undefined' ? window : globalThis);
