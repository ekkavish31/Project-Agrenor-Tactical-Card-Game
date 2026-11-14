/* v98.491 · node tools/sim-life.cjs [seed] [--write] — จำลอง "ชีวิตหนึ่งคน" ในโลกของเกม (แนว 1 in 8 billion: สุ่มคนธรรมดาหนึ่งคนแล้วดูว่าชีวิตเขาเดินผ่านเส้นเรื่องอย่างไร)
   ใช้โค้ดจริงของเกม (MainStory · Crossroads · StoryCast · StoryWorld · Endings · Progression · Factions · Titles) — ไม่ได้เขียนเรื่องใหม่ ผลคือสิ่งที่ระบบ "จะเกิดจริง" กับคนคนนี้
   ส่วนที่เป็นการสมมติ (ไม่ใช่โค้ดเกม): นิสัยของตัวละครตัดสินทางเลือก · EXP ต่อวัน · โอกาสเจอ ❖ · ผลสู้ดันเจี้ยน (อิงตาราง tools/simulate-hunger.cjs)
   --write = เขียนรายงานลง docs/sim/SIM-RUN-<seed>-TH.md */
const path = require('path'), fs = require('fs'), vm = require('vm'); global.window = global; const J = f => path.join(__dirname, '..', 'js', f);
const seedArg = +(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 7), WRITE = process.argv.includes('--write');
let s0 = (seedArg * 2654435761) >>> 0; const rnd = () => { s0 = (s0 + 0x6D2B79F5) >>> 0; let t = Math.imul(s0 ^ (s0 >>> 15), 1 | s0); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
const pick = a => a[Math.floor(rnd() * a.length)], clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const T = require(J('titles.js')), M = require(J('main-story.js')), P = require(J('progression.js')); global.Titles = T; global.MainStory = M;
{ const w = {}; w.window = w; vm.createContext(w); vm.runInContext(fs.readFileSync(J('adventure-data.js'), 'utf8'), w); global.ADVENTURE_DATA = w.ADVENTURE_DATA }
const g = { day: 1, hp: 60, fatigue: 0, inventory: [], village: { coins: 0, bag: {}, character: { level: 1, xp: 0, points: 0, stats: {} }, story: { mode: 'done' } } };
global.WorldState = { game: () => g, world: () => null };
let F = null; try { F = require(J('factions.js')) } catch (e) { }
const repLog = []; if (!F || !F.add) { global.Factions = { add: (id, n, why) => repLog.push([id, n, why]), priceMult: () => 1 } } else { global.Factions = F }
const ST = require(J('settlements.js')); global.Crossroads = require(J('crossroads.js')); global.StoryWorld = require(J('story-world.js')); const E = global.Endings = require(J('endings.js')); const SC = require(J('story-cast.js'));
const C = global.Crossroads;

/* ---------- ตัวละคร: สุ่มหนึ่งคนจากชาวเฟิร์นเวล ---------- */
const NAMES = ['ลินดา', 'โทมัส', 'ไอริส', 'เรย์', 'มารี', 'คาลัม', 'เนล', 'ซารา', 'อัลฟี่', 'พิม', 'กานต์', 'วีร์'], BACK = [['ลูกสาวช่างไม้', { heart: .1, curious: .1 }], ['ลูกชายชาวนา', { heart: .15, crown: .05 }], ['เด็กส่งของของโรงเตี๊ยม', { greed: .1, bold: .1 }], ['ลูกศิษย์หมอยา', { heart: .2, curious: .15 }], ['เด็กเลี้ยงแกะ', { bold: .1, faith: .1 }], ['ลูกมือช่างตี', { greed: .1, crown: .1 }]];
const [back, bonus] = pick(BACK), traits = { heart: rnd(), crown: rnd(), faith: rnd(), curious: rnd(), greed: rnd(), bold: rnd() };
for (const [k, v] of Object.entries(bonus)) traits[k] = clamp(traits[k] + v, 0, 1);
const persona = { name: pick(NAMES), age: 16 + Math.floor(rnd() * 8), back, traits, luck: rnd() };
const tv = k => k === 'light' ? (traits.heart * .5 + traits.curious * .7 + traits.faith * .3) / 1.5 : k === 'shadow' ? (traits.bold * .6 + traits.greed * .7 + traits.curious * .3) / 1.6 : traits[k] || 0;
const TAGS = { fugitive: [{ heart: 1, bold: .5 }, { crown: 1 }, { light: 1, curious: .5, heart: .5 }], callup: [{ crown: 1 }, { heart: 1 }, { heart: .5, bold: 1 }], firstSick: [{ heart: .3 }, { heart: 1, curious: .3 }, { crown: 1 }],
  mayaBroker: [{ greed: 1 }, { heart: 1, faith: .3 }, { greed: .7, shadow: 1, bold: .5 }], corvinInvite: [{ bold: 1, heart: .5 }, { curious: .5, greed: .3, bold: .3 }, { crown: 1, greed: .4 }], convoy: [{ crown: .3 }, { bold: 1, curious: .7, heart: .5 }, { crown: 1 }],
  moonRite: [{ faith: 1, curious: .5 }, { heart: 1 }, { curious: 1, bold: .5 }], scent: [{ shadow: 1, curious: .5, greed: .3 }, { heart: 1 }, { bold: .5 }], armor: [{ crown: 1, greed: .8 }, { light: 1, heart: .4 }, { heart: .8, faith: .3 }],
  sickRefugee: [{ heart: 1 }, { crown: .6 }, { greed: .5 }], languageLeaf: [{ crown: 1, greed: .5 }, { light: 1, heart: .5 }, { curious: .7, bold: .2 }], gouge: [{ greed: 1 }, { heart: 1 }, { bold: .8, heart: .5 }],
  boudilList: [{ heart: 1 }, { heart: .6, crown: .2 }, { crown: .5 }], lightPass: [{ light: 1, heart: .4 }, { crown: 1 }, { curious: 1, light: .5 }], sigrid: [{ heart: .4 }, { heart: 1, curious: .3 }, { bold: .7, heart: .5 }],
  bram: [{ heart: 1, bold: .5 }, { crown: .7 }, { crown: .4, heart: .4 }], kier: [{ heart: .6 }, { heart: 1 }, { curious: 1 }], luna: [{ crown: .7, greed: .3 }, { faith: .3, curious: .5 }, { light: 1, curious: .5 }] };
const score = (w, noise = .35) => Object.entries(w).reduce((a, [k, v]) => a + v * tv(k), 0) + (rnd() - .5) * noise;

/* ---------- บันทึกเหตุการณ์ ---------- */
const out = [], say = (t, lvl = 0) => out.push((lvl ? '  '.repeat(lvl) : '') + t);
const place = { fernvale: 'เฟิร์นเวล', lakenhold: 'นครหลวงลาเคนฮอลด์', willowshore: 'วิลโลว์ชอร์', deepcairn: 'ดีปแคร์น', northgate: 'ด่านหินเหนือ', thornwatch: 'ธอร์นวอตช์', vinehollow: 'ไวน์ฮอลโลว์', brookmere: 'บรู๊คเมียร์', haven: 'ซอลต์เฮเวน' };
const TOWNS = ['northgate', 'lakenhold', 'willowshore', 'deepcairn', 'thornwatch', 'haven', 'vinehollow', 'brookmere'];
const S = { gold: 70, party: [], bench: [], cargo: {}, svc: {}, hp: 60 }; let lastStage = M.stage(g).id, seenChron = 0, seenPlace = {}, visits = 0, fights = 0, mayaHeld = 0;
const stageName = () => M.stage(g).name;
function chronNews() { const ch = T.chronicle(g); for (const c of ch.slice(seenChron)) say('📖 บันทึก: ' + c.text, 1); seenChron = ch.length }
function stageWatch() { const id = M.stage(g).id; if (id !== lastStage) { say(`\n### 🧭 หมุดเรื่องเปลี่ยน → **${stageName()}** (วันที่ ${g.day} · เลเวล ${g.village.character.level} · สงคราม ${M.war(g)}/4)`); lastStage = id } chronNews() }
const lvl = () => g.village.character.level;

say(`# บันทึกชีวิตจำลอง #${seedArg} — ${persona.name} (${persona.age} ปี · ${persona.back} แห่งเฟิร์นเวล)`);
say(`> จำลองด้วยโค้ดจริงของเกม v98.491 (หมุดเรื่อง · ทางแยก · NPC · ราคา · ตอนจบ) — นิสัยตัดสินทางเลือก/EXP รายวัน/โอกาสเจอ ❖/ผลสู้ดันเจี้ยน เป็นการสมมติ ไม่ใช่การเล่นจริง\n`);
say(`**นิสัย** (0–1): ใจอ่อนต่อผู้คน ${traits.heart.toFixed(2)} · ภักดีราชสำนัก ${traits.crown.toFixed(2)} · ศรัทธา ${traits.faith.toFixed(2)} · อยากรู้ ${traits.curious.toFixed(2)} · โลภ ${traits.greed.toFixed(2)} · กล้าเสี่ยง ${traits.bold.toFixed(2)} · โชค ${persona.luck.toFixed(2)}\n`);
say('## ช่วงที่ 1 — หลังบทนำ: ชีวิตธรรมดาที่เฟิร์นเวล');
M.check(g); stageWatch();

const fedForms = [];
function dailyLife() {
  /* ต่อสู้/ทำงานรายวัน → EXP */ const xp = Math.round(38 + rnd() * 50 + traits.bold * 25 + (lvl() < 6 ? 12 : 0)), ups = P.gainHero(g, xp); fights++;
  if (ups.length) { say(`⬆ วันที่ ${g.day}: เลเวล ${ups[ups.length - 1]}`, 1) }
  { const c = g.village.character; c.stats ||= {}; const W = { strength: .3 + traits.bold, endurance: .3 + traits.heart * .5, precision: .3 + traits.crown * .2 + traits.greed * .3, knowledge: .3 + traits.curious + traits.faith * .3 }, tot = Object.values(W).reduce((a, b) => a + b, 0);   /* v98.491 · ใช้แต้มสเตตัสตามนิสัย (ทางเลือกทอยสเตตัสจะได้ต่างกันตามคน) */
    while (c.points >= 1) { let r = rnd() * tot, k = 'strength'; for (const [kk, w] of Object.entries(W)) { r -= w; if (r <= 0) { k = kk; break } } c.stats[k] = (c.stats[k] || 0) + 1; c.points-- } }
  S.gold += Math.round(8 + rnd() * 18); g.day++;
  /* ชิ้นส่วน ❖ */ if (lvl() >= 3 && rnd() < .13 + persona.luck * .05) { const ids = Object.values(ADVENTURE_DATA.MAYA_OF).filter(k => !/Hunger/.test(k)), id = pick(ids); g.village.bag[id] = (g.village.bag[id] || 0) + 1; mayaHeld++; say(`✦ วันที่ ${g.day}: เจอ ${ADVENTURE_DATA.GOODS[id].name} ตอนล่า`, 1) }
  /* สหายร่วมทีม */ for (const [k, lv] of [['kier', 3], ['bram', 5], ['luna', 7], ['sigrid', 9]]) if (lvl() >= lv && !S.party.some(p => p.key === k) && S.party.length < 3 && rnd() < .25) { S.party.push({ key: k }); say(`🤝 วันที่ ${g.day}: ${({ kier: 'เคียร์', bram: 'บรัม', luna: 'ลูน่า', sigrid: 'ซิกริด' })[k]} ร่วมทีม`, 1) }
  /* ป้อน Mip */ if (g.village.main?.flags?.mipJoined && Object.keys(g.village.bag).some(k => /^maya/.test(k)) && rnd() < .2 + traits.curious * .25 - traits.greed * .15) { const id = Object.keys(g.village.bag).find(k => /^maya/.test(k)), r = M.feed(g, id); if (r) { fedForms.push(r.kind); say(`🍖 วันที่ ${g.day}: ป้อน Mip (${r.kind}) — ${r.fresh ? 'จำร่างใหม่' : 'ร่างเดิม'} · Mip ดำ ${r.dark}/100`, 1) } }
  else if (Object.keys(g.village.bag).some(k => /^maya/.test(k)) && traits.greed > .6 && rnd() < .15) { const id = Object.keys(g.village.bag).find(k => /^maya/.test(k)); g.village.bag[id]--; if (!g.village.bag[id]) delete g.village.bag[id]; const p = Math.round((ADVENTURE_DATA.GOODS[id].price || 60) * .65); S.gold += p; say(`💰 วันที่ ${g.day}: ขาย ${ADVENTURE_DATA.GOODS[id].name} ได้ ${p} เหรียญ`, 1) }
  M.check(g); stageWatch();
}
function spotChoice(town) {
  const sv = SC.services(g, town).filter(s => !s.key.endsWith('finale')); const done = [];
  for (const s of sv) { const k = s.key.replace('st:', ''), w = { news: .35, camp: traits.heart, ruin: traits.curious, pit: traits.bold, faith: traits.faith * .8 + traits.curious * .3, clinic: traits.heart * .7, army: traits.crown * .6 + traits.greed * .5, epilogue: .6 }[k] ?? .3;
    if (done.length >= 2 || rnd() > w * .75 || (s.cost && S.gold < s.cost)) continue; if (k === 'army') { S.cargo = { iron: 2 + Math.floor(rnd() * 3), ore: 1 + Math.floor(rnd() * 2) } }
    if (s.cost) S.gold -= s.cost; const r = SC.run(g, town, s.key, S, { passTime() { }, healParty() { } }); done.push(k); say(`${s.label}`, 1); for (const l of r.lines.slice(0, 4)) say('› ' + l, 2) }
}
function talk(town) {
  const L = SC.locals(g, town, ST.LOCALS[town] || []); if (!L.length) return; const sp = L.filter(x => x[2].length), withR = sp.filter(x => SC.reactFor(g, x[0], x[3]).length); const x = (withR.length && rnd() < .8) ? pick(withR) : pick(sp); const r = SC.reactFor(g, x[0], x[3]), line = r.length ? pick(r) : pick(x[2]);
  say(`👤 ${x[0]} (${x[1]}): “${line.replace('{name}', persona.name)}”${r.length ? ' ← พูดถึงสิ่งที่เจ้าตัวทำมา' : ''}`, 1);
}
function visit(town) {
  visits++; say(`\n**วันที่ ${g.day} · ${place[town]}** (เลเวล ${lvl()}${S.party.length ? ' · ทีม: ' + S.party.map(p => p.key).join(', ') : ''})`);
  for (const m of SC.arrive(g, town)) say('👁 ' + m, 1); M.check(g); stageWatch();
  for (const n of (C.expire(g, S) || [])) say('📰 ' + n, 1);
  spotChoice(town); if (!seenPlace[town] || rnd() < .55) talk(town); seenPlace[town] = 1;
  const px = StoryWorld.describe(g, town, 2); if (px.length && rnd() < .5) say('🏷 ' + px.join(' · '), 1);
  const e = C.pick(g, S, town);
  if (e) {
    const bias = i => { const m = e.choices[i].mech; if (!m) return 0; if (m.fight) return (traits.bold - .45) * .9; if (m.check) return (C.chanceOf(g, S, m.check) - 55) / 120; return 0 };
    const opts = e.choices.map((c, i) => ({ i, sc: score(TAGS[e.id][i]) + bias(i), blocked: !!C.why(g, S, e, i) })).sort((a, b) => (a.blocked - b.blocked) || (b.sc - a.sc)), ch = opts[0];
    say(`⑂ **${e.icon} ${e.title}** — ${e.text.slice(0, 120)}…`, 1); for (const [oi, o] of e.choices.entries()) say(`${oi === ch.i ? '👉 ' : '・'}${o.label}${C.hint(g, S, e, oi) ? '  〔' + C.hint(g, S, e, oi) + '〕' : ''}${C.why(g, S, e, oi) ? '  🔒 ' + C.why(g, S, e, oi) : ''}`, 2);
    const r = C.resolve(g, S, e, ch.i, { passTime() { }, rng: rnd, battle: sp => { const need = 3 + sp.dang * 9 + sp.n * .8, p = clamp(.55 + (lvl() - need) * .08 + S.party.length * .05, .15, .95), o = rnd() < p ? 'win' : (rnd() < .3 ? 'flee' : 'lose'); say(`⚔ ต่อสู้จริง: ${sp.foe} ×${sp.n} (${sp.obj || 'สู้จนจบ'}) · โอกาสชนะประมาณ ${Math.round(p * 100)}% → **${({ win: 'ชนะ', lose: 'แพ้', flee: 'หนี' })[o]}**`, 2); return o } }); for (const l of r.lines) say('→ ' + l, 2); say(`(เลือกจาก: ${Object.keys(TAGS[e.id][ch.i]).join('+')})`, 2);
  }
  g.day += 1; M.check(g); stageWatch();
}
/* ---------- วงชีวิต ---------- */
let guard = 0, finaleDone = false, tries = 0;
while (guard++ < 700 && !finaleDone) {
  dailyLife();
  if (g.day % 2 === 0 || E.ready(g)) {
    if (E.ready(g)) { /* ไปดีปแคร์น แล้วทำฉากจบ */
      say(`\n## ช่วงสุดท้าย — ⚑ ปากเหมืองชั้นล่างที่ดีปแคร์น (วันที่ ${g.day} · เลเวล ${lvl()})`); visit('deepcairn');
      for (const p of E.openingPages(g)) say(`> ${p.who ? '[' + p.who + '] ' : ''}${p.text}`, 1);
      const ro = E.releaseOptions(g).filter(o => o.ok), rsc = ro.map(o => ({ o, sc: ({ free: tv('light') + tv('heart') * .5, trade: tv('curious') + tv('faith') * .6, wait: tv('greed') + (1 - tv('heart')) * .3 })[o.id] + (rnd() - .5) * .3 })).sort((a, b) => b.sc - a.sc), rel = rsc[0].o;
      say(`⑂ **ปลอกคอของเซอร์เรียน** — ตัวเลือกที่เปิด: ${ro.map(o => o.label).join(' / ')} → 👉 **${rel.label}**`, 1); for (const p of E.releasePages(g, rel.id)) say(`> ${p.text}`, 2);
      M.set(g, 'finaleRelease', rel.id);
      say(`⛏ **ดันเจี้ยนเหมืองชั้นล่าง** (${E.DUNGEON.foes.join(' · ')} → ก้อนหิว)`, 1);
      for (; ;) { tries++; const pw = clamp(.65 + (lvl() - 12) * .11 - (tries > 1 ? 0 : 0), .15, .95); const win = rnd() < pw; say(`⚔ ลองที่ ${tries}: โอกาสชนะ ~${Math.round(pw * 100)}% (เลเวล ${lvl()}${S.party.length ? ' + สหาย ' + S.party.length : ''}) → ${win ? '**ชนะ** — ก้อนหิวล้ม (ไม่ตาย)' : 'แพ้ ถอยออกมาพัก 1 วันแล้วกลับลงใหม่'}`, 2); g.day += win ? 0 : 1; if (win || tries >= 5) { if (!win) { P.gainHero(g, 120); } break } }
      for (const p of E.CLASH) say(`> ${p.text}`, 2);
      const so = E.sideOptions(g), L = C.leans(g); say(`⑂ **จุดตัดสินใจสุดท้าย** — แนวโน้มที่สะสมมา: แสง ${L.light} · เงา ${L.shadow} · ราชสำนัก ${L.crown} · เหนือ ${L.north} · หมู่บ้าน ${L.village}`, 1);
      for (const o of so) say(`${o.ok ? '✅' : '🔒'} ${o.label}${o.ok ? '' : ' — ' + o.why}`, 2);
      const sideSc = so.filter(o => o.ok).map(o => ({ o, sc: ({ third: tv('heart') + tv('curious') * .5 + .35, light: tv('light') + .1, shadow: tv('shadow') + .1, aldren: tv('crown') + tv('greed') * .3 })[o.id] + (rnd() - .5) * .3 })).sort((a, b) => b.sc - a.sc), side = sideSc[0].o;
      say(`→ 👉 **${side.label}**`, 1);
      const res = E.run(g, S, { release: rel.id, side: side.id });
      say(`\n## 🏁 ตอนจบ: ${res.name} (โทน: ${res.tone}) · Mip: ${res.fate === 'purified' ? 'ถูกชำระ กลับป่า (ได้ผลึกสะท้อน)' : 'ถูกผนึกให้หลับ'}`);
      for (const p of res.pages) say(`> ${p.who ? '**' + p.who + '**: ' : ''}${p.text}`, 1);
      stageWatch(); finaleDone = true; break;
    }
    const pend = TOWNS.filter(t => C.pick(g, S, t)); visit(pend.length && rnd() < .55 + traits.curious * .3 ? pick(pend) : pick(TOWNS));
  }
}
/* ---------- หลังจบ ---------- */
if (finaleDone) { say('\n## หลังจบเรื่อง — โลกที่เปลี่ยนไป'); for (const t of ['deepcairn', 'thornwatch', 'northgate', 'lakenhold', 'haven']) { g.day += 2; const ch = T.chronicle(g).length; say(`**วันที่ ${g.day} · ${place[t]}**`); for (const s of SC.services(g, t).filter(x => /epilogue|news/.test(x.key))) { const r = SC.run(g, t, s.key, S, { passTime() { } }); say(s.label, 1); for (const l of r.lines.slice(0, 3)) say('› ' + l, 2) } talk(t); seenChron = ch } }
say('\n---\n## สรุปชีวิตนี้');
const fl = g.village.main.flags, mp = M.mip(g), rows = T.view(g).rows.filter(r => r.got);
say(`- ใช้เวลา **${g.day} วัน** · เลเวลสุดท้าย ${lvl()} · เงินเหลือ ${S.gold} 💰 · ไปเยือน ${visits} ครั้ง · ทีมร่วม: ${S.party.map(p => p.key).join(', ') || 'ไม่มี'}`);
say(`- Mip: ${mp.state} · ดำ ${mp.dark}/100 · ร่างที่จำได้ ${[...new Set(fedForms)].join(', ') || '—'}`);
say(`- แนวโน้ม: ${JSON.stringify(C.leans(g))}`);
say(`- ทางแยกที่ตัดสิน: ${Object.entries(fl).filter(([k]) => k.startsWith('cr_')).map(([k, v]) => k.slice(3) + '=' + v).join(' · ')}`);
say(`- ฉายา ${rows.length} ใบ: ${rows.map(r => r.name || r.id).join(' · ') || '—'}`);
say(`- Chronicle ${T.chronicle(g).length} บรรทัด`);
const txt = out.join('\n'); console.log(txt);
if (WRITE) { fs.mkdirSync(path.join(__dirname, '..', 'docs', 'sim'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '..', 'docs', 'sim', `SIM-RUN-${seedArg}-TH.md`), txt + '\n') }
