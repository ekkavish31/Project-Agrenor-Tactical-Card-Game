/* v98.479 · node tools/test-story-map.cjs — แผนผังเส้นเรื่อง (js/story-map-data.js): id ไม่ซ้ำ · เส้นเชื่อมชี้ถูก · หมุดตรงกับ MainStory.STAGES · จุดตัดสินใจมีอย่างน้อย 2 กิ่งที่มีป้าย · ตอนจบมี 4 */
const path = require('path'); global.window = global;
require(path.join(__dirname, '..', 'js', 'crossroads.js')); const CP = require(path.join(__dirname, '..', 'js', 'code-portraits.js')); const D = require(path.join(__dirname, '..', 'js', 'story-map-data.js')), M = require(path.join(__dirname, '..', 'js', 'main-story.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const all = []; (function w(n) { all.push(n); n.c.forEach(w) })(D.TREE);
const ids = new Set(all.map(n => n.id)); ok(ids.size === all.length, 'ids unique');
ok(all.every(n => ['ok', 'wip', 'todo', 'wait'].includes(n.s)), 'valid status'); ok(all.every(n => ['root', 'line', 'event', 'choice', 'outcome', 'end', 'sys', 'open'].includes(n.k)), 'valid kind');
ok(all.every(n => n.sp >= 0 && n.sp <= 3), 'spoiler 0-3'); ok(all.every(n => n.t && n.t.length < 70), 'titles present and short');
ok(D.LINKS.every(l => ids.has(l[0]) && ids.has(l[1])), 'links point at real nodes');
ok(D.STAGES.map(s => s.id).join() === M.STAGES.map(s => s.id).join(), 'stages match MainStory.STAGES: ' + D.STAGES.map(s => s.id) + ' vs ' + M.STAGES.map(s => s.id));
ok(all.every(n => !n.g || D.STAGES.some(s => s.id === n.g)), 'node stage ids exist');
ok(all.filter(n => n.k === 'choice').every(n => n.c.length >= 2 && n.c.every(k => k.lab)) || console.log(all.filter(n => n.k === 'choice' && !(n.c.length >= 2 && n.c.every(k => k.lab))).map(n => n.id)), 'every decision branches ≥2 labelled ways');
ok(all.filter(n => n.k === 'end').length === 4, 'four endings (Canon §6)');
ok(all.filter(n => n.k === 'open').every(n => n.s === 'wait'), 'open questions are marked waiting for the owner');
ok(!all.some(n => /Paelasael|Veshra|Wyridean|Zern-Va/.test(n.t)), 'no ancient names in titles');
ok(M.STAGES.every(s => all.some(n => n.g === s.id)), 'every story stage has at least one node');
// ตัวละครที่เกี่ยวข้อง (v98.480): กล่องที่อ้างถึงมีจริง · ตัวละครอยู่ใน CAST · ที่มาเป็น doc/idea/gone · gone ตรงกับ CAST.gone · NPC ในเกมมีรูปจริง
{ const fs = require('fs'), W = D.WHO, C = D.CAST;
  ok(Object.keys(W).every(k => ids.has(k)), 'WHO nodes exist'); ok(Object.values(W).every(l => l.every(([c, why, src]) => C[c] && why && ['doc', 'idea', 'gone'].includes(src))), 'WHO entries valid');
  ok(Object.values(W).every(l => l.every(([c, , src]) => src !== 'gone' || !!C[c].gone)), 'gone source only for characters without art');
  ok(Object.values(C).every(c => c.gone || c.code || (c.src && fs.existsSync(path.join(__dirname, '..', c.src.split('?')[0])))), 'every in-game character has a real picture file');
  ok(Object.values(C).every(c => c.n && c.r), 'name and role'); ok(Object.keys(C).every(k => Object.values(W).some(l => l.some(x => x[0] === k))), 'no unused characters') }
ok(Object.values(D.CAST).every(c => !c.code || CP.has(c.code)), 'code portraits exist for every code character'); ok(all.filter(n => n.id.startsWith('cr_') && n.k === 'choice').length >= 15, 'implemented crossroads appear as decision nodes');
// แผนที่โลก: ทุกเมืองมีตำแหน่ง/ชื่อ · โหนดอ้างเมืองที่มีจริง · อีเวนต์ Crossroads ผูกเมืองครบ
{ const P = D.POS, L = D.PLACE; ok(Object.keys(L).every(k => P[k] && P[k].length === 2 && P[k][0] > 0 && P[k][0] < 100 && P[k][1] > 0 && P[k][1] < 100), 'every town has a position on the map'); ok(Object.values(D.PLACES).every(a => a.every(x => L[x])), 'nodes point at known towns');
  ok(Object.keys(D.PLACES).every(k => ids.has(k)), 'place nodes exist'); const XR = require(path.join(__dirname, '..', 'js', 'crossroads.js')); ok(XR.EVENTS.every(e => D.PLACES['cr_' + e.id] && D.PLACES['cr_' + e.id].length), 'every crossroad has places'); ok(XR.EVENTS.every(e => !e.towns || e.towns.every(x => L[x])), 'crossroad towns are on the map') }
// v98.505 แผนที่โลก = ภาพของผู้เขียน 2 ชั้น: ที่ตั้งจากช่อง hex จริง · โหนดเทามีที่มา · ตัวยึดมีป้าย · โซน/ถนนอ้างถึงของจริง
{ const SW = require(path.join(__dirname, '..', 'js', 'story-map-world.js')), L = D.PLACE, fs2 = require('fs');
  ok(Object.keys(L).every(k => SW.WPOS[k]) && Object.keys(SW.WPOS).every(k => L[k]), 'every clickable town has a world position');
  ok(Object.entries(SW.WPOS).every(([k, p]) => p[0] > 0 && p[0] < SW.W && p[1] > 0 && p[1] < SW.H), 'positions are inside the picture');
  ok(Object.entries(SW.MARK).every(([k, m]) => SW.isLandHex(m[0], m[1]) || k === 'haven'), 'every place mark is on a land hex (haven may sit on the coast)');
  ok(fs2.existsSync(path.join(__dirname, '..', SW.IMG)) && fs2.existsSync(path.join(__dirname, '..', SW.CLOSE.src)), 'both map pictures exist');
  ok(Object.keys(SW.WPOS).filter(k => SW.inRect(SW.WPOS[k][0], SW.WPOS[k][1])).length >= 9, 'most towns lie inside the close-up picture');
  const ids = SW.GREY.map(g => g.id); ok(new Set(ids).size === ids.length && ids.every(i => !L[i]), 'grey node ids are unique and never clash with clickable towns');
  ok(SW.GREY.every(g => g.src && g.r && g.n && Number.isFinite(g.x) && g.x >= 0 && g.x <= SW.W && g.y >= 0 && g.y <= SW.H), 'every grey node has a source, a description and a position on the picture');
  ok(SW.GREY.every(g => !g.placeholder || /ยังไม่ตั้งชื่อ|ตัวยึด/.test(g.n + g.src)), 'placeholders are labelled as not canon');
  ok(SW.GREY.every(g => !g.zone || SW.ZONES[g.zone]), 'grey nodes point to real zones');
  ok(['aldren', 'frostmere', 'south', 'westIsles'].every(z => SW.ZONES[z]) && Object.values(SW.ZONES).every(z => z.pts.length >= 3 && z.c && z.n), 'kingdom zones: Aldren, Frostmere, south and island placeholders exist');
  ok(SW.ROADS.every(([a, b]) => L[a] && L[b]) && JSON.stringify(SW.ROADS) === JSON.stringify(D.ROADS), 'roads reference real towns and match the data file'); }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
