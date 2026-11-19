/* v98.858 · js/editor-store.js: (1) two tabs editing the same value never wipe each other's work · (2) loading = pushed value + drafts · (3) backups
   Run: node tools/test-editor-store.cjs  (starts its own static server) */
const http = require('http'), fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r) });
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++ };
(async () => {
  await new Promise(r => srv.listen(0, r)); const BASE = 'http://localhost:' + srv.address().port + '/';
  fs.writeFileSync(path.join(ROOT, '_es_test.html'), '<!doctype html><meta charset="utf-8"><script src="js/editor-store.js"></script><body>t</body>');
  const { chromium } = require('playwright'), b = await chromium.launch(), ctx = await b.newContext();
  try {
    const A = await ctx.newPage(), B = await ctx.newPage();
    await A.goto(BASE + '_es_test.html'); await B.goto(BASE + '_es_test.html');
    // 1a · objects: tab A read early, tab B adds a frame, tab A writes its stale copy + its own frame → both kept
    await A.evaluate(() => { localStorage.setItem('k1', JSON.stringify({ lamp: { zo: [[0, 0]] }, tree: { zo: [[1, 1]] } })) });
    await A.evaluate(() => { window.mem = JSON.parse(localStorage.getItem('k1')) });
    await B.evaluate(() => { const m = JSON.parse(localStorage.getItem('k1')); m.well = { zb: [[2, 2]] }; m.tree.zo = [[5, 5]]; localStorage.setItem('k1', JSON.stringify(m)) });
    await A.evaluate(() => { mem.bench = { zo: [[3, 3]] }; localStorage.setItem('k1', JSON.stringify(mem)) });
    const r1 = await A.evaluate(() => JSON.parse(localStorage.getItem('k1')));
    ok(r1.well && r1.bench && r1.lamp, 'stale tab keeps the other tab\'s new item and adds its own (' + Object.keys(r1).join(',') + ')');
    ok(JSON.stringify(r1.tree.zo) === '[[5,5]]', 'the other tab\'s change to an item the stale tab did not touch stays');
    // 1b · arrays of props (sub-map): B edits prop 1, A (stale) edits prop 0
    await A.evaluate(() => { localStorage.setItem('k2', JSON.stringify({ m: { props: [{ art: 'a' }, { art: 'b' }] } })); window.m2 = JSON.parse(localStorage.getItem('k2')) });
    await B.evaluate(() => { const m = JSON.parse(localStorage.getItem('k2')); m.m.props[1].zo = [[9, 9]]; localStorage.setItem('k2', JSON.stringify(m)) });
    await A.evaluate(() => { m2.m.props[0].zb = [[4, 4]]; localStorage.setItem('k2', JSON.stringify(m2)) });
    const r2 = await A.evaluate(() => JSON.parse(localStorage.getItem('k2')).m.props);
    ok(r2[0].zb && r2[1].zo, 'props array: both tabs\' frames survive');
    // 1c · a stale tab that changed nothing does not wipe newer work
    await A.evaluate(() => { window.m3 = JSON.parse(localStorage.getItem('k1')) });
    await B.evaluate(() => { const m = JSON.parse(localStorage.getItem('k1')); m.gate = 1; localStorage.setItem('k1', JSON.stringify(m)) });
    await A.evaluate(() => localStorage.setItem('k1', JSON.stringify(m3)));
    ok(await A.evaluate(() => JSON.parse(localStorage.getItem('k1')).gate === 1), 'an unchanged stale copy written back does not delete newer work');
    // 1d · a deletion made by this page is kept
    await A.evaluate(() => { const m = JSON.parse(localStorage.getItem('k1')); delete m.lamp; localStorage.setItem('k1', JSON.stringify(m)) });
    ok(await A.evaluate(() => !JSON.parse(localStorage.getItem('k1')).lamp), 'a deletion by this page is applied');
    // 2 · loading
    const seed = (GS, before) => A.evaluate(([GS, before]) => { for (const [k, v] of Object.entries(before)) v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); EditorStore.seed(GS); return Object.fromEntries(Object.keys(GS).map(k => [k, localStorage.getItem(k)])) }, [GS, before]);
    let r = await seed({ s1: '{"a":1}' }, { s1: null, 'es-base:s1': null });
    ok(r.s1 === '{"a":1}', 'empty browser → takes the pushed value');
    r = await seed({ s1: '{"a":2}' }, {});
    ok(r.s1 === '{"a":2}', 'no draft + newer push → newer push loads');
    r = await seed({ s1: '{"a":2}' }, { s1: '{"a":2,"mine":1}' });
    ok(r.s1 === '{"a":2,"mine":1}', 'draft + unchanged push → the draft stays');
    r = await seed({ s1: '{"a":3}' }, {});
    ok(JSON.parse(r.s1).a === 3 && JSON.parse(r.s1).mine === 1, 'draft + newer push → both (push\'s change + my draft)');
    ok(await A.evaluate(() => EditorStore.drafts.length !== undefined), 'drafts() exists');
    // old browser copy (pre-EditorStore): edited, base unknown → nothing lost from either side
    r = await A.evaluate(() => { localStorage.removeItem('es-base:s2'); localStorage.setItem('project-a-settings-seen', JSON.stringify({ s2: 'zzz' })); localStorage.setItem('s2', '{"mine":1,"x":1}'); EditorStore.seed({ s2: '{"x":2,"web":1}' }); return JSON.parse(localStorage.getItem('s2')) });
    ok(r.mine === 1 && r.web === 1, 'old edited browser copy + newer push → keeps both (' + JSON.stringify(r) + ')');
    // 3 · backups
    await A.waitForTimeout(300);
    const nb = await A.evaluate(async () => (await EditorStore.backups('s1')).length);
    ok(nb >= 1, 'replaced values are backed up (' + nb + ')');
    ok(await A.evaluate(() => EditorStore.merges() >= 1), 'merges counted');
  } finally { await b.close(); srv.close(); fs.unlinkSync(path.join(ROOT, '_es_test.html')) }
  console.log(bad ? '\n✗ ' + bad + ' failed' : '\n✓ all passed'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(path.join(ROOT, '_es_test.html')) } catch (x) { } process.exit(1) });
