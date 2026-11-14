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
// v98.486 · สถานที่/ตัวละครเพิ่ม
{ const g = game(); M.advanceTo(g, 'signs', { silent: true }); ok(names(g, 'willowshore').includes('หมอหญิงไอรีน') && !names(g, 'haven').includes('วิก'), 'irene at signs; vik not yet'); M.advanceTo(g, 'wake', { silent: true }); ok(names(g, 'haven').includes('วิก'), 'vik at wake');
  ok(SC.locals(g, 'haven', ST.LOCALS.haven || []).find(x => x[0] === 'วิก')[3] === 'vik', 'locals carry a portrait id');
  const S = { gold: 100, cargo: { iron: 3, fish: 2 }, traded: 0 }, ctx = { passTime() { }, healParty() { } };
  ok(SC.services(g, 'northgate').some(s => s.key === 'st:faith') && !SC.services(g, 'willowshore').some(s => s.key === 'st:clinic'), 'faith house at signs; clinic needs war 3');
  M.advanceTo(g, 'release', { silent: true }); ok(SC.services(g, 'willowshore').some(s => s.key === 'st:clinic'), 'clinic at war 3');
  let r = SC.run(g, 'northgate', 'st:faith', S, ctx); ok(M.flag(g, 'faithVisits') === 1 && T.has(g, 'site.faith') && M.flag(g, 'faithHeard') === 1, 'faith house step 1'); SC.run(g, 'northgate', 'st:faith', S, ctx); SC.run(g, 'northgate', 'st:faith', S, ctx); SC.run(g, 'northgate', 'st:faith', S, ctx); ok(M.flag(g, 'faithVisits') === 3, 'faith capped at 3');
  r = SC.run(g, 'lakenhold', 'st:army', S, ctx); ok(S.gold > 100 && !S.cargo.iron && !S.cargo.fish && M.flag(g, 'armyOrders') === 1 && T.has(g, 'site.army'), 'army buys the cargo at a premium'); r = SC.run(g, 'lakenhold', 'st:army', S, ctx); ok(/ไม่มี/.test(r.lines[0]), 'nothing to sell');
  r = SC.run(g, 'willowshore', 'st:clinic', S, ctx); ok(M.flag(g, 'clinicVisits') === 1 && T.has(g, 'site.clinic'), 'clinic visit');
  ok(SC.face('vik').src.startsWith('data:') === (typeof document !== 'undefined') || SC.face('vik') !== null, 'face helper') }
// v98.489 · NPC พูดถึงสิ่งที่ผู้เล่นทำ (REACT)
{ const allLocal = Object.values(ST.LOCALS).flat().map(x => x[0]), ids = SC.CAST.map(c => c.id);
  ok(SC.REACT.length >= 40 && SC.REACT.every(x => (x.n ? allLocal.includes(x.n) : ids.includes(x.id)) && x.t.length > 25 && typeof x.c === 'function'), 'every reaction belongs to a real local / cast member');
  const CR = require(path.join(__dirname, '..', 'js', 'crossroads.js')); global.Crossroads = CR; const evIds = CR.EVENTS.map(e => e.id), src = require('fs').readFileSync(path.join(__dirname, '..', 'js', 'story-cast.js'), 'utf8'), used = [...src.matchAll(/cr\('([a-zA-Z]+)', (\d)\)/g)];
  ok(used.length >= 30 && used.every(([, id, v]) => evIds.includes(id) && +v >= 1 && +v <= 3), 'every reaction points at a real crossroad choice (1–3)');
  const g = game(); M.advanceTo(g, 'release', { silent: true }); const base = SC.locals(g, 'northgate', ST.LOCALS.northgate || []).find(x => x[0] === 'พี่น้องเฮลกา')[2].length;
  M.set(g, 'cr_convoy', 2); const after = SC.locals(g, 'northgate', ST.LOCALS.northgate || []).find(x => x[0] === 'พี่น้องเฮลกา')[2]; ok(after.length === base + 3 && after.some(l => /ตามขบวน/.test(l)), 'Helga mentions following the convoy (weighted ×3)');
  M.set(g, 'cr_convoy', 1); ok(!SC.locals(g, 'northgate', []).find(x => x[0] === 'พี่น้องเฮลกา')[2].some(l => /ตามขบวนไปดู/.test(l)) && SC.locals(g, 'northgate', []).find(x => x[0] === 'พี่น้องเฮลกา')[2].some(l => /ปล่อยพวกเขาผ่านไป/.test(l)), 'a different choice → a different line');
  const h = game(); M.advanceTo(h, 'release', { silent: true }); ok(!SC.locals(h, 'deepcairn', ST.LOCALS.deepcairn).find(x => x[0] === 'โบดิล')[2].some(l => /รายชื่อที่เจ้ารับปาก/.test(l)), 'no reaction to something the player never did');
  M.set(h, 'listKept', true); ok(SC.locals(h, 'deepcairn', ST.LOCALS.deepcairn).find(x => x[0] === 'โบดิล')[2].some(l => /รายชื่อที่เจ้ารับปาก/.test(l)), 'Boudil remembers the list');
  M.set(h, 'ending', 'third'); ok(SC.locals(h, 'deepcairn', ST.LOCALS.deepcairn).find(x => x[0] === 'โบดิล')[2].some(l => /ปากเหมืองถูกปิดแล้ว/.test(l)), 'and after the ending he speaks of it') }
{ const g = game(); M.advanceTo(g, 'release', { silent: true }); M.set(g, 'cr_armor', 1); const has = () => SC.locals(g, 'lakenhold', ST.LOCALS.lakenhold).find(x => x[0] === 'นายพลคอร์วิน แธเรล')[2].some(l => /ก่อนใบไม้ร่วง/.test(l));
  ok(has(), 'during the war Corvin talks about the armour'); M.set(g, 'ending', 'aldren'); ok(!has(), 'after the ending he no longer talks about wartime things (found by tools/sim-life.cjs)'); ok(SC.locals(g, 'lakenhold', ST.LOCALS.lakenhold).find(x => x[0] === 'นายพลคอร์วิน แธเรล')[2].some(l => /นับศพ/.test(l)), 'he talks about the ending instead');
  ok(['third', 'light', 'shadow', 'aldren'].every(e => SC.REACT.some(x => x.id === 'helga' && x.post)), 'Helga has post-ending lines') }
// v98.492 · กระดานข่าวแสดงเฉพาะข่าวที่ยังไม่ได้อ่าน
{ const g = game(); M.advanceTo(g, 'release', { silent: true }); const r1 = SC.run(g, 'northgate', 'st:news', { gold: 0 }, {}), r2 = SC.run(g, 'northgate', 'st:news', { gold: 0 }, {});
  ok(r1.lines.filter(l => l.startsWith('•')).length >= 3, 'first read: the signs of this phase'); ok(r2.lines.some(l => /ไม่มีข่าวใหม่/.test(l)) && !r2.lines.some(l => /ภาษีขึ้น/.test(l)), 'second read: nothing new, the old items are not repeated');
  M.advanceTo(g, 'mine', { silent: true }); const r3 = SC.run(g, 'northgate', 'st:news', { gold: 0 }, {}); ok(r3.lines.some(l => /สัตว์ผิดปกติ/.test(l)) && !r3.lines.some(l => /ภาษีขึ้น/.test(l)), 'a new phase brings only the new item') }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
