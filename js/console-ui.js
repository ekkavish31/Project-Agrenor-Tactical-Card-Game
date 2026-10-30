/* v97.10 · Console feel for every page (index, village, world map, battle field):
   • UI sounds: a soft tick when the pointer or the focus moves onto a button, a click on press, a lower tone for close / cancel
     (code-synthesised, quiet; off with localStorage 'projectA.uiSfx' = '0' or reduced motion does not matter here).
   • Gamepad (Gamepad API): D-pad / left stick = arrow keys, A = Enter, B = Escape, X = Z (undo), Y = A (auto), LB / RB = Q / E (camera),
     Start = Escape (menu), Select = Tab. Only the page that has focus reads the pad, so frames never double a press.
   • Arrow-key menus: when a dialog / menu is open (or a button already has focus) the arrows move the focus to the nearest button
     in that direction and Enter presses it — the way a console menu works. The game's own arrow uses (facing, cutscenes) come first.
   • Village main menu: Esc in the village opens one menu with every toolbar action (journal, bag, character, deck, adventure, settings,
     activities, elements, fullscreen), so the icon row is not the only way in. */
(function () {
  'use strict';
  if (window.ConsoleUI) return;
  const store = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } } };

  /* ---------- UI sounds ---------- */
  let ac = null, lastTick = 0;
  function tone(freqs, vol, type = 'sine', len = .09) {
    if (store.get('projectA.uiSfx') === '0') return;
    try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * .045; o.type = type; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.04, t0 + len);
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + len); o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + len + .02) }) } catch (e) { }
  }
  const SFX = { move: () => { const n = performance.now(); if (n - lastTick < 45) return; lastTick = n; tone([1320], .012, 'sine', .05) }, ok: () => tone([660, 990], .03, 'triangle', .1), back: () => tone([520, 390], .026, 'triangle', .1) };
  const isBtn = el => el && el.closest?.('button:not(:disabled),[role=button],a[href],.fb-card,.ts-menu button');
  const isBack = el => /✕|ยกเลิก|ปิด|close|cancel|ไม่|ถอย|กลับ/i.test((el.textContent || el.title || '').slice(0, 24)) || el.classList?.contains('ghost') || el.classList?.contains('no');
  let hovered = null;
  addEventListener('pointerover', e => { const b = isBtn(e.target); if (b && b !== hovered) { hovered = b; SFX.move() } }, true);
  addEventListener('focusin', e => { const b = isBtn(e.target); if (b && b !== hovered) { hovered = b; SFX.move() } }, true);
  addEventListener('click', e => { const b = isBtn(e.target); if (b) (isBack(b) ? SFX.back : SFX.ok)() }, true);

  /* ---------- arrow-key / pad menus ---------- */
  const MODALS = '#fbPause .box,#fbFace,.wm-res,.wm-modal,dialog[open],.game-dialog,#cuMenu .box,#titleScreen .ts-extra:not([hidden]),#titleScreen .ts-name:not([hidden])';
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== 'hidden' };
  function scope() { const ms = [...document.querySelectorAll(MODALS)].filter(visible); return ms[ms.length - 1] || null }
  function buttonsIn(root) { return [...root.querySelectorAll('button:not(:disabled),a[href],input,[role=button],[tabindex]:not([tabindex="-1"])')].filter(visible) }
  function moveFocus(dir) {
    const sc = scope(), act = document.activeElement, inScope = act && act !== document.body && (!sc || sc.contains(act)) && isBtn(act);
    if (!sc && !inScope) return false;
    const list = buttonsIn(sc || document.body); if (!list.length) return false;
    if (!inScope) { list[0].focus({ preventScroll: true }); return true }
    const a = act.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, D = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[dir];
    let best = null, bs = 1e9;
    for (const b of list) { if (b === act) continue; const r = b.getBoundingClientRect(), dx = r.left + r.width / 2 - ax, dy = r.top + r.height / 2 - ay, along = dx * D[0] + dy * D[1]; if (along <= 4) continue;
      const side = Math.abs(dx * D[1] - dy * D[0]), s = along + side * 2.2; if (s < bs) { bs = s; best = b } }
    if (best) { best.focus({ preventScroll: false }); return true } return false;
  }
  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.target.closest?.('input,textarea,select')) return;
    if (/^Arrow/.test(e.key) && moveFocus(e.key)) { e.preventDefault() }
  });
  const css = document.createElement('style');
  css.textContent = `:focus-visible{outline:2px solid #ffd25a!important;outline-offset:2px}
  #cuMenu{position:fixed;inset:0;z-index:2100;display:grid;place-items:center;background:#05080dc4;backdrop-filter:blur(3px);font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
  #cuMenu .box{display:grid;grid-template-columns:repeat(2,minmax(150px,1fr));gap:8px;padding:18px;border-radius:14px;background:#14231ff7;border:1px solid #b9c48a77;box-shadow:0 16px 40px #000a;max-width:92vw}
  #cuMenu .box.one{grid-template-columns:minmax(260px,420px)}#cuMenu button small{color:#cdbb92;font-weight:400}#cuMenu button:disabled{opacity:.45;cursor:default}
  #cuMenu h2{grid-column:1/-1;margin:0 0 4px;color:#f3e9c9;font-size:18px}#cuMenu small{grid-column:1/-1;color:#cdbb92;font-size:12px}
  #cuMenu button.cu-group{display:flex;flex-direction:column;gap:2px;font-size:16px;padding:13px 16px}#cuMenu button.cu-group small{grid-column:auto;font-size:12px}#cuMenu button.cu-back{background:none;border-style:dashed}#cuMenu button{padding:11px 14px;border-radius:10px;border:1px solid #b9c48a66;background:#1b302a;color:#f3e9c9;font:600 14px inherit;font-family:inherit;text-align:left;cursor:pointer}#cuMenu button:hover,#cuMenu button:focus-visible{background:#2d4a40}`;
  document.head.append(css);

  /* ---------- village main menu (Esc) ---------- */
  /* v97.85 · your farm in Fernvale (js/estates.js · town:fernvale), walked into straight from the village */
  function farmHere() { try { return ((parent.WorldState || window.WorldState)?.world()?.estates || []).find(p => p.at === 'town:fernvale' && p.kind === 'farm') || null } catch (e) { return null } }
  function villageMenu() {
    const old = document.getElementById('cuMenu'); if (old) { old.remove(); return true }
    if (!document.querySelector('[data-game]')) return false;   // town-ux moves the toolbar buttons into its icon row (#townGameMenu)
    /* v98.4 · three groups instead of 16 buttons (docs/UI-BRUSHUP.md): the first screen shows ตัวเรา · ชีวิต · ระบบ · กลับไปเล่น,
       a group opens in place (← กลับ returns). Every item still clicks the same button / opens the same window as before. */
    const q = sel => document.querySelector(sel), go = q('.town-go') || q('[data-game="adventure"]');
    const openFarm = () => { const f = farmHere(); if (f) location.href = 'place-interior.html?place=farm&farm=' + encodeURIComponent(f.id) + '&name=' + encodeURIComponent('ไร่ · ' + f.name) + '&back=village-town.html' };
    const host = n => { try { return parent[n] || window[n] } catch (e) { return window[n] } };
    const item = (label, fn, ok = true) => ok ? { label, fn } : null;
    const GROUPS = [
      ['me', '👤 ตัวเรา', 'ตัวละคร · อาชีพ · สำรับ · กระเป๋า', () => [item('ตัวละคร', () => q('[data-game="character"]')?.click()), item('⚔ อาชีพ', () => host('JobsUI')?.open()), item('สำรับ', () => q('[data-game="deck"]')?.click()), item('กระเป๋า', () => q('[data-game="bag"]')?.click()), item('◈ ตารางธาตุ', () => q('#elChart')?.click(), !!q('#elChart'))]],
      ['life', '🏡 ชีวิต', 'สมุดหมู่บ้าน · กิจกรรม · ไร่ · หมู่บ้าน', () => [item('สมุดหมู่บ้าน', () => q('[data-game="journal"]')?.click()), item('🎯 กิจกรรม', () => q('#activities')?.click(), !!q('#activities')), item('🌾 ไร่ของเรา', openFarm, !!farmHere()), item('🏗 พัฒนาหมู่บ้าน', () => host('VillageProjects')?.open()), item('🏛 ชื่อเสียง', () => host('Factions')?.open()), item('🗺 ออกเดินทาง', () => go?.click(), !!go)]],
      ['sys', '⚙ ระบบ', 'บันทึก · โหลด · ตั้งค่า · เต็มจอ', () => [item('💾 บันทึกเกม', () => slotMenu('save')), item('📂 โหลดเกม', () => slotMenu('load')), item('ตั้งค่า', () => q('[data-game="settings"]')?.click()), item('⛶ เต็มจอ', () => q('#fullscreen')?.click(), !!q('#fullscreen'))]]
    ];
    const d = document.createElement('div'); d.id = 'cuMenu'; let acts = [];
    const draw = g => {
      const grp = GROUPS.find(x => x[0] === g); acts = [];
      const btn = (html, fn, cls = '') => { acts.push(fn); return `<button data-a="${acts.length - 1}" class="${cls}">${html}</button>` };
      d.innerHTML = grp
        ? `<div class="box one"><h2>${grp[1]}</h2>${grp[3]().filter(Boolean).map(it => btn(it.label, () => { d.remove(); it.fn() })).join('')}${btn('← กลับ', () => draw(null), 'cu-back')}<small>ลูกศร/จอย เลือก · Enter ยืนยัน · Esc ปิด</small></div>`
        : `<div class="box one"><h2>เมนู</h2>${GROUPS.map(([id, t, sub]) => btn(`${t}<small>${sub}</small>`, () => draw(id), 'cu-group')).join('')}${btn('▶ กลับไปเล่น', () => d.remove())}<small>ลูกศร/จอย เลือก · Enter ยืนยัน · Esc ปิด</small></div>`;
      d.querySelector('button')?.focus();
    };
    d.onclick = e => { if (e.target === d) { d.remove(); return } const b = e.target.closest('button'); if (b && b.dataset.a != null) acts[+b.dataset.a]?.() };
    document.body.append(d); draw(null);
    d.querySelector('button')?.focus();
    return true;
  }
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (document.getElementById('cuMenu')) { document.getElementById('cuMenu').remove(); e.preventDefault(); return }
    if (window.TownBattle?.active?.() || document.querySelector('dialog[open],.game-dialog,.cs:not([hidden]),#titleScreen,.wm-modal-bg') || document.body.classList.contains('cs-open')) return;
    if (/village-town\.html/.test(location.pathname) && !/[?&](battle|edit)/.test(location.search) && villageMenu()) e.preventDefault();
  });

  /* ---------- v97.13 · save slots ----------
     The game keeps saving itself to its usual keys (the auto save = Continue). A slot is a copy of every progress key at that moment
     (game, world map, village memory, clock); loading copies it back and restarts the page, so every frame reads the same save. */
  const SLOT_KEYS = ['three-card-forge-v4', 'project-a-started-v1', 'agrenor-world-v1', 'agrenor-mind-v1', 'agrenor-clock-v1', 'agrenor-standalone-v1'];
  const slotKey = n => 'projectA.slot.' + n;
  function hostSave() { try { let w = window; for (let i = 0; i < 4; i++) { if (typeof w.save === 'function' && w.s && w.s.village) { w.save(); return } if (w.parent === w) break; w = w.parent } } catch (e) { } }
  function slotInfo(n) { try { return JSON.parse(localStorage.getItem(slotKey(n)) || 'null') } catch (e) { return null } }
  function summary(g) { if (!g) return 'ว่าง'; const v = g.village || {}, h = Math.floor((g.minutes || 480) / 60), m = (g.minutes || 480) % 60; return `${v.heroName || 'นักผจญภัย'} · Lv.${v.character?.level || 1} · วันที่ ${g.day || 1} · ${h}:${String(m).padStart(2, '0')}` }
  function saveSlot(n) { hostSave(); const data = {}; for (const k of SLOT_KEYS) data[k] = localStorage.getItem(k); let g = null; try { g = JSON.parse(data['three-card-forge-v4'] || 'null') } catch (e) { }
    if (!g) return false; localStorage.setItem(slotKey(n), JSON.stringify({ at: Date.now(), text: summary(g), data })); return true }
  /* the copy happens on the next start (js/title-screen.js reads 'projectA.pendingSlot' before the game reads its save): the page being left may still write its own save while it unloads */
  function loadSlot(n) { const o = slotInfo(n); if (!o?.data) return false; try { sessionStorage.setItem('projectA.pendingSlot', String(n)); sessionStorage.removeItem('project-a-newgame') } catch (e) { } try { top.location.reload() } catch (e) { location.reload() } return true }
  function slotMenu(mode) {
    document.getElementById('cuMenu')?.remove();
    const d = document.createElement('div'); d.id = 'cuMenu'; const when = t => t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
    d.innerHTML = `<div class="box one"><h2>${mode === 'save' ? '💾 บันทึกเกม' : '📂 โหลดเกม'}</h2>${[1, 2, 3].map(n => { const o = slotInfo(n); return `<button data-n="${n}" ${mode === 'load' && !o ? 'disabled' : ''}><b>ช่อง ${n}</b> · ${o ? o.text : 'ว่าง'}<br><small>${o ? 'บันทึกเมื่อ ' + when(o.at) : mode === 'save' ? 'บันทึกที่นี่' : ''}</small></button>` }).join('')}<button data-x="1">ปิด</button><small>${mode === 'save' ? 'เกมยังเซฟอัตโนมัติเหมือนเดิม · ช่องเซฟเก็บไว้ย้อนกลับมาเล่นจุดนี้' : 'โหลดแล้วเกมจะเริ่มใหม่จากจุดที่บันทึก · เซฟอัตโนมัติปัจจุบันจะถูกแทนที่'}</small></div>`;
    document.body.append(d);
    d.onclick = e => { const b = e.target.closest('button'); if (e.target === d || b?.dataset.x) { d.remove(); return } if (!b?.dataset.n) return; const n = +b.dataset.n, has = !!slotInfo(n);
      if (mode === 'save') { if (has && !b.dataset.sure) { b.dataset.sure = 1; b.querySelector('small').textContent = 'มีเซฟอยู่แล้ว · กดอีกครั้งเพื่อบันทึกทับ'; return } if (saveSlot(n)) { b.querySelector('small').textContent = '✓ บันทึกแล้ว'; b.firstElementChild.nextSibling.textContent = ' · ' + slotInfo(n).text; SFX.ok(); setTimeout(() => d.remove(), 700) } }
      else { if (!b.dataset.sure) { b.dataset.sure = 1; b.querySelector('small').textContent = 'กดอีกครั้งเพื่อโหลด (เกมจะเริ่มใหม่จากจุดนี้)'; return } loadSlot(n) } };
    d.querySelector('button:not(:disabled)')?.focus();
  }

  /* ---------- gamepad ---------- */
  const PAD = { 0: 'Enter', 1: 'Escape', 2: 'z', 3: 'a', 4: 'q', 5: 'e', 8: 'Tab', 9: 'Escape', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' };
  const held = {}, repeatAt = {};
  function press(key) {
    const t = document.activeElement && document.activeElement !== document.body ? document.activeElement : document;
    const ev = new KeyboardEvent('keydown', { key, code: key.length === 1 ? 'Key' + key.toUpperCase() : key, bubbles: true, cancelable: true });
    t.dispatchEvent(ev); t.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    if (key === 'Enter' && !ev.defaultPrevented && isBtn(document.activeElement)) document.activeElement.click();
  }
  function poll() {
    requestAnimationFrame(poll);
    if (!navigator.getGamepads || !document.hasFocus()) return;
    const pads = [...navigator.getGamepads()].filter(Boolean); if (!pads.length) return;
    const p = pads[0], now = performance.now(), ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const state = {}; for (const i in PAD) state[i] = !!p.buttons[i]?.pressed;
    if (ax < -.55) state[14] = true; if (ax > .55) state[15] = true; if (ay < -.55) state[12] = true; if (ay > .55) state[13] = true;
    for (const i in PAD) { if (state[i] && !held[i]) { held[i] = true; repeatAt[i] = now + 380; press(PAD[i]) } else if (state[i] && i >= 12 && now > repeatAt[i]) { repeatAt[i] = now + 130; press(PAD[i]) } else if (!state[i]) held[i] = false }
  }
  addEventListener('gamepadconnected', () => { try { const d = document.createElement('div'); d.textContent = '🎮 เชื่อมต่อจอยแล้ว · A ยืนยัน · B ยกเลิก · Start เมนู'; d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:90;padding:8px 16px;border-radius:999px;background:#14231ff2;color:#f3e9c9;border:1px solid #b9c48a88;font:600 13px system-ui,"Noto Sans Thai",sans-serif;pointer-events:none'; document.body.append(d); setTimeout(() => d.remove(), 3200) } catch (e) { } });
  requestAnimationFrame(poll);

  window.ConsoleUI = { sfx: SFX, moveFocus, villageMenu, slotMenu, saveSlot, loadSlot, slotInfo };
})();
