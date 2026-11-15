#!/usr/bin/env node
/* v98.533 · makes data/image-index.js (+ docs/IMAGE-MAP-TH.md): EVERY picture file in the repo, once, with its category.
   The editor (Asset Studio → Asset Manager) reads it and also merges the live repo tree, so a new file shows up even before this is re-run.
   Run: node tools/build-image-index.cjs     (needs nothing but node · ~10 s)
   item = [path, bytes, width, height, hash8, category, sub-category, slotId|'', duplicates, usage 0|1|2, why] */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const ROOT = path.join(__dirname, '..'), C = require('../js/image-catalog.js');
const SKIP = new Set(['node_modules', '.git']), IMG = /\.(png|webp|jpe?g|gif|svg)$/i;
function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (IMG.test(e.name)) out.push(path.relative(ROOT, p).split(path.sep).join('/')) } return out }
function dims(buf, p) {
  try {
    if (/\.png$/i.test(p) && buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (/\.webp$/i.test(p) && buf.toString('ascii', 0, 4) === 'RIFF') { const t = buf.toString('ascii', 12, 16);
      if (t === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
      if (t === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      if (t === 'VP8L') { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1] } }
    if (/\.gif$/i.test(p)) return [buf.readUInt16LE(6), buf.readUInt16LE(8)];
    if (/\.jpe?g$/i.test(p)) { let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) { i++; continue } const m = buf[i + 1]; if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + buf.readUInt16BE(i + 2) } }
  } catch (e) { }
  return [0, 0];
}
/* manifest category (Asset Studio slot) → catalogue category: a registered slot knows better than the path */
const MAN = { 'tactics-hero': 'hero', 'hero-frames': 'hero', characters: 'hero', allies: 'ally', enemies: 'monster', 'enemy-animations': 'monster', cards: 'card', 'tactic-cards': 'card', 'unit-card-art': 'card', items: 'item', actions: 'item', ui: 'ui', 'ui-packs': 'ui', cursors: 'ui', elements: 'ui', textures: 'terrain', terrain: 'terrain', scenes: 'battlefield', 'battle-scenery': 'battlefield', 'battle-field': 'battlefield', 'battle-ground-animation': 'battlefield', 'battle-large-objects': 'battlefield', 'battle-directional': 'battlefield', 'village-map': 'village', 'village-idle': 'village', 'tactics-equipment': 'tactics', 'tactics-props': 'tactics' };
const slotBy = new Map(); try { global.window = global; eval(fs.readFileSync(path.join(ROOT, 'js/asset-manifest.js'), 'utf8')); for (const a of global.ASSET_MANIFEST.assets || []) if (a.file) slotBy.set(a.file, a) } catch (e) { console.warn('manifest not read', e.message) }
const twin = p => /\.png$/.test(p) ? p.replace(/\.png$/, '.webp') : p.replace(/\.webp$/, '.png');
/* usage hint from the sources: 2 = the file's own path is written in code · 1 = only its folder / name pattern is (a file name may be built at run time) · 0 = nothing found */
const SRC = (() => { let t = ''; const add = d => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { if (e.isDirectory()) continue; if (/\.(js|html|cjs)$/.test(e.name) && !/^(asset-manifest|game-settings|asset-usage|image-index|character-scale-adjust-data)\./.test(e.name)) t += fs.readFileSync(path.join(ROOT, d, e.name), 'utf8') + '\n' } }; add('js'); add('.'); return t })();
const usageHint = p => { const tw = twin(p), stem = p.replace(/\.[a-z]+$/i, ''), dir = p.slice(0, p.lastIndexOf('/') + 1); if (SRC.includes(p) || SRC.includes(tw) || SRC.includes(stem)) return 2; return dir && SRC.includes(dir.replace(/\/$/, '')) ? 1 : 0 };
/* portraits are named at run time (<set>-<face>.webp): the truth is StoryActors.PAINTED (+ the two hero sets) — read it instead of guessing */
const PORTRAIT_USE = new Map(); try { global.window = global; global.document = undefined; require('../js/story-actors.js'); const SA = global.StoryActors; const add = (set, faces, why) => { const list = Array.isArray(faces) ? faces : Object.values(faces); for (const f of list) PORTRAIT_USE.set('assets/portraits/' + set + '-' + f + '.webp', why) };
  for (const [who, P] of Object.entries(SA.PAINTED)) add(P[0], P[1], 'ภาพสนทนาของ ' + who + ' (StoryActors.PAINTED)');
  for (const l of ['male', 'female']) for (const f of ['neutral', 'talk', 'calm', 'happy', 'angry', 'worry', 'sad']) PORTRAIT_USE.set('assets/portraits/hero-' + l + '-' + f + '.webp', 'ภาพสนทนา/พอร์ตเทรตตัวเอก ' + l + ' (StoryActors · battle-portrait.js)') } catch (e) { console.warn('story-actors not read', e.message) }
