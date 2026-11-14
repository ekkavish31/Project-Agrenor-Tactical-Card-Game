/* v98.487 · node tools/test-endings.cjs — ฉากจบที่อ่านแนวโน้ม (js/endings.js) + หมุดเรื่องช่วงปลาย (MainStory.check) */
const path = require('path'), fs = require('fs'), vm = require('vm'); global.window = global; const J = f => path.join(__dirname, '..', 'js', f);
const T = require(J('titles.js')), M = require(J('main-story.js')); global.Titles = T; global.MainStory = M;
{ const w = {}; w.window = w; vm.createContext(w); vm.runInContext(fs.readFileSync(J('adventure-data.js'), 'utf8'), w); global.ADVENTURE_DATA = w.ADVENTURE_DATA }
const reps = []; global.Factions = { add: (id, n, why) => reps.push([id, n, why]) };
global.Crossroads = require(J('crossroads.js')); const E = require(J('endings.js')), SC = require(J('story-cast.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const game = (lv = 1) => ({ day: 9, hp: 60, village: { coins: 0, bag: {}, character: { level: lv, xp: 0 }, story: { mode: 'done' } } });
const at = (st, flags = {}, lv = 12) => { const g = game(lv); M.advanceTo(g, st, { silent: true }); for (const [k, v] of Object.entries(flags)) M.set(g, k, v); return g };
// หมุดช่วงปลายเดินตามสิ่งที่ผู้เล่นทำ ไม่ตามวัน
{ const g = game(3); g.day = 999; M.check(g); ok(M.is(g, 'free'), 'days alone move nothing'); g.village.character.level = 5; M.check(g); ok(M.is(g, 'signs'), 'level 5 → signs');
  g.village.character.level = 7; M.check(g); ok(M.is(g, 'wake'), 'level 7 → wake'); g.village.character.level = 9; M.check(g); ok(M.is(g, 'wake'), 'level 9 alone is not enough for release (needs a clue, or level 11)'); M.set(g, 'ruinStudy', 1); M.check(g); ok(M.is(g, 'release'), 'level 9 + a clue → release');
  g.village.character.level = 12; M.check(g); ok(M.is(g, 'chase'), 'level 12 fallback: chase even without mine info (never stall)'); M.set(g, 'mineInfo', 1); M.check(g); ok(M.is(g, 'chase'), 'chase'); M.check(g); ok(M.is(g, 'chase'), 'mine needs the pit seen'); M.set(g, 'pitSeen', true); M.check(g); ok(M.is(g, 'mine'), 'mine'); M.check(g); ok(M.is(g, 'mine'), 'climax needs 2 mine infos'); M.set(g, 'mineInfo', 2); M.check(g); ok(M.is(g, 'climax'), 'climax'); ok(E.ready(g), 'finale ready at climax') }
// ฉากจบเปิดเป็นปุ่มที่ปากเหมืองเท่านั้น
{ const g = at('climax'); ok(SC.services(g, 'deepcairn').some(s => s.key === 'st:finale') && !SC.services(g, 'thornwatch').some(s => s.key === 'st:finale'), 'finale button only at Deepcairn'); ok(SC.run(g, 'deepcairn', 'st:finale', {}, {}).panel === 'finale', 'asks the map to open the scene'); const h = at('mine'); ok(!SC.services(h, 'deepcairn').some(s => s.key === 'st:finale'), 'not before climax') }
// ตัวเลือกอ่านแนวโน้ม
{ const g = at('climax'); let so = E.sideOptions(g); ok(so.find(o => o.id === 'aldren').ok && !so.find(o => o.id === 'third').ok && !so.find(o => o.id === 'light').ok && !so.find(o => o.id === 'shadow').ok, 'no leans: only the baseline path (aldren)'); ok(so.filter(o => !o.ok).every(o => o.why), 'locked paths say why');
  M.set(g, 'lean_light', 2); so = E.sideOptions(g); ok(so.find(o => o.id === 'light').ok && !so.find(o => o.id === 'shadow').ok, 'light lean opens light');
  const h = at('climax', { lean_shadow: 1 }); ok(E.sideOptions(h).find(o => o.id === 'shadow').ok, 'shadow lean opens shadow');
  const t = at('climax', { lean_light: 1, lean_shadow: 1, lean_village: 2, ruinStudy: 3, infectedHelped: 1, campHelped: 2 }); ok(E.sideOptions(t).find(o => o.id === 'third').ok, 'balanced + village + knowledge + helping → third path opens');
  const u = at('climax', { lean_light: 3, lean_shadow: 0, lean_village: 2, ruinStudy: 3, infectedHelped: 2 }); ok(!E.sideOptions(u).find(o => o.id === 'third').ok, 'leaning to one side closes the third path');
  const r = at('climax'); ok(!E.releaseOptions(r).find(o => o.id === 'trade').ok && E.releaseOptions(r).find(o => o.id === 'free').ok, 'trade needs the hero to have heard Serrien'); M.set(r, 'serrienHeard', 1); ok(E.releaseOptions(r).find(o => o.id === 'trade').ok, 'after hearing him, trade opens') }
// ชะตา Mip ตามตาราง Draft §6
{ const g = at('climax', { ruinStudy: 3 }); ok(E.mipFate(g, 'third', 'free') === 'purified', 'third + knowledge → purified'); ok(E.mipFate(g, 'third', 'wait') === 'sealed', 'collar broke by itself → sealed'); ok(E.mipFate(g, 'shadow', 'trade') === 'sealed' && E.mipFate(g, 'aldren', 'trade') === 'sealed', 'shadow/aldren → sealed');
  ok(E.mipFate(g, 'light', 'trade') === 'purified' && E.mipFate(g, 'light', 'free') === 'sealed', 'light: only with the seal'); M.mip(g).dark = 90; ok(E.mipFate(g, 'third', 'free') === 'sealed', 'too dark → sealed') }
// ทำจริง: 4 ตอนจบ
for (const side of ['third', 'light', 'shadow', 'aldren']) { const g = at('climax', { ruinStudy: 3, lean_light: 1, lean_shadow: 1, lean_village: 2, infectedHelped: 2, serrienHeard: 1 }); g.village.bag = {}; reps.length = 0;
  const res = E.run(g, {}, { release: 'trade', side }); ok(res && res.ending === side && res.pages.length >= 6 && res.pages.every(p => p.text), side + ': scene has pages');
  ok(M.is(g, 'end') && M.flag(g, 'ending') === side && M.flag(g, 'mipFate') === res.fate && M.flag(g, 'afterWorld'), side + ': stage end + flags'); ok(M.war(g) === 0 && M.infection(g, 'deepcairn') === 0, side + ': world calms');
  ok(T.has(g, E.ENDINGS[side].title) && T.has(g, res.fate === 'purified' ? 'mip.purified' : 'mip.sealed'), side + ': chronicle'); ok(reps.length > 0, side + ': factions moved'); ok(M.mip(g).state === res.fate, side + ': Mip state'); ok((g.village.bag.mirrorShard || 0) === (res.fate === 'purified' ? 1 : 0), side + ': keepsake only when purified');
  ok(E.run(g, {}, { release: 'free', side: 'aldren' }) === null && !E.ready(g), side + ': cannot end twice'); ok(T.view(g).rows.some(r => r.got && /end\./.test('') || r.got), side + ': titles view works') }
{ ok(T.view(at('end', { ending: 'third' })) && T.LIST.some(t => t.id === 'lightkeeper' && t.cond(Object.assign(at('climax'), {}))) === false, 'new ending titles exist and are locked by default');
  const g = at('climax', { lean_light: 1 }); E.run(g, {}, { release: 'free', side: 'light' }); ok(T.view(g).rows.some(r => r.id === 'lightkeeper' && r.got), 'light ending unlocks its title') }
// ข้อความ: ไม่มีชื่อโบราณที่ยังไม่ควรโผล่ (Paelasael/Veshra/Wyridean/Zern)
{ const all = JSON.stringify([E.ENDINGS, E.MIP, E.CLASH, E.openingPages(at('climax', { lean_light: 1, lean_shadow: 1 }))]); ok(!/Paelasael|Veshra|Wyridean|Zern-Va|Grat\b/.test(all), 'no ancient names') }
// v98.488 · เรื่องย่อยต่อท้ายตอนจบอ่านธงจริง + ปุ่มหลังจบ + ดันเจี้ยน
{ const g = at('climax', { ruinStudy: 3, listKept: true, convoyFollowed: true, clinicVisits: 1, armorSupplied: true, greed: 1, sigridChoice: 'both', bramChoice: 'help', lightShownRuin: true });
  const ep = E.epilogue(g, 'third'); ok(ep.length >= 5 && ep.length <= 6 && ep.every(p => p.text.length > 20), 'epilogue shows flag-driven pages, capped at 6'); ok(ep.some(p => /โบดิล/.test(p.text)) && ep.some(p => /ไอรีน/.test(p.text)), 'Boudil + Irene lines appear when the player did those threads');
  ok(E.epilogue(at('climax'), 'third').length === 0, 'a player who did none of the threads gets no invented epilogue'); ok(/ถูกคุมตัว|เอกสาร/.test(E.epilogue(g, 'aldren')[0].text), 'same thread, different tone under a different ending');
  const res = E.run(g, {}, { release: 'free', side: 'third' }); ok(res.pages.length >= 8, 'ending pages include the epilogue'); ok(SC.services(g, 'deepcairn').some(s => s.key === 'st:epilogue') && SC.run(g, 'deepcairn', 'st:epilogue', {}, {}).lines.length === 1, 'after the ending: a button that describes the place now'); ok(!SC.services(at('mine'), 'deepcairn').some(s => s.key === 'st:epilogue'), 'not before the ending');
  ok(E.AFTER.deepcairn.third && ['deepcairn', 'thornwatch', 'northgate'].every(t => ['third', 'light', 'shadow', 'aldren'].every(e => E.AFTER[t][e])), 'every ending describes all three places');
  ok(E.DUNGEON.boss.foe === 'hunger' && E.DUNGEON.foes.includes('murk') && E.DUNGEON.kinds.length >= 5 && E.DUNGEON.intro.length >= 2, 'dungeon definition') }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
