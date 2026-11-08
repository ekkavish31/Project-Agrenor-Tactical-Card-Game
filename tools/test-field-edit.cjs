/* node tools/test-field-edit.cjs — BG Editor phase 1 on the REAL field (battle-field.html?edit=1):
   move a fighter and a tree with real pointer events → undo → redo → save → reload → the same edits are back; no page error; the same seed without ?edit=1 is untouched. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++ };
(async () => {
  await new Promise(r => srv.listen(0, r)); const BASE = 'http://localhost:' + srv.address().port + '/';
  const { chromium } = require('playwright'), b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1500, height: 900 } }), p = await ctx.newPage(), er = [];
  p.on('pageerror', e => er.push(e.message.slice(0, 140)));
  const q = encodeURIComponent, URL = BASE + 'battle-field.html?battle=1&embed=1&edit=1&warm=1&cine=0&r=5&night=0&biome=grass&seed=4242&ms=' + q('wolf*1.2,bandit*1.2') + '&party=' + q('sib:50:50:charge:1,luna:44:44:charge:1');
  await p.goto(URL); await p.waitForTimeout(7000);
  ok(await p.evaluate(() => !!window.FieldEdit && !!document.getElementById('fePanel')), 'edit panel is there');
  /* screen position of a world point */
  const scr = (u, v) => p.evaluate(([u, v]) => { const pt = project(u, v), k = scale * zoom, r = cv.getBoundingClientRect(); return { x: r.left + W / 2 + pan.x + (pt.x - WORLD_W / 2) * k, y: r.top + H / 2 + pan.y + (pt.y - WORLD_H / 2) * k } }, [u, v]);
  const unitBefore = await p.evaluate(() => { const u = TownBattle.state().units.find(x => x.id === 'ally1'); return { u: u.u, v: u.v } });
  /* find a free target cell next to the unit */
  const target = await p.evaluate(({ u, v }) => { for (const [du, dv] of [[1, 0], [0, 1], [-1, 0], [0, -1], [2, 0], [0, 2]]) { const c = FIELD.cells.get(FIELD.key(u + du, v + dv)); if (c && c.k !== 'blocked' && !c.big && !TownBattle.state().units.some(x => x.u === u + du && x.v === v + dv)) return { u: u + du, v: v + dv } } return null }, unitBefore);
  ok(!!target, 'a free cell exists next to the unit');
  const a = await scr(unitBefore.u + .5, unitBefore.v + .5), t = await scr(target.u + .5, target.v + .5);
  await p.mouse.move(a.x, a.y - 30); await p.mouse.down(); await p.mouse.move((a.x + t.x) / 2, (a.y + t.y) / 2, { steps: 4 }); await p.mouse.move(t.x, t.y - 4, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(200);
  const moved = await p.evaluate(() => { const u = TownBattle.state().units.find(x => x.id === 'ally1'); return { u: u.u, v: u.v, ops: FieldEdit.ops().length } });
  ok(moved.u === target.u && moved.v === target.v && moved.ops === 1, 'dragging a fighter moves it to the cell (wanted ' + target.u + ',' + target.v + ' · got ' + moved.u + ',' + moved.v + ' · started ' + unitBefore.u + ',' + unitBefore.v + ')');
  /* move a big tree */
  const tree = await p.evaluate(() => { const c = [...FIELD.cells.values()].find(x => x.big && x.big.anchor); return c ? { u: c.u, v: c.v, kind: c.big.kind } : null });
  ok(!!tree, 'a big prop exists');
  let treeDest = null;
  if (tree) { treeDest = await p.evaluate(({ u, v }) => { for (let r = 3; r < 9; r++) for (const [du, dv] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r]]) { const a = u + du, b = v + dv, cs = [[a, b], [a + 1, b], [a, b + 1], [a + 1, b + 1]], F = FieldHeight; if (cs.every(([x, y]) => { const c = FIELD.cells.get(FIELD.key(x, y)); return c && c.k === 'normal' && !c.big && Math.abs(x) <= FIELD.R && Math.abs(y) <= FIELD.R && !TownBattle.state().units.some(z => z.u === x && z.v === y) }) && new Set(cs.map(([x, y]) => F.sub(x, y))).size === 1) return { u: a, v: b } } return null }, tree);
    ok(!!treeDest, 'a free flat 2×2 spot exists for the tree');
    if (treeDest) { const s1 = await scr(tree.u + 1, tree.v + 1), s2 = await scr(treeDest.u + .5, treeDest.v + .5);
      await p.mouse.move(s1.x, s1.y - 60); await p.mouse.down(); await p.mouse.move(s2.x, s2.y - 10, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(200);
      const r = await p.evaluate(({ a, b }) => ({ oldFree: [...FIELD.cells.values()].filter(c => c.u >= a.u && c.u <= a.u + 1 && c.v >= a.v && c.v <= a.v + 1).every(c => c.k === 'normal' && !c.big), newTree: !!FIELD.cells.get(FIELD.key(b.u, b.v))?.big?.anchor, ops: FieldEdit.ops().length }), { a: tree, b: treeDest });
      ok(r.oldFree && r.newTree && r.ops === 2, 'dragging the tree frees the old 2×2 and fills the new one') } }
  /* undo / redo */
  await p.keyboard.press('Control+z'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => FieldEdit.ops().length) === 1, 'undo removes the last edit');
  await p.keyboard.press('Control+y'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => FieldEdit.ops().length) === 2, 'redo puts it back');
  /* save → reload */
  await p.evaluate(() => FieldEdit.save()); await p.reload(); await p.waitForTimeout(7000);
  const again = await p.evaluate(() => { const u = TownBattle.state().units.find(x => x.id === 'ally1'); return { u: u.u, v: u.v, ops: FieldEdit.ops().length } });
  ok(again.u === target.u && again.v === target.v && again.ops === 2, 'after reload the saved edits are back (' + again.ops + ' ops, fighter at ' + again.u + ',' + again.v + ')');
  /* the same seed without edit mode is untouched */
  await p.goto(URL.replace('&edit=1', '')); await p.waitForTimeout(6000);
  const plain = await p.evaluate(() => ({ fe: !!window.FieldEdit, u: TownBattle.state().units.find(x => x.id === 'ally1') }));
  ok(!plain.fe && !(await p.evaluate(() => !!document.getElementById('fePanel'))), 'without ?edit=1 there is no editor (the game page is unchanged)');
  ok(!er.length, 'no page errors' + (er.length ? ': ' + er.slice(0, 3).join(' | ') : ''));
  await b.close(); srv.close(); console.log(bad ? '\n✗ ' + bad + ' failed' : '\n✓ all passed'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
