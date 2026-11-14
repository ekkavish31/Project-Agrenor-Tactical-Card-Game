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
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
