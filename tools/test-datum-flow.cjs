/* v98.451 · node tools/test-datum-flow.cjs — the Datum editor walk: eyes → chin → crown (guide ellipse) → ✂ head line → shoulders → ✂ leg line → 📏 thickness (arm points only for raised-arm poses),
   Esc skips a line, and the stray-speck filter of the silhouette box (Poacher must not be taller because of loose pixels). Starts its own static server. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..'), MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
(async () => {
  await new Promise(r => server.listen(0, r)); const BASE = 'http://localhost:' + server.address().port + '/', { chromium } = require('playwright'), b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1500, height: 1100 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(BASE + 'scale-lineup.html?dock=1'); await p.evaluate(() => { for (const k of ['proportion-standard-v1', 'proportion-girth-v1', 'proportion-master-v1', 'proportion-datum-v1']) localStorage.removeItem(k) });
  await p.reload(); await p.waitForTimeout(9000);
  const sp = await p.evaluate(() => { const c = ENTRIES.find(x => x.id === 'm:poacher')?.ctx.battle; if (!c) return null; const o = measure(c.img, c.flip, true), n = measure(c.img, c.flip); return { raw: o.H, now: n.H, kept: c.m.H } });
  if (sp) { assert.ok(sp.now < sp.raw, 'loose specks are ignored (' + sp.raw + ' → ' + sp.now + ')'); assert.equal(sp.kept, sp.now, 'the lineup uses the filtered box') }
  await p.evaluate(() => { pickSel('hero'); openDatum(ENTRIES.find(x => x.id === 'hero')) }); await p.waitForTimeout(2500);
  const sel = () => p.evaluate(() => { const b = [...document.querySelectorAll('#dtList [data-dk]')].find(x => /outline/.test(x.getAttribute('style') || '')); return (b ? b.dataset.dk : '-') + (!document.getElementById('dtCutDone').hidden ? ' [CUT]' : '') });
  const click = async (x, y) => { const bb = await (await p.$('#dtCv')).boundingBox(); await p.mouse.click(bb.x + x * bb.width, bb.y + y * bb.height); await p.waitForTimeout(120) };
  const steps = [['eyeL', .44, .2, 'eyeR'], ['eyeR', .56, .2, 'chin'], ['chin', .5, .27, 'crown'], ['crown', .5, .09, '- [CUT]']];
  assert.equal(await sel(), 'eyeL'); for (const [k, x, y, next] of steps) { await click(x, y); assert.equal(await sel(), next, 'after ' + k) }
  await click(.35, .29); await click(.65, .29); await p.keyboard.press('Enter'); await p.waitForTimeout(150); assert.equal(await sel(), 'shL', 'head line done → shoulders');
  for (const [k, x, y, next] of [['shL', .33, .33, 'shR'], ['shR', .67, .33, '- [CUT]']]) { await click(x, y); assert.equal(await sel(), next, 'after ' + k) }   /* v98.454 · idle: shoulders only, then the leg line */
  await click(.4, .55); await click(.6, .55); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  assert.ok(await p.evaluate(() => document.getElementById('dtMsg').textContent.includes('📏 คลิก 2 จุด')), 'after the leg line the thickness measurement starts'); await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  const own = await p.evaluate(() => { const r = ProportionDatum.get('hero', VP.action, VP.index); return { crown: !!r?.pts?.SW?.crown, neck: r?.cuts?.SW?.neck?.length, hip: r?.cuts?.SW?.hip?.length } }); assert.ok(own.crown && own.neck === 2 && own.hip === 2, 'crown + both lines stored ' + JSON.stringify(own));
  await p.click('#dtClearDir'); await p.waitForTimeout(400); for (const [, x, y] of steps) await click(x, y); assert.equal(await sel(), '- [CUT]'); await p.keyboard.press('Escape'); await p.waitForTimeout(150); assert.equal(await sel(), 'shL', 'Esc skips the line');
  await b.close(); server.close(); for (const e of errs) console.log('✗ page error: ' + e); if (errs.length) process.exit(1); console.log('✓ datum flow: crown → head line → shoulders → leg line → thickness · specks ignored');
})().catch(e => { console.log('✗', e.message); process.exit(1) });
