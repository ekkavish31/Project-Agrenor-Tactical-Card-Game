// v98.366 · ใช้ตอนเริ่มงานบนคอมเครื่องไหนก็ได้: ดึงงานล่าสุดจาก GitHub  →  node tools/work-start.cjs
const { spawnSync } = require('node:child_process'), path = require('node:path'), os = require('node:os');
const cwd = path.join(__dirname, '..'), git = (...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
if (git('--version').error) { console.log('ไม่พบ Git — ติดตั้งจาก git-scm.com ก่อน'); process.exit(1) }
const st = git('status', '--porcelain').stdout.trim();
if (st) { console.log('⚠ มีไฟล์ที่แก้ค้างอยู่ในเครื่องนี้ (' + st.split('\n').length + ' ไฟล์) — ส่งขึ้นก่อนด้วย  node tools/work-end.cjs  แล้วค่อยเริ่มงาน'); process.exit(1) }
const r = git('pull', '--ff-only'); console.log((r.stdout + r.stderr).trim());
if (r.status) { console.log('✗ ดึงงานไม่สำเร็จ — ส่งข้อความด้านบนให้ผู้ช่วยดู'); process.exit(1) }
console.log('✓ เครื่อง ' + os.hostname() + ' เป็นรุ่นล่าสุดแล้ว: ' + git('log', '-1', '--format=%h %s').stdout.trim());
