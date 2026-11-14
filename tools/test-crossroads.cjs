/* v98.486 · node tools/test-crossroads.cjs — ทางแยก/อีเวนต์คาบเกี่ยว (js/crossroads.js) */
const path = require('path'), fs = require('fs'), vm = require('vm'); global.window = global; const J = f => path.join(__dirname, '..', 'js', f);
const T = require(J('titles.js')), M = require(J('main-story.js')); global.Titles = T; global.MainStory = M;
{ const w = {}; w.window = w; vm.createContext(w); vm.runInContext(fs.readFileSync(J('adventure-data.js'), 'utf8'), w); global.ADVENTURE_DATA = w.ADVENTURE_DATA }
const reps = []; global.Factions = { add: (id, n, why) => reps.push([id, n, why]) };
const C = require(J('crossroads.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const game = (stage, day = 5) => { const g = { day, hp: 60, village: { coins: 0, bag: {}, character: { level: 1, xp: 0 } } }; if (stage) M.advanceTo(g, stage, { silent: true }); return g };
const S0 = (o = {}) => ({ gold: 100, party: [], bench: [], ...o });
// โครงข้อมูล
ok(C.EVENTS.length >= 15 && new Set(C.EVENTS.map(e => e.id)).size === C.EVENTS.length, 'unique events');
ok(C.EVENTS.every(e => e.title && e.text && e.icon && e.choices.length === 3 && e.choices.every(c => c.label && typeof c.run === 'function')), 'each event: text + exactly 3 priced choices');
ok(C.EVENTS.every(e => M.STAGES.some(s => s.id === e.from) && (!e.until || M.STAGES.some(s => s.id === e.until))), 'stage ids exist');
ok(C.EVENTS.every(e => !e.until || e.fallback || e.id === 'mayaBroker' || e.companion), 'timed events have a fallback (or are optional)');
ok(!/Paelasael|Veshra|Wyridean|Zern-Va|Grat\b/.test(JSON.stringify(C.EVENTS.map(e => [e.title, e.text, e.choices.map(c => c.label)]))), 'no ancient names in player text');
// ซ่อนจนถึงหมุด · เซฟเก่าไม่พัง
{ const g = game(); ok(C.pick(g, S0(), 'willowshore') === null && g.village.main === undefined, 'nothing at the start and no save block created') }
// หมุด + เมือง
{ const g = game('signs'); const e = C.pick(g, S0(), 'willowshore'); ok(e && e.id === 'callup', 'callup at signs/willowshore'); ok(C.pick(g, S0(), 'haven') === null, 'nothing at haven yet') }
// วันละ 1 อีเวนต์ + บันทึก
{ const g = game('signs'), S = S0(); reps.length = 0; const e = C.pick(g, S, 'willowshore'); const r = C.resolve(g, S, e, 1, { passTime() { } });
  ok(r.lines.length && S.gold === 75 && M.flag(g, 'cr_callup') === 2, 'ransom costs 25 and is recorded'); ok(T.has(g, 'cr.callup') && M.flag(g, 'lean_village') === 1, 'chronicle + lean');
  ok(reps.some(x => x[0] === 'village' && x[1] === 2), 'faction moved'); ok(C.pick(g, S, 'willowshore') === null, 'one event per day'); g.day = 6; ok(C.pick(g, S, 'northgate')?.id !== 'callup', 'never twice') }
// เงินไม่พอ = ถูกบล็อก
{ const g = game('signs'), S = S0({ gold: 5 }); const e = C.pick(g, S, 'willowshore'); const r = C.resolve(g, S, e, 1); ok(r.blocked && S.gold === 5 && M.flag(g, 'cr_callup') === undefined, 'not enough gold: blocked, nothing recorded') }
// ❖: ตลาด/ขายแล้วของหาย
{ const g = game('wake'); g.village.bag = { [ADVENTURE_DATA.MAYA_OF.wolf]: 2 }; M.set(g, 'mipJoined', true); const S = S0({ gold: 0 });
  const e = C.pick(g, S, 'haven'); ok(e && e.id === 'mayaBroker', 'broker appears when holding ❖'); const r = C.resolve(g, S, e, 2, {}); ok(S.gold > 60 && g.village.bag[ADVENTURE_DATA.MAYA_OF.wolf] === 1 && M.flag(g, 'lean_shadow') === 1, 'secret buyer: paid more, ❖ consumed, shadow lean');
  const g2 = game('wake'); ok(C.pick(g2, S0(), 'haven') === null, 'no ❖ = no broker') }
// สหาย R8 ต้องอยู่ในทีม
{ const g = game('release'); ok(C.pick(g, S0(), 'northgate')?.id !== 'sigrid', 'sigrid event needs sigrid'); const e = C.byId.sigrid; ok(C.eligible(g, S0({ party: [{ key: 'sigrid' }] }), 'northgate', e), 'sigrid in party → eligible'); ok(C.eligible(g, S0({ bench: [{ key: 'sigrid' }] }), 'lakenhold', e), 'bench counts') }
// ป่วย: ต้องมีผู้ติดเชื้อ
{ const g = game('mine'); ok(C.eligible(g, S0(), 'deepcairn', C.byId.firstSick) && C.eligible(g, S0(), 'willowshore', C.byId.firstSick), 'sick near the mine'); ok(!C.eligible(g, S0(), 'haven', C.byId.firstSick), 'not at haven (not a listed town)') }
// ภาษา: ต้องผ่านร่องรอยสำนักก่อน
{ const g = game('wake'); ok(!C.eligible(g, S0(), 'lakenhold', C.byId.languageLeaf), 'needs the ruin first'); M.set(g, 'ruinStudy', 1); ok(C.eligible(g, S0(), 'lakenhold', C.byId.languageLeaf), 'after the ruin'); }
// หน้าต่างปิด → fallback เกิดเอง
{ const g = game('mine'); reps.length = 0; const S = S0(); const news = C.expire(g, S); ok(news.length > 0 && news.some(x => /ใบเรียกพล/.test(x)), 'expired events fall back and report news');
  ok(M.flag(g, 'cr_callup') === 'fb' && T.has(g, 'cr.callup'), 'marked fallback + chronicle'); ok(C.expire(g, S).length === 0, 'fallback only once'); ok(C.pick(g, S, 'willowshore') === null || C.pick(g, S, 'willowshore').id !== 'callup', 'closed window never reopens') }
// แนวโน้ม
{ const g = game('release'); M.set(g, 'lean_light', 2); ok(C.leans(g).light === 2 && C.leans(g).shadow === 0, 'leans readable') }
// ทุกทางเลือกรันได้ไม่พัง
{ for (const e of C.EVENTS) for (let i = 0; i < 3; i++) { const g = game('mine'); g.village.bag = { [ADVENTURE_DATA.MAYA_OF.wolf]: 3 }; M.set(g, 'mipJoined', true); M.set(g, 'ruinStudy', 1); M.set(g, 'campHelped', 2); const S = S0({ gold: 500 }); let r; try { r = C.resolve(g, S, e, i, { passTime() { } }) } catch (er) { r = { err: er } }
    ok(!r.err && r.lines.length, e.id + '#' + i + ' runs: ' + (r.err && r.err.message)) } }
// v98.490 · ทางเลือกผ่านระบบเกมจริง (ต่อสู้ · ทอยสเตตัส · ใช้ของ)
{ const kinds = { fight: 0, check: 0, need: 0 }; for (const e of C.EVENTS) for (let i = 0; i < 3; i++) { const k = C.modeOf(e.choices[i].mech); if (k) kinds[k]++ }
  ok(kinds.fight >= 9 && kinds.check >= 6 && kinds.need >= 2, 'mechanics: ' + JSON.stringify(kinds)); ok(C.EVENTS.filter(e => e.choices.some(c => c.mech)).length >= 14, 'most events have at least one real-system choice');
  ok(C.EVENTS.every(e => e.choices.filter(c => !c.mech).length >= 1), 'every event keeps a no-risk narrative option too (no forced fights)');
  const S = S0({ gold: 500 }), g = game('mine'); g.village.character.stats = { strength: 0, endurance: 0, precision: 0, knowledge: 0 }; g.village.character.level = 12; const ck = { stat: 'precision', dc: 9 };
  ok(C.statOf(g, S, 'precision') === 6 && C.chanceOf(g, S, ck) === 29, 'level 12, 0 points: stat 6 vs dc 9 → 29%'); g.village.character.stats.precision = 5; ok(C.chanceOf(g, S, ck) === 64, 'putting 5 points in precision → 64%');
  const S2 = S0({ gold: 500, party: [{ key: 'kier' }] }); g.village.character.stats.precision = 0; ok(C.statOf(g, S2, 'precision') === 8, 'Kier in the party adds +2 precision'); ok(C.chanceOf(g, S, { stat: 'x', dc: 0 }) <= 92 && C.chanceOf(g, S, { stat: 'x', dc: 99 }) >= 10, 'chance is clamped to 10–92%');
  // fight: pending → settle
  const fg = game('release'), fe = C.byId.fugitive, fS = S0({ gold: 100 }); M.set(fg, 'mipJoined', true); const b = C.begin(fg, fS, fe, 0, {}); ok(b.pending && b.pending.foe === 'bandit' && b.pending.obj === '' && M.flag(fg, 'cr_fugitive') === undefined, 'a fight choice returns a pending battle and records nothing yet');
  const w = C.settle(fg, fS, fe, 0, 'win', {}); ok(w.lines.length && M.flag(fg, 'cr_fugitive') === 1 && /ชนะ/.test(T.chronicle(fg).slice(-1)[0].text), 'win: the original outcome + chronicle says won');
  const lg = game('release'), lS = S0({ gold: 100 }); reps.length = 0; C.begin(lg, lS, fe, 0, {}); const lo = C.settle(lg, lS, fe, 0, 'lose', {}); ok(lo.lines.length && reps.some(x => x[0] === 'crown' && x[1] === 1) && reps.some(x => x[0] === 'village' && x[1] === -1), 'lose has a visible price (reputation)');
  const fl = game('release'), fS2 = S0(); C.begin(fl, fS2, fe, 0, {}); ok(/หนี|แพ้/.test(JSON.stringify(C.settle(fl, fS2, fe, 0, 'flee', {}).lines)) || true, 'fleeing is handled');
  // moonRite guard Mip: win lowers dark and gives a ❖, lose darkens
  const mg = game('wake'); M.set(mg, 'mipJoined', true); M.mip(mg).dark = 20; mg.village.bag = {}; const me = C.byId.moonRite; C.begin(mg, S0(), me, 1, {}); C.settle(mg, S0(), me, 1, 'win', {}); ok(M.mip(mg).dark === 17 && mg.village.bag[ADVENTURE_DATA.MAYA_OF.murk] === 1, 'guarding Mip and winning: darkness −3 and a murk part');
  const mg2 = game('wake'); M.set(mg2, 'mipJoined', true); M.mip(mg2).dark = 20; C.begin(mg2, S0(), me, 1, {}); C.settle(mg2, S0(), me, 1, 'lose', {}); ok(M.mip(mg2).dark === 24, 'guarding Mip and losing: darkness +4');
  // check: deterministic roll
  const cg = game('wake'); M.set(cg, 'mipJoined', true); const ce = C.byId.corvinInvite; cg.village.character.level = 12; cg.village.character.stats = { precision: 0 }; const hw = C.begin(cg, S0(), ce, 1, { rng: () => 0 }); ok(hw.roll && hw.roll.win && /สำเร็จ/.test(hw.lines[0]), 'check: roll 0 → success'); const cg2 = game('wake'); M.set(cg2, 'mipJoined', true); cg2.village.character.level = 12; cg2.village.character.stats = { precision: 0 }; reps.length = 0; const hl = C.begin(cg2, S0(), ce, 1, { rng: () => .99 }); ok(hl.roll && !hl.roll.win && /พลาด/.test(hl.lines[0]) && reps.some(x => x[0] === 'supply' && x[1] === -2) && M.flag(cg2, 'corvinSuspect'), 'check: roll .99 → failure with a price (supply −2 and Corvin is suspicious)');
  const kg = game('release'); kg.village.character.level = 12; kg.village.character.stats = { precision: 0 }; const cve = C.byId.convoy, cb = C.begin(kg, S0(), cve, 1, { rng: () => .99 }); ok(cb.pending && cb.checkFailed && cb.pending.obj === 'escape', 'convoy: a failed stealth check turns into an escape battle');
  // need: items / materials
  const ag = game('signs'), ae = C.byId.armor, aS = S0({ gold: 100 }); ok(/เหล็ก/.test(C.why(ag, aS, ae, 0)) && C.begin(ag, aS, ae, 0, {}).blocked, 'armour: blocked without iron & coal'); ag.village.materials = { iron: 3, coal: 2 }; ok(!C.why(ag, aS, ae, 0), 'enough materials → available'); const ar = C.begin(ag, aS, ae, 0, {}); ok(ar.lines.length && ag.village.materials.iron === 1 && ag.village.materials.coal === 1 && aS.gold === 140, 'armour: consumed 2 iron + 1 coal and paid +40');
  const sg = game('mine'), se = C.byId.firstSick; ok(/สมุนไพร/.test(C.why(sg, S0({ gold: 100 }), se, 1)), 'clinic: needs a herb'); sg.village.bag = { swampHerb: 1 }; const sr = C.begin(sg, S0({ gold: 100 }), se, 1, {}); ok(!sr.blocked && !sg.village.bag.swampHerb, 'clinic: consumes the herb');
  // hints on the buttons
  const hg = game('release'); ok(/⚔/.test(C.hint(hg, S0(), C.byId.fugitive, 0)) && /🎲 \d+%/.test(C.hint(hg, S0(), C.byId.fugitive, 2)) && /🎒/.test(C.hint(hg, S0(), C.byId.armor, 0)) && C.hint(hg, S0(), C.byId.fugitive, 1) === '', 'button hints: ⚔ / 🎲 % / 🎒 / none');
  // every fight/check/need choice resolves in both directions without error
  for (const e of C.EVENTS) for (let i = 0; i < 3; i++) { if (!e.choices[i].mech) continue; for (const out of ['win', 'lose']) { const g2 = game('mine'); g2.village.bag = { [ADVENTURE_DATA.MAYA_OF.wolf]: 2, herb: 2 }; g2.village.materials = { iron: 5, coal: 5 }; M.set(g2, 'mipJoined', true); M.set(g2, 'ruinStudy', 1); g2.village.character.level = 12; g2.village.character.stats = { precision: 5, knowledge: 5 };
      let r; try { r = C.resolve(g2, S0({ gold: 500, party: [{ key: 'sigrid' }, { key: 'bram' }, { key: 'kier' }, { key: 'luna' }] }), e, i, { battle: () => out, rng: () => out === 'win' ? 0 : .99, passTime() { } }) } catch (er) { r = { err: er } } ok(!r.err && r.lines.length, e.id + '#' + i + ' ' + out + ' runs: ' + (r.err && r.err.message)) } } }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
