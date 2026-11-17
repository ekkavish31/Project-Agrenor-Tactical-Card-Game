/* v98.612 · node tools/test-world-scale.cjs — the half-size-hex world (js/world-scale.js): sizes, marks, rivers, reachability, save conversion */
const path = require('path'); global.window = global; global.location = { search: '?world=2' }; global.localStorage = { getItem: () => null };
const J = f => path.join(__dirname, '..', 'js', f); require(J('world-norchorthal.js')); const base = JSON.parse(JSON.stringify(global.NORCHORTAL));
const WS = require(J('world-scale.js')), G = require(J('world-gen.js'));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const N = global.NORCHORTAL;
ok(WS.scale === 2 && N.scale === 2 && N.cols === base.cols * 2 && N.rows === base.rows * 2 && N.km === base.km / 2, 'size ×2, km ÷2');
ok(N.grid.length === N.rows && N.grid.every(r => r.length === N.cols) && N.river.length === N.rows && N.river.every(r => r.length === N.cols), 'grid + river are rectangular');
const cnt = s => { const m = {}; for (const r of s) for (const ch of r) m[ch] = (m[ch] || 0) + 1; return m }, a = cnt(base.grid), b = cnt(N.grid);
for (const ch of Object.keys(a)) ok(Math.abs(b[ch] / (N.cols * N.rows) - a[ch] / (base.cols * base.rows)) < .004, 'terrain share of ' + ch + ' kept (' + (b[ch] / (N.cols * N.rows)).toFixed(4) + ' vs ' + (a[ch] / (base.cols * base.rows)).toFixed(4) + ')');
for (const [id, m] of Object.entries(base.marks)) { const n = N.marks[id]; const SQ = Math.sqrt(3), cx = (c, r, R) => SQ * R * (c + .5 * (r & 1)) + SQ * R / 2, cy = (r, R) => 1.5 * R * r; const d = Math.hypot(cx(m[0], m[1], 1) - cx(n[0], n[1], .5), cy(m[1], 1) - cy(n[1], .5)); ok(d < .6, 'mark ' + id + ' stays within a hex of where it was (' + d.toFixed(2) + ')') }
ok(G.SCALE === 2 && G.COLS === 300 && G.ROWS === 260 && G.KM === 6, 'WorldGen reads the scaled map');
const w = G.generate(7);
ok(w.dests.length >= 4 && w.towns.length >= 8, 'destinations and towns placed: ' + w.dests.length + ' / ' + w.towns.length);
for (const t of [...w.dests, ...w.towns]) ok(!!G.path(w, w.home, t), 'reachable from Fernvale: ' + (t.id));
ok((w.landmarks || []).length > 30, 'landmarks: ' + (w.landmarks || []).length);
/* conversion round trips */
let worst = 0; for (let i = 0; i < 400; i++) { const c = (i * 37) % 150, r = (i * 53) % 130, [nc, nr] = WS.convertCell(c, r, 1, 2), [bc, br] = WS.convertCell(nc, nr, 2, 1); worst = Math.max(worst, Math.hypot(bc - c, br - r)) }
ok(worst <= 1.5, '1 → 2 → 1 comes back within a hex (worst ' + worst.toFixed(2) + ')');
console.log(pass + ' ok · ' + fail + ' fail'); process.exit(fail ? 1 : 0);
