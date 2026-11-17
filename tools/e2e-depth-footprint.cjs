// v98.146 · depth by footprint + cover look: (1) a walker beside the END of a long wall is ordered by the wall's footprint, not by its centre point;
// (2) a tall part in front of a walker fades (drawn several times in rings) and the walker is redrawn as a ghost; a low part only obeys the order (drawn once).
// Run: node tools/e2e-depth-footprint.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'village-town.html'); await p.waitForTimeout(14000);
  const r = await p.evaluate(() => {
    const o = locations.find(l => l.id === 'inn'), c = center(o), out = {}, ord = [];
    const mk = (id, u, v, ex = {}) => { const q = project(u, v); return { id, x: q.x, y: q.y, place: 'inn', draw: gg => { ord.push(id) }, ...ex } };
    const run = (parts, wu, wv) => { ord.length = 0; const body = { y: o.y * MY, building: true, place: 'inn', isBuilding: true, x: project(c.u, c.v).x, draw: () => ord.push('body') };
      const w = (() => { const q = project(wu, wv); return { hero: true, mobile: true, x: q.x, y: q.y, z: 0, draw: () => ord.push('walker') } })();
      const list = [body, ...parts, w]; occludeByBuildings(list); drawSorted(list); return [...ord] };
    // (1) long wall along u at v = c.v + 3 (thickness .4), centre at c.u
    const wall = () => mk('wall', c.u, c.v + 3, { label: 'รั้ว', fp: { u0: c.u - 3, u1: c.u + 3, v0: c.v + 2.8, v1: c.v + 3.2 } });
    out.frontAtEnd = run([wall()], c.u - 2.6, c.v + 3.9);          // in front of the wall, near its left end: wall first, walker after
    out.behind = run([wall()], c.u - 2.6, c.v + 2.2);              // behind the wall
    // (2) a tree in front of a walker: covered
    const tree = () => mk('tree', c.u, c.v + 3, { label: 'ต้นไม้', fp: { u0: c.u - .6, u1: c.u + .6, v0: c.v + 2.6, v1: c.v + 3.4 } });
    out.coverTall = run([tree()], c.u, c.v + 2.0);
    const fence = () => mk('fence', c.u, c.v + 3, { label: 'รั้วเตี้ย', fp: { u0: c.u - .6, u1: c.u + .6, v0: c.v + 2.6, v1: c.v + 3.4 } });
    out.coverLow = run([fence()], c.u, c.v + 2.0);
    DepthStyle.set({ low: 'fade' }); out.coverLowFade = run([fence()], c.u, c.v + 2.0); DepthStyle.set({ low: 'natural' });
    DepthStyle.set({ tall: 'solid' }); out.coverSolid = run([tree()], c.u, c.v + 2.0); DepthStyle.set({ tall: 'both' });
    return out });
  const idx = (a, k) => a.indexOf(k);
  assert.ok(idx(r.frontAtEnd, 'wall') < idx(r.frontAtEnd, 'walker'), 'walker beside the end of a long wall, in front of it → drawn after it: ' + r.frontAtEnd);
  assert.ok(idx(r.behind, 'walker') < idx(r.behind, 'wall'), 'walker behind the wall → drawn before it: ' + r.behind);
  const n = (a, k) => a.filter(x => x === k).length;
  assert.ok(n(r.coverTall, 'tree') >= 4 && n(r.coverTall, 'walker') === 2, 'tall cover: ring draws + ghost: ' + r.coverTall);
  assert.equal(n(r.coverLow, 'fence'), 1, 'low part: one plain draw'); assert.equal(n(r.coverLow, 'walker'), 1);
  assert.ok(n(r.coverLowFade, 'fence') >= 4, 'low part with "โปร่งด้วย": fades'); assert.equal(n(r.coverSolid, 'tree'), 1, 'solid setting: no fade');
  console.log('ok footprint order + cover', JSON.stringify({ frontAtEnd: r.frontAtEnd, tall: [n(r.coverTall, 'tree'), n(r.coverTall, 'walker')], low: n(r.coverLow, 'fence') }));
  assert.deepEqual(errs, [], errs.join('|')); console.log('depth footprint e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
