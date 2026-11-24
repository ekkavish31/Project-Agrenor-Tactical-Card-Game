/* Rebuild the source-derived location audit after adding scenes, events or services. */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'); global.window = global;
const B = require('../js/dialogue-backdrops.js'); require('../js/story-data.js');
const C = require('../js/crossroads.js'), Cast = require('../js/story-cast.js'), Services = require('../js/town-services.js');
const text = s => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const rows = [], add = (kind, id, map, place, src, source) => rows.push({ kind, id, map, place, src, source });
for (const [id, scene] of Object.entries(STORY_DATA.SCENES)) {
  add('คัตซีน', id, 'fernvale', B.INTRO[id], scene.bg, 'js/story-data.js');
  scene.lines.forEach((line, i) => { if (line.bg) add('เปลี่ยนฉากระหว่างบท', id + ':' + (i + 1), 'fernvale', 'ตามบรรทัด', line.bg, 'js/story-data.js'); });
}
add('ผลประกวดทุกสาขา', 'contest', 'fernvale', 'square', STORY_DATA.contestScene(3).bg, 'js/story-data.js');
for (const e of C.EVENTS) for (const town of e.towns || Object.keys(B.TOWNS).filter(t => t !== 'home')) {
  const shot = B.resolve({ town, event: e.id }); add('ทางแยก', e.id, town, shot?.key, shot?.src, 'js/crossroads.js');
}
for (const [id, spot] of Object.entries(Cast.SPOTS)) for (const town of spot.towns || Object.keys(B.TOWNS).filter(t => t !== 'home')) {
  const shot = B.resolve({ town, service: id }); add('จุดเนื้อเรื่อง', id, town, shot?.key, shot?.src, 'js/story-cast.js');
}
for (const [town, services] of Object.entries(Services.SVC)) for (const s of services) {
  const shot = B.resolve({ town, service: s.key }); add('บริการเมือง', s.key, town, shot?.key, shot?.src, 'js/town-services.js');
}
for (const person of Cast.CAST) { const shot = B.resolve({ town: person.town }); add('ตัวละครประจำเมือง', person.id, person.town, shot?.key, shot?.src, 'js/story-cast.js'); }
for (const row of rows) if (!row.src || !fs.existsSync(path.join(ROOT, row.src))) throw Error('Missing background: ' + JSON.stringify(row));
const report = { version: 'v98.1027', rows, liveMapDialogue: [
  { source: 'js/town-npcs.js + js/village-mind.js', location: 'ตำแหน่ง NPC บน village-town ตามตารางเวลา', mode: 'ใช้แมพจริงด้านหลังกล่องบทพูด' },
  { source: 'js/interior.js + js/village-place.js', location: 'place/farm ที่กำลังเข้าอยู่', mode: 'ใช้ห้อง/แมพย่อยจริง' },
  { source: 'js/party-talk.js', location: 'แมพที่ทีมกำลังเดิน/พัก', mode: 'ใช้แมพจริง' },
  { source: 'js/battle-talk.js + js/town-battle.js', location: 'สนามต่อสู้ที่กำลังเล่น', mode: 'ใช้สนามจริง' }
], conflicts: [
  { id: 'dragonTale', issue: 'ข้อความระบุท่าเรือ แต่เปิดที่ vinehollow/thornwatch ได้ด้วย', handling: 'ยึด host town; ไม่สร้างท่าเรือในเมืองที่ไม่มีหลักฐาน' },
  { id: 'dragonAsh', issue: 'ข้อความระบุไร่องุ่น แต่เปิดที่ haven ได้ด้วย', handling: 'vineyard เฉพาะ vinehollow; haven ใช้ท่าเรือจริง' },
  { id: 'godAnswers', issue: 'ข้อความมองจันทร์เหนือไร่องุ่น แต่เปิดที่ thornwatch ได้ด้วย', handling: 'vineyard ที่ vinehollow / ศาลป่าที่ thornwatch' }
] };
fs.writeFileSync(path.join(ROOT, 'data/dialogue-backdrop-audit.json'), JSON.stringify(report, null, 2) + '\n');
const lines = ['# ตรวจสถานที่และภาพฉากหลังบทสนทนา · v98.1027', '',
  'ตรวจจาก scene/event/service ID ใน source จริง ภาพใหม่เป็นงานฉาก ไม่แก้บทพูด เควส ตารางเวลา หรือ canon.',
  'คัตซีนคุย NPC ผ่าน Story.sceneAt ใช้สถานที่ NPC อยู่จริง ณ เวลานั้น แทนค่าเริ่มต้นในตารางนี้; การเปลี่ยน bg รายบรรทัดยังคงเดิม.', '',
  '| ประเภท | ID | แมพ | สถานที่/ฉาก | ภาพ | แหล่งข้อมูล |', '|---|---|---|---|---|---|',
  ...rows.map(r => '| ' + [r.kind, r.id, r.map, r.place, r.src, r.source].map(text).join(' | ') + ' |'), '',
  '## บทพูดบนแมพจริง', '', ...report.liveMapDialogue.map(r => '- `' + r.source + '` — ' + r.location + ': ' + r.mode), '',
  '## ข้อขัดกันในข้อมูลเดิม', '', ...report.conflicts.map(r => '- `' + r.id + '`: ' + r.issue + ' → ' + r.handling), '',
  '## ขอบเขต', '', 'ครอบคลุมบทที่ถูกเรียกใช้โดย Cutscene, world-map modal, Crossroads, StoryCast และ TownServices; บทสุ่ม/บทตอบกลับรับสถานที่จากเจ้าของหน้าต่างเดียวกันทุกประโยค ไม่เดาจากชื่อผู้พูด.',
  'ภาพของ New Game intro เดิมคงอยู่ ตารางนี้แยกจาก prologue slides ของ title-screen. ฉากจบใช้ปากเหมือง/ห้องชั้นล่าง; เรื่องเล่าที่พาดพิงสถานที่ไกลยังใช้สถานที่ที่ผู้เล่ากำลังอยู่.', ''];
fs.writeFileSync(path.join(ROOT, 'docs/DIALOGUE-BACKDROPS-TH.md'), lines.join('\n'));
console.log('Dialogue location audit: ' + rows.length + ' source-derived rows; every image exists');
