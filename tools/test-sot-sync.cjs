/* v98.866 · single source of truth between TWO computers (two browser profiles = two separate localStorage):
   pushed data (js/game-settings.js + js/village-layout-v67.js) is the truth · a browser only keeps drafts · a push makes the pushed value the new base.
   Run: node tools/test-sot-sync.cjs  (starts its own static server; the "web" files are fixtures served from memory) */
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm'), ROOT = path.join(__dirname, '..');
let WEB = { gs: {}, layout: null };
const page = '<!doctype html><meta charset="utf-8"><script src="js/editor-store.js"></script><script src="_web_settings.js"></script><script src="_web_layout.js"></script><body>t</body>';
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/_sot.html') { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return r.end(page) }
  if (u === '/_web_settings.js') { r.writeHead(200, { 'content-type': 'application/javascript', 'cache-control': 'no-store' }); return r.end('window.GAME_SETTINGS=' + JSON.stringify(WEB.gs, null, 1) + ';') }
  if (u === '/_web_layout.js') { r.writeHead(200, { 'content-type': 'application/javascript', 'cache-control': 'no-store' }); return r.end(WEB.layout ? 'window.VillageDefaultLayout=' + JSON.stringify(WEB.layout, null, 2) + ';' : '') }
  const f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() }
  r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(r)
});
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++ };
const LAY = 'project-a-village-editor-v67', POS = 'project-a-village-main-v1';
(async () => {
  await new Promise(r => srv.listen(0, r)); const URL0 = 'http://localhost:' + srv.address().port + '/_sot.html';
  const { chromium } = require('playwright'), b = await chromium.launch();
  try {
    const work = await (await b.newContext()).newPage(), home = await (await b.newContext()).newPage();
    const get = (p, k) => p.evaluate(k => localStorage.getItem(k), k), J = (p, k) => get(p, k).then(v => JSON.parse(v));
    /* the web before anything */
    WEB = { gs: { 'place-maps-v1': '{"a":1}' }, layout: { places: { inn: { x: 1 } } } };
    await work.goto(URL0); await home.goto(URL0);
    ok((await get(work, 'place-maps-v1')) === '{"a":1}', 'both computers start from the pushed value');
    /* at work: edit settings, the village layout and a data key that was never pushed */
    await work.evaluate(([L, P]) => { localStorage.setItem('place-maps-v1', '{"a":2}'); localStorage.setItem(L, JSON.stringify({ places: { inn: { x: 2 } } })); localStorage.setItem(P, '{"inn":{"x":2}}'); localStorage.setItem('proportion-rulers-v1', '{"r":1}') }, [LAY, POS]);
    const d1 = await work.evaluate(() => ({ d: EditorStore.drafts(), l: EditorStore.layoutDraft() }));
    ok(d1.d.includes('place-maps-v1') && d1.d.includes('proportion-rulers-v1') && d1.l, 'work: unpushed edits are listed as drafts (' + d1.d.join(', ') + (d1.l ? ' + layout' : '') + ')');
    /* push from work (what js/github-push.js writes) */
    const pushed = await work.evaluate(L => {
      const gs = { ...window.GAME_SETTINGS }; for (const k of EditorStore.drafts()) gs[k] = localStorage.getItem(k);
      const files = [{ path: 'js/game-settings.js', content: '// x\nwindow.GAME_SETTINGS=' + JSON.stringify(gs, null, 1) + ';\n' }, { path: 'js/village-layout-v67.js', content: '// x\nwindow.VillageDefaultLayout=' + JSON.stringify(JSON.parse(localStorage.getItem(L)), null, 2) + ';\n' }];
      EditorStore.afterPush(files); return { gs, layout: JSON.parse(localStorage.getItem(L)) }
    }, LAY);
    WEB = pushed;
    const d2 = await work.evaluate(() => ({ d: EditorStore.drafts(), l: EditorStore.layoutDraft() }));
    ok(!d2.d.length && !d2.l, 'work: after the push nothing is a draft any more');
    /* at home: reload → everything from work */
    await home.reload();
    ok((await get(home, 'place-maps-v1')) === '{"a":2}', 'home: settings edited at work arrive');
    ok((await get(home, 'proportion-rulers-v1')) === '{"r":1}', 'home: a data key first pushed from work arrives');
    ok((await J(home, LAY))?.places?.inn?.x === 2 || (await get(home, LAY)) === null, 'home: the village layout from work is used');
    /* home had an OLD layout copy of its own (before this version: no base) that was in step with the web then → the web wins */
    await home.evaluate(([L, P]) => { localStorage.setItem(L, JSON.stringify({ places: { inn: { x: 1 } } })); localStorage.removeItem('es-base:' + L); const s = JSON.parse(localStorage.getItem('project-a-settings-seen') || '{}'); delete s[L]; localStorage.setItem('project-a-settings-seen', JSON.stringify(s));
      const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(i => [i, x[i]])) : x), h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return (x >>> 0).toString(36) };
      const v = h(canon({ places: { inn: { x: 1 } } })); localStorage.setItem('project-a-layout-sync-v1', JSON.stringify({ layout: { rem: v, loc: v } })); localStorage.setItem(P, '{"inn":{"x":1}}') }, [LAY, POS]);
    await home.reload();
    ok((await J(home, LAY)).places.inn.x === 2, 'home: an old layout copy without edits no longer beats the push');
    ok((await get(home, POS)) === '{}', 'home: old place positions are dropped (rebuilt from the layout)');
    /* old layout copy WITH edits (sync pill did not see it in step) → kept as a draft on top of the web */
    await home.evaluate(L => { localStorage.setItem(L, JSON.stringify({ places: { inn: { x: 2 }, well: { x: 7 } } })); localStorage.removeItem('es-base:' + L); localStorage.removeItem('project-a-layout-sync-v1') }, LAY);
    WEB = { ...WEB, layout: { places: { inn: { x: 3 } } } };
    await home.reload();
    const l3 = await J(home, LAY); ok(l3.places.inn.x === 2 && l3.places.well.x === 7, 'home: an old edited layout copy is kept as a draft, nothing lost');
    ok(await home.evaluate(() => EditorStore.layoutDraft()), 'home: …and shows as unpushed');
    /* both edit: home adds b, work pushes a=3 → home gets a=3 and keeps b */
    await home.evaluate(() => localStorage.setItem('place-maps-v1', '{"a":2,"b":1}'));
    WEB = { ...WEB, gs: { ...WEB.gs, 'place-maps-v1': '{"a":3}' } };
    await home.reload();
    ok((await get(home, 'place-maps-v1')) === '{"a":3,"b":1}', 'home: newer push + own draft = both');
    /* throw the draft away → the pushed value */
    await home.evaluate(async () => { await EditorStore.discard('place-maps-v1') });
    ok((await get(home, 'place-maps-v1')) === '{"a":3}', 'home: discarding a draft returns to the pushed value');
    ok(!(await home.evaluate(() => EditorStore.drafts().includes('place-maps-v1'))), 'home: …and it is no longer a draft');
    /* a value only re-ordered is not a draft */
    await home.evaluate(() => localStorage.setItem('place-maps-v1', JSON.stringify({ a: 3 }, null, 2)));
    ok(!(await home.evaluate(() => EditorStore.drafts().includes('place-maps-v1'))), 'same data written with other spacing is not a draft');
  } finally { await b.close(); srv.close() }
  /* the manifest is always written from one parsed object: repeated keys (v98.807) cannot be pushed again */
  const src = fs.readFileSync(path.join(ROOT, 'js/github-push.js'), 'utf8'), pick = n => { const i = src.indexOf(n); let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && !--d) break } return src.slice(i, j + 1) };
  const ctx = { Blob, JSON }; vm.createContext(ctx);
  vm.runInContext("const MANIFEST_HEAD='/* h */\\nwindow.ASSET_MANIFEST=';const manifestFiles=m=>[{path:'data/asset-manifest.json',content:JSON.stringify(m,null,1)+'\\n'},{path:'js/asset-manifest.js',content:MANIFEST_HEAD+JSON.stringify(m)+';\\n'}];" + pick('async function canonicalFiles') + ';this.canonicalFiles=canonicalFiles', ctx);
  const dup = '{"studioReviews":{"x":{"status":"unreviewed"},"y":1,"x":{"status":"approved"}}}';
  const out = await ctx.canonicalFiles([{ path: 'data/asset-manifest.json', content: dup }, { path: 'a.txt', content: 'k' }]);
  const j = out.find(f => f.path === 'data/asset-manifest.json').content, s = out.find(f => f.path === 'js/asset-manifest.js');
  ok((j.match(/"x"/g) || []).length === 1 && !!s, 'manifest with a repeated key is pushed once per key, and both manifest files are written');
  console.log(bad ? '\n✗ ' + bad + ' failed' : '\n✓ all passed'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
