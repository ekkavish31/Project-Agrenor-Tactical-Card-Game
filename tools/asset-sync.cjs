// v98.367 · รู้ว่า asset ที่เครื่องไหน "ใหม่กว่า" (docs/TODO.md §19.2)
//   node tools/asset-sync.cjs status  [--root <โฟลเดอร์>]   เทียบไฟล์ในเครื่องนี้กับ "สมุดบัญชี" data/asset-ledger.json (ซึ่งส่งผ่าน Git)
//   node tools/asset-sync.cjs publish [--root <โฟลเดอร์>] [--force]   บันทึกสภาพไฟล์ของเครื่องนี้ลงสมุดบัญชี (แล้ว work-end ส่งขึ้น Git)
// root = โฟลเดอร์ที่มี assets/ , data/ , js/ (ค่าเริ่มต้น = โฟลเดอร์ repo นี้) · ตรวจ: assets/**, data/asset-manifest.json, js/asset-manifest.js
// ไฟล์จริงของ asset ไม่ได้ผ่านสมุดบัญชี — สมุดบัญชีบอกแค่ว่า "ไฟล์ไหนต่างกัน ฝั่งไหนใหม่กว่า" ส่วนจะย้ายไฟล์ด้วยอะไร (Git / โฟลเดอร์ซิงก์ / USB) เลือกแยก
// เทียบแบบ 3 ทาง: base = สภาพ ณ การซิงก์ครั้งล่าสุดของเครื่องนี้ (<root>/.asset-base.json · ไม่ส่งขึ้น Git)
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), os = require('node:os');
const cmd = process.argv[2] || 'status', arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d };
const repo = path.join(__dirname, '..'), root = path.resolve(arg('root', repo)), force = process.argv.includes('--force');
const ledgerFile = path.resolve(arg('ledger', path.join(repo, 'data', 'asset-ledger.json'))), baseFile = path.join(root, '.asset-base.json');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return d } };
const rel = f => path.relative(root, f).split(path.sep).join('/');
function* walk(d) { let es; try { es = fs.readdirSync(d, { withFileTypes: true }) } catch { return } for (const e of es) { const f = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== '_versions' && e.name !== 'node_modules') yield* walk(f) } else yield f } }
const sha = f => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
function scan() {
  const out = {}, add = f => { const st = fs.statSync(f); out[rel(f)] = [sha(f), st.size, Math.round(st.mtimeMs)] };
  for (const f of walk(path.join(root, 'assets'))) add(f);
  for (const p of ['data/asset-manifest.json', 'js/asset-manifest.js']) { const f = path.join(root, p); if (fs.existsSync(f)) add(f) }
  return out;
}
const L = scan(), led = readJSON(ledgerFile, { files: {} }), R = led.files || {}, base = readJSON(baseFile, { files: {} }).files;
const h = x => x ? x[0] : null, when = x => x ? new Date(x[2]).toLocaleString('th-TH') : '-';
const rows = { same: [], localNew: [], remoteNew: [], conflict: [], unknown: [], localOnly: [], remoteOnly: [] };
for (const p of new Set([...Object.keys(L), ...Object.keys(R)])) {
  const l = L[p], r = R[p], b = base[p];
  if (h(l) === h(r)) { rows.same.push(p); continue }
  if (!r) { rows.localOnly.push(p); continue }
  if (!l) { rows.remoteOnly.push(p); continue }
  if (!b) { rows.unknown.push(p); continue }                       // ไม่เคยซิงก์เครื่องนี้ → บอกไม่ได้ว่าใครใหม่กว่า (ใช้เวลาแก้ไฟล์เป็นคำใบ้)
  if (h(l) !== h(b) && h(r) === h(b)) rows.localNew.push(p);       // เครื่องนี้แก้ ฝั่งสมุดบัญชีไม่เปลี่ยน
  else if (h(l) === h(b) && h(r) !== h(b)) rows.remoteNew.push(p); // อีกเครื่องแก้และ publish แล้ว
  else rows.conflict.push(p);                                       // แก้ทั้งคู่
}
const show = (title, list, f) => { if (!list.length) return; console.log('\n' + title + ' (' + list.length + ')'); for (const p of list.slice(0, 40)) console.log('  ' + p + (f ? '  ' + f(p) : '')); if (list.length > 40) console.log('  … และอีก ' + (list.length - 40) + ' ไฟล์') };
console.log('โฟลเดอร์: ' + root + '\nสมุดบัญชีล่าสุด: ' + (led.updated ? new Date(led.updated).toLocaleString('th-TH') + ' โดยเครื่อง ' + led.by : '(ยังไม่มี)'));
console.log('ตรงกัน ' + rows.same.length + ' ไฟล์');
show('⬆ เครื่องนี้ใหม่กว่า (ต้อง publish แล้วส่งไฟล์ไปอีกเครื่อง)', rows.localNew, p => '[' + when(L[p]) + ']');
show('⬇ อีกเครื่องใหม่กว่า (ต้องเอาไฟล์จากอีกเครื่องมาทับ)', rows.remoteNew, p => '[สมุดบัญชี ' + when(R[p]) + ']');
show('⚠ ชนกัน — แก้ทั้งสองเครื่อง ต้องเลือกด้วยตา', rows.conflict, p => '[เครื่องนี้ ' + when(L[p]) + ' · สมุดบัญชี ' + when(R[p]) + ']');
show('? ต่างกันแต่ไม่เคยซิงก์เครื่องนี้ (คำใบ้จากเวลาแก้ไฟล์)', rows.unknown, p => L[p][2] > R[p][2] ? '→ เครื่องนี้น่าจะใหม่กว่า' : '→ สมุดบัญชีน่าจะใหม่กว่า');
show('➕ มีเฉพาะเครื่องนี้ (ยังไม่อยู่ในสมุดบัญชี)', rows.localOnly);
show('➖ มีในสมุดบัญชีแต่เครื่องนี้ไม่มีไฟล์', rows.remoteOnly);
const saveBase = files => fs.writeFileSync(baseFile, JSON.stringify({ updated: Date.now(), files }));
if (cmd === 'status') {
  const nb = { ...base }; for (const p of rows.same) nb[p] = L[p]; saveBase(nb);   // ไฟล์ที่ตรงกันถือว่าซิงก์แล้ว
  const bad = rows.remoteNew.length + rows.conflict.length + rows.unknown.length + rows.remoteOnly.length;
  console.log('\n' + (bad ? '✗ ยังไม่ควร publish จนกว่าจะเอาไฟล์ฝั่งที่ใหม่กว่ามาก่อน' : rows.localNew.length + rows.localOnly.length ? '✓ publish ได้ (เครื่องนี้ใหม่กว่า)' : '✓ ทุกอย่างตรงกัน'));
} else if (cmd === 'publish') {
  const bad = rows.remoteNew.length + rows.conflict.length + rows.remoteOnly.length;
  if (bad && !force) { console.log('\n✗ ไม่ publish: สมุดบัญชีมีของใหม่กว่า/ชนกัน — จัดการรายการด้านบนก่อน (หรือ --force ถ้าแน่ใจว่าเครื่องนี้ถูก)'); process.exit(1) }
  fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
  fs.writeFileSync(ledgerFile, JSON.stringify({ updated: Date.now(), by: os.hostname(), files: L }));
  saveBase(L); console.log('\n✓ บันทึกสมุดบัญชีแล้ว (' + Object.keys(L).length + ' ไฟล์) → รัน  node tools/work-end.cjs  เพื่อส่งขึ้น Git');
} else { console.log('คำสั่ง: status | publish'); process.exit(1) }
