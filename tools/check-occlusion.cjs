/* node tools/check-occlusion.cjs [placeId …] [--shots] [--all]
   Finds things that are drawn OVER the hero although, by the footprint rule, the hero stands IN FRONT of them (village-town.html, the real renderer).
   How: the hero is put on grid cells around every place (in front, at the sides, on the road); each frame every object's draw() is watched — the pixels in a box around the hero are
   snapshotted right after the hero is drawn and compared after every later draw: an object that changes them COVERS the hero. For each cover we read its footprint (fp):
      ORDER BUG  = it has a footprint and DepthStyle.walkerInFront(fp, hero) is true (the hero is beyond its front edge) — it must not be drawn later
      ANCHOR BUG = it has no footprint and its base (y) is above the hero's feet (it stands behind the hero) but it is drawn after
      BUILDING BUG = the building art itself is drawn over a hero who stands more than 0.4 cell beyond the building's front edge
   Legit covers (hero really behind something, or a see-through tall part) are not reported unless --all. --shots saves a crop of every bug to tools/out/occlusion/.
   Output: place · cell · covering object (label, layer z, y vs hero y, footprint) · px covered. Exit code 1 when any bug is found. Starts its own static server. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2), SHOTS = args.includes('--shots'), ALL = args.includes('--all'), ONLY = args.filter(a => !a.startsWith('--'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
(async () => {
  await new Promise(r => srv.listen(0, r)); const BASE = 'http://localhost:' + srv.address().port + '/';
  const { chromium } = require('playwright'), b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 800 } }), er = [];
  p.on('pageerror', e => er.push(e.message.slice(0, 120)));
  await p.goto(BASE + 'village-town.html'); await p.waitForTimeout(9000);
  await p.evaluate(() => {
    if (window.HeroFollower) HeroFollower.objects = () => []; if (window.TownNPC) TownNPC.objects = () => []; window.WorldState?.tick && (window.WorldState.tick = () => { });
    const orig = window.drawSorted; window.__covers = []; window.__rect = null;
    window.drawSorted = function (objs) {
      if (!window.__rect) return orig.apply(this, arguments);
      const R = window.__rect, ctx = cv.getContext('2d'); let snap = null, heroY = null;
      for (const it of objs) {
        if (it.__w || !it.draw) continue; it.__w = true; const d = it.draw;
        it.draw = function () {
          d.apply(this, arguments); if (!window.__rect) return;
          if (it.hero) { heroY = it.y; snap = ctx.getImageData(R.x, R.y, R.w, R.h).data; return }
          if (!snap) return; const now = ctx.getImageData(R.x, R.y, R.w, R.h).data; let n = 0; for (let i = 0; i < now.length; i += 4) if (Math.abs(now[i] - snap[i]) + Math.abs(now[i + 1] - snap[i + 1]) + Math.abs(now[i + 2] - snap[i + 2]) > 36) n++;
          if (n > 25) { window.__covers.push({ n, label: it.label || it.name || (it.isBuilding || it.building ? 'BUILDING ' + (it.place || '') : it.kind || it.type || '?'), place: it.place || null, z: it.z ?? null, y: Math.round(it.y), fp: it.fp ? { u0: +it.fp.u0.toFixed(2), u1: +it.fp.u1.toFixed(2), v0: +it.fp.v0.toFixed(2), v1: +it.fp.v1.toFixed(2) } : null, inFrontRule: it.fp ? DepthStyle.walkerInFront(it.fp, hero.u, hero.v) : null, heroY: Math.round(heroY ?? 0), bld: !!(it.isBuilding || it.building), bf: (() => { if (!(it.isBuilding || it.building)) return null; const o = locations.find(q => q.id === it.place); if (!o) return null; const e = estate(o); if (!e) return null; return (o.facing === 'SE' ? hero.u - e.u : hero.v - e.v) - e.front })() }); snap = now }
        };
      }
      return orig.apply(this, arguments);
    };
  });
  const places = await p.evaluate(() => locations.filter(o => o.id !== 'square' && estate(o)).map(o => o.id));
  const todo = ONLY.length ? places.filter(x => ONLY.includes(x)) : places; let tested = 0; const bugs = [];
  if (SHOTS) fs.mkdirSync(path.join(__dirname, 'out/occlusion'), { recursive: true });
  for (const id of todo) {
    const cells = await p.evaluate(id => { const o = locations.find(x => x.id === id), e = estate(o), se = o.facing === 'SE', out = [];
      for (const bb of [e.front + .7, e.front + 1.6, e.front + 2.8]) for (let a = Math.ceil(e.left) + 1; a <= e.right - 1; a += 2) out.push([a, bb]);
      for (const a of [e.left - 1.2, e.right + 1.2]) for (const bb of [e.back + 1, (e.back + e.front) / 2, e.front - 1]) out.push([a, bb]);
      return out.map(([a, bb]) => ({ u: e.u + (se ? bb : a), v: e.v + (se ? a : bb) })) }, id);
    for (const c of cells) {
      const r = await p.evaluate(async ({ id, c }) => {
        hero.u = c.u; hero.v = c.v; path.length = 0; zoom = 2; focusHero(); window.__rect = null;
        const frames = n => new Promise(res => { let k = 0; const t = () => (++k >= n ? res() : requestAnimationFrame(t)); requestAnimationFrame(t) });
        await frames(3);
        for (const q of locations) { const f = estate(q); if (!f) continue; const s2 = q.facing === 'SE', a2 = s2 ? c.v - f.v : c.u - f.u, b2 = s2 ? c.u - f.u : c.v - f.v; if (q.id !== id && a2 >= f.left && a2 <= f.right && b2 >= f.back && b2 <= f.front) return { skip: 'inside ' + q.id } }
        const P = project(hero.u, hero.v), dpr = devicePixelRatio, sx = Math.round(((P.x - WORLD_W / 2) * scale * zoom + W / 2 + pan.x) * dpr), sy = Math.round(((P.y - WORLD_H / 2) * scale * zoom + H / 2 + pan.y) * dpr);
        const w = Math.round(26 * scale * zoom * dpr), h = Math.round(100 * scale * zoom * dpr), x0 = Math.max(0, sx - w), y0 = Math.max(0, sy - h);
        window.__rect = { x: x0, y: y0, w: Math.min(cv.width - x0, w * 2), h: Math.min(cv.height - y0, h + 6) }; window.__covers = [];
        await frames(2); window.__covers = []; await frames(2); const covers = window.__covers.slice(); window.__rect = null;
        return { covers, box: { x: Math.round(x0 / dpr), y: Math.round(y0 / dpr), w: Math.round(w * 2 / dpr), h: Math.round((h + 6) / dpr) } };
      }, { id, c });
      if (r.skip) continue; tested++;
      for (const cv of r.covers) {
        const bug = cv.bld ? (cv.bf != null && cv.bf > 0.4) : cv.fp ? cv.inFrontRule === true : cv.y < cv.heroY - 6;
        if (bug || ALL) { bugs.push({ id, c, ...cv, bug, box: r.box }); if (bug && SHOTS) await p.screenshot({ path: path.join(__dirname, 'out/occlusion', `${id}_${c.u.toFixed(1)}_${c.v.toFixed(1)}_${String(cv.label || 'x').replace(/[^\w]+/g, '-').slice(0, 20)}.png`), clip: { x: Math.max(0, r.box.x - 60), y: Math.max(0, r.box.y - 30), width: Math.min(1000, r.box.w + 120), height: Math.min(700, r.box.h + 70) } }).catch(() => { }) }
      }
    }
  }
  const real = bugs.filter(x => x.bug), by = {}; for (const x of real) (by[x.id + ' · ' + x.label] ||= []).push(x);
  console.log('tested ' + tested + ' hero cells around ' + todo.length + ' places → ' + real.length + ' covers that break the rule (' + Object.keys(by).length + ' distinct parts)');
  for (const [k, l] of Object.entries(by).sort((a, b) => b[1].length - a[1].length).slice(0, 40)) { const x = l[0]; console.log('✗ ' + k + ' × ' + l.length + ' cell(s) · layer z=' + x.z + ' · part y ' + x.y + ' vs hero y ' + x.heroY + ' · ' + (x.bld ? 'BUILDING, hero ' + x.bf.toFixed(1) + ' cell(s) beyond its front edge' : x.fp ? 'footprint u ' + x.fp.u0 + '…' + x.fp.u1 + ' v ' + x.fp.v0 + '…' + x.fp.v1 + ' (hero in front by rule)' : 'NO footprint') + ' · e.g. hero at ' + x.c.u.toFixed(1) + ',' + x.c.v.toFixed(1) + ' · ' + x.n + ' px') }
  if (er.length) console.log('page errors:', er.slice(0, 3));
  await b.close(); srv.close(); process.exit(real.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
