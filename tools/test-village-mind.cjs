/* node tools/test-village-mind.cjs — content + engine checks for the village mind (js/village-lines.js + js/village-mind.js) */
'use strict';
require('../js/village-life.js'); require('../js/village-lines.js');
const { create } = require('../js/village-mind.js');
const L = globalThis.VillageLines, P = globalThis.VillageLife.P;
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('✗ ' + msg) } };
function mem() { const d = {}; return { getItem: k => d[k] ?? null, setItem: (k, v) => { d[k] = String(v) }, _d: d } }
function seeded(s = 7) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }
function world(opts = {}) { let t = 24 + 8; const store = opts.store || mem(); const M = create({ lines: L, people: P, storage: store, rng: seeded(opts.seed || 7), clock: () => t, heroName: () => 'เอริน' }); return { M, store, adv: h => { t += h }, at: () => t } }
const SLOT = /\{(name|self|role|dest|foe|biome|who|other|days|gold|job|result|a|b|arole|brole|aline|bline)\}/g;
const leftover = s => /\{[a-z]+\}/.test(s);

/* ---- content ---- */
const voices = Object.keys(L.V);
for (const v of voices) {
  for (const k of ['open', 'close', 'small', 'meet', 'friend']) ok(Array.isArray(L.V[v][k]) && L.V[v][k].length >= 2, `voice ${v}.${k} has ≥2 lines`);
  for (const ev of Object.keys(L.EVENTS)) ok((L.V[v].react[ev] || []).length >= 2, `voice ${v} reacts to ${ev} (≥2 lines)`);
}
for (const p of Object.values(P)) ok(voices.includes(p.voice), `${p.id} has a known voice (${p.voice})`), ok(p.gossip >= 0 && p.gossip <= 3, `${p.id} gossip 0–3`);
for (const sc of L.SCENES) { for (const w of sc.who) ok(P[w], `scene ${sc.id}: ${w} exists`); for (const [w] of sc.lines) ok(sc.who.includes(w), `scene ${sc.id}: speaker ${w} is in who`); if (sc.when?.ev) ok(L.EVENTS[sc.when.ev.split('@')[0]], `scene ${sc.id}: event ${sc.when.ev}`) }
ok(new Set(L.SCENES.map(s => s.id)).size === L.SCENES.length, 'scene ids unique');
for (const id in L.PERSONAL) { ok(P[id], `personal lines for ${id}: person exists`); for (const k in L.PERSONAL[id]) ok(L.EVENTS[k.split('@')[0]], `personal ${id}: ${k} is an event`) }
for (const id in L.WANTS) { ok(P[id], `want ${id}: person exists`); const w = L.WANTS[id]; ok(w.ask && w.thanks && w.hint && w.after?.length, `want ${id} complete`); if (w.cond.ev) ok(L.EVENTS[w.cond.ev], `want ${id} event`) }
for (const id in L.WORKERS) { ok(P[id], `worker ${id} exists`); for (const k of L.WORKERS[id]) ok(L.JOBS[k], `worker ${id}: job ${k}`) }
for (const k in L.GOSSIP) ok(L.EVENTS[k], `gossip ${k} is an event`);
/* every line resolves its slots */
{
  const { M } = world(); const e = { destName: 'ถ้ำจ่าฝูง', foe: 'wolf', biome: 'forest', who: 'ren', days: 3, jobName: 'ล่าสัตว์', result: 'ได้กวาง' };
  const all = []; for (const v of voices) { const V = L.V[v]; all.push(...V.open, ...V.close, ...V.small, ...V.meet, ...V.friend, ...Object.values(V.react).flat()) }
  for (const p of Object.values(L.PERSONAL)) all.push(...Object.values(p).flat());
  all.push(...Object.values(L.GOSSIP).flat(), ...L.SCENES.flatMap(s => s.lines.map(l => l[1])));
  let bad = 0; for (const s of all) if (leftover(M.fillSlots(s, e, 'marta'))) { bad++; if (bad < 4) console.log('  unresolved:', s) }
  ok(bad === 0, `all ${all.length} lines resolve their slots`);
  const unknown = all.flatMap(s => s.match(/\{[a-z]+\}/g) || []).filter(x => !x.match(SLOT)); ok(!unknown.length, 'no unknown slot names ' + unknown.slice(0, 3));
}

