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
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
