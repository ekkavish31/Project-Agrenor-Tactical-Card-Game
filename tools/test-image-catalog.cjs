/* v98.533 · the picture index: every image file in the repo is listed once and has a real category. Run after adding pictures: node tools/build-image-index.cjs && node tools/test-image-catalog.cjs */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), C = require('../js/image-catalog.js');
const ROOT = path.join(__dirname, '..'); global.window = global; eval(fs.readFileSync(path.join(ROOT, 'data/image-index.js'), 'utf8'));
const walk = (d, o = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name === '.git') continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, o); else if (/\.(png|webp|jpe?g|gif|svg)$/i.test(e.name)) o.push(path.relative(ROOT, p).split(path.sep).join('/')) } return o };
const files = walk(ROOT), idx = new Map(IMAGE_INDEX.items.map(i => [i[0], i])); let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ };
ok(IMAGE_INDEX.n === IMAGE_INDEX.items.length, 'count matches');
const missing = files.filter(f => !idx.has(f)); ok(!missing.length, 'index is stale — run node tools/build-image-index.cjs · missing ' + missing.length + ': ' + missing.slice(0, 5).join(', '));
const other = IMAGE_INDEX.items.filter(i => i[5] === 'other'); ok(!other.length, 'every picture has a category · add a rule in js/image-catalog.js for: ' + other.slice(0, 5).map(i => i[0]).join(', '));
ok(IMAGE_INDEX.items.every(i => C.CATS[i[5]]), 'categories exist');
ok(C.categoryOf('assets/portraits/story/corvin-happy.webp').cat === 'portrait', 'story portraits are portraits');
ok(IMAGE_INDEX.items.filter(i => i[5] === 'portrait').length >= 64, 'all portraits (old + story) are in ONE category');
console.log('image catalog: ' + n + ' ok · ' + IMAGE_INDEX.n + ' files');
