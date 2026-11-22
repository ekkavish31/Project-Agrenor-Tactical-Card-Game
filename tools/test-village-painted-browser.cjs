/* v98.946 · decode the actual PNGs and draw every trimmed cell in Chromium. */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright'), root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  if (req.url === '/probe') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><html><body style="background:#20372e"><canvas id="art" width="1000" height="1200"></canvas><script src="/js/webp-redirect.js"></script><script src="/js/village-painted-art.js"></script></body></html>'); }
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream'); fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser; try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true });
    const p = await browser.newPage(), errors = [], missing = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if (r.status() >= 400 && r.url().includes('/assets/')) missing.push(r.url()); });
    await p.goto('http://127.0.0.1:' + server.address().port + '/probe');
    const result = await p.evaluate(async () => {
      const A = window.VillagePaintedArt;
      const files = [...Object.keys(A.BG).map(k => A.background(k)), ...Object.values(A.PORTRAITS), A.BASE+'vendors.png', A.BASE+'farmprops.png'];
      await A.preload(files); await Promise.all(files.map(s => A.image(s).decode()));
      const g = document.querySelector('canvas').getContext('2d'), keys = [...A.VENDORS, ...A.PROPS];
      const cells = keys.map((name, i) => {
        const r = A.cell(name), painted = A.draw(g, name, 90 + i % 5 * 195, 185 + Math.floor(i/5) * 210, 120, i < 10 ? {height:155, flip:i%2===1} : {});
        return { name, painted, x:r.x, y:r.y, w:r.w, h:r.h, imageW:r.image.naturalWidth, imageH:r.image.naturalHeight };
      });
      return { cells, files:files.map(s=>({src:s,w:A.image(s).naturalWidth,h:A.image(s).naturalHeight})) };
    });
    assert.equal(result.cells.length, 22);
    for (const r of result.cells) { assert.ok(r.painted, r.name); assert.ok(r.x+r.w<=r.imageW && r.y+r.h<=r.imageH, r.name); assert.ok(r.w>20 && r.h>20, r.name); }
    for (const f of result.files) assert.ok(f.w>=1000 && f.h>=700, f.src);
    assert.deepEqual(errors, []); assert.deepEqual(missing, [], 'PNG bypass must not request nonexistent WebP twins');
    console.log('PASS Chromium: all 11 images decoded; all 22 alpha-trimmed atlas cells rendered; no script errors or missing asset requests');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e=>{console.error(e);process.exitCode=1});
