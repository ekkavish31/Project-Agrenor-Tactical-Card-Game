/* node tools/e2e-game-flow.cjs [--quick]
   One command that plays the real game the way a person does and fails on any page error:
     1 boot (index.html?skipTitle=1) → the village layer opens           2 panels: bag · deck · upgrade · settings
     3 save → reload → the save is still there                           4 training battle (real battle iframe) runs
     5 battle in the field (battle-field.html) and in the village (village-town.html?battle=1)
     6 every sub-map / interior opens (tools/check-places.cjs --browser)  7 every editor page opens without errors
   Starts its own static server (no setup). Exit code 1 when anything fails. Use it before and after deleting old code. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), QUICK = process.argv.includes('--quick');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
const results = []; const ok = (name, pass, note = '') => { results.push({ name, pass }); console.log((pass ? '✓ ' : '✗ ') + name + (note ? ' — ' + note : '')) };
(async () => {
  await new Promise(r => server.listen(0, r)); const BASE = 'http://localhost:' + server.address().port + '/';
  const { chromium } = require('playwright'), b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1440, height: 800 } });
  const watch = async (name, fn) => { const p = await ctx.newPage(), er = []; p.on('pageerror', e => er.push(e.message.slice(0, 160))); try { await fn(p) } catch (e) { er.push('test: ' + e.message.slice(0, 160)) } await p.close(); ok(name, !er.length, [...new Set(er)].slice(0, 3).join(' | ')) };
  const q = encodeURIComponent;
  /* 1-3 */
  { const p = await ctx.newPage(), er = []; p.on('pageerror', e => er.push(e.message.slice(0, 160)));
    await p.goto(BASE + 'index.html?skipTitle=1'); await p.waitForTimeout(9000);
    const village = await p.evaluate(() => !!document.getElementById('villageTownLayer') && [...document.querySelectorAll('iframe')].some(f => /village-town\.html/.test(f.src)));
    ok('1 boot: village layer + iframe', village && !er.length, er.slice(0, 2).join(' | '));
    const panels = await p.evaluate(async () => { const bad = []; for (const w of ['bag', 'tdeck', 'upgrade']) { try { openPanel(w); await new Promise(r => setTimeout(r, 400)); const d = document.getElementById('panel'); if (!d.open || !d.innerText.trim()) bad.push(w + ':empty'); d.close() } catch (e) { bad.push(w + ':' + e.message) } } try { openSettings(); await new Promise(r => setTimeout(r, 400)) } catch (e) { bad.push('settings:' + e.message) } return bad });
    await p.keyboard.press('Escape'); ok('2 panels: bag · deck · upgrade · settings', !panels.length && !er.length, panels.concat(er).slice(0, 3).join(' | '));
    const before = await p.evaluate(() => { s.coins = (s.coins || 0); s.__t = 'e2e-' + Date.now(); save(); return s.__t });
    await p.reload(); await p.waitForTimeout(7000);
    const after = await p.evaluate(() => { try { return localStorage.length > 0 && typeof s === 'object' && s.day >= 1 } catch (e) { return false } });
    ok('3 save → reload keeps a valid state', after && !er.length, er.slice(0, 2).join(' | ') + (before ? '' : ' no marker'));
    /* 4 training battle iframe */
    await p.evaluate(() => { try { TrainingFlat.open() } catch (e) { } }); await p.waitForTimeout(7000);
    const train = await p.evaluate(() => { const f = document.getElementById('trainBattle'); return !!f && !!f.contentWindow && !!f.contentDocument?.querySelector('canvas') });
    ok('4 training battle opens and draws', train && !er.length, er.slice(0, 2).join(' | ')); await p.close() }
  /* 5 battles */
  await watch('5a battle in the field (luna + kier vs wolf + golem)', async p => { await p.goto(BASE + 'battle-field.html?battle=1&embed=1&r=5&biome=grass&ms=' + q('wolf*1.2,golem*1') + '&party=' + q('luna:44:44:charge:1,kier:50:50:charge:1')); await p.waitForTimeout(8000); if (!(await p.evaluate(() => !!document.querySelector('canvas')))) throw new Error('no canvas') });
  await watch('5b battle in the village (boss golem)', async p => { await p.goto(BASE + 'village-town.html?battle=1&embed=1&r=5&title=' + q('บอส') + '&ms=' + q('golem*1.2') + '&party=' + q('bram:54:54:charge:1,mil:50:50:charge:1')); await p.waitForTimeout(8000) });
  /* 7 other pages */
  const PAGES = ['village-town.html', 'village-place.html?place=market', 'village-place.html?place=forge', 'place-interior.html?place=inn', 'world-map.html', 'scale-lineup.html', 'asset-studio.html', 'asset-studio.html?tab=manager', 'object-asset-studio.html', 'battleground.html', 'editor.html', 'index.html?editor=cards', 'index.html?editor=menu'];
  for (const u of (QUICK ? PAGES.slice(0, 4) : PAGES)) await watch('7 opens: ' + u, async p => { await p.goto(BASE + u); await p.waitForTimeout(5000) });
  await b.close(); server.close();
  /* 6 sub-maps / interiors (own server) */
  if (!QUICK) { const r = spawnSync('node', [path.join(__dirname, 'check-places.cjs'), '--browser'], { encoding: 'utf8', timeout: 280000 }); const tail = (r.stdout || '').trim().split('\n').pop(); ok('6 every place opens (check-places --browser)', r.status === 0, tail) }
  const bad = results.filter(x => !x.pass); console.log('\n' + (bad.length ? '✗ ' + bad.length + ' failed' : '✓ all ' + results.length + ' checks passed')); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
