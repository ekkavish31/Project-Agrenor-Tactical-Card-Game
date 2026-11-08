/* node tools/scan-asset-usage.cjs   (needs the game served on http://localhost:8765 and playwright)
   Writes data/asset-usage.js → window.ASSET_USAGE = { "assets/…": ["ที่ใช้ (ภาษาคน)", …] } for every file under assets/.
   Two sources, both explained in plain Thai:
     1) RUNTIME  — the real pages are opened and every picture they request is recorded ("เห็นโหลดจริงตอน…")
     2) CODE     — the file name (or a folder it is built from) is written in a live script/stylesheet/data file ("เขียนไว้ใน…")
   Scripts that only belong to the old button-style scene (OLD_JS) never count as a use. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = process.env.BASE || 'http://localhost:8765/';

/* what a person sees → pages to open (runtime) */
const SCENES = [
  ['หน้าเมนูและบทนำ (เริ่มเกม)', 'index.html?skipTitle=1', 8000],
  ['เดินในหมู่บ้าน', 'village-town.html', 7000],
  ['ในโรงตีเหล็ก (แผนที่ย่อย)', 'village-place.html?place=forge', 6000],
  ['ในตลาด (แผนที่ย่อย)', 'village-place.html?place=market', 6000],
  ['ในบ้าน (ภายใน)', 'place-interior.html?place=home', 6000],
  ['แผนที่โลก', 'world-map.html', 7000],
  ['ฉากต่อสู้ในสนาม', 'battle-field.html?battle=1&embed=1&r=5&biome=grass&ms=' + encodeURIComponent('wolf*1.2,bandit*1.2') + '&party=' + encodeURIComponent('luna:44:44:charge:1,kier:50:50:charge:1'), 9000],
  ['ต่อสู้กลางหมู่บ้าน', 'village-town.html?battle=1&embed=1&r=5&ms=' + encodeURIComponent('wolf*1.2') + '&party=' + encodeURIComponent('bram:54:54:charge:1,mil:50:50:charge:1'), 9000],
];
/* v98.274 · wider coverage: every sub-map / interior (same list as tools/check-places.cjs), every battle biome, every monster kind (+ as boss) */
(function widen() {
  const vt = fs.readFileSync(path.join(ROOT, 'village-town.html'), 'utf8'), ids = new Map();
  for (const m of vt.matchAll(/\[\s*'([a-z0-9-]+)'\s*,\s*'([^']+)'\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,/g)) ids.set(m[1], m[2]);
  for (const [id, name] of ids) if (id !== 'square') { SCENES.push(['ภายใน ' + name, 'place-interior.html?place=' + id, 3500]); SCENES.push(['แมพย่อย ' + name, 'village-place.html?place=' + id, 3500]) }
  const mons = [...fs.readFileSync(path.join(ROOT, 'js/town-battle.js'), 'utf8').matchAll(/^\s*(\w+):\s*\{\s*name:\s*'[^']+'.*?img:/gm)].map(m => m[1]);
  for (const b of ['grass', 'forest', 'hills', 'swamp', 'snow', 'sand']) SCENES.push(['สู้ที่ไบโอม ' + b, 'battle-field.html?battle=1&embed=1&r=5&biome=' + b + '&ms=' + encodeURIComponent(mons.slice(0, 3).map(k => k + '*1.2').join(',')) + '&party=' + encodeURIComponent('luna:44:44:charge:1,kier:50:50:charge:1'), 6000]);
  for (let i = 0; i < mons.length; i += 3) SCENES.push(['สู้กับมอนสเตอร์ ' + mons.slice(i, i + 3).join('/'), 'battle-field.html?battle=1&embed=1&r=5&biome=grass&title=' + encodeURIComponent(i % 2 ? 'บอส' : '') + '&ms=' + encodeURIComponent(mons.slice(i, i + 3).map(k => k + '*1.2').join(',')) + '&party=' + encodeURIComponent('bram:54:54:charge:1,mil:50:50:charge:1'), 6000]);
})();
/* script/page → what it does for a person (code references are described this way) */
const PLACE = {
  'title-screen': 'หน้าเมนู/เริ่มเกม', 'new-game-prologue-kit': 'บทนำเริ่มเกมใหม่', 'opening-cinematic': 'วิดีโอเปิดเกม', 'game-intro': 'วิดีโอเปิดเกม', 'maker-logo': 'โลโก้ผู้ทำ',
  'village-town': 'หมู่บ้าน (เดินได้)', 'village-place': 'แผนที่ย่อย (ตลาด/โรงตี/บ้าน)', 'place-interior': 'ภายในสถานที่', 'interior': 'ภายในสถานที่', 'interior-art': 'ภายในสถานที่',
  'world-map': 'แผนที่โลก', 'world-state': 'แผนที่โลก', 'battle-field': 'ฉากต่อสู้', 'town-battle': 'ฉากต่อสู้', 'flat-battle': 'ฉากต่อสู้', 'field-host': 'ฉากต่อสู้',
  'tactics-ui': 'ฉากต่อสู้', 'tactics-sprites': 'ตัวละครในสนามต่อสู้', 'tactics-core': 'กติกาต่อสู้', 'card-design': 'การ์ด', 'cards-data': 'การ์ด', 'card-studio': 'โต๊ะออกแบบการ์ด',
  'unit-card-art': 'การ์ดตัวละคร', 'story-data': 'บทสนทนาและเรื่องราว', 'story-fx': 'ฉากเล่าเรื่อง', 'story-actors': 'ฉากเล่าเรื่อง', 'story-quests': 'เควสต์', 'town-art': 'ของตกแต่งหมู่บ้าน',
  'village-asset-edit': 'ตัวแก้ไขหมู่บ้าน', 'village-layout-v67': 'ผังหมู่บ้าน', 'scale-lineup': 'หน้าเทียบสเกล', 'asset-studio': 'Asset Studio', 'nav-icons': 'ปุ่มเมนู', 'game-bgm': 'เพลง', 'town-hud': 'แถบสถานะหมู่บ้าน',
  'hero-variant': 'ตัวเอก', 'hero-motion': 'ตัวเอก', 'hero-follower': 'น้อง/พี่ที่เดินตาม', 'monster-animation': 'มอนสเตอร์', 'scene-art': 'ภาพฉากเล่าเรื่อง', 'battle-vfx': 'เอฟเฟกต์ต่อสู้',
};
const OLD_JS = new Set(['location-actions', 'interface-v02', 'journey-ui', 'journey-core', 'paper-cards', 'card-drag', 'developer', 'editor', 'hud-v03', 'collection-v03', 'layout-v08', 'village-core', 'village-ui']);

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name).slice(ROOT.length + 1)]);
const files = walk(path.join(ROOT, 'assets')).sort();
const twin = p => /\.png$/.test(p) ? p.replace(/\.png$/, '.webp') : /\.webp$/.test(p) ? p.replace(/\.webp$/, '.png') : p;
const usage = new Map(files.map(f => [f, new Set()]));
const add = (f, s) => { if (usage.has(f)) usage.get(f).add(s) };

