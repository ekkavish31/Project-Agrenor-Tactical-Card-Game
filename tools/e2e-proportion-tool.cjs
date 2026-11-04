// v98.118 · Scale Lineup → 📐 สัดส่วน: measures head : body for the cast (hero + allies), flags the ones off the semi-SD standard, lines can be dragged / typed and are remembered.
// Run: node tools/e2e-proportion-tool.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1600, height: 1050 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'scale-lineup.html'); await p.waitForTimeout(3500); await p.click('[data-t="ratio"]'); await p.waitForTimeout(1200);
  const rows = await p.evaluate(() => [...document.querySelectorAll('.rt tr[data-c]')].map(tr => [tr.dataset.c, ...[...tr.children].slice(1, 4).map(td => td.textContent)]));
  assert.ok(rows.length >= 9 && rows.every(r => !r[0].startsWith('m:')), 'hero + allies, no monsters: ' + rows.map(r => r[0]).join()); assert.ok(rows.every(r => +r[2] > 10 && +r[2] < 70), 'plausible head %: ' + JSON.stringify(rows));
  assert.ok(await p.evaluate(() => !!document.querySelector('.banner') && !!document.querySelector('.figs .std')), 'banner + standard lines');
  // current cast is NOT uniform (Luna / Ren have small heads, Olwen a big one): the tool must flag at least one
  const flagged = await p.evaluate(() => document.querySelectorAll('.rt .chip.bad, .rt .chip.warn').length); assert.ok(flagged >= 3, 'flags the mismatching characters: ' + flagged);
  // drag the chin line of the hero: the numbers change and are remembered
  const before = await p.evaluate(() => +document.querySelector('.rt tr[data-c="hero"] td:nth-child(3)').textContent);
  const box = await p.evaluate(() => { const b = document.getElementById('pcv').getBoundingClientRect(); return [b.left, b.top, b.width, b.height] });
  const chinY = box[1] + 10 + (await p.evaluate(() => +document.getElementById('mChin').value)) / 100 * 300;
  await p.mouse.move(box[0] + box[2] / 2, chinY); await p.mouse.down(); await p.mouse.move(box[0] + box[2] / 2, chinY - 40, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(500);
  const after = await p.evaluate(() => +document.querySelector('.rt tr[data-c="hero"] td:nth-child(3)').textContent); assert.ok(after < before - 5, 'dragging the chin up shrinks the head %: ' + before + ' -> ' + after);
  assert.ok(await p.evaluate(() => !!JSON.parse(localStorage.getItem('proportion-marks-v1')).hero), 'marks remembered');
  await p.fill('#mChin', '30'); await p.dispatchEvent('#mChin', 'change'); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => +document.querySelector('.rt tr[data-c="hero"] td:nth-child(3)').textContent), 30, 'typing 30 % sets the head to 30 %');
  await p.click('#mAuto'); await p.waitForTimeout(400); assert.ok(await p.evaluate(() => !JSON.parse(localStorage.getItem('proportion-marks-v1')).hero), 'auto removes the manual marks');
  assert.deepEqual(errs, [], errs.join('|')); console.log('ok proportion tool', JSON.stringify(rows.slice(0, 3))); console.log('proportion tool e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
