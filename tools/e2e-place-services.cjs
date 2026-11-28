// v98.1196 · what the places SELL / DO, through the real buttons of place-interior.html (healer · shop · temple services, the inn's party panel + room rental, the healer's ward).
// Compares the state after each click with tools/golden/place-services.json (recorded before the rules moved to js/place-services.js).  Needs the game served on :8765 and Playwright.
// Usage: node tools/e2e-place-services.cjs [--record]     (--record rewrites the golden file from what the game does NOW — only after a deliberate rule change)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const GOLD = path.join(__dirname, 'golden', 'place-services.json'), RECORD = process.argv.includes('--record'), BASE = process.env.BASE || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1300, height: 760 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const out = { services: {}, panels: {} };
  const plan = { healer: ['heal', 'potion'], shop: ['potion', 'food'], temple: ['pray', 'offer', 'pray'] };
  for (const place of Object.keys(plan)) {
    await p.goto(BASE + 'place-interior.html?place=' + place + '&name=' + place + '&nc=' + Date.now()); await p.waitForTimeout(8000);
    await p.evaluate(() => { const S = VillageLife.save(); S.gold = 200; S.hp = 20; S.potions = 0; S.food = 0; S.prayDay = 0; S.prays = 0; S.fatigue = 50; VillageLife.writeSave(S) });
    const rows = [];
    for (const k of plan[place]) {
      await p.waitForTimeout(1300);
      const clicked = await p.evaluate(k => { const b = document.querySelector('[data-svc="' + k + '"]'); if (!b) return 'nobutton'; if (b.disabled) return 'disabled:' + b.title; b.click(); return 'ok' }, k); await p.waitForTimeout(500);
      rows.push({ k, clicked, ...(await p.evaluate(() => { const S = VillageLife.save(); return { gold: S.gold, hp: S.hp, potions: S.potions, food: S.food, prayDay: S.prayDay, prays: S.prays, fatigue: S.fatigue, toast: [...document.querySelectorAll('.in-toast')].map(t => t.textContent).join('|') } })) }) }
    out.services[place] = rows }
  await p.goto(BASE + 'place-interior.html?place=inn&name=inn&nc=' + Date.now()); await p.waitForTimeout(8000);
  await p.evaluate(() => { const S = VillageLife.save(); S.gold = 50; S.party = []; S.bench = [{ key: 'kier', name: 'เคียร์', hp: 10, max: 48, level: 1 }]; VillageLife.writeSave(S) }); await p.waitForTimeout(1500);
  const snap = () => p.evaluate(() => { const S = VillageLife.save(), g = WorldState.game(); return { gold: S.gold, party: S.party.map(m => m.key + ':' + m.hp), bench: S.bench.map(m => m.key + ':' + m.hp), day: g.day, toast: [...document.querySelectorAll('.in-toast')].map(t => t.textContent).join('|'), panel: !!document.querySelector('.in-party'), panelText: (document.querySelector('.in-party')?.innerText || '').replace(/\n/g, ' ').slice(0, 160) } });
  const P = out.panels; P.innBefore = await snap();
  await p.evaluate(() => document.querySelector('#inParty').click()); await p.waitForTimeout(400); P.innPanelOpen = await snap();
  await p.evaluate(() => document.querySelector('.in-party .slot[data-k="kier"]').click()); await p.waitForTimeout(500); P.innAfterMove = await snap();
  await p.evaluate(() => document.querySelector('#inPClose')?.click()); await p.waitForTimeout(300); P.innPanelClosed = await snap();
  await p.evaluate(() => document.querySelector('#inRoom').click()); await p.waitForTimeout(2500); P.innAfterRent = await snap();
  await p.goto(BASE + 'place-interior.html?place=healer&name=healer&nc=' + Date.now()); await p.waitForTimeout(8000);
  await p.evaluate(() => { const S = VillageLife.save(); S.gold = 200; VillageLife.writeSave(S); const g = WorldState.game(); Injury.force(g, 'hero', Object.keys(Injury.PARTS)[0], 'heavy'); WorldState.commit?.() }); await p.waitForTimeout(1500);
  const ws = () => p.evaluate(() => { const g = WorldState.game(), r = Injury.of(g, 'hero'); return { bed: !!(r && r.bed), gold: VillageLife.save().gold, dlg: !!document.querySelector('.in-dlg-bg'), btns: [...document.querySelectorAll('.in-dlg-bg [data-a]')].map(b => b.dataset.a).join(','), toast: [...document.querySelectorAll('.in-toast')].map(t => t.textContent).join('|') } });
  await p.evaluate(() => document.querySelector('#inWard').click()); await p.waitForTimeout(500); P.wardOpen = await ws();
  await p.evaluate(() => document.querySelector('.in-dlg-bg [data-a="admit"]')?.click()); await p.waitForTimeout(600); P.wardAdmit = await ws();
  await p.evaluate(() => document.querySelector('.in-dlg-bg [data-a="out"]')?.click()); await p.waitForTimeout(600); P.wardOut = await ws();
  await b.close();
  if (RECORD) { fs.writeFileSync(GOLD, JSON.stringify(out, null, 1)); console.log('recorded', GOLD); return }
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')); let bad = 0;
  const cmp = (a, c, n) => { const x = JSON.stringify(a), y = JSON.stringify(c); if (x !== y) { bad++; console.log('✗ ' + n + '\n   golden ' + x + '\n   now    ' + y) } else console.log('✓ ' + n) };
  for (const k of Object.keys(gold.services)) cmp(gold.services[k], out.services[k], 'services · ' + k);
  for (const k of Object.keys(gold.panels)) cmp(gold.panels[k], out.panels[k], 'panels · ' + k);
  if (errs.length) { bad++; console.log('✗ page errors', errs.slice(0, 3)) }
  console.log(bad ? '\nFAILED ' + bad : '\nall matched'); process.exit(bad ? 1 : 0) })();