function codeScan() {
  const srcs = [];
  for (const d of ['js', 'css', 'data']) for (const f of fs.readdirSync(path.join(ROOT, d))) {
    const n = f.replace(/\.[a-z]+$/, '').replace(/-v\d+$/, '');
    if (/^(asset-manifest|asset-studio|studio-|build-)/.test(f) || OLD_JS.has(f.replace(/\.js$/, ''))) continue;
    if (!/\.(js|css|json)$/.test(f)) continue;
    srcs.push({ f: d + '/' + f, name: f.replace(/\.[a-z]+$/, ''), t: fs.readFileSync(path.join(ROOT, d, f), 'utf8') });
  }
  for (const f of fs.readdirSync(ROOT).filter(x => /\.html$/.test(x) && !/^(asset-studio|object-asset-studio|editor|index_t)\.html$/.test(x))) srcs.push({ f, name: f.replace('.html', ''), t: fs.readFileSync(path.join(ROOT, f), 'utf8') });
  const byBase = new Map();
  for (const f of files) { const b = path.basename(f); (byBase.get(b) || byBase.set(b, []).get(b)).push(f) }
  for (const s of srcs) {
    const who = PLACE[s.name] || 'โค้ด ' + s.f;
    const refs = new Set(s.t.match(/assets\/[A-Za-z0-9_\-./]+/g) || []);
    for (const r of refs) {
      if (usage.has(r)) { add(r, 'เขียนไว้ใน: ' + who); add(twin(r), 'เขียนไว้ใน: ' + who); continue }
      const dir = r.replace(/\/[^/]*$/, '/');   // folder prefix → names are built in code
      if ((/\/$/.test(r) || !/\.[a-z0-9]+$/.test(r)) && r.replace(/\/$/, '').split('/').length >= 3) for (const f of files) if (f.startsWith(r.replace(/\/?$/, '/'))) add(f, 'อาจใช้: ' + who + ' ประกอบชื่อไฟล์เองจากโฟลเดอร์นี้');
    }
    for (const m of s.t.matchAll(/['"`]([A-Za-z0-9_\-]+\.(?:webp|png))['"`]/g)) for (const f of byBase.get(m[1]) || []) add(f, 'เขียนไว้ใน: ' + who);
  }
}

async function runtime() {
  const { chromium } = require('playwright'), b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 800 } });
  let cur = null; p.on('request', r => { const u = r.url(); if (!u.startsWith(BASE)) return; const f = decodeURIComponent(u.slice(BASE.length).split('?')[0]); if (/^assets\//.test(f)) { add(f, 'เห็นโหลดจริงตอน: ' + cur); add(twin(f), 'เห็นโหลดจริงตอน: ' + cur) } });
  for (const [name, url, ms] of SCENES) { cur = name; try { await p.goto(BASE + url); await p.waitForTimeout(ms) } catch (e) { console.error('skip', name, e.message) } }
  await b.close();
}

(async () => {
  codeScan(); await runtime();
  const out = {}; let none = 0;
  for (const [f, s] of usage) { const L = [...s].sort((a, b) => (a.startsWith('เห็น') ? 0 : a.startsWith('เขียน') ? 1 : 2) - (b.startsWith('เห็น') ? 0 : b.startsWith('เขียน') ? 1 : 2)); out[f.replace(/^assets\//, '')] = L.slice(0, 4); if (!L.some(x => !x.startsWith('อาจใช้'))) none++ }
  fs.writeFileSync(path.join(ROOT, 'data/asset-usage.js'), '/* generated by tools/scan-asset-usage.cjs · key = path under assets/ · empty list = nothing found using it */\nwindow.ASSET_USAGE=' + JSON.stringify(out) + ';\n');
  console.log(files.length, 'files ·', none, 'with no certain use (none or only a guess)');
})();
