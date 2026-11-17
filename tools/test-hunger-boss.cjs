/* v98.489 · node tools/test-hunger-boss.cjs — ท่าพิเศษของก้อนหิว (js/flat-battle.js bossTurn): กลืนกิน · หนวดกวาด · เสียงเรียกหิว + ตรวจว่าไม่ทำสนามรบเดิมพัง */
const path = require('path'); global.window = global;
const B = require(path.join(__dirname, '..', 'js', 'flat-battle.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const mk = (extra = []) => B.create({ bounds: { u0: 0, v0: 0, u1: 10, v1: 9 }, kindAt: () => 'normal', hero: { u: 4, v: 4, hp: 400, maxHp: 400 },
  monsters: [{ u: 6, v: 4, name: 'ก้อนหิว', kind: 'hunger', boss: true, hp: 300, maxHp: 300, atk: 14, move: 2, range: 3, el: 'dark', iq: 2 }, ...extra] });
const run = (st, n) => { for (let i = 0; i < n && !st.outcome; i++) { B.endTurn(st); B.monsterTurn(st) } };
// ท่า 1 · กลืนกิน (ครั้งแรกที่ bossT เป็น 3) — ต้องดูดเลือดกลับ + ประกาศก่อน
{ const st = mk(), boss = B.monster(st); boss.hp = 200; run(st, 3); const log = st.log.join('\n');
  ok(/กำลังรวบรวมพลัง/.test(log), 'the special is announced the turn before'); ok(/กลืนกิน/.test(log) && /ดูดกลืนพลังชีวิต/.test(log), 'devour: used and feeds on the victim'); ok(boss.hp > 200 - 40, 'the boss healed from the bite (hp ' + boss.hp + ')') }
// ท่า 2 · หนวดกวาด (bossT 6) ตีทุกคนในระยะ 2 + พิษ
{ const st = B.create({ bounds: { u0: 0, v0: 0, u1: 10, v1: 9 }, kindAt: () => 'normal', hero: { u: 5, v: 4, hp: 900, maxHp: 900 }, allies: [{ u: 5, v: 5, key: 'kier', name: 'เคียร์', hp: 400, maxHp: 400, atk: 10, move: 3, range: 1, order: 'hold' }],
    monsters: [{ u: 6, v: 4, name: 'ก้อนหิว', kind: 'hunger', boss: true, hp: 800, maxHp: 800, atk: 14, move: 2, range: 3, el: 'dark', iq: 2 }] }); run(st, 6); const log = st.log.join('\n');
  ok(/หนวดกวาด/.test(log), 'sweep is used on the second special'); const m = /หนวดกวาด \(([^)]*)\)/.exec(log); ok(m && m[1].length > 0, 'sweep hits whoever is within reach: ' + (m && m[1])) }
// ท่า 3 · เสียงเรียกหิว: สัตว์รอยหมองที่ล้มแล้วลุกขึ้นที่ครึ่งเลือด
{ const st = mk([{ u: 7, v: 5, name: 'สัตว์รอยหมอง 1', kind: 'murk', hp: 40, maxHp: 40, atk: 9, move: 4, el: 'dark', iq: 1 }]), mu = B.monsters(st).find(m => m.kind === 'murk'); mu.hp = 0;
  run(st, 9); const log = st.log.join('\n'); ok(/เสียงเรียกหิว/.test(log) && mu.hp > 0 && mu.hp <= 20 && mu.revived === 1, 'call of hunger: the fallen murk rises at half health (hp ' + mu.hp + ')') }
// ไม่มีตัวให้ฟื้น → กลืนกินแทน (ไม่ท่าว่าง)
{ const st = mk(); run(st, 9); const log = st.log.join('\n'); ok(!/เสียงเรียกหิว/.test(log) && (log.match(/กลืนกิน|หนวดกวาด/g) || []).length >= 2, 'no fallen one: it devours/sweeps instead of wasting the turn') }
// ท่าเดิมของบอสอื่นไม่เปลี่ยน
{ const st = B.create({ bounds: { u0: 0, v0: 0, u1: 10, v1: 9 }, kindAt: () => 'normal', hero: { u: 4, v: 4, hp: 900, maxHp: 900 }, monsters: [{ u: 6, v: 4, name: 'โกเล็ม', kind: 'golem', boss: true, hp: 600, maxHp: 600, atk: 15, move: 2, el: 'earth', iq: 0 }] }); run(st, 4); ok(/ทุบพื้น|กำลังรวบรวมพลัง/.test(st.log.join('\n')), 'other bosses keep their own specials') }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);