const files = walk(ROOT).sort(), items = [], byHash = new Map();
for (const p of files) {
  const buf = fs.readFileSync(path.join(ROOT, p)), h = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8), [w, hh] = dims(buf, p);
  let { cat, sub } = C.categoryOf(p); const slot = slotBy.get(p) || slotBy.get(twin(p));
  if (slot && MAN[slot.category] && cat !== 'versions' && cat !== 'portrait' && cat !== 'archive') { if (cat === 'other' || cat === 'village' && MAN[slot.category] !== 'village') { cat = MAN[slot.category]; sub = sub || slot.category } }
  /* v98.561 · enemy animations are not written by path in the code: js/monster-animation.js looks the clip up in the manifest by id (enemy-anim-<enemy>-<view>-<pose>, status final, not needs-fix) and loads its file — so a registered, final clip IS used by the game */
  let use = PORTRAIT_USE.has(p) ? 2 : usageHint(p), why = PORTRAIT_USE.get(p) || '';
  if (slot && /^enemy-anim-/.test(slot.id) && slot.status === 'final' && slot.qaStatus !== 'needs-fix') { use = 2; why = 'แอนิเมชันมอนสเตอร์ ' + (slot.enemy || '') + ' · ท่า ' + (slot.pose || '') + ' · ' + (slot.view || '') + ' (MonsterArt อ่านจากแมนิเฟสต์ id ' + slot.id + ')' }
  else if (!slot && /^assets\/enemies\/animations\//.test(p) && use === 0) { const nw = files.find(f => f !== p && f.startsWith(p.replace(/\.webp$/, '-v')) && slotBy.get(f)); if (nw) why = 'ไฟล์ฉบับเก่า ถูกแทนที่ด้วย ' + nw.split('/').pop() + ' ในแมนิเฟสต์ — ไม่มีอะไรเรียกใช้แล้ว (ลบได้)' }
  const it = [p, buf.length, w, hh, h, cat, sub, slot ? slot.id : '', 0, use, why]; items.push(it); (byHash.get(h + ':' + buf.length) || byHash.set(h + ':' + buf.length, []).get(h + ':' + buf.length)).push(it);
}
for (const g of byHash.values()) if (g.length > 1) for (const it of g) it[8] = g.length - 1;
fs.writeFileSync(path.join(ROOT, 'data/image-index.js'), '/* generated by tools/build-image-index.cjs · every picture file in the repo, once · item = [path, bytes, w, h, hash8, category, sub, slotId, duplicates, usage 0|1|2, why] */\nwindow.IMAGE_INDEX={v:1,n:' + items.length + ',items:' + JSON.stringify(items) + '};\n');
/* ---- docs/IMAGE-MAP-TH.md ---- */
const by = {}; for (const it of items) { const g = (by[it[5]] ||= { n: 0, b: 0, dirs: {}, subs: {}, dup: 0, reg: 0 }); g.n++; g.b += it[1]; const d = it[0].split('/').slice(0, 2).join('/'); g.dirs[d] = (g.dirs[d] || 0) + 1; g.subs[it[6]] = (g.subs[it[6]] || 0) + 1; if (it[8]) g.dup++; if (it[7]) g.reg++ }
const mb = b => (b / 1048576).toFixed(1) + ' MB'; let md = `# แผนที่รูปภาพทั้งหมดของเกม (สร้างอัตโนมัติ)\n\n> ไฟล์นี้สร้างโดย \`node tools/build-image-index.cjs\` — อย่าแก้มือ · ดัชนีเต็ม: \`data/image-index.js\` · กฎหมวดหมู่: \`js/image-catalog.js\`\n> **ภาพทั้งหมด ${items.length} ไฟล์ (${mb(items.reduce((a, i) => a + i[1], 0))})** — อยู่ในที่เดิม (โค้ด/manifest/เซฟอ้างพาธเหล่านี้) แต่ **ดูและค้นได้ที่เดียว**: Asset Studio → Asset Manager → เลือกหมวดหมู่\n\n## ที่มาของรูป (แหล่งต่าง ๆ) → หมวดเดียว\n| แหล่ง | อยู่ที่ | อะไรจัดการ |\n|---|---|---|\n| ภาพในเกม | \`assets/**\` | manifest (\`data/asset-manifest.json\`) ลงทะเบียนเป็น slot + ไฟล์ที่โค้ดอ้างตรง ๆ |\n| ภาพจาก Asset Studio | \`assets/tactics/imported/**\`, \`assets/characters/**\` | Asset Studio (ท่า/เฟรม) |\n| ภาพเวอร์ชันเก่า | \`assets/_versions/**\` | Asset Studio เก็บไว้ย้อน |\n| ภาพสนทนา | \`assets/portraits/**\` | story-actors.js / story-cast.js |\n| แผนที่โลก/เอกสาร | \`docs/lore/maps/**\` | หน้าแผนที่เส้นเรื่อง |\n| เก็บถาวร/ตัวอย่าง | \`archive/**\`, \`_archive/**\`, \`dev/**\`, \`tools/out/**\` | ไม่ใช้ในเกม |\n\n## จำนวนต่อหมวดหมู่\n| หมวดหมู่ | ไฟล์ | ขนาด | โฟลเดอร์หลัก | ลงทะเบียน slot | ไฟล์ซ้ำ (เนื้อหาเหมือนกัน) |\n|---|---|---|---|---|---|\n`;
for (const c of C.order()) { const g = by[c]; if (!g) continue; const top = Object.entries(g.dirs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([d, n]) => `\`${d}\` ${n}`).join(' · '); md += `| ${C.label(c)} | ${g.n} | ${mb(g.b)} | ${top} | ${g.reg} | ${g.dup} |\n` }
md += `\n## หมวดย่อยในแต่ละหมวด\n`; for (const c of C.order()) { const g = by[c]; if (!g) continue; md += `\n### ${C.label(c)}\n` + Object.entries(g.subs).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([s, n]) => `- ${s || '(ไม่ระบุ)'} — ${n}`).join('\n') + '\n' }
const dups = [...byHash.values()].filter(g => g.length > 1 && g[0][1] > 2048).sort((a, b) => b[0][1] * (b.length - 1) - a[0][1] * (a.length - 1)).slice(0, 25);
md += `\n## ไฟล์ซ้ำที่กินที่มากสุด (เนื้อหาเหมือนกันทุกไบต์ — ตรวจแล้วลบสำเนาได้ ถ้าไม่มีโค้ดอ้างพาธนั้น)\n` + (dups.length ? dups.map(g => `- ${mb(g[0][1] * (g.length - 1))} เสียไปกับสำเนา ${g.length} ไฟล์: ${g.slice(0, 3).map(i => '\`' + i[0] + '\`').join(', ')}${g.length > 3 ? ' …' : ''}`).join('\n') : '- ไม่พบ') + '\n';
fs.writeFileSync(path.join(ROOT, 'docs/IMAGE-MAP-TH.md'), md);
const other = items.filter(i => i[5] === 'other'); console.log(`image index: ${items.length} files · ${Object.keys(by).length} categories · other=${other.length}`); if (other.length) console.log(other.slice(0, 10).map(i => i[0]).join('\n'));
