/* v98.485 · node tools/test-story-cast.cjs — ตัวละคร/สถานที่ของเนื้อเรื่องหลักบนแผนที่โลก (js/story-cast.js + ต่อกับ town-services) */
const path = require('path'); global.window = global; const J = f => path.join(__dirname, '..', 'js', f);
const T = require(J('titles.js')), M = require(J('main-story.js')), SC = require(J('story-cast.js')); const ST = require(J('settlements.js'));
global.Titles = T; global.MainStory = M; global.Factions = { add() {} };
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const game = () => ({ day: 3, hp: 60, village: { coins: 0, character: { level: 1, xp: 0 } } });
const names = (g, town) => SC.locals(g, town, ST.LOCALS[town] || []).map(x => x[0]);
// ก่อนถึงหมุด ไม่เห็นตัวละครใหม่ · เซฟเก่าไม่พัง
{ const g = game(); ok(!names(g, 'lakenhold').includes('นายพลคอร์วิน แธเรล'), 'corvin hidden at start'); ok(g.village.main === undefined, 'reading creates no save block');
  ok(SC.services(g, 'northgate').length === 0 && SC.services(g, 'thornwatch').length === 0, 'no story spots at the start');
  ok(names(g, 'lakenhold').includes('อาจารย์ซีลัส') && names(g, 'deepcairn').includes('โบดิล'), 'existing locals stay') }
// ตามหมุด
{ const g = game(); M.advanceTo(g, 'signs', { silent: true });
  ok(names(g, 'lakenhold').includes('นายพลคอร์วิน แธเรล') && names(g, 'northgate').includes('พี่น้องเฮลกา'), 'corvin + helga appear at signs');
  ok(!names(g, 'thornwatch').includes('ลอร์ริก') && !names(g, 'thornwatch').includes('เมียร์ริส'), 'rangers not yet');
  ok(SC.services(g, 'northgate').some(s => s.key === 'st:news') && SC.services(g, 'northgate').some(s => s.key === 'st:camp'), 'news board + refugee camp at war 2');
  ok(!SC.services(g, 'deepcairn').some(s => s.key === 'st:pit'), 'mine mouth not yet');
  M.advanceTo(g, 'wake', { silent: true }); ok(names(g, 'thornwatch').includes('ลอร์ริก') && SC.services(g, 'thornwatch').some(s => s.key === 'st:ruin'), 'shadow hunter + ruin at wake');
  const lorrikEarly = JSON.stringify(SC.locals(g, 'thornwatch', ST.LOCALS.thornwatch).find(x => x[0] === 'ลอร์ริก')); ok(!/Duum/.test(lorrikEarly), 'no Vaelari name before release');
  M.advanceTo(g, 'release', { silent: true }); ok(names(g, 'thornwatch').includes('เมียร์ริส') && names(g, 'deepcairn').includes('เซอร์ดาร์เรน') && SC.services(g, 'deepcairn').some(s => s.key === 'st:pit'), 'light ranger + knight + mine mouth at release');
  ok(/Duum'Lorien/.test(JSON.stringify(SC.locals(g, 'thornwatch', ST.LOCALS.thornwatch).find(x => x[0] === 'ลอร์ริก'))), 'Vaelari name after release');
  ok(SC.locals(g, 'deepcairn', ST.LOCALS.deepcairn).find(x => x[0] === 'โบดิล')[2].length > ST.LOCALS.deepcairn.find(x => x[0] === 'โบดิล')[2].length, 'existing local gets war lines') }
// ใช้งานปุ่ม
{ const g = game(); M.advanceTo(g, 'release', { silent: true }); const S = { gold: 50 }, ctx = { passTime() { } };
  let r = SC.run(g, 'thornwatch', 'st:ruin', S, ctx); ok(r.lines.length && M.flag(g, 'ruinStudy') === 1 && T.has(g, 'site.ruin'), 'ruin step 1 + chronicle');
  SC.run(g, 'thornwatch', 'st:ruin', S, ctx); r = SC.run(g, 'thornwatch', 'st:ruin', S, ctx); ok(M.flag(g, 'ruinStudy') === 3 && r.lines.some(l => /ครบชุดแรก/.test(l)), 'ruin completes at 3'); SC.run(g, 'thornwatch', 'st:ruin', S, ctx); ok(M.flag(g, 'ruinStudy') === 3, 'capped at 3');
  r = SC.run(g, 'deepcairn', 'st:pit', S, ctx); ok(M.flag(g, 'pitSeen') === true && T.has(g, 'site.mine'), 'mine mouth seen + chronicle');
  r = SC.run(g, 'northgate', 'st:news', S, ctx); ok(r.lines.length >= 2, 'news lists signs'); r = SC.run(g, 'northgate', 'st:camp', S, ctx); ok(M.flag(g, 'campHelped') === 1 && T.has(g, 'site.camp'), 'camp helps + chronicle') }
// town-services เชื่อมถูก
{ global.WorldState = { game: () => G }; const TS = require(J('town-services.js')); var G = game(); M.advanceTo(G, 'signs', { silent: true }); const S = { gold: 30, svc: {} };
  const l = TS.list(S, 'northgate'); ok(l.some(x => x.key === 'st:camp' && !x.disabled), 'town-services lists the camp');
  const r = TS.run(S, 'northgate', 'st:camp', { passTime() { }, game: () => G }); ok(r.lines.length && S.gold === 20, 'run charges 10 and returns lines'); ok(TS.list(S, 'northgate').find(x => x.key === 'st:camp').disabled, 'daily: used today') }
// ข้อความไม่มีชื่อโบราณ
{ const all = JSON.stringify([SC.CAST.map(c => c.lines({ day: 1, village: { main: { stage: 'release', flags: {}, at: {} } } })), SC.EXTRA]); ok(!/Paelasael|Veshra|Wyridean|Zern-Va|Grat\b/.test(all), 'no ancient names') }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
