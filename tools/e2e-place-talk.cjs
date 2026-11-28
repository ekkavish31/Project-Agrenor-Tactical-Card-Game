// v98.1197 · the conversation system of the places (talk window · topics · gifts · drinks · recruit try) through the real buttons of place-interior.html, compared with tools/golden/place-talk.json
// (recorded BEFORE it moved from js/interior.js to js/place-services.js).  Needs the game on :8765 and Playwright.  Usage: node tools/e2e-place-talk.cjs [--record]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const GOLD = path.join(__dirname, 'golden', 'place-talk.json'), RECORD = process.argv.includes('--record'), BASE = process.env.BASE || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1300, height: 760 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); const out = {};
  await p.goto(BASE + 'place-interior.html?place=inn&name=inn&nc=' + Date.now()); await p.waitForTimeout(8000);
  await p.evaluate(() => { const S = VillageLife.save(); S.gold = 100; S.potions = 1; S.food = 2; S.party = []; S.bench = []; VillageLife.writeSave(S); window.__S0 = JSON.stringify(VillageLife.save()); const v = WorldState.game().village; window.__W0 = JSON.stringify({ coins: v.coins, mats: v.materials, bag: v.bag, gold: WorldState.game().gold }) }); await p.waitForTimeout(1200);
  const dlg = () => p.evaluate(() => ({ dlg: !!document.querySelector('.in-dlg-bg'), h2: document.querySelector('.in-dlg h2')?.innerText, role: document.querySelector('.in-dlg .role')?.innerText, acts: [...document.querySelectorAll('.in-dlg .acts button')].map(b => (b.dataset.a || '') + '=' + b.innerText.replace(/\n/g, ' ') + (b.disabled ? '(off)' : '')) }));
  const diff = () => p.evaluate(() => { const a = JSON.parse(window.__S0), c = VillageLife.save(), d = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(c)])) { const x = JSON.stringify(a[k]), y = JSON.stringify(c[k]); if (x !== y && !/^(at|t|time|stamp|saved)/i.test(k)) d[k] = y?.slice(0, 120) } window.__S0 = JSON.stringify(c); const v = WorldState.game().village, w = JSON.stringify({ coins: v.coins, mats: v.materials, bag: v.bag, gold: WorldState.game().gold }); if (w !== window.__W0) { d.W = w; window.__W0 = w } return d });
  const aff = id => p.evaluate(id => Math.round((Mind.npc(id).aff || 0) * 100) / 100, id);
  const open = async id => { await p.evaluate(id => document.querySelector('.who [data-id="' + id + '"]').click(), id); for (let i = 0; i < 20; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !!document.querySelector('.in-dlg-bg'))) break } await p.waitForTimeout(300) };
  const click = async a => { await p.evaluate(a => document.querySelector('.in-dlg .acts [data-a="' + a + '"]')?.click(), a); await p.waitForTimeout(600) };
  for (const id of ['marta', 'finn', 'luna']) { await open(id); out['open_' + id] = await dlg(); await click('bye'); out['closed_' + id] = (await dlg()).dlg }
  await open('olwen'); out.olwen_open = await dlg(); await diff();
  await click('service'); out.olwen_service = await dlg();
  await click('drink'); out.olwen_drink = { diff: await diff(), aff: await aff('olwen'), dlg: await dlg() };
  await click('recruit'); out.olwen_recruit_try = { diff: await diff(), dlg: await dlg(), toast: await p.evaluate(() => [...document.querySelectorAll('.in-toast')].map(t => t.textContent).join('|')) };
  await click('talk'); await click('gift'); out.olwen_gift = await dlg(); await click('gift:gold'); out.olwen_gift_gold = { diff: await diff(), aff: await aff('olwen') };
  await click('talk'); await click('chat'); out.olwen_chat = await dlg();

  // ---- evening: 3 drinks → recruit (joinNow)
  await p.goto(BASE + 'place-interior.html?place=inn&name=inn&nc=' + Date.now()); await p.waitForTimeout(7000);
  await p.evaluate(() => { WorldState.game().minutes = 1160; const S = VillageLife.save(); S.gold = 100; S.party = []; S.bench = []; VillageLife.writeSave(S); window.__S0 = JSON.stringify(VillageLife.save()); const v = WorldState.game().village; window.__W0 = JSON.stringify({ coins: v.coins, mats: v.materials, bag: v.bag, gold: WorldState.game().gold }) }); await p.waitForTimeout(2500);
  await open('olwen'); out.eve_open = await dlg();
  for (let i = 1; i <= 3; i++) { await click('service'); out['eve_service' + i] = await dlg(); await click('drink'); out['eve_drink' + i] = { diff: await diff(), aff: await aff('olwen'), toast: await p.evaluate(() => [...document.querySelectorAll('.in-toast')].map(t => t.textContent).join('|')), acts: (await dlg()).acts } }
  await click('service'); out.eve_service_after = await dlg(); await click('recruit');
  out.eve_recruit = { diff: await diff(), party: await p.evaluate(() => VillageLife.save().party.map(m => m.key)), dlg: await dlg(), toast: await p.evaluate(() => [...document.querySelectorAll('.in-toast')].map(t => t.textContent).join('|')) };
  await b.close();
  if (RECORD) { fs.writeFileSync(GOLD, JSON.stringify(out, null, 1)); console.log('recorded', GOLD); return }
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')); let bad = 0;
  for (const k of Object.keys(gold)) { const x = JSON.stringify(gold[k]), y = JSON.stringify(out[k]); if (x !== y) { bad++; console.log('✗ ' + k + '\n   golden ' + x + '\n   now    ' + y) } else console.log('✓ ' + k) }
  if (errs.length) { bad++; console.log('✗ page errors', errs.slice(0, 3)) }
  console.log(bad ? '\nFAILED ' + bad : '\nall matched'); process.exit(bad ? 1 : 0) })();
