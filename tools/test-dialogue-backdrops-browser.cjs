/* Actual world-map renderer, with a test-only function probe injected by the HTTP route.
   Browser executable can be supplied on hosts without Playwright's downloaded Chromium. */
const { chromium } = require('playwright'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..'), BASE = process.env.BASE || 'http://127.0.0.1:8765/';
if (!process.env.CHROMIUM_PATH && !fs.existsSync(chromium.executablePath())) { console.log('SKIP dialogue browser: install Playwright Chromium or set CHROMIUM_PATH'); process.exit(0); }
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const p = await browser.newPage({ viewport: { width: 1366, height: 768 } }), errors = [], missing = [];
    p.on('pageerror', e => errors.push(e.message)); p.on('response', r => { if (r.status() >= 400 && r.url().includes('/scenes/dialogue/')) missing.push(r.url()); });
    await p.route('**/js/world-map.js?*', route => route.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(ROOT, 'js/world-map.js'), 'utf8').replace('  /* ---------- start ---------- */', '  window.__dialogueProbe={modal,closeModal,atDialogue};\n  /* ---------- start ---------- */') }));
    await p.goto(BASE + 'world-map.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => !!window.__dialogueProbe, { timeout: 30000 });
    await p.evaluate(() => { window.__dialogueProbe.closeModal(); });
    const show = async context => p.evaluate(ctx => {
      const Q = window.__dialogueProbe; window.__pendingDialogue = Q.atDialogue(ctx, () => Q.modal('<h2>ทดสอบสถานที่</h2><p>บทสนทนาตรงกับสถานที่</p>'));
      const el = document.querySelector('.wm-modal-bg'); return { key: el.dataset.dialogueLocation, background: el.style.background };
    }, context);
    const close = async () => { await p.locator('.wm-modal .acts button').first().click(); await p.evaluate(() => window.__pendingDialogue); };
    for (const [context, key] of [[{ town: 'willowshore', event: 'sickRefugee' }, 'refugee-camp'], [{ town: 'lakenhold', event: 'corvinInvite' }, 'royal-office'], [{ town: 'willowshore', service: 'st:clinic' }, 'war-clinic'], [{ location: 'deep-mine' }, 'deep-mine']]) {
      const r = await show(context); assert.equal(r.key, key); assert.ok(r.background.includes('/' + key + '.webp'));
      await p.evaluate(async k => { const im = new Image(); im.src = DialogueBackdrops.IMG[k]; await im.decode(); if (im.naturalWidth < 1500) throw Error(k); }, key);
      if (process.env.SCREENSHOT && key === 'royal-office') await p.screenshot({ path: process.env.SCREENSHOT });
      await close();
    }
    // A subsequent ordinary location must not retain the last event/service/ending scene.
    const next = await show({ town: 'lakenhold' }); assert.equal(next.key, 'lakenhold'); await close();
    await p.evaluate(() => { window.__dialogueProbe.modal('<p>กลับแมพเดิม</p>'); });
    assert.notEqual(await p.locator('.wm-modal-bg').getAttribute('data-dialogue-location'), 'deep-mine');
    await p.evaluate(() => window.__dialogueProbe.closeModal());
    assert.deepEqual(missing, []); assert.deepEqual(errors, []);
    console.log('PASS Chromium world-map: 4 authored locations decoded/rendered, context restored, no script errors or missing background requests');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
