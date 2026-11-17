// v98.366 · ใช้ตอนจบงานบนคอม: ส่งทุกอย่างที่แก้ขึ้น GitHub  →  node tools/work-end.cjs ["ข้อความ"]
const { spawnSync } = require('node:child_process'), path = require('node:path'), os = require('node:os');
const cwd = path.join(__dirname, '..'), git = (...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
if (git('--version').error) { console.log('ไม่พบ Git — ติดตั้งจาก git-scm.com ก่อน'); process.exit(1) }
const msg = process.argv.slice(2).join(' ') || 'งานจากเครื่อง ' + os.hostname() + ' · ' + new Date().toLocaleString('th-TH');
git('add', '-A'); const st = git('status', '--porcelain').stdout.trim();
if (st) { const c = git('commit', '-m', msg); if (c.status) { console.log(c.stdout + c.stderr); process.exit(1) } console.log('บันทึกแล้ว ' + st.split('\n').length + ' ไฟล์') } else console.log('ไม่มีไฟล์ใหม่ให้บันทึก');
const p = git('pull', '--rebase'); if (p.status) { console.log((p.stdout + p.stderr).trim() + '\n✗ มีงานชนกันกับอีกเครื่อง/ผู้ช่วย — ยังไม่ส่งขึ้น ให้ส่งข้อความด้านบนให้ผู้ช่วยดู (ห้ามลบอะไรเอง)'); process.exit(1) }
const u = git('push'); console.log((u.stdout + u.stderr).trim()); if (u.status) { console.log('✗ ส่งขึ้นไม่สำเร็จ'); process.exit(1) }
console.log('✓ ส่งขึ้น GitHub แล้ว');
