/* node tools/check-field-occlusion.cjs [--seeds=4242,77,901] [--nofix]
   The same question as tools/check-occlusion.cjs for the battle field (battle-field.html): a unit that stands IN FRONT of a prop (beyond its front edge on either axis of the turned view) must be drawn AFTER it;
   one that stands BEHIND it (before its back edge) must be drawn BEFORE it. For several seeds, biomes and all 4 camera turns the hero is put next to every prop (trees 2×2 and 1×1 props),
   the draw order of the frame (window.__fieldOrder) is read back and every pair whose pictures overlap is checked against the box rule.
   Reports wrong pairs with the unit cell, the prop and its footprint. Exit code 1 on any wrong pair. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2), NOFIX = args.includes('--nofix'), SEEDS = ((args.find(a => a.startsWith('--seeds=')) || '--seeds=4242').split('=')[1]).split(',');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
(async () => {
  await new Promise(r => srv.listen(0, r)); const BASE = 'http://localhost:' + srv.address().port + '/';
  const { chromium } = require('playwright'), b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1300, height: 800 } }), er = []; p.on('pageerror', e => er.push(e.message.slice(0, 100)));
  let pairs = 0, bad = 0; const lines = [];
  for (const biome of ['grass', 'forest', 'hills']) for (const seed of SEEDS) {
    await p.goto(BASE + 'battle-field.html?battle=1&embed=1&warm=1&cine=0&r=5&biome=' + biome + '&seed=' + seed + '&ms=wolf*1.2&party=sib:50:50:charge:1'); await p.waitForTimeout(6500);
    for (let rot = 0; rot < 4; rot++) {
      await p.evaluate(r => { window.__want = r }, rot);
      await p.evaluate(async rot => { const tn = () => new Promise(r => setTimeout(r, 120)); for (let i = 0; i < 4 && (localStorage.getItem('projectA.fieldRot') | 0) !== rot; i++) { document.querySelector('#fieldCompass .hudb-rot-right')?.click(); await new Promise(r => setTimeout(r, 900)) } }, rot);
      const res = await p.evaluate(async () => {
        const st = TownBattle.state(), h = st.units[0], R = FieldRot, frames = n => new Promise(res => { let k = 0; const t = () => (++k >= n ? res() : requestAnimationFrame(t)); requestAnimationFrame(t) });
        const props = [...FIELD.cells.values()].filter(c => c.prop && c.prop !== 'pool' && (!c.big || c.big.anchor)).slice(0, 6); const wrong = []; let pairs = 0;
        const side = (fp, ru, rv) => { const fr = ru >= fp.u1 || rv >= fp.v1, bk = ru < fp.u0 || rv < fp.v0; if (fr && !bk) return 1; if (bk && !fr) return -1; return (ru + rv) > (fp.u0 + fp.u1 + fp.v0 + fp.v1) / 2 ? 1 : -1 };
        for (const pc of props) { const sz = pc.big ? 2 : 1;
          for (let du = -1; du <= sz; du++) for (let dv = -1; dv <= sz; dv++) { const u = pc.u + du, v = pc.v + dv, c = FIELD.cells.get(FIELD.key(u, v)); if (!c || c.k === 'blocked' || (du >= 0 && du < sz && dv >= 0 && dv < sz)) continue;
            for (const x of st.units) { x.hp > 0 && x !== h && (x.hp = 0) }   // only the hero stands in the field
            h.u = u; h.v = v; h.vu = u + .5; h.vv = v + .5; await frames(2);
            const o = window.__fieldOrder || [], ie = o.findIndex(e => e.unit === h), ue = o[ie]; if (ie < 0) continue; const r = R(h.vu, h.vv), P = project(h.vu, h.vv);
            for (let j = 0; j < o.length; j++) { const q = o[j]; if (!q.fp || !q.box) continue; const dd = Math.abs((q.fp.u0 + q.fp.u1) / 2 - r.u) + Math.abs((q.fp.v0 + q.fp.v1) / 2 - r.v); if (dd > 4) continue;
              const ov = q.box.x0 < P.x + 30 && q.box.x1 > P.x - 30 && q.box.y0 < P.y - 20 && q.box.foot > P.y - 100; if (!ov) continue; pairs++; const s = side(q.fp, r.u, r.v);
              if ((s > 0 && j > ie) || (s < 0 && j < ie)) wrong.push({ unit: [u, v], prop: q.label, fp: q.fp, want: s > 0 ? 'unit after prop' : 'unit before prop' }) } } }
        return { pairs, wrong }
      });
      pairs += res.pairs; bad += res.wrong.length; if (res.wrong.length) lines.push(biome + ' seed ' + seed + ' turn ' + rot + ': ' + res.wrong.length + ' wrong · e.g. ' + JSON.stringify(res.wrong[0]));
    }
  }
  console.log((NOFIX ? '[old order] ' : '') + 'checked ' + pairs + ' overlapping unit/prop pairs → ' + bad + ' break the box rule'); lines.slice(0, 12).forEach(l => console.log('✗ ' + l)); if (er.length) console.log('page errors:', er.slice(0, 3));
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