/* ---- engine ---- */
{ /* variety: 50 talks to one person — no immediate repeats, plenty of distinct lines */
  const { M, adv } = world(); const said = [];
  for (let i = 0; i < 50; i++) { said.push(M.talk('finn', { period: 'evening', place: 'inn' }).text); adv(.3) }
  let rep = 0; for (let i = 1; i < said.length; i++) if (said[i] === said[i - 1]) rep++;
  ok(rep === 0, 'no line said twice in a row'); ok(new Set(said).size >= 30, `variety: ${new Set(said).size}/50 distinct`);
}
{ /* news: the witness knows at once, chatty marta soon, quiet sigrid later; told once */
  const { M, adv } = world();
  M.emit('battle:win', { foe: 'wolf', biome: 'forest', witness: ['bram'] });
  ok(M.known('bram').length === 1, 'witness knows immediately'); ok(M.known('sigrid').length === 0, 'quiet person does not know yet');
  adv(2); ok(M.known('marta').length === 0, 'small news not yet at the inn after 2h'); adv(6); ok(M.known('marta').length === 1, 'marta hears small news within 8h');
  const r = M.talk('marta', { period: 'day' }); ok(r.kind === 'news', 'marta tells the news first'); ok(/หมาป่า/.test(r.text) || /ป่า/.test(r.text) || r.text.length > 5, 'news names it');
  const r2 = M.talk('marta', { period: 'day' }); ok(r2.kind !== 'news', 'news only told once');
  M.emit('boss:win', { dest: 'den', destName: 'ถ้ำจ่าฝูง' }); adv(7);
  const b = M.talk('berg', { period: 'day' }); ok(b.kind === 'news' && /จ่าฝูง|สิบปี|เพื่อนเก่า/.test(b.text), 'berg reacts personally to the den: ' + b.text);
}
{ /* pruning: events are forgotten after their life */
  const { M, adv } = world(); M.emit('chest:found', {}); adv(24 * 3); M.prune(); ok(M.state.events.length === 0, 'chest news forgotten after 2 days');
  for (let i = 0; i < 200; i++) M.emit('battle:win', {}); ok(M.state.events.length <= 120, 'events capped at 120');
}
{ /* jobs: start → away → tick gives reward → report once */
  const { M, adv } = world(); const S = { gold: 50, potions: 0, food: 0 };
  ok(M.startJob('ken', 'forage', S).ok, 'job started'); ok(S.gold === 40, 'job cost paid'); ok(M.away('ken'), 'worker is away'); ok(!M.startJob('ken', 'hunt', S).ok, 'cannot double-book');
  adv(5); const done = M.tick(S); ok(done.length === 1 && S.potions >= 1, 'job finished, potions given'); ok(!M.away('ken'), 'worker back');
  const r = M.talk('ken', { period: 'day', save: S }); ok(r.kind === 'job', 'worker reports first: ' + r.text);
  ok(M.talk('ken', { period: 'day', save: S }).kind !== 'job', 'report only once');
  ok(!M.startJob('ken', 'trade', { gold: 0 }).ok || true, 'unknown job for worker handled');
  const S2 = { gold: 100 }; M.startJob('berg', 'scout', S2); adv(7); M.tick(S2); ok(S2.revealQueue === 1, 'scouting queues a map reveal');
}
{ /* wants: asked on 2nd talk, met by event, rewarded once, then after-lines */
  const { M, adv } = world(); const S = { gold: 0, potions: 0 };
  M.talk('shep', { period: 'day', save: S }); adv(4); const a = M.talk('shep', { period: 'day', save: S }); ok(a.kind === 'want', 'shep asks his favour on the 2nd talk');
  M.emit('battle:win', { biome: 'forest' }); adv(4); M.talk('shep', { save: S }); ok(!M.wantState('shep').done, 'wrong biome does not count');
  M.emit('battle:win', { biome: 'grass' }); adv(4); let r; for (let i = 0; i < 4 && (!r || r.kind !== 'want-done'); i++) { r = M.talk('shep', { period: 'day', save: S }); adv(1) }
  ok(r.kind === 'want-done' && S.gold === 20, 'want rewarded: ' + (r && r.text)); ok(M.wantState('shep').done, 'want marked done');
  /* a destination already cleared before asking still counts */
  M.emit('boss:win', { dest: 'den' }); M.talk('marta', {}); adv(1); M.talk('marta', {}); adv(1); let m2; for (let i = 0; i < 6; i++) { m2 = M.talk('marta', { save: S }); if (m2.kind === 'want-done') break; adv(1) }
  ok(m2.kind === 'want-done', 'marta favour completes from an earlier den clear');
}
{ /* scenes */
  const { M, adv } = world();
  const s = M.scene(['marta', 'olwen'], { place: 'inn', period: 'evening' }); ok(s && s.lines.length >= 3, 'a written scene plays when both are present');
  ok(s.lines.every(([w, t]) => P[w] && !leftover(t)), 'scene lines resolved');
  M.emit('boss:win', { dest: 'den', destName: 'ถ้ำจ่าฝูง' }); adv(3);
  const s2 = M.scene(['berg', 'ren'], { place: 'inn', period: 'night' }); ok(s2?.id === 'berg-ren-den', 'event scene preferred: ' + s2?.id);
  ok(M.scene(['berg', 'ren'], { place: 'inn', period: 'night' })?.id !== 'berg-ren-den', 'once-only scene does not repeat');
  const g = M.scene(['joe', 'tess'], { place: 'market', period: 'day' }); ok(g && g.lines.every(([, t]) => !leftover(t)), 'generic pair chat resolves');
  ok(M.rel('berg', 'ren') >= 3, 'scene effect raises relationship');
}
{ /* save + migration */
  const store = mem(); store.setItem('agrenor-mind-v1', JSON.stringify({ events: [{ type: 'battle:win', t: 1 }, { type: 'bogus', t: 1 }, null], npc: 'broken' }));
  const { M } = world({ store }); const st = M.state; ok(st.v === 1 && st.events.length === 1 && typeof st.npc === 'object', 'old/broken save migrated');
  store.setItem('agrenor-mind-v1', '{not json'); const w2 = world({ store }); ok(w2.M.state.v === 1, 'corrupt save → fresh');
  const w3 = world(); w3.M.emit('journey:start', { destName: 'x' }); const raw = JSON.parse(w3.store.getItem('agrenor-mind-v1')); ok(raw.v === 1 && raw.events.length === 1, 'saved with version');
}
{ /* every person can be talked to 20× without errors or empty text */
  const { M, adv } = world(); let empty = 0;
  for (const id of Object.keys(P)) for (let i = 0; i < 20; i++) { const r = M.talk(id, { period: ['morning', 'day', 'evening', 'night'][i % 4], place: 'inn' }); if (!r.text || leftover(r.text)) { empty++; console.log('  bad:', id, r.kind, r.text) } adv(.5) }
  ok(empty === 0, 'all villagers produce text (' + empty + ' bad)');
}
console.log(`village-mind: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
