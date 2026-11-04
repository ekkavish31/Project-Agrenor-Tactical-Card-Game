// v98.131 · the village / battle sprites read the SAME data as Asset Studio: walk sets from ASSET_MANIFEST.studioAllyWalks (frame list + ms), standing pictures from the studio slots.
// Run: node tools/e2e-village-sprites-source.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await browser.newPage({ viewport: { width: 1300, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'village-town.html'); await p.waitForTimeout(12000);
  const r = await p.evaluate(async () => { const out = {}, W = ASSET_MANIFEST.studioAllyWalks || {};
    for (const k of ['ren', 'nadia', 'sigrid', 'orla', 'olwen', 'luna', 'bram']) { const S = VillagerDraw.sprites(k); out[k] = {};
      for (const d of ['sw', 'se', 'ne', 'nw']) { const cfg = W[k]?.[d.toUpperCase()]; if (!cfg) continue; const im = S[d + '-walk' + cfg.frames.length];
        for (let i = 0; i < 50 && !(im.complete && im.naturalWidth); i++) await new Promise(res => setTimeout(res, 100));   // the .webp try fails first, then the .png loads
        out[k][d] = { want: cfg.frames.length, got: S.info.wn[d], ms: S.ms[d], wantMs: cfg.frames[0].ms, loaded: im.naturalWidth > 0, same: im.src.replace(/\.(png|webp)(\?.*)?$/, '').endsWith(cfg.frames[cfg.frames.length - 1].src.replace(/\.(png|webp)$/, '')) } } }
    return out });
  for (const [k, o] of Object.entries(r)) for (const [d, v] of Object.entries(o)) { assert.equal(v.got, v.want, k + ' ' + d + ' frame count'); assert.equal(v.ms, v.wantMs, k + ' ' + d + ' ms'); assert.ok(v.loaded, k + ' ' + d + ' last frame loads'); assert.ok(v.same, k + ' ' + d + ' uses the studio file') }
  console.log('ok', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, o]) => [k, Object.entries(o).map(([d, v]) => d + ':' + v.got).join(' ')]))));
  assert.deepEqual(errs, [], errs.join('|')); console.log('village sprites source e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
