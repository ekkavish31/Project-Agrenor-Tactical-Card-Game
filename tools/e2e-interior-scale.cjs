// v98.152 · inside a building (place-interior.html) the characters follow the ONE multiplier of that room (MapScale 'interior') and the Scale Lineup factors; one shared contact shadow.
// Run: node tools/e2e-interior-scale.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), errs = [];
  const capture = async k => { const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } }); await ctx.addInitScript(v => { try { localStorage.setItem('map-char-scale-v1', JSON.stringify({ interior: { inn: v } })) } catch (e) { } }, k);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(base + 'place-interior.html?place=inn'); await p.waitForTimeout(2500);
    const r = await p.evaluate(async () => { const sc = [], sizes = [], sh = []; const vd = window.VillagerDraw, o = vd; window.VillagerDraw = Object.assign(function (g, L, x, y, t, op) { if (op && op.scale) sc.push(op.scale); return o.apply(this, arguments) }, o);
      const pa = ProcMotion.apply; ProcMotion.apply = function (g, key, info, t, s, id) { sizes.push(s); return pa.apply(this, arguments) }; const so = o.shadow; o.shadow = function (g, x, y, s) { sh.push(s); return so.apply(this, arguments) };
      await new Promise(r => setTimeout(r, 1500)); return { sc: sc.length ? Math.max(...sc) : null, scMin: sc.length ? Math.min(...sc) : null, hero: sizes.length ? Math.max(...sizes) : null, shadow: sh.length ? sh[0] : null, n: sc.length } });
    await ctx.close(); return r };
  const a = await capture(1), b = await capture(1.5);
  console.log('inn at 100 %:', JSON.stringify(a), '· at 150 %:', JSON.stringify(b));
  assert.ok(a.n > 0, 'villagers are drawn in the inn'); assert.ok(Math.abs(b.sc / a.sc - 1.5) < 0.02, 'villagers follow the room multiplier: ' + a.sc + ' → ' + b.sc);
  if (a.hero) assert.ok(Math.abs(b.hero / a.hero - 1.5) < 0.02, 'hero follows the room multiplier: ' + a.hero + ' → ' + b.hero);
  if (a.shadow) assert.ok(Math.abs(b.shadow / a.shadow - 1.5) < 0.02, 'hero shadow follows it too');
  assert.deepEqual(errs, [], errs.join('|')); console.log('interior scale e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
